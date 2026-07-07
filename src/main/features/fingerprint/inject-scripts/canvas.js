/**
 * Canvas Fingerprint Spoofing — v2.0
 * Adds deterministic noise based on seed to prevent fingerprinting.
 * Uses anti-recursion flag to prevent double-noise application.
 */
(function (seed) {
    'use strict';

    var seedNum = 0;
    for (var i = 0; i < seed.length; i++) {
        seedNum += seed.charCodeAt(i);
    }

    function seededRandom(s) {
        var x = Math.sin(s++) * 10000;
        return x - Math.floor(x);
    }

    function noise(s, x, y) {
        var n = seededRandom(s * 12.9898 + x * 78.233 + y * 37.719);
        return (n * 2 - 1) * 0.4;
    }

    // Anti-recursion flag — prevents double noise
    var _applying = false;

    var originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    var originalToBlob = HTMLCanvasElement.prototype.toBlob;
    var originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

    function addNoiseToImageData(imageData, width, height) {
        var data = imageData.data;
        // Only modify a subset of pixels for performance and subtlety
        var step = Math.max(1, Math.floor(width * height / 5000));
        for (var idx = 0; idx < data.length; idx += step * 4) {
            var px = (idx / 4) | 0;
            var x = px % width;
            var y = (px / width) | 0;
            for (var c = 0; c < 3; c++) {
                var n = noise(seedNum, x + c * 997, y);
                data[idx + c] = Math.max(0, Math.min(255, data[idx + c] + n));
            }
        }
        return imageData;
    }

    HTMLCanvasElement.prototype.toDataURL = window.__stealth_add_patched ? window.__stealth_add_patched(function () {
        if (_applying) return originalToDataURL.apply(this, arguments);
        try {
            var ctx = this.getContext('2d');
            if (ctx && this.width > 0 && this.height > 0) {
                _applying = true;
                var imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
                _applying = false;
                addNoiseToImageData(imageData, this.width, this.height);

                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.width;
                tempCanvas.height = this.height;
                var tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(imageData, 0, 0);
                return originalToDataURL.apply(tempCanvas, arguments);
            }
        } catch (e) {
            _applying = false;
        }
        return originalToDataURL.apply(this, arguments);
    }) : function () {
        if (_applying) return originalToDataURL.apply(this, arguments);
        try {
            var ctx = this.getContext('2d');
            if (ctx && this.width > 0 && this.height > 0) {
                _applying = true;
                var imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
                _applying = false;
                addNoiseToImageData(imageData, this.width, this.height);

                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.width;
                tempCanvas.height = this.height;
                var tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(imageData, 0, 0);
                return originalToDataURL.apply(tempCanvas, arguments);
            }
        } catch (e) {
            _applying = false;
        }
        return originalToDataURL.apply(this, arguments);
    };

    HTMLCanvasElement.prototype.toBlob = window.__stealth_add_patched ? window.__stealth_add_patched(function (callback) {
        if (_applying) return originalToBlob.apply(this, arguments);
        var args = Array.prototype.slice.call(arguments);
        try {
            var ctx = this.getContext('2d');
            if (ctx && this.width > 0 && this.height > 0) {
                _applying = true;
                var imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
                _applying = false;
                addNoiseToImageData(imageData, this.width, this.height);

                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.width;
                tempCanvas.height = this.height;
                var tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(imageData, 0, 0);
                return originalToBlob.apply(tempCanvas, args);
            }
        } catch (e) {
            _applying = false;
        }
        return originalToBlob.apply(this, args);
    }) : function (callback) {
        if (_applying) return originalToBlob.apply(this, arguments);
        var args = Array.prototype.slice.call(arguments);
        try {
            var ctx = this.getContext('2d');
            if (ctx && this.width > 0 && this.height > 0) {
                _applying = true;
                var imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
                _applying = false;
                addNoiseToImageData(imageData, this.width, this.height);

                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.width;
                tempCanvas.height = this.height;
                var tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(imageData, 0, 0);
                return originalToBlob.apply(tempCanvas, args);
            }
        } catch (e) {
            _applying = false;
        }
        return originalToBlob.apply(this, args);
    };

    CanvasRenderingContext2D.prototype.getImageData = window.__stealth_add_patched ? window.__stealth_add_patched(function (sx, sy, sw, sh) {
        var imageData = originalGetImageData.call(this, sx, sy, sw, sh);
        if (!_applying) {
            addNoiseToImageData(imageData, sw, sh);
        }
        return imageData;
    }) : function (sx, sy, sw, sh) {
        var imageData = originalGetImageData.call(this, sx, sy, sw, sh);
        if (!_applying) {
            addNoiseToImageData(imageData, sw, sh);
        }
        return imageData;
    };
})('CANVAS_SEED_PLACEHOLDER');
