import http from 'http';
import net from 'net';
import { SocksClient, SocksClientOptions } from 'socks';

export class ProxyTunnel {
    private server: http.Server;
    private port: number = 0;

    constructor(
        private upstreamType: string,
        private upstreamHost: string,
        private upstreamPort: number,
        private username?: string,
        private password?: string,
        private bypassHosts: string[] = []
    ) {
        this.server = http.createServer();
        this.server.on('request', this.handleRequest.bind(this));
        this.server.on('connect', this.handleConnect.bind(this));
    }

    /**
     * Start the local proxy loopback server on a dynamic port.
     */
    start(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.server.listen(0, '127.0.0.1', () => {
                this.port = (this.server.address() as net.AddressInfo).port;
                resolve(this.port);
            });
            this.server.on('error', reject);
        });
    }

    /**
     * Close the proxy server.
     */
    close(): void {
        this.server.close();
    }

    private shouldBypass(hostPort: string): boolean {
        const hostname = hostPort.split(':')[0].toLowerCase();
        
        // Automatic bypass list for sensitive authentication domains (compliant architecture)
        const defaultBypasses = [
            'accounts.google.com',
            'oauth2.googleapis.com',
            'myaccount.google.com',
            'ssl.gstatic.com',
            'play.google.com',
            'www.googleapis.com'
        ];

        if (defaultBypasses.some(b => hostname === b || hostname.endsWith('.' + b))) {
            return true;
        }

        // Custom user-defined bypass hosts
        return this.bypassHosts.some(b => hostname === b.toLowerCase() || hostname.endsWith('.' + b.toLowerCase()));
    }

    private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const urlStr = req.url || '';
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(urlStr);
        } catch {
            res.writeHead(400);
            res.end('Invalid URL');
            return;
        }

        const host = parsedUrl.host;
        const bypass = this.shouldBypass(host);

        const headers = { ...req.headers };
        
        // For HTTP/HTTPS upstream, add Proxy-Authorization
        if (!bypass && (this.upstreamType === 'http' || this.upstreamType === 'https') && this.username && this.password) {
            const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
            headers['Proxy-Authorization'] = `Basic ${auth}`;
        }

        // For HTTP traffic via SOCKS, use SocksClient + proper HTTP forwarding
        if (!bypass && (this.upstreamType === 'socks4' || this.upstreamType === 'socks5')) {
            const destHost = parsedUrl.hostname;
            const destPort = parsedUrl.port ? parseInt(parsedUrl.port) : 80;

            const options: SocksClientOptions = {
                proxy: {
                    host: this.upstreamHost,
                    port: this.upstreamPort,
                    type: this.upstreamType === 'socks5' ? 5 : 4,
                    userId: this.username || undefined,
                    password: this.password || undefined
                },
                command: 'connect',
                destination: { host: destHost, port: destPort }
            };

            SocksClient.createConnection(options, (err, info) => {
                if (err || !info) {
                    res.writeHead(502);
                    res.end(`SOCKS Tunnel Error: ${err?.message || 'Unknown'}`);
                    return;
                }

                info.socket.setTimeout(30000, () => {
                    info.socket.destroy();
                    res.socket?.destroy();
                });

                // Build and forward the HTTP request over the SOCKS socket
                const reqLine = `${req.method} ${parsedUrl.pathname}${parsedUrl.search} HTTP/1.1\r\n`;
                const headerLines = Object.entries(headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\r\n');
                info.socket.write(reqLine + headerLines + '\r\n\r\n');

                // Stream body from client -> upstream
                req.pipe(info.socket, { end: false });

                // Stream response from upstream -> client via proper HTTP response
                // We need to parse the raw HTTP response header to call res.writeHead correctly
                let headersParsed = false;
                let rawHeader = '';
                info.socket.on('data', (chunk: Buffer) => {
                    if (!headersParsed) {
                        rawHeader += chunk.toString('binary');
                        const sep = rawHeader.indexOf('\r\n\r\n');
                        if (sep !== -1) {
                            headersParsed = true;
                            const headerPart = rawHeader.substring(0, sep);
                            const bodyStart = rawHeader.substring(sep + 4);
                            const lines = headerPart.split('\r\n');
                            const statusLine = lines[0].match(/HTTP\/\d\.\d\s+(\d+)\s+(.*)/);
                            const statusCode = statusLine ? parseInt(statusLine[1]) : 200;
                            const resHeaders: Record<string, string> = {};
                            for (let i = 1; i < lines.length; i++) {
                                const idx = lines[i].indexOf(':');
                                if (idx > 0) {
                                    resHeaders[lines[i].substring(0, idx).trim().toLowerCase()] = lines[i].substring(idx + 1).trim();
                                }
                            }
                            res.writeHead(statusCode, resHeaders);
                            if (bodyStart.length > 0) {
                                res.write(Buffer.from(bodyStart, 'binary'));
                            }
                        }
                    } else {
                        res.write(chunk);
                    }
                });

                info.socket.on('end', () => res.end());
                info.socket.on('error', () => { if (!res.headersSent) { res.writeHead(502); } res.end(); });
            });
            return;
        }

        // Standard HTTP Forward (HTTP/HTTPS upstream)
        const proxyHeaders = { ...headers };
        if (this.username && this.password) {
            const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
            proxyHeaders['Proxy-Authorization'] = `Basic ${auth}`;
        }
        const options = {
            hostname: bypass ? parsedUrl.hostname : this.upstreamHost,
            port: bypass ? (parsedUrl.port ? parseInt(parsedUrl.port) : 80) : this.upstreamPort,
            path: bypass ? parsedUrl.pathname + parsedUrl.search : urlStr,
            method: req.method,
            headers: bypass ? headers : proxyHeaders,
            timeout: 30000,
        };

        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            res.writeHead(502);
            res.end(`Proxy Tunnel Error: ${err.message}`);
        });

        req.pipe(proxyReq);
    }

    private handleConnect(req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer) {
        const hostPort = req.url || '';
        const parts = hostPort.split(':');
        const host = parts[0];
        const port = parts[1] ? parseInt(parts[1]) : 443;

        const bypass = this.shouldBypass(hostPort);

        if (bypass) {
            const serverSocket = net.connect(port, host);
            serverSocket.setTimeout(30000, () => { serverSocket.destroy(); clientSocket.destroy(); });
            serverSocket.on('connect', () => {
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                serverSocket.write(head);
                serverSocket.pipe(clientSocket);
                clientSocket.pipe(serverSocket);
            });
            this.handleSocketErrors(clientSocket, serverSocket);
            return;
        } 
        
        if (this.upstreamType === 'socks4' || this.upstreamType === 'socks5') {
            const options: SocksClientOptions = {
                proxy: {
                    host: this.upstreamHost,
                    port: this.upstreamPort,
                    type: this.upstreamType === 'socks5' ? 5 : 4,
                    userId: this.username || undefined,
                    password: this.password || undefined
                },
                command: 'connect',
                destination: {
                    host: host,
                    port: port
                }
            };

            SocksClient.createConnection(options, (err, info) => {
                if (err || !info) {
                    clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\nProxy-Connection: close\r\n\r\n`);
                    clientSocket.end(`SOCKS Connect Failed`);
                    return;
                }
                info.socket.setTimeout(30000, () => { info.socket.destroy(); clientSocket.destroy(); });
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                info.socket.write(head);
                info.socket.pipe(clientSocket);
                clientSocket.pipe(info.socket);
                
                this.handleSocketErrors(clientSocket, info.socket);
            });
        } else {
            // HTTP / HTTPS Proxy CONNECT
            const serverSocket = net.connect(this.upstreamPort, this.upstreamHost);
            serverSocket.setTimeout(30000, () => { serverSocket.destroy(); clientSocket.destroy(); });
            serverSocket.on('connect', () => {
                let connectHeader = `CONNECT ${hostPort} HTTP/1.1\r\nHost: ${hostPort}\r\n`;
                if (this.username && this.password) {
                    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
                    connectHeader += `Proxy-Authorization: Basic ${auth}\r\n`;
                }
                connectHeader += '\r\n';
                serverSocket.write(connectHeader);

                serverSocket.once('data', (data) => {
                    const responseStr = data.toString();
                    // Strict check: HTTP 200 response
                    if (/^HTTP\/\d\.\d\s+200\b/.test(responseStr)) {
                        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                        const delimiter = '\r\n\r\n';
                        const index = data.indexOf(delimiter);
                        if (index !== -1) {
                            const remaining = data.subarray(index + delimiter.length);
                            if (remaining.length > 0) clientSocket.write(remaining);
                        }
                        serverSocket.pipe(clientSocket);
                        clientSocket.pipe(serverSocket);
                    } else {
                        clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\nProxy-Connection: close\r\n\r\n`);
                        clientSocket.end(`Proxy Connect Failed`);
                        serverSocket.destroy();
                    }
                });
            });
            this.handleSocketErrors(clientSocket, serverSocket);
        }
    }

    private handleSocketErrors(clientSocket: net.Socket, serverSocket: net.Socket) {
        serverSocket.on('error', () => {
            clientSocket.end();
            clientSocket.destroy();
        });

        clientSocket.on('error', () => {
            serverSocket.destroy();
        });
    }
}

// Active tunnels registry map
const activeTunnels = new Map<string, ProxyTunnel>();

/**
 * Start a local loopback tunnel proxy for the given profile if proxy details exist.
 * Returns the localhost port.
 */
export async function startProxyTunnel(
    profileId: string,
    upstreamType: string,
    upstreamHost: string,
    upstreamPort: number,
    username?: string,
    password?: string,
    bypassList: string[] = []
): Promise<number> {
    // Close existing if any
    await stopProxyTunnel(profileId);

    const tunnel = new ProxyTunnel(upstreamType, upstreamHost, upstreamPort, username, password, bypassList);
    const localPort = await tunnel.start();
    activeTunnels.set(profileId, tunnel);
    
    console.log(`[ProxyTunnel] Local forwarder started for ${profileId} on port ${localPort} (Type: ${upstreamType})`);
    return localPort;
}

/**
 * Stop the local loopback tunnel proxy for the given profile.
 */
export async function stopProxyTunnel(profileId: string): Promise<boolean> {
    const tunnel = activeTunnels.get(profileId);
    if (tunnel) {
        tunnel.close();
        activeTunnels.delete(profileId);
        return true;
    }
    return false;
}
