import React from 'react';

interface IncrementButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  lastAction: string | null;
}

export default function IncrementButton({ onClick, disabled, isLoading, lastAction }: IncrementButtonProps) {
  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`font-bold py-6 px-0 rounded-lg text-5xl transition-all duration-200 w-full max-w-[340px] ${
          isLoading && lastAction === 'increment'
            ? 'bg-green-800 text-gray-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        +
      </button>
    </div>
  );
}
