
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
  ChevronRight
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
}

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

  // Load history from localStorage on mount
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

    const updated = [newAnalysis, ...savedAnalyses].slice(0, 10); // Keep last 10
    setSavedAnalyses(updated);
    localStorage.setItem('lumina_sc_history', JSON.stringify(updated));
    alert("Analysis saved to local storage.");
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
  };

  const analyzeSupplyChain = async () => {
    if (!route) return;
    setLoading(true);
    setIntelligence(null);
    setMapsLinks([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze logistics and supply chain risks for this route/region: "${route}". 
        The business is "${brand.name}" in the "${brand.industry}" industry.
        Return detailed logistics nodes and geographic risks.`,
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
        contents: `Find CURRENT disruptions for "${route}". 
        Include National/DOT, Global, and Local alerts.
        Return a JSON array of objects with keys: type, title, severity, summary, source.`,
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
    <div className="space-y-4 lg:space-y-6 flex flex-col h-full animate-in fade-in duration-500 pb-6 lg:pb-0 relative">
      
      {/* Search Header */}
      <div className="glass p-5 lg:p-6 rounded-2xl lg:rounded-3xl space-y-4 border-slate-800 shadow-2xl shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Logistics Command</h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">National & Global Operational Map</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center gap-2 text-xs font-bold"
              title="View History"
            >
              <History size={14} />
              <span className="hidden sm:inline">Archive</span>
            </button>
            <button 
              onClick={() => setShowMap(!showMap)}
              className="hidden lg:flex px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 items-center gap-2 text-xs font-bold"
            >
              <Maximize2 size={14} /> {showMap ? "Hide Map" : "Show Map"}
            </button>
            {intelligence && (
               <button 
                onClick={saveCurrentAnalysis}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 flex items-center gap-2 text-xs font-bold"
              >
                <Bookmark size={14} /> <span className="hidden sm:inline">Save</span>
              </button>
            )}
            {route && (
              <button 
                onClick={checkWeatherAndAlerts}
                disabled={monitoring}
                className="flex-1 sm:flex-none px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-500/20"
              >
                {monitoring ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="white" />}
                Scan Live Alerts
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Enter Hub or Route..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl lg:rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>
          <button 
            onClick={analyzeSupplyChain}
            disabled={loading || !route}
            className="w-full lg:w-auto px-8 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 border border-slate-700 rounded-xl font-bold py-3.5 lg:py-0 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
            Analyze
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 overflow-hidden relative">
        
        {/* History Drawer Overlay */}
        {showHistory && (
          <div className="absolute inset-0 z-50 glass bg-slate-950/90 rounded-3xl p-6 lg:p-10 animate-in fade-in slide-in-from-right-10 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                   <History size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Saved Operations</h3>
                  <p className="text-xs text-slate-500">Access previous route signatures and risk profiles.</p>
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <Maximize2 size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[70%] pr-2">
              {savedAnalyses.map((analysis) => (
                <div 
                  key={analysis.id} 
                  onClick={() => loadAnalysis(analysis)}
                  className="group p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/50 cursor-pointer transition-all relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Navigation size={16} />
                    </div>
                    <button 
                      onClick={(e) => deleteAnalysis(analysis.id, e)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-200 truncate pr-6">{analysis.route}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(analysis.timestamp).toLocaleString()}</p>
                  <div className="mt-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    <span className="flex items-center gap-1"><Zap size={10} className="text-amber-500" /> {analysis.disruptions.length} Alerts</span>
                    <span className="flex items-center gap-1"><MapPin size={10} className="text-indigo-500" /> {analysis.mapsLinks.length} Hubs</span>
                  </div>
                </div>
              ))}
              {savedAnalyses.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30 text-center gap-4">
                  <Bookmark size={48} />
                  <p className="text-sm">No saved operations found. Run an analysis and tap 'Save' to bookmark it.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visual Map Engine */}
        {showMap && (
          <div className="lg:col-span-7 flex flex-col gap-4 min-h-[300px]">
            <div className="flex-1 glass rounded-2xl lg:rounded-3xl border-slate-800 relative overflow-hidden flex items-center justify-center bg-slate-950/50 shadow-inner group">
              {/* Background Map Graphic */}
              <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden flex items-center justify-center">
                 <svg viewBox="0 0 1000 600" className="w-full h-full scale-110">
                   <path d="M150,150 Q400,100 850,200 T900,500" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="5,5" className="animate-[dash_60s_linear_infinite]" />
                   <path d="M50,300 Q200,450 600,400 T950,250" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="5,5" className="animate-[dash_60s_linear_infinite_reverse]" />
                   <circle cx="500" cy="300" r="150" fill="url(#grad1)" opacity="0.1" />
                   <defs>
                     <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
                       <stop offset="0%" stopColor="#6366f1" />
                       <stop offset="100%" stopColor="transparent" />
                     </radialGradient>
                   </defs>
                 </svg>
              </div>

              {/* Data Layers */}
              {loading ? (
                <div className="flex flex-col items-center gap-4 text-center p-8 relative z-10">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Triangulating Hubs</p>
                    <p className="text-[10px] text-slate-500">Mapping geospatial operational nodes...</p>
                  </div>
                </div>
              ) : intelligence ? (
                <div className="absolute inset-0 z-10 p-6 flex items-center justify-center">
                   {/* Dynamic Markers for MapsLinks */}
                   {mapsLinks.length > 0 && mapsLinks.map((link, idx) => (
                      <div 
                        key={idx} 
                        className="absolute animate-in fade-in zoom-in-50 duration-500"
                        style={{ 
                          top: `${20 + (idx * 12) % 60}%`, 
                          left: `${15 + (idx * 17) % 70}%` 
                        }}
                      >
                        <div className="group relative flex items-center justify-center cursor-pointer">
                          <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping absolute opacity-40"></div>
                          <div className="w-3 h-3 bg-indigo-400 rounded-full border-2 border-white/20"></div>
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[10px] font-bold pointer-events-none">
                            {link.title || 'Logistics Node'}
                          </div>
                        </div>
                      </div>
                   ))}

                   {/* Threat Pulse Zones */}
                   {disruptions.filter(d => d.severity === 'high').map((alert, idx) => (
                      <div 
                        key={`alert-${idx}`}
                        className="absolute animate-pulse"
                        style={{ 
                          bottom: `${30 + (idx * 15) % 50}%`, 
                          right: `${20 + (idx * 20) % 60}%` 
                        }}
                      >
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                           <AlertTriangle size={20} className="text-red-500" />
                        </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="text-center space-y-3 opacity-20 relative z-10">
                   <Globe size={48} className="mx-auto mb-4" />
                   <p className="text-xs uppercase font-bold tracking-[0.2em]">Geographic Canvas Ready</p>
                </div>
              )}

              {/* Map Footer Overlays */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                 <div className="glass px-3 py-2 rounded-lg border-slate-800 text-[9px] font-mono text-slate-500 flex flex-col gap-1">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Logistics Node</div>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> High Risk Zone</div>
                 </div>
                 <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                   {route || "No Route Profile"}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Info/Feed */}
        <div className={`${showMap ? 'lg:col-span-5' : 'lg:col-span-12'} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden`}>
          
          {/* Analysis View */}
          <div className="glass rounded-2xl lg:rounded-3xl p-5 lg:p-6 border-slate-800 overflow-y-auto min-h-[250px] lg:h-1/2">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
                 <ShieldCheck size={14} /> Operational Risks
               </div>
               {intelligence && <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase border border-emerald-500/20">Active Session</span>}
             </div>
             {loading ? (
               <div className="space-y-4 animate-pulse">
                 <div className="h-4 bg-slate-800 rounded w-full"></div>
                 <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                 <div className="h-20 bg-slate-800/20 rounded w-full"></div>
               </div>
             ) : (
               <div className="prose prose-invert prose-sm max-w-none text-slate-400 text-xs leading-relaxed">
                 <div className="whitespace-pre-wrap">{intelligence || "Analysis results will appear here after route entry."}</div>
               </div>
             )}
          </div>

          {/* Disruptions Feed */}
          <div className="glass rounded-2xl lg:rounded-3xl p-5 lg:p-6 border-slate-800 overflow-y-auto min-h-[250px] lg:h-1/2 flex flex-col">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-[10px]">
                 <CloudLightning size={14} /> Alert Stream
               </div>
               {monitoring && <Loader2 size={12} className="animate-spin text-slate-500" />}
             </div>
             <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
                {!monitoring && disruptions.length > 0 ? disruptions.map((alert, i) => (
                  <div key={i} className={`p-4 rounded-xl border transition-all ${
                    alert.severity === 'high' ? 'bg-red-500/5 border-red-500/20' : 
                    alert.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' : 
                    'bg-indigo-500/5 border-indigo-500/20'
                  } space-y-2 animate-in slide-in-from-bottom-2`}>
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {alert.type}
                      </span>
                      <span className="text-[8px] text-slate-500 flex items-center gap-1 font-mono uppercase">
                        <Clock size={8} /> LIVE
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">{alert.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{alert.summary}</p>
                  </div>
                )) : !monitoring && (
                  <div className="text-center py-12 opacity-20 italic text-[10px] space-y-4 px-6">
                    <Wind size={20} className="mx-auto" />
                    <p>No active disruptions scanned.</p>
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
