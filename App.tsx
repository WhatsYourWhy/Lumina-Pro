
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
  
  // Persistent Global State
  const [brand, setBrand] = useState<BrandProfile>(() => {
    const saved = localStorage.getItem('lumina_brand_profile');
    return saved ? JSON.parse(saved) : { name: '', industry: '', description: '', tone: '' };
  });

  const [globalIntel, setGlobalIntel] = useState<{
    strategy: string | null;
    marketAnalysis: string | null;
    contentDrafts: string[];
    logistics: string | null;
  }>(() => {
    const saved = localStorage.getItem('lumina_global_intel');
    return saved ? JSON.parse(saved) : { strategy: null, marketAnalysis: null, contentDrafts: [], logistics: null };
  });

  useEffect(() => {
    localStorage.setItem('lumina_brand_profile', JSON.stringify(brand));
  }, [brand]);

  useEffect(() => {
    localStorage.setItem('lumina_global_intel', JSON.stringify(globalIntel));
  }, [globalIntel]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeSection]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const updateIntel = (key: keyof typeof globalIntel, value: any) => {
    setGlobalIntel(prev => ({ ...prev, [key]: value }));
  };

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
      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'} transition-all duration-300 ease-in-out border-r border-slate-800 flex flex-col glass bg-[#020617]/95 lg:bg-transparent`}>
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || window.innerWidth >= 1024) && <h1 className={`text-xl font-bold gradient-text tracking-tight ${!isSidebarOpen && 'lg:hidden'}`}>LUMINA</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-1 hover:bg-slate-800 rounded-md"><X size={20} /></button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${activeSection === item.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'} ${!isSidebarOpen && 'lg:justify-center'}`}>
              <item.icon size={22} strokeWidth={activeSection === item.id ? 2.5 : 2} />
              {(isSidebarOpen || window.innerWidth < 1024) && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 flex items-center px-4 lg:px-8 justify-between z-10 glass shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800 rounded-md"><Menu size={20} /></button>
            <span className="text-slate-200 font-bold">{navItems.find(i => i.id === activeSection)?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            {brand.name && <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-black text-emerald-500 uppercase">{brand.name}</span></div>}
            <button onClick={() => setActiveSection(AppSection.OVERVIEW)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Briefcase size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto h-full">
            {activeSection === AppSection.OVERVIEW && <Overview brand={brand} intel={globalIntel} onNavigate={setActiveSection} />}
            {activeSection === AppSection.STRATEGY && <StrategyBoard brand={brand} setBrand={setBrand} strategy={globalIntel.strategy} setStrategy={(v) => updateIntel('strategy', v)} />}
            {activeSection === AppSection.SUPPLY_CHAIN && <SupplyChainConsole brand={brand} intel={globalIntel.logistics} setIntel={(v) => updateIntel('logistics', v)} />}
            {activeSection === AppSection.CONTENT && <ContentStudio brand={brand} savedPosts={globalIntel.contentDrafts} setSavedPosts={(v) => updateIntel('contentDrafts', v)} />}
            {activeSection === AppSection.VISUALS && <VisualStudio brand={brand} />}
            {activeSection === AppSection.MARKET && <MarketInsights brand={brand} analysis={globalIntel.marketAnalysis} setAnalysis={(v) => updateIntel('marketAnalysis', v)} />}
            {activeSection === AppSection.PITCH && <PitchCoach brand={brand} context={globalIntel.strategy} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
