import type { Counter as CounterType } from "../../lib/counters";
import React from 'react';
import Counter from '@/components/Counter';
import type { CounterData } from '@/hooks/useCountersPageLogic';

interface CounterGridProps {
    counters: CounterData[];
    anyFullscreen: boolean;
    setAnyFullscreen: (open: boolean) => void;
    isOffline: boolean;
    handleCounterUpdate: (id: string, updatedCounter: CounterType) => void;
    handleEditCounter: (counter: CounterData) => void;
    handleDeleteCounter: (id: string) => void;
    handleAddCounter: () => void;
}

export function CounterGrid({
    counters,
    anyFullscreen,
    setAnyFullscreen,
    isOffline,
    handleCounterUpdate,
    handleEditCounter,
    handleDeleteCounter,
    handleAddCounter,
}: CounterGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {counters.map((counter) => (
                <Counter
                    key={counter.id}
                    id={counter.id}
                    name={counter.name}
                    value={counter.value}
                    dailyGoal={counter.dailyGoal}
                    dailyCount={counter.dailyCount}
                    onUpdate={handleCounterUpdate}
                    isOffline={isOffline}
                    onEdit={handleEditCounter}
                    onDelete={handleDeleteCounter}
                    setFullscreenOpen={setAnyFullscreen}
                />
            ))}
            {/* Add Counter Button below the last counter, centered */}
            {!anyFullscreen && (
                <div className="w-full flex justify-center mt-8">
                    <button
                        onClick={handleAddCounter}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-4xl transition-colors duration-200"
                        aria-label="Add Counter"
                    >
                        +
                    </button>
                </div>
            )}
        </div>
    );
}
