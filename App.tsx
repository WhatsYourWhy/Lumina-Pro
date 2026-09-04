import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  LayoutDashboard,
  Sparkles,
  Image as ImageIcon,
  TrendingUp,
  Menu,
  X,
  Activity,
  Truck,
  Settings,
  Users,
  Cloud,
  HardDrive
} from 'lucide-react';
import { AppSection, BrandProfile, StrategicEntry, GlobalIntelState, ClientSnapshot, StorageMode } from './types';
import StrategyBoard from './components/StrategyBoard';
import ContentStudio from './components/ContentStudio';
import VisualStudio from './components/VisualStudio';
import MarketInsights from './components/MarketInsights';
import Overview from './components/Overview';
import SupplyChainConsole from './components/SupplyChainConsole';
import ClientLibrary from './components/ClientLibrary';
import SettingsModal from './components/SettingsModal';
import Auth from './components/Auth';
import ExportPDF from './components/ExportPDF';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  OFFLINE_USER_ID,
  STRATEGY_HISTORY_LIMIT,
  CONTENT_DRAFT_LIMIT,
  createEmptyBrand,
  createEmptyIntel,
  loadWorkspace,
  writeLocalBrand,
  writeLocalIntel,
  saveBrandRemote,
  saveIntelRemote,
  markSynced,
  clearAllLocalData,
  createBackup,
  parseBackup,
  createClientId
} from './lib/persistence';
import { downloadJson, safeFilename } from './lib/download';
import { clearAllAssets } from './lib/assets';
import type { User } from '@supabase/supabase-js';

