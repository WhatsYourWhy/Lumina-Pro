
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile } from '../types';
import { 
  Zap, 
  Target, 
  Compass, 
  Loader2, 
  Globe, 
  History,
  ShieldAlert,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  setBrand: (b: BrandProfile) => void;
  history: { type: string; timestamp: string; content: string }[];
  onNewEntry: (entry: { type: string; timestamp: string; content: string }) => void;
}

const StrategyBoard: React.FC<Props> = ({ brand, setBrand, history, onNewEntry }) => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLens, setActiveLens] = useState<'efficiency' | 'resilience' | 'esg' | 'growth'>('efficiency');
  const [displayIndex, setDisplayIndex] = useState(0);

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
    } catch (e) { 
      setError("Discovery phase failed. Manual entry required.");
    } finally { 
      setSyncing(false); 
    }
  };

  const generateConsultingFramework = async (type: 'SCOR' | 'SWOT' | 'PESTEL' | 'LENS') => {
    if (!brand.name) return;
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = type === 'LENS' 
        ? `Perform a partner-level analysis for ${brand.name} through the ${activeLens.toUpperCase()} lens.`
        : `Generate a high-fidelity ${type} framework for ${brand.name} in the ${brand.industry} space.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          systemInstruction: "You are a Senior Strategy Partner. Output must be rigorous, professional, and data-driven."
        }
      });
      
      onNewEntry({
        type: type === 'LENS' ? `LENS: ${activeLens.toUpperCase()}` : type,
        timestamp: new Date().toLocaleTimeString(),
        content: response.text
      });
      setDisplayIndex(0); // Show newest immediately
    } catch (e: any) { 
      setError("Strategic synthesis interrupted.");
    } finally { 
      setLoading(false); 
    }
  };

  const currentEntry = history[displayIndex];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-6 lg:p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold">Nucleus Config</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} placeholder="Company Name" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
                <button onClick={discoverBrand} className="px-6 bg-indigo-500 text-white rounded-xl text-xs font-bold">{syncing ? <Loader2 className="animate-spin" size={16}/> : "Sync"}</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={brand.industry} onChange={(e) => setBrand({ ...brand, industry: e.target.value })} placeholder="Industry" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs" />
                <input value={brand.tone} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} placeholder="Tone" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs" />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800 space-y-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Lenses</p>
              <div className="grid grid-cols-2 gap-2">
                {['efficiency', 'resilience', 'esg', 'growth'].map((l) => (
                  <button key={l} onClick={() => setActiveLens(l as any)} className={`py-2 px-1 rounded-lg text-[10px] font-black uppercase border ${activeLens === l ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{l}</button>
                ))}
              </div>
              <button onClick={() => generateConsultingFramework('LENS')} disabled={loading} className="w-full py-3 bg-slate-100 text-slate-950 rounded-xl text-xs font-black shadow-lg">Run Analysis</button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => generateConsultingFramework('SWOT')} className="py-2.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold">SWOT</button>
                <button onClick={() => generateConsultingFramework('SCOR')} className="py-2.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold">SCOR</button>
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className="glass p-4 rounded-2xl space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={12}/> Session Ledger</h3>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button 
                    key={i} 
                    onClick={() => setDisplayIndex(i)}
                    className={`w-full text-left p-3 rounded-xl text-xs flex justify-between items-center transition-all ${displayIndex === i ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-500'}`}
                  >
                    <span>{h.type}</span>
                    <span className="opacity-40 text-[9px]">{h.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass p-6 lg:p-8 rounded-3xl flex flex-col flex-1 min-h-[550px]">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-3"><Compass className="text-indigo-400" /> {currentEntry?.type || "Intelligence Output"}</h2>
              {loading && <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">Processing Deep Logic...</div>}
            </div>
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">Synthesizing Framework...</p>
                </div>
              ) : currentEntry?.content || (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4 py-20">
                  <Target size={48} />
                  <p className="text-sm font-bold uppercase tracking-widest">Select or Generate a Framework</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBoard;
