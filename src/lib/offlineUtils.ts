// offlineUtils.ts
// Utility functions for offline counter logic

import { updateOfflineCounter } from './offlineStorage';

export function normalizeUserName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function isDataStale(lastSync: number, thresholdMs: number = 5 * 60 * 1000): boolean {
  return Date.now() - lastSync > thresholdMs;
}

export function getLocalStorageItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data) as T;
  } catch {}
  return fallback;
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
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
  } catch {}
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

const BATCH_SYNC_DELAY = 2000; // 2 seconds
const MAX_BATCH_SIZE = 10; // Maximum increments per batch

let batchTimer: NodeJS.Timeout | null = null;
let batchSyncInProgress = false;
let globalCounterUpdateCallback: ((counterId: string, counter: any) => void) | null = null;

export function addPendingIncrement(counterId: string, currentUser: string, today: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const pendingIncrements = getLocalStorageItem<PendingIncrement[]>('syncCounterPendingIncrements', []);
    
    // Add new increment
    const newIncrement: PendingIncrement = {
      id: `${counterId}-${Date.now()}-${Math.random()}`,
      counterId,
      currentUser,
      today,
      timestamp: Date.now()
    };
    
    pendingIncrements.push(newIncrement);
    setLocalStorageItem('syncCounterPendingIncrements', pendingIncrements);
    
    console.log('Added pending increment:', newIncrement, 'Total pending:', pendingIncrements.length);
    
    // Schedule batch sync
    scheduleBatchSync();
  } catch (error) {
    console.error('Failed to add pending increment:', error);
  }
}

export function getPendingIncrements(): PendingIncrement[] {
  return getLocalStorageItem<PendingIncrement[]>('syncCounterPendingIncrements', []);
}

export function clearPendingIncrements(): void {
  setLocalStorageItem('syncCounterPendingIncrements', []);
}

export function setGlobalCounterUpdateCallback(callback: (counterId: string, counter: any) => void): void {
  globalCounterUpdateCallback = callback;
}

function scheduleBatchSync(): void {
  if (batchTimer) {
    clearTimeout(batchTimer);
  }
  
  console.log(`Scheduling batch sync in ${BATCH_SYNC_DELAY}ms`);
  
  batchTimer = setTimeout(() => {
    console.log('Batch sync timer triggered');
    syncPendingIncrements();
  }, BATCH_SYNC_DELAY);
}

export async function syncPendingIncrements(onCounterUpdate?: (counterId: string, counter: any) => void): Promise<boolean> {
  if (batchSyncInProgress) {
    console.log('Batch sync already in progress, skipping...');
    return false;
  }
  
  const pendingIncrements = getPendingIncrements();
  console.log('Syncing pending increments:', pendingIncrements.length);
  
  if (pendingIncrements.length === 0) return true;
  
  batchSyncInProgress = true;
  
  // Check if we're offline
  const isOffline = !navigator.onLine;
  console.log('Network status:', isOffline ? 'offline' : 'online');
  
  try {
    // Group increments by counter
    const incrementsByCounter: Record<string, PendingIncrement[]> = {};
    pendingIncrements.forEach(increment => {
      if (!incrementsByCounter[increment.counterId]) {
        incrementsByCounter[increment.counterId] = [];
      }
      incrementsByCounter[increment.counterId].push(increment);
    });
    
    if (isOffline) {
      // Handle offline mode - save to offline storage
      console.log('Offline mode: saving increments to offline storage');
      
      const offlinePromises = Object.entries(incrementsByCounter).map(async ([counterId, increments]) => {
        console.log(`Processing ${increments.length} offline increments for counter ${counterId}`);
        
        // Process each increment for offline storage
        for (const increment of increments) {
          try {
            const updatedCounter = updateOfflineCounter(
              increment.counterId, 
              1, 
              increment.today
            );
            if (updatedCounter) {
              console.log(`Saved offline increment for counter ${counterId}`);
            }
          } catch (error) {
            console.error(`Failed to save offline increment for counter ${counterId}:`, error);
          }
        }
        
        return true;
      });
      
      await Promise.all(offlinePromises);
      
      // Clear all pending increments since they're now saved offline
      clearPendingIncrements();
      console.log('Cleared all pending increments after offline save');
      
      return true;
    }
    
    // Send batches for each counter (online mode)
    const syncPromises = Object.entries(incrementsByCounter).map(async ([counterId, increments]) => {
      const batchSize = Math.min(increments.length, MAX_BATCH_SIZE);
      const batch = increments.slice(0, batchSize);
      
      console.log(`Syncing batch for counter ${counterId}:`, batch.length, 'increments');
      
      try {
        const response = await fetch(`/api/counters/${counterId}/increment-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ increments: batch })
        });
        
        console.log(`Batch sync response for ${counterId}:`, response.status, response.ok);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`Batch sync result for ${counterId}:`, result);
          
          // Update UI with server data if callback provided
          const updateCallback = onCounterUpdate || globalCounterUpdateCallback;
          if (updateCallback && result.counter) {
            console.log(`Updating UI with server data for counter ${counterId}`);
            updateCallback(counterId, result.counter);
          }
          
          // Remove successfully synced increments
          const remainingIncrements = pendingIncrements.filter(
            inc => !batch.some(b => b.id === inc.id)
          );
          setLocalStorageItem('syncCounterPendingIncrements', remainingIncrements);
          console.log(`Removed ${batch.length} synced increments, ${remainingIncrements.length} remaining`);
          return true;
        } else {
          const errorText = await response.text();
          console.error(`Batch sync failed for ${counterId}:`, response.status, errorText);
        }
        return false;
      } catch (error) {
        console.error(`Failed to sync batch for counter ${counterId}:`, error);
        return false;
      }
    });
    
    await Promise.all(syncPromises);
    return true;
  } catch (error) {
    console.error('Failed to sync pending increments:', error);
    return false;
  } finally {
    batchSyncInProgress = false;
  }
}

// Auto-sync every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    syncPendingIncrements();
  }, 30000);
  
  // Add manual sync function to window for debugging
  (window as any).manualSyncIncrements = syncPendingIncrements;
  (window as any).getPendingIncrements = getPendingIncrements;
  (window as any).clearPendingIncrements = clearPendingIncrements;
  (window as any).addPendingIncrement = addPendingIncrement;
}
