import { useState, useEffect, useCallback } from 'react';
import { getPendingChanges, syncPendingChangesToServer } from '@/lib/offlineStorage';

interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  pendingRequests: number;
  syncOfflineData: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  // const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          console.log('Service Worker registered successfully');
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Sync offline data when back online
  const syncOfflineData = useCallback(async () => {
    if (!isOnline) return;

    try {
      const changes = getPendingChanges();
      if (changes.length === 0) return;

      console.log(`Syncing ${changes.length} offline changes...`);
      // Sync pending changes to server
      const success = await syncPendingChangesToServer();
      if (success) {
        // Instead of reload, call fetchCounters to refresh UI
        if (typeof window !== 'undefined') {
          // Use a custom event to trigger fetchCounters in useCountersPageLogic
          window.dispatchEvent(new Event('sync-counter-refresh'));
        }
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }, [isOnline]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Back online - syncing data...');
      // Trigger sync when coming back online
      if (pendingRequests > 0) {
        syncOfflineData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingRequests, syncOfflineData]);

  // Update pending requests count
  const updatePendingCount = useCallback(() => {
    const changes = getPendingChanges();
    setPendingRequests(changes.length);
  }, []);

  // Initialize pending requests count and update periodically
  useEffect(() => {
    updatePendingCount();
    
    const interval = setInterval(updatePendingCount, 1000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return {
    isOnline,
    isOffline: !isOnline,
    pendingRequests,
    syncOfflineData
  };
}
