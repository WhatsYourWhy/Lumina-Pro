
import React from 'react';
import { BrandProfile, AppSection } from '../types';
import { 
  Briefcase,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Target,
  Download,
  BarChart3,
  Truck,
  Sparkles,
  Mic2,
  ArrowRight
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  intel: {
    strategy: string | null;
    marketAnalysis: string | null;
    contentDrafts: string[];
    logistics: string | null;
  };
  onNavigate?: (section: AppSection) => void;
}

const Overview: React.FC<Props> = ({ brand, intel, onNavigate }) => {
  const steps = [
    { id: AppSection.STRATEGY, title: 'Strategy Hub', desc: 'SCOR, SWOT, and PESTEL frameworks.', icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: AppSection.SUPPLY_CHAIN, title: 'SC Intelligence', desc: 'Real-time logistics mapping.', icon: Truck, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: AppSection.CONTENT, title: 'Creative Studio', desc: 'Multimodal asset generation.', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: AppSection.PITCH, title: 'Pitch Mentor', desc: 'Live conversational practice.', icon: Mic2, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  const exportBrief = () => {
    const brief = `
LUMINA STRATEGIC BRIEFING
Generated: ${new Date().toLocaleString()}
==========================================

1. BRAND PROFILE
----------------
NAME: ${brand.name || 'N/A'}
INDUSTRY: ${brand.industry || 'N/A'}
MISSION: ${brand.description || 'N/A'}
TONE: ${brand.tone || 'N/A'}

2. STRATEGIC ANALYSIS
---------------------
${intel.strategy || 'No strategy framework generated yet.'}

3. MARKET INTELLIGENCE
----------------------
${intel.marketAnalysis || 'No market research generated yet.'}

4. LOGISTICS & RISK
-------------------
${intel.logistics || 'No supply chain analysis generated yet.'}

5. CONTENT DRAFTS
-----------------
${intel.contentDrafts.length > 0 ? intel.contentDrafts.join('\n\n--- NEXT POST ---\n\n') : 'No creative assets drafted yet.'}

==========================================
CONFIDENTIAL BUSINESS INTELLIGENCE
    `.trim();
    
    const element = document.createElement("a");
    const file = new Blob([brief], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Lumina_Executive_Report_${brand.name || 'Business'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none">Consulting <span className="gradient-text">Operationalized.</span></h1>
          <p className="text-slate-400 text-lg">Unified intelligence for ${brand.name || 'your brand'}. Frameworks, risks, and assets in one environment.</p>
          <div className="flex gap-4">
            <button onClick={() => onNavigate?.(AppSection.STRATEGY)} className="px-8 py-3.5 bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-indigo-500/20">Get Started <ChevronRight size={18} /></button>
            <button onClick={exportBrief} disabled={!brand.name} className="px-8 py-3.5 bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center gap-3 border border-slate-700"><Download size={18} /> Download Briefcase</button>
          </div>
        </div>
        <div className="w-full md:w-80 glass p-8 rounded-[2.5rem] space-y-6">
           <div className="flex items-center gap-4"><ShieldCheck className="text-indigo-400" /><span className="text-sm font-bold">Sync Operational</span></div>
           <div className="flex items-center gap-4"><TrendingUp className="text-purple-400" /><span className="text-sm font-bold">Real-time Grounding</span></div>
           <div className="flex items-center gap-4"><Target className="text-emerald-400" /><span className="text-sm font-bold">Strategic Nucleus</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <div key={i} className="glass p-8 rounded-[2rem] border-slate-800 flex flex-col gap-5 hover:bg-slate-900/40 transition-all">
            <div className={`w-14 h-14 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center`}><step.icon size={28} /></div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="text-slate-400 text-xs">{step.desc}</p>
            </div>
            <button onClick={() => onNavigate?.(step.id)} className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">Launch <ArrowRight size={14}/></button>
          </div>
        ))}
      </div>

      <div className="glass p-8 lg:p-12 rounded-[3rem] border-slate-800 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-black flex items-center gap-4"><Briefcase className="text-indigo-500" /> Strategic Archive</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${intel.strategy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Strategy Data</div>
              <div className={`p-4 rounded-xl border ${intel.marketAnalysis ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Market Analysis</div>
              <div className={`p-4 rounded-xl border ${intel.logistics ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Logistics Nodes</div>
              <div className={`p-4 rounded-xl border ${intel.contentDrafts.length > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>Creative Assets</div>
            </div>
          </div>
          <div className="w-64 h-64 glass rounded-full flex items-center justify-center text-center">
            <div className="space-y-1">
              <div className="text-3xl font-black text-indigo-400">{brand.name ? 'READY' : 'IDLE'}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Universal Intelligence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
