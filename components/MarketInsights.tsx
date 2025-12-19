
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrandProfile, GroundingSource } from '../types';
import { Search, Globe, ExternalLink, Loader2, ArrowUpRight } from 'lucide-react';

interface Props {
  brand: BrandProfile;
}

const MarketInsights: React.FC<Props> = ({ brand }) => {
  const [query, setQuery] = useState(`What are the latest 2024-2025 trends for the ${brand.industry} industry for small businesses?`);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);

  const analyzeMarket = async () => {
    setLoading(true);
    setAnalysis(null);
    setSources([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setAnalysis(response.text);
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources = chunks.filter((c: any) => c.web).map((c: any) => c.web);
      setSources(extractedSources);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">Market Search Query</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <button 
          onClick={analyzeMarket}
          disabled={loading}
          className="px-8 py-4 bg-white text-slate-950 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all disabled:bg-slate-800 disabled:text-slate-600"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Globe size={18} />}
          Research Live
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0 overflow-hidden">
        <div className="lg:col-span-3 glass rounded-3xl p-8 overflow-y-auto border-slate-800 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <Globe size={20} />
            <h2 className="text-lg font-bold">AI Market Synthesis</h2>
          </div>
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-5/6"></div>
              <div className="h-4 bg-slate-800 rounded w-4/6"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <p className="text-slate-500 text-sm mt-4">Scouring the web for real-time intelligence...</p>
            </div>
          ) : analysis ? (
            <div className="prose prose-invert prose-indigo max-w-none whitespace-pre-wrap leading-relaxed text-slate-300">
              {analysis}
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center opacity-20">
               <div className="text-center">
                 <Search size={64} className="mx-auto mb-4" />
                 <p className="text-xl font-bold">Ready to analyze</p>
               </div>
             </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6 flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Verifiable Sources</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {sources.length > 0 ? sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block glass p-4 rounded-2xl border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 group transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Resource {i+1}</span>
                  <ArrowUpRight size={14} className="text-slate-600 group-hover:text-indigo-400" />
                </div>
                <h4 className="text-xs font-semibold line-clamp-2 text-slate-300 group-hover:text-white">{source.title}</h4>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500 truncate">
                  <ExternalLink size={10} />
                  {new URL(source.uri).hostname}
                </div>
              </a>
            )) : (
              <div className="glass p-8 rounded-2xl border-dashed border-slate-800 text-center opacity-30">
                <p className="text-xs">No sources found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
