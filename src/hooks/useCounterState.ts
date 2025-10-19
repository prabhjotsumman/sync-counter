/**
 * Custom hook for counter state management and logic
 *
 * This hook encapsulates all the state management logic for counters,
 * including finding counters, handling fullscreen state, and styling.
 */

import type { Counter } from '@/types';
import { useMemo } from 'react';
import { useCounterContext } from '@/providers/CounterContext';
import { getDynamicClasses } from '@/utils/styles';
import { mergeCounterStyles } from '@/utils/styles';

/**
 * Props for counter state management
 */
interface UseCounterStateProps {
  id: string;
  styles?: Partial<import('@/utils/styles').CounterStyles>;
}

/**
 * Return type for the useCounterState hook
 */
interface CounterStateReturn {
  counter: Counter | undefined;
  isInFullscreen: boolean;
  dynamicClasses: string;
  STYLES: import('@/utils/styles').CounterStyles;
  handleFullscreenToggle: (id: string | false) => void;
  handleModalClose: () => void;
}

/**
 * Custom hook that manages counter state and related logic
 */
export const useCounterState = ({ id, styles: customStyles }: UseCounterStateProps): CounterStateReturn => {
  // Extract required context values with memoization for performance
  const { counters, isOffline, anyFullscreen, setAnyFullscreen } = useCounterContext();

  // Merge custom styles with defaults
  const STYLES = useMemo(() => mergeCounterStyles(customStyles), [customStyles]);

  // Memoize fullscreen state check
  const isInFullscreen = useMemo(() =>
    anyFullscreen === id,
    [anyFullscreen, id]
  );

  // Memoize dynamic classes for performance
  const dynamicClasses = useMemo(() =>
    getDynamicClasses(isOffline),
    [isOffline]
  );

  // Handle fullscreen toggle with proper type safety
  const handleFullscreenToggle = (id: string | false): void => {
    setAnyFullscreen(id);
  };

  // Adapter function for FullScreenCounterModal setOpen prop
  const handleModalClose = (): void => {
    setAnyFullscreen(false);
  };

  // Find the target counter with early return for better performance
  const counter = useMemo(() =>
    counters.find(c => c.id === id),
    [counters, id]
  );

  return {
    counter,
    isInFullscreen,
    dynamicClasses,
    STYLES,
    handleFullscreenToggle,
    handleModalClose,
  };
};
