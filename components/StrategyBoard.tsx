import React, { useState, useRef } from 'react';
import { Type } from "@google/genai";
import { ai } from '../lib/api';
import { config } from '../config';
import { renderMarkdown } from '../lib/markdown';
import { BrandProfile } from '../types';
import { parseCleanJson } from '../lib/json';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Zap, 
  Target, 
  Compass, 
  Loader2, 
  History,
  FileText,
  Copy,
  Check,
  Download,
  FileDown
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  setBrand: (b: BrandProfile) => void;
  history: { type: string; timestamp: string; content: string }[];
  onNewEntry: (entry: { type: string; timestamp: string; content: string }) => void;
}

const formatTimestamp = (ts: string) => {
  const date = new Date(ts);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return ts;
};

const StrategyBoard: React.FC<Props> = ({ brand, setBrand, history, onNewEntry }) => {
  const historyList = history || [];
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLens, setActiveLens] = useState<'efficiency' | 'resilience' | 'esg' | 'growth'>('efficiency');
  const [displayIndex, setDisplayIndex] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [tempType, setTempType] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const briefRef = useRef<HTMLDivElement>(null);

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
      setError("Discovery phase failed. Please check company name or enter details manually.");
      toast.error("Discovery phase failed.");
    } finally { 
      setSyncing(false); 
    }
  };

  const generateConsultingFramework = async (type: 'SCOR' | 'SWOT' | 'PESTEL' | 'LENS' | 'DMAIC' | 'BULLWHIP' | 'PORTER' | 'MCKINSEY_7S' | 'ANSOFF' | 'OKR') => {
    if (!brand.name) return;
    setLoading(true);
    setError(null);
    setCurrentAnalysis(null);
    
    let typeLabel = type as string;
    if (type === 'LENS') typeLabel = `LENS: ${activeLens.toUpperCase()}`;
    else if (type === 'PORTER') typeLabel = "Porter's 5 Forces";
    else if (type === 'MCKINSEY_7S') typeLabel = "McKinsey 7S Framework";
    else if (type === 'ANSOFF') typeLabel = "Ansoff Growth Matrix";
    else if (type === 'OKR') typeLabel = "OKR Strategy Roadmap";
    
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
      setCurrentAnalysis(content);
      
      // Auto-save to history
      onNewEntry({
        type: typeLabel,
        timestamp: new Date().toISOString(),
        content: content
      });
      setDisplayIndex(0);
    } catch (e: any) { 
      console.error("Strategic synthesis failed:", e);
      setError("Strategic synthesis interrupted. Check connectivity.");
      toast.error("Strategic synthesis interrupted.");
    } finally { 
      setLoading(false); 
    }
  };

  const activeContent = currentAnalysis || historyList[displayIndex]?.content;
  const activeTitle = currentAnalysis ? tempType : historyList[displayIndex]?.type;

  const handleCopyMarkdown = () => {
    if (!activeContent) return;
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    toast.success("Brief copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!activeContent) return;
    const filename = `${(activeTitle || 'Strategic_Brief').replace(/[^a-zA-Z0-9_-]/g, '_')}_${(brand.name || 'Brand').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    const blob = new Blob([activeContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleExportPdf = async () => {
    if (!briefRef.current || !activeContent) return;
    setExportingPdf(true);
    try {
      const canvas = await html2canvas(briefRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const filename = `${(activeTitle || 'Strategic_Brief').replace(/[^a-zA-Z0-9_-]/g, '_')}_${(brand.name || 'Brand').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      pdf.save(filename);
      toast.success(`Exported PDF: ${filename}`);
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

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
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('SWOT')} className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors">SWOT</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('SCOR')} className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors">SCOR (Logistics)</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('PESTEL')} className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors">PESTEL</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('DMAIC')} className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors">DMAIC</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('PORTER')} className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors">Porter's 5 Forces</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('MCKINSEY_7S')} className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors">McKinsey 7S</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('ANSOFF')} className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors">Ansoff Matrix</button>
                  <button disabled={loading || !brand.name} onClick={() => generateConsultingFramework('OKR')} className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors">OKR Roadmap</button>
                </div>
                <button 
                  onClick={() => generateConsultingFramework('BULLWHIP')} 
                  disabled={loading || !brand.name}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors mt-2"
                >
                  Bullwhip Effect Risk
                </button>
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl space-y-4 border-slate-800/50">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Saved Logic</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
              {historyList.length > 0 ? (
                historyList.map((h, i) => (
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
                
                {activeContent && !loading && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMarkdown}
                      title="Copy Markdown to Clipboard"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      title="Download Markdown (.md)"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                    >
                      <Download size={14} />
                      <span className="hidden sm:inline">.md</span>
                    </button>
                    <button
                      onClick={handleExportPdf}
                      disabled={exportingPdf}
                      title="Export Brief as PDF"
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-600/20"
                    >
                      {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div ref={briefRef} className="flex-1 overflow-y-auto p-8 text-slate-300 text-sm selection:bg-indigo-500/30">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-6 py-20 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={24} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Synthesizing Executive Logic</p>
                    <p className="text-[11px] text-slate-500 max-w-xs font-medium">Cross-referencing brand tone with industry benchmarks and competitive frameworks using Gemini 3.1 Pro...</p>
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
                  <span>Model: Gemini 3.1 Pro</span>
                  <p>Briefcase Sync: Operational</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBoard;
