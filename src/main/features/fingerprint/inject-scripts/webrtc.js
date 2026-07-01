/**
 * WebRTC Leak Prevention — v2.0
 * Prevents local IP leaks via WebRTC ICE candidates.
 */
(function (mode) {
    'use strict';

    if (mode === 'real') return;

    if (mode === 'disabled') {
        var noop = function () { return undefined; };
        try { Object.defineProperty(window, 'RTCPeerConnection', { value: noop, writable: false, configurable: false }); } catch (e) { }
        try { Object.defineProperty(window, 'webkitRTCPeerConnection', { value: noop, writable: false, configurable: false }); } catch (e) { }
        try { Object.defineProperty(window, 'mozRTCPeerConnection', { value: noop, writable: false, configurable: false }); } catch (e) { }
        try { Object.defineProperty(window, 'RTCDataChannel', { value: noop, writable: false, configurable: false }); } catch (e) { }
        try { Object.defineProperty(window, 'RTCSessionDescription', { value: noop, writable: false, configurable: false }); } catch (e) { }
        return;
    }

    if (mode === 'fake') {
        var Orig = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        if (!Orig) return;

        var localIpRegex = /((192\.168\.)|(10\.)|(172\.(1[6-9]|2\d|3[01])\.)|(127\.)|(::1)|(fc00:)|(fe80:))\S*/;

        function PatchedRTC(config, constraints) {
            // Remove STUN servers, keep only TURN
            if (config && config.iceServers) {
                config.iceServers = config.iceServers.map(function (server) {
                    var urls = Array.isArray(server.urls) ? server.urls : [server.urls || server.url];
                    urls = urls.filter(function (u) { return u && u.indexOf('turn:') === 0; });
                    server.urls = urls;
                    return server;
                }).filter(function (s) { return s.urls.length > 0; });
            }

            var pc = new Orig(config, constraints);

            // Wrap addEventListener for 'icecandidate'
            var origAddEvent = pc.addEventListener.bind(pc);
            pc.addEventListener = function (type, listener, options) {
                if (type === 'icecandidate' && listener) {
                    var wrappedListener = function (event) {
                        if (event.candidate && event.candidate.candidate) {
                            if (localIpRegex.test(event.candidate.candidate) || event.candidate.candidate.indexOf('host') !== -1) {
                                return; // suppress local IP candidate
                            }
                        }
                        listener(event);
                    };
                    return origAddEvent(type, wrappedListener, options);
                }
                return origAddEvent(type, listener, options);
            };

            // Wrap onicecandidate setter
            var _handler = null;
            Object.defineProperty(pc, 'onicecandidate', {
                set: function (handler) {
                    if (handler) {
                        _handler = function (event) {
                            if (event.candidate && event.candidate.candidate) {
                                if (localIpRegex.test(event.candidate.candidate) || event.candidate.candidate.indexOf('host') !== -1) {
                                    return;
                                }
                            }
                            handler(event);
                        };
                        origAddEvent('icecandidate', _handler);
                    } else {
                        _handler = null;
                    }
                },
                get: function () { return _handler; }
            });

            return pc;
        }

        PatchedRTC.prototype = Orig.prototype;
        PatchedRTC.generateCertificate = Orig.generateCertificate;

        window.RTCPeerConnection = PatchedRTC;
        if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = PatchedRTC;
    }
})('WEBRTC_MODE_PLACEHOLDER');
