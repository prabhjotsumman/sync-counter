module.exports = {

"[project]/src/lib/offlineStorage.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "addPendingChange": ()=>addPendingChange,
    "clearOfflineData": ()=>clearOfflineData,
    "clearPendingChanges": ()=>clearPendingChanges,
    "getLastServerSyncTimestamp": ()=>getLastServerSyncTimestamp,
    "getLastSyncTimestamp": ()=>getLastSyncTimestamp,
    "getOfflineCounters": ()=>getOfflineCounters,
    "getPendingChanges": ()=>getPendingChanges,
    "isDataStale": ()=>isDataStale,
    "mergeServerData": ()=>mergeServerData,
    "saveOfflineCounters": ()=>saveOfflineCounters,
    "savePendingChanges": ()=>savePendingChanges,
    "syncPendingChangesToServer": ()=>syncPendingChangesToServer,
    "updateOfflineCounter": ()=>updateOfflineCounter
});
const COUNTERS_STORAGE_KEY = 'offline_counters';
const PENDING_CHANGES_KEY = 'pending_changes';
function getOfflineCounters() {
    try {
        const data = localStorage.getItem(COUNTERS_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.counters || [];
        }
    } catch (error) {
        console.error('Failed to get offline counters:', error);
    }
    return [];
}
function saveOfflineCounters(counters, serverSyncTime) {
    try {
        const existingData = localStorage.getItem(COUNTERS_STORAGE_KEY);
        const data = existingData ? JSON.parse(existingData) : {
            counters: [],
            lastSync: 0,
            lastServerSync: 0
        };
        data.counters = counters;
        data.lastSync = Date.now();
        if (serverSyncTime) {
            data.lastServerSync = serverSyncTime;
        }
        localStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save offline counters:', error);
    }
}
function getPendingChanges() {
    try {
        const data = localStorage.getItem(PENDING_CHANGES_KEY);
        if (data) {
            return JSON.parse(data) || [];
        }
    } catch (error) {
        console.error('Failed to get pending changes:', error);
    }
    return [];
}
function savePendingChanges(changes) {
    try {
        localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
    } catch (error) {
        console.error('Failed to save pending changes:', error);
    }
}
function addPendingChange(change) {
    try {
        const changes = getPendingChanges();
        changes.push({
            ...change,
            timestamp: Date.now()
        });
        savePendingChanges(changes);
    } catch (error) {
        console.error('Failed to add pending change:', error);
    }
}
function clearPendingChanges() {
    try {
        localStorage.removeItem(PENDING_CHANGES_KEY);
    } catch (error) {
        console.error('Failed to clear pending changes:', error);
    }
}
function updateOfflineCounter(id, delta) {
    try {
        const counters = getOfflineCounters();
        const counterIndex = counters.findIndex((c)=>c.id === id);
        if (counterIndex === -1) {
            return null;
        }
        const previousValue = counters[counterIndex].value;
        const newValue = previousValue + delta;
        // Update the counter
        counters[counterIndex].value = newValue;
        // Save updated counters
        saveOfflineCounters(counters);
        // Add pending change with full context
        addPendingChange({
            id,
            type: delta > 0 ? 'increment' : 'decrement',
            delta,
            previousValue,
            newValue
        });
        return counters[counterIndex];
    } catch (error) {
        console.error('Failed to update offline counter:', error);
        return null;
    }
}
function getLastSyncTimestamp() {
    try {
        const data = localStorage.getItem(COUNTERS_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.lastSync || 0;
        }
    } catch (error) {
        console.error('Failed to get last sync timestamp:', error);
    }
    return 0;
}
function getLastServerSyncTimestamp() {
    try {
        const data = localStorage.getItem(COUNTERS_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.lastServerSync || 0;
        }
    } catch (error) {
        console.error('Failed to get last server sync timestamp:', error);
    }
    return 0;
}
function isDataStale() {
    const lastSync = getLastSyncTimestamp();
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastSync > fiveMinutes;
}
function mergeServerData(serverCounters) {
    try {
        const localCounters = getOfflineCounters();
        const pendingChanges = getPendingChanges();
        const lastServerSync = getLastServerSyncTimestamp();
        // If no local data, use server data
        if (localCounters.length === 0) {
            return serverCounters;
        }
        // Create a map of server counters for easy lookup
        const serverCounterMap = new Map(serverCounters.map((c)=>[
                c.id,
                c
            ]));
        // Merge each counter
        const mergedCounters = localCounters.map((localCounter)=>{
            const serverCounter = serverCounterMap.get(localCounter.id);
            if (!serverCounter) {
                // Server doesn't have this counter, keep local
                return localCounter;
            }
            // Find the latest change for this counter
            const latestChange = pendingChanges.filter((change)=>change.id === localCounter.id).sort((a, b)=>b.timestamp - a.timestamp)[0];
            if (!latestChange) {
                // No local changes, use server value
                return serverCounter;
            }
            // If our latest change is newer than server sync, use our value
            if (latestChange.timestamp > lastServerSync) {
                return localCounter;
            }
            // Otherwise, use server value
            return serverCounter;
        });
        return mergedCounters;
    } catch (error) {
        console.error('Failed to merge server data:', error);
        return serverCounters;
    }
}
async function syncPendingChangesToServer() {
    try {
        const pendingChanges = getPendingChanges();
        if (pendingChanges.length === 0) {
            return true; // No changes to sync
        }
        console.log(`Syncing ${pendingChanges.length} pending changes to server...`);
        // Group changes by counter ID to avoid conflicts
        const changesByCounter = new Map();
        pendingChanges.forEach((change)=>{
            if (!changesByCounter.has(change.id)) {
                changesByCounter.set(change.id, []);
            }
            changesByCounter.get(change.id).push(change);
        });
        // Sync each counter's changes
        for (const [counterId, changes] of changesByCounter){
            // Sort changes by timestamp to apply in order
            const sortedChanges = changes.sort((a, b)=>a.timestamp - b.timestamp);
            // Apply each change to the server
            for (const change of sortedChanges){
                try {
                    const endpoint = change.type === 'increment' ? 'increment' : 'decrement';
                    const response = await fetch(`/api/counters/${counterId}/${endpoint}`, {
                        method: 'POST'
                    });
                    if (!response.ok) {
                        console.error(`Failed to sync change for counter ${counterId}:`, change);
                        return false;
                    }
                } catch (error) {
                    console.error(`Error syncing change for counter ${counterId}:`, error);
                    return false;
                }
            }
        }
        // Clear pending changes after successful sync
        clearPendingChanges();
        console.log('Successfully synced all pending changes to server');
        return true;
    } catch (error) {
        console.error('Failed to sync pending changes:', error);
        return false;
    }
}
function clearOfflineData() {
    try {
        localStorage.removeItem(COUNTERS_STORAGE_KEY);
        localStorage.removeItem(PENDING_CHANGES_KEY);
    } catch (error) {
        console.error('Failed to clear offline data:', error);
    }
}
}),
"[project]/src/components/Counter.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>Counter
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offlineStorage.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function Counter({ id, name, value, onUpdate, isOffline = false, allCounters = [], isManageMode = false, onEdit }) {
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [lastAction, setLastAction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleIncrement = async ()=>{
        setIsLoading(true);
        setLastAction('increment');
        if (isOffline) {
            // Handle offline increment
            const updatedCounter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateOfflineCounter"])(id, 1);
            if (updatedCounter) {
                onUpdate(id, updatedCounter.value);
            }
            setIsLoading(false);
            setTimeout(()=>setLastAction(null), 1000);
            return;
        }
        try {
            const response = await fetch(`/api/counters/${id}/increment`, {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                const updatedCounter = data.counter;
                onUpdate(id, updatedCounter.value);
                // Update local storage with the latest counter values
                const updatedCounters = allCounters.map((counter)=>counter.id === id ? {
                        ...counter,
                        value: updatedCounter.value
                    } : counter);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveOfflineCounters"])(updatedCounters);
            }
        } catch (error) {
            console.error('Error incrementing counter:', error);
            // Fallback to offline mode if network fails
            const updatedCounter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateOfflineCounter"])(id, 1);
            if (updatedCounter) {
                onUpdate(id, updatedCounter.value);
            }
        } finally{
            setIsLoading(false);
            // Clear the action indicator after a short delay
            setTimeout(()=>setLastAction(null), 1000);
        }
    };
    const handleDecrement = async ()=>{
        setIsLoading(true);
        setLastAction('decrement');
        if (isOffline) {
            // Handle offline decrement
            const updatedCounter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateOfflineCounter"])(id, -1);
            if (updatedCounter) {
                onUpdate(id, updatedCounter.value);
            }
            setIsLoading(false);
            setTimeout(()=>setLastAction(null), 1000);
            return;
        }
        try {
            const response = await fetch(`/api/counters/${id}/decrement`, {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                const updatedCounter = data.counter;
                onUpdate(id, updatedCounter.value);
                // Update local storage with the latest counter values
                const updatedCounters = allCounters.map((counter)=>counter.id === id ? {
                        ...counter,
                        value: updatedCounter.value
                    } : counter);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveOfflineCounters"])(updatedCounters);
            }
        } catch (error) {
            console.error('Error decrementing counter:', error);
            // Fallback to offline mode if network fails
            const updatedCounter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateOfflineCounter"])(id, -1);
            if (updatedCounter) {
                onUpdate(id, updatedCounter.value);
            }
        } finally{
            setIsLoading(false);
            // Clear the action indicator after a short delay
            setTimeout(()=>setLastAction(null), 1000);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `bg-gray-900 rounded-lg p-8 text-center min-w-[300px] transition-all duration-200 ${lastAction ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} ${isOffline ? 'ring-2 ring-yellow-500 ring-opacity-30' : ''}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-xl font-semibold text-white",
                        children: name
                    }, void 0, false, {
                        fileName: "[project]/src/components/Counter.tsx",
                        lineNumber: 116,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            isOffline && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1 text-yellow-400 text-xs",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-2 h-2 bg-yellow-400 rounded-full"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Counter.tsx",
                                        lineNumber: 120,
                                        columnNumber: 15
                                    }, this),
                                    "Offline"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Counter.tsx",
                                lineNumber: 119,
                                columnNumber: 13
                            }, this),
                            isManageMode && onEdit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>onEdit({
                                        id,
                                        name,
                                        value
                                    }),
                                className: "p-1 text-gray-400 hover:text-white transition-colors duration-200",
                                title: "Edit counter",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-4 h-4",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Counter.tsx",
                                        lineNumber: 131,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Counter.tsx",
                                    lineNumber: 130,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/Counter.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Counter.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Counter.tsx",
                lineNumber: 115,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `text-6xl font-bold mb-8 transition-all duration-300 ${lastAction === 'increment' ? 'text-green-400' : lastAction === 'decrement' ? 'text-red-400' : 'text-white'}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/src/components/Counter.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-4 justify-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleDecrement,
                        disabled: isLoading,
                        className: `font-bold py-3 px-6 rounded-lg text-xl transition-all duration-200 min-w-[80px] ${isLoading && lastAction === 'decrement' ? 'bg-red-800 text-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`,
                        children: "–"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Counter.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleIncrement,
                        disabled: isLoading,
                        className: `font-bold py-3 px-6 rounded-lg text-xl transition-all duration-200 min-w-[80px] ${isLoading && lastAction === 'increment' ? 'bg-green-800 text-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`,
                        children: "+"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Counter.tsx",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Counter.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this),
            isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 text-gray-400 text-sm flex items-center justify-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Counter.tsx",
                        lineNumber: 174,
                        columnNumber: 11
                    }, this),
                    "Updating..."
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Counter.tsx",
                lineNumber: 173,
                columnNumber: 9
            }, this),
            lastAction && !isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 text-xs text-gray-500",
                children: lastAction === 'increment' ? '✓ Incremented' : '✓ Decremented'
            }, void 0, false, {
                fileName: "[project]/src/components/Counter.tsx",
                lineNumber: 180,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Counter.tsx",
        lineNumber: 112,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/hooks/useOffline.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "useOffline": ()=>useOffline
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offlineStorage.ts [app-ssr] (ecmascript)");
;
;
function useOffline() {
    const [isOnline, setIsOnline] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [pendingRequests, setPendingRequests] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [swRegistration, setSwRegistration] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Register service worker
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then((registration)=>{
                setSwRegistration(registration);
                console.log('Service Worker registered successfully');
            }).catch((error)=>{
                console.error('Service Worker registration failed:', error);
            });
        }
    }, []);
    // Listen for online/offline events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleOnline = ()=>{
            setIsOnline(true);
            console.log('Back online - syncing data...');
            // Trigger sync when coming back online
            if (pendingRequests > 0) {
                syncOfflineData();
            }
        };
        const handleOffline = ()=>{
            setIsOnline(false);
            console.log('Gone offline');
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        // Check initial online status
        setIsOnline(navigator.onLine);
        return ()=>{
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [
        pendingRequests
    ]);
    // Update pending requests count
    const updatePendingCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const changes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPendingChanges"])();
        setPendingRequests(changes.length);
    }, []);
    // Sync offline data when back online
    const syncOfflineData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!isOnline) return;
        try {
            const changes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPendingChanges"])();
            if (changes.length === 0) return;
            console.log(`Syncing ${changes.length} offline changes...`);
            // Sync pending changes to server
            const success = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["syncPendingChangesToServer"])();
            if (success) {
                // Trigger a page refresh to get updated data
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to sync offline data:', error);
        }
    }, [
        isOnline
    ]);
    // Initialize pending requests count and update periodically
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        updatePendingCount();
        const interval = setInterval(updatePendingCount, 1000);
        return ()=>clearInterval(interval);
    }, [
        updatePendingCount
    ]);
    return {
        isOnline,
        isOffline: !isOnline,
        pendingRequests,
        syncOfflineData
    };
}
}),
"[project]/src/app/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>Home
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Counter$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Counter.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useOffline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useOffline.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offlineStorage.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function Home() {
    const [counters, setCounters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isManageMode, setIsManageMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [modalOpen, setModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [modalMode, setModalMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('add');
    const [editingCounter, setEditingCounter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const { isOnline, isOffline, pendingRequests, syncOfflineData } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useOffline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOffline"])();
    const fetchCounters = async ()=>{
        try {
            const response = await fetch('/api/counters');
            if (response.ok) {
                const data = await response.json();
                const serverCounters = data.counters;
                const serverTimestamp = data.timestamp;
                // Merge server data with local changes
                const mergedCounters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mergeServerData"])(serverCounters);
                setCounters(mergedCounters);
                // Save the merged data with server timestamp
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveOfflineCounters"])(mergedCounters, serverTimestamp);
                // Clear pending changes that have been synced
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearPendingChanges"])();
            } else {
                throw new Error('Failed to fetch counters');
            }
        } catch (error) {
            console.error('Network error, using offline data:', error);
            // Use offline data if available
            const offlineCounters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getOfflineCounters"])();
            if (offlineCounters.length > 0) {
                setCounters(offlineCounters);
                setError('Using offline data - no internet connection');
            } else {
                setError('Failed to fetch counters and no offline data available');
            }
        } finally{
            setIsLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchCounters();
    }, []);
    // Sync offline data when coming back online
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isOnline && pendingRequests > 0) {
            // First sync pending changes to server
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["syncPendingChangesToServer"])().then((success)=>{
                if (success) {
                    // Then fetch fresh data from server
                    fetchCounters();
                } else {
                    console.error('Failed to sync pending changes');
                }
            });
        }
    }, [
        isOnline,
        pendingRequests
    ]);
    const handleCounterUpdate = (id, newValue)=>{
        setCounters((prev)=>prev.map((counter)=>counter.id === id ? {
                    ...counter,
                    value: newValue
                } : counter));
    };
    const handleEditCounter = (counter)=>{
        setEditingCounter(counter);
        setModalMode('edit');
        setModalOpen(true);
    };
    const handleAddCounter = ()=>{
        setEditingCounter(null);
        setModalMode('add');
        setModalOpen(true);
    };
    const handleSaveCounter = async (counterData)=>{
        try {
            if (modalMode === 'add') {
                // Create new counter
                const response = await fetch('/api/counters', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(counterData)
                });
                if (response.ok) {
                    const data = await response.json();
                    setCounters((prev)=>[
                            ...prev,
                            data.counter
                        ]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveOfflineCounters"])([
                        ...counters,
                        data.counter
                    ]);
                }
            } else {
                // Update existing counter
                const response = await fetch(`/api/counters/${counterData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(counterData)
                });
                if (response.ok) {
                    const data = await response.json();
                    setCounters((prev)=>prev.map((counter)=>counter.id === counterData.id ? data.counter : counter));
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveOfflineCounters"])(counters.map((counter)=>counter.id === counterData.id ? data.counter : counter));
                }
            }
        } catch (error) {
            console.error('Failed to save counter:', error);
        }
    };
    const handleDeleteCounter = async (id)=>{
        try {
            const response = await fetch(`/api/counters/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setCounters((prev)=>prev.filter((counter)=>counter.id !== id));
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveOfflineCounters"])(counters.filter((counter)=>counter.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete counter:', error);
        }
    };
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-black flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-white text-xl",
                children: "Loading counters..."
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 157,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 156,
            columnNumber: 7
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-black flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-red-400 text-xl",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 165,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 164,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-black text-white",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container mx-auto px-4 py-12",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "text-center mb-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-4xl font-bold mb-4",
                            children: "Shared Counters"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 174,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400 text-lg",
                            children: "Real-time counters shared across all users"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 175,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 flex items-center justify-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isOnline ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-yellow-400'}`
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 186,
                                            columnNumber: 15
                                        }, this),
                                        isOnline ? 'Online' : 'Offline'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 181,
                                    columnNumber: 13
                                }, this),
                                pendingRequests > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-300",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 194,
                                            columnNumber: 17
                                        }, this),
                                        pendingRequests,
                                        " pending"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 193,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 180,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 173,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto",
                    children: counters.map((counter)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Counter$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            id: counter.id,
                            name: counter.name,
                            value: counter.value,
                            onUpdate: handleCounterUpdate,
                            isOffline: isOffline,
                            allCounters: counters,
                            isManageMode: isManageMode,
                            onEdit: handleEditCounter
                        }, counter.id, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 203,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 201,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mt-12 space-y-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-4 justify-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: fetchCounters,
                                    className: "bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-200",
                                    children: "Refresh Counters"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 219,
                                    columnNumber: 13
                                }, this),
                                pendingRequests > 0 && isOnline && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offlineStorage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["syncPendingChangesToServer"])().then(()=>fetchCounters()),
                                    className: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200",
                                    children: "Sync Offline Changes"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 227,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 218,
                            columnNumber: 11
                        }, this),
                        isOffline && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-yellow-400 text-sm",
                            children: "You're offline. Changes will be synced when you're back online."
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 237,
                            columnNumber: 13
                        }, this),
                        pendingRequests > 0 && isOnline && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-blue-400 text-sm",
                            children: [
                                "Syncing ",
                                pendingRequests,
                                " offline changes..."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 243,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 217,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 172,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 171,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { m: module, e: exports } = __turbopack_context__;
{
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}}),

};

//# sourceMappingURL=_1d3bbb36._.js.map