import React from "react";


interface ProgressBarProps {
  counterName?: string;
  value: number;
  max: number;
  showProgressText?: boolean;
}

export default function ProgressBar({ counterName, value, max, showProgressText = true }: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  const left = Math.max(0, max - value);
  const isGoalMet = left === 0;
  return (
    <div className="w-full flex flex-col items-center pb-2">
      <div className="w-full h-6 bg-neutral-800 relative overflow-hidden flex items-center">
        {/* Gradient bar, full width, with text absolutely centered */}
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-500 ${isGoalMet ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
          style={{ width: `${percent}%` }}
        />
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
