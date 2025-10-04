
import ProgressBar from './ProgressBar';
import { useCounterContext } from '@/context/CounterContext';
import { useCounterLogic } from '@/hooks/useCounterLogic';

export default function FullScreenCounterModal({ id, open, setOpen }: { id: string, open: boolean, setOpen: (id?: string) => void }) {
  const { counters, handleCounterUpdate, isOffline } = useCounterContext();
  const counter = counters.find(c => c.id === id);
  if (!open || !counter) return null;
  const { handleIncrement } = useCounterLogic({
    id: counter.id,
    name: counter.name,
    value: counter.value,
    onUpdate: handleCounterUpdate,
    isOffline,
  });
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white items-center justify-center"
      style={{ minHeight: '100vh', minWidth: '100vw', touchAction: 'manipulation' }}
      onClick={handleIncrement}
    >
      {/* Progress bar in top-right corner (absolute) */}
      {typeof counter.dailyGoal === 'number' && counter.dailyGoal > 0 && (
        <div className="absolute top-0 right-0 w-full max-w-full z-10">
          <ProgressBar counterName={counter.name} value={counter.dailyCount || 0} max={counter.dailyGoal} />
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <span className="text-[7rem] font-extrabold text-white drop-shadow-lg select-none" style={{ letterSpacing: '0.05em' }}>{counter.value}</span>
      </div>
      {/* Floating close button */}
      <button
        className="fixed bottom-8 right-8 bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-3xl border border-gray-700"
        style={{ zIndex: 100 }}
        onClick={e => { e.stopPropagation(); setOpen(undefined); }}
        aria-label="Close Fullscreen"
      >
        &times;
      </button>
    </div>
  );
}
