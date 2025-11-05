
declare global {
  interface Window {
    _syncInProgress?: boolean;
  }
}

// offlineCounterOps.ts
// Counter CRUD and sync logic for offline mode
import { Counter } from './counters';
import { PendingChange } from './offlineStorage';
import { getTodayString } from '../utils';

const MAX_HISTORY_DAYS_STORED = 14;

const isQuotaExceededError = (error: unknown): boolean => {
    if (typeof window === 'undefined') return false;
    if (error instanceof DOMException) {
        return error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014;
    }
    return false;
};

const cloneHistoryEntry = (entry: NonNullable<Counter['history']>[string]) => ({
    users: { ...entry.users },
    total: entry.total,
    day: entry.day
});

const sanitizeCountersForStorage = (counters: Counter[]): Counter[] => {
    return counters.map(counter => {
        const sanitized: Counter = {
            id: counter.id,
            name: counter.name,
            value: counter.value,
            lastUpdated: counter.lastUpdated ?? Date.now(),
            dailyGoal: counter.dailyGoal,
            dailyCount: counter.dailyCount,
            image_url: counter.image_url ?? null,
            counter_text: counter.counter_text ?? null
        };

        if (counter.users) {
            sanitized.users = { ...counter.users };
        }

        if (counter.history) {
            const historyEntries = Object.entries(counter.history)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, MAX_HISTORY_DAYS_STORED);

            if (historyEntries.length > 0) {
                sanitized.history = historyEntries.reduce<NonNullable<Counter['history']>>((acc, [date, entry]) => {
                    acc[date] = cloneHistoryEntry(entry);
                    return acc;
                }, {} as NonNullable<Counter['history']>);
            }
        }

        return sanitized;
    });
};

const buildMinimalCountersSnapshot = (counters: Counter[]): Counter[] =>
    counters.map(counter => ({
        id: counter.id,
        name: counter.name,
        value: counter.value,
        lastUpdated: counter.lastUpdated ?? Date.now(),
        dailyGoal: counter.dailyGoal,
        dailyCount: counter.dailyCount,
        image_url: counter.image_url ?? null,
        counter_text: counter.counter_text ?? null
    }));

// Utility function to ensure dailyCount is synchronized with history for all counters
export function ensureDailyCountsFromHistory(counters: Counter[]): Counter[] {
  const today = getTodayString();

  return counters.map(counter => {
    // If counter has history for today, ensure dailyCount matches
    if (counter.history && counter.history[today]) {
      const historyTotal = counter.history[today].total || 0;
      // If dailyCount doesn't match history, update it
      if (counter.dailyCount !== historyTotal) {
        console.log(`🔄 Resetting dailyCount for ${counter.name}: ${counter.dailyCount} -> ${historyTotal}`);
        counter.dailyCount = historyTotal;
      }
    } else {
      // If no history for today, dailyCount should be 0
      if (counter.dailyCount !== 0) {
        console.log(`🔄 Resetting dailyCount for ${counter.name}: ${counter.dailyCount} -> 0 (no history)`);
        counter.dailyCount = 0;
      }
    }
    return counter;
  });
}

// Utility function to reset dailyCount for counters based on local date
export function resetDailyCountsForCounters(counters: Counter[]): Counter[] {
  const today = getTodayString();
  console.log('🔄 resetDailyCountsForCounters called with', counters.length, 'counters');
  console.log('📅 Today:', today);

  return counters.map(counter => {
    // Ensure dailyCount is synchronized with history for all counters
    if (counter.history && counter.history[today]) {
      const historyTotal = counter.history[today].total || 0;
      // If dailyCount doesn't match history, update it
      if (counter.dailyCount !== historyTotal) {
        console.log(`🔄 ${counter.name}: dailyCount ${counter.dailyCount} -> ${historyTotal} (synced with history)`);
        counter.dailyCount = historyTotal;
      }
    } else {
      // If no history for today, dailyCount should be 0
      if (counter.dailyCount !== 0) {
        console.log(`🔄 ${counter.name}: dailyCount ${counter.dailyCount} -> 0 (no history for today)`);
        counter.dailyCount = 0;
      }
    }

    // Update lastUpdated to force UI re-render
    counter.lastUpdated = Date.now();

    return counter;
  });
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
        addPendingChange({
            id,
            type: 'update',
            counterData: {
                name: updatedCounter.name,
                value: updatedCounter.value,
                dailyGoal: updatedCounter.dailyGoal,
                dailyCount: updatedCounter.dailyCount,
                history: updatedCounter.history,
                image_url: updatedCounter.image_url ?? null,
                counter_text: updatedCounter.counter_text ?? null
            }
        });
        return updatedCounter;
    } catch (error) {
        console.error('Failed to update offline counter data:', error);
        return null;
    }
}


