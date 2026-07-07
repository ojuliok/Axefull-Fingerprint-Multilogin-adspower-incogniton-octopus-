import { safeStorage, app } from 'electron';
import * as keytar from 'keytar';
import fs from 'fs';
import path from 'path';

const SERVICE = 'AxefullProfiles';

function getFallbackStoragePath(): string {
    const userData = app.getPath('userData');
    const secureDir = path.join(userData, 'secure_storage');
    if (!fs.existsSync(secureDir)) {
        fs.mkdirSync(secureDir, { recursive: true });
    }
    return path.join(secureDir, 'secrets.json');
}

function readFallbackSecrets(): Record<string, string> {
    const file = getFallbackStoragePath();
    if (!fs.existsSync(file)) return {};
    try {
        const raw = fs.readFileSync(file, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function writeFallbackSecrets(secrets: Record<string, string>): void {
    const file = getFallbackStoragePath();
    fs.writeFileSync(file, JSON.stringify(secrets, null, 2), 'utf8');
}

/**
 * Encrypt and store a secret (e.g. access tokens or credentials) securely.
 */
export async function setSecret(account: string, secret: string): Promise<void> {
    try {
        await keytar.setPassword(SERVICE, account, secret);
    } catch (err) {
        console.warn('[Keychain] Keytar setPassword failed, falling back to Electron safeStorage:', err);
        const secrets = readFallbackSecrets();
        if (safeStorage.isEncryptionAvailable()) {
            const encrypted = safeStorage.encryptString(secret).toString('base64');
            secrets[account] = encrypted;
            writeFallbackSecrets(secrets);
        } else {
            // Unencrypted fallback for Linux or test environments where keyrings are unavailable
            secrets[account] = Buffer.from(secret).toString('base64');
            writeFallbackSecrets(secrets);
        }
    }
}

/**
 * Retrieve a stored secret.
 */
export async function getSecret(account: string): Promise<string | null> {
    try {
        const secret = await keytar.getPassword(SERVICE, account);
        if (secret !== null) return secret;
    } catch (err) {
        console.warn('[Keychain] Keytar getPassword failed, falling back to Electron safeStorage:', err);
    }

    const secrets = readFallbackSecrets();
    const encrypted = secrets[account];
    if (!encrypted) return null;

    try {
        if (safeStorage.isEncryptionAvailable()) {
            const buffer = Buffer.from(encrypted, 'base64');
            return safeStorage.decryptString(buffer);
        } else {
            return Buffer.from(encrypted, 'base64').toString('utf8');
        }
    } catch (err) {
        console.error('[Keychain] Decryption fallback failed:', err);
        return null;
    }
}

/**
 * Delete a stored secret.
 */
export async function deleteSecret(account: string): Promise<boolean> {
    let keytarDeleted = false;
    try {
        keytarDeleted = await keytar.deletePassword(SERVICE, account);
    } catch (err) {
        console.warn('[Keychain] Keytar deletePassword failed:', err);
    }

    const secrets = readFallbackSecrets();
    if (account in secrets) {
        delete secrets[account];
        writeFallbackSecrets(secrets);
        return true;
    }

    return keytarDeleted;
}
