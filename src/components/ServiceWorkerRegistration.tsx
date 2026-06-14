'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServiceWorkerRegistration() {
  const [canShowNotificationPrompt, setCanShowNotificationPrompt] = useState(false);

  useEffect(() => {
    // --- Service Worker Registration (notifications only) ---
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };
    registerServiceWorker();

    // --- Notification Permission Check ---
    if ('Notification' in window && Notification.permission === 'default') {
      setCanShowNotificationPrompt(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      } else {
        console.log('Notification permission denied.');
      }
      setCanShowNotificationPrompt(false);
    }
  };

  return (
    <>
      {/* Notification Permission Card */}
      {canShowNotificationPrompt && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg animate-in fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Enable Notifications
            </CardTitle>
            <CardDescription>
              Stay updated with new orders and status changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={requestNotificationPermission} className="flex-1">
              Enable
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCanShowNotificationPrompt(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
