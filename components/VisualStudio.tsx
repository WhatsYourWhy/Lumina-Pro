
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
    // Check key selection for Veo
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
    <div className="max-w-5xl mx-auto flex flex-col gap-8 h-full">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-80 space-y-6">
          <div className="glass p-2 rounded-2xl flex gap-1">
            <button 
              onClick={() => setMode('image')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${mode === 'image' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ImageIcon size={18} /> Images
            </button>
            <button 
              onClick={() => setMode('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${mode === 'video' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Video size={18} /> Videos
            </button>
          </div>

          <div className="glass p-6 rounded-3xl space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Visual Concept</label>
              <textarea 
                placeholder={mode === 'image' ? "A product shoot on a marble table..." : "A cinematic drone shot of a modern office..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-40"
              />
            </div>

            <button 
              onClick={mode === 'image' ? generateImage : generateVideo}
              disabled={loading || !prompt}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="animate-spin" /> {mode === 'image' ? 'Imagining...' : 'Rendering...'}</>
              ) : (
                <><Wand2 size={18} /> Generate {mode === 'image' ? 'Image' : 'Video'}</>
              )}
            </button>

            {mode === 'video' && (
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200/70">
                <AlertCircle size={24} className="shrink-0 text-amber-500" />
                <p>Video generation takes ~2-3 minutes. Make sure you have a paid API key selected for Veo models.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[400px]">
          <div className="w-full h-full glass rounded-3xl border-slate-800 relative overflow-hidden flex items-center justify-center group">
            {loading ? (
              <div className="flex flex-col items-center gap-6 text-center px-10">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Lumina is processing...</h3>
                  <p className="text-slate-500 max-w-xs">{mode === 'image' ? 'Applying brand aesthetics and high-resolution textures.' : 'Simulating cinematic lighting and physics for your video.'}</p>
                </div>
              </div>
            ) : resultImage || resultVideo ? (
              <div className="w-full h-full relative">
                {resultImage && <img src={resultImage} alt="Generated Asset" className="w-full h-full object-cover" />}
                {resultVideo && <video src={resultVideo} controls autoPlay className="w-full h-full object-cover" />}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <a 
                    href={resultImage || resultVideo || '#'} 
                    download={`lumina-${mode}-asset`}
                    className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full text-white"
                   >
                     <Download size={20} />
                   </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 opacity-30 px-10">
                <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                   {mode === 'image' ? <ImageIcon size={48} /> : <Video size={48} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest">Asset Preview</h3>
                  <p className="text-sm">Your masterpiece will appear here.</p>
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
