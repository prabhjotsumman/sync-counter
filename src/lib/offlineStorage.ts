import { Counter } from './counters';

const COUNTERS_STORAGE_KEY = 'offline_counters';
const PENDING_CHANGES_KEY = 'pending_changes';

export interface OfflineCounterData {
  counters: Counter[];
  lastSync: number;
  lastServerSync: number;
}

export interface PendingChange {
  id: string;
  type: 'increment' | 'create' | 'update' | 'delete';
  timestamp: number;
  delta?: number;
  previousValue?: number;
  newValue?: number;
  counterData?: Omit<Counter, 'id'> & { id?: string };
}

// Get counters from local storage
export function getOfflineCounters(): Counter[] {
  try {
    const data = localStorage.getItem(COUNTERS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as OfflineCounterData;
      const counters = parsed.counters || [];
      // Normalize all user names in 'users' and 'history'
      for (const counter of counters) {
        // Normalize users property
        if (counter.users) {
          const newUsers: Record<string, number> = {};
          for (const key of Object.keys(counter.users)) {
            const norm = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
            newUsers[norm] = counter.users[key];
          }
          counter.users = newUsers;
        }
        // Normalize history property
        if (counter.history) {
          for (const dateKey of Object.keys(counter.history)) {
            const hist = counter.history[dateKey] as { users: Record<string, number>; total: number };
            if (hist.users) {
              const newHistUsers: Record<string, number> = {};
              for (const key of Object.keys(hist.users) as string[]) {
                const norm = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                newHistUsers[norm] = hist.users[key];
              }
              hist.users = newHistUsers;
            }
          }
        }
      }
      return counters;
    }
  } catch (error) {
    console.error('Failed to get offline counters:', error);
  }
  return [];
}

// Save counters to local storage
export function saveOfflineCounters(counters: Counter[], serverSyncTime?: number): void {
  try {
    const existingData = localStorage.getItem(COUNTERS_STORAGE_KEY);
    const data: OfflineCounterData = existingData 
      ? JSON.parse(existingData)
      : { counters: [], lastSync: 0, lastServerSync: 0 };
    
    data.counters = counters;
    data.lastSync = Date.now();
    if (serverSyncTime) {
      data.lastServerSync = serverSyncTime;
    }
    localStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save offline counters:', error);
  }
}

// Get pending changes from local storage
export function getPendingChanges(): PendingChange[] {
  try {
    const data = localStorage.getItem(PENDING_CHANGES_KEY);
    if (data) {
      return JSON.parse(data) || [];
    }
  } catch (error) {
    console.error('Failed to get pending changes:', error);
  }
  return [];
}

// Save pending changes to local storage
export function savePendingChanges(changes: PendingChange[]): void {
  try {
    localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
  } catch (error) {
    console.error('Failed to save pending changes:', error);
  }
}

// Add a pending change
export function addPendingChange(change: Omit<PendingChange, 'timestamp'>): void {
  try {
    const changes = getPendingChanges();
    changes.push({
      ...change,
      timestamp: Date.now()
    });
    savePendingChanges(changes);
  } catch (error) {
    console.error('Failed to add pending change:', error);
  }
}

// Clear pending changes
export function clearPendingChanges(): void {
  try {
    localStorage.removeItem(PENDING_CHANGES_KEY);
  } catch (error) {
    console.error('Failed to clear pending changes:', error);
  }
}

// Update a counter locally with proper timestamp tracking
export function updateOfflineCounter(id: string, delta: number, today?: string): Counter | null {
  try {
    const counters = getOfflineCounters();
    const counterIndex = counters.findIndex(c => c.id === id);
    if (counterIndex === -1) return null;
    const counter = counters[counterIndex];
    const previousValue = counter.value;
    const newValue = previousValue + delta;
    counter.value = newValue;
    // Date key in DD-MM-YYYY format
    const now = new Date();
    const dateKey = today || now.toLocaleDateString('en-GB').split('/').join('-');
    // Simulate current user for local (replace with actual user logic as needed)
  let currentUser = (typeof window !== 'undefined' && localStorage.getItem('syncCounterUser')) || 'Prabhjot';
  // Normalize user name: first letter capital, rest lowercase
  currentUser = currentUser.charAt(0).toUpperCase() + currentUser.slice(1).toLowerCase();
  // Update users property for today
  if (!counter.users) counter.users = {};
  counter.users[currentUser] = (counter.users[currentUser] || 0) + delta;
    // Update history for today
    if (!counter.history) counter.history = {};
    if (!counter.history[dateKey]) {
      counter.history[dateKey] = { users: {}, total: 0 };
    }
  counter.history[dateKey].users[currentUser] = (counter.history[dateKey].users[currentUser] || 0) + delta;
    counter.history[dateKey].total = Object.values(counter.history[dateKey].users).reduce((a, b) => (a as number) + (b as number), 0);
    saveOfflineCounters(counters);
    // Only add increment changes
    if (delta > 0) {
      addPendingChange({
        id,
        type: 'increment',
        delta,
        previousValue,
        newValue
      });
    }
    return counter;
  } catch (error) {
    console.error('Failed to update offline counter:', error);
    return null;
  }
}

