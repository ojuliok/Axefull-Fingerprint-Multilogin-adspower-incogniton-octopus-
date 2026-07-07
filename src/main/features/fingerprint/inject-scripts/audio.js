/**
 * Audio Context Fingerprint Spoofing — v2.0
 * Adds deterministic noise to AudioContext APIs.
 */
(function (seed) {
    'use strict';

    function seededRandom(s) {
        var x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    }

    var seedNum = 0;
    for (var i = 0; i < seed.length; i++) {
        seedNum += seed.charCodeAt(i);
    }

    var OrigAudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!OrigAudioCtx) return;

    // === AnalyserNode — getFloatFrequencyData ===
    var origGetFloat = AnalyserNode.prototype.getFloatFrequencyData;
    AnalyserNode.prototype.getFloatFrequencyData = window.__stealth_add_patched ? window.__stealth_add_patched(function (array) {
        origGetFloat.call(this, array);
        for (var i = 0; i < array.length; i += 7) {
            array[i] += (seededRandom(seedNum + i) - 0.5) * 0.1;
        }
    }) : function (array) {
        origGetFloat.call(this, array);
        for (var i = 0; i < array.length; i += 7) {
            array[i] += (seededRandom(seedNum + i) - 0.5) * 0.1;
        }
    };

    // === AnalyserNode — getByteFrequencyData ===
    var origGetByte = AnalyserNode.prototype.getByteFrequencyData;
    AnalyserNode.prototype.getByteFrequencyData = window.__stealth_add_patched ? window.__stealth_add_patched(function (array) {
        origGetByte.call(this, array);
        for (var i = 0; i < array.length; i += 11) {
            var n = Math.floor((seededRandom(seedNum + i) - 0.5) * 2);
            array[i] = Math.max(0, Math.min(255, array[i] + n));
        }
    }) : function (array) {
        origGetByte.call(this, array);
        for (var i = 0; i < array.length; i += 11) {
            var n = Math.floor((seededRandom(seedNum + i) - 0.5) * 2);
            array[i] = Math.max(0, Math.min(255, array[i] + n));
        }
    };

    // === AnalyserNode — getFloatTimeDomainData ===
    var origGetFloatTime = AnalyserNode.prototype.getFloatTimeDomainData;
    if (origGetFloatTime) {
        AnalyserNode.prototype.getFloatTimeDomainData = window.__stealth_add_patched ? window.__stealth_add_patched(function (array) {
            origGetFloatTime.call(this, array);
            for (var i = 0; i < array.length; i += 13) {
                array[i] += (seededRandom(seedNum + i + 500) - 0.5) * 0.0001;
            }
        }) : function (array) {
            origGetFloatTime.call(this, array);
            for (var i = 0; i < array.length; i += 13) {
                array[i] += (seededRandom(seedNum + i + 500) - 0.5) * 0.0001;
            }
        };
    }

    // === OscillatorNode — slight frequency offset ===
    var origCreateOsc = OrigAudioCtx.prototype.createOscillator;
    OrigAudioCtx.prototype.createOscillator = window.__stealth_add_patched ? window.__stealth_add_patched(function () {
        var osc = origCreateOsc.call(this);
        var origConnect = osc.connect.bind(osc);
        osc.connect = function (dest) {
            var freq = osc.frequency.value;
            var offset = (seededRandom(seedNum + 42) - 0.5) * 0.0005;
            osc.frequency.value = freq * (1 + offset);
            return origConnect.apply(null, arguments);
        };
        return osc;
    }) : function () {
        var osc = origCreateOsc.call(this);
        var origConnect = osc.connect.bind(osc);
        osc.connect = function (dest) {
            var freq = osc.frequency.value;
            var offset = (seededRandom(seedNum + 42) - 0.5) * 0.0005;
            osc.frequency.value = freq * (1 + offset);
            return origConnect.apply(null, arguments);
        };
        return osc;
    };

    // === AudioBuffer — getChannelData noise ===
    var origCreateBuffer = OrigAudioCtx.prototype.createBuffer;
    OrigAudioCtx.prototype.createBuffer = window.__stealth_add_patched ? window.__stealth_add_patched(function (channels, length, sampleRate) {
        var buffer = origCreateBuffer.call(this, channels, length, sampleRate);
        var origGetChannel = buffer.getChannelData.bind(buffer);
        buffer.getChannelData = function (channel) {
            var data = origGetChannel(channel);
            for (var i = 0; i < data.length; i += 173) {
                data[i] += (seededRandom(seedNum + i + channel * 31) - 0.5) * 0.00005;
            }
            return data;
        };
        return buffer;
    }) : function (channels, length, sampleRate) {
        var buffer = origCreateBuffer.call(this, channels, length, sampleRate);
        var origGetChannel = buffer.getChannelData.bind(buffer);
        buffer.getChannelData = function (channel) {
            var data = origGetChannel(channel);
            for (var i = 0; i < data.length; i += 173) {
                data[i] += (seededRandom(seedNum + i + channel * 31) - 0.5) * 0.00005;
            }
            return data;
        };
        return buffer;
    };

    // === OfflineAudioContext — startRendering noise ===
    var OrigOffline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (OrigOffline) {
        var origStartRendering = OrigOffline.prototype.startRendering;
        OrigOffline.prototype.startRendering = window.__stealth_add_patched ? window.__stealth_add_patched(function () {
            return origStartRendering.call(this).then(function (buffer) {
                for (var ch = 0; ch < buffer.numberOfChannels; ch++) {
                    var data = buffer.getChannelData(ch);
                    for (var i = 0; i < data.length; i += 97) {
                        data[i] += (seededRandom(seedNum + i + ch * 17) - 0.5) * 0.00003;
                    }
                }
                return buffer;
            });
        }) : function () {
            return origStartRendering.call(this).then(function (buffer) {
                for (var ch = 0; ch < buffer.numberOfChannels; ch++) {
                    var data = buffer.getChannelData(ch);
                    for (var i = 0; i < data.length; i += 97) {
                        data[i] += (seededRandom(seedNum + i + ch * 17) - 0.5) * 0.00003;
                    }
                }
                return buffer;
            });
        };
    }
})('AUDIO_SEED_PLACEHOLDER');
