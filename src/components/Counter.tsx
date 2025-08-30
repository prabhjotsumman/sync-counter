'use client';

import { useState } from 'react';
import { updateOfflineCounter, saveOfflineCounters } from '@/lib/offlineStorage';
import FullScreenCounterModal from './FullScreenCounterModal';

interface CounterProps {
  setFullscreenOpen?: (open: boolean) => void;
  id: string;
  name: string;
  value: number;
  onUpdate: (id: string, newValue: number) => void;
  isOffline?: boolean;
  allCounters?: Array<{ id: string; name: string; value: number; contribution?: Record<string, number> }>;
  showContribution?: boolean;
  // isManageMode?: boolean; // removed unused
  onEdit?: (counter: { id: string; name: string; value: number }) => void;
  onDelete?: (id: string) => void;
}

  export default function Counter({ id, name, value, onUpdate, isOffline = false, allCounters = [], onEdit, onDelete, showContribution = true, setFullscreenOpen }: CounterProps) {
  const [localFullscreenOpen, setLocalFullscreenOpen] = useState(false);
  // Sync fullscreen state with parent
  const handleOpenFullscreen = () => {
    setLocalFullscreenOpen(true);
    if (typeof setFullscreenOpen === 'function') {
      setFullscreenOpen(true);
    }
  };
  const handleCloseFullscreen = () => {
    setLocalFullscreenOpen(false);
    if (typeof setFullscreenOpen === 'function') {
      setFullscreenOpen(false);
    }
  };
  // Handler for increment in fullscreen mode (same as main increment)
  const handleFullscreenIncrement = () => {
    handleIncrement();
  };
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
  // let userShare = 0; // removed unused variable
  const total = value;
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
  // removed assignment to userShare (variable no longer exists)
    }
  }
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<'increment' | 'decrement' | null>(null);
  const [showContributions, setShowContributions] = useState(false);

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
  const userContributionsRaw = localStorage.getItem('syncCounterContributions');
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
  const userContributionsRaw = localStorage.getItem('syncCounterContributions');
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
  const userContributionsRaw = localStorage.getItem('syncCounterContributions');
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


  return (
    <div className={`bg-gray-900 rounded-lg p-8 text-center min-w-[300px] transition-all duration-200 ${
      lastAction ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
    } ${isOffline ? 'ring-2 ring-yellow-500 ring-opacity-30' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <div className="flex items-center gap-2">
          {/* Full Screen Button for individual counter */}
          <button
            onClick={handleOpenFullscreen}
            className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl border border-gray-700 transition-colors duration-200"
            title="Full Screen Mode"
            style={{ minWidth: 48, minHeight: 48 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" />
            </svg>
          </button>
          {isOffline && (
            <div className="flex items-center gap-1 text-yellow-400 text-xs">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              Offline
            </div>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit({ id, name, value })}
              className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl border border-gray-700 transition-colors duration-200"
              title="Edit counter"
              style={{ minWidth: 48, minHeight: 48 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this counter?')) {
                  onDelete(id);
                }
              }}
              className="bg-gray-900 hover:bg-gray-700 text-red-400 rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl border border-gray-700 transition-colors duration-200"
              title="Delete counter"
              style={{ minWidth: 48, minHeight: 48 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
        <div className={`text-8xl font-extrabold mb-8 transition-all duration-300 break-words overflow-hidden truncate max-w-full ${
          lastAction === 'increment' ? 'text-green-400' : 
          lastAction === 'decrement' ? 'text-red-400' : 
          'text-white'
        }`}>
          <span style={{ fontSize: value > 99999 ? '5rem' : undefined }}>{value}</span>
        </div>
      
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleIncrement}
          disabled={isLoading}
          className={`font-bold py-6 px-0 rounded-lg text-5xl transition-all duration-200 w-full max-w-[340px] 
            ${isLoading && lastAction === 'increment'
              ? 'bg-green-800 text-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'}
          `}
        >
          +
        </button>
      </div>

      {/* User and contribution share display (feature flag) */}
      {showContribution && typeof window !== 'undefined' && allCounters && Array.isArray(allCounters) && (() => {
        const thisCounter = allCounters.find(c => c.id === id);
        if (thisCounter && thisCounter.contribution && typeof thisCounter.contribution === 'object') {
          // Sort entries by descending contribution value
          const entries = Object.entries(thisCounter.contribution)
            .sort((a, b) => (b[1] as number) - (a[1] as number));
          if (entries.length > 0) {
            return (
              <div className="mt-6 flex flex-col items-start w-full">
                <button
                  className={`flex items-center gap-2 text-white font-normal text-lg mb-2 px-0 py-2 focus:outline-none transition-all duration-300`}
                  style={{ background: 'none', justifyContent: 'flex-start' }}
                  onClick={() => setShowContributions((prev) => !prev)}
                  aria-expanded={showContributions}
                >
                  <span className="text-xl">{showContributions ? '▼' : '▶'}</span>
                  <span>Contributions</span>
                </button>
                <div
                  className={`overflow-x-auto w-full max-w-xs transition-all duration-700 ease-in-out ${showContributions ? 'max-h-[500px] opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95'} pointer-events-${showContributions ? 'auto' : 'none'}`}
                  style={{
                    transitionProperty: 'max-height, opacity, transform',
                    marginLeft: 0,
                  }}
                >
                  <div style={{ transition: 'opacity 0.7s, transform 0.7s', opacity: showContributions ? 1 : 0, transform: showContributions ? 'scaleY(1)' : 'scaleY(0.95)' }}>
                    {showContributions && (
                      <table className="min-w-full border border-gray-700 rounded-lg bg-gray-800">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-300 border-b border-gray-700">User</th>
                            <th className="px-4 py-2 text-left text-gray-300 border-b border-gray-700">Contribution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map(([user, val]) => (
                            <tr key={user} className="hover:bg-gray-700 transition">
                              <td className="px-4 py-2 text-left text-white border-b border-gray-700">{capitalize(user)}</td>
                              <td className="px-4 py-2 text-left text-white font-normal border-b border-gray-700">{String(val)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
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
    {/* Full Screen Counter Modal */}
    <FullScreenCounterModal
      name={name}
      value={value}
      onIncrement={handleFullscreenIncrement}
      onClose={handleCloseFullscreen}
      open={localFullscreenOpen}
    />
    </div>
  );
}
