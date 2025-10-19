'use client';
import React, { useState } from 'react';
import IconButton from '@/components/ui/IconButton';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { FullscreenIcon, EditIcon, DeleteIcon } from '@/components/ui/CounterIcons';
import { useCounterContext } from '@/providers/CounterContext';

export default function CounterActions({ id, setFullscreenOpen }: { id: string, setFullscreenOpen: (id: string | false) => void }) {
    const { counters, handleEditCounter, handleDeleteCounter } = useCounterContext();
    const counter = counters.find(c => c.id === id);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    if (!counter) return null;

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        handleDeleteCounter(counter.id);
        setShowDeleteModal(false);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <IconButton onClick={() => setFullscreenOpen(id)} title="Full Screen Mode">
                    <FullscreenIcon />
                </IconButton>
                <IconButton onClick={() => handleEditCounter(counter)} title="Edit counter">
                    <EditIcon />
                </IconButton>
                <IconButton
                    onClick={handleDeleteClick}
                    title="Delete counter"
                    className="text-red-400 hover:text-red-300"
                >
                    <DeleteIcon />
                </IconButton>
            </div>

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                counterName={counter.name}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </>
    );
}
