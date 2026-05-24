
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
