'use client';
import React from 'react';
import { Counter } from '@/components/features/counter';
import { useCounterContext } from '@/providers/CounterContext';
import { sortCountersByUserActivity, hasCurrentUserInteractedEver, hasCurrentUserInteractedToday, getCurrentUser, getTodayString, getCurrentUserContribution } from '@/utils';

export function CounterGrid() {
    const { counters, handleAddCounter, modalOpen, currentUser: contextCurrentUser, isLoading } = useCounterContext();

    // Enhanced debugging for user detection
    const localStorageUser = getCurrentUser();
    const effectiveCurrentUser = contextCurrentUser || localStorageUser;

    console.log('🔍 CounterGrid Debug:', {
        contextCurrentUser,
        localStorageCurrentUser: getCurrentUser(),
        effectiveCurrentUser,
        hasLocalStorageUser: !!localStorageUser,
        hasContextUser: !!contextCurrentUser,
        userMismatch: contextCurrentUser !== localStorageUser,
        localStorageRaw: (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('syncCounterUser') : null
    });

    // Debug user detection for each counter
    console.log('🔍 Counter User Detection Analysis:', counters.map(c => ({
        id: c.id,
        name: c.name,
        users: c.users,
        hasTodayInteraction: hasCurrentUserInteractedToday(c, effectiveCurrentUser),
        hasEverInteraction: hasCurrentUserInteractedEver(c, effectiveCurrentUser),
        effectiveUserInCounter: effectiveCurrentUser ? (c.users?.[effectiveCurrentUser] !== undefined) : false,
        contextUserInCounter: contextCurrentUser ? (c.users?.[contextCurrentUser] !== undefined) : false,
        localStorageUserInCounter: localStorageUser ? (c.users?.[localStorageUser] !== undefined) : false,
        contributionCount: getCurrentUserContribution(c, effectiveCurrentUser)
    })));

    // Track state changes
    React.useEffect(() => {
        console.log('🔄 CounterGrid counters changed:', counters.length, counters.map(c => c.name));
    }, [counters]);

    React.useEffect(() => {
        console.log('⏳ CounterGrid loading changed:', isLoading);
    }, [isLoading]);

    // Sort counters so current user's active counters appear first
    const sortedCounters = sortCountersByUserActivity(counters, effectiveCurrentUser);

    // Enhanced user detection: check if current user exists in the users object
    const activeUserCounters = sortedCounters.filter(counter =>
        effectiveCurrentUser && counter.users?.[effectiveCurrentUser] !== undefined
    );

    // Other counters are those where current user is not present in users object
    const otherUserCounters = sortedCounters.filter(counter =>
        !effectiveCurrentUser || counter.users?.[effectiveCurrentUser] === undefined
    );

    // Smart fallback: if we have counters with user data but no active users detected,
    // it means user detection is failing - show all counters in that case
    const hasUserDataInCounters = counters.some(c =>
        Object.keys(c.users || {}).length > 0 ||
        (c.history && Object.values(c.history).some((h) => Object.keys(h.users || {}).length > 0))
    );

    const showDebugMode = activeUserCounters.length === 0 && otherUserCounters.length === 0 &&
                         counters.length > 0 && hasUserDataInCounters;

    // Simplified fallback: if we have counters but no user is detected, show all counters
    // This handles cases where user setup hasn't happened yet
    const showAllCountersFallback = counters.length > 0 && effectiveCurrentUser === null;

    // Enhanced debugging
    console.log('🔍 CounterGrid State Update:', {
        contextCurrentUser,
        localStorageCurrentUser: getCurrentUser(),
        effectiveCurrentUser,
        totalCounters: counters.length,
        activeUserCounters: activeUserCounters.length,
        otherUserCounters: otherUserCounters.length,
        isLoading,
        hasUserDataInCounters,
        showDebugMode,
        showAllCountersFallback,
        allCounterNames: counters.map(c => c.name),
        detailedCounters: counters.map(c => ({
            id: c.id,
            name: c.name,
            users: c.users,
            currentUserInUsers: effectiveCurrentUser ? (c.users?.[effectiveCurrentUser] !== undefined) : false,
            currentUserValue: effectiveCurrentUser ? (c.users?.[effectiveCurrentUser] || 0) : 0,
            todayHistory: c.history?.[getTodayString()],
            contributionCount: getCurrentUserContribution(c, effectiveCurrentUser)
        }))
    });

    return (
        <div className="max-w-6xl mx-auto">
            {/* Loading state */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg">Loading counters...</p>
                </div>
            ) : (
                <>
                    {/* Current User's Active Counters */}
                    {activeUserCounters.length > 0 && (
                        <div className="mb-8">
                            <div className="mb-4 text-center">
                                <span className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                                    Your Counters ({activeUserCounters.length})
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {activeUserCounters.map((counter) => (
                                    <Counter key={counter.id} id={counter.id} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Separator Line - Show when there are multiple groups or when debugging */}
                    {((activeUserCounters.length > 0 && otherUserCounters.length > 0) || showAllCountersFallback || showDebugMode) && (
                        <div className="flex items-center justify-center mb-8">
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
                            <div className="px-6 py-3 bg-gray-200 rounded-full border-2 border-gray-400 shadow-sm">
                                <span className="text-gray-700 text-sm font-bold">
                                    {activeUserCounters.length > 0 ? `Other Counters (${otherUserCounters.length})` : 'All Counters Together'}
                                </span>
                            </div>
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
                        </div>
                    )}

                    {/* Other Users' Counters */}
                    {otherUserCounters.length > 0 && (
                        <div className="mb-8">
                            <div className="mb-4 text-center">
                                <span className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full">
                                    Other Counters ({otherUserCounters.length})
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {otherUserCounters.map((counter) => (
                                    <Counter key={counter.id} id={counter.id} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Show all counters fallback - when no user is set up yet */}
                    {showAllCountersFallback && (
                        <div className="mb-8">
                            <div className="mb-4 text-center">
                                <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full">
                                    All Counters ({counters.length}) - Set up your username to see personalized view
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {counters.map((counter) => (
                                    <Counter key={counter.id} id={counter.id} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Show debug mode - when user data exists but detection fails */}
                    {showDebugMode && (
                        <div className="mb-8">
                            <div className="mb-4 text-center">
                                <span className="text-sm text-orange-600 font-semibold bg-orange-50 px-3 py-1 rounded-full">
                                    All Counters (Debug Mode - {counters.length}) - Check Console for User Detection Details
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {counters.map((counter) => (
                                    <Counter key={counter.id} id={counter.id} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No counters message */}
                    {counters.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No counters yet. Create your first counter!</p>
                        </div>
                    )}
                </>
            )}

            {/* Add Counter Button - only show if no modal is open and not loading */}
            {!modalOpen && !isLoading && (
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
