
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Image as ImageIcon, 
  TrendingUp, 
  Mic2, 
  ChevronRight,
  Menu,
  X,
  Activity,
  Truck,
  Briefcase
} from 'lucide-react';
import { AppSection, BrandProfile } from './types';
import StrategyBoard from './components/StrategyBoard';
import ContentStudio from './components/ContentStudio';
import VisualStudio from './components/VisualStudio';
import MarketInsights from './components/MarketInsights';
import PitchCoach from './components/PitchCoach';
import Overview from './components/Overview';
import SupplyChainConsole from './components/SupplyChainConsole';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.OVERVIEW);
  const [brand, setBrand] = useState<BrandProfile>(() => {
    const saved = localStorage.getItem('lumina_brand_profile');
    return saved ? JSON.parse(saved) : {
      name: '',
      industry: '',
      description: '',
      tone: ''
    };
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('lumina_brand_profile', JSON.stringify(brand));
  }, [brand]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeSection]);

  const navItems = [
    { id: AppSection.OVERVIEW, label: 'Engine Overview', icon: Activity },
    { id: AppSection.STRATEGY, label: 'Strategy & Frameworks', icon: LayoutDashboard },
    { id: AppSection.SUPPLY_CHAIN, label: 'SC Intelligence', icon: Truck },
    { id: AppSection.CONTENT, label: 'Content Studio', icon: Sparkles },
    { id: AppSection.VISUALS, label: 'Visual Studio', icon: ImageIcon },
    { id: AppSection.MARKET, label: 'Market Insights', icon: TrendingUp },
    { id: AppSection.PITCH, label: 'Pitch Coach', icon: Mic2 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-slate-200">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[70]
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'} 
        transition-all duration-300 ease-in-out
        border-r border-slate-800 flex flex-col glass bg-[#020617]/95 lg:bg-transparent
      `}>
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <h1 className={`text-xl font-bold gradient-text tracking-tight ${!isSidebarOpen && 'lg:hidden'}`}>LUMINA</h1>
          )}
          {!isSidebarOpen && (
            <div className="hidden lg:flex w-8 h-8 rounded-lg bg-indigo-500 items-center justify-center font-bold mx-auto shadow-lg shadow-indigo-500/20">L</div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-1 hover:bg-slate-800 rounded-md">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group
                ${activeSection === item.id 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }
                ${!isSidebarOpen && 'lg:justify-center'}
              `}
            >
              <item.icon size={22} strokeWidth={activeSection === item.id ? 2.5 : 2} />
              {(isSidebarOpen || window.innerWidth < 1024) && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              {!isSidebarOpen && window.innerWidth >= 1024 && (
                <div className="absolute left-full ml-4 px-3 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] border border-slate-700">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className={`flex items-center gap-3 p-3 rounded-xl ${(isSidebarOpen || window.innerWidth < 1024) ? 'bg-slate-900/50' : 'justify-center'}`}>
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0 shadow-lg">
               {brand.name ? brand.name.substring(0, 2).toUpperCase() : '??'}
             </div>
             {(isSidebarOpen || window.innerWidth < 1024) && (
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold truncate">{brand.name || 'Set Brand'}</p>
                 <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate font-bold">{brand.industry || 'Pending'}</p>
               </div>
             )}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <header className="h-16 border-b border-slate-800 flex items-center px-4 lg:px-8 justify-between z-10 glass shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800 rounded-md">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm lg:text-base">
              <span className="text-slate-500 hidden sm:inline">Suite</span>
              <ChevronRight size={14} className="text-slate-600 hidden sm:inline" />
              <span className="text-slate-200 font-bold truncate max-w-[120px] sm:max-w-none tracking-tight">
                {navItems.find(i => i.id === activeSection)?.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {brand.name && (
               <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{brand.name} Active</span>
               </div>
             )}
            <button 
              onClick={() => setActiveSection(AppSection.OVERVIEW)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all active:scale-95"
              title="Briefcase"
            >
              <Briefcase size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto h-full">
            {activeSection === AppSection.OVERVIEW && <Overview brand={brand} onNavigate={setActiveSection} />}
            {activeSection === AppSection.STRATEGY && <StrategyBoard brand={brand} setBrand={setBrand} />}
            {activeSection === AppSection.SUPPLY_CHAIN && <SupplyChainConsole brand={brand} />}
            {activeSection === AppSection.CONTENT && <ContentStudio brand={brand} />}
            {activeSection === AppSection.VISUALS && <VisualStudio brand={brand} />}
            {activeSection === AppSection.MARKET && <MarketInsights brand={brand} />}
            {activeSection === AppSection.PITCH && <PitchCoach brand={brand} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
