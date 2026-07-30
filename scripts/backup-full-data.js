const fs = require('fs');
const path = require('path');

/**
 * Script de Backup Completo e Leve de Dados, Contas e Perfis
 * Filtra diretórios de cache temporário (GPUCache, Code Cache, DawnCache, etc.) para garantir rapidez e economizar espaço.
 */

const EXCLUDED_CACHE_DIRS = new Set([
    'Cache',
    'Code Cache',
    'GPUCache',
    'GraphiteDawnCache',
    'Crashpad',
    'ShaderCache',
    'DawnCache',
    'Media Cache'
]);

function runFullBackup() {
    console.log('🔄 Iniciando rotina de backup essencial de dados e contas...');

    const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : path.join(process.env.HOME, '.config'));
    
    const possibleAppDirs = [
        path.join(appData, 'Axe Agent'),
        path.join(appData, 'axefull-fingerprint')
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const projectBackupDir = path.join(__dirname, '..', 'backups', `snapshot_${timestamp}`);

    if (!fs.existsSync(projectBackupDir)) {
        fs.mkdirSync(projectBackupDir, { recursive: true });
    }

    let backedUpAny = false;

    for (const appDir of possibleAppDirs) {
        if (!fs.existsSync(appDir)) continue;

        console.log(`📌 Encontrado diretório de dados: ${appDir}`);
        const targetDirName = path.basename(appDir).replace(/\s+/g, '_');
        const targetBackupSubdir = path.join(projectBackupDir, targetDirName);
        fs.mkdirSync(targetBackupSubdir, { recursive: true });

        // 1. Backup do Banco de Dados SQLite
        const dbPath = path.join(appDir, 'database', 'profiles.db');
        if (fs.existsSync(dbPath)) {
            const dbBackupTarget = path.join(targetBackupSubdir, 'profiles.db');
            fs.copyFileSync(dbPath, dbBackupTarget);
            console.log(`  ✅ Banco de dados 'profiles.db' salvo em: ${dbBackupTarget}`);
            backedUpAny = true;
        }

        // 2. Backup das Configurações
        const configPath = path.join(appDir, 'config.json');
        if (fs.existsSync(configPath)) {
            const configBackupTarget = path.join(targetBackupSubdir, 'config.json');
            fs.copyFileSync(configPath, configBackupTarget);
            console.log(`  ✅ Configurações 'config.json' salvas.`);
            backedUpAny = true;
        }

        // 3. Backup dos Perfis de Navegador (Essencial: Cookies, LocalStorage, Preferences, Sessions)
        const browserDataDir = path.join(appDir, 'browser_data');
        if (fs.existsSync(browserDataDir)) {
            const browserDataBackupTarget = path.join(targetBackupSubdir, 'browser_data');
            copyEssentialRecursiveSync(browserDataDir, browserDataBackupTarget);
            console.log(`  ✅ Sessões e contas dos perfis 'browser_data' salvas.`);
            backedUpAny = true;
        }
    }

    // 4. Backup do arquivo .env
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envBackupTarget = path.join(projectBackupDir, '.env.backup');
        fs.copyFileSync(envPath, envBackupTarget);
        console.log(`  ✅ Arquivo de ambiente '.env' salvo.`);
        backedUpAny = true;
    }

    if (backedUpAny) {
        console.log(`\n🎉 Backup Completo e Essencial concluído com SUCESSO!\n👉 Diretório: ${projectBackupDir}\n`);
    } else {
        console.log(`⚠️ Nenhum diretório de dados em execução foi encontrado em %APPDATA%.`);
    }
}

function copyEssentialRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        const baseName = path.basename(src);
        if (EXCLUDED_CACHE_DIRS.has(baseName)) {
            return; // Pulando pastas de cache redundantes
        }

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyEssentialRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else if (exists) {
        try {
            fs.copyFileSync(src, dest);
        } catch (err) {
            // Ignorar falhas de cópia pontuais de arquivos temporários bloqueados
        }
    }
}

runFullBackup();
