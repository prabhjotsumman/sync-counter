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
  customTextSize?: 'sm' | 'md' | 'lg' | 'xl';
  customTextColor?: 'white' | 'golden' | 'yellow' | 'orange';
}

export default function FullScreenCounterModal({ id, open, setOpen }: FullScreenCounterModalProps) {
  const { counters, handleCounterUpdate } = useCounterContext();
  const counter = counters.find(c => c.id === id);

  // Load saved customizations from localStorage
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>('');
  const [customTextSize, setCustomTextSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [customTextColor, setCustomTextColor] = useState<'white' | 'golden' | 'yellow' | 'orange'>('white');

  useEffect(() => {
    if (counter) {
      // Images are now stored in counter data, no need to load from localStorage
      const extendedCounter = counter as ExtendedCounter;
      setCustomImage(extendedCounter.customImage || null);

      // Load saved text
      const savedTexts = safeGetItem('counterCustomTexts');
      const savedText = savedTexts[counter.id];
      setCustomText(savedText || extendedCounter.customText || '');

      // Load saved text size
      const savedTextSizes = safeGetItem('counterCustomTextSizes');
      const savedTextSize = savedTextSizes[counter.id];
      setCustomTextSize(savedTextSize || extendedCounter.customTextSize || 'md');

      // Load saved text color
      const savedTextColors = safeGetItem('counterCustomTextColors');
      const savedTextColor = savedTextColors[counter.id];
      setCustomTextColor(savedTextColor || extendedCounter.customTextColor || 'white');
    }
  }, [counter]);

  // Safe localStorage utility to prevent quota errors
  const safeGetItem = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : {};
    } catch (error) {
      console.warn(`⚠️ Could not read from localStorage (${key}):`, error);
      return {};
    }
  };

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
    console.log('🖱️ Modal onClick triggered - incrementing counter');
    handleIncrement();
    addBubble();
  };

  const handleCustomizationUpdate = (updates: Partial<ExtendedCounter>) => {
    const updatedCounter = { ...counter, ...updates } as ExtendedCounter;
    handleCounterUpdate(id, updatedCounter);

    // Update local state immediately for responsive UI
    if (updates.customImage !== undefined) {
      setCustomImage(updates.customImage || null);
    }
    if (updates.customText !== undefined) {
      setCustomText(updates.customText || '');
    }
    if (updates.customTextSize !== undefined) {
      setCustomTextSize(updates.customTextSize || 'md');
    }
    if (updates.customTextColor !== undefined) {
      setCustomTextColor(updates.customTextColor || 'white');
    }
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
              <div className="relative mb-4 md:mb-8 group">
                <Image
                  src={customImage}
                  alt="Custom counter image"
                  width={800}
                  height={600}
                  className="max-w-[90vw] max-h-[50vh] md:max-w-4xl md:max-h-[60vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                />
                {/* Remove button for full screen image */}
                <div className="absolute top-2 right-2 md:top-4 md:right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🗑️ Remove full screen image button clicked');
                      handleCustomizationUpdate({ customImage: undefined });
                    }}
                    className="bg-black bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-sm font-bold border border-gray-400 hover:border-gray-300 transition-all duration-200 backdrop-blur-sm"
                    style={{ zIndex: 100 }}
                    title="Remove image"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="md:w-7 md:h-7">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Custom Text */}
            {customText && (
              <div className="text-center px-2 md:px-4">
                <p
                  className={`font-semibold drop-shadow-lg max-w-[85vw] md:max-w-2xl break-words leading-relaxed ${
                    customTextSize === 'sm' ? 'text-base md:text-xl' :
                    customTextSize === 'md' ? 'text-lg md:text-3xl' :
                    customTextSize === 'lg' ? 'text-xl md:text-4xl' :
                    'text-2xl md:text-5xl'
                  }`}
                  style={{
                    color: customTextColor === 'white' ? '#FFFFFF' :
                           customTextColor === 'golden' ? '#FBBF24' :
                           customTextColor === 'yellow' ? '#FEF08A' :
                           '#FB923C'
                  }}
                >
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
        className="fixed bottom-6 md:bottom-8 right-6 md:right-8 flex flex-col gap-2 md:gap-3 z-[60] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{ touchAction: 'manipulation' }}
      >
        {/* Customization buttons */}
        <CounterCustomization
          counter={counter}
          onUpdate={handleCustomizationUpdate}
          className="relative"
        />

        {/* Close button */}
        <button
          className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl md:text-3xl border border-gray-700 transition-colors pointer-events-auto"
          style={{ zIndex: 100, touchAction: 'manipulation' }}
          onClick={e => { e.stopPropagation(); setOpen(undefined); }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          aria-label="Close Fullscreen"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
