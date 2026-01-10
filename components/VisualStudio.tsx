
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrandProfile } from '../types';
import { ImageIcon, Video, Wand2, Download, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  brand: BrandProfile;
}

const VisualStudio: React.FC<Props> = ({ brand }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [mode, setMode] = useState<'image' | 'video'>('image');

  const generateImage = async () => {
    setLoading(true);
    setResultImage(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullPrompt = `High quality professional photography for brand: ${brand.name}. ${prompt}. Aesthetic: Clean, premium, commercial. Industry: ${brand.industry}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: fullPrompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!(window as any).aistudio?.hasSelectedApiKey()) {
      await (window as any).aistudio?.openSelectKey();
    }
    
    setLoading(true);
    setResultVideo(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullPrompt = `Cinematic brand commercial for ${brand.name}. ${prompt}. 4k, professional lighting.`;
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: fullPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await videoResponse.blob();
        setResultVideo(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 h-full pb-10">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="w-full lg:w-80 space-y-4 lg:space-y-6 shrink-0">
          <div className="glass p-1.5 rounded-2xl flex gap-1">
            <button 
              onClick={() => setMode('image')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all text-xs lg:text-sm ${mode === 'image' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ImageIcon size={16} /> Images
            </button>
            <button 
              onClick={() => setMode('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all text-xs lg:text-sm ${mode === 'video' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Video size={16} /> Videos
            </button>
          </div>

          <div className="glass p-5 lg:p-6 rounded-2xl lg:rounded-3xl space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-widest">Visual Concept</label>
              <textarea 
                placeholder={mode === 'image' ? "A product shoot on a marble table..." : "Cinematic shot of modern office..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32 lg:h-40"
              />
            </div>

            <button 
              onClick={mode === 'image' ? generateImage : generateVideo}
              disabled={loading || !prompt}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <><Loader2 className="animate-spin size={16}" /> {mode === 'image' ? 'Creating...' : 'Rendering...'}</>
              ) : (
                <><Wand2 size={16} /> Generate {mode === 'image' ? 'Image' : 'Video'}</>
              )}
            </button>

            {mode === 'video' && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[10px] text-amber-200/70">
                <AlertCircle size={16} className="shrink-0 text-amber-500" />
                <p>Veo generation takes ~2-3 mins.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[300px] lg:min-h-[400px]">
          <div className="w-full h-full glass rounded-2xl lg:rounded-3xl border-slate-800 relative overflow-hidden flex items-center justify-center group">
            {loading ? (
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Lumina is processing...</h3>
                  <p className="text-slate-500 text-[10px] max-w-[200px] mx-auto">{mode === 'image' ? 'Applying brand aesthetics.' : 'Simulating lighting and physics.'}</p>
                </div>
              </div>
            ) : resultImage || resultVideo ? (
              <div className="w-full h-full relative">
                {resultImage && <img src={resultImage} alt="Asset" className="w-full h-full object-contain bg-black/20" />}
                {resultVideo && <video src={resultVideo} controls autoPlay className="w-full h-full object-contain bg-black/20" />}
                <div className="absolute top-3 right-3 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                   <a 
                    href={resultImage || resultVideo || '#'} 
                    download={`lumina-${mode}-asset`}
                    className="p-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full text-white"
                   >
                     <Download size={18} />
                   </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 opacity-30 px-6 py-12">
                <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                   {mode === 'image' ? <ImageIcon size={32} /> : <Video size={32} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">Asset Preview</h3>
                  <p className="text-xs">Select generate to see results.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualStudio;
