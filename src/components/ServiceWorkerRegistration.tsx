'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Defensive guard: prevent crashes from external code touching window.ethereum when undefined
    try {
      const w = window as Window & { ethereum?: unknown };
      // If no provider injected, create a minimal, overridable placeholder
      if (w && typeof w === 'object' && w.ethereum === undefined) {
        Object.defineProperty(w, 'ethereum', {
          value: {},
          writable: true,
          configurable: true,
          enumerable: false,
        });
      }
      // Ensure selectedAddress exists to avoid property set/read crashes; make it configurable so real providers can overwrite
      if (w.ethereum && typeof w.ethereum === 'object' && !('selectedAddress' in (w.ethereum as Record<string, unknown>))) {
        let _selectedAddress: string | undefined = undefined;
        Object.defineProperty(w.ethereum as Record<string, unknown>, 'selectedAddress', {
          get() { return _selectedAddress; },
          set(v: unknown) { _selectedAddress = typeof v === 'string' ? v : undefined; },
          configurable: true,
          enumerable: false,
        });
      }
    } catch (_err) {
      console.warn('Error setting up window.ethereum guard');
      // no-op: never block the app due to environment quirks
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle PWA installation
  // let deferredPrompt: Event | null;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Show install button or notification
      console.log('PWA install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
    });
  }, []);

  return null; // This component doesn't render anything
}
