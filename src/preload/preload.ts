import { contextBridge, ipcRenderer } from 'electron';

// Types for the exposed API
export interface ProfileAPI {
    create: (input: { name: string; notes?: string; platform?: string; tags?: string; proxy?: ProxyInput }) => Promise<APIResponse>;
    list: () => Promise<APIResponse>;
    get: (id: string) => Promise<APIResponse>;
    update: (id: string, input: { name?: string; notes?: string | null; status?: string; tags?: string | null; category?: string | null; folder_id?: string | null }) => Promise<APIResponse>;
    updateStatus: (id: string, status: string) => Promise<APIResponse>;
    updateProxy: (profileId: string, proxy: ProxyInput | null) => Promise<APIResponse>;
    regenerateFingerprint: (profileId: string, platform?: string) => Promise<APIResponse>;
    delete: (id: string) => Promise<APIResponse>;
    listFolders: () => Promise<APIResponse>;
    createFolder: (name: string) => Promise<APIResponse>;
    updateFolder: (id: string, name: string) => Promise<APIResponse>;
    deleteFolder: (id: string) => Promise<APIResponse>;
    clone: (profileId: string) => Promise<APIResponse>;
    bulkClone: (profileIds: string[]) => Promise<APIResponse>;
    bulkRegenerateFingerprint: (profileIds: string[]) => Promise<APIResponse>;
    export: (profileIds: string[]) => Promise<APIResponse>;
    import: () => Promise<APIResponse>;
    emptyTrash: () => Promise<APIResponse>;
}

export interface ProxyTestResult {
    ok: boolean;
    ip?: string;
    latency?: number;
    error?: string;
}

export interface BrowserAPI {
    launch: (profileId: string) => Promise<APIResponse>;
    close: (profileId: string) => Promise<APIResponse>;
    isActive: (profileId: string) => Promise<APIResponse>;
    newTab: (profileId: string, url?: string) => Promise<APIResponse>;
    pageCount: (profileId: string) => Promise<APIResponse>;
    closeAll: () => Promise<APIResponse>;
    onProfileClosed: (callback: (profileId: string) => void) => () => void;
    testProxy: (proxy: ProxyInput) => Promise<APIResponse>;
    cdpUrl: (profileId: string) => Promise<APIResponse>;
}

export interface ExtensionInfo {
    id: string;
    name: string;
    description: string;
    version: string;
    path: string;
}

export interface ExtensionsAPI {
    list: () => Promise<APIResponse>;
    install: () => Promise<APIResponse>;
    delete: (extensionId: string) => Promise<APIResponse>;
}

export interface ProxyInput {
    type: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: number;
    username?: string;
    password?: string;
}

export interface APIResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

export interface MetaCleanField {
    key: string;
    label: string;
    value: string;
    removable: boolean;
}

export interface MetaCleanHistoryEntry {
    id: string;
    fileName: string;
    fileType: string;
    processedAt: string;
    outputPath: string;
    metadataRemoved: number;
}

export interface MetaCleanAPI {
    openDialog: () => Promise<APIResponse>;
    readMetadata: (filePath: string) => Promise<APIResponse>;
    cleanFile: (filePath: string) => Promise<APIResponse>;
    getHistory: () => Promise<APIResponse>;
    clearHistory: () => Promise<APIResponse>;
}

export interface BrowserDataAPI {
    stats: (profileId: string) => Promise<APIResponse>;
    cookies: {
        list: (profileId: string) => Promise<APIResponse>;
        import: (profileId: string, content: string) => Promise<APIResponse>;
        export: (profileId: string) => Promise<APIResponse>;
        clear: (profileId: string) => Promise<APIResponse>;
        openImportDialog: (profileId: string) => Promise<APIResponse>;
        saveExport: (profileId: string) => Promise<APIResponse>;
    };
    history: {
        list: (profileId: string, limit?: number) => Promise<APIResponse>;
        clear: (profileId: string) => Promise<APIResponse>;
    };
    bookmarks: {
        list: (profileId: string) => Promise<APIResponse>;
        add: (profileId: string, name: string, url: string) => Promise<APIResponse>;
        delete: (profileId: string, bookmarkId: string) => Promise<APIResponse>;
        clear: (profileId: string) => Promise<APIResponse>;
    };
    clearAll: (profileId: string, options: { cookies?: boolean; history?: boolean; bookmarks?: boolean; cache?: boolean }) => Promise<APIResponse>;
}

