
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrandProfile } from '../types';
import { Zap, Target, MessageSquare, Compass, Loader2, Globe, CheckCircle2, BarChart3, ShieldAlert } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  setBrand: (b: BrandProfile) => void;
}

const StrategyBoard: React.FC<Props> = ({ brand, setBrand }) => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  const discoverBrand = async () => {
    if (!brand.name) {
      alert("Please enter your company name.");
      return;
    }
    setSyncing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find business data for "${brand.name}". Focus on industry, consulting niche, and supply chain operations.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      const parseResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Extract from: "${response.text}", keys: industry, description, tone.`,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(parseResponse.text);
      setBrand({ ...brand, ...data });
      setSynced(true);
    } catch (e) { console.error(e); } finally { setSyncing(false); }
  };

  const generateConsultingFramework = async (type: 'SCOR' | 'SWOT' | 'PESTEL') => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a professional ${type} framework for: ${brand.name}. 
        Focus on supply chain efficiency and consulting value propositions. 
        Format with clear headers and professional business language.`,
      });
      setStrategy(response.text);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl border-slate-800 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Zap size={20} />
              </div>
              <h2 className="text-xl font-bold">Project Nucleus</h2>
            </div>
            {synced && <div className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Synced</div>}
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                value={brand.name}
                onChange={(e) => { setBrand({ ...brand, name: e.target.value }); setSynced(false); }}
                placeholder="Company Name"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button onClick={discoverBrand} disabled={syncing} className="px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition-all">
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input value={brand.industry} onChange={(e) => setBrand({ ...brand, industry: e.target.value })} placeholder="Industry" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
              <input value={brand.tone} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} placeholder="Brand Tone" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
            </div>
            <textarea value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} rows={4} placeholder="Core Competencies & Services" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
             <button onClick={() => generateConsultingFramework('SCOR')} className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700">
               <ShieldAlert size={14} /> SCOR Model
             </button>
             <button onClick={() => generateConsultingFramework('SWOT')} className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700">
               <BarChart3 size={14} /> SWOT Analysis
             </button>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border-slate-800 flex flex-col gap-6 min-h-[500px]">
          <div className="flex items-center gap-3 text-purple-400">
            <Compass size={20} />
            <h2 className="text-xl font-bold">Framework Analysis</h2>
          </div>

          {strategy ? (
            <div className="prose prose-invert prose-sm max-w-none text-slate-400 overflow-y-auto flex-1 pr-2">
              <div className="whitespace-pre-wrap leading-relaxed">{strategy}</div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
              <MessageSquare size={32} className="mb-4" />
              <p className="text-sm">Select a framework to begin specialized analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyBoard;
