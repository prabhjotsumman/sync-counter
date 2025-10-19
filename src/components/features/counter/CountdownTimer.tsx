import React, { useState, useEffect } from 'react';

/**
 * Circular countdown timer component that shows time remaining until daily reset
 */
interface CountdownTimerProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Gets the next reset time (19:20 UTC)
 */
const getNextResetTime = (): Date => {
  const now = new Date();
  const resetHour = 19; // 19:20 UTC (7:20 PM UTC)

  // If it's already past 19:20 UTC today, get tomorrow's reset time
  if (now.getUTCHours() >= resetHour) {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(resetHour, 20, 0, 0);
    return tomorrow;
  }

  // Otherwise, get today's reset time
  const today = new Date(now);
  today.setUTCHours(resetHour, 20, 0, 0);
  return today;
};

/**
 * Formats time remaining as HH:MM:SS
 */
const formatTimeRemaining = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Ek-Onkar Symbol Component (ੴ)
 */
const EkOnkarSymbol: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#FFD700' // Golden color
}) => (
  <div
    className="flex items-center justify-center select-none spiritual-glow animate-ekOnkar"
    style={{
      fontSize: `${size}px`,
      color,
      fontWeight: 'bold',
      fontFamily: 'serif'
    }}
  >
    ੴ
  </div>
);

/**
 * Circular countdown timer component with Ek-Onkar symbol
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  className = '',
  size = 60,
  strokeWidth = 4
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [nextReset, setNextReset] = useState<Date>(getNextResetTime());

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const remaining = nextReset.getTime() - now.getTime();

      if (remaining <= 0) {
        // Reset has occurred, calculate next reset time
        const newNextReset = getNextResetTime();
        setNextReset(newNextReset);
        setTimeRemaining(newNextReset.getTime() - now.getTime());
      } else {
        setTimeRemaining(remaining);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextReset]);

  // Calculate progress (0-1)
  const totalDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const progress = Math.max(0, Math.min(1, (totalDuration - timeRemaining) / totalDuration));

  // Calculate SVG properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* Circular countdown with Ek-Onkar symbol in center */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 215, 0, 0.2)" // Golden background
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle - Golden color */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FFD700" // Golden color
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Ek-Onkar symbol in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <EkOnkarSymbol size={size * 0.4} color="#FFD700" />
        </div>
      </div>

      {/* Time display below the circle */}
      <div className="mt-2">
        <span className="text-golden text-sm font-mono font-bold text-center block spiritual-glow">
          {formatTimeRemaining(timeRemaining)}
        </span>
      </div>
    </div>
  );
};

export default CountdownTimer;
