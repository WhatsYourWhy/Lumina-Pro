
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { BrandProfile } from '../types';
import { Mic, MicOff, Play, Square, Volume2, User, Bot, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  context: string; // Combined strategy history
}

const PitchCoach: React.FC<Props> = ({ brand, context }) => {
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [transcription, setTranscription] = useState<{ role: 'user' | 'coach', text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

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
    if (isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setIsStarting(false);
            const source = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isLive) return;
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
                try {
                  session.sendRealtimeInput({ media: pcmBlob });
                } catch (sendErr) {
                  console.warn("Realtime send failed", sendErr);
                }
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
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

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user') {
                  return [...prev.slice(0, -1), { role: 'user', text: last.text + text }];
                }
                return [...prev, { role: 'user', text: text }];
              });
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'coach') {
                  return [...prev.slice(0, -1), { role: 'coach', text: last.text + text }];
                }
                return [...prev, { role: 'coach', text: text }];
              });
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current) {
                try { source.stop(); } catch {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            setError("Internal connection error. Refreshing session...");
            stopLiveSession();
          },
          onclose: () => {
            setIsLive(false);
            setIsStarting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are an elite Pitch Coach for the brand "${brand.name}". 
          
          STRATEGIC CONTEXT (Crucial):
          ${context || "No frameworks generated yet. Focus on general brand mission: " + brand.description}
          
          Your goal: The user is pitching their company. Use the strategic frameworks provided above (SWOT, LENS, etc.) to challenge them. 
          If a SWOT analysis noted a "Weakness" in logistics, bring that up! 
          Be professional, encouraging, but push them to handle executive-level scrutiny.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsStarting(false);
      setError("Failed to initialize coaching session. Please verify microphone access.");
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsLive(false);
    setIsStarting(false);
  };

  useEffect(() => {
    return () => stopLiveSession();
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:gap-8 h-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Pitch Coaching Studio</h2>
          <p className="text-slate-500 text-xs lg:text-sm">Contextual training powered by your active strategy history.</p>
        </div>
        <button 
          onClick={isLive ? stopLiveSession : startLiveSession}
          disabled={isStarting}
          className={`
            w-full sm:w-auto px-6 py-3 lg:px-8 lg:py-4 rounded-xl lg:rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 text-sm lg:text-base
            ${isLive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}
            ${isStarting ? 'opacity-70 cursor-wait' : ''}
          `}
        >
          {isStarting ? <Loader2 className="animate-spin" size={18} /> : isLive ? <><Square size={18} fill="currentColor" /> Stop Session</> : <><Play size={18} fill="currentColor" /> Start Practice</>}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3 text-xs animate-in shake">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-0">
        <div className="glass rounded-2xl lg:rounded-3xl p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
          <div className={`
            absolute inset-0 bg-indigo-500/5 transition-opacity duration-500
            ${isLive ? 'opacity-100' : 'opacity-0'}
          `} />
          
          <div className="relative z-10 space-y-6 lg:space-y-8 text-center">
            <div className={`
              w-32 h-32 lg:w-40 lg:h-40 mx-auto rounded-full flex items-center justify-center transition-all duration-700 border-2
              ${isLive ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_100px_rgba(99,102,241,0.4)] scale-110' : 'bg-slate-800 border-slate-700'}
            `}>
              {isLive ? <Mic size={48} className="text-white animate-pulse" /> : <MicOff size={48} className="text-slate-600" />}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg lg:text-xl font-bold tracking-tight">{isLive ? "Coach is Listening" : "Mentor Standby"}</h3>
              <p className="text-slate-500 text-[11px] lg:text-xs max-w-[280px] mx-auto leading-relaxed font-medium uppercase tracking-wider">
                {isLive ? "Speak naturally. Pitch your business model and address the strategic points analyzed in the board." : "Start a session to practice based on your latest SWOT/LENS analysis."}
              </p>
            </div>

            {isLive && (
              <div className="flex items-center justify-center gap-3 py-2 px-4 bg-white/5 rounded-full border border-white/10 w-fit mx-auto">
                <div className="flex gap-1 h-3 items-center">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 bg-indigo-500 rounded-full animate-bounce" style={{ height: `${Math.random()*12+4}px`, animationDelay: `${i*0.1}s` }} />
                  ))}
                </div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Sync</span>
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl lg:rounded-3xl p-5 lg:p-6 flex flex-col border-slate-800/50 min-h-[400px] overflow-hidden shadow-2xl">
           <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
             <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
               <Volume2 size={14} />
               Session Log
             </div>
             {context && <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">Strategy Synchronized</div>}
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
             {transcription.length > 0 ? (
               transcription.map((entry, i) => (
                 <div key={i} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 ${entry.role === 'coach' ? 'flex-row-reverse text-right' : ''}`}>
                   <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-sm ${entry.role === 'coach' ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-700 text-slate-300'}`}>
                     {entry.role === 'coach' ? <Bot size={16} /> : <User size={16} />}
                   </div>
                   <div className={`px-4 py-3 rounded-2xl text-[13px] max-w-[85%] leading-relaxed shadow-sm ${entry.role === 'coach' ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20' : 'bg-slate-800/80 text-slate-300 border border-slate-700'}`}>
                     {entry.text}
                   </div>
                 </div>
               ))
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-6 py-10 grayscale">
                 <Bot size={48} />
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Voice Processing Idle</p>
                    <p className="text-[9px]">Awaiting microphone input stream</p>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PitchCoach;
