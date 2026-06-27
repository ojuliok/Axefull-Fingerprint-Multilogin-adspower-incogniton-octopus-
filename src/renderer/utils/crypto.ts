// Helper to convert Uint8Array to Base64
function uint8ArrayToBase64(arr: Uint8Array): string {
    return btoa(Array.from(arr).map(c => String.fromCharCode(c)).join(''));
}

// Helper to convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
}

// Derive CryptoKey from password and salt using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import raw password as key material
    const baseKey = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    // Derive AES-GCM key from PBKDF2 key material
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as any,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a plaintext string using a password.
 * Outputs a Base64-encoded string combining salt, IV, and ciphertext.
 */
export async function encryptData(data: string, password: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // Generate random salt and initialization vector (IV)
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const key = await deriveKey(password, salt);
        
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            dataBuffer
        );
        
        // Combine salt (16 bytes) + iv (12 bytes) + ciphertext
        const encryptedBytes = new Uint8Array(encryptedBuffer);
        const combined = new Uint8Array(salt.length + iv.length + encryptedBytes.byteLength);
        
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(encryptedBytes, salt.length + iv.length);
        
        return uint8ArrayToBase64(combined);
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Falha ao criptografar dados.');
    }
}

/**
 * Decrypts a combined Base64-encoded ciphertext using a password.
 * Outputs the original plaintext string.
 */
export async function decryptData(encryptedBase64: string, password: string): Promise<string> {
    try {
        const combined = base64ToUint8Array(encryptedBase64);
        
        // Extract salt, iv, and ciphertext
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const ciphertext = combined.slice(28);
        
        const key = await deriveKey(password, salt);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            ciphertext
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Senha incorreta ou dados corrompidos.');
    }
}
