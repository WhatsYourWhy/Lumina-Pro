
import React from 'react';
import { BrandProfile, AppSection } from '../types';
import { 
  Zap, 
  Sparkles, 
  Truck, 
  Mic2, 
  ArrowRight, 
  BarChart3, 
  Briefcase,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Target
} from 'lucide-react';

interface Props {
  brand: BrandProfile;
  onNavigate?: (section: AppSection) => void;
}

const Overview: React.FC<Props> = ({ brand, onNavigate }) => {
  const steps = [
    { 
      id: AppSection.STRATEGY,
      title: 'Strategy Hub', 
      desc: 'Ground the consulting engine in SCOR, SWOT, and PESTEL frameworks.',
      icon: BarChart3,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      status: brand.name ? 'Operational' : 'Ready'
    },
    { 
      id: AppSection.SUPPLY_CHAIN,
      title: 'SC Intelligence', 
      desc: 'Real-time mapping of logistics hubs and regional disruption vectors.',
      icon: Truck,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      status: 'Ready'
    },
    { 
      id: AppSection.CONTENT,
      title: 'Creative Studio', 
      desc: 'Multimodal asset generation including LinkedIn copy and 4K commercial reels.',
      icon: Sparkles,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      status: 'Ready'
    },
    { 
      id: AppSection.PITCH,
      title: 'Pitch Mentor', 
      desc: 'Live conversational practice with real-time strategic feedback.',
      icon: Mic2,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      status: 'Ready'
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Platform v2.5 Stable</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[0.9]">
            Consulting <span className="gradient-text">Operationalized.</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-base lg:text-lg leading-relaxed font-medium">
            A unified intelligence suite for modern brand management. 
            Automate operational logic, visualize global risks, and train for the boardroom in one environment.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <button 
              onClick={() => onNavigate?.(AppSection.STRATEGY)}
              className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              Get Started <ChevronRight size={18} />
            </button>
            <button className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold flex items-center gap-3 transition-all border border-slate-700 active:scale-95">
              Watch Demo
            </button>
          </div>
        </div>
        <div className="w-full md:w-80 shrink-0 relative">
           <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full animate-pulse" />
           <div className="relative glass p-8 rounded-[2.5rem] border-slate-700/50 shadow-2xl">
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
                       <ShieldCheck size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grounding</p>
                       <p className="text-sm font-bold">Google Maps Live</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-purple-400 border border-slate-700">
                       <TrendingUp size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analytics</p>
                       <p className="text-sm font-bold">Gemini 3 Flash</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                       <Target size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategy</p>
                       <p className="text-sm font-bold">Deep Reasoning</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <div 
            key={i} 
            className="glass p-8 rounded-[2rem] border-slate-800 flex flex-col gap-5 relative overflow-hidden group transition-all hover:bg-slate-900/40 cursor-default"
          >
            <div className={`absolute top-0 right-0 p-5 font-black text-[9px] uppercase tracking-[0.2em] ${step.status === 'Operational' ? 'text-emerald-500' : 'text-slate-500'}`}>
              {step.status}
            </div>
            <div className={`w-14 h-14 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-lg`}>
              <step.icon size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{step.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">{step.desc}</p>
            </div>
            <button 
              onClick={() => onNavigate?.(step.id)}
              className="mt-2 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:gap-3 transition-all w-fit active:scale-95"
            >
              Launch <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Strategic Briefcase Section */}
      <div className="glass p-8 lg:p-12 rounded-[3rem] border-slate-800 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden shadow-2xl">
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Briefcase size={24} />
               </div>
               <h2 className="text-3xl lg:text-4xl font-black tracking-tighter">The Briefcase</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Intelligence Synthesis</p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your "Briefcase" automatically captures frameworks and insights as you generate them. 
                  Download a unified C-suite readiness report once your strategy is locked.
                </p>
              </div>
              <div className="glass p-6 rounded-2xl border-slate-700 bg-slate-900/50 space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>CASE FILE PROGRESS</span>
                    <span className="text-emerald-500">{brand.name ? '45%' : '0%'}</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-indigo-500 transition-all duration-1000 ${brand.name ? 'w-[45%]' : 'w-0'}`} />
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase border ${brand.name ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>Identity</div>
                    <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase border ${brand.industry ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>Context</div>
                    <div className="px-2 py-1 rounded-md text-[8px] font-black uppercase border bg-slate-800 border-slate-700 text-slate-600">Frameworks</div>
                    <div className="px-2 py-1 rounded-md text-[8px] font-black uppercase border bg-slate-800 border-slate-700 text-slate-600">Assets</div>
                 </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/3 aspect-square glass rounded-full border-slate-700 flex items-center justify-center relative shadow-2xl group">
            <div className="absolute inset-4 border-2 border-indigo-500/20 border-dashed rounded-full animate-[spin_30s_linear_infinite]" />
            <div className="absolute inset-10 border border-purple-500/20 border-dashed rounded-full animate-[spin_20s_linear_infinite_reverse]" />
            <div className="text-center space-y-2 relative z-10 transition-transform group-hover:scale-105 duration-700">
              <div className="text-5xl font-black gradient-text tracking-tighter leading-none">CORE</div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-black">Universal Sync</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
