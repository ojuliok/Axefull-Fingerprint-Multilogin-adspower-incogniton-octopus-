/**
 * Intl & Timezone Consistency Script — v1.0
 * Ensures Date, Intl.DateTimeFormat, and timezone all match.
 * Must be injected AFTER navigator.js (needs timezone from Playwright).
 */
(function (config) {
    'use strict';

    var tz = config.timezone;
    var locale = config.locale;

    // === Date.getTimezoneOffset() ===
    // Playwright already sets timezoneId, but we reinforce it and ensure
    // the offset is correct for the configured timezone
    // === Date.getTimezoneOffset() ===
    // Dynamically calculate the timezone offset for the target timezone 'tz'
    // to handle any timezone and DST changes correctly.
    var origGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = function () {
        try {
            var formatter = new OrigDateTimeFormat('en-US', {
                timeZone: tz,
                hour12: false,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            var parts = formatter.formatToParts(this);
            var partMap = {};
            for (var i = 0; i < parts.length; i++) {
                partMap[parts[i].type] = parts[i].value;
            }
            
            var year = parseInt(partMap.year, 10);
            var month = parseInt(partMap.month, 10) - 1;
            var day = parseInt(partMap.day, 10);
            var hour = parseInt(partMap.hour, 10);
            if (hour === 24) hour = 0; // handle edge case in formatting
            var minute = parseInt(partMap.minute, 10);
            var second = parseInt(partMap.second, 10);
            
            var targetUtc = Date.UTC(year, month, day, hour, minute, second);
            var diffMs = this.getTime() - targetUtc;
            return Math.round(diffMs / 60000);
        } catch (e) {
            // Fallback to static offset or original behavior
            var tzOffsets = {
                'America/Sao_Paulo': 180, 'America/New_York': 300, 'America/Chicago': 360,
                'America/Denver': 420, 'America/Los_Angeles': 480, 'America/Anchorage': 540,
                'Pacific/Honolulu': 600, 'Europe/London': 0, 'Europe/Paris': -60,
                'Europe/Berlin': -60, 'Europe/Moscow': -180, 'Asia/Dubai': -240,
                'Asia/Kolkata': -330, 'Asia/Bangkok': -420, 'Asia/Shanghai': -480,
                'Asia/Tokyo': -540, 'Australia/Sydney': -660, 'Pacific/Auckland': -720
            };
            var expectedOffset = tzOffsets[tz];
            return expectedOffset !== undefined ? expectedOffset : origGetTimezoneOffset.call(this);
        }
    };

    // === Intl.DateTimeFormat — ensure resolvedOptions matches ===
    var OrigDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function () {
        var args = Array.prototype.slice.call(arguments);
        // If no locale specified, use our configured locale
        if (!args[0]) args[0] = locale;
        // Merge timezone into options
        if (!args[1]) args[1] = {};
        if (!args[1].timeZone) args[1].timeZone = tz;

        var formatter = new OrigDateTimeFormat(args[0], args[1]);
        var origResolved = formatter.resolvedOptions.bind(formatter);

        formatter.resolvedOptions = function () {
            var opts = origResolved();
            opts.timeZone = tz;
            if (!opts.locale.startsWith(locale.split('-')[0])) {
                opts.locale = locale;
            }
            return opts;
        };

        return formatter;
    };
    Intl.DateTimeFormat.prototype = OrigDateTimeFormat.prototype;
    Intl.DateTimeFormat.supportedLocalesOf = OrigDateTimeFormat.supportedLocalesOf;

    // === Intl.NumberFormat — consistent locale ===
    var OrigNumberFormat = Intl.NumberFormat;
    Intl.NumberFormat = function () {
        var args = Array.prototype.slice.call(arguments);
        if (!args[0]) args[0] = locale;
        return new OrigNumberFormat(args[0], args[1]);
    };
    Intl.NumberFormat.prototype = OrigNumberFormat.prototype;
    Intl.NumberFormat.supportedLocalesOf = OrigNumberFormat.supportedLocalesOf;

    // === Intl.RelativeTimeFormat ===
    if (Intl.RelativeTimeFormat) {
        var OrigRelative = Intl.RelativeTimeFormat;
        Intl.RelativeTimeFormat = function () {
            var args = Array.prototype.slice.call(arguments);
            if (!args[0]) args[0] = locale;
            return new OrigRelative(args[0], args[1]);
        };
        Intl.RelativeTimeFormat.prototype = OrigRelative.prototype;
        Intl.RelativeTimeFormat.supportedLocalesOf = OrigRelative.supportedLocalesOf;
    }

    // === Performance.now() — reduce precision to prevent timing attacks ===
    var origPerfNow = performance.now.bind(performance);
    performance.now = function () {
        // Round to 100µs precision (real browsers do this for Spectre mitigation)
        return Math.round(origPerfNow() * 10) / 10;
    };

    // === Date.now() — slight jitter ===
    var origDateNow = Date.now;
    Date.now = function () {
        return origDateNow.call(Date);
    };

})({
    timezone: 'TIMEZONE_PLACEHOLDER',
    locale: 'LOCALE_PLACEHOLDER'
});
