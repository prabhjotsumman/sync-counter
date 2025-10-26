'use client';
import { useCallback, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import ProgressBar from './ProgressBar';
import CounterCustomization from './CounterCustomization';
import { ImageIcon, TextIcon } from '@/components/ui/CounterIcons';
import { useCounterContext } from '@/providers/CounterContext';
import { useCounterLogic } from '@/hooks/useCounterLogic';
import type { Counter } from '@/types';

type Bubble = { id: number; createdAt: number };

interface FullScreenCounterModalProps {
  id: string;
  open: boolean;
  setOpen: (id?: string) => void;
}

// Extended counter interface with custom properties
interface ExtendedCounter extends Counter {
  customImage?: string;
  customText?: string;
}

export default function FullScreenCounterModal({ id, open, setOpen }: FullScreenCounterModalProps) {
  const { counters, handleCounterUpdate } = useCounterContext();
  const counter = counters.find(c => c.id === id);

  // Load saved customizations from localStorage
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>('');

  useEffect(() => {
    if (counter) {
      // Load saved image
      const savedImages = JSON.parse(localStorage.getItem('counterCustomImages') || '{}');
      const savedImage = savedImages[counter.id];
      const extendedCounter = counter as ExtendedCounter;
      setCustomImage(savedImage || extendedCounter.customImage || null);

      // Load saved text
      const savedTexts = JSON.parse(localStorage.getItem('counterCustomTexts') || '{}');
      const savedText = savedTexts[counter.id];
      setCustomText(savedText || extendedCounter.customText || '');
    }
  }, [counter]);

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

  const handleCustomizationUpdate = (updates: Partial<ExtendedCounter>) => {
    const updatedCounter = { ...counter, ...updates } as ExtendedCounter;
    handleCounterUpdate(id, updatedCounter);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white items-center justify-center"
      style={{ minHeight: '100vh', minWidth: '100vw', touchAction: 'manipulation' }}
      onClick={onClick}
    >
      {/* Progress bar in top-right corner (absolute) */}
      {typeof counter.dailyGoal === 'number' && counter.dailyGoal > 0 && (
        <div className="absolute top-2 md:top-0 right-2 md:right-0 w-full max-w-full z-10">
          <ProgressBar counterName={counter.name} value={counter.dailyCount || 0} max={counter.dailyGoal} history={counter.history} />
        </div>
      )}

      {/* Center value and bubble overlay */}
      <div className="relative flex-1 flex flex-col items-center justify-center w-full">
        {/* Custom content above value */}
        {(customImage || customText) && (
          <div className="mb-8 md:mb-12 flex flex-col items-center space-y-4 md:space-y-6 px-4">
            {/* Custom Image */}
            {customImage && (
              <div className="relative mb-4 md:mb-8">
                <Image
                  src={customImage}
                  alt="Custom counter image"
                  width={800}
                  height={600}
                  className="max-w-[90vw] max-h-[50vh] md:max-w-4xl md:max-h-[60vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                />
              </div>
            )}

            {/* Custom Text */}
            {customText && (
              <div className="text-center px-2 md:px-4">
                <p className="text-lg md:text-3xl font-semibold text-white drop-shadow-lg max-w-[85vw] md:max-w-2xl break-words leading-relaxed">
                  {customText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bubbles overlay above the value */}
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          {bubbles.map(b => (
            <span
              key={b.id}
              className="ekonkar-bubble spiritual-glow text-yellow-400 text-4xl md:text-6xl select-none"
              style={{ top: '40%' }}
              aria-hidden
            >
              ੴ
            </span>
          ))}
        </div>
        {/* Main counter value */}
        <span className="text-6xl md:text-[7rem] font-extrabold text-white drop-shadow-lg select-none" style={{ letterSpacing: '0.05em' }}>{counter.value}</span>
      </div>

      {/* All buttons in single column - bottom right */}
      <div
        className="fixed bottom-6 md:bottom-8 right-6 md:right-8 flex flex-col gap-2 md:gap-3 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Customization buttons */}
        <CounterCustomization
          counter={counter}
          onUpdate={handleCustomizationUpdate}
          className="relative"
        />

        {/* Close button */}
        <button
          className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl md:text-3xl border border-gray-700 transition-colors"
          style={{ zIndex: 100 }}
          onClick={e => { e.stopPropagation(); setOpen(undefined); }}
          aria-label="Close Fullscreen"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
