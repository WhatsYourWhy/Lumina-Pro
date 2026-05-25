import React, { useState } from 'react';
import { ai } from '../lib/api';
import { BrandProfile } from '../types';
import toast from 'react-hot-toast';
import { Linkedin, Send, Copy, Loader2, Award } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  savedPosts: string[];
  setSavedPosts: (posts: string[]) => void;
}

const ContentStudio: React.FC<Props> = ({ brand, savedPosts, setSavedPosts }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'analytical' | 'leadership' | 'crisis' | 'visionary'>('leadership');

  const tones = [
    { value: 'leadership', label: 'Thought Leadership', description: 'Insightful, industry-pioneering, high-level' },
    { value: 'analytical', label: 'Technical & Operational', description: 'Data-driven, process-focused, structured' },
    { value: 'crisis', label: 'Risk & Mitigation', description: 'Reassuring, tactical, contingency-minded' },
    { value: 'visionary', label: 'Growth & Strategy', description: 'Inspiring, forward-looking, entrepreneurial' }
  ];

  const generatePosts = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const tonePrompt = 
        selectedTone === 'analytical' ? 'Write in a highly analytical, data-driven, technical, process-oriented tone focusing on logistics metrics.' :
        selectedTone === 'crisis' ? 'Write in a tactical, crisis-mitigation, contingency-planning tone focusing on resilience and continuity.' :
        selectedTone === 'visionary' ? 'Write in an inspiring, strategic, growth-focused, and visionary entrepreneurial tone.' :
        'Write in a standard authoritative thought-leadership business consulting tone.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Create 3 engaging professional LinkedIn posts for the company "${brand.name || 'Shank Strategy'}" in the "${brand.industry || 'Management Consulting'}" sector. 
        Topic: "${topic}". 
        
        Guidelines:
        - Brand Tone: "${brand.tone || 'Professional'}"
        - Section Tone: ${tonePrompt}
        - Keep posts clean and well-spaced. Ensure they are directly usable for professional networking.`,
      });
      
      const content = response.text || '';
      const splitPosts = content.split(/Post \d+:?/i).filter(p => p.trim().length > 10);
      setSavedPosts([...splitPosts, ...savedPosts].slice(0, 9));
      toast.success('Generated drafts successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to generate content. ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 h-full pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-3xl space-y-4 border-slate-800/50 shadow-xl relative">
          <div className="space-y-1">
            <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider">Content Studio</h2>
            <p className="text-[10px] text-slate-500 font-medium">Input a topic to generate structured corporate social media posts tailored to your consulting practice.</p>
          </div>
          <div className="relative">
            <input 
              placeholder="E.g., Supply Chain Bullwhip Mitigations, Six Sigma DMAIC Best Practices..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-5 py-4 pr-32 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 transition-colors"
            />
            <button 
              onClick={generatePosts} 
              disabled={loading || !topic}
              className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-black text-xs flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16} />} 
              Draft
            </button>
          </div>
        </div>

        <div className="glass p-5 rounded-3xl border-slate-800/50 space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Award size={12}/> Select Post Tone
          </h3>
          <div className="flex flex-col gap-2">
            {tones.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedTone(t.value as any)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all text-[10px] font-medium ${selectedTone === t.value ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
              >
                <div className="font-bold">{t.label}</div>
                <div className="text-[8px] opacity-60 font-medium">{t.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {savedPosts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {savedPosts.map((post, idx) => (
              <div key={idx} className="glass rounded-3xl p-6 border-slate-800/50 space-y-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shadow-sm">
                        <Linkedin size={12} fill="white" className="text-white"/>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">LinkedIn Draft {idx + 1}</span>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(post);
                        toast.success('Copied to clipboard');
                      }} 
                      className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Copy to Clipboard"
                    >
                      <Copy size={14}/>
                    </button>
                  </div>
                  <p className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed font-medium">{post}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center opacity-20 text-center py-20 grayscale">
            <Linkedin size={48} className="mb-2 text-slate-500" />
            <p className="text-xs font-bold uppercase tracking-wider">Creative Studio Empty</p>
            <p className="text-[10px]">Provide a topic and hit draft to generate post copy.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentStudio;
