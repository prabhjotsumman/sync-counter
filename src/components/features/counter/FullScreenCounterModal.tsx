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

  const handleCustomizationUpdate = (updates: Partial<ExtendedCounter>) => {
    const updatedCounter = { ...counter, ...updates } as ExtendedCounter;
    handleCounterUpdate(id, updatedCounter);

    // If removing the image, also clear any stored fallbacks
    if (updates.customImage === undefined) {
      const savedImages = safeGetItem('counterCustomImages');
      delete savedImages[counter?.id ?? id];
      delete savedImages[`${counter?.id ?? id}_fallback`];
      safeSetItem('counterCustomImages', savedImages);
    }

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

  const safeSetItem = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`⚠️ Could not write to localStorage (${key}):`, error);
    }
  };

  // Draggable separator state
  const [separatorPosition, setSeparatorPosition] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);

  const updateSeparatorPosition = useCallback((position: number) => {
    setSeparatorPosition(prev => {
      const clamped = Math.max(20, Math.min(80, position));
      return Math.abs(prev - clamped) < 0.5 ? prev : clamped;
    });
  }, []);

  // Handle separator drag
  const handleSeparatorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle touch events for mobile
  const handleSeparatorTouchStart = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const container = document.querySelector('[data-separator-container]') as HTMLElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const newPosition = ((e.clientY - containerRect.top) / containerRect.height) * 100;
          updateSeparatorPosition(newPosition);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const container = document.querySelector('[data-separator-container]') as HTMLElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const touch = e.touches[0];
          const newPosition = ((touch.clientY - containerRect.top) / containerRect.height) * 100;
          updateSeparatorPosition(newPosition);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, updateSeparatorPosition]);

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

  useEffect(() => {
    if (!counter) return;

    // Images are now stored in counter data, no need to load from localStorage
    const extendedCounter = counter as ExtendedCounter;
    setCustomImage(extendedCounter.customImage || null);

    // Load fallback image from localStorage if counter data doesn't have one
    const savedImages = safeGetItem('counterCustomImages');
    const fallbackImage = savedImages[`${counter.id}_fallback`] || savedImages[counter.id];

    if (fallbackImage && !extendedCounter.customImage) {
      console.log('🔄 Loading image from localStorage fallback');
      setCustomImage(fallbackImage);
      // Update counter data without calling handleCustomizationUpdate to avoid hook inconsistencies
      handleCounterUpdate(id, { ...counter, customImage: fallbackImage } as ExtendedCounter);
    }

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
  }, [counter, id, handleCounterUpdate]);

  const show = open && !!counter;
  if (!show || !counter) return null;

  const baseCounter = counter as ExtendedCounter;
  const counterWithLocalCustomizations: ExtendedCounter = {
    ...baseCounter,
    customImage: customImage ?? baseCounter.customImage,
    customText: customText || baseCounter.customText,
    customTextSize: customTextSize || baseCounter.customTextSize,
    customTextColor: customTextColor || baseCounter.customTextColor,
  };

  const onClick = () => {
    console.log('🖱️ Modal onClick triggered - incrementing counter');
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
        <div className="absolute top-2 md:top-0 right-2 md:right-0 w-full max-w-full z-10">
          <ProgressBar counterName={counter.name} value={counter.dailyCount || 0} max={counter.dailyGoal} history={counter.history} />
        </div>
      )}

      {/* Center value and bubble overlay */}
      <div className="relative flex-1 flex flex-col items-center justify-center w-full min-h-0">
        {/* Custom content above value - Flexible layout */}
        {(customImage || customText) && (
          <div
            className="flex flex-col w-full max-w-6xl px-4 mb-8 md:mb-12"
            data-separator-container
            style={{
              height: customImage && customText ? 'calc(100vh - 8rem)' : 'calc(100vh - 12rem)',
              maxHeight: customImage && customText ? '75vh' : '65vh'
            }}
          >
            {customImage && customText ? (
              // Both image and text present - show separator
              <>
                {/* Image section */}
                <div
                  className="flex-shrink-0 flex items-center justify-center overflow-hidden w-full"
                  style={{ height: `${separatorPosition}%` }}
                >
                  <div className="relative w-full h-full max-w-full">
                    <Image
                      src={customImage}
                      alt="Custom counter image"
                      fill
                      sizes="(min-width: 1024px) 60vw, 90vw"
                      className="object-contain rounded-lg shadow-2xl"
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
                </div>

                {/* Draggable separator */}
                <div
                  className={`relative flex items-center justify-center py-3 cursor-row-resize select-none transition-colors touch-none ${
                    isDragging ? 'bg-blue-500 bg-opacity-50' : 'hover:bg-gray-700 hover:bg-opacity-30'
                  }`}
                  onMouseDown={handleSeparatorMouseDown}
                  onTouchStart={handleSeparatorTouchStart}
                  style={{ height: '12px' }}
                >
                  <div className="w-16 h-1.5 bg-gray-400 rounded-full opacity-70 hover:opacity-100 transition-opacity shadow-sm"></div>
                  {/* Subtle grip lines */}
                  <div className="absolute flex space-x-1">
                    <div className="w-0.5 h-3 bg-gray-500 opacity-60 rounded-full"></div>
                    <div className="w-0.5 h-3 bg-gray-500 opacity-60 rounded-full"></div>
                    <div className="w-0.5 h-3 bg-gray-500 opacity-60 rounded-full"></div>
                  </div>
                </div>

                {/* Text section */}
                <div
                  className="flex-1 flex items-center justify-center overflow-hidden min-h-0"
                  style={{ height: `${100 - separatorPosition}%` }}
                >
                  <div className="w-full max-w-full h-full flex items-center justify-center">
                    <div className="max-h-full overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      <p
                        className={`text-center font-semibold drop-shadow-lg leading-relaxed ${
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
                  </div>
                </div>
              </>
            ) : (
              // Only image or only text - simple layout
              <div className="flex items-center justify-center h-full">
                {customImage && (
                  <div
                    className="relative w-full"
                    style={{ width: 'min(85vw, 48rem)', height: 'min(60vh, 32rem)' }}
                  >
                    <Image
                      src={customImage}
                      alt="Custom counter image"
                      fill
                      sizes="(min-width: 1024px) 48rem, 85vw"
                      className="object-contain rounded-lg shadow-2xl"
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

                {customText && (
                  <div className="max-h-[60vh] overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    <p
                      className={`text-center font-semibold drop-shadow-lg max-w-[80vw] md:max-w-2xl break-words leading-relaxed ${
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
        <span className="text-5xl md:text-[6rem] font-extrabold text-white drop-shadow-lg select-none mt-6 md:mt-8" style={{ letterSpacing: '0.05em' }}>{counter.value}</span>
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
          counter={counterWithLocalCustomizations}
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
