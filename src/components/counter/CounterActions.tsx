import React from 'react';

interface CounterActionsProps {
  onFullscreen: () => void;
  onEdit?: (counter: { id: string; name: string; value: number }) => void;
  onDelete?: (id: string) => void;
  isOffline?: boolean;
  id: string;
  name: string;
  value: number;
}

export default function CounterActions({
  onFullscreen,
  onEdit,
  onDelete,
  isOffline,
  id,
  name,
  value,
}: CounterActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onFullscreen}
        className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl border border-gray-700 transition-colors duration-200 min-w-[48px] min-h-[48px]"
        title="Full Screen Mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" />
        </svg>
      </button>
      {isOffline && (
        <div className="flex items-center gap-1 text-yellow-400 text-xs">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          Offline
        </div>
      )}
      {onEdit && (
        <button
          onClick={() => onEdit({ id, name, value })}
          className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl border border-gray-700 transition-colors duration-200 min-w-[48px] min-h-[48px]"
          title="Edit counter"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this counter?')) onDelete(id);
          }}
          className="bg-gray-900 hover:bg-gray-700 text-red-400 rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl border border-gray-700 transition-colors duration-200 min-w-[48px] min-h-[48px]"
          title="Delete counter"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
