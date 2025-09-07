'use client';


import CounterModal from '@/components/counter/CounterModal';
import { useCountersPageLogic } from '@/hooks/useCountersPageLogic';
import { StatusHeader } from '@/components/page/StatusHeader';
import { CounterGrid } from '@/components/page/CounterGrid';
import { SyncStatus } from '@/components/page/SyncStatus';

export default function Page() {
  const {
    anyFullscreen,
    setAnyFullscreen,
    counters,
    modalOpen,
    setModalOpen,
  modalMode,
  editingCounter,
    isOnline,
    isOffline,
    pendingRequests,
    isConnected,
    handleCounterUpdate,
    handleEditCounter,
    handleAddCounter,
    handleSaveCounter,
    handleDeleteCounter,
    fetchCounters,
    syncPendingChangesToServer
  } = useCountersPageLogic();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <StatusHeader isOnline={isOnline} isConnected={isConnected} pendingRequests={pendingRequests} />
        <CounterGrid
          counters={counters}
          anyFullscreen={anyFullscreen}
          setAnyFullscreen={setAnyFullscreen}
          isOffline={isOffline}
          handleCounterUpdate={handleCounterUpdate}
          handleEditCounter={handleEditCounter}
          handleDeleteCounter={handleDeleteCounter}
          handleAddCounter={handleAddCounter}
        />

        <SyncStatus
          pendingRequests={pendingRequests}
          isOnline={isOnline}
          isOffline={isOffline}
          syncPendingChangesToServer={syncPendingChangesToServer}
          fetchCounters={fetchCounters}
        />

        <CounterModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          counter={editingCounter}
          mode={modalMode}
          onSave={handleSaveCounter}
        />
      </div>
    </div>
  );
}
