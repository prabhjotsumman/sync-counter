import React from 'react';
import AppHeader from './AppHeader';
import { CounterGrid } from '@/components/page/CounterGrid';
import { SyncStatus } from '@/components/page/SyncStatus';
import CounterModal from '@/components/counter/CounterModal';

export default function MainContent({ editingCounter, pendingRequests, isOnline, isOffline, fetchCounters, syncPendingChangesToServer }: {
  editingCounter: any;
  pendingRequests: number;
  isOnline: boolean;
  isOffline: boolean;
  fetchCounters: () => Promise<void>;
  syncPendingChangesToServer: () => Promise<void>;
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
      <CounterModal id={editingCounter?.id ?? ''} />
    </div>
  );
}
