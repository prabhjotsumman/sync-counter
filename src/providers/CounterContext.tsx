// CounterContext.tsx
// Context provider for counter state and actions

'use client';
import React, { createContext, useContext } from 'react';
import { Counter } from '@/lib/counters';
import { useCountersPageLogic } from '@/hooks/useCountersPageLogic';

interface CounterContextType {
    anyFullscreen: string | false;
    setAnyFullscreen: React.Dispatch<React.SetStateAction<string | false>>;
    counters: Counter[];
    setCounters: React.Dispatch<React.SetStateAction<Counter[]>>;
    handleCounterUpdate: (id: string, updatedCounter: Counter) => void;
    handleEditCounter: (counter: Counter) => void;
    handleAddCounter: () => void;
    handleSaveCounter: (counterData: Partial<Counter> & { name: string; value: number }) => Promise<void>;
    handleDeleteCounter: (id: string) => Promise<void>;
    modalOpen: boolean;
    setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    modalMode: 'edit' | 'add';
    setModalMode: React.Dispatch<React.SetStateAction<'edit' | 'add'>>;
    editingCounter: Counter | null;
    setEditingCounter: React.Dispatch<React.SetStateAction<Counter | null>>;
    isOnline: boolean;
    isOffline: boolean;
    pendingRequests: number;
    syncPendingChangesToServer: () => Promise<void>;
    fetchCounters: () => Promise<void>;
    showUsernameModal: boolean;
    handleUsernameSubmit: (name: string) => void;
}

const CounterContext = createContext<CounterContextType | undefined>(undefined);

export const CounterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        counters,
        setCounters,
        handleAddCounter,
        handleSaveCounter,
        handleDeleteCounter,
        handleCounterUpdate,
        handleEditCounter,
        modalOpen,
        setModalOpen,
        modalMode,
        setModalMode,
        editingCounter,
        setEditingCounter,
        isOnline,
        isOffline,
        pendingRequests,
        syncPendingChangesToServer,
        fetchCounters,
        showUsernameModal,
        handleUsernameSubmit,
        anyFullscreen,
        setAnyFullscreen,
    } = useCountersPageLogic();

    const contextValue: CounterContextType = {
        counters,
        setCounters,
        handleAddCounter,
        handleSaveCounter,
        handleDeleteCounter,
        handleCounterUpdate,
        handleEditCounter,
        modalOpen,
        setModalOpen,
        modalMode,
        setModalMode,
        editingCounter,
        setEditingCounter,
        isOnline,
        isOffline,
        pendingRequests,
        syncPendingChangesToServer,
        fetchCounters,
        showUsernameModal,
        handleUsernameSubmit,
        anyFullscreen,
        setAnyFullscreen,
    };
    return (
        <CounterContext.Provider value={contextValue}>
            {children}
        </CounterContext.Provider>
    );
};

export function useCounterContext() {
    const ctx = useContext(CounterContext);
    if (!ctx) throw new Error('useCounterContext must be used within a CounterProvider');
    return ctx;
}