export interface AppInfoData {
    version: string;
    electronVersion: string;
    chromiumVersion: string;
    dataDir: string;
}

export interface AppAPI {
    info: () => Promise<APIResponse>;
    localApiPort: () => Promise<APIResponse>;
    setWebviewProxy: (partitionId: string, proxyUrl: string) => Promise<APIResponse>;
    openNotesWidget: () => Promise<APIResponse>;
    closeNotesWidget: () => Promise<APIResponse>;
}

export interface TemplatesAPI {
    list: () => Promise<APIResponse>;
    save: (profileId: string, name: string, description?: string) => Promise<APIResponse>;
    delete: (id: string) => Promise<APIResponse>;
    createProfile: (templateId: string, name: string) => Promise<APIResponse>;
    bulkCreate: (templateId: string, baseName: string, count: number) => Promise<APIResponse>;
}

export interface ProxyPoolAPI {
    list: () => Promise<APIResponse>;
    add: (input: { label?: string; type: string; host: string; port: number; username?: string; password?: string }) => Promise<APIResponse>;
    bulkImport: (rawText: string) => Promise<APIResponse>;
    remove: (id: string) => Promise<APIResponse>;
    test: (id: string) => Promise<APIResponse>;
    assign: (proxyId: string, profileId: string) => Promise<APIResponse>;
    unassign: (proxyId: string) => Promise<APIResponse>;
}

export interface TeamAPI {
    me: () => Promise<APIResponse>;
    create: (name: string) => Promise<APIResponse>;
    invite: (email: string) => Promise<APIResponse>;
    removeMember: (memberId: string) => Promise<APIResponse>;
    changeRole: (memberId: string, role: string) => Promise<APIResponse>;
    leave: () => Promise<APIResponse>;
}

export interface WarmupProgressEvent {
    profileId: string;
    current: number;
    total: number;
    url: string;
}

export interface WarmupCompleteEvent {
    profileId: string;
    ok: boolean;
    sitesVisited: number;
    error?: string;
}

export interface WarmupAPI {
    start: (profileId: string) => Promise<APIResponse>;
    onProgress: (callback: (data: WarmupProgressEvent) => void) => () => void;
    onComplete: (callback: (data: WarmupCompleteEvent) => void) => () => void;
}

export interface AIAPI {
    predictScore: (profileId: string) => Promise<APIResponse>;
    submitFeedback: (profileId: string, feedback: 'thumbs_up' | 'thumbs_down') => Promise<APIResponse>;
    getAuditLogs: (limit?: number) => Promise<APIResponse>;
}

export interface BulkVideoProgressEvent {
    jobId: string;
    progress: number;
    status: 'pending' | 'processing' | 'done' | 'error';
    outputPath?: string;
    error?: string;
}

export interface BulkEditProgressEvent {
    type: 'started' | 'job-update' | 'completed' | 'error';
    job?: any;
    jobs?: any[];
    error?: string;
}

