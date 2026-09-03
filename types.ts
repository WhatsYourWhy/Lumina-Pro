export interface BrandProfile {
  name: string;
  industry: string;
  description: string;
  tone: string;
}

export enum AppSection {
  OVERVIEW = 'OVERVIEW',
  CLIENTS = 'CLIENTS',
  STRATEGY = 'STRATEGY',
  CONTENT = 'CONTENT',
  VISUALS = 'VISUALS',
  MARKET = 'MARKET',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN'
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface StrategicEntry {
  type: string;
  timestamp: string;
  content: string;
}

export interface LogisticsDisruption {
  title: string;
  summary: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Everything the workbench knows about the active client.
 * The first four fields map to dedicated Supabase columns; the optional
 * fields are stored together in the `workspace_meta` jsonb column so that
 * section state (queries, sources, live alerts) survives navigation and reloads.
 */
export interface GlobalIntelState {
  strategyHistory: StrategicEntry[];
  marketAnalysis: string | null;
  contentDrafts: string[];
  logistics: string | null;
  marketQuery?: string;
  marketSources?: GroundingSource[];
  marketDrilldowns?: string[];
  logisticsRoute?: string;
  logisticsDisruptions?: LogisticsDisruption[];
}

/** A saved client: a frozen copy of the brand profile and its intel. */
export interface ClientSnapshot {
  id: string;
  name: string;
  savedAt: string;
  brand: BrandProfile;
  intel: GlobalIntelState;
}

export type StorageMode = 'cloud' | 'local';

/** Shape of a workspace backup file (Settings > Export backup). */
export interface WorkspaceBackup {
  version: 1;
  exportedAt: string;
  brand: BrandProfile;
  intel: GlobalIntelState;
  clients: ClientSnapshot[];
}
