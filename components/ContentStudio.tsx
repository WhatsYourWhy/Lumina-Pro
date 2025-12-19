
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrandProfile } from '../types';
import { Linkedin, Send, Copy, RefreshCw, Loader2, Share2 } from 'lucide-react';

interface Props {
  brand: BrandProfile;
}

const ContentStudio: React.FC<Props> = ({ brand }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<string[]>([]);

  const generatePosts = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create 3 highly engaging LinkedIn posts for a business with this profile:
        Brand: ${brand.name}
        Industry: ${brand.industry}
        Voice: ${brand.tone}
        
        Focus the posts on this specific topic: "${topic}"
        Include:
        - A compelling hook
        - Value-driven body content
        - Relevant hashtags
        - A call to action (CTA)
        
        Format the output clearly as separate posts.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      
      const content = response.text || '';
      // Simple splitting logic for demo
      const splitPosts = content.split(/Post \d+:?/i).filter(p => p.trim().length > 10);
      setPosts(splitPosts.length > 0 ? splitPosts : [content]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 h-full">
      <div className="glass p-6 rounded-2xl flex items-center gap-4">
        <div className="flex-1 relative">
          <input 
            placeholder="What's your post about? (e.g. New product launch, industry trend...)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-6 py-4 pr-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-lg"
          />
          <button 
            onClick={generatePosts}
            disabled={loading || !topic}
            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-bold flex items-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="animate-spin size={18}" /> : <Send size={18} />}
            Draft
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {posts.length > 0 ? (
          posts.map((post, idx) => (
            <div key={idx} className="glass rounded-2xl border-slate-800 flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
                    <Linkedin size={16} fill="white" />
                  </div>
                  <span className="text-xs font-bold uppercase text-slate-500">Option {idx + 1}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(post)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                    <Copy size={16} />
                  </button>
                  <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{post}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-3 flex flex-col items-center justify-center text-center p-20 glass rounded-3xl opacity-50 border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <RefreshCw size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Ready to write? Enter a topic above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentStudio;
