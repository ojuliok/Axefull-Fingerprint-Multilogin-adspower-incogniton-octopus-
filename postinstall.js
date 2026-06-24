const { execSync } = require('child_process');

if (process.env.VERCEL === '1' || process.env.NETLIFY === '1' || process.env.CI === 'true') {
  console.log('Vercel or CI environment detected. Bypassing electron-builder install-app-deps.');
} else {
  console.log('Local environment detected. Running electron-builder install-app-deps...');
  try {
    execSync('electron-builder install-app-deps', { stdio: 'inherit' });
  } catch (err) {
    console.error('postinstall failed, continuing anyway:', err.message);
  }
}
