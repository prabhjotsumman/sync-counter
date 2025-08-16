'use client';

import { useState } from 'react';
import { updateOfflineCounter, saveOfflineCounters } from '@/lib/offlineStorage';

interface CounterProps {
  id: string;
  name: string;
  value: number;
  onUpdate: (id: string, newValue: number) => void;
  isOffline?: boolean;
  allCounters?: Array<{ id: string; name: string; value: number }>;
  isManageMode?: boolean;
  onEdit?: (counter: { id: string; name: string; value: number }) => void;
  onDelete?: (id: string) => void;
}

export default function Counter({ id, name, value, onUpdate, isOffline = false, allCounters = [], isManageMode = false, onEdit, onDelete }: CounterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<'increment' | 'decrement' | null>(null);

  const handleIncrement = async () => {
    setIsLoading(true);
    setLastAction('increment');
    
    if (isOffline) {
      // Handle offline increment
      const updatedCounter = updateOfflineCounter(id, 1);
      if (updatedCounter) {
        onUpdate(id, updatedCounter.value);
      }
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 1000);
      return;
    }

    try {
      const response = await fetch(`/api/counters/${id}/increment`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedCounter = data.counter;
        onUpdate(id, updatedCounter.value);
        
        // Update local storage with the latest counter values
        const updatedCounters = allCounters.map(counter => 
          counter.id === id ? { ...counter, value: updatedCounter.value } : counter
        );
        saveOfflineCounters(updatedCounters);
      }
    } catch (error) {
      console.error('Error incrementing counter:', error);
      // Fallback to offline mode if network fails
      const updatedCounter = updateOfflineCounter(id, 1);
      if (updatedCounter) {
        onUpdate(id, updatedCounter.value);
      }
    } finally {
      setIsLoading(false);
      // Clear the action indicator after a short delay
      setTimeout(() => setLastAction(null), 1000);
    }
  };

  const handleDecrement = async () => {
    setIsLoading(true);
    setLastAction('decrement');
    
    if (isOffline) {
      // Handle offline decrement
      const updatedCounter = updateOfflineCounter(id, -1);
      if (updatedCounter) {
        onUpdate(id, updatedCounter.value);
      }
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 1000);
      return;
    }

    try {
      const response = await fetch(`/api/counters/${id}/decrement`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedCounter = data.counter;
        onUpdate(id, updatedCounter.value);
        
        // Update local storage with the latest counter values
        const updatedCounters = allCounters.map(counter => 
          counter.id === id ? { ...counter, value: updatedCounter.value } : counter
        );
        saveOfflineCounters(updatedCounters);
      }
    } catch (error) {
      console.error('Error decrementing counter:', error);
      // Fallback to offline mode if network fails
      const updatedCounter = updateOfflineCounter(id, -1);
      if (updatedCounter) {
        onUpdate(id, updatedCounter.value);
      }
    } finally {
      setIsLoading(false);
      // Clear the action indicator after a short delay
      setTimeout(() => setLastAction(null), 1000);
    }
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-8 text-center min-w-[300px] transition-all duration-200 ${
      lastAction ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
    } ${isOffline ? 'ring-2 ring-yellow-500 ring-opacity-30' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <div className="flex items-center gap-2">
          {isOffline && (
            <div className="flex items-center gap-1 text-yellow-400 text-xs">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              Offline
            </div>
          )}
          {isManageMode && onEdit && (
            <>
              <button
                onClick={() => onEdit({ id, name, value })}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                title="Edit counter"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this counter?')) {
                      onDelete(id);
                    }
                  }}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors duration-200"
                  title="Delete counter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className={`text-6xl font-bold mb-8 transition-all duration-300 ${
        lastAction === 'increment' ? 'text-green-400' : 
        lastAction === 'decrement' ? 'text-red-400' : 
        'text-white'
      }`}>
        {value}
      </div>
      
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleDecrement}
          disabled={isLoading}
          className={`font-bold py-3 px-6 rounded-lg text-xl transition-all duration-200 min-w-[80px] ${
            isLoading && lastAction === 'decrement'
              ? 'bg-red-800 text-gray-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          –
        </button>
        
        <button
          onClick={handleIncrement}
          disabled={isLoading}
          className={`font-bold py-3 px-6 rounded-lg text-xl transition-all duration-200 min-w-[80px] ${
            isLoading && lastAction === 'increment'
              ? 'bg-green-800 text-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          +
        </button>
      </div>
      
      {isLoading && (
        <div className="mt-4 text-gray-400 text-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          Updating...
        </div>
      )}
      
      {lastAction && !isLoading && (
        <div className="mt-2 text-xs text-gray-500">
          {lastAction === 'increment' ? '✓ Incremented' : '✓ Decremented'}
        </div>
      )}
    </div>
  );
}
