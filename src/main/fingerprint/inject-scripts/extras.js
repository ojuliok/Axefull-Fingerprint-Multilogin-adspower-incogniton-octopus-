/**
 * Extras — P2 / P3 / P4 API Spoofing
 * Covers: generic hardware sensors, Push API, Credentials,
 * MediaSession, Navigation API, CSS supports, Picture-in-Picture,
 * Contact Picker, Web Authentication stubs, and minor leaks.
 */
(function () {
    'use strict';

    // ── Generic Hardware Sensor APIs ─────────────────────────────────────
    // Accelerometer, Gyroscope, Magnetometer, etc. are rarely available
    // on desktop — throw NotReadableError as a real browser would.
    var SENSOR_CLASSES = [
        'Accelerometer', 'LinearAccelerationSensor', 'GravitySensor',
        'Gyroscope', 'AbsoluteOrientationSensor', 'RelativeOrientationSensor',
        'Magnetometer', 'UncalibratedMagnetometer',
        'AmbientLightSensor', 'ProximitySensor',
    ];
    SENSOR_CLASSES.forEach(function (name) {
        if (window[name]) {
            try {
                window[name] = function () {
                    throw new DOMException(
                        'Sensor is not available on this device.',
                        'NotReadableError'
                    );
                };
            } catch (e) {}
        }
    });

    // ── Push API — PushManager ───────────────────────────────────────────
    // Prevent subscription endpoint leaks; subscription always rejects
    if (window.PushManager) {
        try {
            var origSubscribe = PushManager.prototype.subscribe;
            PushManager.prototype.subscribe = function () {
                return Promise.reject(new DOMException('Push is not allowed.', 'NotAllowedError'));
            };
            PushManager.prototype.getSubscription = function () {
                return Promise.resolve(null);
            };
            PushManager.prototype.permissionState = function () {
                return Promise.resolve('prompt');
            };
        } catch (e) {}
    }

    // ── Credential Management API ────────────────────────────────────────
    // Return empty results — no stored credentials in a fresh profile
    if (navigator.credentials) {
        try {
            Object.defineProperty(navigator, 'credentials', {
                get: function () {
                    return {
                        get:    function () { return Promise.resolve(null); },
                        store:  function () { return Promise.resolve(); },
                        create: function () { return Promise.resolve(null); },
                        preventSilentAccess: function () { return Promise.resolve(); },
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── Web Authentication (WebAuthn) ────────────────────────────────────
    // Prevent fingerprinting via authenticator enumeration
    if (window.PublicKeyCredential) {
        try {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = function () {
                return Promise.resolve(false);
            };
            PublicKeyCredential.isConditionalMediationAvailable = function () {
                return Promise.resolve(false);
            };
        } catch (e) {}
    }

    // ── MediaSession API ─────────────────────────────────────────────────
    // Stub metadata so media player info is not leaked cross-origin
    if (navigator.mediaSession) {
        try {
            Object.defineProperty(navigator, 'mediaSession', {
                get: function () {
                    return {
                        metadata:         null,
                        playbackState:    'none',
                        setActionHandler: function () {},
                        setPositionState: function () {},
                        setCameraActive:  function () { return Promise.resolve(); },
                        setMicrophoneActive: function () { return Promise.resolve(); },
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── Navigation API (Chrome 102+) ─────────────────────────────────────
    // window.navigation — new history management API; hide entry count
    if (window.navigation) {
        try {
            Object.defineProperty(window.navigation, 'currentEntry', {
                get: function () {
                    return {
                        url:   location.href,
                        key:   'initial',
                        id:    'initial',
                        index: 0,
                        sameDocument: true,
                        getState: function () { return undefined; },
                        addEventListener:    function () {},
                        removeEventListener: function () {},
                    };
                },
                configurable: true,
            });
            Object.defineProperty(window.navigation, 'entries', {
                value: function () { return [window.navigation.currentEntry]; },
                writable: true, configurable: true,
            });
            Object.defineProperty(window.navigation, 'canGoBack', {
                get: function () { return false; },
                configurable: true,
            });
            Object.defineProperty(window.navigation, 'canGoForward', {
                get: function () { return false; },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── CSS.supports() — hide unusual or OS-specific CSS features ────────
    if (window.CSS && CSS.supports) {
        try {
            var _origSupports = CSS.supports.bind(CSS);
            Object.defineProperty(CSS, 'supports', {
                value: function (prop, val) {
                    // Platform-specific features that can fingerprint OS
                    var combined = (typeof prop === 'string' ? prop : '') + (val || '');
                    if (/(-apple-|-moz-|-ms-)/.test(combined)) return false;
                    return _origSupports(prop, val);
                },
                writable: true, configurable: true,
            });
        } catch (e) {}
    }

    // ── Picture-in-Picture API ───────────────────────────────────────────
    if (document.exitPictureInPicture) {
        try {
            Object.defineProperty(document, 'pictureInPictureEnabled', {
                get: function () { return false; },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── Contact Picker API ───────────────────────────────────────────────
    if (navigator.contacts) {
        try {
            Object.defineProperty(navigator, 'contacts', {
                get: function () {
                    return {
                        select:         function () { return Promise.reject(new DOMException('Not supported.', 'NotSupportedError')); },
                        getProperties:  function () { return Promise.resolve([]); },
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── File System Access API ───────────────────────────────────────────
    // showOpenFilePicker / showSaveFilePicker / showDirectoryPicker
    ['showOpenFilePicker', 'showSaveFilePicker', 'showDirectoryPicker'].forEach(function (name) {
        if (window[name]) {
            try {
                window[name] = function () {
                    return Promise.reject(new DOMException('The user aborted a request.', 'AbortError'));
                };
            } catch (e) {}
        }
    });

    // ── Web Share Target / Badging API ───────────────────────────────────
    if (navigator.setAppBadge) {
        try {
            navigator.setAppBadge   = function () { return Promise.resolve(); };
            navigator.clearAppBadge = function () { return Promise.resolve(); };
        } catch (e) {}
    }

    // ── Window Controls Overlay (desktop PWA detection) ──────────────────
    if (navigator.windowControlsOverlay) {
        try {
            Object.defineProperty(navigator, 'windowControlsOverlay', {
                get: function () {
                    return {
                        visible: false,
                        getTitlebarAreaRect: function () {
                            return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: function () { return {}; } };
                        },
                        addEventListener:    function () {},
                        removeEventListener: function () {},
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── EyeDropper API ───────────────────────────────────────────────────
    if (window.EyeDropper) {
        try {
            window.EyeDropper = function () {
                return {
                    open: function () {
                        return Promise.reject(new DOMException('EyeDropper aborted.', 'AbortError'));
                    },
                };
            };
        } catch (e) {}
    }

    // ── Ink API (Microsoft digital ink) ─────────────────────────────────
    if (navigator.ink) {
        try {
            Object.defineProperty(navigator, 'ink', {
                get: function () {
                    return {
                        requestPresenter: function () {
                            return Promise.reject(new DOMException('Ink not supported.', 'NotSupportedError'));
                        },
                    };
                },
                configurable: true,
            });
        } catch (e) {}
    }

    // ── Web NFC ──────────────────────────────────────────────────────────
    if (window.NDEFReader) {
        try {
            window.NDEFReader = function () {
                return {
                    scan:  function () { return Promise.reject(new DOMException('NFC not supported.', 'NotSupportedError')); },
                    write: function () { return Promise.reject(new DOMException('NFC not supported.', 'NotSupportedError')); },
                };
            };
        } catch (e) {}
    }

    // ── navigator.getInstalledRelatedApps ────────────────────────────────
    // Returns empty — prevents detection of installed native apps
    if (navigator.getInstalledRelatedApps) {
        try {
            Object.defineProperty(Navigator.prototype, 'getInstalledRelatedApps', {
                value: function () { return Promise.resolve([]); },
                writable: true, configurable: true,
            });
        } catch (e) {}
    }

    // ── document.hasStorageAccess ─────────────────────────────────────────
    // Always returns true — embedded context behaves like top-level
    if (document.hasStorageAccess) {
        try {
            Object.defineProperty(Document.prototype, 'hasStorageAccess', {
                value: function () { return Promise.resolve(true); },
                writable: true, configurable: true,
            });
            Object.defineProperty(Document.prototype, 'requestStorageAccess', {
                value: function () { return Promise.resolve(); },
                writable: true, configurable: true,
            });
        } catch (e) {}
    }

    // ── navigator.standalone (PWA detection) ─────────────────────────────
    try {
        Object.defineProperty(Navigator.prototype, 'standalone', {
            get: function () { return undefined; },
            configurable: true,
        });
    } catch (e) {}

})();
