'use client';
import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import ProgressBar from './ProgressBar';
import CounterCustomization from './CounterCustomization';
import { useCounterContext } from '@/providers/CounterContext';
import { useCounterLogic } from '@/hooks/useCounterLogic';
import type { Counter } from '@/lib/counters';
import { loadCustomImage, saveCustomImage, clearCustomImage } from '@/lib/customImageStorage';

type Bubble = {
  id: number;
  createdAt: number;
  duration: number;
  top: string;
  left: string;
  scale: number;
};

interface FullScreenCounterModalProps {
  id: string;
  open: boolean;
  setOpen: (id?: string) => void;
}

// Extended counter interface with custom properties
interface ExtendedCounter extends Counter {
  image_url?: string | null;
  customImage?: string;
  customText?: string;
  customTextSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  customTextColor?: 'white' | 'golden' | 'yellow' | 'orange' | 'pink' | 'sky' | 'emerald';
  customTextWeight?: 'regular' | 'bold';
  customTextGlow?: boolean;
}

type CustomTextSize = NonNullable<ExtendedCounter['customTextSize']>;
type CustomTextColor = NonNullable<ExtendedCounter['customTextColor']>;
type CustomTextWeight = NonNullable<ExtendedCounter['customTextWeight']>;

const SIZE_CLASS_MAP: Record<CustomTextSize, string> = {
  xs: 'text-base md:text-2xl',
  sm: 'text-lg md:text-3xl',
  md: 'text-2xl md:text-4xl',
  lg: 'text-3xl md:text-5xl',
  xl: 'text-4xl md:text-6xl',
  xxl: 'text-5xl md:text-7xl'
};

const TEXT_COLOR_HEX: Record<CustomTextColor, string> = {
  white: '#FFFFFF',
  golden: '#FBBF24',
  yellow: '#FEF08A',
  orange: '#FB923C',
  pink: '#F472B6',
  sky: '#38BDF8',
  emerald: '#34D399'
};

