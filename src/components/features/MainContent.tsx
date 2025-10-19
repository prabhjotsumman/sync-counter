import React from 'react';
import AppHeader from './AppHeader';
import { CounterGrid } from './CounterGrid';
import { SyncStatus } from './SyncStatus';
import CounterModal from './counter/CounterModal';
import UserDisplay from './UserDisplay';

import type { Counter } from '@/lib/counters';

export default function MainContent({ editingCounter, pendingRequests, isOnline, isOffline, fetchCounters, syncPendingChangesToServer, currentUser, onUpdateUsername }: {
  editingCounter: Counter | null;
  pendingRequests: number;
  isOnline: boolean;
  isOffline: boolean;
  fetchCounters: () => Promise<void>;
  syncPendingChangesToServer: () => Promise<void>;
  currentUser: string | null;
  onUpdateUsername: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-12">
      <AppHeader />
      <CounterGrid />
      <SyncStatus
        pendingRequests={pendingRequests}
        isOnline={isOnline}
        isOffline={isOffline}
        syncPendingChangesToServer={syncPendingChangesToServer}
        fetchCounters={fetchCounters}
      />
      <UserDisplay currentUser={currentUser} onUpdateUsername={onUpdateUsername} />
      <CounterModal id={editingCounter?.id ?? ''} />
    </div>
  );
}
