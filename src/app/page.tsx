'use client';

import { useState, useEffect, useCallback } from 'react';
import Counter from '@/components/Counter';
import CounterModal from '@/components/CounterModal';
import { useOffline } from '@/hooks/useOffline';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { getOfflineCounters, saveOfflineCounters, clearPendingChanges, mergeServerData, syncPendingChangesToServer, addOfflineCounter, updateOfflineCounterData, deleteOfflineCounter } from '@/lib/offlineStorage';

export interface CounterData {
  id: string;
  name: string;
  value: number;
}

export default function Home() {
  const [counters, setCounters] = useState<CounterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'add'>('add');
  const [editingCounter, setEditingCounter] = useState<CounterData | null>(null);
  const { isOnline, isOffline, pendingRequests } = useOffline();

  // Real-time sync handlers
  const handleCounterCreated = useCallback((counter: CounterData) => {
    setCounters(prev => {
      // Replace if already present, otherwise add
      if (prev.some(c => c.id === counter.id)) {
        const newCounters = prev.map(c => c.id === counter.id ? counter : c);
        saveOfflineCounters(newCounters);
        return newCounters;
      }
      const newCounters = [...prev, counter];
      saveOfflineCounters(newCounters);
      return newCounters;
    });
  }, []);

  const handleCounterUpdated = useCallback((counter: CounterData) => {
    setCounters(prev => {
      const newCounters = prev.map(c => c.id === counter.id ? counter : c);
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

  const handleCounterIncremented = useCallback((counter: CounterData) => {
    setCounters(prev => {
      const newCounters = prev.map(c => c.id === counter.id ? counter : c);
      saveOfflineCounters(newCounters);
      return newCounters;
    });
  }, []);

  const handleCounterDecremented = useCallback((counter: CounterData) => {
    setCounters(prev => {
      const newCounters = prev.map(c => c.id === counter.id ? counter : c);
      saveOfflineCounters(newCounters);
      return newCounters;
    });
  }, []);

  const handleInitialData = useCallback((counters: CounterData[]) => {
    setCounters(counters);
    saveOfflineCounters(counters);
    setIsLoading(false);
  }, []);

  // Initialize real-time sync
  const { isConnected } = useRealtimeSync({
    onCounterCreated: handleCounterCreated,
    onCounterUpdated: handleCounterUpdated,
    onCounterDeleted: handleCounterDeleted,
    onCounterIncremented: handleCounterIncremented,
    onCounterDecremented: handleCounterDecremented,
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
        
        // Merge server data with local changes
        const mergedCounters = mergeServerData(serverCounters);
        setCounters(mergedCounters);
        
        // Save the merged data with server timestamp
        saveOfflineCounters(mergedCounters, serverTimestamp);
        
        // Clear pending changes that have been synced
        clearPendingChanges();
      } else {
        throw new Error('Failed to fetch counters');
      }
    } catch (error) {
      console.error('Network error, using offline data:', error);
      // Use offline data if available
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
    // Only fetch counters if not using real-time sync
    if (!isConnected) {
      fetchCounters();
    }
  }, [isConnected]);

  // Sync offline data when coming back online
  useEffect(() => {
    if (isOnline && pendingRequests > 0) {
      // First sync pending changes to server
      syncPendingChangesToServer().then((success) => {
        if (success) {
          // Then fetch fresh data from server
          fetchCounters();
        } else {
          console.error('Failed to sync pending changes');
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
        // Handle offline operations
        if (modalMode === 'add') {
          const newCounter = addOfflineCounter(counterData);
          if (newCounter) {
            setCounters(prev => {
              // Only add if not already present (by id)
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

      // Online operations
      if (modalMode === 'add') {
        // Create new counter
        const response = await fetch('/api/counters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(counterData)
        });

        if (response.ok) {
          const data = await response.json();
          setCounters(prev => {
            // Only add if not already present (by id)
            if (prev.some(c => c.id === data.counter.id)) return prev;
            return [...prev, data.counter];
          });
          saveOfflineCounters([...counters, data.counter]);
        }
      } else {
        // Update existing counter
        const response = await fetch(`/api/counters/${counterData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(counterData)
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
      console.error('Failed to save counter:', error);
      // Fallback to offline mode if network fails
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
        // Handle offline deletion
        const success = deleteOfflineCounter(id);
        if (success) {
          setCounters(prev => prev.filter(counter => counter.id !== id));
        }
        return;
      }

      // Online deletion
      const response = await fetch(`/api/counters/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCounters(prev => prev.filter(counter => counter.id !== id));
        saveOfflineCounters(counters.filter(counter => counter.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete counter:', error);
      // Fallback to offline mode if network fails
      const success = deleteOfflineCounter(id);
      if (success) {
        setCounters(prev => prev.filter(counter => counter.id !== id));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading counters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Shared Counters</h1>
          <p className="text-gray-400 text-lg">
            Real-time counters shared across all users
          </p>
          
          {/* Connection Status */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline 
                ? 'bg-green-900 text-green-300' 
                : 'bg-yellow-900 text-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-400' : 'bg-yellow-400'
              }`}></div>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            {isOnline && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected 
                  ? 'bg-purple-900 text-purple-300' 
                  : 'bg-gray-700 text-gray-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-purple-400' : 'bg-gray-400'
                } ${isConnected ? 'animate-pulse' : ''}`}></div>
                {isConnected ? 'Real-time Sync' : 'Connecting...'}
              </div>
            )}
            
            {pendingRequests > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                {pendingRequests} pending
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {counters.map((counter) => (
            <Counter
              key={counter.id}
              id={counter.id}
              name={counter.name}
              value={counter.value}
              onUpdate={handleCounterUpdate}
              isOffline={isOffline}
              allCounters={counters}
              isManageMode={isManageMode}
              onEdit={handleEditCounter}
              onDelete={isManageMode ? handleDeleteCounter : undefined}
            />
          ))}
        </div>

        <div className="text-center mt-12 space-y-4">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setIsManageMode(!isManageMode)}
              className={`px-6 py-3 rounded-lg transition-colors duration-200 ${
                isManageMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isManageMode ? 'Exit Manage Mode' : 'Manage Counters'}
            </button>
            
            {isManageMode && (
              <button
                onClick={handleAddCounter}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Add New Counter
              </button>
            )}
            
            {pendingRequests > 0 && isOnline && (
              <button
                onClick={() => syncPendingChangesToServer().then(() => fetchCounters())}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Sync Offline Changes
              </button>
            )}
          </div>
          
          {isOffline && (
            <div className="text-yellow-400 text-sm">
              You&apos;re offline. Changes will be synced when you&apos;re back online.
            </div>
          )}
          
          {pendingRequests > 0 && isOnline && (
            <div className="text-blue-400 text-sm">
              Syncing {pendingRequests} offline changes...
            </div>
          )}
        </div>
        
        {/* Counter Modal */}
        <CounterModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          counter={editingCounter}
          mode={modalMode}
          onSave={handleSaveCounter}
          onDelete={modalMode === 'edit' ? handleDeleteCounter : undefined}
        />
      </div>
    </div>
  );
}
