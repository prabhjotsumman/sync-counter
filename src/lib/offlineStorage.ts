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
  type: 'increment' | 'decrement' | 'create' | 'update' | 'delete';
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
      return parsed.counters || [];
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
export function updateOfflineCounter(id: string, delta: number): Counter | null {
  try {
    const counters = getOfflineCounters();
    const counterIndex = counters.findIndex(c => c.id === id);
    
    if (counterIndex === -1) {
      return null;
    }
    
    const previousValue = counters[counterIndex].value;
    const newValue = previousValue + delta;
    
    // Update the counter
    counters[counterIndex].value = newValue;
    
    // Save updated counters
    saveOfflineCounters(counters);
    
    // Add pending change with full context
    addPendingChange({
      id,
      type: delta > 0 ? 'increment' : 'decrement',
      delta,
      previousValue,
      newValue
    });
    
    return counters[counterIndex];
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
    
    // Add pending change for update
    addPendingChange({
      id,
      type: 'update',
      counterData: {
        name: updatedCounter.name,
        value: updatedCounter.value
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
    
    // Merge each counter
    const mergedCounters = localCounters.map(localCounter => {
      const serverCounter = serverCounterMap.get(localCounter.id);
      
      if (!serverCounter) {
        // Server doesn't have this counter, keep local
        return localCounter;
      }
      
      // Find the latest change for this counter
      const latestChange = pendingChanges
        .filter(change => change.id === localCounter.id)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (!latestChange) {
        // No local changes, use server value
        return serverCounter;
      }
      
      // If our latest change is newer than server sync, use our value
      if (latestChange.timestamp > lastServerSync) {
        return localCounter;
      }
      
      // Otherwise, use server value
      return serverCounter;
    });
    
    return mergedCounters;
  } catch (error) {
    console.error('Failed to merge server data:', error);
    return serverCounters;
  }
}

// Sync pending changes to server
export async function syncPendingChangesToServer(): Promise<boolean> {
  try {
    const pendingChanges = getPendingChanges();
    if (pendingChanges.length === 0) {
      return true; // No changes to sync
    }

    console.log(`Syncing ${pendingChanges.length} pending changes to server...`);

    // Sort all changes by timestamp to apply in chronological order
    const sortedChanges = pendingChanges.sort((a, b) => a.timestamp - b.timestamp);
    
    // Apply each change to the server
    for (const change of sortedChanges) {
      try {
        let response;
        
        switch (change.type) {
          case 'increment':
          case 'decrement':
            const endpoint = change.type === 'increment' ? 'increment' : 'decrement';
            response = await fetch(`/api/counters/${change.id}/${endpoint}`, {
              method: 'POST',
            });
            break;
            
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
            return false;
        }

        if (!response.ok) {
          console.error(`Failed to sync change for counter ${change.id}:`, change);
          return false;
        }
      } catch (error) {
        console.error(`Error syncing change for counter ${change.id}:`, error);
        return false;
      }
    }

    // Clear pending changes after successful sync
    clearPendingChanges();
    console.log('Successfully synced all pending changes to server');
    return true;
  } catch (error) {
    console.error('Failed to sync pending changes:', error);
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
