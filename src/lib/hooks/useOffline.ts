import { useState, useEffect, useCallback } from 'react';
import { offlineSync } from '@/lib/offline/offlineSync';
import { offlineStorage } from '@/lib/offline/offlineStorage';

export interface OfflineStatus {
  isOnline: boolean;
  pendingActionsCount: number;
  isSyncing: boolean;
}

export interface OfflineActions {
  queueAction: (type: 'create_order' | 'update_menu' | 'delete_menu_item' | 'update_profile', data: unknown) => Promise<string>;
  syncNow: () => Promise<void>;
  getPendingActions: () => Promise<unknown[]>;
  clearPendingActions: () => Promise<void>;
}

export function useOffline(): OfflineStatus & OfflineActions {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Check initial status
    checkOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    // Check pending actions count
    const checkPendingActions = async () => {
      try {
        const count = await offlineSync.getPendingActionsCount();
        setPendingActionsCount(count);
      } catch (error) {
        console.error('Failed to check pending actions:', error);
      }
    };

    checkPendingActions();

    // Set up interval to check pending actions
    const interval = setInterval(checkPendingActions, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const queueAction = async (type: 'create_order' | 'update_menu' | 'delete_menu_item' | 'update_profile', data: unknown): Promise<string> => {
    try {
      const id = await offlineSync.queueAction({ type, data, retryCount: 0 });
      // Update pending actions count
      setPendingActionsCount(prev => prev + 1);
      return id;
    } catch (error) {
      console.error('Failed to queue action:', error);
      throw error;
    }
  };

  const syncNow = async (): Promise<void> => {
    if (isOnline && pendingActionsCount > 0) {
      setIsSyncing(true);
      try {
        const result = await offlineSync.syncPendingActions();
        console.log('Manual sync result:', result);
        
        // Update pending actions count
        const newCount = await offlineSync.getPendingActionsCount();
        setPendingActionsCount(newCount);
      } catch (error) {
        console.error('Manual sync failed:', error);
        throw error;
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const getPendingActions = async (): Promise<unknown[]> => {
    try {
      return await offlineSync.getPendingActions();
    } catch (error) {
      console.error('Failed to get pending actions:', error);
      return [];
    }
  };

  const clearPendingActions = async (): Promise<void> => {
    try {
      await offlineSync.clearAllPendingActions();
      setPendingActionsCount(0);
    } catch (error) {
      console.error('Failed to clear pending actions:', error);
      throw error;
    }
  };

  return {
    isOnline,
    pendingActionsCount,
    isSyncing,
    queueAction,
    syncNow,
    getPendingActions,
    clearPendingActions,
  };
}

// Hook for caching data
export function useOfflineCache<T>(key: string, ttl: number = 24 * 60 * 60 * 1000) {
  const [cachedData] = useState<T | null>(null);
  const [isLoading] = useState(false);

  const getCachedData = async (): Promise<T | null> => {
    try {
      const data = await offlineStorage.getCachedData(key);
      return data as T | null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  };

  const setCachedData = async (data: T): Promise<void> => {
    try {
      await offlineStorage.setCachedData(key, data, ttl);
    } catch (error) {
      console.error('Failed to set cached data:', error);
    }
  };

  const removeCachedData = async (): Promise<void> => {
    try {
      await offlineStorage.removeCachedData(key);
    } catch (error) {
      console.error('Failed to remove cached data:', error);
    }
  };

  return {
    cachedData,
    isLoading,
    getCachedData,
    setCachedData,
    removeCachedData,
  };
}

// Hook for offline-first data fetching
export function useOfflineFirst<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 24 * 60 * 60 * 1000
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCachedData, setCachedData } = useOfflineCache<T>(key, ttl);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get cached data first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = await getCachedData();
        if (cached) {
          setData(cached);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const freshData = await fetchFunction();
      setData(freshData);
      
      // Cache the fresh data
      await setCachedData(freshData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      
      // If fetch failed, try to get cached data as fallback
      if (!forceRefresh) {
        const cached = await getCachedData();
        if (cached) {
          setData(cached);
          setError(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCachedData, setCachedData, fetchFunction]);

  useEffect(() => {
    fetchData();
  }, [key, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),
    refresh: () => fetchData(false),
  };
} 