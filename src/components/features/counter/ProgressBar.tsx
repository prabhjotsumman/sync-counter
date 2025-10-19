import React, { useState, useEffect } from "react";
import Confetti from 'react-confetti';
import { getUserColor } from '@/lib/offlineUtils';
import { getTodayString } from "@/utils";

interface ProgressBarProps {
  counterName?: string;
  value: number;
  max: number;
  showProgressText?: boolean;
  history?: Record<string, { users: Record<string, number>; total: number; day?: string }>;
}

export default function ProgressBar({ counterName, value, max, showProgressText = true, history }: ProgressBarProps) {
  // Get today's progress from history (daily count for today) - use UTC-based date
  const today = getTodayString();

  // For progress bar, prioritize the value prop (dailyCount) over history
  // The dailyCount is the authoritative source of truth for today's progress
  const progressValue = value; // Use dailyCount value directly

  // Calculate progress percentage based on daily progress toward daily goal
  const percent = max > 0 ? Math.min(100, Math.round((progressValue / max) * 100)) : 0;
  const left = Math.max(0, max - progressValue);
  const isGoalMet = left === 0 && progressValue > 0;
  const [showConfetti, setShowConfetti] = useState(false);
  const [goalAchievedToday, setGoalAchievedToday] = useState(false);
  const [userColors, setUserColors] = useState<Record<string, string>>({});

  // Get user colors when history changes
  useEffect(() => {
    const fetchUserColors = async () => {
      if (history?.[today]?.users) {
        const colorPromises = Object.keys(history[today].users).map(async (username) => {
          const color = await getUserColor(username);
          return { username, color };
        });

        const colors = await Promise.all(colorPromises);
        const colorMap: Record<string, string> = {};
        colors.forEach(({ username, color }) => {
          colorMap[username] = color;
        });
        setUserColors(colorMap);
      }
    };

    fetchUserColors();
  }, [history, today]);

  // Force re-render when progress value changes significantly
  const [, forceUpdate] = useState({});
  useEffect(() => {
    // Force a re-render to ensure progress bar displays correctly
    // This is especially important for 0% to positive% transitions
    forceUpdate({});
  }, [progressValue, percent]);

  const todayHistory = history?.[today];

  // Create user color segments for the progress bar
  const renderUserSegments = () => {
    if (!todayHistory?.users || Object.keys(todayHistory.users).length === 0) {
      // Fallback to single color if no user data
      return (
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${isGoalMet ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
          style={{
            width: `${percent}%`
          }}
        />
      );
    }

    const totalUserCount = todayHistory.total;
    if (totalUserCount === 0) {
      // Render empty div to maintain structure
      return <div className="absolute left-0 top-0 h-full" style={{ width: '0%' }} />;
    }

    let currentPosition = 0;

    return Object.entries(todayHistory.users).map(([username, userCount]) => {
      const userPercent = (userCount as number / totalUserCount) * percent;
      const leftPosition = currentPosition;

      const userColor = userColors[username] || '#10B981'; // Fallback to green if no color found

      // For very small segments, ensure minimum visibility but don't create gaps
      if (userPercent < 0.1) {
        // Position at current location and advance by actual percentage
        currentPosition += userPercent;

        return (
          <div
            key={username}
            className="absolute top-0 h-full transition-all duration-700 ease-out"
            style={{
              left: `${leftPosition}%`,
              width: '0.1%', // Minimum visible width
              backgroundColor: userColor,
              opacity: 0.8 // Slightly transparent for very small segments
            }}
          />
        );
      } else {
        // Normal sized segment
        currentPosition += userPercent;

        return (
          <div
            key={username}
            className="absolute top-0 h-full transition-all duration-700 ease-out"
            style={{
              left: `${leftPosition}%`,
              width: `${userPercent}%`,
              backgroundColor: userColor,
              opacity: 1
            }}
          />
        );
      }
    });
  };

  // Trigger confetti when goal is achieved and not already shown today
  useEffect(() => {
    if (isGoalMet && progressValue > 0 && !goalAchievedToday) {
      setShowConfetti(true);
      setGoalAchievedToday(true);
      // Hide confetti after animation (adjust duration as needed)
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isGoalMet, progressValue, goalAchievedToday]);

  // Reset goalAchievedToday when the day changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date().toLocaleDateString('en-CA');
      if (currentDate !== today) {
        setGoalAchievedToday(false);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [today]);
  
  return (
    <>
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      <div className="w-full flex flex-col items-center pb-2">
        <div className="w-full h-6 bg-neutral-800 relative overflow-hidden flex items-center">
          {/* User color segments */}
          {renderUserSegments()}
          
          {/* Centered text */}
          {showProgressText && (
              <div className="absolute left-0 top-0 w-full h-full flex items-center justify-between px-3 z-10">
                <span className="font-bold text-white text-xs truncate max-w-[40%] text-left">{counterName?.toLocaleUpperCase()}</span>
                <span className={`text-xs text-right ${isGoalMet ? 'text-white font-bold' : 'text-white'}`} style={{ lineHeight: '1.5rem' }}>
                  {isGoalMet
                    ? 'Daily Goal achieved'
                    : <>{progressValue} / {max} of daily goal &middot; <span className="font-bold">{left} left</span></>}
                </span>
              </div>
          )}
        </div>
      </div >
    </>
  );
}
