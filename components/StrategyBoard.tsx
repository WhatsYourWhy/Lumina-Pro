import React, { useState } from 'react';
import { Type } from "@google/genai";
import { ai } from '../lib/api';
import { config } from '../config';
import { renderMarkdown } from '../lib/markdown';
import { BrandProfile, StrategicEntry } from '../types';
import { parseCleanJson } from '../lib/json';
import { describeAiError } from '../lib/errors';
import BriefActions from './BriefActions';
import toast from 'react-hot-toast';
import {
  Zap,
  Target,
  Compass,
  Loader2,
  History,
  FileText,
  Trash2,
  X
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  setBrand: (b: BrandProfile) => void;
  history: StrategicEntry[];
  onNewEntry: (entry: StrategicEntry) => void;
  onDeleteEntry?: (index: number) => void;
  onClearHistory?: () => void;
}

type FrameworkType = 'SCOR' | 'SWOT' | 'PESTEL' | 'LENS' | 'DMAIC' | 'BULLWHIP' | 'PORTER' | 'MCKINSEY_7S' | 'ANSOFF' | 'OKR';

const FRAMEWORK_LABELS: Record<Exclude<FrameworkType, 'LENS'>, string> = {
  SWOT: 'SWOT',
  SCOR: 'SCOR',
  PESTEL: 'PESTEL',
  DMAIC: 'DMAIC',
  BULLWHIP: 'BULLWHIP',
  PORTER: "Porter's 5 Forces",
  MCKINSEY_7S: 'McKinsey 7S Framework',
  ANSOFF: 'Ansoff Growth Matrix',
  OKR: 'OKR Strategy Roadmap'
};

const formatTimestamp = (ts: string) => {
  const date = new Date(ts);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return ts;
};

const formatFullTimestamp = (ts: string) => {
  const date = new Date(ts);
  return isNaN(date.getTime()) ? ts : date.toLocaleString();
};