const SYNC_DEBOUNCE_MS = 1500;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.OVERVIEW);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [brand, setBrand] = useState<BrandProfile>(createEmptyBrand());
  const [globalIntel, setGlobalIntel] = useState<GlobalIntelState>(createEmptyIntel());
  const [clients, setClients] = useState<ClientSnapshot[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  const isOfflineUser = user?.id === OFFLINE_USER_ID;
  const storageMode: StorageMode = user && !isOfflineUser && isSupabaseConfigured ? 'cloud' : 'local';

  const resetClientState = useCallback(() => {
    setBrand(createEmptyBrand());
    setGlobalIntel(createEmptyIntel());
    setClients([]);
    setActiveClientId(null);
    setIsDataLoaded(false);
  }, []);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) setAuthLoading(false);
    }).catch(err => {
      console.warn("Supabase connection offline. Defaulting to offline mode check.", err);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) resetClientState();
    });

    return () => subscription.unsubscribe();
  }, [resetClientState]);

  // ─── Load workspace when a user appears ────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const userId = user.id;

    (async () => {
      try {
        const workspace = await loadWorkspace(userId);
        if (cancelled) return;
        setBrand(workspace.brand);
        setGlobalIntel(workspace.intel);
        setClients(workspace.clients);
        setActiveClientId(workspace.activeClientId);
        setIsDataLoaded(true);
        if (workspace.source === 'local' && userId !== OFFLINE_USER_ID) {
          toast('Loaded from the local backup. Cloud sync will retry automatically.', { icon: '⚠️' });
        }
      } catch (err) {
        console.error('Failed to load workspace', err);
        if (!cancelled) {
          setBrand(createEmptyBrand());
          setGlobalIntel(createEmptyIntel());
          setIsDataLoaded(true);
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ─── Persist brand: instant local copy, debounced cloud upsert ─────────────
  useEffect(() => {
    if (!user || !isDataLoaded) return;
    const userId = user.id;
    writeLocalBrand(userId, brand, storageMode === 'cloud');
    if (storageMode !== 'cloud') return;

    const timeoutId = setTimeout(async () => {
      try {
        await saveBrandRemote(userId, brand);
        markSynced(userId, 'brand');
      } catch (err) {
        console.warn("Supabase brand upsert failed, keeping local pending changes...", err);
      }
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [brand, user, isDataLoaded, storageMode]);

  // ─── Persist intel + client library the same way ───────────────────────────
  useEffect(() => {
    if (!user || !isDataLoaded) return;
    const userId = user.id;
    writeLocalIntel(userId, globalIntel, clients, activeClientId, storageMode === 'cloud');
    if (storageMode !== 'cloud') return;

    const timeoutId = setTimeout(async () => {
      try {
        await saveIntelRemote(userId, globalIntel, clients, activeClientId);
        markSynced(userId, 'intel');
      } catch (err) {
        console.warn("Supabase intel upsert failed, keeping local pending changes...", err);
      }
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [globalIntel, clients, activeClientId, user, isDataLoaded, storageMode]);

  // ─── Keep the active client's library entry in sync with live edits ────────
  useEffect(() => {
    if (!isDataLoaded || !activeClientId) return;
    setClients(prev => {
      const index = prev.findIndex(c => c.id === activeClientId);
      if (index < 0) return prev;
      const current = prev[index];
      if (JSON.stringify(current.brand) === JSON.stringify(brand) && JSON.stringify(current.intel) === JSON.stringify(globalIntel)) {
        return prev;
      }
      const next = [...prev];
      next[index] = {
        ...current,
        name: brand.name.trim() || current.name,
        brand,
        intel: globalIntel,
        savedAt: new Date().toISOString()
      };
      return next;
    });
  }, [brand, globalIntel, activeClientId, isDataLoaded]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!isOfflineUser) {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Supabase sign out failed, signing out locally anyway', error);
    }
    resetClientState();
    setUser(null);
    setActiveSection(AppSection.OVERVIEW);
  };

  const patchIntel = useCallback((patch: Partial<GlobalIntelState>) => {
    setGlobalIntel(prev => ({ ...prev, ...patch }));
  }, []);

  const addStrategyEntry = (entry: StrategicEntry) => {
    setGlobalIntel(prev => ({
      ...prev,
      strategyHistory: [entry, ...prev.strategyHistory].slice(0, STRATEGY_HISTORY_LIMIT)
    }));
  };

  const deleteStrategyEntry = (index: number) => {
    setGlobalIntel(prev => ({
      ...prev,
      strategyHistory: prev.strategyHistory.filter((_, i) => i !== index)
    }));
  };

  const clearStrategyHistory = () => patchIntel({ strategyHistory: [] });

  const setContentDrafts = (drafts: string[]) => patchIntel({ contentDrafts: drafts.slice(0, CONTENT_DRAFT_LIMIT) });

  const saveActiveClient = () => {
    const name = brand.name.trim();
    if (!name) {
      toast.error('Give the client a name first (Strategy & Frameworks > Client Config).');
      return;
    }
    const id = activeClientId ?? createClientId();
    const snapshot: ClientSnapshot = { id, name, savedAt: new Date().toISOString(), brand, intel: globalIntel };
    setClients(prev => {
      const index = prev.findIndex(c => c.id === id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = snapshot;
        return next;
      }
      return [snapshot, ...prev];
    });
    setActiveClientId(id);
    toast.success(`${name} saved to the client library.`);
  };

  const loadClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    const unsaved = !activeClientId && (brand.name.trim() || globalIntel.strategyHistory.length > 0 || globalIntel.contentDrafts.length > 0 || globalIntel.marketAnalysis || globalIntel.logistics);
    if (unsaved && !window.confirm(`Switch to ${client.name}? The current unsaved workspace will be replaced. Save it to the library first if you want to keep it.`)) {
      return;
    }
    setBrand(client.brand);
    setGlobalIntel(client.intel);
    setActiveClientId(client.id);
    toast.success(`Loaded ${client.name}.`);
  };

  const deleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    if (!window.confirm(`Delete ${client.name} from the library? The active workspace stays open, but this saved copy cannot be recovered.`)) return;
    setClients(prev => prev.filter(c => c.id !== id));
    if (activeClientId === id) setActiveClientId(null);
    toast.success(`Deleted ${client.name}.`);
  };

  const startNewClient = () => {
    if (!window.confirm(activeClientId
      ? 'Start a new client? The current client stays saved in the library.'
      : 'Start a new client? The current workspace has not been saved to the library and will be cleared.')) {
      return;
    }
    setBrand(createEmptyBrand());
    setGlobalIntel(createEmptyIntel());
    setActiveClientId(null);
    setActiveSection(AppSection.STRATEGY);
    toast.success('Fresh workspace ready. Enter the new client name to begin.');
  };

  const resetWorkspace = () => {
    if (!window.confirm('Reset the active workspace? This clears the client profile and every brief, draft, and analysis. Saved clients in the library are kept.')) return;
    setBrand(createEmptyBrand());
    setGlobalIntel(createEmptyIntel());
    setActiveClientId(null);
    setIsSettingsOpen(false);
    setActiveSection(AppSection.OVERVIEW);
    toast.success('Workspace reset.');
  };

  const clearLocalCache = async () => {
    if (!window.confirm('Clear every copy stored in this browser and sign out? Cloud data is untouched. Offline-only data will be lost unless you exported a backup.')) return;
    const removed = clearAllLocalData();
    await clearAllAssets();
    setIsSettingsOpen(false);
    toast.success(`Cleared ${removed} local record${removed === 1 ? '' : 's'}.`);
    await handleLogout();
  };

  const exportBackup = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `shank_workspace_backup_${safeFilename(brand.name, 'all')}_${stamp}.json`;
    downloadJson(filename, createBackup(brand, globalIntel, clients));
    toast.success(`Exported ${filename}`);
  };

  const importBackup = async (file: File) => {
    try {
      const backup = parseBackup(await file.text());
      const when = new Date(backup.exportedAt);
      const label = isNaN(when.getTime()) ? 'this backup' : `the backup from ${when.toLocaleString()}`;
      if (!window.confirm(`Restore ${label}? The active workspace will be replaced and ${backup.clients.length} saved client${backup.clients.length === 1 ? '' : 's'} merged into the library.`)) return;
      setBrand(backup.brand);
      setGlobalIntel(backup.intel);
      setClients(prev => {
        const merged = new Map(prev.map(c => [c.id, c]));
        backup.clients.forEach(c => merged.set(c.id, c));
        return Array.from(merged.values());
      });
      setActiveClientId(null);
      setIsSettingsOpen(false);
      toast.success('Backup restored.');
    } catch (err: any) {
      console.error('Backup import failed', err);
      toast.error(err?.message || 'Could not read that backup file.');
    }
  };

  const navItems = useMemo(() => [
    { id: AppSection.OVERVIEW, label: 'Engine Overview', icon: Activity },
    { id: AppSection.CLIENTS, label: 'Clients', icon: Users },
    { id: AppSection.STRATEGY, label: 'Strategy & Frameworks', icon: LayoutDashboard },
    { id: AppSection.SUPPLY_CHAIN, label: 'SC Intelligence', icon: Truck },
    { id: AppSection.CONTENT, label: 'Content Studio', icon: Sparkles },
    { id: AppSection.VISUALS, label: 'Asset Studio', icon: ImageIcon },
    { id: AppSection.MARKET, label: 'Market Insights', icon: TrendingUp },
  ], []);

  const isActiveClientSaved = !!activeClientId && clients.some(c => c.id === activeClientId);

  if (user && authLoading) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-4">
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
            <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={24} />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mt-2 animate-pulse">Initializing Operations Core</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-slate-200">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />

      {!user ? (
        <Auth
          onAuthSuccess={() => {}}
          onOfflineMode={() => {
            setUser({ id: OFFLINE_USER_ID, email: 'offline@shankstrategy.com' } as any);
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
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setIsSidebarOpen(false); }}
              title={item.label}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${activeSection === item.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'} ${!isSidebarOpen && 'lg:justify-center'}`}
            >
              <item.icon size={22} strokeWidth={activeSection === item.id ? 2.5 : 2} />
              {(isSidebarOpen || window.innerWidth < 1024) && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className={`p-4 border-t border-slate-800 text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 ${!isSidebarOpen && 'lg:justify-center'}`} title={storageMode === 'cloud' ? 'Cloud sync with local backup' : 'Stored in this browser only'}>
          {storageMode === 'cloud' ? <Cloud size={14} className="text-emerald-400" /> : <HardDrive size={14} className="text-amber-400" />}
          {(isSidebarOpen || window.innerWidth < 1024) && <span>{storageMode === 'cloud' ? 'Cloud sync' : 'Local only'}</span>}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 flex items-center px-4 lg:px-8 justify-between z-10 glass shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800 rounded-md"><Menu size={20} /></button>
            <span className="text-slate-200 font-bold truncate">{navItems.find(i => i.id === activeSection)?.label}</span>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {brand.name && (
              <button
                onClick={() => setActiveSection(AppSection.CLIENTS)}
                title={isActiveClientSaved ? 'Active client (saved in library)' : 'Active client (not yet saved to library)'}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isActiveClientSaved ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isActiveClientSaved ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                <span className={`text-[10px] font-black uppercase max-w-[160px] truncate ${isActiveClientSaved ? 'text-emerald-500' : 'text-amber-400'}`}>{brand.name}</span>
              </button>
            )}
            {brand.name && <ExportPDF brand={brand} intel={globalIntel} userId={user.id} />}
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400" title="Settings"><Settings size={20} /></button>
            <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">Log Out</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto h-full">
            {activeSection === AppSection.OVERVIEW && (
              <Overview brand={brand} intel={globalIntel} clientCount={clients.length} storageMode={storageMode} onNavigate={setActiveSection} />
            )}
            {activeSection === AppSection.CLIENTS && (
              <ClientLibrary
                brand={brand}
                intel={globalIntel}
                clients={clients}
                activeClientId={activeClientId}
                onSaveClient={saveActiveClient}
                onLoadClient={loadClient}
                onDeleteClient={deleteClient}
                onNewClient={startNewClient}
                onNavigate={setActiveSection}
              />
            )}
            {activeSection === AppSection.STRATEGY && (
              <StrategyBoard
                brand={brand}
                setBrand={setBrand}
                history={globalIntel.strategyHistory}
                onNewEntry={addStrategyEntry}
                onDeleteEntry={deleteStrategyEntry}
                onClearHistory={clearStrategyHistory}
              />
            )}
            {activeSection === AppSection.SUPPLY_CHAIN && (
              <SupplyChainConsole brand={brand} intel={globalIntel} onUpdate={patchIntel} />
            )}
            {activeSection === AppSection.CONTENT && (
              <ContentStudio brand={brand} savedPosts={globalIntel.contentDrafts} setSavedPosts={setContentDrafts} />
            )}
            {activeSection === AppSection.VISUALS && (
              <VisualStudio brand={brand} userId={user.id} />
            )}
            {activeSection === AppSection.MARKET && (
              <MarketInsights brand={brand} intel={globalIntel} onUpdate={patchIntel} />
            )}
          </div>
        </div>

        <SettingsModal
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          storageMode={storageMode}
          userEmail={isOfflineUser ? null : user.email}
          clientCount={clients.length}
          onResetWorkspace={resetWorkspace}
          onClearLocalCache={clearLocalCache}
          onExportBackup={exportBackup}
          onImportBackup={importBackup}
        />
      </main>
      </>
      )}
    </div>
  );
};

export default App;
