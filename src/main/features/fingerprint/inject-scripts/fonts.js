/**
 * Font Enumeration Spoofing — v1.0
 * Returns fonts consistent with the simulated OS.
 * Prevents font-based OS detection.
 */
(function (config) {
    'use strict';

    var allowedFonts = config.fonts;

    // === Method 1: Override document.fonts.check() ===
    if (document.fonts && document.fonts.check) {
        var origCheck = document.fonts.check.bind(document.fonts);
        document.fonts.check = function (font, text) {
            // Extract font family name from CSS font string like "12px Arial"
            var family = font.replace(/^[\d.]+\w*\s+/, '').replace(/['"]/g, '').trim();
            // Only return true if font is in our allowed list
            var isAllowed = allowedFonts.some(function (f) {
                return f.toLowerCase() === family.toLowerCase();
            });
            if (!isAllowed) return false;
            return origCheck(font, text || 'mmmmmmmmmmlli');
        };
    }

    // === Method 2: Override FontFaceSet iteration ===
    if (document.fonts) {
        var origForEach = document.fonts.forEach;
        if (origForEach) {
            document.fonts.forEach = function (callback, thisArg) {
                return origForEach.call(this, function (fontFace) {
                    var family = fontFace.family.replace(/['"]/g, '');
                    var isAllowed = allowedFonts.some(function (f) {
                        return f.toLowerCase() === family.toLowerCase();
                    });
                    if (isAllowed) {
                        callback.call(thisArg, fontFace);
                    }
                });
            };
        }
    }

    // === Method 3: Spoof text measurement (width-based detection) ===
    // Sites measure text width with different fonts to detect which are installed
    var origMeasureText = CanvasRenderingContext2D.prototype.measureText;
    var baseFonts = ['monospace', 'sans-serif', 'serif'];
    // Pre-calculated widths for base fonts (prevents detection of missing fonts)
    var fallbackWidths = {};

    CanvasRenderingContext2D.prototype.measureText = function (text) {
        var result = origMeasureText.call(this, text);
        var currentFont = this.font || '';

        // Extract font family from canvas font property
        var families = currentFont.split(',').map(function (f) {
            return f.replace(/^[\d.]+\w*\s+/, '').replace(/['"]/g, '').trim();
        });

        // Check if any specified font is NOT in our allowed list
        var hasDisallowed = families.some(function (family) {
            if (baseFonts.indexOf(family.toLowerCase()) !== -1) return false;
            return !allowedFonts.some(function (f) {
                return f.toLowerCase() === family.toLowerCase();
            });
        });

        if (hasDisallowed) {
            // Return measurement for fallback font only
            var fallbackFont = currentFont.replace(/[^,]+,/, '').trim() || 'sans-serif';
            var savedFont = this.font;
            this.font = currentFont.replace(/^([\d.]+\w*\s+).*/, '$1') + fallbackFont;
            var fallbackResult = origMeasureText.call(this, text);
            this.font = savedFont;
            return fallbackResult;
        }

        return result;
    };

    // === Method 4: Protect getComputedStyle font detection ===
    var origGetComputed = window.getComputedStyle;
    window.getComputedStyle = function (element, pseudoElt) {
        var style = origGetComputed.call(window, element, pseudoElt);

        // If checking font-family, ensure it only reports allowed fonts
        var origGetProp = style.getPropertyValue.bind(style);
        style.getPropertyValue = function (prop) {
            if (prop === 'font-family') {
                var value = origGetProp(prop);
                if (value) {
                    var filtered = value.split(',').map(function (f) { return f.trim(); }).filter(function (f) {
                        var clean = f.replace(/['"]/g, '');
                        if (baseFonts.indexOf(clean.toLowerCase()) !== -1) return true;
                        return allowedFonts.some(function (af) {
                            return af.toLowerCase() === clean.toLowerCase();
                        });
                    });
                    return filtered.length > 0 ? filtered.join(', ') : value;
                }
            }
            return origGetProp(prop);
        };

        return style;
    };
})({
    fonts: FONTS_LIST_PLACEHOLDER
});
