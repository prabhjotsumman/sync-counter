'use client';

import { useState, useEffect } from 'react';
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
    handleUsernameSubmit,
    currentUser,
    handleUpdateUsername
  } = useCountersPageLogic();

  const [usernameInput, setUsernameInput] = useState('');

  // Pre-fill username input when updating
  useEffect(() => {
    if (showUsernameModal && currentUser) {
      setUsernameInput(currentUser);
    } else if (!showUsernameModal) {
      setUsernameInput('');
    }
  }, [showUsernameModal, currentUser]);

  return (
    <div className="min-h-screen bg-black text-white">
      <UsernameModal
        show={showUsernameModal}
        value={usernameInput}
        onChange={setUsernameInput}
        onSubmit={() => handleUsernameSubmit(usernameInput)}
        currentUser={currentUser}
      />
      <MainContent
        editingCounter={editingCounter}
        pendingRequests={pendingRequests}
        isOnline={isOnline}
        isOffline={isOffline}
        fetchCounters={fetchCounters}
        syncPendingChangesToServer={syncPendingChangesToServer}
        currentUser={currentUser}
        onUpdateUsername={handleUpdateUsername}
      />
    </div>
  );
}
