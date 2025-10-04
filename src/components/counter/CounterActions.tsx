import React from 'react';
import IconButton from '@/components/ui/IconButton';
import { FullscreenIcon, EditIcon, DeleteIcon } from '@/components/ui/CounterIcons';
import { useCounterContext } from '@/context/CounterContext';

export default function CounterActions({ id, setFullscreenOpen }: { id: string, setFullscreenOpen: (id: string | false) => void }) {
    const { counters, handleEditCounter, handleDeleteCounter } = useCounterContext();
    const counter = counters.find(c => c.id === id);
    if (!counter) return null;
    return (
        <div className="flex items-center gap-2">
            <IconButton onClick={() => setFullscreenOpen(id)} title="Full Screen Mode">
                <FullscreenIcon />
            </IconButton>
            <IconButton onClick={() => handleEditCounter(counter)} title="Edit counter">
                <EditIcon />
            </IconButton>
            <IconButton
                onClick={() => {
                    if (window.confirm('Are you sure you want to delete this counter?')) handleDeleteCounter(counter.id);
                }}
                title="Delete counter"
                className="text-red-400"
            >
                <DeleteIcon />
            </IconButton>
        </div>
    );
}
