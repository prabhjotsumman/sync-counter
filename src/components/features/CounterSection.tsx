import React from 'react';
import { Counter } from '@/components/features/counter';

interface CounterSectionProps {
    title?: string;
    counters: Array<{ id: string }>;
    className?: string;
}

export const CounterSection: React.FC<CounterSectionProps> = ({
    title,
    counters,
    className = ""
}) => {
    if (counters.length === 0) {
        return null;
    }

    return (
        <div className={`mb-8 ${className}`}>
            {title && <div className="flex items-center justify-center mb-8">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
                <div className="px-6 py-3">
                    <span className="text-white text-sm font-bold">
                        {title} ({counters.length})
                    </span>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
            </div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {counters.map((counter) => (
                    <Counter key={counter.id} id={counter.id} />
                ))}
            </div>
        </div>
    );
};
