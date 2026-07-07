import http from 'http';
import net from 'net';

export class ProxyTunnel {
    private server: http.Server;
    private port: number = 0;

    constructor(
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
        
        if (!bypass && this.username && this.password) {
            const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
            headers['Proxy-Authorization'] = `Basic ${auth}`;
        }

        const options = {
            hostname: bypass ? parsedUrl.hostname : this.upstreamHost,
            port: bypass ? (parsedUrl.port ? parseInt(parsedUrl.port) : 80) : this.upstreamPort,
            path: bypass ? parsedUrl.pathname + parsedUrl.search : urlStr,
            method: req.method,
            headers: headers
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

        let serverSocket: net.Socket;

        if (bypass) {
            serverSocket = net.connect(port, host, () => {
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                serverSocket.write(head);
                serverSocket.pipe(clientSocket);
                clientSocket.pipe(serverSocket);
            });
        } else {
            serverSocket = net.connect(this.upstreamPort, this.upstreamHost, () => {
                let connectHeader = `CONNECT ${hostPort} HTTP/1.1\r\nHost: ${hostPort}\r\n`;
                if (this.username && this.password) {
                    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
                    connectHeader += `Proxy-Authorization: Basic ${auth}\r\n`;
                }
                connectHeader += '\r\n';
                serverSocket.write(connectHeader);
                
                serverSocket.once('data', (data) => {
                    const responseStr = data.toString();
                    if (responseStr.includes('200')) {
                        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                        const delimiter = '\r\n\r\n';
                        const index = data.indexOf(delimiter);
                        if (index !== -1) {
                            const remaining = data.subarray(index + delimiter.length);
                            if (remaining.length > 0) {
                                clientSocket.write(remaining);
                            }
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
        }

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
    upstreamHost: string,
    upstreamPort: number,
    username?: string,
    password?: string,
    bypassList: string[] = []
): Promise<number> {
    // Close existing if any
    await stopProxyTunnel(profileId);

    const tunnel = new ProxyTunnel(upstreamHost, upstreamPort, username, password, bypassList);
    const localPort = await tunnel.start();
    activeTunnels.set(profileId, tunnel);
    
    console.log(`[ProxyTunnel] Local forwarder started for ${profileId} on port ${localPort}`);
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