export interface BulkVideoAPI {
    startRender: (jobs: any[], template: any) => Promise<APIResponse>;
    cancelJob: (jobId: string) => Promise<APIResponse>;
    openOutputFolder: (customOutputDir?: string) => Promise<APIResponse>;
    saveProject: (project: any) => Promise<APIResponse>;
    getProjects: () => Promise<APIResponse>;
    deleteProject: (projectId: string) => Promise<APIResponse>;
    pickFile: (type: 'video' | 'image' | 'audio') => Promise<{ success: boolean; filePath?: string; error?: string }>;
    onProgress: (callback: (data: BulkVideoProgressEvent) => void) => () => void;
    // v2: Folder-based bulk editing
    pickFolder: () => Promise<{ success: boolean; folderPath?: string; error?: string }>;
    scanFolder: (folderPath: string) => Promise<APIResponse>;
    generateThumbnail: (videoPath: string) => Promise<{ success: boolean; thumbnailPath?: string; error?: string }>;
    generateThumbnailsBatch: (videoPaths: string[]) => Promise<APIResponse>;
    getVideoMetadata: (videoPath: string) => Promise<APIResponse>;
    startBulkEdit: (videos: any[], editTemplate: any, customOutputDir?: string) => Promise<APIResponse>;
    onBulkEditProgress: (callback: (data: BulkEditProgressEvent) => void) => () => void;
    cancelBulkEdit: () => Promise<APIResponse>;
    onThumbnailsProgress: (callback: (data: { current: number; total: number; videoPath: string; thumbnailPath?: string }) => void) => () => void;
}

export interface EmailAPI {
    send: (params: { to: string; subject: string; body: string; html?: string }) => Promise<APIResponse>;
}

export interface ElectronAPI {
    auth: AuthAPI;
    profiles: ProfileAPI;
    browser: BrowserAPI;
    browserData: BrowserDataAPI;
    email: EmailAPI;
    license?: LicenseAPI;
    metaClean: MetaCleanAPI;
    extensions: ExtensionsAPI;
    app: AppAPI;
    templates: TemplatesAPI;
    proxyPool: ProxyPoolAPI;
    team: TeamAPI;
    warmup: WarmupAPI;
    ai: AIAPI;
    cards: CardAPI;
    bulkVideo: BulkVideoAPI;
}

export interface CardAPI {
    save: (cardId: string, data: any) => Promise<APIResponse>;
    get: (cardId: string) => Promise<APIResponse>;
}
export interface AuthUser {
    id: string;
    email: string;
    plan: string;
    plan_label: string;
    max_profiles: number;
    is_active: boolean;
}
export interface AuthAPI {
    checkInternet: () => Promise<APIResponse>;
    login: (email: string, password: string) => Promise<APIResponse>;
    register: (email: string, password: string, name?: string) => Promise<APIResponse>;
    validateSession: () => Promise<APIResponse>;
    logout: () => Promise<APIResponse>;
    heartbeat: () => Promise<APIResponse>;
    resetPassword: (email: string) => Promise<APIResponse>;
}

export interface LicenseAPI {
    set: (token: string) => Promise<APIResponse>;
    get: () => Promise<APIResponse>;
    remove: () => Promise<APIResponse>;
    validateOnline: (serverUrl: string) => Promise<APIResponse>;
    issueOnline: (serverUrl: string, userId: string, plan?: string) => Promise<APIResponse>;
    deviceHwid: () => Promise<APIResponse>;
}