export default function FullScreenCounterModal({ id, open, setOpen }: FullScreenCounterModalProps) {
  const { counters, handleCounterUpdate } = useCounterContext();
  const counter = counters.find(c => c.id === id);

  // Load saved customizations from localStorage
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>('');
  const [customTextSize, setCustomTextSize] = useState<CustomTextSize>('md');
  const [customTextColor, setCustomTextColor] = useState<CustomTextColor>('white');
  const [customTextWeight, setCustomTextWeight] = useState<CustomTextWeight>('regular');
  const [customTextGlow, setCustomTextGlow] = useState<boolean>(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const fullscreenRequestedRef = useRef(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  const [separatorPosition, setSeparatorPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const textDisplayClass = useMemo(() => {
    const baseClass = SIZE_CLASS_MAP[customTextSize] ?? SIZE_CLASS_MAP.md;

    if (!customText) {
      return baseClass;
    }

    const length = customText.length;
    if (length > 450) return `${baseClass} leading-snug`;
    if (length > 280) return `${baseClass} leading-normal`;
    return `${baseClass} leading-relaxed`;
  }, [customText, customTextSize]);

  const textStyle = useMemo(() => ({
    color: TEXT_COLOR_HEX[customTextColor] ?? '#FFFFFF',
    fontWeight: customTextWeight === 'bold' ? 700 : 400,
    textShadow: customTextGlow
      ? '0 0 14px rgba(255,255,255,0.65), 0 0 36px rgba(255,255,255,0.35)'
      : 'none'
  }), [customTextColor, customTextWeight, customTextGlow]);

  const clearHideControlsTimeout = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (hideControlsTimeoutRef.current !== null) {
      window.clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    if (typeof window === 'undefined') return;
    clearHideControlsTimeout();
    if (customizationOpen) return;
    hideControlsTimeoutRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, [clearHideControlsTimeout, customizationOpen]);

  const handleUserInteraction = useCallback(() => {
    setControlsVisible(true);
    if (customizationOpen) {
      clearHideControlsTimeout();
      return;
    }
    scheduleHideControls();
  }, [scheduleHideControls, clearHideControlsTimeout, customizationOpen]);

  const handleCustomizationUpdate = useCallback((updates: Partial<ExtendedCounter>) => {
    if (!counter) return;

    const current = counter as ExtendedCounter;
    const updatedCounter: ExtendedCounter = { ...current, ...updates };

    const existingImage = customImage ?? current.customImage ?? current.image_url ?? null;

    if ('customImage' in updates) {
      if (updates.customImage) {
        updatedCounter.customImage = updates.customImage;
      } else {
        delete updatedCounter.customImage;
        updatedCounter.image_url = null;
      }
    } else if (existingImage) {
      updatedCounter.customImage = existingImage;
    }

    if ('image_url' in updates) {
      updatedCounter.image_url = updates.image_url ?? null;
    }

    if ('customText' in updates && updates.customText === undefined) {
      updatedCounter.customText = '';
    }
    if ('customTextSize' in updates && !updates.customTextSize) {
      updatedCounter.customTextSize = 'md';
    }
    if ('customTextColor' in updates && !updates.customTextColor) {
      updatedCounter.customTextColor = 'white';
    }
    if ('customTextWeight' in updates && !updates.customTextWeight) {
      updatedCounter.customTextWeight = 'regular';
    }
    if ('customTextGlow' in updates && updates.customTextGlow === undefined) {
      updatedCounter.customTextGlow = false;
    }

    handleCounterUpdate(id, updatedCounter);

    if ('customImage' in updates) {
      const imageValue = updates.customImage;
      if (imageValue) {
        setCustomImage(imageValue);
        saveCustomImage(counter?.id ?? id, imageValue);
      } else {
        setCustomImage(null);
        clearCustomImage(counter?.id ?? id);
      }
    }
    if (updates.customText !== undefined) {
      setCustomText(updates.customText || '');
    } else if (updates.counter_text !== undefined) {
      setCustomText(updates.counter_text || '');
    }
    if (updates.customTextSize !== undefined) {
      setCustomTextSize(updates.customTextSize || 'md');
    }
    if (updates.customTextColor !== undefined) {
      setCustomTextColor(updates.customTextColor || 'white');
    }
    if (updates.customTextWeight !== undefined) {
      setCustomTextWeight(updates.customTextWeight || 'regular');
    }
    if (updates.customTextGlow !== undefined) {
      setCustomTextGlow(!!updates.customTextGlow);
    }
  }, [counter, customImage, handleCounterUpdate, id]);

  const removeFullscreenImage = useCallback(async () => {
    const targetId = counter?.id ?? id;
    const fallbackClear = () => handleCustomizationUpdate({ customImage: undefined, image_url: null });

    try {
      const response = await fetch(`/api/counters/${targetId}/image`, { method: 'DELETE' });

      if (!response?.ok) {
        console.warn('⚠️ Failed to remove fullscreen image from server:', response?.status);
        fallbackClear();
        return;
      }

      console.log('🗑️ Fullscreen image removed from server for counter', targetId);
      fallbackClear();
    } catch (error) {
      console.warn('⚠️ Error while removing fullscreen image from server:', error);
      fallbackClear();
    }
  }, [counter?.id, id, handleCustomizationUpdate]);

  const safeGetItem = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : {};
    } catch (error) {
      console.warn(`⚠️ Could not read from localStorage (${key}):`, error);
      return {};
    }
  };

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

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const attemptFullscreen = async () => {
      if (!open) return;
      const docEl = document.documentElement as HTMLElement;
      if (document.fullscreenElement || fullscreenRequestedRef.current) return;
      const webkitRequest = (docEl as typeof docEl & {
        webkitRequestFullscreen?: () => Promise<void>;
        webkitRequestFullScreen?: () => Promise<void>;
      }).webkitRequestFullscreen || (docEl as typeof docEl & { webkitRequestFullScreen?: () => Promise<void> }).webkitRequestFullScreen;
      const mozRequest = (docEl as typeof docEl & { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen;
      const msRequest = (docEl as typeof docEl & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen;

      const request = docEl.requestFullscreen?.bind(docEl) || webkitRequest?.bind(docEl) || mozRequest?.bind(docEl) || msRequest?.bind(docEl);

      if (!request) return;

      try {
        await request();
        fullscreenRequestedRef.current = true;
      } catch (error) {
        console.debug('Fullscreen request failed:', error);
      }
    };

    attemptFullscreen();

    return () => {
      if (!open && fullscreenRequestedRef.current && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => undefined);
        fullscreenRequestedRef.current = false;
      }
    };
  }, [open]);

  useEffect(() => {
    if (customizationOpen) {
      setControlsVisible(true);
      clearHideControlsTimeout();
    } else {
      handleUserInteraction();
    }
  }, [customizationOpen, clearHideControlsTimeout, handleUserInteraction]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!open) {
      clearHideControlsTimeout();
      setControlsVisible(true);
      return;
    }

    handleUserInteraction();

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'keydown'];

    for (const event of events) {
      window.addEventListener(event, handleUserInteraction, { passive: true });
    }

    return () => {
      clearHideControlsTimeout();
      for (const event of events) {
        window.removeEventListener(event, handleUserInteraction);
      }
    };
  }, [open, handleUserInteraction, clearHideControlsTimeout]);

  // Bubble state (unconditional hook usage to keep hook order stable)
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleId = useRef(0);
  const bubbleContainerRef = useRef<HTMLDivElement | null>(null);

  const addBubble = useCallback((input?: { clientX: number; clientY: number }) => {
    const container = bubbleContainerRef.current;
    let top = '50%';
    let left = '50%';

    if (container && input) {
      const rect = container.getBoundingClientRect();
      const clampedX = Math.min(Math.max(input.clientX, rect.left), rect.right);
      const clampedY = Math.min(Math.max(input.clientY, rect.top), rect.bottom);
      left = `${clampedX - rect.left}px`;
      top = `${clampedY - rect.top}px`;
    }

    const duration = 1600 + Math.random() * 600; // 1600ms - 2200ms
    const scale = 0.95 + Math.random() * 0.3; // 0.95 - 1.25

    const newId = ++bubbleId.current;
    const bubble: Bubble = {
      id: newId,
      createdAt: Date.now(),
      duration,
      top,
      left,
      scale
    };

    setBubbles(prev => [...prev, bubble]);

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== newId));
      }, duration + 200);
    }
  }, []);

  const { handleIncrement } = useCounterLogic({
    id,
    onUpdate: handleCounterUpdate,
    currentCounter: counter,
  });

  const isInteractiveTarget = useCallback((target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('[data-interactive="true"]'));
  }, []);

  const handleTapIncrement = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.pointerType === 'pen' && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    if (event.pointerType === 'touch') {
      event.preventDefault();
    }

    handleIncrement();
    addBubble({ clientX: event.clientX, clientY: event.clientY });
  }, [addBubble, handleIncrement, isInteractiveTarget]);

  useEffect(() => {
    if (!counter) return;

    // Images are now stored in counter data, no need to load from localStorage
    const extendedCounter = counter as ExtendedCounter;
    setCustomImage(extendedCounter.customImage || extendedCounter.image_url || null);

    // Load fallback image from localStorage if counter data doesn't have one
    const storedImage = loadCustomImage(counter.id);

    if (storedImage && !extendedCounter.customImage && !extendedCounter.image_url) {
      console.log('🔄 Loading image from storage helper (fullscreen)');
      setCustomImage(storedImage);
      handleCounterUpdate(id, { ...counter, customImage: storedImage, image_url: undefined } as ExtendedCounter);
    }

    // Load saved text
    const savedTexts = safeGetItem('counterCustomTexts');
    const savedText = savedTexts[counter.id];
    setCustomText(savedText || extendedCounter.customText || extendedCounter.counter_text || '');

    // Load saved text size
    const savedTextSizes = safeGetItem('counterCustomTextSizes');
    const savedTextSize = savedTextSizes[counter.id];
    setCustomTextSize(savedTextSize || extendedCounter.customTextSize || 'md');

    // Load saved text color
    const savedTextColors = safeGetItem('counterCustomTextColors');
    const savedTextColor = savedTextColors[counter.id];
    setCustomTextColor(savedTextColor || extendedCounter.customTextColor || 'white');

    // Load saved text weight
    const savedTextWeights = safeGetItem('counterCustomTextWeights');
    const savedWeight = savedTextWeights[counter.id];
    setCustomTextWeight(savedWeight || extendedCounter.customTextWeight || 'regular');

    // Load saved text glow
    const savedGlow = safeGetItem('counterCustomTextGlow');
    const savedGlowValue = savedGlow[counter.id];
    setCustomTextGlow(savedGlowValue ?? extendedCounter.customTextGlow ?? false);
  }, [counter, id, handleCounterUpdate]);

  const show = open && !!counter;
  if (!show || !counter) return null;

  const baseCounter = counter as ExtendedCounter;
  const effectiveCustomText = customText || baseCounter.customText || baseCounter.counter_text || '';
  const counterWithLocalCustomizations: ExtendedCounter = {
    ...baseCounter,
    customImage: customImage ?? baseCounter.customImage ?? baseCounter.image_url ?? undefined,
    customText: effectiveCustomText,
    counter_text: effectiveCustomText || null,
    customTextSize: customTextSize || baseCounter.customTextSize,
    customTextColor: customTextColor || baseCounter.customTextColor,
    customTextWeight: customTextWeight || baseCounter.customTextWeight,
    customTextGlow: typeof customTextGlow === 'boolean' ? customTextGlow : baseCounter.customTextGlow,
  };

  const hasCustomImage = Boolean(customImage);
  const hasCustomText = Boolean(customText);
  const hasBothCustomContent = hasCustomImage && hasCustomText;
  const topSectionHeight = separatorPosition;
  const bottomSectionHeight = 100 - separatorPosition;
  const showCounterBelowSeparator = (hasCustomImage || hasCustomText) && !hasBothCustomContent;
  const showCounterInMainArea = !hasCustomImage && !hasCustomText;
  const showCounterAtBottom = showCounterInMainArea || hasBothCustomContent;

  const renderImageContent = () => {
    if (!customImage) {
      return <div className="w-full h-full" />;
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={customImage}
          alt="Custom counter image"
          fill
          sizes="(min-width: 1024px) 48rem, 85vw"
          className="object-contain rounded-lg shadow-2xl"
        />
        <div
          className={`absolute top-8 right-2 md:top-10 md:right-6 transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          data-interactive="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🗑️ Remove full screen image button clicked');
              removeFullscreenImage();
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
    );
  };

  const renderCounterValue = ({
    className = '',
    includeDefaultMargin = true,
    variant = 'default'
  }: {
    className?: string;
    includeDefaultMargin?: boolean;
    variant?: 'default' | 'solo' | 'singleContent';
  } = {}) => {
    const baseClasses = 'font-extrabold text-white drop-shadow-lg select-none text-center';
    const sizeClasses = (() => {
      if (variant === 'solo') return 'whitespace-nowrap leading-[0.85] max-w-[90vw] px-4';
      if (variant === 'singleContent') return 'whitespace-nowrap leading-[0.88] max-w-[88vw] px-4';
      return 'text-5xl md:text-[6rem]';
    })();
    const marginClasses = includeDefaultMargin ? 'mt-6 md:mt-8' : '';
    const combinedClasses = [baseClasses, sizeClasses, marginClasses, className].filter(Boolean).join(' ');

    const style: React.CSSProperties = {
      letterSpacing: '0.05em',
      ...(variant === 'solo'
        ? {
            fontSize: 'clamp(5rem, 20vw, 18rem)',
            lineHeight: 0.85
          }
        : variant === 'singleContent'
          ? {
              fontSize: 'clamp(4.5rem, 17vw, 14rem)',
              lineHeight: 0.88
            }
        : {})
    };

    return (
      <span className={combinedClasses} style={style}>
        {counter.value}
      </span>
    );
  };

  const renderTextContent = () => {
    if (!hasCustomText) {
      return <div className="w-full h-full" />;
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="max-h-full w-full overflow-y-auto py-4 md:py-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <p
            className={`text-center drop-shadow-lg w-full break-words leading-relaxed whitespace-pre-wrap px-4 md:px-6 ${textDisplayClass}`}
            style={textStyle}
          >
            {customText}
          </p>
        </div>
      </div>
    );
  };

  const showProgressBar = typeof counter.dailyGoal === 'number' && counter.dailyGoal > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white items-center justify-center"
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        touchAction: 'manipulation',
      }}
      onPointerDown={handleTapIncrement}
    >
      {/* Progress bar in top-right corner (absolute) */}
      {showProgressBar && (
        <div className="fixed inset-x-0 top-0 z-[70]">
          <ProgressBar counterName={counter.name} value={counter.dailyCount || 0} max={Number(counter.dailyGoal)} history={counter.history} />
        </div>
      )}

      {/* Center value and bubble overlay */}
      <div className="relative flex-1 flex flex-col items-center justify-center w-full min-h-0 gap-6">
        {/* Custom content above value - Flexible layout */}
        {(hasCustomImage || hasCustomText) && (
          <div
            className="flex flex-col w-full max-w-full h-full"
            data-separator-container
            style={{ height: 'calc(100vh - 4rem)', maxHeight: '90vh' }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center overflow-hidden w-full"
              style={{ height: `${topSectionHeight}%` }}
            >
              {hasCustomImage ? renderImageContent() : renderTextContent()}
            </div>

            <div
              className={`relative flex items-center justify-center py-3 cursor-row-resize select-none transition-colors touch-none ${
                isDragging ? 'bg-blue-500 bg-opacity-50' : 'hover:bg-gray-700 hover:bg-opacity-30'
              }`}
              onMouseDown={handleSeparatorMouseDown}
              onTouchStart={handleSeparatorTouchStart}
              data-interactive="true"
              style={{ height: '12px' }}
            >
              <div className="w-16 h-1.5 bg-gray-400 rounded-full opacity-70 hover:opacity-100 transition-opacity shadow-sm" />
              <div className="absolute flex space-x-1">
                <div className="w-0.5 h-3 bg-gray-500 opacity-60 rounded-full" />
                <div className="w-0.5 h-3 bg-gray-500 opacity-60 rounded-full" />
                <div className="w-0.5 h-3 bg-gray-500 opacity-60 rounded-full" />
              </div>
            </div>

            <div
              className="flex-1 flex items-center justify-center overflow-hidden min-h-0 w-full"
              style={{ height: `${bottomSectionHeight}%` }}
            >
              {hasBothCustomContent
                ? renderTextContent()
                : showCounterBelowSeparator
                  ? renderCounterValue({ includeDefaultMargin: false, variant: 'singleContent' })
                  : <div className="w-full h-full" />}
            </div>
          </div>
        )}

        {/* Bubbles overlay above the value */}
        <div
          ref={bubbleContainerRef}
          className="pointer-events-none absolute inset-0 z-50"
        >
          {bubbles.map(bubble => {
            const bubbleStyle = {
              top: bubble.top,
              left: bubble.left,
              '--bubble-duration': `${bubble.duration}ms`,
              '--bubble-scale': bubble.scale
            } as React.CSSProperties & Record<string, string | number>;

            return (
              <span
                key={bubble.id}
                className="ekonkar-bubble spiritual-glow text-3xl md:text-5xl select-none"
                style={bubbleStyle}
                aria-hidden
              >
                ੴ
              </span>
            );
          })}
        </div>
        {/* Main counter value */}
        {showCounterAtBottom && renderCounterValue({ variant: showCounterInMainArea ? 'solo' : 'default' })}
      </div>

      {/* All buttons in single column - bottom right */}
      <div
        className={`fixed bottom-6 md:bottom-8 right-6 md:right-8 flex flex-col gap-2 md:gap-3 z-[60] pointer-events-auto transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{ touchAction: 'manipulation' }}
        data-interactive="true"
      >
        {/* Customization buttons */}
        <CounterCustomization
          counter={counterWithLocalCustomizations}
          onUpdate={handleCustomizationUpdate}
          className="relative"
          onModalOpenChange={setCustomizationOpen}
        />

        {/* Close button */}
        {!customizationOpen && (
          <button
            className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl md:text-3xl border border-gray-700 transition-colors pointer-events-auto"
            style={{ zIndex: 100, touchAction: 'manipulation' }}
            onClick={e => { e.stopPropagation(); setOpen(undefined); }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            data-interactive="true"
            aria-label="Close Fullscreen"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
