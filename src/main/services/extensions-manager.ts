import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface ExtensionInfo {
    id: string;
    name: string;
    description: string;
    version: string;
    path: string;
}

function getExtensionsDir(): string {
    const dir = path.join(app.getPath('userData'), 'extensions');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function listExtensions(): ExtensionInfo[] {
    const dir = getExtensionsDir();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const result: ExtensionInfo[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const extPath = path.join(dir, entry.name);
        const manifestPath = path.join(extPath, 'manifest.json');
        if (!fs.existsSync(manifestPath)) continue;

        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            result.push({
                id: entry.name,
                name: manifest.name || entry.name,
                description: manifest.description || '',
                version: manifest.version || '?',
                path: extPath,
            });
        } catch {
            // skip malformed extensions
        }
    }
    return result;
}

export function installExtension(sourcePath: string): ExtensionInfo {
    const manifestPath = path.join(sourcePath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error('A pasta selecionada não contém um manifest.json válido. Selecione uma extensão desempacotada.');
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const safeName = (manifest.name || 'extension').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const id = `${safeName}_${Date.now()}`;
    const destPath = path.join(getExtensionsDir(), id);

    fs.cpSync(sourcePath, destPath, { recursive: true });

    return {
        id,
        name: manifest.name || id,
        description: manifest.description || '',
        version: manifest.version || '?',
        path: destPath,
    };
}

export function deleteExtension(extensionId: string): void {
    const extPath = path.join(getExtensionsDir(), extensionId);
    if (fs.existsSync(extPath)) {
        fs.rmSync(extPath, { recursive: true, force: true });
    }
}

export function getExtensionPaths(): string[] {
    return listExtensions().map(e => e.path);
}
