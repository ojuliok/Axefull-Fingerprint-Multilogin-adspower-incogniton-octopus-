import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

const config: any = {};

if (!isVercel) {
    config.main = {
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
    };

    config.preload = {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'dist/preload',
            lib: {
                entry: 'src/preload/preload.ts',
                formats: ['cjs'],
            },
        },
    };
}

config.renderer = {
    plugins: [react()],
    root: 'src/renderer',
    base: './',
    envDir: path.resolve(__dirname),
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@blocknote/core',
            '@blocknote/react',
            '@blocknote/mantine',
            '@mantine/core',
            '@mantine/hooks',
            '@tiptap/react'
        ],
    },
    build: {
        outDir: 'dist/renderer',
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
};

export default defineConfig(config);
