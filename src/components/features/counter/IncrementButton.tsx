'use client';
import React from 'react';
import { useCounterContext } from '@/providers/CounterContext';
import { useCounterLogic } from '@/hooks/useCounterLogic';

export default function IncrementButton({ id }: { id: string }) {
  const { counters, handleCounterUpdate } = useCounterContext();
  const counter = counters.find(c => c.id === id);
  const { lastAction, handleIncrement } = useCounterLogic({
    id,
    onUpdate: handleCounterUpdate,
    currentCounter: counter,
  });

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
          backgroundColor: '#10B981',
        }}
      >
        +
      </button>
    </div>
  );
}
