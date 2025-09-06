import { useState, useEffect, useCallback } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import {
  getOfflineCounters,
  saveOfflineCounters,
  clearPendingChanges,
  mergeServerData,
  syncPendingChangesToServer,
  addOfflineCounter,
  updateOfflineCounterData,
  deleteOfflineCounter
} from '@/lib/offlineStorage';

export interface CounterData {
  id: string;
  name: string;
  value: number;
}

export function useCountersPageLogic() {
  const [anyFullscreen, setAnyFullscreen] = useState(false);
  const [counters, setCounters] = useState<CounterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'add'>('add');
  const [editingCounter, setEditingCounter] = useState<CounterData | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { isOnline, isOffline, pendingRequests } = useOffline();

  useEffect(() => {
    let name = localStorage.getItem('syncCounterUser');
    if (!name) {
      name = window.prompt('Please enter your name:');
      if (name && name.trim()) {
        localStorage.setItem('syncCounterUser', name.trim());
        setCurrentUser(name.trim());
      }
    } else {
      setCurrentUser(name);
    }
  }, []);

  const handleCounterCreated = useCallback((counter: CounterData) => {
    setCounters(prev => {
      if (prev.some(c => c.id === counter.id)) {
        const newCounters = prev.map(c => c.id === counter.id ? { ...counter } : c);
        saveOfflineCounters(newCounters);
        return newCounters;
      }
      const newCounters = [...prev, { ...counter }];
      saveOfflineCounters(newCounters);
      return newCounters;
    });
  }, []);

  const handleCounterUpdated = useCallback((counter: CounterData) => {
    setCounters(prev => {
      const newCounters = prev.map(c => c.id === counter.id ? { ...counter } : c);
      saveOfflineCounters(newCounters);
      return newCounters;
    });
  }, []);

  const handleCounterDeleted = useCallback((counter: CounterData) => {
    setCounters(prev => {
      const newCounters = prev.filter(c => c.id !== counter.id);
      saveOfflineCounters(newCounters);
      return newCounters;
    });
  }, []);

  const handleInitialData = useCallback((counters: CounterData[]) => {
    setCounters(counters);
    saveOfflineCounters(counters);
    setIsLoading(false);
  }, []);

  const { isConnected } = useRealtimeSync({
    onCounterCreated: handleCounterCreated,
    onCounterUpdated: handleCounterUpdated,
    onCounterDeleted: handleCounterDeleted,
    onInitialData: handleInitialData,
    isOnline
  });

  const fetchCounters = async () => {
    try {
      const response = await fetch('/api/counters');
      if (response.ok) {
        const data = await response.json();
        const serverCounters = data.counters;
        const serverTimestamp = data.timestamp;
        const mergedCounters = mergeServerData(serverCounters);
        setCounters(mergedCounters);
        saveOfflineCounters(mergedCounters, serverTimestamp);
        clearPendingChanges();
      } else {
        throw new Error('Failed to fetch counters');
      }
    } catch (error) {
      const offlineCounters = getOfflineCounters();
      if (offlineCounters.length > 0) {
        setCounters(offlineCounters);
        setError('Using offline data - no internet connection');
      } else {
        setError('Failed to fetch counters and no offline data available');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      fetchCounters();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isOnline && pendingRequests > 0) {
      syncPendingChangesToServer().then((success) => {
        if (success) {
          fetchCounters();
        }
      });
    }
  }, [isOnline, pendingRequests]);

  const handleCounterUpdate = (id: string, newValue: number) => {
    setCounters(prev => 
      prev.map(counter => 
        counter.id === id ? { ...counter, value: newValue } : counter
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

  const handleSaveCounter = async (counterData: { id?: string; name: string; value: number }) => {
    try {
      if (isOffline) {
        if (modalMode === 'add') {
          const newCounter = addOfflineCounter(counterData);
          if (newCounter) {
            setCounters(prev => {
              if (prev.some(c => c.id === newCounter.id)) return prev;
              return [...prev, newCounter];
            });
          }
        } else {
          const updatedCounter = updateOfflineCounterData(counterData.id!, counterData);
          if (updatedCounter) {
            setCounters(prev => 
              prev.map(counter => 
                counter.id === counterData.id ? updatedCounter : counter
              )
            );
          }
        }
        return;
      }
      if (modalMode === 'add') {
        const response = await fetch('/api/counters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...counterData, currentUser })
        });
        if (response.ok) {
          const data = await response.json();
          setCounters(prev => {
            if (prev.some(c => c.id === data.counter.id)) return prev;
            return [...prev, data.counter];
          });
          saveOfflineCounters([...counters, data.counter]);
        }
      } else {
        const response = await fetch(`/api/counters/${counterData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...counterData, currentUser })
        });
        if (response.ok) {
          const data = await response.json();
          setCounters(prev => 
            prev.map(counter => 
              counter.id === counterData.id ? data.counter : counter
            )
          );
          saveOfflineCounters(counters.map(counter => 
            counter.id === counterData.id ? data.counter : counter
          ));
        }
      }
    } catch (error) {
      if (modalMode === 'add') {
        const newCounter = addOfflineCounter(counterData);
        if (newCounter) {
          setCounters(prev => {
            if (prev.some(c => c.id === newCounter.id)) return prev;
            return [...prev, newCounter];
          });
        }
      } else {
        const updatedCounter = updateOfflineCounterData(counterData.id!, counterData);
        if (updatedCounter) {
          setCounters(prev => 
            prev.map(counter => 
              counter.id === counterData.id ? updatedCounter : counter
            )
          );
        }
      }
    }
  };

  const handleDeleteCounter = async (id: string) => {
    try {
      if (isOffline) {
        const success = deleteOfflineCounter(id);
        if (success) {
          setCounters(prev => prev.filter(counter => counter.id !== id));
        }
        return;
      }
      const response = await fetch(`/api/counters/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setCounters(prev => prev.filter(counter => counter.id !== id));
        saveOfflineCounters(counters.filter(counter => counter.id !== id));
      }
    } catch (error) {
      const success = deleteOfflineCounter(id);
      if (success) {
        setCounters(prev => prev.filter(counter => counter.id !== id));
      }
    }
  };

  return {
    anyFullscreen,
    setAnyFullscreen,
    counters,
    setCounters,
    isLoading,
    error,
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
    syncPendingChangesToServer: async () => { await syncPendingChangesToServer(); }
  };
}
