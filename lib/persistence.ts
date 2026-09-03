import { supabase } from './supabase';
import { BrandProfile, ClientSnapshot, GlobalIntelState, StrategicEntry, WorkspaceBackup } from '../types';

/**
 * Single home for how workspace state is stored.
 *
 * Every user gets an instant localStorage copy (so nothing is lost if the
 * network drops) and, for signed-in users, a debounced Supabase upsert.
 * Key names are unchanged from earlier versions so existing data still loads.
 */

export const OFFLINE_USER_ID = 'offline-local-user';
export const STRATEGY_HISTORY_LIMIT = 50;
export const CONTENT_DRAFT_LIMIT = 30;

export const storageKeys = (userId: string) => ({
  brand: `SHANK_OFFLINE_BRAND_${userId}`,
  intel: `SHANK_OFFLINE_INTEL_${userId}`,
  clients: `SHANK_OFFLINE_CLIENTS_${userId}`,
  activeClient: `SHANK_ACTIVE_CLIENT_${userId}`,
  brandPending: `SHANK_BRAND_PENDING_${userId}`,
  intelPending: `SHANK_INTEL_PENDING_${userId}`
});

export const createEmptyBrand = (): BrandProfile => ({ name: '', industry: '', description: '', tone: '' });

export const createEmptyIntel = (): GlobalIntelState => ({
  strategyHistory: [],
  marketAnalysis: null,
  contentDrafts: [],
  logistics: null,
  marketQuery: '',
  marketSources: [],
  marketDrilldowns: [],
  logisticsRoute: '',
  logisticsDisruptions: []
});

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const normalizeBrand = (raw: unknown): BrandProfile => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    name: asString(source.name),
    industry: asString(source.industry),
    description: asString(source.description),
    tone: asString(source.tone)
  };
};

export const normalizeIntel = (raw: unknown): GlobalIntelState => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    strategyHistory: asArray<StrategicEntry>(source.strategyHistory)
      .filter(entry => entry && typeof entry.content === 'string')
      .slice(0, STRATEGY_HISTORY_LIMIT),
    marketAnalysis: typeof source.marketAnalysis === 'string' ? source.marketAnalysis : null,
    contentDrafts: asArray<string>(source.contentDrafts).filter(d => typeof d === 'string').slice(0, CONTENT_DRAFT_LIMIT),
    logistics: typeof source.logistics === 'string' ? source.logistics : null,
    marketQuery: asString(source.marketQuery),
    marketSources: asArray(source.marketSources),
    marketDrilldowns: asArray<string>(source.marketDrilldowns).filter(d => typeof d === 'string'),
    logisticsRoute: asString(source.logisticsRoute),
    logisticsDisruptions: asArray(source.logisticsDisruptions)
  };
};

export const normalizeClients = (raw: unknown): ClientSnapshot[] =>
  asArray<Record<string, unknown>>(raw)
    .filter(c => c && typeof c === 'object' && typeof c.id === 'string')
    .map(c => ({
      id: c.id as string,
      name: asString(c.name, 'Untitled client'),
      savedAt: asString(c.savedAt, new Date(0).toISOString()),
      brand: normalizeBrand(c.brand),
      intel: normalizeIntel(c.intel)
    }));

