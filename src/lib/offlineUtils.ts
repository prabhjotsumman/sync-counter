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

export async function getUserColor(username: string): Promise<string> {
  if (typeof window === 'undefined') return DEFAULT_USER_COLORS[0];

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');

    // If user already has a color assigned locally, return it
    if (userColors[username]) {
      return userColors[username];
    }

    // Try to fetch from server
    try {
      const response = await fetch(`/api/user-colors/${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.color) {
          // Save to localStorage for faster future access
          userColors[username] = data.color;
          localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));
          return data.color;
        }
      } else if (response.status === 404) {
        // User color not found on server, assign new color and save to server
        console.log('User color not found on server, assigning new color for:', username);

        // Get all currently assigned colors (including from server)
        const assignedColors = new Set(Object.values(userColors));

        // Find the first available color that isn't assigned to any user
        const availableColor = DEFAULT_USER_COLORS.find(color => !assignedColors.has(color));

        let newColor: string;
        if (availableColor) {
          newColor = availableColor;
        } else {
          // If all colors are taken, assign based on username hash as fallback
          const hash = username.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);

          let colorIndex = Math.abs(hash) % DEFAULT_USER_COLORS.length;
          let attempts = 0;

          // Find a color that isn't currently assigned
          while (assignedColors.has(DEFAULT_USER_COLORS[colorIndex]) && attempts < DEFAULT_USER_COLORS.length) {
            colorIndex = (colorIndex + 1) % DEFAULT_USER_COLORS.length;
            attempts++;
          }

          newColor = DEFAULT_USER_COLORS[colorIndex];
        }

        // Store the assigned color locally
        userColors[username] = newColor;
        localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));

        // Save to server in background (don't await to avoid blocking)
        fetch(`/api/user-colors/${encodeURIComponent(username)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ color: newColor })
        }).catch(error => {
          console.warn('Failed to save new color to server:', error);
        });

        return newColor;
      }
    } catch (error) {
      // Server fetch failed, continue with local assignment
      console.warn('Server fetch failed, using local assignment:', error);
    }

    // Get all currently assigned colors (including from server)
    const assignedColors = new Set(Object.values(userColors));

    // Find the first available color that isn't assigned to any user
    const availableColor = DEFAULT_USER_COLORS.find(color => !assignedColors.has(color));

    if (availableColor) {
      // Assign this unique color to the user
      userColors[username] = availableColor;
      localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));
      return availableColor;
    }

    // If all colors are taken, assign based on username hash as fallback
    // But ensure it doesn't conflict with existing assignments
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    let colorIndex = Math.abs(hash) % DEFAULT_USER_COLORS.length;
    let attempts = 0;

    // Find a color that isn't currently assigned
    while (assignedColors.has(DEFAULT_USER_COLORS[colorIndex]) && attempts < DEFAULT_USER_COLORS.length) {
      colorIndex = (colorIndex + 1) % DEFAULT_USER_COLORS.length;
      attempts++;
    }

    // If all colors are taken, assign based on username hash as fallback
    // But ensure it doesn't conflict with existing assignments
    const fallbackHash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    let fallbackColorIndex = Math.abs(fallbackHash) % DEFAULT_USER_COLORS.length;
    let fallbackAttempts = 0;

    // Find a color that isn't currently assigned
    while (assignedColors.has(DEFAULT_USER_COLORS[fallbackColorIndex]) && fallbackAttempts < DEFAULT_USER_COLORS.length) {
      fallbackColorIndex = (fallbackColorIndex + 1) % DEFAULT_USER_COLORS.length;
      fallbackAttempts++;
    }

    const assignedColor = DEFAULT_USER_COLORS[fallbackColorIndex];

    // Store the assigned color
    userColors[username] = assignedColor;
    localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));

    return assignedColor;
  } catch {
    return DEFAULT_USER_COLORS[0];
  }
}

export function isColorAvailable(color: string): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    const assignedColors = new Set(Object.values(userColors));
    return !assignedColors.has(color);
  } catch {
    return true;
  }
}

export function getAvailableColors(): string[] {
  if (typeof window === 'undefined') return DEFAULT_USER_COLORS;

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    const assignedColors = new Set(Object.values(userColors));
    return DEFAULT_USER_COLORS.filter(color => !assignedColors.has(color));
  } catch {
    return DEFAULT_USER_COLORS;
  }
}

export async function resetAllUserColors(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Get all current user colors
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');

    // Delete each user's color from server
    const deletePromises = Object.keys(userColors).map(async (username) => {
      try {
        await fetch(`/api/user-colors/${encodeURIComponent(username)}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.warn(`Failed to delete color for user ${username} from server:`, error);
      }
    });

    await Promise.all(deletePromises);

    // Clear localStorage
    localStorage.removeItem('syncCounterUserColors');

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('user-color-updated'));
  } catch {
    // Silent fail for performance
  }
}

export async function setUserColor(username: string, color: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');

    // Check if the color is already assigned to another user
    const existingUser = Object.keys(userColors).find(user => userColors[user] === color);
    if (existingUser && existingUser !== username) {
      // Color is taken by another user, don't allow the assignment
      throw new Error(`Color ${color} is already assigned to user ${existingUser}`);
    }

    userColors[username] = color;
    localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));

    // Also save to server for cross-device synchronization
    try {
      await fetch(`/api/user-colors/${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color })
      });
    } catch (error) {
      // Server save failed, but localStorage save succeeded
      console.warn('Failed to save color to server:', error);
    }

    // Dispatch event to notify other components and tabs
    window.dispatchEvent(new CustomEvent('user-color-updated'));
  } catch (error) {
    // Re-throw the error so calling code can handle it
    throw error;
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

  // Listen for localStorage changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'syncCounterUserColors' && e.newValue) {
      // Notify all components that user colors have been updated
      window.dispatchEvent(new CustomEvent('user-color-updated'));
    }
  });
}
