import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'dist/main',
            lib: {
                entry: 'src/main/index.ts',
                formats: ['cjs'],
            },
            rollupOptions: {
                external: ['sqlite3', 'better-sqlite3'], // Prevents bundler issues with optional database packages
            },
        },
        resolve: {
            alias: {
                '@main': path.resolve(__dirname, 'src/main'),
            },
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'dist/preload',
            lib: {
                entry: 'src/preload/preload.ts',
                formats: ['cjs'],
            },
        },
    },
    renderer: {
        plugins: [react()],
        root: 'src/renderer',
        base: './',
        envDir: path.resolve(__dirname),
        build: {
            outDir: '../../dist/renderer',
            emptyOutDir: true,
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src/renderer'),
            },
        },
        server: {
            port: 5173,
        },
    },
});
