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
        var desc = {
            get: function () { return value; },
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
    patchProto(navProto, 'languages', Object.freeze(config.languages.split(',')));
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
            toJSON: function () {
                return { brands: this.brands, mobile: this.mobile, platform: this.platform };
            },
            getHighEntropyValues: function (hints) {
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
                        if (platformName === 'Windows') result.platformVersion = '15.0.0';
                        else if (platformName === 'macOS') result.platformVersion = '14.4.0';
                        else result.platformVersion = '6.5.0';
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

    // === Plugins (realistic for Chrome) ===
    if (!isFirefox) {
        try {
            var fakePlugins = [
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
                    name: 'Microsoft Edge PDF Viewer',
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
            fakePlugins.item = function (i) { return fakePlugins[i]; };
            fakePlugins.namedItem = function (name) { return fakePlugins.find(function (p) { return p.name === name; }); };
            fakePlugins.refresh = function () { };
            patchProto(navProto, 'plugins', fakePlugins);
            patchProto(navProto, 'mimeTypes', { length: 2 });
        } catch (e) { }
    }

    // === Connection API ===
    if (navigator.connection || 'connection' in navProto) {
        var connData = {
            effectiveType: '4g',
            downlink: 10,
            rtt: 50,
            saveData: false,
            type: 'wifi',
            onchange: null,
            addEventListener: function () { },
            removeEventListener: function () { }
        };
        try {
            patchProto(navProto, 'connection', connData);
        } catch (e) { }
    }
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
