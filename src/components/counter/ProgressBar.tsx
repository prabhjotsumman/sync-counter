import React from "react";

interface ProgressBarProps {
  value: number;
  max: number;
}

export default function ProgressBar({ value, max }: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  const left = Math.max(0, max - value);
  return (
    <div className="w-full flex flex-col items-center py-2">
      <div className="w-full h-3  bg-neutral-800 relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full  bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-neutral-400 mt-1">
        {percent}% of daily goal &middot; <span className="font-semibold text-blue-400">{left} left</span>
      </div>
    </div>
  );
}
