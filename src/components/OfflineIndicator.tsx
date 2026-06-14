'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    // Check initial status
    checkOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-yellow-200 text-yellow-800">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You&apos;re currently offline. Some features may not be available.
      </AlertDescription>
    </Alert>
  );
} 