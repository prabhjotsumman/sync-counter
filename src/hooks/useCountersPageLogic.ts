import type { Counter } from "../lib/counters";
import { useState, useEffect, useCallback } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import {
    mergeServerData,
    syncPendingChangesToServer,
    addOfflineCounter,
    updateOfflineCounterData,
    deleteOfflineCounter,
    getPendingChanges,
    saveOfflineCounters,
    getOfflineCounters,
    clearPendingChanges,
    normalizeUserName
} from '@/lib/offlineStorage';

export interface CounterData {
    id: string;
    name: string;
    value: number;
    dailyGoal?: number;
    dailyCount?: number;
    history?: Counter['history'];
}


export function useCountersPageLogic() {
    const [anyFullscreen, setAnyFullscreen] = useState<string | false>(false);
    const [counters, setCounters] = useState<CounterData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'edit' | 'add'>('add');
    const [editingCounter, setEditingCounter] = useState<CounterData | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const { isOnline, isOffline, pendingRequests } = useOffline();
    const [wasOnline, setWasOnline] = useState(true);

    // Username logic
    useEffect(() => {
        let name = localStorage.getItem('syncCounterUser');
        if (!name) {
            setShowUsernameModal(true);
        } else {
            name = normalizeUserName(name);
            localStorage.setItem('syncCounterUser', name);
            setCurrentUser(name);
        }
    }, []);

    const handleUsernameSubmit = (name: string) => {
        if (name && name.trim()) {
            const normalized = normalizeUserName(name.trim());
            localStorage.setItem('syncCounterUser', normalized);
            setCurrentUser(normalized);
            setShowUsernameModal(false);
        }
    };

    // Counter event handlers
    const updateCounters = useCallback((updater: (prev: CounterData[]) => CounterData[]) => {
        setCounters(prev => {
            const updated = updater(prev);
            saveOfflineCounters(updated);
            return updated;
        });
    }, []);

    const handleCounterCreated = useCallback((counter: CounterData) => {
        updateCounters(prev =>
            prev.some(c => c.id === counter.id)
                ? prev.map(c => c.id === counter.id ? { ...counter } : c)
                : [...prev, { ...counter }]
        );
    }, [updateCounters]);

    const handleCounterUpdated = useCallback((counter: CounterData) => {
        updateCounters(prev => prev.map(c => c.id === counter.id ? { ...counter } : c));
    }, [updateCounters]);

    const handleCounterDeleted = useCallback((counter: CounterData) => {
        updateCounters(prev => prev.filter(c => c.id !== counter.id));
    }, [updateCounters]);

    const handleInitialData = useCallback((counters: CounterData[]) => {
        setCounters(counters);
        saveOfflineCounters(counters);
        setIsLoading(false);
    }, []);

    const handleCounterIncremented = useCallback((counter: CounterData) => {
        setCounters(prev => prev.map(c => c.id === counter.id ? { ...counter } : c));
    }, []);

    // Realtime sync
    const { isConnected } = useRealtimeSync({
        onCounterCreated: handleCounterCreated,
        onCounterUpdated: handleCounterUpdated,
        onCounterDeleted: handleCounterDeleted,
        onCounterIncremented: handleCounterIncremented,
        onInitialData: handleInitialData,
        isOnline
    });

    // Fetch counters
    const fetchCounters = useCallback(async () => {
        try {
            const response = await fetch('/api/counters');
            if (!response.ok) throw new Error('Failed to fetch counters');
            const { counters: serverCounters, timestamp: serverTimestamp } = await response.json();
            const pendingChanges = getPendingChanges();
            let finalCounters;
            if (pendingChanges.length === 0) {
                // If no pending changes, trust server and clear local
                setCounters(serverCounters);
                saveOfflineCounters(serverCounters, serverTimestamp);
                clearPendingChanges();
                return;
            } else {
                // If there are pending changes, merge
                finalCounters = mergeServerData(serverCounters);
                setCounters(finalCounters);
                saveOfflineCounters(finalCounters, serverTimestamp);
                clearPendingChanges();
            }
        } catch {
            const offlineCounters = getOfflineCounters();
            if (offlineCounters.length > 0) {
                setCounters(offlineCounters);
            } else {
                console.error('Failed to fetch counters and no offline data available');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isConnected) fetchCounters();
    }, [isConnected, fetchCounters]);

    useEffect(() => {
        if (!isOnline && wasOnline) saveOfflineCounters(counters);
        setWasOnline(isOnline);
    }, [isOnline, counters, wasOnline]);


    // Counter CRUD
    // Only update state, do not update local storage here (already handled in useCounterLogic)
    const handleCounterUpdate = (id: string, updatedCounter: Counter) => {
        setCounters(prev =>
            prev.map(counter =>
                counter.id === id ? { ...counter, ...updatedCounter } : counter
            )
        );
    };

    const handleEditCounter = (counter: CounterData) => {
        setEditingCounter(counter);
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleAddCounter = () => {
        setEditingCounter(null);
        setModalMode('add');
        setModalOpen(true);
    };

    /**
     * Handles saving a counter (add or edit) depending on modalMode.
     * Supports both online and offline modes.
     * - In offline mode, uses local storage functions.
     * - In online mode, sends requests to the server.
     * Falls back to offline logic if network request fails.
     */
    const handleSaveCounter = async (counterData: Partial<CounterData> & { name: string; value: number }) => {
        try {
            // Offline mode: add or update counter locally
            if (isOffline) {
                if (modalMode === 'add') {
                    // Add new counter offline
                    const newCounter = addOfflineCounter(counterData);
                    if (newCounter)
                        setCounters(prev => prev.some(c => c.id === newCounter.id) ? prev : [...prev, newCounter]);
                } else {
                    // Update existing counter offline
                    const updatedCounter = updateOfflineCounterData(counterData.id!, counterData);
                    if (updatedCounter)
                        setCounters(prev => prev.map(counter => counter.id === counterData.id ? updatedCounter : counter));
                }
                return;
            }
            // Online mode: send request to server
            if (modalMode === 'add') {
                // Add new counter on server
                const response = await fetch('/api/counters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...counterData, currentUser })
                });
                if (response.ok) {
                    const { counter } = await response.json();
                    setCounters(prev => prev.some(c => c.id === counter.id) ? prev : [...prev, counter]);
                    saveOfflineCounters([...counters, counter]);
                }
            } else {
                // Update existing counter on server
                const response = await fetch(`/api/counters/${counterData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...counterData, currentUser })
                });
                if (response.ok) {
                    const { counter } = await response.json();
                    setCounters(prev => prev.map(c => c.id === counterData.id ? counter : c));
                    saveOfflineCounters(counters.map(c => c.id === counterData.id ? counter : c));
                }
            }
        } catch {
            // Fallback: if request fails, save offline
            if (modalMode === 'add') {
                const newCounter = addOfflineCounter(counterData);
                if (newCounter)
                    setCounters(prev => prev.some(c => c.id === newCounter.id) ? prev : [...prev, newCounter]);
            } else {
                const updatedCounter = updateOfflineCounterData(counterData.id!, counterData);
                if (updatedCounter)
                    setCounters(prev => prev.map(counter => counter.id === counterData.id ? updatedCounter : counter));
            }
        }
    };

    const handleDeleteCounter = async (id: string) => {
        try {
            if (isOffline) {
                if (deleteOfflineCounter(id)) setCounters(prev => prev.filter(counter => counter.id !== id));
                return;
            }
            const response = await fetch(`/api/counters/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setCounters(prev => prev.filter(counter => counter.id !== id));
                saveOfflineCounters(counters.filter(counter => counter.id !== id));
            }
        } catch {
            if (deleteOfflineCounter(id)) setCounters(prev => prev.filter(counter => counter.id !== id));
        }
    };

    useEffect(() => {
        // Sync pending changes when online, then refresh counters from server to prevent double increment
        const syncAndRefresh = async () => {
            if (isOnline && pendingRequests > 0) {
                await syncPendingChangesToServer();
                await fetchCounters(); // Always refresh from server after syncing
            }
        };
        syncAndRefresh();
    }, [isOnline, pendingRequests, fetchCounters]);

    return {
        anyFullscreen,
        setAnyFullscreen,
        counters,
        setCounters,
        isLoading,
        modalOpen,
        setModalOpen,
        modalMode,
        setModalMode,
        editingCounter,
        setEditingCounter,
        currentUser,
        isOnline,
        isOffline,
        pendingRequests,
        isConnected,
        handleCounterUpdate,
        handleEditCounter,
        handleAddCounter,
        handleSaveCounter,
        handleDeleteCounter,
        fetchCounters,
        syncPendingChangesToServer: async () => { await syncPendingChangesToServer(); },
        showUsernameModal,
        handleUsernameSubmit
    };
}
