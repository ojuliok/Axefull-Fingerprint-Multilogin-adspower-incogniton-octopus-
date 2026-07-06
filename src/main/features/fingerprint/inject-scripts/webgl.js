/**
 * WebGL Fingerprint Spoofing — v2.0
 * Patches at prototype level to survive getOwnPropertyDescriptor checks.
 * Covers WebGL1 + WebGL2 + extensions list.
 */
(function (config) {
    'use strict';

    var UNMASKED_VENDOR_WEBGL = 0x9245;
    var UNMASKED_RENDERER_WEBGL = 0x9246;

    var seedHash = 0;
    for (var i = 0; i < config.seed.length; i++) {
        seedHash += config.seed.charCodeAt(i);
    }

    // === Patch getParameter at prototype level ===
    function createPatchedGetParameter(OriginalPrototype) {
        var originalGetParameter = OriginalPrototype.getParameter;
        OriginalPrototype.getParameter = function (param) {
            if (param === UNMASKED_VENDOR_WEBGL) return config.vendor;
            if (param === UNMASKED_RENDERER_WEBGL) return config.renderer;

            var result = originalGetParameter.call(this, param);

            // Subtle variation on MAX parameters based on seed
            if (typeof result === 'number' && result > 256) {
                var variation = ((seedHash + param) % 5) - 2; // -2 to +2
                if (result + variation > 0) return result + variation;
            }

            return result;
        };
    }

    createPatchedGetParameter(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) {
        createPatchedGetParameter(WebGL2RenderingContext.prototype);
    }

    // === Patch getShaderPrecisionFormat ===
    function createPatchedShaderPrecision(OriginalPrototype) {
        var original = OriginalPrototype.getShaderPrecisionFormat;
        if (!original) return;
        OriginalPrototype.getShaderPrecisionFormat = function (shaderType, precisionType) {
            var result = original.call(this, shaderType, precisionType);
            if (result) {
                var v = (seedHash + shaderType + precisionType) % 3;
                var proto = window.WebGLShaderPrecisionFormat ? WebGLShaderPrecisionFormat.prototype : Object.prototype;
                var formatObj = Object.create(proto);
                Object.defineProperties(formatObj, {
                    rangeMin: { value: result.rangeMin + v, enumerable: true },
                    rangeMax: { value: result.rangeMax + v, enumerable: true },
                    precision: { value: result.precision, enumerable: true }
                });
                return formatObj;
            }
            return result;
        };
    }

    createPatchedShaderPrecision(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) {
        createPatchedShaderPrecision(WebGL2RenderingContext.prototype);
    }

    // === Patch getSupportedExtensions to return consistent list ===
    function createPatchedExtensions(OriginalPrototype) {
        var original = OriginalPrototype.getSupportedExtensions;
        if (!original) return;
        OriginalPrototype.getSupportedExtensions = function () {
            var extensions = original.call(this);
            if (!extensions) return extensions;
            // Remove extensions that leak hardware info, based on seed
            var filtered = extensions.filter(function (ext) {
                // Conditionally remove some extensions based on seed for uniqueness
                if (ext === 'WEBGL_debug_renderer_info') return true; // Keep so vendor/renderer spoof works
                if (ext === 'WEBGL_debug_shaders' && seedHash % 2 === 0) return false;
                return true;
            });
            return filtered;
        };
    }

    createPatchedExtensions(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) {
        createPatchedExtensions(WebGL2RenderingContext.prototype);
    }

    // === Patch getExtension for debug_renderer_info ===
    function createPatchedGetExtension(OriginalPrototype) {
        var original = OriginalPrototype.getExtension;
        OriginalPrototype.getExtension = function (name) {
            var ext = original.call(this, name);
            if (name === 'WEBGL_debug_renderer_info' && ext) {
                return new Proxy(ext, {
                    get: function (target, prop) {
                        if (prop === 'UNMASKED_VENDOR_WEBGL') return UNMASKED_VENDOR_WEBGL;
                        if (prop === 'UNMASKED_RENDERER_WEBGL') return UNMASKED_RENDERER_WEBGL;
                        return target[prop];
                    }
                });
            }
            return ext;
        };
    }

    createPatchedGetExtension(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) {
        createPatchedGetExtension(WebGL2RenderingContext.prototype);
    }

    // === Patch readPixels to add noise ===
    function createPatchedReadPixels(OriginalPrototype) {
        var original = OriginalPrototype.readPixels;
        if (!original) return;
        OriginalPrototype.readPixels = function (x, y, w, h, format, type, pixels) {
            original.call(this, x, y, w, h, format, type, pixels);
            if (pixels && pixels.length) {
                for (var i = 0; i < pixels.length; i += 37) {
                    var n = ((seedHash + i) % 3) - 1;
                    pixels[i] = Math.max(0, Math.min(255, pixels[i] + n));
                }
            }
        };
    }

    createPatchedReadPixels(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) {
        createPatchedReadPixels(WebGL2RenderingContext.prototype);
    }
})({
    vendor: 'WEBGL_VENDOR_PLACEHOLDER',
    renderer: 'WEBGL_RENDERER_PLACEHOLDER',
    seed: 'WEBGL_SEED_PLACEHOLDER'
});
