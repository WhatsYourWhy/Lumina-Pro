
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile } from '../types';
import { 
  Zap, 
  Target, 
  MessageSquare, 
  Compass, 
  Loader2, 
  Globe, 
  CheckCircle2, 
  BarChart3, 
  ShieldAlert,
  Layers,
  Sparkles,
  Activity,
  Quote
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

  const discoverBrand = async () => {
    if (!brand.name) {
      alert("Please enter your company name.");
      return;
    }
    setSyncing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Research the company "${brand.name}". Identify their primary industry, core service/product offerings, brand voice, and notable supply chain or logistics operations.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      const extractResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this research: "${searchResponse.text}", provide a JSON profile.`,
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
      console.error("Discovery failed", e); 
    } finally { 
      setSyncing(false); 
    }
  };

  const generateConsultingFramework = async (type: 'SCOR' | 'SWOT' | 'PESTEL' | 'LENS') => {
    setLoading(true);
    setPitchHooks([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const lensPrompts = {
        efficiency: "Focus on cost-reduction and lean operational workflows.",
        resilience: "Focus on risk mitigation and buffer management.",
        esg: "Focus on ethical sourcing and governance.",
        growth: "Focus on market scalability and value-chain expansion."
      };

      const prompt = type === 'LENS' 
        ? `Perform a deep-dive consulting analysis for ${brand.name} through the lens of ${activeLens.toUpperCase()}. ${lensPrompts[activeLens]}`
        : `Create a professional ${type} framework for: ${brand.name}. Focus on ${brand.industry} industry standards.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a senior partner at a top-tier management consultancy. Output must be data-driven and strategic."
        }
      });
      setStrategy(response.text);

      // Generate Pitch Hooks based on the framework
      const hookResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this analysis: "${response.text}", generate 3 distinct "Executive Pitch Hooks" for ${brand.name}. 
        Format as JSON array of objects with 'title' (The Growth Narrative, The Risk Play, The Visionary) and 'hook' (the actual 2-sentence pitch).`,
        config: { responseMimeType: "application/json" }
      });
      const hooks = JSON.parse(hookResponse.text);
      setPitchHooks(Array.isArray(hooks) ? hooks : []);

    } catch (e) { 
      console.error("Analysis failed", e); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left: Configuration (4 cols) */}
        <div className="lg:col-span-5 glass p-6 lg:p-8 rounded-2xl lg:rounded-3xl border-slate-800 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-indigo-400">
                <Zap size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Project Nucleus</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Consulting Core</p>
              </div>
            </div>
            {synced && <div className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Synced</div>}
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  value={brand.name}
                  onChange={(e) => { setBrand({ ...brand, name: e.target.value }); setSynced(false); }}
                  placeholder="Company Name"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                />
              </div>
              <button onClick={discoverBrand} disabled={syncing} className="px-6 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-xl transition-all shrink-0 font-bold text-xs">
                {syncing ? <Loader2 size={16} className="animate-spin" /> : "Sync"}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input value={brand.industry} onChange={(e) => setBrand({ ...brand, industry: e.target.value })} placeholder="Industry" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
              <input value={brand.tone} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} placeholder="Brand Voice" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Consulting Lens</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['efficiency', 'resilience', 'esg', 'growth'].map((l) => (
                <button 
                  key={l}
                  onClick={() => setActiveLens(l as any)}
                  className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase border transition-all ${activeLens === l ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => generateConsultingFramework('LENS')} disabled={loading || !brand.name} className="w-full py-3 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2">
              <Target size={14} /> Analyze Current Lens
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => generateConsultingFramework('SCOR')} className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700"><ShieldAlert size={14} /> SCOR Model</button>
             <button onClick={() => generateConsultingFramework('SWOT')} className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700"><BarChart3 size={14} /> SWOT Audit</button>
          </div>
        </div>

        {/* Right: Synthesis & Insights (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Strategy Output */}
          <div className="glass p-6 lg:p-8 rounded-2xl lg:rounded-3xl border-slate-800 flex flex-col flex-1 min-h-[400px]">
            <div className="flex items-center justify-between text-indigo-400 mb-6">
              <div className="flex items-center gap-3">
                <Compass size={20} />
                <h2 className="text-xl font-bold tracking-tight">Strategic Intelligence</h2>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                  <Activity className="text-indigo-400 animate-pulse" size={48} />
                  <p className="text-xs text-slate-500 tracking-widest font-bold uppercase">Synthesizing Data Points...</p>
                </div>
              ) : strategy ? (
                <div className="h-full overflow-y-auto pr-1 scrollbar-hide">
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-400 text-sm">{strategy}</div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
                  <Layers size={48} className="mb-6 text-indigo-500" />
                  <p className="text-xs max-w-[240px]">Select a framework to initiate strategic synthesis.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pitch Hooks Sidebar / Bottom */}
          {pitchHooks.length > 0 && !loading && (
            <div className="glass p-6 rounded-2xl border-slate-800 bg-indigo-500/5 animate-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-2 text-indigo-400 mb-4">
                 <Sparkles size={18} />
                 <h3 className="text-sm font-bold uppercase tracking-widest">Executive Narrative Hooks</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {pitchHooks.map((h, i) => (
                   <div key={i} className="space-y-2 p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group">
                     <p className="text-[10px] font-black text-indigo-500 uppercase">{h.title}</p>
                     <p className="text-xs text-slate-400 leading-snug group-hover:text-slate-200 transition-colors italic">"{h.hook}"</p>
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
