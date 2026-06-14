// src/lib/offline/offlineStorage.ts

export interface PendingAction {
  id: string;
  type: 'create_order' | 'update_menu' | 'delete_menu_item' | 'update_profile';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

export interface CachedData {
  key: string;
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

class OfflineStorage {
  private dbName = 'QuickBiteOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve();
    }
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          console.error("IndexedDB error:", request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('pendingActions')) {
            const pendingStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
            pendingStore.createIndex('type', 'type', { unique: false });
            pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!db.objectStoreNames.contains('cachedData')) {
            const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
            cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          }
        };
      });
    }
    return this.initPromise;
  }

  private async getStore(
    storeName: 'pendingActions' | 'cachedData',
    mode: IDBTransactionMode
  ): Promise<IDBObjectStore | null> {
    await this.init();
    if (!this.db) return null;
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  async addPendingAction(
    action: Omit<PendingAction, 'id' | 'timestamp'>
  ): Promise<string> {
    const store = await this.getStore('pendingActions', 'readwrite');
    if (!store) throw new Error("Database not available in this environment.");

    const id = crypto.randomUUID();
    const pendingAction: PendingAction = { ...action, id, timestamp: Date.now() };

    return new Promise((resolve, reject) => {
      const request = store.add(pendingAction);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions(): Promise<PendingAction[]> {
    const store = await this.getStore('pendingActions', 'readonly');
    if (!store) return [];
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingAction(id: string): Promise<void> {
    const store = await this.getStore('pendingActions', 'readwrite');
    if (!store) throw new Error("Database not available.");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updatePendingActionRetryCount(id: string, retryCount: number): Promise<void> {
    const store = await this.getStore('pendingActions', 'readwrite');
    if (!store) throw new Error("Database not available.");
    const action = await new Promise<PendingAction | undefined>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as PendingAction);
      request.onerror = () => reject(request.error);
    });
    if (action) {
      action.retryCount = retryCount;
      await new Promise<void>((resolve, reject) => {
        const req = store.put(action);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }

  async getCachedData(key: string): Promise<unknown | null> {
    const store = await this.getStore('cachedData', 'readonly');
    if (!store) return null;
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result as CachedData | undefined;
        if (result && result.expiresAt > Date.now()) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setCachedData(key: string, data: unknown, ttl: number): Promise<void> {
    const store = await this.getStore('cachedData', 'readwrite');
    if (!store) throw new Error("Database not available.");
    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    return new Promise((resolve, reject) => {
      const request = store.put(cachedData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeCachedData(key: string): Promise<void> {
    const store = await this.getStore('cachedData', 'readwrite');
    if (!store) throw new Error("Database not available.");
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
