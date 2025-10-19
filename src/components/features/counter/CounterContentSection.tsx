/**
 * CounterContentSection component - Value display and increment functionality
 *
 * This component handles the main content area with counter value display
 * and increment button functionality.
 */

import React, { memo } from 'react';
import CounterValue from './CounterValue';
import IncrementButton from './IncrementButton';

/**
 * Props for the CounterContentSection component
 */
interface CounterContentSectionProps {
  counterId: string;
  className?: string;
}

/**
 * Main content section with value display and increment functionality
 */
const CounterContentSection: React.FC<CounterContentSectionProps> = memo(({
  counterId,
  className = ''
}) => (
  <div className={className}>
    <CounterValue id={counterId} />
    <IncrementButton id={counterId} />
  </div>
));

CounterContentSection.displayName = 'CounterContentSection';

export default CounterContentSection;
