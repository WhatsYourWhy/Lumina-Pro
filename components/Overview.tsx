
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
    strategyHistory: { type: string; timestamp: string; content: string }[];
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
    const timestamp = new Date().toLocaleString();
    const strategySection = intel.strategyHistory.length > 0 
      ? intel.strategyHistory.map(h => `[${h.timestamp}] ANALYSIS TYPE: ${h.type}\n------------------------------------------\n${h.content}\n`).join('\n\n')
      : 'No strategy framework generated yet.';

    const report = `
LUMINA PRO: EXECUTIVE STRATEGIC BRIEFING
==========================================
Report Date: ${timestamp}
Project: ${brand.name || 'INTERNAL PROJECT'}
Status: CONFIDENTIAL | FOR INTERNAL USE ONLY

1. CORPORATE IDENTITY
---------------------
Entity Name: ${brand.name || 'N/A'}
Industry Sector: ${brand.industry || 'N/A'}
Mission/Vision: ${brand.description || 'N/A'}
Brand Voice: ${brand.tone || 'N/A'}

2. STRATEGIC FRAMEWORKS & LOGIC
-------------------------------
${strategySection}

3. MARKET INTELLIGENCE & EXTERNAL FORCES
----------------------------------------
${intel.marketAnalysis || 'Research not yet performed.'}

4. OPERATIONAL INFRASTRUCTURE & LOGISTICS
-----------------------------------------
${intel.logistics || 'Supply chain mapping not yet initiated.'}

5. CREATIVE ASSETS & CONTENT DRAFTS
-----------------------------------
${intel.contentDrafts.length > 0 
  ? intel.contentDrafts.map((post, i) => `[DRAFT ${i+1}]\n${post}`).join('\n\n---\n\n') 
  : 'Creative studio drafts empty.'}

==========================================
DOCUMENT END
Lumina AI Operating System v2.5
    `.trim();
    
    const element = document.createElement("a");
    const file = new Blob([report], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Lumina_Executive_Brief_${brand.name.replace(/\s+/g, '_') || 'Business'}.txt`;
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
            <button onClick={() => onNavigate?.(AppSection.STRATEGY)} className="px-8 py-3.5 bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">Get Started <ChevronRight size={18} /></button>
            <button onClick={exportBrief} disabled={!brand.name} className="px-8 py-3.5 bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center gap-3 border border-slate-700 active:scale-95 transition-all"><Download size={18} /> Download Briefcase</button>
          </div>
        </div>
        <div className="w-full md:w-80 glass p-8 rounded-[2.5rem] space-y-6 border-slate-800/50 shadow-2xl">
           <div className="flex items-center gap-4"><ShieldCheck className="text-indigo-400" /><span className="text-sm font-bold">Sync Operational</span></div>
           <div className="flex items-center gap-4"><TrendingUp className="text-purple-400" /><span className="text-sm font-bold">Real-time Grounding</span></div>
           <div className="flex items-center gap-4"><Target className="text-emerald-400" /><span className="text-sm font-bold">Strategic Nucleus</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <div key={i} className="glass p-8 rounded-[2rem] border-slate-800 flex flex-col gap-5 hover:bg-slate-900/40 transition-all group">
            <div className={`w-14 h-14 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}><step.icon size={28} /></div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
            </div>
            <button onClick={() => onNavigate?.(step.id)} className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all">Launch <ArrowRight size={14}/></button>
          </div>
        ))}
      </div>

      <div className="glass p-8 lg:p-12 rounded-[3rem] border-slate-800 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${brand.name ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
              <div className={`w-1 h-1 rounded-full ${brand.name ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              {brand.name ? 'Active Intel Session' : 'Standby'}
           </div>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-black flex items-center gap-4"><Briefcase className="text-indigo-500" /> Strategic Archive</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border transition-all ${intel.strategyHistory.length > 0 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Logic Nodes</p>
                <p className="text-lg font-bold">{intel.strategyHistory.length}</p>
              </div>
              <div className={`p-5 rounded-2xl border transition-all ${intel.marketAnalysis ? 'bg-purple-500/10 border-purple-500/30 text-purple-100' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Market Intel</p>
                <p className="text-lg font-bold">{intel.marketAnalysis ? 'Captured' : 'Pending'}</p>
              </div>
              <div className={`p-5 rounded-2xl border transition-all ${intel.logistics ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Risk Vectors</p>
                <p className="text-lg font-bold">{intel.logistics ? 'Mapped' : 'Empty'}</p>
              </div>
              <div className={`p-5 rounded-2xl border transition-all ${intel.contentDrafts.length > 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-100' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Asset Pipeline</p>
                <p className="text-lg font-bold">{intel.contentDrafts.length}</p>
              </div>
            </div>
          </div>
          <div className="w-64 h-64 glass rounded-full flex items-center justify-center text-center relative group">
            <div className="absolute inset-2 border-2 border-indigo-500/20 border-dashed rounded-full animate-[spin_40s_linear_infinite]" />
            <div className="space-y-1 relative z-10 transition-transform group-hover:scale-110 duration-700">
              <div className={`text-3xl font-black tracking-tighter ${brand.name ? 'text-indigo-400' : 'text-slate-700'}`}>{brand.name ? 'CORE ACTIVE' : 'SYSTEM IDLE'}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Neural Bridge</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
