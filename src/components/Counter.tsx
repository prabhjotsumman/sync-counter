'use client';

import { useState } from 'react';
import { useCounterLogic } from '@/hooks/useCounterLogic';
import { CounterActions, CounterValue, IncrementButton, FullScreenCounterModal } from './counter/index';

interface CounterProps {
  setFullscreenOpen?: (open: boolean) => void;
  id: string;
  name: string;
  value: number;
  onUpdate: (id: string, newValue: number) => void;
  isOffline?: boolean;
  onEdit?: (counter: { id: string; name: string; value: number }) => void;
  onDelete?: (id: string) => void;
}

export default function Counter({
  id,
  name,
  value,
  onUpdate,
  isOffline = false,
  onEdit,
  onDelete,
  setFullscreenOpen,
}: CounterProps) {
  const [localFullscreenOpen, setLocalFullscreenOpen] = useState(false);
  const { isLoading, lastAction, handleIncrement } = useCounterLogic({ id, name, value, onUpdate, isOffline });

  const handleOpenFullscreen = () => {
    setLocalFullscreenOpen(true);
    setFullscreenOpen?.(true);
  };
  const handleCloseFullscreen = () => {
    setLocalFullscreenOpen(false);
    setFullscreenOpen?.(false);
  };

  return (
    <div
      className={`bg-gray-900 rounded-lg p-8 text-center min-w-[300px] transition-all duration-200 ${lastAction ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        } ${isOffline ? 'ring-2 ring-yellow-500 ring-opacity-30' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <CounterActions
          onFullscreen={handleOpenFullscreen}
          onEdit={onEdit}
          onDelete={onDelete}
          isOffline={isOffline}
          id={id}
          name={name}
          value={value}
        />
      </div>
      {/* Value Display */}
      <CounterValue value={value} lastAction={lastAction} />
      {/* Increment Button */}
      <IncrementButton
        onClick={handleIncrement}
        disabled={isLoading}
        isLoading={isLoading}
        lastAction={lastAction}
      />
      {/* Full Screen Modal */}
      <FullScreenCounterModal
        name={name}
        value={value}
        onIncrement={handleIncrement}
        onClose={handleCloseFullscreen}
        open={localFullscreenOpen}
      />
    </div>
  );
}
