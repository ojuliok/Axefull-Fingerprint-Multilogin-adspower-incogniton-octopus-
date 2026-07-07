import crypto from 'crypto';

/**
 * Generate a random high-entropy PKCE code verifier (RFC 7636).
 */
export function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
}

/**
 * Calculate the PKCE S256 code challenge for a given verifier.
 */
export function generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
}
