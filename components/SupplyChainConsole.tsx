
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrandProfile, GroundingSource } from '../types';
import { 
  Truck, 
  AlertTriangle, 
  Loader2, 
  Globe, 
  Search, 
  CloudLightning, 
  Navigation,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  intel: string | null;
  setIntel: (i: string | null) => void;
}

const SupplyChainConsole: React.FC<Props> = ({ brand, intel, setIntel }) => {
  const [route, setRoute] = useState('');
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [disruptions, setDisruptions] = useState<any[]>([]);

  const analyzeSupplyChain = async () => {
    if (!route) return;
    setLoading(true);
    setIntel(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze logistics and supply chain risks for: "${route}". Context: ${brand.name} in ${brand.industry}.`,
        config: { tools: [{ googleMaps: {} }, { googleSearch: {} }] }
      });
      setIntel(response.text);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = async () => {
    if (!route) return;
    setMonitoring(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find CURRENT disruptions for "${route}". Return JSON array of objects with keys: title, summary, severity.`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      setDisruptions(JSON.parse(response.text));
    } catch (e) {
      console.error(e);
    } finally {
      setMonitoring(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="glass p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <Truck className="text-indigo-400" />
          <h2 className="text-lg font-bold">Logistics Command</h2>
        </div>
        <div className="flex gap-2">
          <input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="Hub or Route..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm" />
          <button onClick={analyzeSupplyChain} className="px-6 bg-slate-800 text-white rounded-xl text-xs font-bold">{loading ? <Loader2 className="animate-spin"/> : <Search size={16}/>} Analyze</button>
          <button onClick={checkAlerts} className="px-6 bg-indigo-500 text-white rounded-xl text-xs font-bold">Scan Live</button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        <div className="lg:col-span-7 flex flex-col glass rounded-3xl p-6 overflow-y-auto">
          <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Operational Summary</h3>
          <div className="text-sm text-slate-400 whitespace-pre-wrap">{intel || "No analysis active."}</div>
        </div>
        <div className="lg:col-span-5 flex flex-col glass rounded-3xl p-6 overflow-y-auto">
          <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Risk Alerts</h3>
          <div className="space-y-3">
            {disruptions.map((d, i) => (
              <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold text-slate-200">{d.title}</h4>
                <p className="text-[10px] text-slate-500">{d.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainConsole;
