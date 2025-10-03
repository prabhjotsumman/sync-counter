'use client';


import CounterModal from '@/components/counter/CounterModal';
import { useState } from 'react';
import { useCountersPageLogic } from '@/hooks/useCountersPageLogic';
//import { StatusHeader } from '@/components/page/StatusHeader';
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
    syncPendingChangesToServer,
    showUsernameModal,
    handleUsernameSubmit
  } = useCountersPageLogic();

  // Username modal state
  const [usernameInput, setUsernameInput] = useState('');

  return (
    <div className="min-h-screen bg-black text-white">
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6">Enter Your Name</h2>
            <input
              type="text"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Your name (required)"
              autoFocus
            />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => handleUsernameSubmit(usernameInput)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                disabled={!usernameInput.trim()}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center mb-8">
          <h1
            className="text-4xl font-bold spiritual-glow animate-ekOnkar inline-block text-yellow-400"
          >
            ੴ
          </h1>
        </div>


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
      {/* <StatusHeader isOnline={isOnline} isConnected={isConnected} pendingRequests={pendingRequests} /> */}
    </div>
  );
}