const readJson = (key: string): unknown => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Discarding unreadable local data for ${key}`, err);
    return null;
  }
};

// ─── Local storage ───────────────────────────────────────────────────────────

export interface LocalWorkspace {
  brand: BrandProfile | null;
  intel: GlobalIntelState | null;
  clients: ClientSnapshot[];
  activeClientId: string | null;
  brandPending: boolean;
  intelPending: boolean;
}

export const readLocalWorkspace = (userId: string): LocalWorkspace => {
  const keys = storageKeys(userId);
  const rawBrand = readJson(keys.brand);
  const rawIntel = readJson(keys.intel);
  return {
    brand: rawBrand ? normalizeBrand(rawBrand) : null,
    intel: rawIntel ? normalizeIntel(rawIntel) : null,
    clients: normalizeClients(readJson(keys.clients)),
    activeClientId: localStorage.getItem(keys.activeClient) || null,
    brandPending: localStorage.getItem(keys.brandPending) === 'true',
    intelPending: localStorage.getItem(keys.intelPending) === 'true'
  };
};

export const writeLocalBrand = (userId: string, brand: BrandProfile, markPending: boolean) => {
  const keys = storageKeys(userId);
  localStorage.setItem(keys.brand, JSON.stringify(brand));
  if (markPending) localStorage.setItem(keys.brandPending, 'true');
};

export const writeLocalIntel = (
  userId: string,
  intel: GlobalIntelState,
  clients: ClientSnapshot[],
  activeClientId: string | null,
  markPending: boolean
) => {
  const keys = storageKeys(userId);
  localStorage.setItem(keys.intel, JSON.stringify(intel));
  localStorage.setItem(keys.clients, JSON.stringify(clients));
  if (activeClientId) localStorage.setItem(keys.activeClient, activeClientId);
  else localStorage.removeItem(keys.activeClient);
  if (markPending) localStorage.setItem(keys.intelPending, 'true');
};

/** Clears the "pending" flag once a remote write has succeeded. */
export const markSynced = (userId: string, which: 'brand' | 'intel') => {
  const keys = storageKeys(userId);
  localStorage.removeItem(which === 'brand' ? keys.brandPending : keys.intelPending);
};

export const clearLocalWorkspace = (userId: string) => {
  Object.values(storageKeys(userId)).forEach(key => localStorage.removeItem(key));
};

/** Removes every workbench key for every user (Settings > Clear local cache). */
export const clearAllLocalData = (): number => {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('SHANK_')) doomed.push(key);
  }
  doomed.forEach(key => localStorage.removeItem(key));
  return doomed.length;
};

// ─── Supabase ────────────────────────────────────────────────────────────────

const NOT_FOUND = 'PGRST116';
let warnedAboutMetaColumn = false;

const isMissingMetaColumn = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (error.code === 'PGRST204' || error.code === '42703') && message.includes('workspace_meta');
};

const splitIntel = (intel: GlobalIntelState) => {
  const { strategyHistory, marketAnalysis, contentDrafts, logistics, ...meta } = intel;
  return { strategyHistory, marketAnalysis, contentDrafts, logistics, meta };
};

export interface RemoteWorkspace {
  brand: BrandProfile | null;
  intel: GlobalIntelState | null;
  clients: ClientSnapshot[];
  activeClientId: string | null;
}

export const loadRemoteWorkspace = async (userId: string): Promise<RemoteWorkspace> => {
  const [brandRes, intelRes] = await Promise.all([
    supabase.from('brand_profiles').select('*').eq('id', userId).single(),
    supabase.from('global_intel').select('*').eq('id', userId).single()
  ]);
  if (brandRes.error && brandRes.error.code !== NOT_FOUND) throw brandRes.error;
  if (intelRes.error && intelRes.error.code !== NOT_FOUND) throw intelRes.error;

  const meta = (intelRes.data?.workspace_meta && typeof intelRes.data.workspace_meta === 'object')
    ? intelRes.data.workspace_meta as Record<string, unknown>
    : {};

  return {
    brand: brandRes.data ? normalizeBrand(brandRes.data) : null,
    intel: intelRes.data
      ? normalizeIntel({
          strategyHistory: intelRes.data.strategy_history,
          marketAnalysis: intelRes.data.market_analysis,
          contentDrafts: intelRes.data.content_drafts,
          logistics: intelRes.data.logistics,
          ...meta
        })
      : null,
    clients: normalizeClients(meta.clients),
    activeClientId: typeof meta.activeClientId === 'string' ? meta.activeClientId : null
  };
};

export const saveBrandRemote = async (userId: string, brand: BrandProfile) => {
  const { error } = await supabase.from('brand_profiles').upsert({
    id: userId,
    name: brand.name,
    industry: brand.industry,
    description: brand.description,
    tone: brand.tone,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
};

export const saveIntelRemote = async (
  userId: string,
  intel: GlobalIntelState,
  clients: ClientSnapshot[],
  activeClientId: string | null
) => {
  const { strategyHistory, marketAnalysis, contentDrafts, logistics, meta } = splitIntel(intel);
  const row = {
    id: userId,
    strategy_history: strategyHistory,
    market_analysis: marketAnalysis,
    content_drafts: contentDrafts,
    logistics,
    updated_at: new Date().toISOString()
  };

  const withMeta = await supabase.from('global_intel').upsert({ ...row, workspace_meta: { ...meta, clients, activeClientId } });
  if (!withMeta.error) return;

  if (isMissingMetaColumn(withMeta.error)) {
    // Older database without the migration: persist the core columns so nothing is lost.
    if (!warnedAboutMetaColumn) {
      warnedAboutMetaColumn = true;
      console.warn('global_intel.workspace_meta column is missing. Run supabase_migrations/2026-09-03_workspace_meta.sql to sync the client library and section state to the cloud.');
    }
    const fallback = await supabase.from('global_intel').upsert(row);
    if (fallback.error) throw fallback.error;
    return;
  }
  throw withMeta.error;
};

// ─── Combined loader ─────────────────────────────────────────────────────────

export interface LoadedWorkspace {
  brand: BrandProfile;
  intel: GlobalIntelState;
  clients: ClientSnapshot[];
  activeClientId: string | null;
  source: 'remote' | 'local' | 'empty';
}

/** Loads the workspace for a user, preferring unsynced local edits over remote data. */
export const loadWorkspace = async (userId: string): Promise<LoadedWorkspace> => {
  const local = readLocalWorkspace(userId);
  const fromLocal = (): LoadedWorkspace => ({
    brand: local.brand ?? createEmptyBrand(),
    intel: local.intel ?? createEmptyIntel(),
    clients: local.clients,
    activeClientId: local.activeClientId,
    source: local.brand || local.intel ? 'local' : 'empty'
  });

  if (userId === OFFLINE_USER_ID) return fromLocal();

  try {
    const remote = await loadRemoteWorkspace(userId);
    const brand = local.brandPending && local.brand ? local.brand : remote.brand ?? local.brand ?? createEmptyBrand();
    const intel = local.intelPending && local.intel ? local.intel : remote.intel ?? local.intel ?? createEmptyIntel();
    const useLocalIntel = local.intelPending && local.intel;
    const clients = useLocalIntel ? local.clients : (remote.clients.length > 0 ? remote.clients : local.clients);
    const activeClientId = useLocalIntel ? local.activeClientId : (remote.activeClientId ?? local.activeClientId);
    return { brand, intel, clients, activeClientId, source: 'remote' };
  } catch (err) {
    console.error('Failed to load workspace from Supabase, using local copy', err);
    return fromLocal();
  }
};

// ─── Backup files ────────────────────────────────────────────────────────────

export const createBackup = (brand: BrandProfile, intel: GlobalIntelState, clients: ClientSnapshot[]): WorkspaceBackup => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  brand,
  intel,
  clients
});

export const parseBackup = (text: string): WorkspaceBackup => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (!('brand' in source) && !('clients' in source)) {
    throw new Error('That file is not a Shank Strategy workspace backup.');
  }
  return {
    version: 1,
    exportedAt: asString(source.exportedAt, new Date().toISOString()),
    brand: normalizeBrand(source.brand),
    intel: normalizeIntel(source.intel),
    clients: normalizeClients(source.clients)
  };
};

export const createClientId = (): string =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
