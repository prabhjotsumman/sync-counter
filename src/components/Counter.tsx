'use client';
import type { Counter } from "../lib/counters";
import { useCounterContext } from '@/context/CounterContext';
import { CounterActions, CounterValue, IncrementButton, FullScreenCounterModal } from './counter/index';
import ProgressBar from './counter/ProgressBar';


interface CounterProps {
  id: string;
}
export default function Counter({ id }: CounterProps) {
  const { counters, isOffline, anyFullscreen, setAnyFullscreen } = useCounterContext();
  const counter = counters.find(c => c.id === id);
  if (!counter) return null;

  return (
    <div
      className={`bg-gray-900 rounded-lg text-center min-w-[300px] transition-all duration-200 relative ${isOffline ? 'ring-2 ring-yellow-500 ring-opacity-30' : ''}`}
    >
      {/* Progress bar in top-right corner */}
      {typeof counter.dailyGoal === 'number' && counter.dailyGoal > 0 && (
        <div className="absolute top-0 right-0 w-full max-w-full z-10 rounded-tl-md rounded-tr-md overflow-hidden">
          <ProgressBar counterName={counter.name} value={counter.dailyCount || 0} max={counter.dailyGoal} showProgressText={true} />
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-center mt-4 p-8">
        <CounterActions id={counter.id} setFullscreenOpen={setAnyFullscreen} />
      </div>
      {/* Value Display */}
      <CounterValue id={counter.id} />
      {/* Increment Button */}
      <IncrementButton id={counter.id} />
      {/* Full Screen Modal */}
  <FullScreenCounterModal
    id={counter.id}
    open={anyFullscreen === id}
    setOpen={(id?: string) => setAnyFullscreen(id ?? false)}
  />
    </div>
  );
}