const StrategyBoard: React.FC<Props> = ({ brand, setBrand, history, onNewEntry, onDeleteEntry, onClearHistory }) => {
  const historyList = history || [];
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLens, setActiveLens] = useState<'efficiency' | 'resilience' | 'esg' | 'growth'>('efficiency');
  const [displayIndex, setDisplayIndex] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [tempType, setTempType] = useState<string | null>(null);
  const [tempTimestamp, setTempTimestamp] = useState<string | null>(null);

  const discoverBrand = async () => {
    if (!brand.name) return;
    setSyncing(true);
    setError(null);
    try {
      const searchResponse = await ai.models.generateContent({
        model: config.models.defaultFlash,
        contents: `Perform deep web research on the company "${brand.name}". Identify their primary industry, core business model, and brand tone.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      const extractResponse = await ai.models.generateContent({
        model: config.models.defaultFlash,
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

      const data = parseCleanJson<Record<string, string> | null>(extractResponse.text, null);
      if (!data || !data.industry || !data.description || !data.tone) {
        throw new Error("AI extraction did not return a complete business profile.");
      }
      setBrand({
        ...brand,
        industry: data.industry,
        description: data.description,
        tone: data.tone
      });
      toast.success("Brand profile discovered!");
    } catch (e) {
      console.error("Brand discovery failed:", e);
      const message = describeAiError(e);
      setError(`Discovery failed: ${message}`);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  const generateConsultingFramework = async (type: FrameworkType) => {
    if (!brand.name) return;
    setLoading(true);
    setError(null);
    setCurrentAnalysis(null);

    const typeLabel = type === 'LENS' ? `LENS: ${activeLens.toUpperCase()}` : FRAMEWORK_LABELS[type];
    setTempType(typeLabel);

    try {
      let prompt = '';
      if (type === 'LENS') {
        prompt = `Perform an executive ${activeLens.toUpperCase()} analysis for ${brand.name}. Focus on specific operational leverage points in ${brand.industry}.`;
      } else if (type === 'DMAIC') {
        prompt = `Perform a comprehensive Lean Six Sigma DMAIC (Define, Measure, Analyze, Improve, Control) operational process analysis for ${brand.name} in the ${brand.industry} sector. Map out process inefficiencies, waste, standard metrics, and concrete steps to streamline supply chain or service delivery operations.`;
      } else if (type === 'BULLWHIP') {
        prompt = `Perform a detailed Supply Chain Bullwhip Effect and Volatility Risk analysis for ${brand.name} in the ${brand.industry} sector. Analyze demand-amplification risk, forecast variance, lead-time factors, buffer stock inefficiencies, and provide concrete mitigations.`;
      } else if (type === 'PORTER') {
        prompt = `Perform an in-depth Porter's Five Forces competitive strategy analysis for ${brand.name} in the ${brand.industry} sector. Evaluate Threat of New Entrants, Bargaining Power of Buyers, Bargaining Power of Suppliers, Threat of Substitute Products, and Competitive Industry Rivalry. Provide strategic positioning maneuvers for each force.`;
      } else if (type === 'MCKINSEY_7S') {
        prompt = `Perform a comprehensive McKinsey 7S Organizational Framework analysis for ${brand.name} in the ${brand.industry} sector. Evaluate Hard Elements (Strategy, Structure, Systems) and Soft Elements (Shared Values, Style, Staff, Skills). Detail internal alignment disconnects and provide a change management roadmap.`;
      } else if (type === 'ANSOFF') {
        prompt = `Perform an Ansoff Growth Strategy Matrix analysis for ${brand.name} in the ${brand.industry} sector. Analyze Market Penetration, Market Development, Product Development, and Diversification. Highlight risk-reward trade-offs and recommend the optimal priority growth vector.`;
      } else if (type === 'OKR') {
        prompt = `Develop an Executive Strategy OKR (Objectives & Key Results) Roadmap for ${brand.name} in the ${brand.industry} sector. Outline 3-5 core strategic objectives, 3 quantifiable key performance indicators (KPIs) per objective, quarterly execution milestones, and risk checkpoints.`;
      } else {
        prompt = `Generate a detailed ${type} framework for ${brand.name} within the ${brand.industry} sector. Be specific, data-driven, actionable, and critical.`;
      }

      if (brand.description) {
        prompt += ` Business context: ${brand.description}`;
      }
      prompt += ` Structure the response strictly with clear markdown headers: ## Executive Summary, ## Strategic Analysis & Key Takeaways, ## Framework Breakdown, and ## Actionable Implementation Plan.`;

      const response = await ai.models.generateContent({
        model: config.models.defaultPro,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          systemInstruction: "You are a Senior Operations Strategy Partner. Provide high-density, professional business consulting briefs with structured bullet points, clear headings, bold metrics, and executive tone."
        }
      });

      const content = response.text;
      if (!content) {
        throw new Error("No strategic analysis content returned.");
      }
      const timestamp = new Date().toISOString();
      setCurrentAnalysis(content);
      setTempTimestamp(timestamp);

      onNewEntry({ type: typeLabel, timestamp, content });
      setDisplayIndex(0);
    } catch (e: any) {
      console.error("Strategic synthesis failed:", e);
      const message = describeAiError(e);
      setError(`Strategic synthesis interrupted: ${message}`);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const activeEntry = historyList[displayIndex];
  const activeContent = currentAnalysis || activeEntry?.content || null;
  const activeTitle = currentAnalysis ? tempType : activeEntry?.type;
  const activeTimestamp = currentAnalysis ? tempTimestamp : activeEntry?.timestamp;

  const selectEntry = (index: number) => {
    setDisplayIndex(index);
    setCurrentAnalysis(null);
  };

  const removeEntry = (index: number) => {
    if (!onDeleteEntry) return;
    onDeleteEntry(index);
    // The freshly generated brief lives at index 0 of history; drop the live copy too.
    if (index === 0 && currentAnalysis) setCurrentAnalysis(null);
    if (displayIndex >= index && displayIndex > 0) setDisplayIndex(displayIndex - 1);
  };

  const clearActiveBrief = () => {
    if (currentAnalysis) {
      setCurrentAnalysis(null);
      onDeleteEntry?.(0);
      setDisplayIndex(0);
      return;
    }
    removeEntry(displayIndex);
  };

  const clearAll = () => {
    if (!onClearHistory) return;
    if (!window.confirm(`Delete all ${historyList.length} saved frameworks for ${brand.name || 'this client'}? This cannot be undone.`)) return;
    onClearHistory();
    setCurrentAnalysis(null);
    setDisplayIndex(0);
    toast.success('Framework history cleared.');
  };

  const frameworkButton = 'py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors';

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
                  title="Research this company on the web and fill in the profile"
                  className="px-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                >
                  {syncing ? <Loader2 className="animate-spin" size={16}/> : "Sync"}
                </button>
              </div>
              <div className="space-y-3">
                <input value={brand.industry} onChange={(e) => setBrand({ ...brand, industry: e.target.value })} placeholder="Industry" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs" />
                <textarea value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} placeholder="Business Summary..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs h-20 resize-none" />
                <input value={brand.tone} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} placeholder="Brand voice (e.g. Executive, Direct)" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs" />
              </div>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 flex items-start justify-between gap-2">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="shrink-0 hover:text-white" title="Dismiss"><X size={12} /></button>
                </div>
              )}
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
                className="w-full py-3 bg-white text-slate-950 rounded-xl text-xs font-black shadow-xl hover:bg-slate-200 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Run Lens Analysis
              </button>

              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategy Frameworks</p>
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('SWOT')} className={frameworkButton}>SWOT</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('SCOR')} className={frameworkButton}>SCOR (Logistics)</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('PESTEL')} className={frameworkButton}>PESTEL</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('DMAIC')} className={frameworkButton}>DMAIC</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('PORTER')} className={frameworkButton}>Porter's 5 Forces</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('MCKINSEY_7S')} className={frameworkButton}>McKinsey 7S</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('ANSOFF')} className={frameworkButton}>Ansoff Matrix</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('OKR')} className={frameworkButton}>OKR Roadmap</button>
                </div>
                <button
                  onClick={() => generateConsultingFramework('BULLWHIP')}
                  disabled={loading || !brand.name}
                  className={`w-full ${frameworkButton} mt-2`}
                >
                  Bullwhip Effect Risk
                </button>
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl space-y-4 border-slate-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Saved Logic ({historyList.length})</h3>
              {historyList.length > 0 && onClearHistory && (
                <button onClick={clearAll} title="Clear all saved frameworks" className="text-[9px] font-black uppercase text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                  <Trash2 size={11} /> Clear all
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
              {historyList.length > 0 ? (
                historyList.map((h, i) => {
                  const isSelected = !currentAnalysis && displayIndex === i;
                  return (
                    <div key={`${h.timestamp}-${i}`} className={`w-full rounded-xl text-xs flex items-center transition-all ${isSelected ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-500'}`}>
                      <button
                        onClick={() => selectEntry(i)}
                        className="flex-1 text-left p-3 flex justify-between items-center min-w-0"
                      >
                        <span className="truncate pr-2 font-medium">{h.type}</span>
                        <span className="opacity-40 text-[9px] shrink-0">{formatTimestamp(h.timestamp)}</span>
                      </button>
                      {onDeleteEntry && (
                        <button
                          onClick={() => removeEntry(i)}
                          title={`Delete ${h.type}`}
                          aria-label={`Delete ${h.type}`}
                          className="p-2 mr-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">No frameworks generated</div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="glass h-full min-h-[600px] rounded-3xl flex flex-col border-slate-800/50 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/20 backdrop-blur-sm flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{activeTitle || "Framework Intelligence"}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{brand.name || 'Awaiting Client Sync'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {loading && <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase animate-pulse">Consulting AI...</div>}

                {!loading && (
                  <BriefActions
                    content={activeContent}
                    title={activeTitle || 'Strategic Brief'}
                    brand={brand}
                    meta={activeTimestamp ? `Generated ${formatFullTimestamp(activeTimestamp)} · Model ${config.models.defaultPro}` : undefined}
                    onClear={onDeleteEntry ? clearActiveBrief : undefined}
                    clearLabel="Delete"
                    clearConfirmText="Delete this brief from the saved history? This cannot be undone."
                  />
                )}
              </div>
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
                    <p className="text-[11px] text-slate-500 max-w-xs font-medium">Cross-referencing brand tone with industry benchmarks and competitive frameworks using {config.models.defaultPro}...</p>
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
               <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex justify-between items-center text-[10px] text-slate-500 font-bold px-8">
                  <span>Model: {config.models.defaultPro}</span>
                  <span>{activeTimestamp ? formatFullTimestamp(activeTimestamp) : ''}</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBoard;
