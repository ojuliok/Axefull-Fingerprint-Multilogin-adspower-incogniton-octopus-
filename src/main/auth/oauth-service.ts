import { shell } from 'electron';
import http from 'http';
import crypto from 'crypto';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';
import { setSecret, deleteSecret } from '../security/keychain';

export interface OAuthConfig {
    clientId: string;
    authEndpoint: string;
    tokenEndpoint: string;
    scopes: string[];
}

const GOOGLE_OAUTH_CONFIG: OAuthConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id.apps.googleusercontent.com',
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    scopes: ['openid', 'email', 'profile']
};

export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
    token_type: string;
}

let activeHttpServer: http.Server | null = null;

function findFreePort(): Promise<number> {
    const net = require('net');
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const port = (server.address() as any).port;
            server.close(() => resolve(port));
        });
    });
}

async function exchangeCodeForTokens(code: string, redirectUri: string, verifier: string): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.set('client_id', GOOGLE_OAUTH_CONFIG.clientId);
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', redirectUri);
    params.set('code_verifier', verifier);

    const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${errorText}`);
    }

    return await response.json() as TokenResponse;
}

/**
 * Start the Google OAuth PKCE flow using the system's default web browser.
 * Opens a local loopback server to safely catch the authorization redirect.
 */
export async function startGoogleLogin(profileId: string): Promise<TokenResponse> {
    return new Promise(async (resolve, reject) => {
        if (activeHttpServer) {
            activeHttpServer.close();
            activeHttpServer = null;
        }

        try {
            const verifier = generateCodeVerifier();
            const challenge = generateCodeChallenge(verifier);
            const state = crypto.randomUUID();

            const port = await findFreePort();
            const redirectUri = `http://localhost:${port}`;

            const url = new URL(GOOGLE_OAUTH_CONFIG.authEndpoint);
            url.searchParams.set('client_id', GOOGLE_OAUTH_CONFIG.clientId);
            url.searchParams.set('redirect_uri', redirectUri);
            url.searchParams.set('response_type', 'code');
            url.searchParams.set('scope', GOOGLE_OAUTH_CONFIG.scopes.join(' '));
            url.searchParams.set('code_challenge', challenge);
            url.searchParams.set('code_challenge_method', 'S256');
            url.searchParams.set('state', state);

            const server = http.createServer(async (req, res) => {
                const reqUrl = new URL(req.url || '', `http://${req.headers.host}`);
                const code = reqUrl.searchParams.get('code');
                const reqState = reqUrl.searchParams.get('state');

                if (reqState !== state) {
                    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('<h3>Security Error: State mismatch! Authorization aborted.</h3>');
                    server.close();
                    reject(new Error('CSRF Warning: State mismatch during OAuth.'));
                    return;
                }

                if (!code) {
                    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('<h3>Authentication Error: Authorization code not received.</h3>');
                    server.close();
                    reject(new Error('Authorization code not returned.'));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h3>Success! Axefull authenticated. You may close this tab and return to the application.</h3>');
                server.close();
                activeHttpServer = null;

                try {
                    const tokens = await exchangeCodeForTokens(code, redirectUri, verifier);
                    
                    // Save tokens securely in system keychain
                    await setSecret(`profile_${profileId}_access_token`, tokens.access_token);
                    if (tokens.refresh_token) {
                        await setSecret(`profile_${profileId}_refresh_token`, tokens.refresh_token);
                    }
                    
                    try {
                        const { logSecurityEvent } = require('../database/db');
                        logSecurityEvent('OAUTH_LOGIN_SUCCESS', `OAuth linked for profile ${profileId}`, 'INFO');
                    } catch {}
                    
                    resolve(tokens);
                } catch (exchangeErr) {
                    try {
                        const { logSecurityEvent } = require('../database/db');
                        logSecurityEvent('OAUTH_LOGIN_FAILURE', `Token exchange failed for profile ${profileId}`, 'ERROR');
                    } catch {}
                    reject(exchangeErr);
                }
            });

            server.listen(port, () => {
                console.log(`[OAuthService] Temporary loopback listening on http://localhost:${port}`);
                shell.openExternal(url.toString());
            });

            activeHttpServer = server;
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Remove stored OAuth credentials for a profile.
 */
export async function unlinkGoogleAccount(profileId: string): Promise<void> {
    await deleteSecret(`profile_${profileId}_access_token`);
    await deleteSecret(`profile_${profileId}_refresh_token`);
}
