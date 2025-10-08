import React from "react";
import { getUserColor, getAllUserColors } from "@/lib/offlineUtils";

interface ProgressBarProps {
  counterName?: string;
  value: number;
  max: number;
  showProgressText?: boolean;
  history?: Record<string, { users: Record<string, number>; total: number; day?: string }>;
}

export default function ProgressBar({ counterName, value, max, showProgressText = true, history }: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  const left = Math.max(0, max - value);
  const isGoalMet = left === 0;
  
  // Get today's date key - use YYYY-MM-DD format to match the API
  const today = new Date().toISOString().slice(0, 10);
  const todayHistory = history?.[today];
  
  // Create user color segments for the progress bar
  const renderUserSegments = () => {
    if (!todayHistory?.users || Object.keys(todayHistory.users).length === 0) {
      // Fallback to single color if no user data
      return (
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-500 ${isGoalMet ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
          style={{ width: `${percent}%` }}
        />
      );
    }
    
    const totalUserCount = todayHistory.total;
    if (totalUserCount === 0) return null;
    
    const userColors = getAllUserColors();
    let currentPosition = 0;
    
    return Object.entries(todayHistory.users).map(([username, userCount]) => {
      const userPercent = (userCount / totalUserCount) * percent;
      const segmentWidth = userPercent;
      const leftPosition = currentPosition;
      
      currentPosition += userPercent;
      
      const userColor = userColors[username] || getUserColor(username);
      
      return (
        <div
          key={username}
          className="absolute top-0 h-full transition-all duration-500"
          style={{
            left: `${leftPosition}%`,
            width: `${segmentWidth}%`,
            backgroundColor: userColor,
          }}
        />
      );
    });
  };
  
  return (
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
                  : <>{value} / {max} of daily goal &middot; <span className="font-bold">{left} left</span></>}
              </span>
            </div>
        )}
      </div>
    </div >
  );
}
