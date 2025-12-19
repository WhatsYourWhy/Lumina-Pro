
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    <div className="flex h-screen overflow-hidden bg-[#020617]">
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        transition-all duration-300 ease-in-out
        border-r border-slate-800 flex flex-col glass z-50
      `}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold gradient-text tracking-tight">LUMINA PRO</h1>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold">L</div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded-md">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
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
              `}
            >
              <item.icon size={22} strokeWidth={activeSection === item.id ? 2.5 : 2} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className={`flex items-center gap-3 p-3 rounded-xl ${isSidebarOpen ? 'bg-slate-900/50' : ''}`}>
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-xs overflow-hidden">
               {brand.name ? brand.name.substring(0, 2).toUpperCase() : '??'}
             </div>
             {isSidebarOpen && (
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold truncate">{brand.name || 'Setup Brand'}</p>
                 <p className="text-[10px] text-slate-500 uppercase tracking-wider">{brand.industry || 'Unknown Industry'}</p>
               </div>
             )}
             {isSidebarOpen && <Settings size={16} className="text-slate-500 cursor-pointer hover:text-slate-300" />}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <header className="h-16 border-b border-slate-800 flex items-center px-8 justify-between z-10 glass">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Business</span>
            <ChevronRight size={14} className="text-slate-600" />
            <span className="text-slate-200 font-medium">{navItems.find(i => i.id === activeSection)?.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-px bg-slate-800" />
            <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
              Sync Project
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          {activeSection === AppSection.OVERVIEW && <Overview brand={brand} />}
          {activeSection === AppSection.STRATEGY && <StrategyBoard brand={brand} setBrand={setBrand} />}
          {activeSection === AppSection.SUPPLY_CHAIN && <SupplyChainConsole brand={brand} />}
          {activeSection === AppSection.CONTENT && <ContentStudio brand={brand} />}
          {activeSection === AppSection.VISUALS && <VisualStudio brand={brand} />}
          {activeSection === AppSection.MARKET && <MarketInsights brand={brand} />}
          {activeSection === AppSection.PITCH && <PitchCoach brand={brand} />}
        </div>
      </main>
    </div>
  );
};

export default App;