// Exported: get pending changes from local storage
export function getPendingChanges(): PendingChange[] {
    try {
        const data = localStorage.getItem('pending_changes');
        if (data) {
            return JSON.parse(data) || [];
        }
    } catch (error) {
        console.error('Failed to get pending changes:', error);
    }
    return [];
}

// Export internal helpers
export function getOfflineCounters(): Counter[] {
    try {
        const data = localStorage.getItem('offline_counters');
        if (data) {
            const parsed = JSON.parse(data);
            // Daily counter reset logic using UTC time
            const today = getTodayString();
            parsed.counters.forEach((counter: Counter) => {
                if (counter.history) {
                    if (!counter.history[today]) {
                        counter.dailyCount = 0;
                    } else {
                        counter.dailyCount = counter.history[today].total || 0;
                    }
                } else {
                    counter.dailyCount = 0;
                }
            });
            return parsed.counters || [];
        }
    } catch (error) {
        console.error('Failed to get offline counters:', error);
    }
    return [];
}

export function saveOfflineCounters(counters: Counter[], serverSyncTime?: number): void {
    try {
        const existingData = localStorage.getItem('offline_counters');
        const data = existingData
            ? JSON.parse(existingData)
            : { counters: [], lastSync: 0, lastServerSync: 0 };

        const sanitizedCounters = sanitizeCountersForStorage(counters);

        data.counters = sanitizedCounters;
        data.lastSync = Date.now();
        if (serverSyncTime) {
            data.lastServerSync = serverSyncTime;
        }
        const payload = JSON.stringify(data);
        localStorage.setItem('offline_counters', payload);
    } catch (error) {
        if (isQuotaExceededError(error)) {
            console.warn('⚠️ Offline counter storage exceeded quota. Attempting to prune data.');
            try {
                const minimalData = {
                    counters: buildMinimalCountersSnapshot(counters),
                    lastSync: Date.now(),
                    lastServerSync: serverSyncTime ?? 0
                };
                localStorage.setItem('offline_counters', JSON.stringify(minimalData));
                return;
            } catch (retryError) {
                console.error('❌ Failed to store minimal offline counters snapshot, clearing storage.', retryError);
                try {
                    localStorage.removeItem('offline_counters');
                } catch (removeError) {
                    console.error('❌ Failed to clear offline counters key after quota error:', removeError);
                }
            }
        } else {
            console.error('Failed to save offline counters:', error);
        }
    }
}

export function addPendingChange(change: Omit<PendingChange, 'timestamp'>): void {
    try {
        const changes = getPendingChanges();
        changes.push({
            ...change,
            timestamp: Date.now()
        });
        localStorage.setItem('pending_changes', JSON.stringify(changes));
    } catch (error) {
        console.error('Failed to add pending change:', error);
    }
}

export function clearPendingChanges(): void {
    try {
        localStorage.removeItem('pending_changes');
    } catch (error) {
        console.error('Failed to clear pending changes:', error);
    }
}

