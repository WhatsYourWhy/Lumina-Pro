
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { BrandProfile } from '../types';
import { Mic, MicOff, Play, Square, Volume2, User, Bot, AlertCircle } from 'lucide-react';

interface Props {
  brand: BrandProfile;
}

const PitchCoach: React.FC<Props> = ({ brand }) => {
  const [isLive, setIsLive] = useState(false);
  const [transcription, setTranscription] = useState<{ role: 'user' | 'coach', text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // PCM Encoder
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // PCM Decoder
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startLiveSession = async () => {
    try {
      setError(null);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            const source = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output Handling
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Transcription Handling
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => [...prev.slice(0, -1), { role: 'user', text: (prev[prev.length-1]?.role === 'user' ? prev[prev.length-1].text : '') + text }]);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev.slice(0, -1), { role: 'coach', text: (prev[prev.length-1]?.role === 'coach' ? prev[prev.length-1].text : '') + text }]);
            }
            if (message.serverContent?.turnComplete) {
              setTranscription(prev => [...prev, { role: 'user', text: '' }]); // Placeholder for next turn
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            setError("Session error. Please try again.");
            stopLiveSession();
          },
          onclose: () => {
            setIsLive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are an expert pitch coach for ${brand.name}. 
          The user is practicing their business pitch for their ${brand.industry} company. 
          Be encouraging, provide constructive criticism, and ask tough questions an investor might ask.
          Company Mission: ${brand.description}.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setError("Could not start session. Check your microphone permissions.");
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsLive(false);
  };

  useEffect(() => {
    return () => stopLiveSession();
  }, []);

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pitch Coaching Studio</h2>
          <p className="text-slate-500 text-sm">Real-time conversational practice with your AI mentor.</p>
        </div>
        <button 
          onClick={isLive ? stopLiveSession : startLiveSession}
          className={`
            px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95
            ${isLive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}
          `}
        >
          {isLive ? <><Square size={20} fill="currentColor" /> Stop Session</> : <><Play size={20} fill="currentColor" /> Start Practice</>}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3 text-sm animate-in shake">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
        <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className={`
            absolute inset-0 bg-indigo-500/5 transition-opacity duration-500
            ${isLive ? 'opacity-100' : 'opacity-0'}
          `} />
          
          <div className="relative z-10 space-y-8 text-center">
            <div className={`
              w-40 h-40 mx-auto rounded-full flex items-center justify-center transition-all duration-700
              ${isLive ? 'bg-indigo-500 shadow-[0_0_80px_rgba(99,102,241,0.4)] scale-110' : 'bg-slate-800'}
            `}>
              {isLive ? <Mic size={64} className="text-white animate-pulse" /> : <MicOff size={64} className="text-slate-600" />}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{isLive ? "Lumina Coach is Listening..." : "Coach Offline"}</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                {isLive ? "Speak naturally. Your coach will respond instantly to your pitch." : "Ready to perfect your pitch? Hit Start Practice to begin the conversation."}
              </p>
            </div>

            {isLive && (
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 bg-indigo-500 rounded-full animate-bounce" style={{ height: `${Math.random()*20+10}px`, animationDelay: `${i*0.1}s` }} />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Voice Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 flex flex-col border-slate-800">
           <div className="flex items-center gap-2 mb-4 text-slate-500 text-xs font-bold uppercase tracking-widest px-2">
             <Volume2 size={14} />
             Live Transcript
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
             {transcription.filter(t => t.text).length > 0 ? (
               transcription.filter(t => t.text).map((entry, i) => (
                 <div key={i} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${entry.role === 'coach' ? 'flex-row-reverse' : ''}`}>
                   <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${entry.role === 'coach' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                     {entry.role === 'coach' ? <Bot size={18} /> : <User size={18} />}
                   </div>
                   <div className={`px-4 py-3 rounded-2xl text-sm max-w-[80%] ${entry.role === 'coach' ? 'bg-indigo-500/10 text-indigo-100' : 'bg-slate-800 text-slate-300'}`}>
                     {entry.text}
                   </div>
                 </div>
               ))
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-2">
                 <Bot size={32} className="mb-2" />
                 <p className="text-xs italic">Awaiting dialogue...</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PitchCoach;
