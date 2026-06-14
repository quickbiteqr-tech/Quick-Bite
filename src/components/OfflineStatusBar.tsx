'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { offlineSync } from '@/lib/offline/offlineSync';

export default function OfflineStatusBar() {
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

  const handleSyncNow = async () => {
    if (isOnline && pendingActionsCount > 0) {
      setIsSyncing(true);
      try {
        const result = await offlineSync.syncPendingActions();
        console.log('Manual sync result:', result);
        
        // Update pending actions count
        const newCount = await offlineSync.getPendingActionsCount();
        setPendingActionsCount(newCount);
        
        // Show success message
        if (result.syncedActions > 0) {
          // You could use a toast notification here
          console.log(`Successfully synced ${result.syncedActions} actions`);
        }
      } catch (error) {
        console.error('Manual sync failed:', error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Don't show anything if online and no pending actions
  if (isOnline && pendingActionsCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Online/Offline Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Pending Actions Indicator */}
          {pendingActionsCount > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <Badge variant="secondary" className="text-xs">
                {pendingActionsCount} pending action{pendingActionsCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Sync Button */}
        {isOnline && pendingActionsCount > 0 && (
          <Button
            onClick={handleSyncNow}
            disabled={isSyncing}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
      </div>
    </div>
  );
} 