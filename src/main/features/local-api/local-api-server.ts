import http from 'http';
import { app } from 'electron';
import {
    getAllProfiles,
    getProfileById,
    updateProfileProxy,
} from '../profile/profile-manager';
import {
    launchProfile,
    closeProfile,
    isProfileActive,
    getProfileCdpUrl,
} from '../browser/browser-engine';

export const LOCAL_API_PORT = 54345;

let server: http.Server | null = null;

function json(res: http.ServerResponse, status: number, data: unknown) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(body);
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const method = req.method ?? 'GET';
    const url = req.url ?? '/';

    // CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
        res.end();
        return;
    }

    try {
        // GET /
        if (method === 'GET' && url === '/') {
            return json(res, 200, {
                name: 'Axe MultiLogin Local API',
                version: app.getVersion(),
                port: LOCAL_API_PORT,
                docs: 'http://localhost:' + LOCAL_API_PORT + '/profiles',
            });
        }

        // GET /profiles
        if (method === 'GET' && url === '/profiles') {
            const profiles = getAllProfiles();
            return json(res, 200, { success: true, data: profiles });
        }

        // Match /profiles/:id[/action]
        const profileMatch = url.match(/^\/profiles\/([^/]+)(\/.*)?$/);
        if (profileMatch) {
            const profileId = profileMatch[1];
            const action = profileMatch[2] ?? '';
            let profile = getProfileById(profileId);

            if (!profile) {
                return json(res, 404, { success: false, error: 'Profile not found' });
            }

            if (!profile) {
                return json(res, 404, { success: false, error: 'Profile not found' });
            }

            // GET /profiles/:id
            if (method === 'GET' && action === '') {
                return json(res, 200, { success: true, data: profile });
            }

            // GET /profiles/:id/status
            if (method === 'GET' && action === '/status') {
                const active = isProfileActive(profileId);
                return json(res, 200, { success: true, data: { active } });
            }

            // GET /profiles/:id/cdp-url
            if (method === 'GET' && action === '/cdp-url') {
                const cdpUrl = getProfileCdpUrl(profileId);
                if (!cdpUrl) {
                    return json(res, 404, { success: false, error: 'Profile is not running' });
                }
                return json(res, 200, { success: true, data: { cdpUrl } });
            }

            // POST /profiles/:id/start
            if (method === 'POST' && action === '/start') {
                try {
                    await launchProfile(profileId);
                } catch (err) {
                    return json(res, 500, { success: false, error: (err as Error).message ?? 'Failed to launch' });
                }
                const cdpUrl = getProfileCdpUrl(profileId);
                return json(res, 200, { success: true, data: { cdpUrl, wsEndpoint: cdpUrl } });
            }

            // POST /profiles/:id/stop
            if (method === 'POST' && action === '/stop') {
                await closeProfile(profileId);
                return json(res, 200, { success: true });
            }

            // POST /profiles/:id/proxy
            if (method === 'POST' && action === '/proxy') {
                const body = await readBody(req) as Record<string, unknown>;
                await updateProfileProxy(profileId, body as any);
                return json(res, 200, { success: true });
            }

            // DELETE /profiles/:id/proxy
            if (method === 'DELETE' && action === '/proxy') {
                await updateProfileProxy(profileId, null);
                return json(res, 200, { success: true });
            }
        }

        return json(res, 404, { success: false, error: 'Route not found' });
    } catch (err) {
        console.error('[LocalAPI] Error:', err);
        return json(res, 500, { success: false, error: String(err) });
    }
}

export function startLocalApiServer(): void {
    server = http.createServer(handleRequest);
    server.listen(LOCAL_API_PORT, '127.0.0.1', () => {
        console.log(`[LocalAPI] Running at http://127.0.0.1:${LOCAL_API_PORT}`);
    });
    server.on('error', (err) => {
        console.error('[LocalAPI] Server error:', err);
    });
}

export function stopLocalApiServer(): void {
    if (server) {
        server.close();
        server = null;
    }
}
