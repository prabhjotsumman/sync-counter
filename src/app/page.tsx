'use client';

import { useState } from 'react';
import { useCountersPageLogic } from '@/hooks/useCountersPageLogic';
import UsernameModal from '@/components/page/UsernameModal';
import MainContent from '@/components/page/MainContent';

export default function Page() {
  const {
    editingCounter,
    pendingRequests,
    isOnline,
    isOffline,
    fetchCounters,
    syncPendingChangesToServer,
    showUsernameModal,
    handleUsernameSubmit
  } = useCountersPageLogic();

  const [usernameInput, setUsernameInput] = useState('');

  return (
    <div className="min-h-screen bg-black text-white">
      <UsernameModal
        show={showUsernameModal}
        value={usernameInput}
        onChange={setUsernameInput}
        onSubmit={() => handleUsernameSubmit(usernameInput)}
      />
      <MainContent
        editingCounter={editingCounter}
        pendingRequests={pendingRequests}
        isOnline={isOnline}
        isOffline={isOffline}
        fetchCounters={fetchCounters}
        syncPendingChangesToServer={syncPendingChangesToServer}
      />
    </div>
  );
}
