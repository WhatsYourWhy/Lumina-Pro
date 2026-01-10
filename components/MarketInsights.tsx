
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrandProfile, GroundingSource } from '../types';
import { Search, Globe, ExternalLink, Loader2, ArrowUpRight, HelpCircle, Lightbulb } from 'lucide-react';

interface Props {
  brand: BrandProfile;
}

const MarketInsights: React.FC<Props> = ({ brand }) => {
  const [query, setQuery] = useState(`What are the latest 2024-2025 trends for the ${brand.industry} industry for small businesses?`);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [rabbitHoles, setRabbitHoles] = useState<string[]>([]);

  const analyzeMarket = async () => {
    setLoading(true);
    setAnalysis(null);
    setSources([]);
    setRabbitHoles([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

      // Generate "Rabbit Holes" - suggested follow-up questions for a consultant
      const rabbitResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this research synthesis: "${response.text}", what are 3 non-obvious, critical follow-up questions a management consultant should investigate for ${brand.name}? Return as a JSON array of strings.`,
        config: { responseMimeType: "application/json" }
      });
      const holes = JSON.parse(rabbitResponse.text);
      setRabbitHoles(Array.isArray(holes) ? holes : []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      {/* Search Header */}
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end bg-gradient-to-r from-slate-900/50 to-indigo-950/10">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1 tracking-widest">Market Research Vector</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
        </div>
        <button onClick={analyzeMarket} disabled={loading} className="px-8 py-4 bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
          {loading ? <Loader2 className="animate-spin" /> : <Globe size={18} />}
          Research Live
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Main Synthesis (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 glass rounded-3xl p-8 overflow-y-auto border-slate-800 relative bg-slate-950/40">
            <div className="flex items-center gap-2 mb-6 text-indigo-400">
              <Lightbulb size={20} />
              <h2 className="text-lg font-bold tracking-tight">AI Executive Synthesis</h2>
            </div>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 h-[400px]">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm font-bold animate-pulse uppercase tracking-widest">Scouring Global News Nodes...</p>
              </div>
            ) : analysis ? (
              <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm selection:bg-indigo-500/30">{analysis}</div>
            ) : (
               <div className="h-full flex items-center justify-center opacity-20 text-center py-20">
                 <div className="space-y-4">
                   <Search size={48} className="mx-auto" />
                   <p className="text-sm font-bold uppercase tracking-[0.2em]">Operational Pulse Idle</p>
                 </div>
               </div>
            )}
          </div>

          {/* Rabbit Holes (Follow-up suggestions) */}
          {rabbitHoles.length > 0 && !loading && (
            <div className="glass p-6 rounded-2xl border-slate-800 bg-amber-500/5">
              <div className="flex items-center gap-2 text-amber-500 mb-4">
                <HelpCircle size={18} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Consultant Rabbit Holes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {rabbitHoles.map((hole, i) => (
                  <button key={i} onClick={() => setQuery(hole)} className="p-3 text-left bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 rounded-xl transition-all group">
                    <p className="text-[11px] text-slate-400 leading-snug group-hover:text-amber-100 italic">"{hole}"</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sources (4 cols) */}
        <div className="lg:col-span-4 flex flex-col overflow-hidden">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 mb-4">Verifiable Intelligence</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {sources.length > 0 ? sources.map((source, i) => (
              <a key={i} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="block glass p-4 rounded-xl border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-500/5 group transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[8px] font-black text-slate-600 uppercase">INTEL NODE {i+1}</span>
                  <ArrowUpRight size={12} className="text-slate-600 group-hover:text-indigo-400" />
                </div>
                <h4 className="text-xs font-bold line-clamp-2 text-slate-300 group-hover:text-white leading-tight">{source.web?.title}</h4>
                <div className="mt-2 flex items-center gap-1 text-[9px] text-slate-600 truncate">
                  <ExternalLink size={10} />
                  {source.web?.uri ? new URL(source.web.uri).hostname : 'External Link'}
                </div>
              </a>
            )) : (
              <div className="glass p-10 rounded-2xl border-dashed border-slate-800 text-center opacity-10">
                <p className="text-xs">No active nodes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
