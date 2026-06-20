/**
 * Geolocation Spoofing — overrides navigator.geolocation with coordinates
 * derived from the profile timezone. Adds a small seeded random offset so
 * the position is never exactly the city center (more realistic).
 */
(function () {
    'use strict';

    var TIMEZONE = 'TIMEZONE_PLACEHOLDER';

    // Timezone → approximate city center coordinates
    var TZ_COORDS = {
        'America/Sao_Paulo':      { lat: -23.5505, lon: -46.6333 },
        'America/Manaus':         { lat: -3.1019,  lon: -60.0250 },
        'America/Belem':          { lat: -1.4558,  lon: -48.5044 },
        'America/Fortaleza':      { lat: -3.7172,  lon: -38.5433 },
        'America/Recife':         { lat: -8.0539,  lon: -34.8811 },
        'America/Maceio':         { lat: -9.6658,  lon: -35.7350 },
        'America/Bahia':          { lat: -12.9714, lon: -38.5014 },
        'America/Cuiaba':         { lat: -15.5961, lon: -56.0962 },
        'America/Porto_Velho':    { lat: -8.7612,  lon: -63.9004 },
        'America/Boa_Vista':      { lat:  2.8197,  lon: -60.6733 },
        'America/Rio_Branco':     { lat: -9.9754,  lon: -67.8249 },
        'America/Noronha':        { lat: -3.8564,  lon: -32.4285 },
        'America/New_York':       { lat: 40.7128,  lon: -74.0060 },
        'America/Chicago':        { lat: 41.8781,  lon: -87.6298 },
        'America/Denver':         { lat: 39.7392,  lon: -104.9903 },
        'America/Los_Angeles':    { lat: 34.0522,  lon: -118.2437 },
        'America/Phoenix':        { lat: 33.4484,  lon: -112.0740 },
        'America/Anchorage':      { lat: 61.2181,  lon: -149.9003 },
        'America/Honolulu':       { lat: 21.3069,  lon: -157.8583 },
        'America/Toronto':        { lat: 43.6532,  lon: -79.3832 },
        'America/Vancouver':      { lat: 49.2827,  lon: -123.1207 },
        'America/Mexico_City':    { lat: 19.4326,  lon: -99.1332 },
        'America/Bogota':         { lat:  4.7110,  lon: -74.0721 },
        'America/Lima':           { lat: -12.0464, lon: -77.0428 },
        'America/Buenos_Aires':   { lat: -34.6037, lon: -58.3816 },
        'America/Santiago':       { lat: -33.4489, lon: -70.6693 },
        'America/Caracas':        { lat: 10.4806,  lon: -66.9036 },
        'Europe/London':          { lat: 51.5074,  lon: -0.1278 },
        'Europe/Paris':           { lat: 48.8566,  lon:  2.3522 },
        'Europe/Berlin':          { lat: 52.5200,  lon: 13.4050 },
        'Europe/Madrid':          { lat: 40.4168,  lon: -3.7038 },
        'Europe/Rome':            { lat: 41.9028,  lon: 12.4964 },
        'Europe/Lisbon':          { lat: 38.7169,  lon: -9.1399 },
        'Europe/Amsterdam':       { lat: 52.3676,  lon:  4.9041 },
        'Europe/Brussels':        { lat: 50.8503,  lon:  4.3517 },
        'Europe/Warsaw':          { lat: 52.2297,  lon: 21.0122 },
        'Europe/Moscow':          { lat: 55.7558,  lon: 37.6176 },
        'Europe/Istanbul':        { lat: 41.0082,  lon: 28.9784 },
        'Europe/Kyiv':            { lat: 50.4501,  lon: 30.5234 },
        'Asia/Tokyo':             { lat: 35.6762,  lon: 139.6503 },
        'Asia/Shanghai':          { lat: 31.2304,  lon: 121.4737 },
        'Asia/Singapore':         { lat:  1.3521,  lon: 103.8198 },
        'Asia/Seoul':             { lat: 37.5665,  lon: 126.9780 },
        'Asia/Kolkata':           { lat: 28.6139,  lon: 77.2090 },
        'Asia/Dubai':             { lat: 25.2048,  lon: 55.2708 },
        'Asia/Jakarta':           { lat: -6.2088,  lon: 106.8456 },
        'Asia/Bangkok':           { lat: 13.7563,  lon: 100.5018 },
        'Asia/Karachi':           { lat: 24.8607,  lon: 67.0011 },
        'Asia/Dhaka':             { lat: 23.8103,  lon: 90.4125 },
        'Asia/Colombo':           { lat:  6.9271,  lon: 79.8612 },
        'Asia/Tehran':            { lat: 35.6892,  lon: 51.3890 },
        'Asia/Riyadh':            { lat: 24.7136,  lon: 46.6753 },
        'Asia/Manila':            { lat: 14.5995,  lon: 120.9842 },
        'Africa/Cairo':           { lat: 30.0444,  lon: 31.2357 },
        'Africa/Lagos':           { lat:  6.5244,  lon:  3.3792 },
        'Africa/Johannesburg':    { lat: -26.2041, lon: 28.0473 },
        'Africa/Nairobi':         { lat: -1.2921,  lon: 36.8219 },
        'Africa/Casablanca':      { lat: 33.5731,  lon: -7.5898 },
        'Australia/Sydney':       { lat: -33.8688, lon: 151.2093 },
        'Australia/Melbourne':    { lat: -37.8136, lon: 144.9631 },
        'Australia/Brisbane':     { lat: -27.4698, lon: 153.0251 },
        'Australia/Perth':        { lat: -31.9505, lon: 115.8605 },
        'Pacific/Auckland':       { lat: -36.8509, lon: 174.7645 },
        'Pacific/Honolulu':       { lat: 21.3069,  lon: -157.8583 },
        'UTC':                    { lat: 51.5074,  lon: -0.1278 },
    };

    // Small deterministic jitter so position is not exactly city center.
    // Uses a simple seed derived from the timezone string.
    function seededRandom(seed) {
        var x = Math.sin(seed + 1) * 43758.5453123;
        return x - Math.floor(x);
    }
    function tzSeed(tz) {
        var n = 0;
        for (var i = 0; i < tz.length; i++) n = (n * 31 + tz.charCodeAt(i)) & 0x7fffffff;
        return n;
    }

    var base = TZ_COORDS[TIMEZONE] || { lat: 51.5074, lon: -0.1278 };
    var seed = tzSeed(TIMEZONE);

    // ±0.02 degrees ≈ ±2.2 km — realistic city-level precision
    var JITTER = 0.02;
    var lat = base.lat + (seededRandom(seed)     - 0.5) * JITTER * 2;
    var lon = base.lon + (seededRandom(seed + 1) - 0.5) * JITTER * 2;

    // Accuracy varies per "device" — 15–95m range
    var accuracy = 15 + Math.floor(seededRandom(seed + 2) * 80);

    function makePosition() {
        return {
            coords: {
                latitude:         lat,
                longitude:        lon,
                altitude:         null,
                accuracy:         accuracy,
                altitudeAccuracy: null,
                heading:          null,
                speed:            null,
            },
            timestamp: Date.now(),
        };
    }

    // Intercept geolocation API at prototype level
    if (navigator.geolocation) {
        var geoProto = Object.getPrototypeOf(navigator.geolocation);

        Object.defineProperty(geoProto, 'getCurrentPosition', {
            value: function (success, error, options) {
                var delay = 300 + Math.floor(Math.random() * 400);
                setTimeout(function () {
                    if (success) success(makePosition());
                }, delay);
            },
            writable: true, configurable: true,
        });

        // watchPosition — returns a fake watch ID, fires once immediately
        var _watchId = 1;
        Object.defineProperty(geoProto, 'watchPosition', {
            value: function (success, error, options) {
                var id = _watchId++;
                var delay = 300 + Math.floor(Math.random() * 400);
                setTimeout(function () {
                    if (success) success(makePosition());
                }, delay);
                return id;
            },
            writable: true, configurable: true,
        });

        Object.defineProperty(geoProto, 'clearWatch', {
            value: function (id) { /* noop */ },
            writable: true, configurable: true,
        });
    }
})();
