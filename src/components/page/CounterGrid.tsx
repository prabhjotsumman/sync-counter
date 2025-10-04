
import React from 'react';
import Counter from '@/components/counter/Counter';
import { useCounterContext } from '@/context/CounterContext';

export function CounterGrid() {
    const { counters, handleAddCounter, modalOpen } = useCounterContext();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {counters.map((counter) => (
                <Counter key={counter.id} id={counter.id} />
            ))}
            {/* Add Counter Button below the last counter, centered */}
            {!modalOpen && (
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
