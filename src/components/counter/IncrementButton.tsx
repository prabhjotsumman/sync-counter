import React from 'react';



import { useCounterContext } from '@/context/CounterContext';
import { useCounterLogic } from '@/hooks/useCounterLogic';

export default function IncrementButton({ id }: { id: string }) {
  const { counters, handleCounterUpdate, isOffline } = useCounterContext();
  const counter = counters.find(c => c.id === id);
  if (!counter) return null;
  const { isLoading, lastAction, handleIncrement } = useCounterLogic({
    id: counter.id,
    name: counter.name,
    value: counter.value,
    onUpdate: handleCounterUpdate,
    isOffline,
  });
  return (
    <div className="flex w-full">
      <button
        onClick={handleIncrement}
        disabled={isLoading}
        className={`font-bold py-6 px-0 rounded-lg text-5xl transition-all duration-200 w-full max-w-full bg-green-600 hover:bg-green-700 text-white ${
          isLoading && lastAction === 'increment'
            ? 'bg-green-800 text-gray-300 cursor-not-allowed'
            : ''
        } block`}
        style={{ width: '100%' }}
      >
        +
      </button>
    </div>
  );
}
