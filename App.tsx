
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Sparkles, 
  Image as ImageIcon, 
  TrendingUp, 
  ChevronRight,
  Menu,
  X,
  Activity,
  Truck,
  Briefcase,
  Key
} from 'lucide-react';
import { getClientApiKey, setClientApiKey } from './lib/api';
import { AppSection, BrandProfile } from './types';
import StrategyBoard from './components/StrategyBoard';
import ContentStudio from './components/ContentStudio';
import VisualStudio from './components/VisualStudio';
import MarketInsights from './components/MarketInsights';
import Overview from './components/Overview';
import SupplyChainConsole from './components/SupplyChainConsole';
import Auth from './components/Auth';
import ExportPDF from './components/ExportPDF';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

interface StrategicEntry {
  type: string;
  timestamp: string;
  content: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.OVERVIEW);
  
  const [brand, setBrand] = useState<BrandProfile>({ name: '', industry: '', description: '', tone: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getClientApiKey() === 'proxy-secured-key' ? '' : getClientApiKey());

  const [globalIntel, setGlobalIntel] = useState<{
    strategyHistory: StrategicEntry[];
    marketAnalysis: string | null;
    contentDrafts: string[];
    logistics: string | null;
  }>({ strategyHistory: [], marketAnalysis: null, contentDrafts: [], logistics: null });

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) setAuthLoading(false);
    }).catch(err => {
      console.warn("Supabase connection offline. Defaulting to offline mode check.", err);
      setAuthLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Database State when User Logs in
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      
      if (user.id === 'offline-local-user') {
        try {
          const localBrand = localStorage.getItem('SHANK_OFFLINE_BRAND');
          const localIntel = localStorage.getItem('SHANK_OFFLINE_INTEL');
          if (localBrand) setBrand(JSON.parse(localBrand));
          if (localIntel) setGlobalIntel(JSON.parse(localIntel));
          setIsDataLoaded(true);
        } catch (e) {
          console.error("Failed to load offline data", e);
        } finally {
          setAuthLoading(false);
        }
        return;
      }
      
      try {
        const [brandRes, intelRes] = await Promise.all([
          supabase.from('brand_profiles').select('*').eq('id', user.id).single(),
          supabase.from('global_intel').select('*').eq('id', user.id).single()
        ]);

        if (brandRes.data) {
          setBrand({
            name: brandRes.data.name || '',
            industry: brandRes.data.industry || '',
            description: brandRes.data.description || '',
            tone: brandRes.data.tone || ''
          });
        }

        if (intelRes.data) {
          setGlobalIntel({
             strategyHistory: intelRes.data.strategy_history || [],
             marketAnalysis: intelRes.data.market_analysis,
             contentDrafts: intelRes.data.content_drafts || [],
             logistics: intelRes.data.logistics
          });
        }
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Failed to load user data from Supabase, attempting local storage fallback", err);
        const localBrand = localStorage.getItem('SHANK_OFFLINE_BRAND');
        const localIntel = localStorage.getItem('SHANK_OFFLINE_INTEL');
        if (localBrand) setBrand(JSON.parse(localBrand));
        if (localIntel) setGlobalIntel(JSON.parse(localIntel));
        setIsDataLoaded(true);
      } finally {
        setAuthLoading(false);
      }
    }

    if (user) loadUserData();
  }, [user]);

  // Sync state to Database periodically or on critical changes
  useEffect(() => {
    if (!user || authLoading || !isDataLoaded) return;
    
    const timeoutId = setTimeout(async () => {
      if (user.id === 'offline-local-user') {
        localStorage.setItem('SHANK_OFFLINE_BRAND', JSON.stringify(brand));
        return;
      }
      
      try {
        await supabase.from('brand_profiles').upsert({
          id: user.id,
          name: brand.name,
          industry: brand.industry,
          description: brand.description,
          tone: brand.tone,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Supabase brand upsert failed, saving locally...", err);
        localStorage.setItem('SHANK_OFFLINE_BRAND', JSON.stringify(brand));
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timeoutId);
  }, [brand, user, authLoading, isDataLoaded]);

  useEffect(() => {
    if (!user || authLoading || !isDataLoaded) return;
    
    const timeoutId = setTimeout(async () => {
      if (user.id === 'offline-local-user') {
        localStorage.setItem('SHANK_OFFLINE_INTEL', JSON.stringify(globalIntel));
        return;
      }
      
      try {
        await supabase.from('global_intel').upsert({
          id: user.id,
          strategy_history: globalIntel.strategyHistory,
          market_analysis: globalIntel.marketAnalysis,
          content_drafts: globalIntel.contentDrafts,
          logistics: globalIntel.logistics,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Supabase intel upsert failed, saving locally...", err);
        localStorage.setItem('SHANK_OFFLINE_INTEL', JSON.stringify(globalIntel));
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timeoutId);
  }, [globalIntel, user, authLoading, isDataLoaded]);

  const handleLogout = async () => {
    if (user?.id === 'offline-local-user') {
      setUser(null);
      setIsDataLoaded(false);
      return;
    }
    await supabase.auth.signOut();
  };

  const updateIntel = (key: keyof typeof globalIntel, value: any) => {
    setGlobalIntel(prev => ({ ...prev, [key]: value }));
  };

  const addStrategyEntry = (entry: StrategicEntry) => {
    setGlobalIntel(prev => ({
      ...prev,
      strategyHistory: [entry, ...prev.strategyHistory].slice(0, 10) // Keep last 10 deep dives
    }));
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: AppSection.OVERVIEW, label: 'Engine Overview', icon: Activity },
    { id: AppSection.STRATEGY, label: 'Strategy & Frameworks', icon: LayoutDashboard },
    { id: AppSection.SUPPLY_CHAIN, label: 'SC Intelligence', icon: Truck },
    { id: AppSection.CONTENT, label: 'Content Studio', icon: Sparkles },
    { id: AppSection.VISUALS, label: 'Asset Studio', icon: ImageIcon },
    { id: AppSection.MARKET, label: 'Market Insights', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-slate-200">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
      
      {!user ? (
        <Auth 
          onAuthSuccess={() => {}} 
          onOfflineMode={() => {
            setUser({ id: 'offline-local-user', email: 'offline@shankstrategy.com' } as any);
            setIsDataLoaded(true);
            setAuthLoading(false);
          }}
        />
      ) : (
      <>
      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'} transition-all duration-300 ease-in-out border-r border-slate-800 flex flex-col glass bg-[#020617]/95 lg:bg-transparent`}>
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || window.innerWidth >= 1024) && <h1 className={`text-sm font-black tracking-widest text-indigo-400 ${!isSidebarOpen && 'lg:hidden'}`}>SHANK STRATEGY</h1>}
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
            {brand.name && <ExportPDF brand={brand} intel={globalIntel} />}
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400" title="API Settings"><Key size={20} /></button>
            <button onClick={() => setActiveSection(AppSection.OVERVIEW)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400" title="Engine Overview"><Briefcase size={20} /></button>
            <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">Log Out</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto h-full">
            {activeSection === AppSection.OVERVIEW && <Overview brand={brand} intel={globalIntel} onNavigate={setActiveSection} />}
            {activeSection === AppSection.STRATEGY && <StrategyBoard brand={brand} setBrand={setBrand} history={globalIntel.strategyHistory} onNewEntry={addStrategyEntry} />}
            {activeSection === AppSection.SUPPLY_CHAIN && <SupplyChainConsole brand={brand} intel={globalIntel.logistics} setIntel={(v) => updateIntel('logistics', v)} />}
            {activeSection === AppSection.CONTENT && <ContentStudio brand={brand} savedPosts={globalIntel.contentDrafts} setSavedPosts={(v) => updateIntel('contentDrafts', v)} />}
            {activeSection === AppSection.VISUALS && <VisualStudio brand={brand} />}
            {activeSection === AppSection.MARKET && <MarketInsights brand={brand} analysis={globalIntel.marketAnalysis} setAnalysis={(v) => updateIntel('marketAnalysis', v)} />}
          </div>
        </div>

        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md glass p-6 rounded-3xl space-y-6 border border-slate-800/80 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2"><Key className="text-indigo-400" size={18} /> API Key Settings</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Configure your Gemini API key for direct serverless connections.</p>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Google Gemini API Key</label>
                <input 
                  type="password"
                  placeholder={getClientApiKey() === 'proxy-secured-key' ? "Enter API Key (starts with AIza...)" : "••••••••••••••••••••••••••••••••"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 px-4 text-slate-200 text-xs focus:outline-none transition-colors"
                />
                <p className="text-[9px] text-slate-500 leading-relaxed text-left">
                  <strong>Security Notice</strong>: Your API key is stored securely inside your local browser's <code>localStorage</code>. It never touches any third-party servers and is sent directly to Google AI endpoints.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => {
                    setApiKeyInput(getClientApiKey() === 'proxy-secured-key' ? '' : getClientApiKey());
                    setIsSettingsOpen(false);
                  }} 
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setClientApiKey(apiKeyInput);
                    setIsSettingsOpen(false);
                  }} 
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </>
      )}
    </div>
  );
};

export default App;