// Add a new counter locally
export function addOfflineCounter(counterData: Omit<Counter, 'id'> & { id?: string }): Counter | null {
  try {
    const counters = getOfflineCounters();
    const newCounter: Counter = {
      id: counterData.id || `counter-${Date.now()}`,
      name: counterData.name,
      value: counterData.value,
      lastUpdated: Date.now()
    };
    
    counters.push(newCounter);
    saveOfflineCounters(counters);
    
    // Add pending change for creation
    addPendingChange({
      id: newCounter.id,
      type: 'create',
      counterData: {
        name: newCounter.name,
        value: newCounter.value
      }
    });
    
    return newCounter;
  } catch (error) {
    console.error('Failed to add offline counter:', error);
    return null;
  }
}

// Update a counter locally (for name/value changes)
export function updateOfflineCounterData(id: string, counterData: Omit<Counter, 'id'>): Counter | null {
  try {
    const counters = getOfflineCounters();
    const counterIndex = counters.findIndex(c => c.id === id);
    if (counterIndex === -1) {
      return null;
    }
    const updatedCounter = {
      ...counters[counterIndex],
      ...counterData,
      lastUpdated: Date.now()
    };
    counters[counterIndex] = updatedCounter;
    saveOfflineCounters(counters);
    // Add pending change for update (include all fields)
    addPendingChange({
      id,
      type: 'update',
      counterData: {
        name: updatedCounter.name,
        value: updatedCounter.value,
        dailyGoal: updatedCounter.dailyGoal,
        dailyCount: updatedCounter.dailyCount,
        history: updatedCounter.history
      }
    });
    return updatedCounter;
  } catch (error) {
    console.error('Failed to update offline counter data:', error);
    return null;
  }
}

