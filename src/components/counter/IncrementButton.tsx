'use client';
import React, { useState, useEffect } from 'react';
import { useCounterContext } from '@/context/CounterContext';
import { useCounterLogic } from '@/hooks/useCounterLogic';
import { getUserColor } from '@/lib/offlineUtils';

export default function IncrementButton({ id }: { id: string }) {
  const { counters, handleCounterUpdate } = useCounterContext();
  const counter = counters.find(c => c.id === id);
  if (!counter) return null;
  const { lastAction, handleIncrement } = useCounterLogic({
    id: counter.id,
    onUpdate: handleCounterUpdate,
    currentCounter: counter,
  });

  const [userColor, setUserColor] = useState('#10B981');

  useEffect(() => {
    const updateUserColor = () => {
      const currentUser = localStorage.getItem('syncCounterUser');
      const color = currentUser ? getUserColor(currentUser) : '#10B981';
      setUserColor(color);
    };

    updateUserColor();

    // Listen for storage changes to update color when user changes it
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'syncCounterUserColors' || e.key === 'syncCounterUser') {
        updateUserColor();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events for same-tab updates
    const handleUserUpdate = () => updateUserColor();
    window.addEventListener('user-color-updated', handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-color-updated', handleUserUpdate);
    };
  }, []);

  return (
    <div className="flex w-full">
      <button
        onClick={handleIncrement}
        className={`font-bold py-6 px-0 rounded-lg text-5xl transition-all duration-200 w-full max-w-full text-white ${lastAction === 'increment'
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:opacity-90'
          } block`}
        style={{
          width: '100%',
          backgroundColor: userColor,
        }}
      >
        +
      </button>
    </div>
  );
}
