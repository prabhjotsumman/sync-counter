import React from 'react';

interface SyncStatusProps {
  pendingRequests: number;
  isOnline: boolean;
  isOffline: boolean;
  syncPendingChangesToServer: () => Promise<void>;
  fetchCounters: () => Promise<void>;
}

export function SyncStatus({
  pendingRequests,
  isOnline,
  isOffline,
  syncPendingChangesToServer,
  fetchCounters,
}: SyncStatusProps) {
  return (
    <div className="text-center mt-12 space-y-4">
      {pendingRequests > 0 && isOnline && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => syncPendingChangesToServer().then(() => fetchCounters())}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Sync Offline Changes
          </button>
        </div>
      )}
      {isOffline && (
        <div className="text-yellow-400 text-sm">
          You&apos;re offline. Changes will be synced when you&apos;re back online.
        </div>
      )}
      {pendingRequests > 0 && isOnline && (
        <div className="text-blue-400 text-sm">
          Syncing {pendingRequests} offline changes...
        </div>
      )}
    </div>
  );
}