export function getLastServerSyncTimestamp(): number {
    try {
        const data = localStorage.getItem('offline_counters');
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.lastServerSync || 0;
        }
    } catch (error) {
        console.error('Failed to get last server sync timestamp:', error);
    }
    return 0;
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
        const now = new Date();
        const dateKey = today || getTodayString();
        let currentUser = (typeof window !== 'undefined' && localStorage.getItem('syncCounterUser')) || 'Prabhjot';
        currentUser = currentUser.charAt(0).toUpperCase() + currentUser.slice(1).toLowerCase();
        if (!counter.users) counter.users = {};
        counter.users[currentUser] = (counter.users[currentUser] || 0) + delta;
        if (!counter.history) counter.history = {};
        if (!counter.history[dateKey]) {
            counter.history[dateKey] = { users: {}, total: 0 };
        }
        counter.history[dateKey].users[currentUser] = (counter.history[dateKey].users[currentUser] || 0) + delta;
        counter.history[dateKey].total = Object.values(counter.history[dateKey].users).reduce((a, b) => (a as number) + (b as number), 0);
        saveOfflineCounters(counters);
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
        const safeDailyGoal = typeof counterData.dailyGoal === 'number' && !isNaN(counterData.dailyGoal) ? counterData.dailyGoal : 0;
        const newCounter: Counter = {
            id: counterData.id || `counter-${Date.now()}`,
            name: counterData.name,
            value: counterData.value,
            dailyGoal: safeDailyGoal,
            lastUpdated: Date.now(),
            image_url: counterData.image_url ?? null,
            counter_text: counterData.counter_text ?? null
        };
        counters.push(newCounter);
        saveOfflineCounters(counters);
        addPendingChange({
            id: newCounter.id,
            type: 'create',
            counterData: {
                name: newCounter.name,
                value: newCounter.value,
                dailyGoal: newCounter.dailyGoal,
                image_url: newCounter.image_url ?? null,
                counter_text: newCounter.counter_text ?? null
            }
        });
        return newCounter;
    } catch (error) {
        console.error('Failed to add offline counter:', error);
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

// Merge server data with local changes based on timestamps
export function mergeServerData(serverCounters: Counter[]): Counter[] {
    try {
        const localCounters = getOfflineCounters();
        if (localCounters.length === 0) {
            return serverCounters;
        }
        const serverCounterMap = new Map(serverCounters.map(c => [c.id, c]));
        const mergedCounters: Counter[] = [];
        localCounters.forEach(localCounter => {
            const serverCounter = serverCounterMap.get(localCounter.id);
            if (!serverCounter) {
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
                mergedCounters.push(serverCounter);
            }
        });
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
    if (window._syncInProgress) {
        console.warn('Sync already in progress, skipping duplicate call.');
        return false;
    }
    window._syncInProgress = true;
    try {
        const pendingChanges = getPendingChanges();
        if (pendingChanges.length === 0) {
            window._syncInProgress = false;
            return true;
        }
        const sortedChanges = pendingChanges.sort((a, b) => a.timestamp - b.timestamp);
        for (const change of sortedChanges) {
            try {
                let response;
                switch (change.type) {
                    case 'increment': {
                        let currentUser = (typeof window !== 'undefined' && localStorage.getItem('syncCounterUser')) || 'Prabhjot';
                        currentUser = currentUser.charAt(0).toUpperCase() + currentUser.slice(1).toLowerCase();
                        let today;
                        if (change.timestamp) {
                            const d = new Date(change.timestamp);
                            today = getTodayString(); // Use UTC for consistency
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
                        window._syncInProgress = false;
                        return false;
                }
                if (!response.ok) {
                    console.error(`Failed to sync change for counter ${change.id}:`, change);
                    window._syncInProgress = false;
                    return false;
                }
            } catch (error) {
                console.error(`Error syncing change for counter ${change.id}:`, error);
                window._syncInProgress = false;
                return false;
            }
        }
        clearPendingChanges();
        // Note: Removed unnecessary fetch('/api/counters') call since we already have updated data
        window._syncInProgress = false;
        return true;
    } catch (error) {
        console.error('Failed to sync pending changes:', error);
        window._syncInProgress = false;
        return false;
    }
}
