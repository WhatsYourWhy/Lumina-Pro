/**
 * Generated image gallery, stored in the browser's IndexedDB.
 *
 * Images are large (a 16:9 PNG is often 1-2 MB), so they must not travel
 * through the localStorage / Supabase workspace blob: overflowing that path
 * would break saving for everything else. IndexedDB has generous limits and
 * survives reloads. When IndexedDB is unavailable (private mode, tests) an
 * in-memory store keeps the feature working for the session.
 */

export interface GeneratedAsset {
  id: string;
  userId: string;
  clientName: string;
  prompt: string;
  createdAt: string;
  /** data:image/png;base64,... */
  dataUrl: string;
}

export const ASSET_LIMIT_PER_USER = 24;

const DB_NAME = 'shank-strategy-assets';
const DB_VERSION = 1;
const STORE = 'images';

let memoryStore: Map<string, GeneratedAsset> | null = null;

const hasIndexedDb = () => typeof indexedDB !== 'undefined' && indexedDB !== null;

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });

const withStore = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>): Promise<T> => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const result = run(store);
      if (result instanceof IDBRequest) {
        result.onsuccess = () => resolve(result.result as T);
        result.onerror = () => reject(result.error ?? new Error('IndexedDB request failed'));
      } else {
        result.then(resolve, reject);
      }
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    });
  } finally {
    db.close();
  }
};

const memory = (): Map<string, GeneratedAsset> => {
  if (!memoryStore) memoryStore = new Map();
  return memoryStore;
};

const byNewest = (a: GeneratedAsset, b: GeneratedAsset) => b.createdAt.localeCompare(a.createdAt);

export const createAssetId = (): string =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const listAssets = async (userId: string): Promise<GeneratedAsset[]> => {
  if (!hasIndexedDb()) {
    return Array.from(memory().values()).filter(a => a.userId === userId).sort(byNewest);
  }
  try {
    const all = await withStore<GeneratedAsset[]>('readonly', store => store.index('userId').getAll(userId));
    return all.sort(byNewest);
  } catch (err) {
    console.warn('Asset gallery unavailable, falling back to memory', err);
    return Array.from(memory().values()).filter(a => a.userId === userId).sort(byNewest);
  }
};

/** Saves an asset and trims the user's gallery to ASSET_LIMIT_PER_USER, oldest first. */
export const saveAsset = async (asset: GeneratedAsset): Promise<GeneratedAsset[]> => {
  if (!hasIndexedDb()) {
    memory().set(asset.id, asset);
  } else {
    try {
      await withStore('readwrite', store => store.put(asset));
    } catch (err) {
      console.warn('Could not persist asset to IndexedDB, keeping it in memory', err);
      memory().set(asset.id, asset);
    }
  }
  const assets = await listAssets(asset.userId);
  const overflow = assets.slice(ASSET_LIMIT_PER_USER);
  for (const old of overflow) await deleteAsset(old.id);
  return assets.slice(0, ASSET_LIMIT_PER_USER);
};

export const deleteAsset = async (id: string): Promise<void> => {
  memory().delete(id);
  if (!hasIndexedDb()) return;
  try {
    await withStore('readwrite', store => store.delete(id));
  } catch (err) {
    console.warn('Could not delete asset from IndexedDB', err);
  }
};

export const clearAssets = async (userId: string): Promise<void> => {
  const assets = await listAssets(userId);
  for (const asset of assets) await deleteAsset(asset.id);
};

/** Used by tests and by "Clear local cache" to drop everything in this browser. */
export const clearAllAssets = async (): Promise<void> => {
  memoryStore = null;
  if (!hasIndexedDb()) return;
  try {
    await withStore('readwrite', store => store.clear());
  } catch (err) {
    console.warn('Could not clear the asset store', err);
  }
};
