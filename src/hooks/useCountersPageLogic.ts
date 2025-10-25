'use client';
import type { Counter } from "@/lib/counters";
import { useState, useEffect, useCallback, useRef } from 'react';
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
    resetDailyCountsForCounters
} from '@/lib/offlineCounterOps';
import { syncPendingIncrements, setGlobalCounterUpdateCallback, normalizeUserName } from '@/lib/offlineUtils';
import { setUserColor, getUserColor, USER_COLOR_OPTIONS, removeUserColor } from '@/utils';
import { broadcastUpdate } from '@/app/api/sync/broadcast';

export interface CounterData {
    id: string;
    name: string;
    value: number;
    dailyGoal?: number;
    dailyCount?: number;
    history?: Counter['history'];
    users?: Record<string, number>;
}


export function useCountersPageLogic() {
    // ...existing code...
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

    // Deduplicate fetchCounters calls: coalesce concurrent calls and throttle rapid repeats
    const fetchInFlight = useRef<Promise<void> | null>(null);
    const lastFetchAt = useRef<number>(0);
    const FETCH_COOLDOWN_MS = 800;

    // Username logic
    useEffect(() => {
        console.log('👤 Username initialization starting...');
        let name = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null;
        console.log('📦 Raw localStorage user:', name);

        if (!name) {
            console.log('⚠️ No user in localStorage, showing username modal');
            setShowUsernameModal(true);
        } else {
            name = normalizeUserName(name);
            console.log('✨ Normalized username:', name);
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('syncCounterUser', name);
                console.log('💾 Setting currentUser state to:', name);
                setCurrentUser(name);

                // Only assign default color if user doesn't have one stored
                const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
                console.log('🎨 User colors in localStorage:', userColors);
                if (!userColors[name]) {
                    console.log('🎨 Assigning default color to user:', name);
                    setUserColor(name, '#3B82F6');
                }
            } else {
                console.log('💾 Setting currentUser state to:', name);
                setCurrentUser(name);
            }
        }

        console.log('👤 Username initialization complete');
    }, []);

    // Sync currentUser state changes
    useEffect(() => {
        console.log('🔄 currentUser state changed to:', currentUser);
        if (currentUser && typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('syncCounterUser', currentUser);
        }
    }, [currentUser]);

    // Re-evaluate counters when currentUser changes
    useEffect(() => {
        console.log('🔄 currentUser changed:', currentUser);
        if (currentUser && counters.length > 0) {
            console.log('🔄 Re-evaluating counters with new user:', currentUser);
            // Force a re-render by updating the counters state
            setCounters(prev => [...prev]);
        }
    }, [currentUser, counters.length]);

    // Set up global counter update callback for batch sync
    useEffect(() => {
        setGlobalCounterUpdateCallback((counterId, counter) => {
            setCounters(prev => prev.map(c => c.id === counterId ? counter : c));
        });
    }, [setCounters]);

    const handleUsernameSubmit = (name: string, color?: string) => {
        console.log('📝 Username submitted:', name, color);
        if (name && name.trim()) {
            const normalized = normalizeUserName(name.trim());
            console.log('✨ Normalized submitted username:', normalized);

            // If this is an update (currentUser exists and is different from new name)
            if (currentUser && currentUser !== normalized) {
                // Transfer color from old username to new username
                const oldUserColor = getUserColor(currentUser);
                setUserColor(normalized, color || oldUserColor);
                // Remove old username's color
                removeUserColor(currentUser);
            } else if (color) {
                // New user or updating color
                setUserColor(normalized, color);
            } else if (!currentUser) {
                // Brand new user without color selection
                setUserColor(normalized, '#3B82F6');
            }

            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('syncCounterUser', normalized);
            }
            console.log('💾 Setting currentUser state after submit:', normalized);
            setCurrentUser(normalized);
            setShowUsernameModal(false);
        }
    };

    const handleUpdateUsername = () => {
        setShowUsernameModal(true);
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
        console.log('➕ handleCounterCreated called:', counter.name, counter.id);
        updateCounters(prev => {
            console.log('📊 Adding counter to list. Current count:', prev.length);
            const updated = prev.some(c => c.id === counter.id)
                ? prev.map(c => c.id === counter.id ? { ...counter } : c)
                : [...prev, {
                    ...counter,
                    // Ensure current user is included if not already present
                    ...(currentUser && (!counter.users || !counter.users[currentUser]) ? {
                        users: { ...counter.users, [currentUser]: 0 },
                        history: counter.history || {
                            [new Date().toISOString().split('T')[0]]: {
                                users: { [currentUser]: 0 },
                                total: 0,
                                day: new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
                            }
                        }
                    } : {})
                }];
            console.log('📊 After adding counter. New count:', updated.length);
            return updated;
        });
    }, [updateCounters, currentUser]);

    const handleCounterUpdated = useCallback((counter: CounterData) => {
        console.log('🔄 handleCounterUpdated called:', counter.name, counter.id);
        const resetCounter = resetDailyCountsForCounters([counter])[0];
        updateCounters(prev => prev.map(c => c.id === counter.id ? resetCounter : c));
    }, [updateCounters]);

    const handleCounterDeleted = useCallback((counter: CounterData) => {
        console.log('🗑️ handleCounterDeleted called:', counter.name, counter.id);
        updateCounters(prev => prev.filter(c => c.id !== counter.id));
    }, [updateCounters]);

    const handleInitialData = useCallback((counters: CounterData[]) => {
        console.log('🎯 handleInitialData called with:', counters.length, 'counters');

        // Calculate effective user first
        const localStorageUser = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null;
        const effectiveUser = currentUser || localStorageUser;
        console.log('🔄 handleInitialData - effectiveUser:', effectiveUser, { currentUser, localStorageUser });

        console.log('📋 Initial data details:', counters.map(c => ({
            id: c.id,
            name: c.name,
            users: c.users,
            hasCurrentUser: currentUser ? (c.users?.[currentUser] !== undefined) : false,
            hasEffectiveUser: effectiveUser ? (c.users?.[effectiveUser] !== undefined) : false,
            hasLocalStorageUser: (() => {
                const localUser = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null;
                return localUser ? (c.users?.[localUser] !== undefined) : false;
            })()
        })));

        if (counters.length === 0) {
            console.log('⚠️ Initial data is empty, counters might not exist yet');
            setIsLoading(false);
            return;
        }

        const resetCounters = resetDailyCountsForCounters(counters);

        // Just set counters as-is without modifying users object
        console.log('🔄 Setting initial counters:', resetCounters.length);
        console.log('📋 Setting initial server counters:', resetCounters.length);
        setCounters(resetCounters);
        saveOfflineCounters(resetCounters);

        setIsLoading(false);
    }, [currentUser]);

    // Track counters state changes
    useEffect(() => {
        console.log('📊 Counters state changed:', counters.length, counters.map(c => c.name));
    }, [counters]);

    const handleCounterIncremented = useCallback((counter: CounterData) => {
        const resetCounter = resetDailyCountsForCounters([counter])[0];
        setCounters(prev => prev.map(c => c.id === counter.id ? resetCounter : c));
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
        const now = Date.now();
        // Coalesce concurrent callers
        if (fetchInFlight.current) {
            return fetchInFlight.current;
        }
        // Throttle rapid repeat calls
        if (now - lastFetchAt.current < FETCH_COOLDOWN_MS) {
            return fetchInFlight.current || Promise.resolve();
        }

        // Get localStorage user once for reuse throughout the function
        const localStorageUser = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null;

        const p = (async () => {
            try {
                console.log('📡 Fetching counters from API...');
                const response = await fetch('/api/counters');
                console.log('📡 API Response status:', response.status);

                if (!response.ok) {
                    console.error('❌ API Response not ok:', response.status, response.statusText);
                    throw new Error('Failed to fetch counters');
                }

                const responseData = await response.json();
                console.log('📦 Raw API Response:', responseData);

                const { counters: serverCounters, timestamp: serverTimestamp } = responseData;

                console.log('📦 Parsed API Response:', {
                    counterCount: serverCounters?.length || 0,
                    timestamp: serverTimestamp,
                    sampleCounter: serverCounters?.[0] ? {
                        id: serverCounters[0].id,
                        name: serverCounters[0].name,
                        users: serverCounters[0].users,
                        hasCurrentUser: currentUser ? (serverCounters[0].users?.[currentUser] !== undefined) : false,
                        hasLocalStorageUser: (() => {
                            const localUser = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null;
                            const effectiveUser = currentUser || localUser;
                            return effectiveUser ? (serverCounters[0].users?.[effectiveUser] !== undefined) : false;
                        })()
                    } : null
                });

                if (!serverCounters || serverCounters.length === 0) {
                    console.log('⚠️ No counters returned from API');
                    setIsLoading(false);
                    return;
                }

                const pendingChanges = getPendingChanges();
                console.log('📝 Pending changes:', pendingChanges.length);

                if (pendingChanges.length === 0) {
                    // If no pending changes, trust server and clear local
                    const resetCounters = resetDailyCountsForCounters(serverCounters);

                    // Just set counters as-is without modifying users object
                    console.log('🔄 Setting counters from server:', resetCounters.length);
                    console.log('📊 Setting server counters:', resetCounters.length);
                    setCounters(resetCounters);
                    saveOfflineCounters(resetCounters, serverTimestamp);

                    clearPendingChanges();
                    return;
                } else {
                    // If there are pending changes, merge
                    const finalCounters = resetDailyCountsForCounters(mergeServerData(serverCounters));

                    // Just set merged counters as-is without modifying users object
                    console.log('🔄 Merging counters with pending changes:', finalCounters.length);
                    setCounters(finalCounters);
                    saveOfflineCounters(finalCounters, serverTimestamp);

                    clearPendingChanges();
                }
            } catch (error) {
                console.error('❌ Error in fetchCounters:', error);
                const offlineCounters = getOfflineCounters();
                if (offlineCounters.length > 0) {
                    const resetOfflineCounters = resetDailyCountsForCounters(offlineCounters);

                    // Just set offline counters as-is without modifying users object
                    console.log('🔄 Using offline counters as fallback:', resetOfflineCounters.length);
                    setCounters(resetOfflineCounters);
                } else {
                    console.error('❌ No offline data available');
                }
            } finally {
                console.log('🏁 Fetch counters completed, setting loading to false');
                setIsLoading(false);
                lastFetchAt.current = Date.now();
                fetchInFlight.current = null;
            }
        })();
        fetchInFlight.current = p;
        return p;
    }, [currentUser]);

    // Initial load: fetch counters immediately on mount
    useEffect(() => {
        console.log('🚀 Component mounted - starting counter loading');
        console.log('📊 Current counters state:', counters.length);
        console.log('⏳ Current loading state:', isLoading);
        console.log('🔄 Triggering fetchCounters...');
        fetchCounters();
    }, [fetchCounters]); // eslint-disable-line react-hooks/exhaustive-deps

    // Enhanced fallback: if no counters loaded after timeout, try again
    useEffect(() => {
        console.log('🔍 Fallback check:', {
            countersLength: counters.length,
            isLoading,
            shouldTriggerFallback: counters.length === 0 && !isLoading
        });

        if (counters.length === 0 && !isLoading) {
            console.log('⚠️ No counters loaded and not loading - setting up fallback timeout');
            const timeout = setTimeout(async () => {
                console.log('⏰ Fallback timeout triggered');
                if (counters.length === 0) {
                    console.log('🔄 Executing fallback fetch...');
                    try {
                        await fetchCounters();
                        console.log('✅ Fallback fetch completed');
                    } catch (error) {
                        console.error('❌ Fallback fetch failed:', error);
                    }
                }
            }, 1000); // Reduced timeout for faster debugging
            return () => clearTimeout(timeout);
        }
    }, [counters.length, isLoading, fetchCounters]);


    // Counter CRUD
    // Only update state, do not update local storage here (already handled in useCounterLogic)
    const handleCounterUpdate = (id: string, updatedCounter: Counter) => {
        const resetCounter = resetDailyCountsForCounters([updatedCounter])[0];
        setCounters(prev =>
            prev.map(counter =>
                counter.id === id ? resetCounter : counter
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
            // Always ensure dailyGoal is set
            const safeCounterData = {
                ...counterData,
                dailyGoal: typeof counterData.dailyGoal === 'number' ? counterData.dailyGoal : 0
            };

            // Get effective current user (context OR localStorage)
            const effectiveCurrentUser = currentUser || ((typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null);
            console.log('💾 handleSaveCounter - effectiveCurrentUser:', effectiveCurrentUser, {
                contextUser: currentUser,
                localStorageUser: (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null
            });
            if (isOffline) {
                if (modalMode === 'add') {
                    // Add new counter offline
                    const newCounter = addOfflineCounter({
                        ...safeCounterData,
                        // Initialize with current user if available
                        ...(effectiveCurrentUser ? {
                            users: { [effectiveCurrentUser]: 0 },
                            history: {
                                [new Date().toISOString().split('T')[0]]: {
                                    users: { [effectiveCurrentUser]: 0 },
                                    total: 0,
                                    day: new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
                                }
                            }
                        } : {})
                    });
                    if (newCounter) {
                        console.log('✅ Created counter offline:', newCounter.name, newCounter.id);
                        setCounters(prev => {
                            const updated = prev.some(c => c.id === newCounter.id) ? prev : [...prev, newCounter];
                            console.log('📊 Offline counter added, new count:', updated.length);
                            return updated;
                        });
                    }
                } else {
                    // Update existing counter offline
                    const updatedCounter = updateOfflineCounterData(safeCounterData.id!, safeCounterData);
                    if (updatedCounter)
                        setCounters(prev => prev.map(counter => counter.id === safeCounterData.id ? updatedCounter : counter));
                }
                return;
            }
            // Online mode: send request to server
            if (modalMode === 'add') {
                // Add new counter on server
                const response = await fetch('/api/counters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...safeCounterData, currentUser: effectiveCurrentUser })
                });
                if (response.ok) {
                    const { counter } = await response.json();
                    console.log('✅ Counter created successfully:', counter.name, counter.id);

                    // Immediately update state to ensure counter appears
                    setCounters(prev => {
                        const updated = prev.some(c => c.id === counter.id) ? prev : [...prev, counter];
                        console.log('📊 Updated counters count:', updated.length);
                        return updated;
                    });

                    // Also save to offline storage
                    saveOfflineCounters([...counters, counter]);

                    // Broadcast the update for realtime sync
                    broadcastUpdate({
                        type: 'counter_created',
                        counter: counter,
                        timestamp: Date.now()
                    });
                }
            } else {
                // Update existing counter on server
                const response = await fetch(`/api/counters/${safeCounterData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...safeCounterData, currentUser: effectiveCurrentUser })
                });
                if (response.ok) {
                    const { counter } = await response.json();
                    setCounters(prev => prev.map(c => c.id === safeCounterData.id ? counter : c));
                    saveOfflineCounters(counters.map(c => c.id === safeCounterData.id ? counter : c));
                }
            }
            // Only sync if there are pending changes to avoid unnecessary API calls
            const pendingChanges = getPendingChanges();
            if (pendingChanges.length > 0) {
                await syncPendingChangesToServer();
            }
        } catch {
            // Fallback: if request fails, save offline
            console.log('❌ Online request failed, trying offline fallback');

            // Get effective current user for fallback case
            const fallbackEffectiveUser = currentUser || ((typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null);
            console.log('💾 Fallback effectiveCurrentUser:', fallbackEffectiveUser);

            if (modalMode === 'add') {
                const newCounter = addOfflineCounter({
                    ...counterData,
                    dailyGoal: typeof counterData.dailyGoal === 'number' ? counterData.dailyGoal : 0,
                    // Initialize with current user if available
                    ...(fallbackEffectiveUser ? {
                        users: { [fallbackEffectiveUser]: 0 },
                        history: {
                            [new Date().toISOString().split('T')[0]]: {
                                users: { [fallbackEffectiveUser]: 0 },
                                total: 0,
                                day: new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
                            }
                        }
                    } : {})
                });
                if (newCounter) {
                    console.log('✅ Created counter offline:', newCounter.name, newCounter.id);
                    setCounters(prev => prev.some(c => c.id === newCounter.id) ? prev : [...prev, newCounter]);
                }
            } else {
                const updatedCounter = updateOfflineCounterData(counterData.id!, {
                    ...counterData,
                    dailyGoal: typeof counterData.dailyGoal === 'number' ? counterData.dailyGoal : 0
                });
                if (updatedCounter) {
                    console.log('✅ Updated counter offline:', updatedCounter.name, updatedCounter.id);
                    setCounters(prev => prev.map(counter => counter.id === counterData.id ? updatedCounter : counter));
                }
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
        // Always refresh counters from server when coming back online
        let syncTimeout: NodeJS.Timeout | null = null;
        const syncAndRefresh = async () => {
            if (isOnline) {
                // Sync pending increments first
                await syncPendingIncrements((counterId, counter) => {
                    // Update the specific counter with server data and reset daily count
                    const resetCounter = resetDailyCountsForCounters([counter])[0];
                    setCounters(prev => prev.map(c => c.id === counterId ? resetCounter : c));
                });

                if (pendingRequests > 0) {
                    await syncPendingChangesToServer();
                    // Short delay to let server settle
                    await new Promise(res => setTimeout(res, 300));
                }
                // Single refresh (guarded by deduping logic)
                if (syncTimeout) clearTimeout(syncTimeout);
                syncTimeout = setTimeout(() => {
                    fetchCounters();
                    syncTimeout = null;
                }, 500);
            }
        };
        syncAndRefresh();
        return () => {
            if (syncTimeout) clearTimeout(syncTimeout);
        }
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
        setShowUsernameModal,
        handleUsernameSubmit,
        handleUpdateUsername
    };
}
