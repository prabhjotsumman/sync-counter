'use client';
import { useCallback, useRef, useState } from 'react';
import ProgressBar from './ProgressBar';
import { useCounterContext } from '@/context/CounterContext';
import { useCounterLogic } from '@/hooks/useCounterLogic';

type Bubble = { id: number; createdAt: number };

export default function FullScreenCounterModal({ id, open, setOpen }: { id: string, open: boolean, setOpen: (id?: string) => void }) {
  const { counters, handleCounterUpdate } = useCounterContext();
  const counter = counters.find(c => c.id === id);

  // Bubble state (unconditional hook usage to keep hook order stable)
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleId = useRef(0);
  const bubbleLifespan = 950; // ms (slightly longer than CSS animation)

  const addBubble = useCallback(() => {
    const newId = ++bubbleId.current;
    setBubbles(prev => [...prev, { id: newId, createdAt: Date.now() }]);
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== newId));
    }, bubbleLifespan);
  }, []);

  const { handleIncrement } = useCounterLogic({
    id,
    onUpdate: handleCounterUpdate,
    currentCounter: counter,
  });

  const show = open && !!counter;
  if (!show || !counter) return null;

  const onClick = () => {
    handleIncrement();
    addBubble();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white items-center justify-center"
      style={{ minHeight: '100vh', minWidth: '100vw', touchAction: 'manipulation' }}
      onClick={onClick}
    >
      {/* Progress bar in top-right corner (absolute) */}
      {typeof counter.dailyGoal === 'number' && counter.dailyGoal > 0 && (
        <div className="absolute top-0 right-0 w-full max-w-full z-10">
          <ProgressBar counterName={counter.name} value={counter.dailyCount || 0} max={counter.dailyGoal} history={counter.history} />
        </div>
      )}

      {/* Center value and bubble overlay */}
      <div className="relative flex-1 flex flex-col items-center justify-center w-full">
        {/* Bubbles overlay above the value */}
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          {bubbles.map(b => (
            <span
              key={b.id}
              className="ekonkar-bubble spiritual-glow text-yellow-400 text-6xl select-none"
              style={{ top: '40%' }}
              aria-hidden
            >
              ੴ
            </span>
          ))}
        </div>
        {/* Main counter value */}
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
