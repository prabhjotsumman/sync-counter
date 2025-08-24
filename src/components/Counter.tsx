'use client';

import { useState } from 'react';
import { updateOfflineCounter, saveOfflineCounters } from '@/lib/offlineStorage';

interface CounterProps {
  id: string;
  name: string;
  value: number;
  onUpdate: (id: string, newValue: number) => void;
  isOffline?: boolean;
  allCounters?: Array<{ id: string; name: string; value: number; contribution?: Record<string, number> }>;
  isManageMode?: boolean;
  onEdit?: (counter: { id: string; name: string; value: number }) => void;
  onDelete?: (id: string) => void;
}

export default function Counter({ id, name, value, onUpdate, isOffline = false, allCounters = [], isManageMode = false, onEdit, onDelete }: CounterProps) {
  let currentUser = typeof window !== 'undefined' ? localStorage.getItem('syncCounterUser') : undefined;

  // Prompt for username if not present
  function getOrAskUsername() {
    if (typeof window === 'undefined') return undefined;
    let user = localStorage.getItem('syncCounterUser');
    if (!user) {
      const promptResult = window.prompt('Please enter your username:');
      user = promptResult ? promptResult.trim() : null;
      if (user) {
        localStorage.setItem('syncCounterUser', user);
      }
    }
    return user;
  }
  // Helper to capitalize first letter
  function capitalize(str?: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Calculate user's share for this counter
  let userShare = 0;
  let total = value;
  if (typeof window !== 'undefined' && currentUser && allCounters && Array.isArray(allCounters)) {
    // Try to get user contributions from localStorage or from counter object
    const userContributionsRaw = localStorage.getItem('syncCounterContributions');
    let userContributions: Record<string, Record<string, number>> = {};
    if (userContributionsRaw) {
      try {
        userContributions = JSON.parse(userContributionsRaw);
      } catch {}
    }
    // userContributions[currentUser][id] is the user's contribution for this counter
    if (userContributions[currentUser] && userContributions[currentUser][id] && total > 0) {
      userShare = Math.round((userContributions[currentUser][id] / total) * 100);
    }
  }
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<'increment' | 'decrement' | null>(null);

  const handleIncrement = async () => {
    setIsLoading(true);
    setLastAction('increment');
    // Ensure username is present
    currentUser = getOrAskUsername();
    if (!currentUser) {
      setIsLoading(false);
      setLastAction(null);
      return;
    }
    // Prepare contributions object
    let userContributionsRaw = localStorage.getItem('syncCounterContributions');
    let userContributions: Record<string, Record<string, number>> = {};
    if (userContributionsRaw) {
      try { userContributions = JSON.parse(userContributionsRaw); } catch {}
    }
    // If currentUser is not present for this counter, add with 0
    if (!userContributions[currentUser]) userContributions[currentUser] = {};
    if (userContributions[currentUser][id] === undefined) userContributions[currentUser][id] = 0;
    if (isOffline) {
      // Handle offline increment
      const updatedCounter = updateOfflineCounter(id, 1);
      if (updatedCounter) {
        onUpdate(id, updatedCounter.value);
        // Update contribution in allCounters (frontend)
        const idx = allCounters.findIndex(c => c.id === id);
        if (idx !== -1) {
          const counter = allCounters[idx];
          if (!counter.contribution) counter.contribution = {};
          if (counter.contribution[currentUser] === undefined) counter.contribution[currentUser] = 0;
          counter.contribution[currentUser] += 1;
        }
      }
      userContributions[currentUser][id] += 1;
      localStorage.setItem('syncCounterContributions', JSON.stringify(userContributions));
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 1000);
      return;
    }
    try {
      const response = await fetch(`/api/counters/${id}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, value, currentUser })
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
        // Update contribution in allCounters (frontend)
        const idx = allCounters.findIndex(c => c.id === id);
        if (idx !== -1) {
          const counter = allCounters[idx];
          if (!counter.contribution) counter.contribution = {};
          if (counter.contribution[currentUser] === undefined) counter.contribution[currentUser] = 0;
          counter.contribution[currentUser] += 1;
        }
        // Update contribution in localStorage
        let userContributionsRaw = localStorage.getItem('syncCounterContributions');
        let userContributions: Record<string, Record<string, number>> = {};
        if (userContributionsRaw) {
          try { userContributions = JSON.parse(userContributionsRaw); } catch {}
        }
        if (!userContributions[currentUser]) userContributions[currentUser] = {};
        userContributions[currentUser][id] = (userContributions[currentUser][id] || 0) + 1;
        localStorage.setItem('syncCounterContributions', JSON.stringify(userContributions));
      }
    } catch (error) {
      console.error('Error incrementing counter:', error);
      // Fallback to offline mode if network fails
      const updatedCounter = updateOfflineCounter(id, 1);
      if (updatedCounter) {
        onUpdate(id, updatedCounter.value);
      }
      // Update contribution in localStorage
      let userContributionsRaw = localStorage.getItem('syncCounterContributions');
      let userContributions: Record<string, Record<string, number>> = {};
      if (userContributionsRaw) {
        try { userContributions = JSON.parse(userContributionsRaw); } catch {}
      }
      if (!userContributions[currentUser]) userContributions[currentUser] = {};
      userContributions[currentUser][id] = (userContributions[currentUser][id] || 0) + 1;
      localStorage.setItem('syncCounterContributions', JSON.stringify(userContributions));
    } finally {
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 1000);
    }
  };

  const handleDecrement = async () => {
    setIsLoading(true);
    setLastAction('decrement');
    // Ensure username is present
    currentUser = getOrAskUsername();
    if (!currentUser) {
      setIsLoading(false);
      setLastAction(null);
      return;
    }
    // Prepare contributions object
    let userContributionsRaw = localStorage.getItem('syncCounterContributions');
    let userContributions: Record<string, Record<string, number>> = {};
    if (userContributionsRaw) {
      try { userContributions = JSON.parse(userContributionsRaw); } catch {}
    }
    // If currentUser is not present for this counter, add with 0
    if (!userContributions[currentUser]) userContributions[currentUser] = {};
    if (userContributions[currentUser][id] === undefined) userContributions[currentUser][id] = 0;
    if (isOffline) {
      // Handle offline decrement
      const updatedCounter = updateOfflineCounter(id, -1);
      if (updatedCounter) {
        onUpdate(id, updatedCounter.value);
        // Update contribution in allCounters (frontend)
        const idx = allCounters.findIndex(c => c.id === id);
        if (idx !== -1) {
          const counter = allCounters[idx];
          if (!counter.contribution) counter.contribution = {};
          if (counter.contribution[currentUser] === undefined) counter.contribution[currentUser] = 0;
          counter.contribution[currentUser] -= 1;
        }
      }
      userContributions[currentUser][id] -= 1;
      localStorage.setItem('syncCounterContributions', JSON.stringify(userContributions));
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 1000);
      return;
    }
    try {
      const response = await fetch(`/api/counters/${id}/decrement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, value, currentUser })
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
        // Update contribution in allCounters (frontend)
        const idx = allCounters.findIndex(c => c.id === id);
        if (idx !== -1) {
          const counter = allCounters[idx];
          if (!counter.contribution) counter.contribution = {};
          if (counter.contribution[currentUser] === undefined) counter.contribution[currentUser] = 0;
          counter.contribution[currentUser] -= 1;
        }
        // Update contribution in localStorage
        let userContributionsRaw = localStorage.getItem('syncCounterContributions');
        let userContributions: Record<string, Record<string, number>> = {};
        if (userContributionsRaw) {
          try { userContributions = JSON.parse(userContributionsRaw); } catch {}
        }
        if (!userContributions[currentUser]) userContributions[currentUser] = {};
        userContributions[currentUser][id] = (userContributions[currentUser][id] || 0) - 1;
        localStorage.setItem('syncCounterContributions', JSON.stringify(userContributions));
      }
    } catch (error) {
      console.error('Error decrementing counter:', error);
      // Fallback to offline mode if network fails
      const updatedCounter = updateOfflineCounter(id, -1);
      if (updatedCounter) {
        onUpdate(id, updatedCounter.value);
      }
      // Update contribution in localStorage
      let userContributionsRaw = localStorage.getItem('syncCounterContributions');
      let userContributions: Record<string, Record<string, number>> = {};
      if (userContributionsRaw) {
        try { userContributions = JSON.parse(userContributionsRaw); } catch {}
      }
      if (!userContributions[currentUser]) userContributions[currentUser] = {};
      userContributions[currentUser][id] = (userContributions[currentUser][id] || 0) - 1;
      localStorage.setItem('syncCounterContributions', JSON.stringify(userContributions));
    } finally {
      setIsLoading(false);
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

      {/* User and contribution share display */}
      {/* Show all user contributions for this counter */}
      {typeof window !== 'undefined' && allCounters && Array.isArray(allCounters) && (() => {
        const thisCounter = allCounters.find(c => c.id === id);
        if (thisCounter && thisCounter.contribution && typeof thisCounter.contribution === 'object') {
          const entries = Object.entries(thisCounter.contribution);
          if (entries.length > 0) {
            return (
              <div className="mt-6 text-sm text-gray-300 font-medium flex flex-col items-center">
                <span className="mb-1">Contributions:</span>
                <ul className="list-none p-0 m-0">
                  {entries.map(([user, val]) => (
                    <li key={user} className="mb-1">
                      <span className="font-semibold text-white">{capitalize(user)}</span>
                      {': '}
                      <span className="font-semibold text-blue-400">{String(val)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
        }
        return null;
      })()}
      
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
