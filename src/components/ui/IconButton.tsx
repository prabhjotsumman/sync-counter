import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export default function IconButton({ onClick, title, className = '', children }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl border border-gray-700 transition-colors duration-200 min-w-[48px] min-h-[48px] ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}
