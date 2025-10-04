import React from 'react';


import { useCounterContext } from '@/context/CounterContext';

export default function CounterValue({ id }: { id: string }) {
  const { counters } = useCounterContext();
  const counter = counters.find(c => c.id === id);
  if (!counter) return null;
  return (
    <div className="text-8xl font-extrabold mb-8 transition-all duration-300 break-words overflow-hidden truncate max-w-full text-white">
      <span style={counter.value > 99999 ? { fontSize: '5rem' } : undefined}>{counter.value}</span>
    </div>
  );
}
