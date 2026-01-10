
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  TrendingUp, 
  Mic2, 
  Settings, 
  ChevronRight,
  Menu,
  X,
  Activity,
  Truck
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
  const [brand, setBrand] = useState<BrandProfile>({
    name: '',
    industry: '',
    description: '',
    tone: ''
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on section change (mobile experience)
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
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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
            <div className="hidden lg:flex w-8 h-8 rounded-lg bg-indigo-500 items-center justify-center font-bold mx-auto">L</div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-1 hover:bg-slate-800 rounded-md">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl transition-all
                ${activeSection === item.id 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }
                ${!isSidebarOpen && 'lg:justify-center'}
              `}
            >
              <item.icon size={22} strokeWidth={activeSection === item.id ? 2.5 : 2} />
              {(isSidebarOpen || window.innerWidth < 1024) && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className={`flex items-center gap-3 p-3 rounded-xl ${(isSidebarOpen || window.innerWidth < 1024) ? 'bg-slate-900/50' : 'justify-center'}`}>
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0">
               {brand.name ? brand.name.substring(0, 2).toUpperCase() : '??'}
             </div>
             {(isSidebarOpen || window.innerWidth < 1024) && (
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold truncate">{brand.name || 'Setup Brand'}</p>
                 <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{brand.industry || 'Unknown'}</p>
               </div>
             )}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <header className="h-16 border-b border-slate-800 flex items-center px-4 lg:px-8 justify-between z-10 glass shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800 rounded-md">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm lg:text-base">
              <span className="text-slate-500 hidden sm:inline">Business</span>
              <ChevronRight size={14} className="text-slate-600 hidden sm:inline" />
              <span className="text-slate-200 font-medium truncate max-w-[120px] sm:max-w-none">
                {navItems.find(i => i.id === activeSection)?.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-3 py-1.5 lg:px-4 lg:py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs lg:text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
              Sync Project
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10">
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
