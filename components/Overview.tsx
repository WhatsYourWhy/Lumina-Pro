
import React from 'react';
import { BrandProfile, AppSection } from '../types';
import { Cpu, Zap, Globe, Sparkles, Truck, Mic2, ArrowRight, BarChart3 } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  onNavigate?: (section: AppSection) => void;
}

const Overview: React.FC<Props> = ({ brand, onNavigate }) => {
  const steps = [
    { 
      id: AppSection.STRATEGY,
      title: 'Strategic Sync', 
      desc: 'Grounding the model in real company data and generating SCOR/SWOT frameworks.',
      icon: BarChart3,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      status: brand.name ? 'Complete' : 'Pending'
    },
    { 
      id: AppSection.SUPPLY_CHAIN,
      title: 'SC Intelligence', 
      desc: 'Analyzing logistics routes and regional risks using Google Maps grounding.',
      icon: Truck,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      status: 'Ready'
    },
    { 
      id: AppSection.CONTENT,
      title: 'Creative Studio', 
      desc: 'Generating multimodal assets: LinkedIn copy, visuals, and cinematic video.',
      icon: Sparkles,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      status: 'Ready'
    },
    { 
      id: AppSection.PITCH,
      title: 'Voice Coach', 
      desc: 'Practicing complex consulting pitches with real-time AI feedback.',
      icon: Mic2,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      status: 'Ready'
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          The <span className="gradient-text">Supply Chain</span> & Consulting Engine
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Bridging the gap between operational logic and strategic storytelling. 
          Use live data grounding to visualize risks and automate professional frameworks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, i) => (
          <div 
            key={i} 
            className="glass p-8 rounded-3xl border-slate-800 flex flex-col gap-4 relative overflow-hidden group transition-all"
          >
            <div className={`absolute top-0 right-0 p-4 font-bold text-[10px] uppercase tracking-widest ${step.status === 'Complete' ? 'text-emerald-500' : 'text-slate-500'}`}>
              {step.status}
            </div>
            <div className={`w-14 h-14 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
              <step.icon size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
            <button 
              onClick={() => onNavigate?.(step.id)}
              className="mt-4 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider cursor-pointer hover:gap-3 transition-all w-fit active:scale-95"
            >
              Launch Module <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="glass p-10 rounded-[3rem] border-slate-800 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden">
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold">Strategic Nucleus</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                <p className="text-slate-300 text-sm"><span className="text-white font-bold">Operational Visibility:</span> Maps grounding reveals real-time logistics constraints.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                <p className="text-slate-300 text-sm"><span className="text-white font-bold">Consulting Frameworks:</span> SCOR, SWOT, and PESTEL generated with industry accuracy.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <p className="text-slate-300 text-sm"><span className="text-white font-bold">Unified Logic:</span> Every asset is derived from your core operational profile.</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 aspect-square glass rounded-full border-slate-700 flex items-center justify-center relative">
            <div className="absolute inset-0 border-2 border-indigo-500/20 border-dashed rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="text-center space-y-2">
              <div className="text-4xl font-black gradient-text tracking-tighter">OPERATIONS</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Universal Core</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
