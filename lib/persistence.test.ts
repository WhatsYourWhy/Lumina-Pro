import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from './supabase';
import {
  OFFLINE_USER_ID,
  clearAllLocalData,
  createBackup,
  createEmptyIntel,
  loadWorkspace,
  normalizeIntel,
  parseBackup,
  readLocalWorkspace,
  saveIntelRemote,
  writeLocalBrand,
  writeLocalIntel
} from './persistence';

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { from: vi.fn() }
}));

const brand = { name: 'Acme', industry: 'Logistics', description: 'Freight', tone: 'Direct' };

describe('persistence: local storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('round-trips brand, intel, clients, and active client id', () => {
    const intel = { ...createEmptyIntel(), marketAnalysis: 'analysis', logisticsRoute: 'A to B' };
    const clients = [{ id: 'c1', name: 'Acme', savedAt: '2026-01-01T00:00:00.000Z', brand, intel }];

    writeLocalBrand('u1', brand, true);
    writeLocalIntel('u1', intel, clients, 'c1', true);

    const local = readLocalWorkspace('u1');
    expect(local.brand).toEqual(brand);
    expect(local.intel?.marketAnalysis).toBe('analysis');
    expect(local.intel?.logisticsRoute).toBe('A to B');
    expect(local.clients).toHaveLength(1);
    expect(local.activeClientId).toBe('c1');
    expect(local.brandPending).toBe(true);
    expect(local.intelPending).toBe(true);
  });

  it('discards unreadable JSON instead of crashing', () => {
    localStorage.setItem('SHANK_OFFLINE_BRAND_u1', '{not json');
    const local = readLocalWorkspace('u1');
    expect(local.brand).toBeNull();
  });

  it('clearAllLocalData removes only workbench keys', () => {
    localStorage.setItem('SHANK_OFFLINE_BRAND_u1', '{}');
    localStorage.setItem('SHANK_OFFLINE_INTEL_u1', '{}');
    localStorage.setItem('unrelated', '1');
    expect(clearAllLocalData()).toBe(2);
    expect(localStorage.getItem('unrelated')).toBe('1');
  });

  it('normalizeIntel fills defaults for older records that lack the new fields', () => {
    const legacy = normalizeIntel({ strategyHistory: [{ type: 'SWOT', timestamp: 't', content: 'c' }], marketAnalysis: 'm', contentDrafts: ['d'], logistics: null });
    expect(legacy.marketSources).toEqual([]);
    expect(legacy.logisticsDisruptions).toEqual([]);
    expect(legacy.marketQuery).toBe('');
    expect(legacy.strategyHistory).toHaveLength(1);
  });

  it('loads the offline user purely from local storage', async () => {
    writeLocalBrand(OFFLINE_USER_ID, brand, false);
    const ws = await loadWorkspace(OFFLINE_USER_ID);
    expect(ws.brand).toEqual(brand);
    expect(ws.source).toBe('local');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('persistence: Supabase', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('prefers pending local edits over remote data', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => table === 'brand_profiles'
            ? { data: { name: 'Remote', industry: 'R', description: 'R', tone: 'R' }, error: null }
            : { data: { strategy_history: [], market_analysis: 'remote analysis', content_drafts: [], logistics: null, workspace_meta: { clients: [], marketQuery: 'remote q' } }, error: null }
        })
      })
    }) as any);

    writeLocalBrand('u2', brand, true);
    const ws = await loadWorkspace('u2');
    expect(ws.brand.name).toBe('Acme');
    expect(ws.intel.marketAnalysis).toBe('remote analysis');
    expect(ws.intel.marketQuery).toBe('remote q');
    expect(ws.source).toBe('remote');
  });

  it('falls back to core columns when workspace_meta does not exist yet', async () => {
    const upsert = vi.fn()
      .mockResolvedValueOnce({ error: { code: 'PGRST204', message: "Could not find the 'workspace_meta' column of 'global_intel' in the schema cache" } })
      .mockResolvedValueOnce({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as any);

    await saveIntelRemote('u3', createEmptyIntel(), [], null);

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[0][0]).toHaveProperty('workspace_meta');
    expect(upsert.mock.calls[1][0]).not.toHaveProperty('workspace_meta');
  });

  it('rethrows unrelated upsert errors', async () => {
    vi.mocked(supabase.from).mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: { code: '42501', message: 'permission denied' } }) } as any);
    await expect(saveIntelRemote('u4', createEmptyIntel(), [], null)).rejects.toMatchObject({ code: '42501' });
  });
});

describe('persistence: backups', () => {
  it('creates and parses a backup file', () => {
    const backup = createBackup(brand, { ...createEmptyIntel(), marketAnalysis: 'x' }, []);
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.brand).toEqual(brand);
    expect(parsed.intel.marketAnalysis).toBe('x');
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('nope')).toThrow(/not valid JSON/);
    expect(() => parseBackup('{"foo":1}')).toThrow(/not a Shank Strategy workspace backup/);
  });
});
