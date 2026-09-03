import React from 'react';
import { BrandProfile, AppSection, GlobalIntelState, StorageMode } from '../types';
import { config } from '../config';
import { buildReportMarkdown, reportFilename } from '../lib/report';
import { downloadMarkdown } from '../lib/download';
import toast from 'react-hot-toast';
import {
  Briefcase,
  ChevronRight,
  Cloud,
  HardDrive,
  Download,
  BarChart3,
  Truck,
  Sparkles,
  ImageIcon,
  Users,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  intel: GlobalIntelState;
  clientCount?: number;
  storageMode?: StorageMode;
  onNavigate?: (section: AppSection) => void;
}

const Overview: React.FC<Props> = ({ brand, intel, clientCount = 0, storageMode = 'local', onNavigate }) => {
  const steps = [
    { id: AppSection.STRATEGY, title: 'Strategy Hub', desc: 'SCOR, SWOT, and operations frameworks.', icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: AppSection.SUPPLY_CHAIN, title: 'SC Intelligence', desc: 'Real-time logistics mapping.', icon: Truck, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: AppSection.CONTENT, title: 'Creative Studio', desc: 'Brand copywriting and asset ideas.', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: AppSection.VISUALS, title: 'Asset Studio', desc: 'Commercial branding imagery.', icon: ImageIcon, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  const exportBrief = () => {
    const filename = reportFilename(brand, 'md');
    downloadMarkdown(filename, buildReportMarkdown(brand, intel));
    toast.success(`Exported ${filename}`);
  };

  const history = intel?.strategyHistory || [];
  const drafts = intel?.contentDrafts || [];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[0.9]">Strategy & Operations <span className="gradient-text">Amplified.</span></h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
            Proprietary consulting and logistics workbench for {brand.name || `${config.firm.shortName} clients`}. Build operations frameworks, map transit risks, and draft marketing assets in one environment.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => onNavigate?.(brand.name ? AppSection.STRATEGY : AppSection.CLIENTS)} className="px-8 py-3.5 bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
              {brand.name ? 'Open Strategy Hub' : 'Start a Client'} <ChevronRight size={18} />
            </button>
            <button onClick={exportBrief} disabled={!brand.name} title="Download the full client report as Markdown" className="px-8 py-3.5 bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center gap-3 border border-slate-700 active:scale-95 transition-all">
              <Download size={18} /> Export Briefcase (.md)
            </button>
          </div>
        </div>
        <div className="w-full md:w-80 glass p-8 rounded-[2.5rem] space-y-6 border-slate-800/50 shadow-2xl relative">
           <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full" />
           <div className="relative z-10 space-y-5">
             <div className="flex items-center gap-4">
               {storageMode === 'cloud' ? <Cloud className="text-emerald-400" size={20}/> : <HardDrive className="text-amber-400" size={20}/>}
               <div>
                 <span className="text-sm font-bold block">{storageMode === 'cloud' ? 'Cloud sync active' : 'Local storage only'}</span>
                 <span className="text-[10px] text-slate-500">{storageMode === 'cloud' ? 'Backed up to Supabase and this browser' : 'Export a backup from Settings to keep it safe'}</span>
               </div>
             </div>
             <button onClick={() => onNavigate?.(AppSection.CLIENTS)} className="flex items-center gap-4 text-left w-full group">
               <Users className="text-indigo-400" size={20}/>
               <div>
                 <span className="text-sm font-bold block group-hover:text-indigo-300 transition-colors">{clientCount} saved client{clientCount === 1 ? '' : 's'}</span>
                 <span className="text-[10px] text-slate-500">Open the client library</span>
               </div>
             </button>
             <div className="flex items-center gap-4">
               <Briefcase className="text-purple-400" size={20}/>
               <div>
                 <span className="text-sm font-bold block">{brand.name || 'No active client'}</span>
                 <span className="text-[10px] text-slate-500">{brand.industry || 'Set a client in Strategy Hub'}</span>
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <div key={i} className="glass p-8 rounded-[2rem] border-slate-800/50 flex flex-col gap-5 hover:bg-slate-900/40 transition-all group cursor-pointer shadow-lg" onClick={() => onNavigate?.(step.id)}>
            <div className={`w-14 h-14 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-sm`}><step.icon size={28} /></div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed font-medium">{step.desc}</p>
            </div>
            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-3 transition-all mt-auto">Launch <ArrowRight size={14}/></div>
          </div>
        ))}
      </div>

      <div className="glass p-8 lg:p-12 rounded-[3rem] border-slate-800/80 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${brand.name ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
              <div className={`w-1 h-1 rounded-full ${brand.name ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              {brand.name ? 'Session Live' : 'Standby'}
           </div>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-8">
            <h2 className="text-3xl font-black flex items-center gap-4"><Briefcase className="text-indigo-500" /> Strategic Briefcase</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Framework Intelligence</p>
                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.slice(0, 3).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <CheckCircle2 size={14} className="text-emerald-500" /> {h.type}
                      </div>
                    ))}
                    {history.length > 3 && <p className="text-[9px] text-slate-500 pl-6">+ {history.length - 3} more frameworks</p>}
                  </div>
                ) : <p className="text-xs text-slate-600 italic">No frameworks analyzed yet.</p>}
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Multimodal Assets</p>
                <div className="flex flex-wrap gap-2">
                   <div className={`px-2 py-1 rounded text-[9px] font-black border uppercase transition-colors ${intel?.marketAnalysis ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>Market</div>
                   <div className={`px-2 py-1 rounded text-[9px] font-black border uppercase transition-colors ${intel?.logistics ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>Logistics</div>
                   <div className={`px-2 py-1 rounded text-[9px] font-black border uppercase transition-colors ${drafts.length > 0 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>Content{drafts.length > 0 ? ` (${drafts.length})` : ''}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-64 h-64 glass rounded-full flex items-center justify-center text-center relative group shadow-inner">
            <div className="absolute inset-2 border-2 border-indigo-500/10 border-dashed rounded-full animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-8 border border-purple-500/10 border-dashed rounded-full animate-[spin_30s_linear_infinite_reverse]" />
            <div className="space-y-1 relative z-10 transition-transform group-hover:scale-110 duration-700">
              <div className={`text-3xl font-black tracking-tighter ${brand.name ? 'text-indigo-400' : 'text-slate-800'}`}>{brand.name ? 'SYNC' : 'IDLE'}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Universal Core</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
