const fs = require('fs');
const path = require('path');

// No Windows, o caminho userData do app geralmente fica em %APPDATA%\Axe Agent
const appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const dbPath = path.join(appData, 'Axe Agent', 'database', 'profiles.db');

if (fs.existsSync(dbPath)) {
    const backupPath = path.join(__dirname, 'profiles_backup_' + Date.now() + '.db');
    fs.copyFileSync(dbPath, backupPath);
    console.log('✅ Backup criado com sucesso em: ' + backupPath);
} else {
    console.log('❌ Banco de dados não encontrado em: ' + dbPath);
    console.log('Certifique-se de que o aplicativo já foi aberto pelo menos uma vez.');
}
