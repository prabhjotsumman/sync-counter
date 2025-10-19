// offlineUtils.ts
// Utility functions for offline counter logic

import { updateOfflineCounter } from './offlineStorage';

declare global {
  interface Window {
    manualSyncIncrements?: typeof syncPendingIncrements;
    getPendingIncrements?: typeof getPendingIncrements;
    clearPendingIncrements?: typeof clearPendingIncrements;
    addPendingIncrement?: typeof addPendingIncrement;
  }
}

export function normalizeUserName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function isDataStale(lastSync: number, thresholdMs: number = 5 * 60 * 1000): boolean {
  return Date.now() - lastSync > thresholdMs;
}

export function getLocalStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent fail for performance
  }
}

// User color management
const DEFAULT_USER_COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

export function getUserColor(username: string): string {
  if (typeof window === 'undefined') return DEFAULT_USER_COLORS[0];

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    if (userColors[username]) {
      return userColors[username];
    }

    // Assign a default color based on username hash
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(hash) % DEFAULT_USER_COLORS.length;
    const assignedColor = DEFAULT_USER_COLORS[colorIndex];

    // Store the assigned color
    userColors[username] = assignedColor;
    localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));

    return assignedColor;
  } catch {
    return DEFAULT_USER_COLORS[0];
  }
}

export function setUserColor(username: string, color: string): void {
  if (typeof window === 'undefined') return;

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    userColors[username] = color;
    localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));
  } catch {
    // Silent fail for performance
  }
}

export function getAllUserColors(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
  } catch {
    return {};
  }
}

// Increment batching system
export interface PendingIncrement {
  id: string;
  counterId: string;
  currentUser: string;
  today: string;
  timestamp: number;
}

// Simple 1-minute batch collection
const BATCH_SYNC_DELAY = 60000; // 1 minute

let batchTimer: NodeJS.Timeout | null = null;
let batchSyncInProgress = false;
let globalCounterUpdateCallback: ((counterId: string, counter: import('./counters').Counter) => void) | null = null;

export function addPendingIncrement(counterId: string, currentUser: string, today: string): void {
  if (typeof window === 'undefined') return;

  try {
    const pendingIncrements = getLocalStorageItem<PendingIncrement[]>('syncCounterPendingIncrements', []);

    // Add new increment immediately to localStorage
    const newIncrement: PendingIncrement = {
      id: `${counterId}-${Date.now()}-${Math.random()}`,
      counterId,
      currentUser,
      today,
      timestamp: Date.now()
    };

    pendingIncrements.push(newIncrement);
    setLocalStorageItem('syncCounterPendingIncrements', pendingIncrements);

    // Schedule batch sync for 1 minute later (or reset timer if already scheduled)
    scheduleBatchSync();
  } catch (error) {
    // Silent fail for performance
  }
}

function scheduleBatchSync(): void {
  if (batchTimer) {
    clearTimeout(batchTimer);
  }

  batchTimer = setTimeout(() => {
    syncPendingIncrements();
  }, BATCH_SYNC_DELAY);
}

export async function syncPendingIncrements(onCounterUpdate?: (counterId: string, counter: import('./counters').Counter) => void): Promise<boolean> {
  if (batchSyncInProgress) return false;

  const pendingIncrements = getPendingIncrements();
  if (pendingIncrements.length === 0) return true;

  batchSyncInProgress = true;

  const isOffline = !navigator.onLine;

  try {
    // Group increments by counter using Map for better performance
    const incrementsByCounter = new Map<string, PendingIncrement[]>();
    for (const increment of pendingIncrements) {
      const existing = incrementsByCounter.get(increment.counterId) || [];
      existing.push(increment);
      incrementsByCounter.set(increment.counterId, existing);
    }

    if (isOffline) {
      // Process all offline increments in parallel
      const offlinePromises = Array.from(incrementsByCounter.entries()).map(async ([counterId, increments]) => {
        // Process all increments for this counter in parallel
        const incrementPromises = increments.map(async (increment) => {
          try {
            updateOfflineCounter(increment.counterId, 1, increment.today);
          } catch (error) {
            // Silent fail for offline increments
          }
        });
        await Promise.all(incrementPromises);
      });

      await Promise.all(offlinePromises);
      clearPendingIncrements();
      return true;
    }

    // Online mode: process all increments in one batch per counter
    const syncPromises = Array.from(incrementsByCounter.entries()).map(async ([counterId, increments]) => {
      // Send all increments for this counter in one batch
      const batch = increments;

      try {
        const response = await fetch(`/api/counters/${counterId}/increment-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ increments: batch })
        });

        if (response.ok) {
          const result = await response.json();

          // Update UI with server data if callback provided
          const updateCallback = onCounterUpdate || globalCounterUpdateCallback;
          if (updateCallback && result.counter) {
            updateCallback(counterId, result.counter);
          }

          return batch; // Return batch for removal
        }
        return [];
      } catch (error) {
        return [];
      }
    });

    const results = await Promise.all(syncPromises);

    // Remove all successfully synced increments in one operation
    const syncedIds = new Set<string>();
    results.forEach(batch => {
      batch.forEach(increment => syncedIds.add(increment.id));
    });

    if (syncedIds.size > 0) {
      const remainingIncrements = pendingIncrements.filter(inc => !syncedIds.has(inc.id));
      setLocalStorageItem('syncCounterPendingIncrements', remainingIncrements);
    }

    return true;
  } catch (error) {
    return false;
  } finally {
    batchSyncInProgress = false;
  }
}

export function getPendingIncrements(): PendingIncrement[] {
  return getLocalStorageItem<PendingIncrement[]>('syncCounterPendingIncrements', []);
}

export function clearPendingIncrements(): void {
  setLocalStorageItem('syncCounterPendingIncrements', []);
}

export function setGlobalCounterUpdateCallback(callback: (counterId: string, counter: import('./counters').Counter) => void): void {
  globalCounterUpdateCallback = callback;
}

// Auto-sync every 30 seconds (more frequent for offline support)
if (typeof window !== 'undefined') {
  setInterval(() => {
    syncPendingIncrements();
  }, 30000);
  
  // Add manual sync function to window for debugging
  window.manualSyncIncrements = syncPendingIncrements;
  window.getPendingIncrements = getPendingIncrements;
  window.clearPendingIncrements = clearPendingIncrements;
  window.addPendingIncrement = addPendingIncrement;
}
