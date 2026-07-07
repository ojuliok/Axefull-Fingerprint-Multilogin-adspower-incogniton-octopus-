/**
 * Anti-Detection Hardening — v1.0
 * Protects all spoofed properties from being detected.
 * Patches toString, prototype inspection, and iframe consistency.
 */
(function () {
    'use strict';

    // === Protect function.toString ===
    // When sites do: navigator.hardwareConcurrency.toString() or check
    // if getter.toString() contains "native code"
    var origFuncToString = Function.prototype.toString;
    var nativePattern = 'function ' + 'toString() { [native code] }';

    // Track which functions we've patched using the shared global WeakSet
    var patchedFunctions = window.__stealth_patched_set || new WeakSet();

    Function.prototype.toString = function () {
        // If this function was one of our patches, return native-looking string
        if (patchedFunctions.has(this)) {
            return 'function ' + (this.name || '') + '() { [native code] }';
        }
        try {
            return origFuncToString.call(this);
        } catch (e) {
            return nativePattern;
        }
    };

    // Mark Function.prototype.toString itself as patched
    patchedFunctions.add(Function.prototype.toString);

    // === Protect Object.getOwnPropertyDescriptor ===
    // Sites check: Object.getOwnPropertyDescriptor(navigator, 'webdriver')
    // If the descriptor has a custom getter, they know it's been patched
    // Our scripts already patch at prototype level, which is harder to detect

    // === Protect getOwnPropertyNames ===
    var origGetOwnPropertyNames = Object.getOwnPropertyNames;
    Object.getOwnPropertyNames = function (obj) {
        var names = origGetOwnPropertyNames.call(Object, obj);
        // Filter out any accidentally exposed internal properties
        return names.filter(function (name) {
            return name.indexOf('__pw') === -1 &&
                   name.indexOf('__playwright') === -1 &&
                   name.indexOf('__selenium') === -1 &&
                   name.indexOf('__driver') === -1 &&
                   name.indexOf('__stealth') === -1 &&
                   name.indexOf('cdc_') === -1;
        });
    };
    patchedFunctions.add(Object.getOwnPropertyNames);

    // === Protect Proxy detection ===
    // Some sites try to detect if an object is a Proxy by checking Symbol.toStringTag
    // or by using certain operations that behave differently on Proxies

    // === MediaDevices — spoof to look like a real desktop ===
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        var origEnumerate = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
        navigator.mediaDevices.enumerateDevices = window.__stealth_add_patched ? window.__stealth_add_patched(function () {
            return origEnumerate().then(function (devices) {
                // Return a realistic device list if empty (happens in automation)
                if (devices.length === 0) {
                    return [
                        { deviceId: '', groupId: 'default', kind: 'audioinput', label: '' },
                        { deviceId: '', groupId: 'default', kind: 'audiooutput', label: '' },
                        { deviceId: '', groupId: 'camera1', kind: 'videoinput', label: '' }
                    ];
                }
                // Strip labels (labels are only available after getUserMedia permission)
                return devices.map(function (d) {
                    return {
                        deviceId: d.deviceId,
                        groupId: d.groupId,
                        kind: d.kind,
                        label: '' // Always empty until permission granted
                    };
                });
            });
        }) : function () {
            return origEnumerate().then(function (devices) {
                if (devices.length === 0) {
                    return [
                        { deviceId: '', groupId: 'default', kind: 'audioinput', label: '' },
                        { deviceId: '', groupId: 'default', kind: 'audiooutput', label: '' },
                        { deviceId: '', groupId: 'camera1', kind: 'videoinput', label: '' }
                    ];
                }
                return devices.map(function (d) {
                    return {
                        deviceId: d.deviceId,
                        groupId: d.groupId,
                        kind: d.kind,
                        label: ''
                    };
                });
            });
        };
    }

    // === SpeechSynthesis voices — return OS-consistent voices ===
    if (window.speechSynthesis) {
        var origGetVoices = window.speechSynthesis.getVoices.bind(window.speechSynthesis);
        window.speechSynthesis.getVoices = window.__stealth_add_patched ? window.__stealth_add_patched(function () {
            var voices = origGetVoices();
            return voices;
        }) : function () {
            var voices = origGetVoices();
            return voices;
        };
    }

    // === Battery API — realistic values, not a suspicious 100%/charging ===
    if (navigator.getBattery) {
        var _battLevel = 0.72 + (Date.now() % 23) / 100;
        _battLevel = Math.min(0.94, Math.max(0.55, _battLevel));
        var _battCharging = _battLevel > 0.85;
        navigator.getBattery = window.__stealth_add_patched ? window.__stealth_add_patched(function () {
            return Promise.resolve({
                charging: _battCharging,
                chargingTime: _battCharging ? 0 : Infinity,
                dischargingTime: _battCharging ? Infinity : Math.floor(((_battLevel / 0.003) * 60)),
                level: _battLevel,
                addEventListener: function () { },
                removeEventListener: function () { },
                onchargingchange: null,
                onchargingtimechange: null,
                ondischargingtimechange: null,
                onlevelchange: null
            });
        }) : function () {
            return Promise.resolve({
                charging: _battCharging,
                chargingTime: _battCharging ? 0 : Infinity,
                dischargingTime: _battCharging ? Infinity : Math.floor(((_battLevel / 0.003) * 60)),
                level: _battLevel,
                addEventListener: function () { },
                removeEventListener: function () { },
                onchargingchange: null,
                onchargingtimechange: null,
                ondischargingtimechange: null,
                onlevelchange: null
            });
        };
    }

    // === Storage estimate — pass-through real values, cap quota to ~1TB ===
    if (navigator.storage && navigator.storage.estimate) {
        var origEstimate = navigator.storage.estimate.bind(navigator.storage);
        navigator.storage.estimate = window.__stealth_add_patched ? window.__stealth_add_patched(function () {
            return origEstimate().then(function (est) {
                return {
                    quota: Math.min(est.quota || 107374182400, 1099511627776),
                    usage: est.usage || 0,
                    usageDetails: est.usageDetails || {}
                };
            });
        }) : function () {
            return origEstimate().then(function (est) {
                return {
                    quota: Math.min(est.quota || 107374182400, 1099511627776),
                    usage: est.usage || 0,
                    usageDetails: est.usageDetails || {}
                };
            });
        };
    }

    // === matchMedia — preserve real results, only fix prefers-reduced-motion ===
    var origMatchMedia = window.matchMedia;
    if (origMatchMedia) {
        window.matchMedia = window.__stealth_add_patched ? window.__stealth_add_patched(function (query) {
            if (query === '(prefers-reduced-motion: reduce)') {
                var r = origMatchMedia.call(window, query);
                return Object.assign(Object.create(Object.getPrototypeOf(r)), r, { matches: false });
            }
            return origMatchMedia.call(window, query);
        }) : function (query) {
            if (query === '(prefers-reduced-motion: reduce)') {
                var r = origMatchMedia.call(window, query);
                return Object.assign(Object.create(Object.getPrototypeOf(r)), r, { matches: false });
            }
            return origMatchMedia.call(window, query);
        };
    }

    // === Notification permission — should be 'default', not 'denied' ===
    if (window.Notification && Notification.permission === 'denied') {
        try {
            var permissionGetter = function () { return 'default'; };
            if (window.__stealth_add_patched) {
                window.__stealth_add_patched(permissionGetter);
            }
            Object.defineProperty(Notification, 'permission', {
                get: permissionGetter,
                configurable: true
            });
        } catch (e) { }
    }

})();;
