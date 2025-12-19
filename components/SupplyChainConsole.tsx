
import React, { useState } from 'react';
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
  AlertCircle,
  Clock
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
}

interface Disruption {
  type: 'weather' | 'logistics' | 'geopolitical';
  title: string;
  severity: 'high' | 'medium' | 'low';
  summary: string;
}

const SupplyChainConsole: React.FC<Props> = ({ brand }) => {
  const [route, setRoute] = useState('');
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [intelligence, setIntelligence] = useState<string | null>(null);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [mapsLinks, setMapsLinks] = useState<GroundingSource[]>([]);

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
        Focus on:
        1. Potential bottlenecks and logistics hubs.
        2. Geographic risks (weather, infrastructure, geopolitical).
        3. Sustainable sourcing opportunities in this region.`,
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
        contents: `Find CURRENT (last 24-48 hours) weather alerts, natural disasters, or major logistical disruptions (port strikes, road closures, etc.) for: "${route}". 
        Return a JSON array of objects with keys: type (weather, logistics, geopolitical), title, severity (high, medium, low), summary.`,
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
    <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full">
      <div className="glass p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Logistics Command Center</h2>
              <p className="text-slate-500 text-sm">Real-time supply chain mapping & disruption monitoring.</p>
            </div>
          </div>
          {route && (
            <div className="flex gap-2">
               <button 
                onClick={checkWeatherAndAlerts}
                disabled={monitoring}
                className="px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/20 transition-all font-bold flex items-center gap-2 text-sm"
              >
                {monitoring ? <Loader2 size={16} className="animate-spin" /> : <CloudLightning size={16} />}
                Check Live Alerts
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Target Region (e.g. 'Suez Canal', 'US Gulf Coast', 'South East Asia')..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-5 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>
          <button 
            onClick={analyzeSupplyChain}
            disabled={loading || !route}
            className="px-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Globe size={20} />}
            Analyze Operations
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0 overflow-hidden">
        {/* Main Analysis Panel */}
        <div className="lg:col-span-2 glass rounded-3xl p-8 overflow-y-auto border-slate-800">
          <div className="flex items-center gap-2 mb-6 text-indigo-400 font-bold uppercase tracking-widest text-xs">
            <AlertTriangle size={16} /> Strategic Assessment
          </div>
          
          {loading ? (
             <div className="space-y-6 animate-pulse">
               <div className="h-8 bg-slate-800 rounded w-1/3"></div>
               <div className="h-4 bg-slate-800 rounded w-full"></div>
               <div className="h-4 bg-slate-800 rounded w-full"></div>
               <div className="h-4 bg-slate-800 rounded w-5/6"></div>
               <div className="h-20 bg-slate-800/50 rounded w-full"></div>
             </div>
          ) : intelligence ? (
            <div className="prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed">
              <div className="whitespace-pre-wrap">{intelligence}</div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-20">
              <Search size={64} className="mb-4" />
              <p className="text-xl font-bold">Operational Insight Engine</p>
              <p className="text-sm">Synthesize complex logistics data into actionable strategy.</p>
            </div>
          )}
        </div>

        {/* Alerts & Disruption Panel */}
        <div className="lg:col-span-1 glass rounded-3xl p-6 flex flex-col border-slate-800">
           <div className="flex items-center gap-2 mb-4 text-amber-500 font-bold uppercase tracking-widest text-xs">
             <CloudLightning size={16} /> Live Disruptions
           </div>
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
              {monitoring && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 size={32} className="animate-spin text-amber-500" />
                  <span className="text-xs text-slate-500">Scanning satellite feeds & news...</span>
                </div>
              )}
              
              {!monitoring && disruptions.length > 0 ? disruptions.map((alert, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${
                  alert.severity === 'high' ? 'bg-red-500/10 border-red-500/30' : 
                  alert.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30' : 
                  'bg-blue-500/10 border-blue-500/30'
                } space-y-2 animate-in slide-in-from-right-4 duration-300`} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-500 text-white' : 
                      alert.severity === 'medium' ? 'bg-amber-500 text-black' : 
                      'bg-blue-500 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock size={10} /> LIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{alert.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-3">{alert.summary}</p>
                </div>
              )) : !monitoring && (
                <div className="text-center py-20 opacity-30 italic text-xs space-y-4">
                  <Wind size={40} className="mx-auto" />
                  <p>No active weather or logistical alerts detected in this region.</p>
                </div>
              )}
           </div>
        </div>

        {/* Resources Panel */}
        <div className="lg:col-span-1 glass rounded-3xl p-6 flex flex-col border-slate-800">
           <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold uppercase tracking-widest text-xs">
             <MapPin size={16} /> Verified Assets
           </div>
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {mapsLinks.map((link: any, i) => (
                <a 
                  key={i} 
                  href={link.uri} 
                  target="_blank" 
                  className="block p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-slate-300 group-hover:text-white line-clamp-2">{link.title || 'Location Node'}</h4>
                    <ExternalLink size={12} className="shrink-0 text-slate-600 group-hover:text-indigo-400" />
                  </div>
                  <div className="mt-2 text-[10px] text-slate-600 truncate font-mono">
                    {new URL(link.uri).hostname}
                  </div>
                </a>
              ))}
              {mapsLinks.length === 0 && !loading && (
                <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl text-center opacity-30 text-xs">
                  Grounding links appear here.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainConsole;
