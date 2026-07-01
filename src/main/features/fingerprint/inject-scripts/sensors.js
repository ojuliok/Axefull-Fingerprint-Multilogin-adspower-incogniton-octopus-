/**
 * Sensors & Device APIs Spoofing
 * Covers: screen orientation, performance.memory, speechSynthesis voices,
 * hardware sensor APIs (block), Bluetooth, USB, HID, Serial,
 * comprehensive matchMedia, keyboard layout, SharedArrayBuffer timing,
 * visualViewport, and generic device capability signals.
 */
(function () {
    'use strict';

    var PLATFORM     = 'PLATFORM_PLACEHOLDER';
    var LANGUAGE     = 'LANGUAGE_PLACEHOLDER';
    var SCREEN_W     = SCREEN_W_PLACEHOLDER;
    var SCREEN_H     = SCREEN_H_PLACEHOLDER;
    var PIXEL_RATIO  = PIXEL_RATIO_PLACEHOLDER;
    var COLOR_DEPTH  = COLOR_DEPTH_PLACEHOLDER;

    // ── Screen.orientation ──────────────────────────────────────────────────
    // Large screens are always landscape-primary
    try {
        var orientProto = (window.ScreenOrientation || Object.getPrototypeOf(screen.orientation || {}));
        var fakeOrientation = {
            type:   'landscape-primary',
            angle:  0,
            onchange: null,
            lock:   function () { return Promise.reject(new DOMException('Not supported.', 'NotSupportedError')); },
            unlock: function () {},
            addEventListener:    function () {},
            removeEventListener: function () {},
            dispatchEvent:       function () { return true; },
        };
        Object.defineProperty(screen, 'orientation', {
            get: function () { return fakeOrientation; },
            configurable: true,
        });
    } catch (e) {}

    // ── screen.isExtended — single-monitor setup ─────────────────────────
    try {
        Object.defineProperty(screen, 'isExtended', {
            get: function () { return false; },
            configurable: true,
        });
    } catch (e) {}

    // ── performance.memory ──────────────────────────────────────────────────
    // Real Chrome exposes this non-standard API; spoof plausible values
    try {
        var totalJSHeapSize    = 50 * 1024 * 1024;  // 50 MB
        var usedJSHeapSize     = 25 * 1024 * 1024;  // 25 MB
        var jsHeapSizeLimit    = 2 * 1024 * 1024 * 1024; // 2 GB

        var memProto = Object.getPrototypeOf(performance);
        if (!('memory' in memProto)) {
            Object.defineProperty(memProto, 'memory', {
                get: function () {
                    return {
                        totalJSHeapSize:  totalJSHeapSize,
                        usedJSHeapSize:   usedJSHeapSize,
                        jsHeapSizeLimit:  jsHeapSizeLimit,
                    };
                },
                configurable: true,
                enumerable:   true,
            });
        }
    } catch (e) {}

    // ── SharedArrayBuffer timing mitigation ──────────────────────────────
    // Coarsen performance.now() resolution slightly (±0.1ms) to mitigate
    // cross-origin timing attacks — matches real Chrome hardened mode
    try {
        var origNow = performance.now.bind(performance);
        Object.defineProperty(performance, 'now', {
            value: function () {
                return Math.round(origNow() * 10) / 10;
            },
            writable: true, configurable: true,
        });
    } catch (e) {}

    // ── Bluetooth API ────────────────────────────────────────────────────
    // Report not available — most users don't have/expose Bluetooth
    if (navigator.bluetooth) {
        try {
            Object.defineProperty(navigator, 'bluetooth', {
                get: function () {
                    return {
                        getAvailability: function () { return Promise.resolve(false); },
                        requestDevice:   function () { return Promise.reject(new DOMException('Bluetooth not available.', 'NotFoundError')); },
                        getDevices:      function () { return Promise.resolve([]); },
                        addEventListener:    function () {},
                        removeEventListener: function () {},
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── USB / HID / Serial — empty device lists ───────────────────────────
    if (navigator.usb) {
        try {
            Object.defineProperty(navigator, 'usb', {
                get: function () {
                    return {
                        getDevices:    function () { return Promise.resolve([]); },
                        requestDevice: function () { return Promise.reject(new DOMException('No device selected.', 'NotFoundError')); },
                        addEventListener:    function () {},
                        removeEventListener: function () {},
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }
    if (navigator.hid) {
        try {
            Object.defineProperty(navigator, 'hid', {
                get: function () {
                    return {
                        getDevices:     function () { return Promise.resolve([]); },
                        requestDevice:  function () { return Promise.resolve([]); },
                        addEventListener:    function () {},
                        removeEventListener: function () {},
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }
    if (navigator.serial) {
        try {
            Object.defineProperty(navigator, 'serial', {
                get: function () {
                    return {
                        getPorts:      function () { return Promise.resolve([]); },
                        requestPort:   function () { return Promise.reject(new DOMException('No port selected.', 'NotFoundError')); },
                        addEventListener:    function () {},
                        removeEventListener: function () {},
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── Hardware motion sensors — block DeviceMotion / DeviceOrientation ─
    // Most desktop users don't have these; overriding prevents accidental leaks
    try {
        window.addEventListener('devicemotion',      function (e) { e.stopImmediatePropagation(); }, true);
        window.addEventListener('deviceorientation', function (e) { e.stopImmediatePropagation(); }, true);
    } catch (e) {}

    // ── speechSynthesis voices ───────────────────────────────────────────
    // Return a curated list matching OS + locale instead of real system voices
    if (window.speechSynthesis) {
        var isWindows = PLATFORM.indexOf('Win') !== -1;
        var isMac     = PLATFORM === 'MacIntel';
        var lang      = LANGUAGE; // e.g. "pt-BR"

        var voicesMap = {
            win_ptBR: [
                { name: 'Microsoft Maria',   lang: 'pt-BR', localService: true,  default: true  },
                { name: 'Microsoft Daniel',  lang: 'pt-BR', localService: true,  default: false },
                { name: 'Google português do Brasil', lang: 'pt-BR', localService: false, default: false },
            ],
            win_enUS: [
                { name: 'Microsoft David',   lang: 'en-US', localService: true,  default: true  },
                { name: 'Microsoft Zira',    lang: 'en-US', localService: true,  default: false },
                { name: 'Microsoft Mark',    lang: 'en-US', localService: true,  default: false },
                { name: 'Google US English', lang: 'en-US', localService: false, default: false },
            ],
            mac_ptBR: [
                { name: 'Luciana', lang: 'pt-BR', localService: true, default: true  },
                { name: 'Felipe',  lang: 'pt-BR', localService: true, default: false },
            ],
            mac_enUS: [
                { name: 'Alex',   lang: 'en-US', localService: true, default: true  },
                { name: 'Samantha', lang: 'en-US', localService: true, default: false },
                { name: 'Victoria', lang: 'en-US', localService: true, default: false },
            ],
        };

        var osKey  = isMac ? 'mac' : 'win';
        var langKey = lang && lang.startsWith('pt') ? 'ptBR' : 'enUS';
        var voiceList = voicesMap[osKey + '_' + langKey] || voicesMap['win_enUS'];

        var fakeVoices = voiceList.map(function (v) {
            return {
                voiceURI:     v.name,
                name:         v.name,
                lang:         v.lang,
                localService: v.localService,
                default:      v.default,
            };
        });

        try {
            var synthProto = Object.getPrototypeOf(window.speechSynthesis);
            Object.defineProperty(synthProto, 'getVoices', {
                value: function () { return fakeVoices; },
                writable: true, configurable: true,
            });
        } catch (e) {}

        window.addEventListener('voiceschanged', function () {}, false);
    }

    // ── Comprehensive matchMedia overrides ───────────────────────────────
    // Must run BEFORE page scripts to prevent media-query fingerprinting
    var mediaQueryMap = {
        '(prefers-color-scheme: dark)':        false,
        '(prefers-color-scheme: light)':       true,
        '(prefers-reduced-motion: reduce)':    false,
        '(prefers-reduced-motion: no-preference)': true,
        '(prefers-contrast: more)':            false,
        '(prefers-contrast: no-preference)':   true,
        '(forced-colors: active)':             false,
        '(forced-colors: none)':               true,
        '(inverted-colors: inverted)':         false,
        '(inverted-colors: none)':             true,
        '(pointer: fine)':                     true,   // mouse
        '(pointer: coarse)':                   false,
        '(hover: hover)':                      true,   // desktop
        '(hover: none)':                       false,
        '(any-pointer: fine)':                 true,
        '(any-hover: hover)':                  true,
        '(display-mode: browser)':             true,
        '(display-mode: standalone)':          false,
        '(orientation: landscape)':            SCREEN_W > SCREEN_H,
        '(orientation: portrait)':             SCREEN_H > SCREEN_W,
    };

    var origMatchMedia = window.matchMedia.bind(window);
    Object.defineProperty(window, 'matchMedia', {
        value: function (query) {
            var trimmed = (query || '').trim().toLowerCase();
            if (trimmed in mediaQueryMap) {
                var matches = mediaQueryMap[trimmed];
                return {
                    matches:             matches,
                    media:               query,
                    onchange:            null,
                    addListener:         function () {},
                    removeListener:      function () {},
                    addEventListener:    function () {},
                    removeEventListener: function () {},
                    dispatchEvent:       function () { return true; },
                };
            }
            return origMatchMedia(query);
        },
        writable: true, configurable: true,
    });

    // ── navigator.keyboard.getLayoutMap ─────────────────────────────────
    // Return a minimal QWERTY US layout so fingerprinting via keyboard map fails
    if (navigator.keyboard) {
        try {
            Object.defineProperty(navigator.keyboard, 'getLayoutMap', {
                value: function () {
                    var entries = [
                        ['KeyA','a'],['KeyB','b'],['KeyC','c'],['KeyD','d'],['KeyE','e'],
                        ['KeyF','f'],['KeyG','g'],['KeyH','h'],['KeyI','i'],['KeyJ','j'],
                        ['KeyK','k'],['KeyL','l'],['KeyM','m'],['KeyN','n'],['KeyO','o'],
                        ['KeyP','p'],['KeyQ','q'],['KeyR','r'],['KeyS','s'],['KeyT','t'],
                        ['KeyU','u'],['KeyV','v'],['KeyW','w'],['KeyX','x'],['KeyY','y'],
                        ['KeyZ','z'],['Digit0','0'],['Digit1','1'],['Digit2','2'],
                        ['Digit3','3'],['Digit4','4'],['Digit5','5'],['Digit6','6'],
                        ['Digit7','7'],['Digit8','8'],['Digit9','9'],['Space',' '],
                    ];
                    var map = new Map(entries);
                    return Promise.resolve(map);
                },
                writable: true, configurable: true,
            });
        } catch (e) {}
    }

    // ── window.visualViewport ────────────────────────────────────────────
    // Keep in sync with spoofed screen dimensions
    if (window.visualViewport) {
        try {
            Object.defineProperty(window.visualViewport, 'width', {
                get: function () { return SCREEN_W; },
                configurable: true,
            });
            Object.defineProperty(window.visualViewport, 'height', {
                get: function () { return SCREEN_H; },
                configurable: true,
            });
            Object.defineProperty(window.visualViewport, 'scale', {
                get: function () { return PIXEL_RATIO; },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── navigator.connection / NetworkInformation ─────────────────────────
    // Spoof a typical wired/Ethernet connection
    if (navigator.connection) {
        try {
            var connProto = Object.getPrototypeOf(navigator.connection);
            var connProps = {
                effectiveType: '4g',
                type:          'ethernet',
                rtt:           50,
                downlink:      10,
                saveData:      false,
            };
            for (var k in connProps) {
                (function (key, val) {
                    try {
                        Object.defineProperty(navigator.connection, key, {
                            get: function () { return val; },
                            configurable: true,
                        });
                    } catch (e2) {}
                })(k, connProps[k]);
            }
        } catch (e) {}
    }

    // ── navigator.maxTouchPoints ─────────────────────────────────────────
    // 0 = no touch, matches desktop
    try {
        Object.defineProperty(Navigator.prototype, 'maxTouchPoints', {
            get: function () { return 0; },
            configurable: true,
        });
    } catch (e) {}

    // ── navigator.deviceMemory — already set in navigator.js, guard here ─
    // ── navigator.hardwareConcurrency — already set in navigator.js ──────

})();
