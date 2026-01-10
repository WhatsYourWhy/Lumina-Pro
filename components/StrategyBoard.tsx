
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile } from '../types';
import { 
  Zap, 
  Target, 
  Compass, 
  Loader2, 
  Globe, 
  BarChart3, 
  ShieldAlert,
  Layers,
  Sparkles,
  Activity,
  AlertCircle
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  setBrand: (b: BrandProfile) => void;
}

const StrategyBoard: React.FC<Props> = ({ brand, setBrand }) => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const [activeLens, setActiveLens] = useState<'efficiency' | 'resilience' | 'esg' | 'growth'>('efficiency');
  const [pitchHooks, setPitchHooks] = useState<{title: string, hook: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  const discoverBrand = async () => {
    if (!brand.name) return;
    setSyncing(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Perform a deep web research on "${brand.name}". I need their primary industry, business model summary, and core competitive tone.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      const extractResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Extract business profile from: "${searchResponse.text}"`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              industry: { type: Type.STRING },
              description: { type: Type.STRING },
              tone: { type: Type.STRING }
            },
            required: ["industry", "description", "tone"]
          }
        }
      });

      const data = JSON.parse(extractResponse.text);
      setBrand({ ...brand, ...data });
      setSynced(true);
    } catch (e) { 
      console.error(e);
      setError("Discovery phase failed. Manual entry required.");
    } finally { 
      setSyncing(false); 
    }
  };

  const generateConsultingFramework = async (type: 'SCOR' | 'SWOT' | 'PESTEL' | 'LENS') => {
    if (!brand.name) return;
    setLoading(true);
    setStrategy(null);
    setPitchHooks([]);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const lensPrompts = {
        efficiency: "Focus on operational LEAN and cost-reduction.",
        resilience: "Focus on agility and risk mitigation.",
        esg: "Focus on ethical governance and transparency.",
        growth: "Focus on market capture and scalability."
      };

      const prompt = type === 'LENS' 
        ? `Perform a partner-level analysis for ${brand.name} through the ${activeLens.toUpperCase()} lens. ${lensPrompts[activeLens]}`
        : `Generate a high-fidelity ${type} framework for ${brand.name} in the ${brand.industry} space. Use professional management consulting formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 }, // Calibrated budget to avoid error and ensure reasoning
          systemInstruction: "You are a Senior Strategy Partner. Your output must be rigorous, data-driven, and ready for a C-suite presentation."
        }
      });
      setStrategy(response.text);

      const hookResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on: "${response.text}", create 3 high-impact executive pitch hooks for ${brand.name}. Return JSON array: [{title, hook}].`,
        config: { responseMimeType: "application/json" }
      });
      setPitchHooks(JSON.parse(hookResponse.text));

    } catch (e: any) { 
      console.error(e);
      setError("Strategic synthesis interrupted. Please try re-syncing.");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass p-6 lg:p-8 rounded-3xl border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Nucleus Config</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Foundation Data</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    value={brand.name}
                    onChange={(e) => { setBrand({ ...brand, name: e.target.value }); setSynced(false); }}
                    placeholder="Company Name"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium"
                  />
                </div>
                <button onClick={discoverBrand} disabled={syncing || !brand.name} className="px-6 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-xl transition-all font-bold text-xs shadow-lg shadow-indigo-500/20">
                  {syncing ? <Loader2 size={16} className="animate-spin" /> : "Sync"}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-600 uppercase px-1">Industry</label>
                  <input value={brand.industry} onChange={(e) => setBrand({ ...brand, industry: e.target.value })} placeholder="Logistics" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-600 uppercase px-1">Voice</label>
                  <input value={brand.tone} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} placeholder="Authoritative" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-medium" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/50 space-y-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Consulting Lens</p>
              <div className="grid grid-cols-2 gap-2">
                {['efficiency', 'resilience', 'esg', 'growth'].map((l) => (
                  <button 
                    key={l}
                    onClick={() => setActiveLens(l as any)}
                    className={`py-2 px-1 rounded-lg text-[10px] font-black uppercase border transition-all ${activeLens === l ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={() => generateConsultingFramework('LENS')} disabled={loading || !brand.name} className="w-full py-3.5 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95">
                <Target size={14} /> Run Selected Lens Analysis
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => generateConsultingFramework('SCOR')} className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700"><ShieldAlert size={14} /> SCOR</button>
               <button onClick={() => generateConsultingFramework('SWOT')} className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700"><BarChart3 size={14} /> SWOT</button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs flex items-center gap-3 animate-in shake duration-300">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass p-6 lg:p-8 rounded-3xl border-slate-800 flex flex-col flex-1 min-h-[450px] shadow-2xl">
            <div className="flex items-center justify-between text-indigo-400 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <Compass size={22} />
                <h2 className="text-xl font-bold tracking-tight">Strategic Intelligence Feed</h2>
              </div>
              {loading && <div className="text-[10px] font-black uppercase tracking-widest animate-pulse">Computing...</div>}
            </div>

            <div className="flex-1 overflow-hidden relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 tracking-[0.3em] font-black uppercase">Deep Reasoning Active</p>
                </div>
              ) : strategy ? (
                <div className="h-full overflow-y-auto pr-2 scrollbar-hide">
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm font-medium selection:bg-indigo-500/30">{strategy}</div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-12">
                  <Layers size={64} className="mb-6 text-indigo-500" />
                  <p className="text-sm font-bold uppercase tracking-[0.3em]">Operational Core Idle</p>
                </div>
              )}
            </div>
          </div>

          {pitchHooks.length > 0 && !loading && (
            <div className="glass p-6 rounded-3xl border-slate-800 bg-indigo-500/5 animate-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-2 text-indigo-400 mb-4">
                 <Sparkles size={18} />
                 <h3 className="text-[11px] font-black uppercase tracking-widest">Executive Narratives</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {pitchHooks.map((h, i) => (
                   <div key={i} className="space-y-2 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all group shadow-lg">
                     <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">{h.title}</p>
                     <p className="text-xs text-slate-400 leading-relaxed font-medium group-hover:text-slate-200 transition-colors">"{h.hook}"</p>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyBoard;
