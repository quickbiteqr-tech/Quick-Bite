import { useState, useEffect } from 'react';

export function useGlobalClock(updateIntervalMs = 30000) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startInterval = () => {
      setNow(Date.now()); // instantly update on start/resume
      if (!intervalId) {
        intervalId = setInterval(() => {
          setNow(Date.now());
        }, updateIntervalMs);
      }
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval(); // pause to save battery
      } else {
        startInterval(); // instantly refresh
      }
    };

    // Initial check
    if (!document.hidden) {
      startInterval();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateIntervalMs]);

  return now;
}