// Expose API to renderer
contextBridge.exposeInMainWorld('api', {
    auth: {
        checkInternet: () => ipcRenderer.invoke('auth:check-internet'),
        login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
        register: (email: string, password: string, name?: string) => ipcRenderer.invoke('auth:register', email, password, name),
        validateSession: () => ipcRenderer.invoke('auth:validate-session'),
        logout: () => ipcRenderer.invoke('auth:logout'),
        heartbeat: () => ipcRenderer.invoke('auth:heartbeat'),
        resetPassword: (email: string) => ipcRenderer.invoke('auth:reset-password', email),
    },
    profiles: {
        create: (input: { name: string; notes?: string; platform?: string; proxy?: ProxyInput }) =>
            ipcRenderer.invoke('profile:create', input),
        list: () =>
            ipcRenderer.invoke('profile:list'),
        get: (id: string) =>
            ipcRenderer.invoke('profile:get', id),
        update: (id: string, input: { name?: string; notes?: string; status?: string }) =>
            ipcRenderer.invoke('profile:update', id, input),
        updateStatus: (id: string, status: string) =>
            ipcRenderer.invoke('profile:update-status', id, status),
        updateProxy: (profileId: string, proxy: ProxyInput | null) =>
            ipcRenderer.invoke('profile:update-proxy', profileId, proxy),
        regenerateFingerprint: (profileId: string, platform?: string) =>
            ipcRenderer.invoke('profile:regenerate-fingerprint', profileId, platform),
        delete: (id: string) =>
            ipcRenderer.invoke('profile:delete', id),
        listFolders: () =>
            ipcRenderer.invoke('profile:list-folders'),
        createFolder: (name: string) =>
            ipcRenderer.invoke('profile:create-folder', name),
        updateFolder: (id: string, name: string) =>
            ipcRenderer.invoke('profile:update-folder', id, name),
        deleteFolder: (id: string) =>
            ipcRenderer.invoke('profile:delete-folder', id),
        clone: (profileId: string) =>
            ipcRenderer.invoke('profile:clone', profileId),
        bulkClone: (profileIds: string[]) =>
            ipcRenderer.invoke('profile:bulk-clone', profileIds),
        bulkRegenerateFingerprint: (profileIds: string[]) =>
            ipcRenderer.invoke('profile:bulk-fingerprint', profileIds),
        export: (profileIds: string[]) => ipcRenderer.invoke('profile:export', profileIds),
        exportZip: (profileId: string, destPath: string) => ipcRenderer.invoke('profile:export-zip', profileId, destPath),
        importZip: (sourcePath: string) => ipcRenderer.invoke('profile:import-zip', sourcePath),
        import: () =>
            ipcRenderer.invoke('profile:import'),
        emptyTrash: () =>
            ipcRenderer.invoke('profile:empty-trash'),
    },
    browser: {
        launch: (profileId: string) =>
            ipcRenderer.invoke('browser:launch', profileId),
        close: (profileId: string) =>
            ipcRenderer.invoke('browser:close', profileId),
        isActive: (profileId: string) =>
            ipcRenderer.invoke('browser:is-active', profileId),
        newTab: (profileId: string, url?: string) =>
            ipcRenderer.invoke('browser:new-tab', profileId, url),
        pageCount: (profileId: string) =>
            ipcRenderer.invoke('browser:page-count', profileId),
        closeAll: () =>
            ipcRenderer.invoke('browser:close-all'),
        onProfileClosed: (callback: (profileId: string) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, profileId: string) => callback(profileId);
            ipcRenderer.on('profile:closed', handler);
            return () => ipcRenderer.removeListener('profile:closed', handler);
        },
        testProxy: (proxy: ProxyInput) =>
            ipcRenderer.invoke('proxy:test', proxy),
        cdpUrl: (profileId: string) =>
            ipcRenderer.invoke('browser:cdp-url', profileId),
    },
    browserData: {
        stats: (profileId: string) => ipcRenderer.invoke('data:stats', profileId),
        cookies: {
            list: (profileId: string) => ipcRenderer.invoke('data:cookies:list', profileId),
            import: (profileId: string, content: string) => ipcRenderer.invoke('data:cookies:import', profileId, content),
            export: (profileId: string) => ipcRenderer.invoke('data:cookies:export', profileId),
            clear: (profileId: string) => ipcRenderer.invoke('data:cookies:clear', profileId),
            openImportDialog: (profileId: string) => ipcRenderer.invoke('data:cookies:open-import-dialog', profileId),
            saveExport: (profileId: string) => ipcRenderer.invoke('data:cookies:save-export', profileId),
        },
        history: {
            list: (profileId: string, limit?: number) => ipcRenderer.invoke('data:history:list', profileId, limit),
            clear: (profileId: string) => ipcRenderer.invoke('data:history:clear', profileId),
        },
        bookmarks: {
            list: (profileId: string) => ipcRenderer.invoke('data:bookmarks:list', profileId),
            add: (profileId: string, name: string, url: string) => ipcRenderer.invoke('data:bookmarks:add', profileId, name, url),
            delete: (profileId: string, bookmarkId: string) => ipcRenderer.invoke('data:bookmarks:delete', profileId, bookmarkId),
            clear: (profileId: string) => ipcRenderer.invoke('data:bookmarks:clear', profileId),
        },
        clearAll: (profileId: string, options: { cookies?: boolean; history?: boolean; bookmarks?: boolean; cache?: boolean }) =>
            ipcRenderer.invoke('data:clear-all', profileId, options),
    },
    license: {
        set: (token: string) => ipcRenderer.invoke('license:set', token),
        get: () => ipcRenderer.invoke('license:get'),
        remove: () => ipcRenderer.invoke('license:remove'),
        validateOnline: (serverUrl: string) => ipcRenderer.invoke('license:validate-online', serverUrl),
        issueOnline: (serverUrl: string, userId: string, plan?: string) => ipcRenderer.invoke('license:issue-online', serverUrl, userId, plan),
        deviceHwid: () => ipcRenderer.invoke('license:device-hwid'),
    },
    metaClean: {
        openDialog: () => ipcRenderer.invoke('metaclean:open-dialog'),
        readMetadata: (filePath: string) => ipcRenderer.invoke('metaclean:read-metadata', filePath),
        cleanFile: (filePath: string) => ipcRenderer.invoke('metaclean:clean-file', filePath),
        getHistory: () => ipcRenderer.invoke('metaclean:get-history'),
        clearHistory: () => ipcRenderer.invoke('metaclean:clear-history'),
    },
    extensions: {
        list: () => ipcRenderer.invoke('extensions:list'),
        install: () => ipcRenderer.invoke('extensions:install'),
        delete: (extensionId: string) => ipcRenderer.invoke('extensions:delete', extensionId),
    },
    app: {
        info: () => ipcRenderer.invoke('app:info'),
        localApiPort: () => ipcRenderer.invoke('app:local-api-port'),
        setWebviewProxy: (partitionId: string, proxyUrl: string) => ipcRenderer.invoke('app:set-webview-proxy', partitionId, proxyUrl),
        openNotesWidget: () => ipcRenderer.invoke('app:open-notes-widget'),
        closeNotesWidget: () => ipcRenderer.invoke('app:close-notes-widget'),
    },
    templates: {
        list: () => ipcRenderer.invoke('template:list'),
        save: (profileId: string, name: string, description?: string) => ipcRenderer.invoke('template:save', profileId, name, description),
        delete: (id: string) => ipcRenderer.invoke('template:delete', id),
        createProfile: (templateId: string, name: string) => ipcRenderer.invoke('template:create-profile', templateId, name),
        bulkCreate: (templateId: string, baseName: string, count: number) => ipcRenderer.invoke('template:bulk-create', templateId, baseName, count),
    },
    proxyPool: {
        list: () => ipcRenderer.invoke('proxy-pool:list'),
        add: (input: any) => ipcRenderer.invoke('proxy-pool:add', input),
        bulkImport: (rawText: string) => ipcRenderer.invoke('proxy-pool:bulk-import', rawText),
        remove: (id: string) => ipcRenderer.invoke('proxy-pool:remove', id),
        test: (id: string) => ipcRenderer.invoke('proxy-pool:test', id),
        assign: (proxyId: string, profileId: string) => ipcRenderer.invoke('proxy-pool:assign', proxyId, profileId),
        unassign: (proxyId: string) => ipcRenderer.invoke('proxy-pool:unassign', proxyId),
    },
    team: {
        me: () => ipcRenderer.invoke('team:me'),
        create: (name: string) => ipcRenderer.invoke('team:create', name),
        invite: (email: string) => ipcRenderer.invoke('team:invite', email),
        removeMember: (memberId: string) => ipcRenderer.invoke('team:remove-member', memberId),
        changeRole: (memberId: string, role: string) => ipcRenderer.invoke('team:change-role', memberId, role),
        leave: () => ipcRenderer.invoke('team:leave'),
    },
    warmup: {
        start: (profileId: string) =>
            ipcRenderer.invoke('profile:warmup-start', profileId),
        onProgress: (callback: (data: WarmupProgressEvent) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, data: WarmupProgressEvent) => callback(data);
            ipcRenderer.on('profile:warmup-progress', handler);
            return () => ipcRenderer.removeListener('profile:warmup-progress', handler);
        },
        onComplete: (callback: (data: WarmupCompleteEvent) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, data: WarmupCompleteEvent) => callback(data);
            ipcRenderer.on('profile:warmup-complete', handler);
            return () => ipcRenderer.removeListener('profile:warmup-complete', handler);
        },
    },
    ai: {
        predictScore: (profileId: string) => ipcRenderer.invoke('ai:predict-score', profileId),
        submitFeedback: (profileId: string, feedback: 'thumbs_up' | 'thumbs_down') => ipcRenderer.invoke('ai:submit-feedback', profileId, feedback),
        getAuditLogs: (limit?: number) => ipcRenderer.invoke('ai:get-audit-logs', limit),
    },
    cards: {
        save: (cardId: string, data: any) => ipcRenderer.invoke('cards:save', cardId, data),
        get: (cardId: string) => ipcRenderer.invoke('cards:get', cardId),
    },
    email: {
        send: (params: any) => ipcRenderer.invoke('email:send', params),
    },
    bulkVideo: {
        startRender: (jobs: any[], template: any) => ipcRenderer.invoke('bulk-video:start-render', jobs, template),
        cancelJob: (jobId: string) => ipcRenderer.invoke('bulk-video:cancel-job', jobId),
        openOutputFolder: (customOutputDir?: string) => ipcRenderer.invoke('bulk-video:open-output-folder', customOutputDir),
        saveProject: (project: any) => ipcRenderer.invoke('bulk-video:save-project', project),
        getProjects: () => ipcRenderer.invoke('bulk-video:get-projects'),
        deleteProject: (projectId: string) => ipcRenderer.invoke('bulk-video:delete-project', projectId),
        pickFile: (type: 'video' | 'image' | 'audio') => ipcRenderer.invoke('bulk-video:pick-file', type),
        onProgress: (callback: (data: BulkVideoProgressEvent) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, data: BulkVideoProgressEvent) => callback(data);
            ipcRenderer.on('bulk-video:progress', handler);
            return () => ipcRenderer.removeListener('bulk-video:progress', handler);
        },
        // v2: Folder-based bulk editing
        pickFolder: () => ipcRenderer.invoke('bulk-video:pick-folder'),
        scanFolder: (folderPath: string) => ipcRenderer.invoke('bulk-video:scan-folder', folderPath),
        generateThumbnail: (videoPath: string) => ipcRenderer.invoke('bulk-video:generate-thumbnail', videoPath),
        generateThumbnailsBatch: (videoPaths: string[]) => ipcRenderer.invoke('bulk-video:generate-thumbnails-batch', videoPaths),
        getVideoMetadata: (videoPath: string) => ipcRenderer.invoke('bulk-video:get-video-metadata', videoPath),
        startBulkEdit: (videos: any[], editTemplate: any, customOutputDir?: string) => ipcRenderer.invoke('bulk-video:start-bulk-edit', videos, editTemplate, customOutputDir),
        onBulkEditProgress: (callback: (data: BulkEditProgressEvent) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, data: BulkEditProgressEvent) => callback(data);
            ipcRenderer.on('bulk-video:bulk-edit-progress', handler);
            return () => ipcRenderer.removeListener('bulk-video:bulk-edit-progress', handler);
        },
        cancelBulkEdit: () => ipcRenderer.invoke('bulk-video:cancel-bulk-edit'),
        onThumbnailsProgress: (callback: (data: any) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
            ipcRenderer.on('bulk-video:thumbnails-progress', handler);
            return () => ipcRenderer.removeListener('bulk-video:thumbnails-progress', handler);
        },
    },
} as ElectronAPI);

// Declare for TypeScript
declare global {
    interface Window {
        api: ElectronAPI;
    }
}
