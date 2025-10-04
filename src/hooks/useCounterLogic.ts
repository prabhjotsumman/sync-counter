import type { Counter } from "../lib/counters";
import { useState } from 'react';
import { addPendingIncrement } from '@/lib/offlineUtils';

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
    if (!currentCounter) {
      console.error('No current counter data available for optimistic update');
      setLastAction(null);
      return;
    }
    
    const currentUsers = currentCounter.users || {};
    const currentHistory = currentCounter.history || {};
    const todayHistory = currentHistory[today] || { users: {}, total: 0 };
    
    // Calculate new dailyCount for today
    const newTodayHistory = {
      users: {
        ...todayHistory.users,
        [currentUser]: (todayHistory.users[currentUser] || 0) + 1
      },
      total: todayHistory.total + 1,
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
    };
    
    const newDailyCount = newTodayHistory.total;
    
    const optimisticCounter: Counter = {
      ...currentCounter,
      value: currentCounter.value + 1,
      lastUpdated: Date.now(),
      dailyCount: newDailyCount,
      users: {
        ...currentUsers,
        [currentUser]: (currentUsers[currentUser] || 0) + 1
      },
      history: {
        ...currentHistory,
        [today]: newTodayHistory
      }
    };
    
    // Update UI immediately with optimistic data
    console.log(`Optimistic update for counter ${id}:`, {
      oldValue: currentCounter.value,
      newValue: optimisticCounter.value,
      oldDailyCount: currentCounter.dailyCount || 0,
      newDailyCount: optimisticCounter.dailyCount,
      user: currentUser,
      today
    });
    
    onUpdate(id, optimisticCounter);
    
    // For both online and offline modes, add to batch
    // The batch sync will handle offline storage when offline
    addPendingIncrement(id, currentUser, today);
    setTimeout(() => setLastAction(null), 1000);
  };

  return {
    isLoading,
    lastAction,
    handleIncrement,
  };
}
