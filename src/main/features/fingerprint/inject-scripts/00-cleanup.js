/**
 * Automation Cleanup Script — MUST BE INJECTED FIRST
 * Removes all traces of Playwright, Puppeteer, Selenium, and ChromeDriver
 * before any fingerprinting site can detect them.
 */
(function () {
    'use strict';

    // === Shared Stealth Registry to hide function overrides from toString() ===
    window.__stealth_patched_set = new WeakSet();
    window.__stealth_add_patched = function (fn) {
        if (typeof fn === 'function' && window.__stealth_patched_set) {
            window.__stealth_patched_set.add(fn);
        }
        return fn;
    };

    // Intercept Object.defineProperty to automatically register new getters/setters/methods
    var origDefineProperty = Object.defineProperty;
    Object.defineProperty = function (obj, prop, descriptor) {
        if (descriptor) {
            if (typeof descriptor.value === 'function') {
                window.__stealth_add_patched(descriptor.value);
            }
            if (typeof descriptor.get === 'function') {
                window.__stealth_add_patched(descriptor.get);
            }
            if (typeof descriptor.set === 'function') {
                window.__stealth_add_patched(descriptor.set);
            }
        }
        return origDefineProperty.call(Object, obj, prop, descriptor);
    };
    window.__stealth_add_patched(Object.defineProperty);

    // Intercept Object.defineProperties
    var origDefineProperties = Object.defineProperties;
    Object.defineProperties = function (obj, props) {
        if (props) {
            Object.keys(props).forEach(function (prop) {
                var descriptor = props[prop];
                if (descriptor) {
                    if (typeof descriptor.value === 'function') {
                        window.__stealth_add_patched(descriptor.value);
                    }
                    if (typeof descriptor.get === 'function') {
                        window.__stealth_add_patched(descriptor.get);
                    }
                    if (typeof descriptor.set === 'function') {
                        window.__stealth_add_patched(descriptor.set);
                    }
                }
            });
        }
        return origDefineProperties.call(Object, obj, props);
    };
    window.__stealth_add_patched(Object.defineProperties);

    // === Remove Playwright traces ===
    try {
        delete window.__playwright;
        delete window.__pwInitScripts;
        delete window.__PW_inspect;
    } catch (e) { }

    // === Remove ChromeDriver traces ===
    var cdcKeys = Object.keys(window).filter(function (k) {
        return k.match(/^cdc_/);
    });
    for (var i = 0; i < cdcKeys.length; i++) {
        try { delete window[cdcKeys[i]]; } catch (e) { }
    }

    // === Remove Selenium traces ===
    try {
        delete document.__selenium_evaluate;
        delete document.__webdriver_evaluate;
        delete document.__selenium_unwrapped;
        delete document.__webdriver_unwrapped;
        delete document.__fxdriver_evaluate;
        delete document.__driver_evaluate;
        delete document.__webdriver_script_fn;
        delete document.__driver_unwrapped;
        delete document.$chrome_asyncScriptInfo;
        delete document.$cdc_asdjflasutopfhvcZLmcfl_;
    } catch (e) { }

    // Dynamic scan and removal of cdc_ keys on document
    try {
        var docKeys = Object.keys(document).concat(Object.getOwnPropertyNames(document)).filter(function (k) {
            return k.indexOf('cdc_') !== -1 || k.match(/^\$cdc_/);
        });
        for (var i = 0; i < docKeys.length; i++) {
            try { delete document[docKeys[i]]; } catch (e) { }
        }
    } catch (e) {}

    // === Clean navigator.webdriver ===
    // If webdriver is set directly on navigator instance, delete it so prototype chain getter is used
    try {
        if (navigator.hasOwnProperty('webdriver')) {
            delete navigator.webdriver;
        }
    } catch (e) {}
    try {
        if ('webdriver' in navigator) {
            delete navigator.webdriver;
        }
    } catch (e) {}

    var navProto = Navigator.prototype;
    try {
        delete navProto.webdriver;
    } catch (e) {}
    try {
        Object.defineProperty(navProto, 'webdriver', {
            get: function () { return false; },
            enumerable: true,
            configurable: true
        });
    } catch (e) { }

    // === Build complete window.chrome matching real Chrome ===
    if (!window.chrome) {
        window.chrome = {};
    }
    if (window.chrome && 'webdriver' in window.chrome) {
        try {
            delete window.chrome.webdriver;
        } catch (e) {}
    }

    // chrome.runtime — full Port implementation so connect() works
    if (!window.chrome.runtime) {
        function makePort(name) {
            var listeners = [];
            return {
                name: name || '',
                disconnect: function () { },
                postMessage: function () { },
                onDisconnect: { addListener: function (fn) { }, removeListener: function () { }, hasListener: function () { return false; } },
                onMessage: { addListener: function (fn) { listeners.push(fn); }, removeListener: function (fn) { listeners = listeners.filter(function (l) { return l !== fn; }); }, hasListener: function (fn) { return listeners.indexOf(fn) !== -1; } }
            };
        }
        window.chrome.runtime = {
            id: undefined,
            lastError: null,
            connect: window.__stealth_add_patched(function (extId, info) { return makePort(info && info.name); }),
            sendMessage: window.__stealth_add_patched(function () { }),
            getManifest: window.__stealth_add_patched(function () { return null; }),
            getURL: window.__stealth_add_patched(function (path) { return ''; }),
            reload: window.__stealth_add_patched(function () { }),
            requestUpdateCheck: window.__stealth_add_patched(function () { }),
            onMessage: { addListener: window.__stealth_add_patched(function () { }), removeListener: window.__stealth_add_patched(function () { }), hasListener: window.__stealth_add_patched(function () { return false; }) },
            onConnect: { addListener: window.__stealth_add_patched(function () { }), removeListener: window.__stealth_add_patched(function () { }), hasListener: window.__stealth_add_patched(function () { return false; }) },
            onInstalled: { addListener: window.__stealth_add_patched(function () { }), removeListener: window.__stealth_add_patched(function () { }), hasListener: window.__stealth_add_patched(function () { return false; }) },
            onStartup: { addListener: window.__stealth_add_patched(function () { }), removeListener: window.__stealth_add_patched(function () { }), hasListener: window.__stealth_add_patched(function () { return false; }) },
            getPlatformInfo: window.__stealth_add_patched(function (cb) { if (cb) cb({ os: 'PLATFORM_OS_PLACEHOLDER', arch: 'x86-64', nacl_arch: 'x86-64' }); return Promise.resolve({ os: 'PLATFORM_OS_PLACEHOLDER', arch: 'x86-64', nacl_arch: 'x86-64' }); })
        };
    }

    // chrome.app — used by Google to check extension environment
    if (!window.chrome.app) {
        window.chrome.app = {
            isInstalled: false,
            InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
            RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
            getDetails: window.__stealth_add_patched(function () { return null; }),
            getIsInstalled: window.__stealth_add_patched(function () { return false; }),
            installState: window.__stealth_add_patched(function (cb) { if (cb) cb('not_installed'); })
        };
    }

    // chrome.webstore — presence expected by Google pages
    if (!window.chrome.webstore) {
        window.chrome.webstore = {
            onInstallStageChanged: { addListener: window.__stealth_add_patched(function () { }), removeListener: window.__stealth_add_patched(function () { }) },
            onDownloadProgress: { addListener: window.__stealth_add_patched(function () { }), removeListener: window.__stealth_add_patched(function () { }) },
            install: window.__stealth_add_patched(function (url, onSuccess, onFailure) { if (onFailure) onFailure({ message: 'Not supported.' }); })
        };
    }

    if (!window.chrome.csi) {
        window.chrome.csi = window.__stealth_add_patched(function () {
            return {
                startE: Date.now(),
                onloadT: Date.now(),
                pageT: Math.random() * 1000 + 500,
                tran: 15
            };
        });
    }
    if (!window.chrome.loadTimes) {
        window.chrome.loadTimes = window.__stealth_add_patched(function () {
            return {
                commitLoadTime: Date.now() / 1000,
                connectionInfo: 'h2',
                finishDocumentLoadTime: Date.now() / 1000 + 0.1,
                finishLoadTime: Date.now() / 1000 + 0.2,
                firstPaintAfterLoadTime: Date.now() / 1000 + 0.05,
                firstPaintTime: Date.now() / 1000 + 0.03,
                navigationType: 'Other',
                npnNegotiatedProtocol: 'h2',
                requestTime: Date.now() / 1000 - 0.5,
                startLoadTime: Date.now() / 1000 - 0.3,
                wasAlternateProtocolAvailable: false,
                wasFetchedViaSpdy: true,
                wasNpnNegotiated: true
            };
        });
    }

    // === Remove automation-related properties from Error stack ===
    var OriginalError = window.Error;
    function CleanError(message) {
        var err;
        if (this instanceof CleanError) {
            err = new OriginalError(message);
        } else {
            err = OriginalError(message);
        }
        var originalStack = err.stack;
        if (originalStack) {
            Object.defineProperty(err, 'stack', {
                get: function () {
                    return originalStack
                        .replace(/playwright/gi, '')
                        .replace(/puppeteer/gi, '')
                        .replace(/selenium/gi, '')
                        .replace(/webdriver/gi, '')
                        .replace(/cdp/gi, '');
                },
                configurable: true,
                enumerable: false
            });
        }
        return err;
    }
    CleanError.prototype = OriginalError.prototype;
    Object.getOwnPropertyNames(OriginalError).forEach(function (prop) {
        if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
            try {
                Object.defineProperty(CleanError, prop, Object.getOwnPropertyDescriptor(OriginalError, prop));
            } catch (e) {
                CleanError[prop] = OriginalError[prop];
            }
        }
    });
    window.Error = window.__stealth_add_patched(CleanError);

    // === Patch Permissions API to not reveal automation ===
    if (navigator.permissions) {
        var origQuery = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = window.__stealth_add_patched(function (params) {
            if (params && params.name === 'notifications') {
                return Promise.resolve({ state: 'prompt', onchange: null });
            }
            return origQuery(params);
        });
    }

    // iframes inherit all init scripts automatically from Playwright context
})();
