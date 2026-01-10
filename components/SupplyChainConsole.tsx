
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrandProfile, GroundingSource } from '../types';
import { 
  MapPin, 
  Truck, 
  AlertTriangle, 
  ExternalLink, 
  Loader2, 
  Globe, 
  Search, 
  CloudLightning, 
  Wind, 
  Clock,
  Navigation,
  ShieldCheck,
  Zap,
  Maximize2,
  Bookmark,
  History,
  Trash2,
  ChevronRight,
  Columns,
  X,
  ArrowRightLeft
} from 'lucide-react';

interface Disruption {
  type: 'national' | 'global' | 'local' | 'dot';
  title: string;
  severity: 'high' | 'medium' | 'low';
  summary: string;
  source?: string;
  lat?: number;
  lng?: number;
}

interface SavedAnalysis {
  id: string;
  timestamp: number;
  route: string;
  intelligence: string;
  disruptions: Disruption[];
  mapsLinks: GroundingSource[];
}

interface Props {
  brand: BrandProfile;
}

const SupplyChainConsole: React.FC<Props> = ({ brand }) => {
  const [route, setRoute] = useState('');
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [intelligence, setIntelligence] = useState<string | null>(null);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [mapsLinks, setMapsLinks] = useState<GroundingSource[]>([]);
  const [showMap, setShowMap] = useState(true);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Comparison State
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lumina_sc_history');
    if (stored) {
      try {
        setSavedAnalyses(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveCurrentAnalysis = () => {
    if (!intelligence || !route) return;
    const newAnalysis: SavedAnalysis = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      route,
      intelligence,
      disruptions,
      mapsLinks
    };
    const updated = [newAnalysis, ...savedAnalyses].slice(0, 10);
    setSavedAnalyses(updated);
    localStorage.setItem('lumina_sc_history', JSON.stringify(updated));
  };

  const loadAnalysis = (analysis: SavedAnalysis) => {
    setRoute(analysis.route);
    setIntelligence(analysis.intelligence);
    setDisruptions(analysis.disruptions);
    setMapsLinks(analysis.mapsLinks);
    setShowHistory(false);
  };

  const deleteAnalysis = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAnalyses.filter(a => a.id !== id);
    setSavedAnalyses(updated);
    localStorage.setItem('lumina_sc_history', JSON.stringify(updated));
    setSelectedForComparison(prev => prev.filter(item => item !== id));
  };

  const toggleComparisonSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForComparison(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(0, 3)
    );
  };

  const analyzeSupplyChain = async () => {
    if (!route) return;
    setLoading(true);
    setIntelligence(null);
    setMapsLinks([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // CRITICAL: Must use gemini-2.5-flash for googleMaps tool support
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze logistics and supply chain risks for this route/region: "${route}". The business is "${brand.name}" in the "${brand.industry}" industry. Return detailed logistics nodes and geographic risks.`,
        config: {
          tools: [{ googleMaps: {} }, { googleSearch: {} }]
        }
      });
      setIntelligence(response.text);
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedLinks = chunks.filter((c: any) => c.maps || c.web).map((c: any) => c.maps || c.web);
      setMapsLinks(extractedLinks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkWeatherAndAlerts = async () => {
    if (!route) return;
    setMonitoring(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find CURRENT disruptions for "${route}". Include National/DOT, Global, and Local alerts. Return a JSON array of objects with keys: type, title, severity, summary, source.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text);
      setDisruptions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setMonitoring(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 flex flex-col h-full animate-in fade-in duration-500 pb-24 lg:pb-0 relative">
      
      {/* Search & Control Header */}
      <div className="glass p-4 lg:p-6 rounded-2xl lg:rounded-3xl space-y-4 border-slate-800 shadow-2xl shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Logistics Command</h2>
              <p className="text-slate-500 text-[9px] uppercase tracking-wider">National & Global Operations</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl border flex items-center justify-center gap-2 text-[11px] font-bold transition-all ${showHistory ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
            >
              <History size={14} /> <span>Archive</span>
            </button>
            {intelligence && (
              <button 
                onClick={saveCurrentAnalysis}
                className="flex-1 sm:flex-none px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2 text-[11px] font-bold"
              >
                <Bookmark size={14} /> <span>Save</span>
              </button>
            )}
            {route && (
              <button 
                onClick={checkWeatherAndAlerts}
                disabled={monitoring}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 text-[11px] shadow-lg"
              >
                {monitoring ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="white" />}
                Scan Live
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-2">
          <div className="flex-1 relative">
            <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Enter Hub or Route..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl lg:rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={analyzeSupplyChain}
            disabled={loading || !route}
            className="w-full lg:w-auto px-8 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 border border-slate-700 rounded-xl font-bold py-3.5 transition-all flex items-center justify-center gap-2 text-sm shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={16} />}
            Analyze
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 overflow-hidden relative min-h-0">
        
        {/* Comparison Dashboard */}
        {showComparison && (
          <div className="absolute inset-0 z-[60] glass bg-slate-950/98 rounded-3xl p-4 lg:p-8 animate-in fade-in zoom-in-95 duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                   <ArrowRightLeft size={18} />
                </div>
                <h3 className="text-lg lg:text-xl font-bold">Route Comparison</h3>
              </div>
              <button onClick={() => setShowComparison(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 flex lg:grid lg:grid-cols-3 gap-4 lg:gap-6 overflow-x-auto lg:overflow-x-visible pb-6 snap-x snap-mandatory scrollbar-hide">
              {savedAnalyses.filter(a => selectedForComparison.includes(a.id)).map((analysis) => (
                <div key={analysis.id} className="glass bg-slate-900/40 border-slate-800 rounded-2xl flex flex-col p-6 min-w-[88vw] sm:min-w-[320px] snap-center">
                  <h4 className="text-base font-bold text-indigo-400 truncate mb-1">{analysis.route}</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-4">{new Date(analysis.timestamp).toLocaleDateString()}</p>
                  <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap scrollbar-hide">
                    {analysis.intelligence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History / Archive Overlay */}
        {showHistory && (
          <div className="absolute inset-0 z-50 glass bg-slate-950/95 rounded-3xl p-6 lg:p-10 animate-in fade-in slide-in-from-right-10 duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><History className="text-indigo-400" /> Archive</h3>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 scrollbar-hide pb-10">
              {savedAnalyses.map((analysis) => {
                const isSelected = selectedForComparison.includes(analysis.id);
                return (
                  <div 
                    key={analysis.id} 
                    onClick={() => loadAnalysis(analysis)}
                    className={`p-4 bg-slate-900/50 border rounded-2xl transition-all relative cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <button onClick={(e) => { e.stopPropagation(); toggleComparisonSelection(analysis.id, e); }} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                         {isSelected ? 'Selected' : 'Compare'}
                       </button>
                       <button onClick={(e) => deleteAnalysis(analysis.id, e)} className="text-slate-600 hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                    <h4 className="font-bold text-sm truncate">{analysis.route}</h4>
                    <p className="text-[9px] text-slate-500">{new Date(analysis.timestamp).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visual Map Module - Optimized for Mobile Tapping */}
        {showMap && (
          <div className="lg:col-span-7 flex flex-col gap-4 h-[300px] sm:h-[400px] lg:h-full shrink-0">
            <div className="flex-1 glass rounded-2xl lg:rounded-3xl border-slate-800 relative overflow-hidden flex items-center justify-center bg-slate-950 shadow-inner">
              
              {/* Animated Map Graphic */}
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                 <svg viewBox="0 0 1000 600" className="w-full h-full scale-125">
                   <path d="M100,100 Q400,50 800,150 T900,500" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="5,5" className="animate-dash" />
                   <circle cx="500" cy="300" r="200" fill="url(#grad_map)" opacity="0.1" />
                   <defs>
                     <radialGradient id="grad_map" cx="50%" cy="50%" r="50%">
                       <stop offset="0%" stopColor="#6366f1" />
                       <stop offset="100%" stopColor="transparent" />
                     </radialGradient>
                   </defs>
                 </svg>
              </div>

              {/* Interaction Layers */}
              {loading ? (
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Mapping Assets</p>
                </div>
              ) : intelligence ? (
                <div className="absolute inset-0 z-10">
                   {mapsLinks.map((link, idx) => (
                      <div 
                        key={idx} 
                        className="absolute group"
                        style={{ 
                          top: `${25 + (idx * 15) % 50}%`, 
                          left: `${20 + (idx * 20) % 60}%` 
                        }}
                      >
                        {/* Larger hit area for mobile touch */}
                        <div className="relative p-6 -m-6 flex items-center justify-center cursor-pointer">
                          <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping absolute opacity-40"></div>
                          <div className="w-3 h-3 bg-indigo-400 rounded-full border-2 border-white/40 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                          <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 whitespace-nowrap px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-bold shadow-2xl pointer-events-none z-20">
                            {link.title || 'Logistics Hub'}
                          </div>
                        </div>
                      </div>
                   ))}

                   {disruptions.filter(d => d.severity === 'high').map((alert, idx) => (
                      <div 
                        key={`alert-${idx}`}
                        className="absolute animate-pulse"
                        style={{ 
                          bottom: `${30 + (idx * 15) % 40}%`, 
                          right: `${20 + (idx * 20) % 55}%` 
                        }}
                      >
                        <div className="relative p-6 -m-6 flex items-center justify-center">
                          <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                             <AlertTriangle size={20} className="text-red-500" />
                          </div>
                        </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="text-center opacity-15 space-y-4 relative z-10">
                   <Globe size={48} className="mx-auto text-indigo-400" />
                   <h3 className="text-sm font-black uppercase tracking-[0.3em]">Operational Grid</h3>
                </div>
              )}

              {/* Map Footer */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none z-20">
                 <div className="glass px-3 py-2 rounded-xl border-slate-800 text-[9px] font-mono text-slate-500 space-y-1">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> HUB ACTIVE</div>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> RISK ALERT</div>
                 </div>
                 <div className="bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-400 border border-slate-800 tracking-widest max-w-[150px] truncate">
                   {route || "READY"}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Info/Feed */}
        <div className={`${showMap ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-4 overflow-hidden min-h-[400px]`}>
          
          {/* Analysis Module */}
          <div className="flex-1 glass rounded-2xl lg:rounded-3xl p-5 lg:p-6 border-slate-800 flex flex-col overflow-hidden">
             <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-4 shrink-0">
               <ShieldCheck size={14} /> Risk Synthesis
             </div>
             <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide text-[12px] lg:text-[13px] text-slate-400 leading-relaxed">
               {loading ? (
                 <div className="space-y-4 animate-pulse pt-2">
                   <div className="h-3 bg-slate-800 rounded w-full"></div>
                   <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                   <div className="h-20 bg-slate-800/10 rounded w-full"></div>
                 </div>
               ) : (
                 <div className="whitespace-pre-wrap">{intelligence || "Initiate analysis to generate route intelligence."}</div>
               )}
             </div>
          </div>

          {/* Alert Stream */}
          <div className="flex-1 glass rounded-2xl lg:rounded-3xl p-5 lg:p-6 border-slate-800 flex flex-col overflow-hidden">
             <div className="flex items-center gap-2 text-amber-500 font-black uppercase tracking-widest text-[10px] mb-4 shrink-0">
               <CloudLightning size={14} /> Live Stream
             </div>
             <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-hide">
                {monitoring ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                    <Loader2 size={24} className="animate-spin" />
                    <p className="text-[10px] font-black uppercase">Scanning Regional DOT Data</p>
                  </div>
                ) : disruptions.length > 0 ? disruptions.map((alert, i) => (
                  <div key={i} className={`p-4 rounded-2xl border transition-all animate-in slide-in-from-bottom-2 ${
                    alert.severity === 'high' ? 'bg-red-500/5 border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]' : 
                    alert.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' : 
                    'bg-indigo-500/5 border-indigo-500/20'
                  }`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500">{alert.type}</span>
                      <span className="text-[9px] text-slate-600 font-mono">24.0.0</span>
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-200 mb-1">{alert.title}</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">{alert.summary}</p>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 text-center gap-4 py-8">
                    <Wind size={40} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Active Threats</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainConsole;
