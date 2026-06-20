const fs = require('fs');

let code = fs.readFileSync('src/preload/index.ts', 'utf8');

if (!code.includes("exportZip: (profileId, destPath)")) {
    code = code.replace(
        "export: (profileIds: string[]) => ipcRenderer.invoke('profile:export', profileIds),",
        "export: (profileIds: string[]) => ipcRenderer.invoke('profile:export', profileIds),\n        exportZip: (profileId: string, destPath: string) => ipcRenderer.invoke('profile:export-zip', profileId, destPath),\n        importZip: (sourcePath: string) => ipcRenderer.invoke('profile:import-zip', sourcePath),"
    );
    fs.writeFileSync('src/preload/index.ts', code);
    console.log("Exposed exportZip and importZip in preload.");
} else {
    console.log("Already exposed.");
}
