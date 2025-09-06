import React from 'react';

interface StatusHeaderProps {
  isOnline: boolean;
  isConnected: boolean;
  pendingRequests: number;
}

export function StatusHeader({ isOnline, isConnected, pendingRequests }: StatusHeaderProps) {
  return (
    <header className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4">Sync Counters</h1>
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          isOnline ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-400' : 'bg-yellow-400'
          }`}></div>
          {isOnline ? 'Online' : 'Offline'}
        </div>
        {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-300">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Local</span>
          </div>
        )}
        {isOnline && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-purple-400' : 'bg-gray-400'
            } ${isConnected ? 'animate-pulse' : ''}`}></div>
            {isConnected ? 'Real-time Sync' : 'Connecting...'}
          </div>
        )}
        {pendingRequests > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            {pendingRequests} pending
          </div>
        )}
      </div>
    </header>
  );
}
