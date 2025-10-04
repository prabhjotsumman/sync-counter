import type { Counter } from "../lib/counters";
import { useState } from 'react';
import { updateOfflineCounter } from '@/lib/offlineStorage';

export function useCounterLogic({ id, name, value, onUpdate, isOffline, currentCounter }: {
  id: string;
  name: string;
  value: number;
  onUpdate: (id: string, updatedCounter: Counter) => void;
  isOffline?: boolean;
  currentCounter?: Counter;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<'increment' | null>(null);

  function getOrAskUsername() {
    if (typeof window === 'undefined') return undefined;
    let user = localStorage.getItem('syncCounterUser');
    while (!user) {
      const promptResult = window.prompt('Please enter your username (required):');
      if (promptResult && promptResult.trim()) {
        user = promptResult.trim();
        // Normalize user name: first letter capital, rest lowercase
        user = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
        localStorage.setItem('syncCounterUser', user);
      } else {
        window.alert('A username is required to use the app.');
      }
    }
    // Normalize user name if already present
    user = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
    localStorage.setItem('syncCounterUser', user);
    return user;
  }

  const handleIncrement = async () => {
    setLastAction('increment');
    const currentUser = getOrAskUsername();
    if (!currentUser) {
      setLastAction(null);
      return;
    }
    
    // Get today's date string
    const today = new Date().toISOString().slice(0, 10);
    
    // Create optimistic update immediately using current counter data
    const currentUsers = currentCounter?.users || {};
    const currentHistory = currentCounter?.history || {};
    const todayHistory = currentHistory[today] || { users: {}, total: 0 };
    
    const optimisticCounter: Counter = {
      ...currentCounter,
      id,
      name,
      value: value + 1,
      lastUpdated: Date.now(),
      users: {
        ...currentUsers,
        [currentUser]: (currentUsers[currentUser] || 0) + 1
      },
      history: {
        ...currentHistory,
        [today]: {
          users: {
            ...todayHistory.users,
            [currentUser]: (todayHistory.users[currentUser] || 0) + 1
          },
          total: todayHistory.total + 1,
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
        }
      }
    };
    
    // Update UI immediately with optimistic data
    onUpdate(id, optimisticCounter);
    
    if (isOffline) {
      // For offline mode, update offline storage
      const updatedCounter = updateOfflineCounter(id, 1, today);
      if (updatedCounter) {
        onUpdate(id, updatedCounter); // Update with actual offline data
      }
      setTimeout(() => setLastAction(null), 1000);
      return;
    }
    
    // For online mode, make network request in background
    setIsLoading(true);
    try {
      const response = await fetch(`/api/counters/${id}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, value, currentUser, today })
      });
      
      if (response.ok) {
        const data = await response.json();
        const serverCounter = data.counter;
        // Update with server response (which has correct user counts and history)
        onUpdate(id, serverCounter);
      } else {
        // If server request fails, fall back to offline update
        const updatedCounter = updateOfflineCounter(id, 1, today);
        if (updatedCounter) {
          onUpdate(id, updatedCounter);
        }
      }
    } catch (error) {
      // If network fails, fall back to offline update
      const updatedCounter = updateOfflineCounter(id, 1, today);
      if (updatedCounter) {
        onUpdate(id, updatedCounter);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 1000);
    }
  };

  return {
    isLoading,
    lastAction,
    handleIncrement,
  };
}
