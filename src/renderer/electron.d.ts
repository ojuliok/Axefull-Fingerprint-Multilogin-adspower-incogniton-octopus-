import { ElectronAPI } from '../preload/preload';

declare global {
    interface Window {
        api: ElectronAPI;
    }
    namespace JSX {
        interface IntrinsicElements {
            webview: any;
        }
    }
}

export {};