// Delete a counter locally
export function deleteOfflineCounter(id: string): boolean {
  try {
    const counters = getOfflineCounters();
    const counterIndex = counters.findIndex(c => c.id === id);
    
    if (counterIndex === -1) {
      return false;
    }
    
    const deletedCounter = counters[counterIndex];
    counters.splice(counterIndex, 1);
    saveOfflineCounters(counters);
    
    // Add pending change for deletion
    addPendingChange({
      id,
      type: 'delete',
      counterData: {
        name: deletedCounter.name,
        value: deletedCounter.value
      }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to delete offline counter:', error);
    return false;
  }
}

// Get last sync timestamp
export function getLastSyncTimestamp(): number {
  try {
    const data = localStorage.getItem(COUNTERS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as OfflineCounterData;
      return parsed.lastSync || 0;
    }
  } catch (error) {
    console.error('Failed to get last sync timestamp:', error);
  }
  return 0;
}

// Get last server sync timestamp
export function getLastServerSyncTimestamp(): number {
  try {
    const data = localStorage.getItem(COUNTERS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as OfflineCounterData;
      return parsed.lastServerSync || 0;
    }
  } catch (error) {
    console.error('Failed to get last server sync timestamp:', error);
  }
  return 0;
}

// Check if data is stale (older than 5 minutes)
export function isDataStale(): boolean {
  const lastSync = getLastSyncTimestamp();
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - lastSync > fiveMinutes;
}

// Merge server data with local changes based on timestamps
export function mergeServerData(serverCounters: Counter[]): Counter[] {
  try {
    const localCounters = getOfflineCounters();
    const pendingChanges = getPendingChanges();
    const lastServerSync = getLastServerSyncTimestamp();
    
    // If no local data, use server data
    if (localCounters.length === 0) {
      return serverCounters;
    }
    
    // Create a map of server counters for easy lookup
      const serverCounterMap = new Map(serverCounters.map(c => [c.id, c]));
    
    // Merge each counter by comparing lastUpdated timestamps
    const mergedCounters: Counter[] = [];
    localCounters.forEach(localCounter => {
      const serverCounter = serverCounterMap.get(localCounter.id);
      if (!serverCounter) {
        // Server doesn't have this counter, keep local
        mergedCounters.push(localCounter);
        return;
      }
      const localUpdated = localCounter.lastUpdated || 0;
      const serverUpdated = serverCounter.lastUpdated || 0;
      if (localUpdated > serverUpdated) {
        mergedCounters.push(localCounter);
      } else if (serverUpdated > localUpdated) {
        mergedCounters.push(serverCounter);
      } else {
        // If timestamps are equal, prefer server and avoid duplicate
        mergedCounters.push(serverCounter);
      }
    });
    // Add any counters that exist only on the server
    serverCounters.forEach(serverCounter => {
      if (!localCounters.find(localCounter => localCounter.id === serverCounter.id)) {
        mergedCounters.push(serverCounter);
      }
    });
    return mergedCounters;
  } catch (error) {
    console.error('Failed to merge server data:', error);
    return serverCounters;
  }
}

// Sync pending changes to server
export async function syncPendingChangesToServer(): Promise<boolean> {
    // Prevent concurrent syncs
    if ((window as any)._syncInProgress) {
      console.warn('Sync already in progress, skipping duplicate call.');
      return false;
    }
    (window as any)._syncInProgress = true;
  try {
    const pendingChanges = getPendingChanges();
    if (pendingChanges.length === 0) {
        (window as any)._syncInProgress = false;
      return true; // No changes to sync
    }
    // Sort all changes by timestamp to apply in chronological order
    const sortedChanges = pendingChanges.sort((a, b) => a.timestamp - b.timestamp);
    for (const change of sortedChanges) {
      try {
        let response;
        switch (change.type) {
          case 'increment': {
            let currentUser = (typeof window !== 'undefined' && localStorage.getItem('syncCounterUser')) || 'Prabhjot';
            currentUser = currentUser.charAt(0).toUpperCase() + currentUser.slice(1).toLowerCase();
            let today = undefined;
            if (change.timestamp) {
              const d = new Date(change.timestamp);
              today = d.toISOString().slice(0, 10);
            }
            response = await fetch(`/api/counters/${change.id}/increment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentUser, today })
            });
            break;
          }
          case 'create':
            response = await fetch('/api/counters', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(change.counterData)
            });
            break;
          case 'update':
            response = await fetch(`/api/counters/${change.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(change.counterData)
            });
            break;
          case 'delete':
            response = await fetch(`/api/counters/${change.id}`, {
              method: 'DELETE'
            });
            break;
          default:
            console.error(`Unknown change type: ${change.type}`);
              (window as any)._syncInProgress = false;
            return false;
        }
        if (!response.ok) {
          console.error(`Failed to sync change for counter ${change.id}:`, change);
            (window as any)._syncInProgress = false;
          return false;
        }
      } catch (error) {
        console.error(`Error syncing change for counter ${change.id}:`, error);
          (window as any)._syncInProgress = false;
        return false;
      }
    }
    // Clear pending changes after successful sync
    clearPendingChanges();
    // Fetch latest counters from server and update offline storage
    try {
      const response = await fetch('/api/counters');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.counters)) {
          localStorage.setItem('offline_counters', JSON.stringify({ counters: data.counters, lastSync: Date.now(), lastServerSync: Date.now() }));
        }
      }
    } catch (err) {
      console.error('Failed to update offline counters after sync:', err);
    }
      (window as any)._syncInProgress = false;
    return true;
  } catch (error) {
    console.error('Failed to sync pending changes:', error);
      (window as any)._syncInProgress = false;
    return false;
  }
}

// Clear all offline data
export function clearOfflineData(): void {
  try {
    localStorage.removeItem(COUNTERS_STORAGE_KEY);
    localStorage.removeItem(PENDING_CHANGES_KEY);
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
}
