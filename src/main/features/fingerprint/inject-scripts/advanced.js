/**
 * Advanced APIs Spoofing
 * Covers: full Permissions API (20+ types), Clipboard, GamePad, XR,
 * Wake Lock, Payment Request, window dimensions, visibilityState,
 * privacy properties, and miscellaneous device capability signals.
 */
(function () {
    'use strict';

    var SCREEN_W = SCREEN_W_PLACEHOLDER;
    var SCREEN_H = SCREEN_H_PLACEHOLDER;

    // ── Full Permissions API ─────────────────────────────────────────────
    // Real Chrome returns 'prompt' for most permissions by default.
    // Only clipboard-write and background-sync are auto-granted.
    var PERM_MAP = {
        'geolocation':              'prompt',
        'notifications':            'prompt',
        'push':                     'prompt',
        'midi':                     'prompt',
        'camera':                   'prompt',
        'microphone':               'prompt',
        'speaker-selection':        'prompt',
        'device-info':              'prompt',
        'background-fetch':         'prompt',
        'background-sync':          'granted',
        'bluetooth':                'prompt',
        'persistent-storage':       'prompt',
        'ambient-light-sensor':     'prompt',
        'accelerometer':            'prompt',
        'gyroscope':                'prompt',
        'magnetometer':             'prompt',
        'clipboard-read':           'prompt',
        'clipboard-write':          'granted',
        'display-capture':          'prompt',
        'nfc':                      'prompt',
        'payment-handler':          'prompt',
        'periodic-background-sync': 'prompt',
        'system-wake-lock':         'prompt',
        'screen-wake-lock':         'prompt',
        'idle-detection':           'prompt',
        'storage-access':           'prompt',
        'window-management':        'prompt',
        'local-fonts':              'prompt',
        'top-level-storage-access': 'prompt',
        'xr-spatial-tracking':      'prompt',
        'compute-pressure':         'prompt',
    };

    function makePermStatus(name, state) {
        return {
            state: state,
            name: name,
            onchange: null,
            addEventListener: function () {},
            removeEventListener: function () {},
            dispatchEvent: function () { return true; },
        };
    }

    if (navigator.permissions) {
        try {
            var origQuery = navigator.permissions.query.bind(navigator.permissions);
            Object.defineProperty(navigator.permissions, 'query', {
                value: function (params) {
                    var name = params && params.name;
                    if (name && name in PERM_MAP) {
                        return Promise.resolve(makePermStatus(name, PERM_MAP[name]));
                    }
                    return origQuery(params).catch(function () {
                        return makePermStatus(name || 'unknown', 'prompt');
                    });
                },
                writable: true, configurable: true,
            });
        } catch (e) {}
    }

    // ── Clipboard API ────────────────────────────────────────────────────
    // writeText is granted silently; readText requires user gesture.
    if (navigator.clipboard) {
        try {
            Object.defineProperty(navigator, 'clipboard', {
                get: function () {
                    return {
                        readText: function () {
                            return Promise.reject(new DOMException('Read permission denied.', 'NotAllowedError'));
                        },
                        writeText: function () {
                            return Promise.resolve();
                        },
                        read: function () {
                            return Promise.reject(new DOMException('Read permission denied.', 'NotAllowedError'));
                        },
                        write: function () {
                            return Promise.resolve();
                        },
                        addEventListener: function () {},
                        removeEventListener: function () {},
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── GamePad API ──────────────────────────────────────────────────────
    try {
        Object.defineProperty(Navigator.prototype, 'getGamepads', {
            value: function () { return [null, null, null, null]; },
            writable: true, configurable: true,
        });
    } catch (e) {}

    // ── WebXR API ────────────────────────────────────────────────────────
    if (navigator.xr) {
        try {
            Object.defineProperty(navigator, 'xr', {
                get: function () {
                    return {
                        isSessionSupported: function () { return Promise.resolve(false); },
                        requestSession: function () {
                            return Promise.reject(new DOMException('XR not supported.', 'NotSupportedError'));
                        },
                        addEventListener: function () {},
                        removeEventListener: function () {},
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── Screen Wake Lock ─────────────────────────────────────────────────
    if (navigator.wakeLock) {
        try {
            Object.defineProperty(navigator, 'wakeLock', {
                get: function () {
                    return {
                        request: function () {
                            return Promise.reject(new DOMException('Wake Lock not allowed.', 'NotAllowedError'));
                        },
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── Payment Request API ──────────────────────────────────────────────
    // canMakePayment → false so sites don't prompt for stored cards
    if (window.PaymentRequest) {
        try {
            var OrigPR = window.PaymentRequest;
            var FakePR = function (methodData, details, options) {
                var instance = new OrigPR(methodData, details, options);
                instance.canMakePayment = function () { return Promise.resolve(false); };
                instance.hasEnrolledInstrument = function () { return Promise.resolve(false); };
                return instance;
            };
            FakePR.prototype = OrigPR.prototype;
            window.PaymentRequest = FakePR;
        } catch (e) {}
    }

    // ── window.name — prevent cross-origin data leak ─────────────────────
    try {
        Object.defineProperty(window, 'name', {
            get: function () { return ''; },
            set: function () {},
            configurable: true,
        });
    } catch (e) {}

    // ── window.outerWidth / outerHeight ──────────────────────────────────
    // Sync with screen dimensions (maximized window)
    try {
        Object.defineProperty(window, 'outerWidth', {
            get: function () { return SCREEN_W; },
            configurable: true,
        });
        Object.defineProperty(window, 'outerHeight', {
            get: function () { return SCREEN_H; },
            configurable: true,
        });
    } catch (e) {}

    // ── screen.availLeft / availTop ──────────────────────────────────────
    try {
        Object.defineProperty(screen, 'availLeft', {
            get: function () { return 0; },
            configurable: true,
        });
        Object.defineProperty(screen, 'availTop', {
            get: function () { return 0; },
            configurable: true,
        });
    } catch (e) {}

    // ── document.visibilityState / hidden ────────────────────────────────
    // Always report visible — prevents sites from pausing during warmup
    // (CDP-minimized window would otherwise read as 'hidden')
    try {
        Object.defineProperty(document, 'visibilityState', {
            get: function () { return 'visible'; },
            configurable: true,
        });
        Object.defineProperty(document, 'hidden', {
            get: function () { return false; },
            configurable: true,
        });
    } catch (e) {}

    // ── navigator.globalPrivacyControl ───────────────────────────────────
    // Stock Chrome does not set GPC — ensure it reads as false
    try {
        Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', {
            get: function () { return false; },
            configurable: true,
        });
    } catch (e) {}

    // ── navigator.userActivation ─────────────────────────────────────────
    // Report that the user has previously interacted with the page
    try {
        var fakeActivation = { hasBeenActive: true, isActive: false };
        Object.defineProperty(Navigator.prototype, 'userActivation', {
            get: function () { return fakeActivation; },
            configurable: true,
        });
    } catch (e) {}

    // ── navigator.share / canShare ───────────────────────────────────────
    // Desktop Chrome supports the Web Share API stub
    try {
        if (!navigator.share) {
            Object.defineProperty(Navigator.prototype, 'share', {
                value: function () {
                    return Promise.reject(new DOMException('Share cancelled.', 'AbortError'));
                },
                writable: true, configurable: true,
            });
        }
        if (!navigator.canShare) {
            Object.defineProperty(Navigator.prototype, 'canShare', {
                value: function () { return false; },
                writable: true, configurable: true,
            });
        }
    } catch (e) {}

    // ── navigator.mediaCapabilities ──────────────────────────────────────
    // Mark desktop content as power-efficient (desktop = plugged in)
    if (navigator.mediaCapabilities) {
        try {
            var origDecode = navigator.mediaCapabilities.decodingInfo.bind(navigator.mediaCapabilities);
            Object.defineProperty(navigator.mediaCapabilities, 'decodingInfo', {
                value: function (config) {
                    return origDecode(config).then(function (info) {
                        return {
                            supported:       info.supported,
                            smooth:          info.smooth,
                            powerEfficient:  true,
                            configuration:   info.configuration,
                        };
                    }).catch(function () {
                        return { supported: false, smooth: false, powerEfficient: false };
                    });
                },
                writable: true, configurable: true,
            });
        } catch (e) {}
    }

    // ── navigator.scheduling (Scheduler API) ─────────────────────────────
    // Chrome 94+ exposes scheduler.postTask — return a stub
    if (!navigator.scheduling && !window.scheduler) {
        try {
            window.scheduler = {
                postTask: function (fn, opts) {
                    return new Promise(function (resolve, reject) {
                        setTimeout(function () {
                            try { resolve(fn()); } catch (err) { reject(err); }
                        }, (opts && opts.delay) || 0);
                    });
                },
                yield: function () { return Promise.resolve(); },
            };
        } catch (e) {}
    }

    // ── navigator.locks (Web Locks API stub) ─────────────────────────────
    // Prevents detection when the API is queried for fingerprinting
    if (navigator.locks) {
        try {
            var origQuery2 = navigator.locks.query.bind(navigator.locks);
            Object.defineProperty(navigator.locks, 'query', {
                value: function () {
                    return Promise.resolve({ held: [], pending: [] });
                },
                writable: true, configurable: true,
            });
        } catch (e) {}
    }

    // ── window.crossOriginIsolated ────────────────────────────────────────
    try {
        Object.defineProperty(window, 'crossOriginIsolated', {
            get: function () { return false; },
            configurable: true,
        });
    } catch (e) {}

    // ── Compute Pressure API ─────────────────────────────────────────────
    // Chrome 115+ — spoof as "nominal" (idle system)
    if (window.PressureObserver) {
        try {
            var OrigPO = window.PressureObserver;
            window.PressureObserver = function (callback, options) {
                return {
                    observe: function () { return Promise.resolve(); },
                    unobserve: function () {},
                    disconnect: function () {},
                    takeRecords: function () { return []; },
                };
            };
            window.PressureObserver.knownSources = ['cpu'];
        } catch (e) {}
    }

})();
