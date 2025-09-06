import React from 'react';

interface CounterValueProps {
  value: number;
  lastAction: string | null;
}

export default function CounterValue({ value, lastAction }: CounterValueProps) {
  return (
    <div
      className={`text-8xl font-extrabold mb-8 transition-all duration-300 break-words overflow-hidden truncate max-w-full ${
        lastAction === 'increment' ? 'text-green-400' : 'text-white'
      }`}
    >
      <span style={value > 99999 ? { fontSize: '5rem' } : undefined}>{value}</span>
    </div>
  );
}
