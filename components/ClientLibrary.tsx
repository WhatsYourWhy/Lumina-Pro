import React from 'react';
import { ArrowRight, Briefcase, CheckCircle2, FolderOpen, Plus, Save, Trash2, Users } from 'lucide-react';
import { AppSection, BrandProfile, ClientSnapshot, GlobalIntelState } from '../types';

interface Props {
  brand: BrandProfile;
  intel: GlobalIntelState;
  clients: ClientSnapshot[];
  activeClientId: string | null;
  onSaveClient: () => void;
  onLoadClient: (id: string) => void;
  onDeleteClient: (id: string) => void;
  onNewClient: () => void;
  onNavigate: (section: AppSection) => void;
}

const formatSavedAt = (iso: string) => {
  const date = new Date(iso);
  return isNaN(date.getTime()) ? iso : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

export const summarizeIntel = (intel: GlobalIntelState) => ({
  frameworks: intel.strategyHistory?.length ?? 0,
  drafts: intel.contentDrafts?.length ?? 0,
  hasMarket: !!intel.marketAnalysis,
  hasLogistics: !!intel.logistics
});

const Stat: React.FC<{ label: string; value: string | number; active?: boolean }> = ({ label, value, active = true }) => (
  <div className={`p-3 rounded-xl border ${active ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-slate-900/40 border-slate-800'}`}>
    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    <p className={`text-sm font-bold ${active ? 'text-indigo-300' : 'text-slate-600'}`}>{value}</p>
  </div>
);

const ClientLibrary: React.FC<Props> = ({
  brand,
  intel,
  clients,
  activeClientId,
  onSaveClient,
  onLoadClient,
  onDeleteClient,
  onNewClient,
  onNavigate
}) => {
  const active = summarizeIntel(intel);
  const isSaved = !!activeClientId && clients.some(c => c.id === activeClientId);
  const hasWork = !!brand.name || active.frameworks > 0 || active.drafts > 0 || active.hasMarket || active.hasLogistics;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-5 border-slate-800/50 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400"><Briefcase size={20} /> Active Client</h2>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Everything you generate belongs to this client until you switch.</p>
              </div>
              {isSaved ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400"><CheckCircle2 size={10} /> In library</span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase text-amber-400">Not saved</span>
              )}
            </div>

            <div>
              <p className="text-xl font-black tracking-tight text-white">{brand.name || 'No client selected'}</p>
              <p className="text-xs text-slate-400">{brand.industry || 'Set the client name and industry in Strategy & Frameworks.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat label="Frameworks" value={active.frameworks} active={active.frameworks > 0} />
              <Stat label="Content drafts" value={active.drafts} active={active.drafts > 0} />
              <Stat label="Market brief" value={active.hasMarket ? 'Ready' : 'None'} active={active.hasMarket} />
              <Stat label="Logistics brief" value={active.hasLogistics ? 'Ready' : 'None'} active={active.hasLogistics} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={onSaveClient}
                disabled={!brand.name.trim()}
                title={brand.name.trim() ? 'Save this client to the library' : 'Enter a client name first'}
                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
              >
                <Save size={14} /> {isSaved ? 'Saved (auto-syncing)' : 'Save to library'}
              </button>
              <button
                onClick={onNewClient}
                disabled={!hasWork}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                <Plus size={14} /> New client
              </button>
            </div>
            <button
              onClick={() => onNavigate(AppSection.STRATEGY)}
              className="w-full text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2"
            >
              Open Strategy & Frameworks <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="glass rounded-3xl border-slate-800/50 shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"><Users size={20} /></div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Client Library</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{clients.length} saved</p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {clients.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center opacity-30 text-center space-y-3 py-12">
                  <FolderOpen size={48} className="text-slate-500" />
                  <p className="text-xs font-black uppercase tracking-[0.2em]">No saved clients</p>
                  <p className="text-[11px] max-w-xs">Name a client in Strategy & Frameworks, then save it here to switch between engagements without losing work.</p>
                </div>
              ) : (
                clients.map(client => {
                  const stats = summarizeIntel(client.intel);
                  const isActive = client.id === activeClientId;
                  return (
                    <div
                      key={client.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white truncate">{client.name}</p>
                          {isActive && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500 text-white">Active</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{client.brand.industry || 'Industry not set'} · Saved {formatSavedAt(client.savedAt)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {stats.frameworks} framework{stats.frameworks === 1 ? '' : 's'} · {stats.drafts} draft{stats.drafts === 1 ? '' : 's'}
                          {stats.hasMarket ? ' · Market' : ''}{stats.hasLogistics ? ' · Logistics' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive && (
                          <button
                            onClick={() => onLoadClient(client.id)}
                            title={`Load ${client.name}`}
                            className="px-4 py-2 bg-slate-800 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black transition-all border border-slate-700 hover:border-indigo-500"
                          >
                            Load
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          title={`Delete ${client.name}`}
                          className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-slate-700 hover:border-red-500/40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLibrary;
