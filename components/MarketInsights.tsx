import React, { useState } from 'react';
import { ai } from '../lib/api';
import { BrandProfile, GroundingSource } from '../types';
import toast from 'react-hot-toast';
import { Search, Globe, Loader2, Lightbulb, TrendingUp } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  analysis: string | null;
  setAnalysis: (a: string | null) => void;
}

const parseBold = (text: string): React.ReactNode[] => {
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-indigo-300">{part}</strong>;
    }
    return part;
  });
};

const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  return (
    <div className="space-y-4 text-slate-300">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return <h4 key={index} className="text-sm font-bold text-indigo-400 mt-5 mb-2">{parseBold(trimmed.replace('### ', ''))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={index} className="text-base font-black text-white mt-7 mb-2.5 border-b border-slate-800 pb-1">{parseBold(trimmed.replace('## ', ''))}</h3>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={index} className="list-disc ml-5 mb-1.5 text-slate-300 leading-relaxed text-xs">
              {parseBold(trimmed.substring(2))}
            </li>
          );
        }
        if (trimmed === '---') {
          return <hr key={index} className="my-5 border-slate-800" />;
        }
        if (trimmed === '') {
          return <div key={index} className="h-0.5" />;
        }
        return <p key={index} className="leading-relaxed mb-2 text-xs text-slate-300">{parseBold(line)}</p>;
      })}
    </div>
  );
};

const MarketInsights: React.FC<Props> = ({ brand, analysis, setAnalysis }) => {
  const defaultQuery = brand.industry 
    ? `What are the latest 2025-2026 operational trends and logistics forecasts for the ${brand.industry} industry?`
    : `What are the latest 2025-2026 global container shipping rate trends and warehousing updates?`;

  const [query, setQuery] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [rabbitHoles, setRabbitHoles] = useState<string[]>([]);

  const searchPresets = [
    { label: 'Container Freight Indices', query: 'What are the current global container freight rate index trends (Drewry/FBX) and port congestion forecasts?' },
    { label: 'Warehousing & Real Estate', query: 'What are the current commercial industrial warehousing vacancy rates and average rent trends in North America?' },
    { label: 'Automotive & Chips Resilience', query: 'Analyze the current state of supply chain resilience in the automotive industry, focus on component lead times.' }
  ];

  const analyzeMarket = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: { tools: [{ googleSearch: {} }] }
      });

      setAnalysis(response.text || '');
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources: GroundingSource[] = [];
      chunks.forEach((chunk: any) => { if (chunk.web) extractedSources.push({ web: chunk.web }); });
      setSources(extractedSources);

      const rabbitResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on this text: "${response.text}", generate 3 highly targeted, strategic follow-up questions for a consulting firm analyzing ${brand.name || 'a client'}. Return a JSON array of strings only.`,
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
    <div className="space-y-6 h-full flex flex-col pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-3xl space-y-4 border-slate-800/50 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider">Market Intelligence Hub</h2>
            <p className="text-[10px] text-slate-500 font-medium">Query live-grounded market indexes, industry data, and trends for research briefing generation.</p>
          </div>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors" 
              />
            </div>
            <button 
              onClick={analyzeMarket} 
              disabled={loading} 
              className="px-6 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : <Globe size={16} />} 
              Research Live
            </button>
          </div>
        </div>

        <div className="glass p-5 rounded-3xl border-slate-800/50 space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp size={12}/> Market Vectors
          </h3>
          <div className="flex flex-col gap-2">
            {searchPresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => setQuery(preset.query)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[10px] text-slate-400 hover:border-indigo-500/40 hover:text-slate-200 transition-all font-medium truncate"
                title={preset.query}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-[400px]">
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 glass rounded-3xl p-6 border-slate-800/50 shadow-xl overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lightbulb size={12}/> AI Executive Briefing Synthesis
              </h3>
            </div>
            
            <div className="flex-1 text-slate-300">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Accessing live indices...</p>
                </div>
              ) : analysis ? (
                <div className="animate-in fade-in duration-500">
                  {renderMarkdown(analysis)}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20 grayscale">
                  <Lightbulb size={48} className="mb-2 text-slate-500" />
                  <p className="text-xs font-bold uppercase tracking-wider">No Active Synthesis</p>
                  <p className="text-[10px]">Select a vector or customize the query, then search live to query indices.</p>
                </div>
              )}
            </div>
          </div>

          {rabbitHoles.length > 0 && !loading && (
            <div className="glass p-5 rounded-2xl border-slate-800/50 flex flex-col gap-2 shadow-lg">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recommended Drilldowns</span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {rabbitHoles.map((hole, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setQuery(hole); }} 
                    className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-400 whitespace-nowrap hover:border-indigo-500/40 hover:text-slate-200 transition-all font-medium"
                  >
                    "{hole}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col glass rounded-3xl p-6 border-slate-800/50 shadow-xl overflow-y-auto">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grounded Web Sources</h3>
          </div>
          <div className="space-y-3 flex-1">
            {sources.length > 0 ? (
              sources.map((source, i) => (
                <a 
                  key={i} 
                  href={source.web?.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-indigo-500/30 transition-all space-y-1 hover:bg-slate-900"
                >
                  <h4 className="text-[11px] font-bold text-slate-200 line-clamp-2 leading-tight">{source.web?.title}</h4>
                  <span className="text-[8px] text-indigo-400 truncate block">{source.web?.uri}</span>
                </a>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20 grayscale">
                <Globe size={32} className="mb-2 text-slate-500" />
                <p className="text-[9px] font-black uppercase">No source URLs linked</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
