module.exports = {

"[project]/.next-internal/server/app/api/counters/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/fs [external] (fs, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}}),
"[externals]/path [external] (path, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}}),
"[project]/src/lib/counters.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "getCounter": ()=>getCounter,
    "getCounters": ()=>getCounters,
    "updateCounter": ()=>updateCounter
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const DATA_FILE = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'data', 'counters.json');
// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(DATA_FILE);
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].access(dataDir);
    } catch  {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].mkdir(dataDir, {
            recursive: true
        });
    }
}
// Initialize default counters if file doesn't exist
async function initializeCounters() {
    const now = Date.now();
    const defaultCounters = [
        {
            id: 'counter-1',
            name: 'Counter 1',
            value: 0,
            lastUpdated: now
        },
        {
            id: 'counter-2',
            name: 'Counter 2',
            value: 0,
            lastUpdated: now
        },
        {
            id: 'counter-3',
            name: 'Counter 3',
            value: 0,
            lastUpdated: now
        }
    ];
    await ensureDataDir();
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(DATA_FILE, JSON.stringify(defaultCounters, null, 2));
    return defaultCounters;
}
async function getCounters() {
    try {
        await ensureDataDir();
        const data = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch  {
        // If file doesn't exist, initialize with default counters
        return initializeCounters();
    }
}
// Write counters to file
async function saveCounters(counters) {
    await ensureDataDir();
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(DATA_FILE, JSON.stringify(counters, null, 2));
}
async function updateCounter(id, delta) {
    const counters = await getCounters();
    const counterIndex = counters.findIndex((c)=>c.id === id);
    if (counterIndex === -1) {
        return null;
    }
    const now = Date.now();
    counters[counterIndex].value += delta;
    counters[counterIndex].lastUpdated = now;
    await saveCounters(counters);
    return counters[counterIndex];
}
async function getCounter(id) {
    const counters = await getCounters();
    return counters.find((c)=>c.id === id) || null;
}
}),
"[project]/src/app/api/sync/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET,
    "broadcastUpdate": ()=>broadcastUpdate
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$counters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/counters.ts [app-route] (ecmascript)");
;
// Store connected clients
const clients = new Set();
function broadcastUpdate(data) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach((client)=>{
        try {
            client.enqueue(new TextEncoder().encode(message));
        } catch (error) {
            console.error('Error broadcasting to client:', error);
        }
    });
}
async function GET(request) {
    const stream = new ReadableStream({
        start (controller) {
            // Add client to the set
            clients.add(controller);
            // Send initial data
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$counters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCounters"])().then((counters)=>{
                const message = `data: ${JSON.stringify({
                    type: 'initial',
                    counters,
                    timestamp: Date.now()
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(message));
            });
            // Handle client disconnect
            request.signal.addEventListener('abort', ()=>{
                clients.delete(controller);
                controller.close();
            });
        }
    });
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    });
}
}),
"[project]/src/app/api/counters/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET,
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$counters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/counters.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$sync$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/api/sync/route.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
;
;
;
const DATA_FILE = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'data', 'counters.json');
async function GET() {
    try {
        const counters = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$counters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCounters"])();
        const response = {
            counters,
            timestamp: Date.now()
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(response);
    } catch (error) {
        console.error('Error fetching counters:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch counters'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { name, value = 0 } = body;
        if (!name || typeof name !== 'string') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Counter name is required'
            }, {
                status: 400
            });
        }
        const counters = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$counters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCounters"])();
        const newCounter = {
            id: `counter-${Date.now()}`,
            name: name.trim(),
            value: parseInt(value) || 0,
            lastUpdated: Date.now()
        };
        counters.push(newCounter);
        // Save to file
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(DATA_FILE, JSON.stringify(counters, null, 2));
        const response = {
            counter: newCounter,
            timestamp: Date.now()
        };
        // Broadcast the new counter to all connected clients
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$sync$2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["broadcastUpdate"])({
            type: 'counter_created',
            counter: newCounter,
            timestamp: Date.now()
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(response, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating counter:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create counter'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__03bd4cf3._.js.map