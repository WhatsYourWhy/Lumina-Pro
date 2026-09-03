import React, { useState } from 'react';
import { Type } from '@google/genai';
import { ai } from '../lib/api';
import { config } from '../config';
import { renderMarkdown } from '../lib/markdown';
import { BrandProfile, GlobalIntelState, GroundingSource } from '../types';
import { parseCleanJson } from '../lib/json';
import { describeAiError } from '../lib/errors';
import BriefActions from './BriefActions';
import toast from 'react-hot-toast';
import { Search, Globe, Loader2, Lightbulb, TrendingUp } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  intel: GlobalIntelState;
  onUpdate: (patch: Partial<GlobalIntelState>) => void;
}

const MarketInsights: React.FC<Props> = ({ brand, intel, onUpdate }) => {
  const defaultQuery = brand.industry
    ? `What are the latest 2025-2026 operational trends and logistics forecasts for the ${brand.industry} industry?`
    : `What are the latest 2025-2026 global container shipping rate trends and warehousing updates?`;

  const analysis = intel.marketAnalysis;
  const sources = intel.marketSources ?? [];
  const rabbitHoles = intel.marketDrilldowns ?? [];

  const [query, setQuery] = useState(intel.marketQuery || defaultQuery);
  const [loading, setLoading] = useState(false);

  const searchPresets = [
    { label: 'Container Freight Indices', query: 'What are the current global container freight rate index trends (Drewry/FBX) and port congestion forecasts?' },
    { label: 'Warehousing & Real Estate', query: 'What are the current commercial industrial warehousing vacancy rates and average rent trends in North America?' },
    { label: 'Automotive & Chips Resilience', query: 'Analyze the current state of supply chain resilience in the automotive industry, focus on component lead times.' }
  ];

  const analyzeMarket = async () => {
    if (!query.trim()) return;
    setLoading(true);
    onUpdate({ marketQuery: query, marketAnalysis: null, marketSources: [], marketDrilldowns: [] });
    try {
      const response = await ai.models.generateContent({
        model: config.models.defaultFlash,
        contents: query,
        config: { tools: [{ googleSearch: {} }] }
      });

      const text = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources: GroundingSource[] = [];
      chunks.forEach((chunk: any) => { if (chunk.web) extractedSources.push({ web: chunk.web }); });
      onUpdate({ marketQuery: query, marketAnalysis: text, marketSources: extractedSources });

      try {
        const rabbitResponse = await ai.models.generateContent({
          model: config.models.defaultFlash,
          contents: `Based on this text: "${text}", generate 3 highly targeted, strategic follow-up questions for a consulting firm analyzing ${brand.name || 'a client'}. Return a JSON array of strings only.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });
        const parsed = parseCleanJson<string[]>(rabbitResponse.text, []);
        onUpdate({ marketDrilldowns: Array.isArray(parsed) ? parsed.filter(q => typeof q === 'string') : [] });
      } catch (rabbitErr) {
        console.warn("Failed to generate drilldown questions", rabbitErr);
        onUpdate({ marketDrilldowns: [] });
      }
    } catch (error: any) {
      console.error(error);
      toast.error(describeAiError(error));
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    onUpdate({ marketAnalysis: null, marketSources: [], marketDrilldowns: [] });
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
                onKeyDown={(e) => { if (e.key === 'Enter' && !loading) analyzeMarket(); }}
                placeholder="Ask a market research question..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              onClick={analyzeMarket}
              disabled={loading || !query.trim()}
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
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800 flex-wrap gap-3">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lightbulb size={12}/> AI Executive Briefing Synthesis
              </h3>
              {!loading && (
                <BriefActions
                  content={analysis}
                  title="Market Intelligence Brief"
                  brand={brand}
                  meta={intel.marketQuery ? `Research query: ${intel.marketQuery}` : undefined}
                  onClear={clearAnalysis}
                  clearConfirmText="Clear this market brief and its sources?"
                />
              )}
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
                  {intel.marketQuery && <p className="text-[10px] text-slate-500 italic mb-4">Query: {intel.marketQuery}</p>}
                  {renderMarkdown(analysis, true)}
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
            {sources.length > 0 && <span className="text-[9px] font-bold text-slate-600">{sources.length}</span>}
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
