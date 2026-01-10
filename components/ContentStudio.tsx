
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrandProfile } from '../types';
import { Linkedin, Send, Copy, Loader2, Share2 } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  savedPosts: string[];
  setSavedPosts: (posts: string[]) => void;
}

const ContentStudio: React.FC<Props> = ({ brand, savedPosts, setSavedPosts }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePosts = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create 3 engaging LinkedIn posts for ${brand.name} in ${brand.industry} about "${topic}".`,
      });
      
      const content = response.text || '';
      const splitPosts = content.split(/Post \d+:?/i).filter(p => p.trim().length > 10);
      setSavedPosts([...splitPosts, ...savedPosts].slice(0, 9));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="glass p-6 rounded-2xl relative">
        <input 
          placeholder="Topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-6 py-4 pr-32"
        />
        <button onClick={generatePosts} className="absolute right-4 top-4 bottom-4 px-6 bg-indigo-500 text-white rounded-lg font-bold">
          {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />} Draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto pr-2">
        {savedPosts.map((post, idx) => (
          <div key={idx} className="glass rounded-2xl p-6 border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center"><Linkedin size={12} fill="white"/></div><span className="text-[10px] font-bold text-slate-500 uppercase">Draft {idx + 1}</span></div>
              <button onClick={() => navigator.clipboard.writeText(post)} className="text-slate-500 hover:text-white"><Copy size={16}/></button>
            </div>
            <p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{post}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentStudio;
