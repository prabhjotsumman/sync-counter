'use client';
import type { Counter } from "../lib/counters";

import { useState } from 'react';

import { useCounterLogic } from '@/hooks/useCounterLogic';
import { CounterActions, CounterValue, IncrementButton, FullScreenCounterModal } from './counter/index';
import ProgressBar from './counter/ProgressBar';

interface CounterProps {
  setFullscreenOpen?: (open: boolean) => void;
  id: string;
  name: string;
  value: number;
  dailyGoal?: number;
  dailyCount?: number;
  onUpdate: (id: string, updatedCounter: Counter) => void;
  isOffline?: boolean;
  onEdit?: (counter: Counter) => void;
  onDelete?: (id: string) => void;
}

export default function Counter({
  id,
  name,
  value,
  dailyGoal,
  dailyCount,
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
      className={`bg-gray-900 rounded-lg text-center min-w-[300px] transition-all duration-200 relative ${lastAction ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        } ${isOffline ? 'ring-2 ring-yellow-500 ring-opacity-30' : ''}`}
    >
      {/* Progress bar in top-right corner */}
      {typeof dailyGoal === 'number' && dailyGoal > 0 && (
        <div className="absolute top-0 right-0 w-full max-w-full z-10 rounded-tl-md rounded-tr-md overflow-hidden">
          <ProgressBar counterName={name} value={dailyCount || 0} max={dailyGoal} showProgressText={true} />
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-center mt-4 p-8">
        <CounterActions
          onFullscreen={handleOpenFullscreen}
          onEdit={onEdit}
          onDelete={onDelete}
          id={id}
          name={name}
          value={value}
          dailyGoal={dailyGoal ?? 0}
          dailyCount={dailyCount ?? 0}
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
        dailyGoal={dailyGoal}
        dailyCount={dailyCount}
        onIncrement={handleIncrement}
        onClose={handleCloseFullscreen}
        open={localFullscreenOpen}
      />
    </div>
  );
}
