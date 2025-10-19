/**
 * CounterHeaderSection component - Contains counter action buttons
 *
 * This component handles the header section with action buttons like
 * fullscreen, edit, and delete for a counter.
 */

import React, { memo } from 'react';
import CounterActions from './CounterActions';

/**
 * Props for the CounterHeaderSection component
 */
interface CounterHeaderSectionProps {
  counterId: string;
  onToggleFullscreen: (id: string | false) => void;
  className?: string;
}

/**
 * Header section containing counter actions
 */
const CounterHeaderSection: React.FC<CounterHeaderSectionProps> = memo(({
  counterId,
  onToggleFullscreen,
  className = ''
}) => (
  <div className={`flex items-center justify-center mt-4 p-8 ${className}`}>
    <CounterActions
      id={counterId}
      setFullscreenOpen={onToggleFullscreen}
    />
  </div>
));

CounterHeaderSection.displayName = 'CounterHeaderSection';

export default CounterHeaderSection;
