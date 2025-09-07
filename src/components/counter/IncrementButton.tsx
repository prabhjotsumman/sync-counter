import React from 'react';

interface IncrementButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  lastAction: string | null;
}

export default function IncrementButton({ onClick, disabled, isLoading, lastAction }: IncrementButtonProps) {
  return (
    <div className="flex w-full">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
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
