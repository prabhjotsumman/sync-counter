'use client';

/**
 * Counter Component - Displays a single counter with all its functionality
 *
 * Features:
 * - Daily goal progress tracking with visual progress bar
 * - Increment functionality with user-specific color coding
 * - Full-screen modal support
 * - Offline status indication
 * - Responsive design for all screen sizes
 */

import React, { memo } from 'react';
import type { CounterProps } from '@/types';
import CounterContainer from './CounterContainer';

/**
 * Counter Component - A fully-featured counter display with progress tracking
 *
 * This is the main Counter component that delegates to CounterContainer
 * for better separation of concerns and maintainability.
 *
 * @param props - Component props containing counter ID
 * @returns Rendered counter component or null if counter not found
 *
 * @example
 * ```tsx
 * <Counter id="counter-123" />
 * ```
 */
const Counter: React.FC<CounterProps> = memo(({ id }) => {
  return <CounterContainer id={id} />;
});

Counter.displayName = 'Counter';

export default Counter;
