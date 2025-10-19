/**
 * CounterProgressSection component - Displays daily goal progress
 *
 * This component handles the progress bar display and daily goal visualization
 * for a counter, including confetti animation when goals are achieved.
 */

import React, { memo } from 'react';
import type { Counter as CounterType } from '@/types';
import { hasDailyGoal, getProgressValue } from '@/utils';
import ProgressBar from './ProgressBar';

/**
 * Props for the CounterProgressSection component
 */
interface CounterProgressSectionProps {
  counter: CounterType;
  className?: string;
}

/**
 * Progress bar section that displays daily goal progress
 */
const CounterProgressSection: React.FC<CounterProgressSectionProps> = memo(({
  counter,
  className = ''
}) => {
  if (!hasDailyGoal(counter)) {
    return null;
  }

  return (
    <div className={`absolute top-0 right-0 w-full max-w-full z-10 rounded-tl-md rounded-tr-md overflow-hidden ${className}`}>
      <ProgressBar
        key={`progress-${counter.id}-${counter.lastUpdated || Date.now()}`}
        counterName={counter.name}
        value={getProgressValue(counter)}
        max={counter.dailyGoal || 0}
        showProgressText={true}
        history={counter.history}
      />
    </div>
  );
});

CounterProgressSection.displayName = 'CounterProgressSection';

export default CounterProgressSection;
