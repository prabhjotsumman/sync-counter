import type { Counter } from "../lib/counters";
import { useState } from 'react';
import { updateOfflineCounter } from '@/lib/offlineStorage';

export function useCounterLogic({ id, name, value, onUpdate, isOffline }: {
  id: string;
  name: string;
  value: number;
  onUpdate: (id: string, updatedCounter: Counter) => void;
  isOffline?: boolean;
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
    setIsLoading(true);
    setLastAction('increment');
    const currentUser = getOrAskUsername();
    if (!currentUser) {
      setIsLoading(false);
      setLastAction(null);
      return;
    }
    // Get today's date string
    const today = new Date().toISOString().slice(0, 10);
    if (isOffline) {
      const updatedCounter = updateOfflineCounter(id, 1, today);
      if (updatedCounter) {
        // Update the full counter data in offline storage to match the latest state
        const offlineCounters = JSON.parse(localStorage.getItem('offline_counters') || '{"counters":[]}');
        const idx = offlineCounters.counters.findIndex((c: any) => c.id === id);
        if (idx !== -1) {
          offlineCounters.counters[idx] = updatedCounter;
          localStorage.setItem('offline_counters', JSON.stringify(offlineCounters));
        }
        onUpdate(id, updatedCounter);
      }
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 1000);
      return;
    }
    try {
      const response = await fetch(`/api/counters/${id}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, value, currentUser, today })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedCounter = data.counter;
        onUpdate(id, updatedCounter);
      }
  } catch {
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
