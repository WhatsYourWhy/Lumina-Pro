import React, { useState } from 'react';
import { Type } from "@google/genai";
import { ai } from '../lib/api';
import { BrandProfile } from '../types';
import toast from 'react-hot-toast';
import { 
  Zap, 
  Target, 
  Compass, 
  Loader2, 
  History,
  FileText
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  setBrand: (b: BrandProfile) => void;
  history: { type: string; timestamp: string; content: string }[];
  onNewEntry: (entry: { type: string; timestamp: string; content: string }) => void;
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
          return <h4 key={index} className="text-base font-bold text-indigo-400 mt-6 mb-2">{parseBold(trimmed.replace('### ', ''))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={index} className="text-lg font-black text-white mt-8 mb-3 border-b border-slate-800/80 pb-1.5">{parseBold(trimmed.replace('## ', ''))}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={index} className="text-xl font-black text-white mt-10 mb-4">{parseBold(trimmed.replace('# ', ''))}</h2>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const cleanText = trimmed.substring(2);
          return (
            <li key={index} className="list-disc ml-5 mb-1.5 text-slate-300 leading-relaxed">
              {parseBold(cleanText)}
            </li>
          );
        }
        if (trimmed === '---') {
          return <hr key={index} className="my-6 border-slate-800" />;
        }
        if (trimmed === '') {
          return <div key={index} className="h-1" />;
        }
        return <p key={index} className="leading-relaxed mb-2 text-slate-300">{parseBold(line)}</p>;
      })}
    </div>
  );
};

const formatTimestamp = (ts: string) => {
  const date = new Date(ts);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return ts;
};

