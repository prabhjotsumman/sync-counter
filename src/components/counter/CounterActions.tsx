import React from 'react';
import IconButton from '@/components/ui/IconButton';
import { FullscreenIcon, EditIcon, DeleteIcon } from '@/components/ui/CounterIcons';

interface CounterActionsProps {
    onFullscreen: () => void;
    onEdit?: (counter: { id: string; name: string; value: number; dailyGoal: number; dailyCount: number; }) => void;
    onDelete?: (id: string) => void;
    id: string;
    name: string;
    value: number;
    dailyGoal: number;
    dailyCount: number;
}

export default function CounterActions({
    onFullscreen,
    onEdit,
    onDelete,
    id,
    name,
    value,
    dailyGoal,
    dailyCount
}: CounterActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <IconButton onClick={onFullscreen} title="Full Screen Mode">
                <FullscreenIcon />
            </IconButton>
            {onEdit && (
                <IconButton onClick={() => onEdit({ id, name, value, dailyCount, dailyGoal })} title="Edit counter">
                    <EditIcon />
                </IconButton>
            )}
            {onDelete && (
                <IconButton
                    onClick={() => {
                        if (window.confirm('Are you sure you want to delete this counter?')) onDelete(id);
                    }}
                    title="Delete counter"
                    className="text-red-400"
                >
                    <DeleteIcon />
                </IconButton>
            )}
        </div>
    );
}
