/**
 * Worker Fingerprint Bridge
 * Overrides Worker/SharedWorker constructors so that our key fingerprint
 * patches (navigator, performance.now, OffscreenCanvas noise) are injected
 * into every worker before the worker's own script runs.
 *
 * Technique: wrap the worker URL in a blob that calls importScripts()
 * with the patch first, then the original URL.
 * Module workers and cross-origin workers are passed through unchanged.
 */
(function () {
    'use strict';

    var CANVAS_SEED    = 'CANVAS_SEED_PLACEHOLDER';
    var USER_AGENT     = 'USER_AGENT_PLACEHOLDER';
    var HW_CONCURRENCY = HW_CONCURRENCY_PLACEHOLDER;

    // ── Patch function — runs inside Worker global scope (self, not window) ──
    // Must be 100% self-contained (no outer-scope references).
    var patchFn = function (seed, ua, hwc) {
        try {
            // navigator patches (available in dedicated workers)
            if (typeof navigator !== 'undefined') {
                try {
                    Object.defineProperty(navigator, 'webdriver', {
                        get: function () { return false; }, configurable: true,
                    });
                } catch (e) {}
                try {
                    Object.defineProperty(navigator, 'userAgent', {
                        get: function () { return ua; }, configurable: true,
                    });
                } catch (e) {}
                try {
                    Object.defineProperty(navigator, 'hardwareConcurrency', {
                        get: function () { return hwc; }, configurable: true,
                    });
                } catch (e) {}
            }

            // performance.now() — coarsen to ±0.1 ms (same as page context)
            if (typeof performance !== 'undefined' && performance.now) {
                var _oNow = performance.now.bind(performance);
                Object.defineProperty(performance, 'now', {
                    value: function () { return Math.round(_oNow() * 10) / 10; },
                    writable: true, configurable: true,
                });
            }

            // OffscreenCanvas — apply same deterministic noise as canvas.js
            if (typeof OffscreenCanvasRenderingContext2D !== 'undefined') {
                var seedNum = 0;
                for (var i = 0; i < seed.length; i++) seedNum += seed.charCodeAt(i);

                var _oGID = OffscreenCanvasRenderingContext2D.prototype.getImageData;
                OffscreenCanvasRenderingContext2D.prototype.getImageData = function (sx, sy, sw, sh) {
                    var d = _oGID.call(this, sx, sy, sw, sh);
                    var data = d.data;
                    var step = Math.max(1, Math.floor(sw * sh / 5000));
                    for (var idx = 0; idx < data.length; idx += step * 4) {
                        var px = (idx / 4) | 0;
                        var x  = px % sw;
                        var y  = (px / sw) | 0;
                        for (var c = 0; c < 3; c++) {
                            var raw = Math.sin(seedNum * 12.9898 + (x + c * 997) * 78.233 + y * 37.719) * 10000;
                            var n   = (raw - Math.floor(raw)) * 2 - 1;
                            data[idx + c] = Math.max(0, Math.min(255, data[idx + c] + n * 0.4));
                        }
                    }
                    return d;
                };
            }
        } catch (e) {}
    };

    // Serialise patch with per-profile arguments baked in
    var patchCode = '(' + patchFn.toString() + ')('
        + JSON.stringify(CANVAS_SEED) + ','
        + JSON.stringify(USER_AGENT)  + ','
        + String(HW_CONCURRENCY)
        + ');';

    var _patchUrl = null;
    function getPatchUrl() {
        if (!_patchUrl) {
            var blob = new Blob([patchCode], { type: 'application/javascript' });
            _patchUrl = URL.createObjectURL(blob);
        }
        return _patchUrl;
    }

    function wrapUrl(url) {
        try {
            var s = (url instanceof URL) ? url.href : String(url);
            // Only same-origin and blob URLs support importScripts()
            var samePorigin = s.startsWith('blob:')
                || s.startsWith('/')
                || (typeof location !== 'undefined' && s.startsWith(location.origin));
            if (!samePorigin) return null;

            var pUrl    = getPatchUrl();
            var wrapper = 'importScripts(' + JSON.stringify(pUrl) + ',' + JSON.stringify(s) + ');';
            var wBlob   = new Blob([wrapper], { type: 'application/javascript' });
            return URL.createObjectURL(wBlob);
        } catch (e) {
            return null;
        }
    }

    // ── Override Worker ──────────────────────────────────────────────────
    if (typeof Worker !== 'undefined') {
        var OrigWorker = Worker;
        function PatchedWorker(url, options) {
            if (options && options.type === 'module') {
                return new OrigWorker(url, options);
            }
            var wrapped = wrapUrl(url);
            return new OrigWorker(wrapped || url, options);
        }
        PatchedWorker.prototype = OrigWorker.prototype;
        try { window.Worker = PatchedWorker; } catch (e) {}
    }

    // ── Override SharedWorker ────────────────────────────────────────────
    if (typeof SharedWorker !== 'undefined') {
        var OrigSW = SharedWorker;
        function PatchedSW(url, options) {
            if (options && options.type === 'module') {
                return new OrigSW(url, options);
            }
            var wrapped = wrapUrl(url);
            return new OrigSW(wrapped || url, options);
        }
        PatchedSW.prototype = OrigSW.prototype;
        try { window.SharedWorker = PatchedSW; } catch (e) {}
    }
})();
