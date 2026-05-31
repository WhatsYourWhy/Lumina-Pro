
export interface BrandProfile {
  name: string;
  industry: string;
  description: string;
  tone: string;
}

export enum AppSection {
  OVERVIEW = 'OVERVIEW',
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

export interface GlobalIntelState {
  strategyHistory: StrategicEntry[];
  marketAnalysis: string | null;
  contentDrafts: string[];
  logistics: string | null;
}

export interface LogisticsDisruption {
  title: string;
  summary: string;
  severity: 'high' | 'medium' | 'low';
}
