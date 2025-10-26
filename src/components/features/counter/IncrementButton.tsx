'use client';
import React, { useState, useEffect } from 'react';
import { useCounterContext } from '@/providers/CounterContext';
import { useCounterLogic } from '@/hooks/useCounterLogic';
import { getUserColor } from '@/utils';

export default function IncrementButton({ id }: { id: string }) {
  const { counters, handleCounterUpdate, currentUser } = useCounterContext();
  const counter = counters.find(c => c.id === id);
  const { lastAction, handleIncrement } = useCounterLogic({
    id,
    onUpdate: handleCounterUpdate,
    currentCounter: counter,
  });

  const [userColor, setUserColor] = useState('#10B981');

  // Update color when current user changes or when color updates occur
  useEffect(() => {
    if (currentUser) {
      // For increment button, we only need to consider the current user
      // since it's a single-user action, but we'll use the same logic for consistency
      const color = getUserColor(currentUser);
      console.log(`🔄 IncrementButton: Updating color for ${currentUser} to ${color}`);
      setUserColor(color);
    } else {
      setUserColor('#10B981');
    }
  }, [currentUser]);

  // Listen for color update events
  useEffect(() => {
    const handleColorUpdate = () => {
      console.log(`🎨 IncrementButton: Received color update event`);
      if (currentUser) {
        const color = getUserColor(currentUser);
        console.log(`🎨 IncrementButton: Setting color to ${color} for user ${currentUser}`);
        setUserColor(color);
      }
    };

    console.log(`🎨 IncrementButton: Setting up color update event listener for user ${currentUser}`);
    window.addEventListener('user-color-updated', handleColorUpdate);
    return () => {
      console.log(`🎨 IncrementButton: Removing color update event listener for user ${currentUser}`);
      window.removeEventListener('user-color-updated', handleColorUpdate);
    };
  }, []); // Remove currentUser dependency to prevent re-creation

  if (!counter) return null;

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
