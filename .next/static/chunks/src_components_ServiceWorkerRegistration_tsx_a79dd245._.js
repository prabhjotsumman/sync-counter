(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/ServiceWorkerRegistration.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ServiceWorkerRegistration
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
function ServiceWorkerRegistration() {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ServiceWorkerRegistration.useEffect": ()=>{
            // Register service worker
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', {
                    "ServiceWorkerRegistration.useEffect": ()=>{
                        navigator.serviceWorker.register('/sw.js').then({
                            "ServiceWorkerRegistration.useEffect": (registration)=>{
                                console.log('SW registered: ', registration);
                            }
                        }["ServiceWorkerRegistration.useEffect"]).catch({
                            "ServiceWorkerRegistration.useEffect": (registrationError)=>{
                                console.log('SW registration failed: ', registrationError);
                            }
                        }["ServiceWorkerRegistration.useEffect"]);
                    }
                }["ServiceWorkerRegistration.useEffect"]);
            }
            // Handle PWA installation
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', {
                "ServiceWorkerRegistration.useEffect": (e)=>{
                    // Prevent Chrome 67 and earlier from automatically showing the prompt
                    e.preventDefault();
                    // Stash the event so it can be triggered later
                    deferredPrompt = e;
                    // Show install button or notification
                    console.log('PWA install prompt available');
                }
            }["ServiceWorkerRegistration.useEffect"]);
            window.addEventListener('appinstalled', {
                "ServiceWorkerRegistration.useEffect": ()=>{
                    console.log('PWA was installed');
                    deferredPrompt = null;
                }
            }["ServiceWorkerRegistration.useEffect"]);
        }
    }["ServiceWorkerRegistration.useEffect"], []);
    return null; // This component doesn't render anything
}
_s(ServiceWorkerRegistration, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = ServiceWorkerRegistration;
var _c;
__turbopack_context__.k.register(_c, "ServiceWorkerRegistration");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_components_ServiceWorkerRegistration_tsx_a79dd245._.js.map