const StrategyBoard: React.FC<Props> = ({ brand, setBrand, history, onNewEntry }) => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLens, setActiveLens] = useState<'efficiency' | 'resilience' | 'esg' | 'growth'>('efficiency');
  const [displayIndex, setDisplayIndex] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [tempType, setTempType] = useState<string | null>(null);

  const discoverBrand = async () => {
    if (!brand.name) return;
    setSyncing(true);
    setError(null);
    try {
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Perform deep web research on the company "${brand.name}". Identify their primary industry, core business model, and brand tone.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      const extractResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract business profile data from this text: "${searchResponse.text}"`,
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
      setError("Discovery phase failed. Please check company name or enter details manually.");
      toast.error("Discovery phase failed.");
    } finally { 
      setSyncing(false); 
    }
  };

  const generateConsultingFramework = async (type: 'SCOR' | 'SWOT' | 'PESTEL' | 'LENS' | 'DMAIC' | 'BULLWHIP') => {
    if (!brand.name) return;
    setLoading(true);
    setError(null);
    setCurrentAnalysis(null);
    const typeLabel = type === 'LENS' ? `LENS: ${activeLens.toUpperCase()}` : type;
    setTempType(typeLabel);

    try {
      let prompt = '';
      if (type === 'LENS') {
        prompt = `Perform an executive ${activeLens.toUpperCase()} analysis for ${brand.name}. Focus on specific operational leverage points in ${brand.industry}.`;
      } else if (type === 'DMAIC') {
        prompt = `Perform a comprehensive Lean Six Sigma DMAIC (Define, Measure, Analyze, Improve, Control) operational process analysis for ${brand.name} in the ${brand.industry} sector. Map out process inefficiencies, waste, standard metrics, and concrete steps to streamline supply chain or service delivery operations.`;
      } else if (type === 'BULLWHIP') {
        prompt = `Perform a detailed Supply Chain Bullwhip Effect and Volatility Risk analysis for ${brand.name} in the ${brand.industry} sector. Analyze demand-amplification risk, forecast variance, lead-time factors, buffer stock inefficiencies, and provide concrete mitigations.`;
      } else {
        prompt = `Generate a detailed ${type} framework for ${brand.name} within the ${brand.industry} sector. Be specific, data-driven, actionable, and critical.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          systemInstruction: "You are a Senior Operations Strategy Partner. Provide high-density, professional business consulting briefs."
        }
      });
      
      const content = response.text;
      setCurrentAnalysis(content);
      
      // Auto-save to history
      onNewEntry({
        type: typeLabel,
        timestamp: new Date().toISOString(),
        content: content
      });
      setDisplayIndex(0);
    } catch (e: any) { 
      setError("Strategic synthesis interrupted. Check connectivity.");
      toast.error("Strategic synthesis interrupted.");
    } finally { 
      setLoading(false); 
    }
  };


  const activeContent = currentAnalysis || history[displayIndex]?.content;
  const activeTitle = currentAnalysis ? tempType : history[displayIndex]?.type;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-6 border-slate-800/50 shadow-xl">
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400"><Target size={20}/> Client Config</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  value={brand.name} 
                  onChange={(e) => setBrand({ ...brand, name: e.target.value })} 
                  placeholder="Client Company Name" 
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 transition-colors" 
                />
                <button 
                  onClick={discoverBrand} 
                  disabled={syncing || !brand.name}
                  className="px-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                >
                  {syncing ? <Loader2 className="animate-spin" size={16}/> : "Sync"}
                </button>
              </div>
              <div className="space-y-3">
                <input value={brand.industry} onChange={(e) => setBrand({ ...brand, industry: e.target.value })} placeholder="Industry" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs" />
                <textarea value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} placeholder="Business Summary..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs h-20 resize-none" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operational Lenses</p>
              <div className="grid grid-cols-2 gap-2">
                {['efficiency', 'resilience', 'esg', 'growth'].map((l) => (
                  <button 
                    key={l} 
                    onClick={() => setActiveLens(l as any)} 
                    className={`py-2 px-1 rounded-lg text-[10px] font-black uppercase border transition-all ${activeLens === l ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => generateConsultingFramework('LENS')} 
                disabled={loading || !brand.name} 
                className="w-full py-3 bg-white text-slate-950 rounded-xl text-xs font-black shadow-xl hover:bg-slate-200 transition-all active:scale-[0.98]"
              >
                Run Lens Analysis
              </button>
              
              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategy Frameworks</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => generateConsultingFramework('SWOT')} className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-colors">SWOT</button>
                  <button onClick={() => generateConsultingFramework('SCOR')} className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-colors">SCOR (Logistics)</button>
                  <button onClick={() => generateConsultingFramework('PESTEL')} className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-colors">PESTEL</button>
                  <button onClick={() => generateConsultingFramework('DMAIC')} className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-colors">DMAIC</button>
                </div>
                <button 
                  onClick={() => generateConsultingFramework('BULLWHIP')} 
                  disabled={loading || !brand.name}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-colors"
                >
                  Bullwhip Effect Risk
                </button>
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl space-y-4 border-slate-800/50">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Saved Logic</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
              {history.length > 0 ? (
                history.map((h, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setDisplayIndex(i); setCurrentAnalysis(null); }}
                    className={`w-full text-left p-3 rounded-xl text-xs flex justify-between items-center transition-all ${(!currentAnalysis && displayIndex === i) ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-500'}`}
                  >
                    <span className="truncate pr-2 font-medium">{h.type}</span>
                    <span className="opacity-40 text-[9px] shrink-0">{formatTimestamp(h.timestamp)}</span>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">No frameworks generated</div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="glass h-full min-h-[600px] rounded-3xl flex flex-col border-slate-800/50 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{activeTitle || "Framework Intelligence"}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{brand.name || 'Awaiting Client Sync'}</p>
                </div>
              </div>
              {loading && <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase animate-pulse">Consulting AI...</div>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 text-slate-300 text-sm selection:bg-indigo-500/30">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-6 py-20 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={24} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Synthesizing Executive Logic</p>
                    <p className="text-[11px] text-slate-500 max-w-xs font-medium">Cross-referencing brand tone with industry benchmarks and competitive frameworks...</p>
                  </div>
                </div>
              ) : activeContent ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {renderMarkdown(activeContent)}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-6 py-20 grayscale">
                  <Compass size={64} className="text-slate-500" />
                  <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-[0.3em]">Operational Vacuum</p>
                    <p className="text-xs font-medium">Generate a framework or operational analysis to populate this sector.</p>
                  </div>
                </div>
              )}
            </div>
            
            {activeContent && !loading && (
               <div className="p-6 border-t border-slate-800 bg-slate-900/10 flex justify-end gap-3">
                  <button 
                    onClick={() => navigator.clipboard.writeText(activeContent)}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                  >
                    Copy Output
                  </button>
                  <div className="w-px h-4 bg-slate-800 self-center" />
                  <p className="text-[10px] text-slate-500 font-bold self-center">Briefcase Sync: Operational</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBoard;
