import { describe, it, expect, beforeEach } from 'vitest';
import { ASSET_LIMIT_PER_USER, clearAllAssets, clearAssets, deleteAsset, listAssets, saveAsset, GeneratedAsset } from './assets';

// jsdom has no IndexedDB, so these tests exercise the in-memory fallback,
// which shares the trimming and ordering logic with the IndexedDB path.

const make = (id: string, userId = 'u1', createdAt = new Date().toISOString()): GeneratedAsset => ({
  id,
  userId,
  clientName: 'Acme',
  prompt: 'slide background',
  createdAt,
  dataUrl: 'data:image/png;base64,AAAA'
});

describe('asset gallery', () => {
  beforeEach(async () => {
    await clearAllAssets();
  });

  it('saves, lists newest first, deletes, and clears per user', async () => {
    await saveAsset(make('a', 'u1', '2026-01-01T00:00:00.000Z'));
    await saveAsset(make('b', 'u1', '2026-01-02T00:00:00.000Z'));
    await saveAsset(make('other', 'u2'));

    const assets = await listAssets('u1');
    expect(assets.map(a => a.id)).toEqual(['b', 'a']);

    await deleteAsset('b');
    expect((await listAssets('u1')).map(a => a.id)).toEqual(['a']);

    await clearAssets('u1');
    expect(await listAssets('u1')).toEqual([]);
    expect(await listAssets('u2')).toHaveLength(1);
  });

  it('trims the gallery to the per-user limit, dropping the oldest', async () => {
    for (let i = 0; i < ASSET_LIMIT_PER_USER + 3; i++) {
      await saveAsset(make(`asset-${i}`, 'u1', new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString()));
    }
    const assets = await listAssets('u1');
    expect(assets).toHaveLength(ASSET_LIMIT_PER_USER);
    expect(assets[0].id).toBe(`asset-${ASSET_LIMIT_PER_USER + 2}`);
    expect(assets.some(a => a.id === 'asset-0')).toBe(false);
  });
});
