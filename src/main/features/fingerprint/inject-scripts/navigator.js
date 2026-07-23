/**
 * Navigator & Screen Spoofing — v2.0
 * Patches at prototype level to survive detection.
 * Includes Client Hints (Sec-CH-UA / navigator.userAgentData).
 */
(function (config) {
    'use strict';

    // === Helper: Patch a property at prototype level ===
    function patchProto(proto, prop, value) {
        var origDesc = Object.getOwnPropertyDescriptor(proto, prop);
        var getter = function () { return value; };
        if (window.__stealth_add_patched) {
            window.__stealth_add_patched(getter);
        }
        var desc = {
            get: getter,
            enumerable: origDesc ? origDesc.enumerable : true,
            configurable: origDesc ? origDesc.configurable : true
        };
        try {
            Object.defineProperty(proto, prop, desc);
        } catch (e) { }
    }

    // === Parse browser info from UA ===
    var uaMatch = config.userAgent.match(/Chrome\/(\d+)/);
    var chromeVersion = uaMatch ? uaMatch[1] : '120';
    var fullVersion = uaMatch ? config.userAgent.match(/Chrome\/([\d.]+)/)[1] : '120.0.0.0';

    var isEdge = config.userAgent.indexOf('Edg/') !== -1;
    var isFirefox = config.userAgent.indexOf('Firefox') !== -1;
    var isSafari = config.userAgent.indexOf('Safari') !== -1 && config.userAgent.indexOf('Chrome') === -1;

    var platformName = 'Windows';
    if (config.platform === 'MacIntel') platformName = 'macOS';
    else if (config.platform.indexOf('Linux') !== -1) platformName = 'Linux';

    // === Navigator properties (prototype level) ===
    var navProto = Navigator.prototype;
    patchProto(navProto, 'userAgent', config.userAgent);
    patchProto(navProto, 'appVersion', config.userAgent.replace('Mozilla/', ''));
    patchProto(navProto, 'platform', config.platform);
    patchProto(navProto, 'vendor', config.vendor);
    patchProto(navProto, 'language', config.language);
    patchProto(navProto, 'languages', Object.freeze(config.languages.split(',').map(function(l){ return l.trim(); })));
    patchProto(navProto, 'hardwareConcurrency', config.hardwareConcurrency);
    patchProto(navProto, 'deviceMemory', config.deviceMemory);
    patchProto(navProto, 'maxTouchPoints', config.maxTouchPoints || 0);
    patchProto(navProto, 'pdfViewerEnabled', true);
    patchProto(navProto, 'cookieEnabled', true);
    patchProto(navProto, 'doNotTrack', null);
    patchProto(navProto, 'onLine', true);

    // === Client Hints API (navigator.userAgentData) — CRITICAL ===
    if (!isFirefox && !isSafari) {
        var majorNum = parseInt(chromeVersion, 10);
        var notBrandVersion = majorNum >= 128 ? '24' : '8';
        var brands = [];
        if (isEdge) {
            var edgeMatch = config.userAgent.match(/Edg\/([\d]+)/);
            var edgeVersion = edgeMatch ? edgeMatch[1] : chromeVersion;
            brands = [
                { brand: 'Microsoft Edge', version: edgeVersion },
                { brand: 'Chromium', version: chromeVersion },
                { brand: 'Not A Brand', version: notBrandVersion }
            ];
        } else {
            brands = [
                { brand: 'Google Chrome', version: chromeVersion },
                { brand: 'Chromium', version: chromeVersion },
                { brand: 'Not A Brand', version: notBrandVersion }
            ];
        }

        var uaData = {
            brands: brands,
            mobile: false,
            platform: platformName,
            toJSON: window.__stealth_add_patched ? window.__stealth_add_patched(function () {
                return { brands: this.brands, mobile: this.mobile, platform: this.platform };
            }) : function () {
                return { brands: this.brands, mobile: this.mobile, platform: this.platform };
            },
            getHighEntropyValues: window.__stealth_add_patched ? window.__stealth_add_patched(function (hints) {
                var result = {
                    brands: brands,
                    mobile: false,
                    platform: platformName
                };

                for (var i = 0; i < hints.length; i++) {
                    var h = hints[i];
                    if (h === 'architecture') result.architecture = 'x86';
                    if (h === 'bitness') result.bitness = '64';
                    if (h === 'fullVersionList') {
                        result.fullVersionList = brands.map(function (b) {
                            return { brand: b.brand, version: b.brand === 'Not A Brand' ? (notBrandVersion + '.0.0.0') : fullVersion };
                        });
                    }
                    if (h === 'model') result.model = '';
                    if (h === 'platformVersion') {
                        if (platformName === 'Windows') {
                            // Derive Windows version from UA string:
                            // Windows NT 10.0 + Chrome 128+ = likely Win 10 or 11
                            // Chrome 109+ UA always says NT 10.0 regardless of Win 11
                            // Match: higher Chrome versions trend toward Win11
                            var ntMatch = config.userAgent.match(/Windows NT ([\d.]+)/);
                            var chromeMajor = parseInt(chromeVersion, 10) || 100;
                            var ntVersion = ntMatch ? parseFloat(ntMatch[1]) : 10.0;
                            if (ntVersion >= 10.0 && chromeMajor >= 128) {
                                // Win 10 22H2 = 10.0.19045 → platformVersion '10.0.0'
                                // Win 11 = 10.0.22000+ → platformVersion '15.0.0'
                                // Use Chrome version as proxy: newer Chrome → Win 11 more likely
                                result.platformVersion = chromeMajor >= 134 ? '15.0.0' : '10.0.0';
                            } else {
                                result.platformVersion = '10.0.0';
                            }
                        } else if (platformName === 'macOS') {
                            result.platformVersion = '14.4.0';
                        } else {
                            result.platformVersion = '6.5.0';
                        }
                    }
                    if (h === 'uaFullVersion') result.uaFullVersion = fullVersion;
                    if (h === 'wow64') result.wow64 = false;
                }
                return Promise.resolve(result);
            }) : function (hints) {
                var result = {
                    brands: brands,
                    mobile: false,
                    platform: platformName
                };

                for (var i = 0; i < hints.length; i++) {
                    var h = hints[i];
                    if (h === 'architecture') result.architecture = 'x86';
                    if (h === 'bitness') result.bitness = '64';
                    if (h === 'fullVersionList') {
                        result.fullVersionList = brands.map(function (b) {
                            return { brand: b.brand, version: b.brand === 'Not A Brand' ? (notBrandVersion + '.0.0.0') : fullVersion };
                        });
                    }
                    if (h === 'model') result.model = '';
                    if (h === 'platformVersion') {
                        if (platformName === 'Windows') {
                            // Derive Windows version from UA string:
                            // Windows NT 10.0 + Chrome 128+ = likely Win 10 or 11
                            // Chrome 109+ UA always says NT 10.0 regardless of Win 11
                            // Match: higher Chrome versions trend toward Win11
                            var ntMatch = config.userAgent.match(/Windows NT ([\d.]+)/);
                            var chromeMajor = parseInt(chromeVersion, 10) || 100;
                            var ntVersion = ntMatch ? parseFloat(ntMatch[1]) : 10.0;
                            if (ntVersion >= 10.0 && chromeMajor >= 128) {
                                // Win 10 22H2 = 10.0.19045 → platformVersion '10.0.0'
                                // Win 11 = 10.0.22000+ → platformVersion '15.0.0'
                                // Use Chrome version as proxy: newer Chrome → Win 11 more likely
                                result.platformVersion = chromeMajor >= 134 ? '15.0.0' : '10.0.0';
                            } else {
                                result.platformVersion = '10.0.0';
                            }
                        } else if (platformName === 'macOS') {
                            result.platformVersion = '14.4.0';
                        } else {
                            result.platformVersion = '6.5.0';
                        }
                    }
                    if (h === 'uaFullVersion') result.uaFullVersion = fullVersion;
                    if (h === 'wow64') result.wow64 = false;
                }
                return Promise.resolve(result);
            }
        };

        patchProto(navProto, 'userAgentData', uaData);
    }

    // === Screen properties ===
    var screenProto = Screen.prototype;
    patchProto(screenProto, 'width', config.screenWidth);
    patchProto(screenProto, 'height', config.screenHeight);
    patchProto(screenProto, 'availWidth', config.screenWidth);
    patchProto(screenProto, 'availHeight', config.screenHeight - 40);
    patchProto(screenProto, 'colorDepth', config.colorDepth);
    patchProto(screenProto, 'pixelDepth', config.colorDepth);

    // === Window dimensions ===
    try {
        Object.defineProperty(window, 'devicePixelRatio', {
            get: function () { return config.pixelRatio; },
            configurable: true
        });
    } catch (e) { }

    // === Plugins — match exactly the real plugin list for the browser type ===
    if (!isFirefox) {
        try {
            var chromePdfBase = [
                {
                    name: 'PDF Viewer',
                    description: 'Portable Document Format',
                    filename: 'internal-pdf-viewer',
                    length: 1,
                    0: { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }
                },
                {
                    name: 'Chrome PDF Viewer',
                    description: 'Portable Document Format',
                    filename: 'internal-pdf-viewer',
                    length: 1,
                    0: { type: 'application/pdf', suffixes: 'pdf', description: '' }
                },
                {
                    name: 'Chromium PDF Viewer',
                    description: 'Portable Document Format',
                    filename: 'internal-pdf-viewer',
                    length: 1,
                    0: { type: 'application/pdf', suffixes: 'pdf', description: '' }
                },
                {
                    name: 'WebKit built-in PDF',
                    description: 'Portable Document Format',
                    filename: 'internal-pdf-viewer',
                    length: 1,
                    0: { type: 'application/pdf', suffixes: 'pdf', description: '' }
                }
            ];
            // Edge-only plugin — only inject when UA is Microsoft Edge
            var edgePdfPlugin = {
                name: 'Microsoft Edge PDF Viewer',
                description: 'Portable Document Format',
                filename: 'internal-pdf-viewer',
                length: 1,
                0: { type: 'application/pdf', suffixes: 'pdf', description: '' }
            };
            var fakePlugins = isEdge ? chromePdfBase.concat([edgePdfPlugin]) : chromePdfBase;
            fakePlugins.item = function (i) { return fakePlugins[i]; };
            fakePlugins.namedItem = function (name) { return fakePlugins.find(function (p) { return p.name === name; }); };
            fakePlugins.refresh = function () { };
            patchProto(navProto, 'plugins', fakePlugins);
            patchProto(navProto, 'mimeTypes', { length: 2 });
        } catch (e) { }
    }

    // === Connection API — defined in sensors.js to avoid conflicting type values ===
})({
    userAgent: 'USER_AGENT_PLACEHOLDER',
    platform: 'PLATFORM_PLACEHOLDER',
    vendor: 'VENDOR_PLACEHOLDER',
    hardwareConcurrency: HARDWARE_CONCURRENCY_PLACEHOLDER,
    deviceMemory: DEVICE_MEMORY_PLACEHOLDER,
    screenWidth: SCREEN_WIDTH_PLACEHOLDER,
    screenHeight: SCREEN_HEIGHT_PLACEHOLDER,
    viewportWidth: VIEWPORT_WIDTH_PLACEHOLDER,
    viewportHeight: VIEWPORT_HEIGHT_PLACEHOLDER,
    colorDepth: COLOR_DEPTH_PLACEHOLDER,
    pixelRatio: PIXEL_RATIO_PLACEHOLDER,
    language: 'LANGUAGE_PLACEHOLDER',
    languages: 'LANGUAGES_PLACEHOLDER',
    maxTouchPoints: 0
});
