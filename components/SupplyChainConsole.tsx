import React, { useState } from 'react';
import { ai } from '../lib/api';
import { BrandProfile } from '../types';
import toast from 'react-hot-toast';
import { 
  Truck, 
  AlertTriangle, 
  Loader2, 
  Search, 
  Navigation,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  intel: string | null;
  setIntel: (i: string | null) => void;
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
    <div className="space-y-3 text-slate-300">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return <h4 key={index} className="text-[13px] font-bold text-indigo-400 mt-4 mb-1.5">{parseBold(trimmed.replace('### ', ''))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={index} className="text-sm font-black text-white mt-6 mb-2 border-b border-slate-800 pb-1">{parseBold(trimmed.replace('## ', ''))}</h3>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={index} className="list-disc ml-4 mb-1 text-slate-300 leading-relaxed text-xs">
              {parseBold(trimmed.substring(2))}
            </li>
          );
        }
        if (trimmed === '---') {
          return <hr key={index} className="my-4 border-slate-800" />;
        }
        if (trimmed === '') {
          return <div key={index} className="h-0.5" />;
        }
        return <p key={index} className="leading-relaxed mb-1.5 text-xs text-slate-300">{parseBold(line)}</p>;
      })}
    </div>
  );
};

const SupplyChainConsole: React.FC<Props> = ({ brand, intel, setIntel }) => {
  const [route, setRoute] = useState('');
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [disruptions, setDisruptions] = useState<any[]>([]);

  const routePresets = [
    { label: 'Transpacific Marine Corridor', route: 'Shanghai Port (PVG/SGH) to Port of Los Angeles (LAX)' },
    { label: 'Europe Landbridge Rail', route: 'Rotterdam Port to Berlin Distribution Hub via Rail Corridor' },
    { label: 'NAFTA Logistics Corridor', route: 'Laredo Border Crossing to Dallas Fort Worth Logistics Center' }
  ];

  const analyzeSupplyChain = async () => {
    if (!route) return;
    setLoading(true);
    setIntel(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analyze logistics and supply chain risks for: "${route}". Context: ${brand.name || 'Shank Strategy client'} in ${brand.industry || 'Logistics Operations'}. Identify transit bottlenecks, customs clearance nodes, port congestion, and risk mitigation strategies.`,
        config: { tools: [{ googleMaps: {} }, { googleSearch: {} }] }
      });
      setIntel(response.text);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to analyze supply chain logic.");
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = async () => {
    if (!route) return;
    setMonitoring(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Find CURRENT active logistical disruptions or bottlenecks affecting transit around/between: "${route}". Return a JSON array of objects with keys: "title", "summary", "severity" (choose from: high, medium, low). Keep response purely as JSON.`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      setDisruptions(JSON.parse(response.text));
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to scan live alerts.");
    } finally {
      setMonitoring(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-3xl space-y-4 border-slate-800/50 shadow-xl">
          <div className="flex items-center gap-3">
            <Truck className="text-indigo-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider">Logistics Command</h2>
              <p className="text-[10px] text-slate-500 font-medium">Input shipping nodes or corridors to perform risk profiling and real-time mapping.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              value={route} 
              onChange={(e) => setRoute(e.target.value)} 
              placeholder="Transit Hubs, Ports, or Route Corridors..." 
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-slate-200" 
            />
            <button 
              onClick={analyzeSupplyChain} 
              disabled={loading || !route}
              className="px-5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border border-slate-700"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} 
              Analyze
            </button>
            <button 
              onClick={checkAlerts} 
              disabled={monitoring || !route}
              className="px-5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              {monitoring ? <Loader2 className="animate-spin" size={16}/> : <Navigation size={16}/>} 
              Scan Live
            </button>
          </div>
        </div>

        <div className="glass p-5 rounded-3xl border-slate-800/50 space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Route Corridors</h3>
          <div className="flex flex-col gap-2">
            {routePresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => setRoute(preset.route)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[10px] text-slate-400 hover:border-indigo-500/40 hover:text-slate-200 transition-all font-medium truncate"
                title={preset.route}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-[400px]">
        <div className="lg:col-span-7 flex flex-col glass rounded-3xl p-6 border-slate-800/50 shadow-xl overflow-y-auto">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Operational Risk Summary</h3>
            {loading && <span className="text-[9px] font-black text-indigo-400 uppercase animate-pulse">Running GIS Grounding...</span>}
          </div>
          <div className="flex-1 text-slate-400">
            {intel ? (
              <div className="animate-in fade-in duration-500">
                {renderMarkdown(intel)}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20 grayscale">
                <Truck size={48} className="mb-2 text-slate-500" />
                <p className="text-xs font-bold uppercase tracking-wider">Logistics Pipeline Standby</p>
                <p className="text-[10px]">Select a route preset and click Analyze to pull real-time mapping intel.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col glass rounded-3xl p-6 border-slate-800/50 shadow-xl overflow-y-auto">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle size={12}/> Live Logistics Radar
            </h3>
            {monitoring && <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">Scanning Geofences...</span>}
          </div>
          
          <div className="flex-1 space-y-3">
            {disruptions.length > 0 ? (
              <div className="space-y-3 animate-in fade-in duration-500">
                {disruptions.map((d, i) => {
                  const severityColors = 
                    d.severity === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    d.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-sky-500/10 border-sky-500/20 text-sky-400';
                  
                  return (
                    <div key={i} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-slate-200 leading-tight">{d.title}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${severityColors}`}>
                          {d.severity || 'low'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{d.summary}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20 grayscale">
                <AlertCircle size={48} className="mb-2 text-slate-500" />
                <p className="text-xs font-bold uppercase tracking-wider">No active alerts loaded</p>
                <p className="text-[10px]">Select a route and scan live alerts to check active bottlenecks.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainConsole;
