/**
 * CounterContainer component - Main container with styling and state management
 *
 * This component handles the main counter display logic, styling, and state management
 * while delegating specific functionality to specialized sub-components.
 */

import React, { memo } from 'react';
import type { CounterProps } from '@/types';
import { useCounterState } from '@/hooks/useCounterState';
import type { CounterStyles } from '@/utils/styles';

// Sub-components
import CounterProgressSection from './CounterProgressSection';
import CounterHeaderSection from './CounterHeaderSection';
import CounterContentSection from './CounterContentSection';
import FullScreenCounterModal from './FullScreenCounterModal';

/**
 * Props for the CounterContainer component
 */
interface CounterContainerProps extends CounterProps {
  styles?: Partial<CounterStyles>;
}

/**
 * Main container component that manages counter state and layout
 */
const CounterContainer: React.FC<CounterContainerProps> = memo(({
  id,
  styles: customStyles
}) => {
  // Use the extracted counter state hook
  const {
    counter,
    isInFullscreen,
    dynamicClasses,
    STYLES,
    handleFullscreenToggle,
    handleModalClose,
  } = useCounterState({ id, styles: customStyles });

  // Early return for non-existent counters
  if (!counter) {
    return null;
  }

  return (
    <div
      className={`${STYLES.containerClasses} ${dynamicClasses}`}
      role="article"
      aria-labelledby={`counter-${id}-name`}
    >
      {/* Progress Section - Shows daily goal progress when available */}
      <CounterProgressSection counter={counter} />

      {/* Header Section - Contains action buttons */}
      <CounterHeaderSection
        counterId={id}
        isFullscreen={isInFullscreen}
        onToggleFullscreen={handleFullscreenToggle}
      />

      {/* Content Section - Value display and increment functionality */}
      <CounterContentSection counterId={id} />

      {/* Fullscreen Modal - Conditionally rendered when in fullscreen mode */}
      <FullScreenCounterModal
        id={id}
        open={isInFullscreen}
        setOpen={handleModalClose}
      />
    </div>
  );
});

CounterContainer.displayName = 'CounterContainer';

export default CounterContainer;
