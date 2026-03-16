
import React, { useState } from 'react';
import { ai } from '../lib/api';
import { BrandProfile, GroundingSource } from '../types';
import toast from 'react-hot-toast';
import { Search, Globe, ExternalLink, Loader2, ArrowUpRight, HelpCircle, Lightbulb } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  analysis: string | null;
  setAnalysis: (a: string | null) => void;
}

const MarketInsights: React.FC<Props> = ({ brand, analysis, setAnalysis }) => {
  const [query, setQuery] = useState(`What are the latest 2024-2025 trends for the ${brand.industry} industry?`);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [rabbitHoles, setRabbitHoles] = useState<string[]>([]);

  const analyzeMarket = async () => {
    setLoading(true);
    setAnalysis(null);
    try {

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: { tools: [{ googleSearch: {} }] }
      });

      setAnalysis(response.text);
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources: GroundingSource[] = [];
      chunks.forEach((chunk: any) => { if (chunk.web) extractedSources.push({ web: chunk.web }); });
      setSources(extractedSources);

      const rabbitResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this: "${response.text}", what are 3 follow-up questions for ${brand.name}? Return JSON array of strings.`,
        config: { responseMimeType: "application/json" }
      });
      setRabbitHoles(JSON.parse(rabbitResponse.text));
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to analyze market. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Research Vector</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-sm" />
          </div>
        </div>
        <button onClick={analyzeMarket} disabled={loading} className="px-8 py-4 bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Globe size={18} />} Research Live
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 glass rounded-3xl p-8 overflow-y-auto border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-indigo-400"><Lightbulb size={20}/> AI Executive Synthesis</h2>
            {loading ? <div className="animate-pulse">Analyzing...</div> : analysis || <div className="h-full flex items-center justify-center opacity-20">No active nodes.</div>}
          </div>
          {rabbitHoles.length > 0 && !loading && (
            <div className="glass p-6 rounded-2xl border-slate-800 flex gap-3 overflow-x-auto">
              {rabbitHoles.map((hole, i) => (
                <button key={i} onClick={() => setQuery(hole)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 whitespace-nowrap hover:border-indigo-500 transition-all">"{hole}"</button>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-4 overflow-y-auto space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-4">Intelligence Sources</h3>
          {sources.map((source, i) => (
            <a key={i} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="block glass p-4 rounded-xl border-slate-800 hover:border-indigo-500/40">
              <h4 className="text-xs font-bold text-slate-300">{source.web?.title}</h4>
              <span className="text-[9px] text-slate-600 truncate">{source.web?.uri}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
