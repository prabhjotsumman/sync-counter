
// offlineCounterOps.ts
// Counter CRUD and sync logic for offline mode
import { Counter } from './counters';
import { PendingChange } from './offlineStorage';

declare global {
    interface Window { _syncInProgress?: boolean }
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
                history: updatedCounter.history
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
            // Daily counter reset logic
            const today = new Date().toISOString().slice(0, 10);
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
        data.counters = counters;
        data.lastSync = Date.now();
        if (serverSyncTime) {
            data.lastServerSync = serverSyncTime;
        }
        localStorage.setItem('offline_counters', JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save offline counters:', error);
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
        const dateKey = today || now.toLocaleDateString('en-GB').split('/').join('-');
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
            lastUpdated: Date.now()
        };
        counters.push(newCounter);
        saveOfflineCounters(counters);
        addPendingChange({
            id: newCounter.id,
            type: 'create',
            counterData: {
                name: newCounter.name,
                value: newCounter.value,
                dailyGoal: newCounter.dailyGoal
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
        window._syncInProgress = false;
        return true;
    } catch (error) {
        console.error('Failed to sync pending changes:', error);
        window._syncInProgress = false;
        return false;
    }
}
