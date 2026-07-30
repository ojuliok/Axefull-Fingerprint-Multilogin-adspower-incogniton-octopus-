import React from 'react';
import { Folder as FolderIcon, Globe, Shield, Star, Tag, Database, Zap, Users, Layers, Monitor, Bookmark, Code, Package, Cpu, LucideIcon } from 'lucide-react';

export const getOsLabel = (platform?: string): string | null => {
    if (!platform) return null;
    if (platform === 'Win32') return 'Win';
    if (platform === 'MacIntel' || platform === 'MacPPC') return 'Mac';
    if (platform.includes('Linux')) return 'Linux';
    return null;
};

export const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
    ready:   { label: 'Pronto',   cls: 'text-theme-text-muted bg-slate-500/10 border-slate-500/20',   dot: '#64748b' },
    new:     { label: 'Novo',     cls: 'text-sky-400 bg-sky-500/10 border-sky-500/20',         dot: '#38bdf8' },
    farming: { label: 'Farming',  cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20',      dot: '#60a5fa' },
    warming: { label: 'Warming',  cls: 'text-teal-400 bg-teal-500/10 border-teal-500/20',      dot: '#2dd4bf' },
    warning: { label: 'Atenção',  cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: '#f59e0b' },
    banned:  { label: 'Banido',   cls: 'text-red-400 bg-red-500/10 border-red-500/20',         dot: '#f87171' },
    verified:{ label: 'Verificado',cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: '#34d399' },
    waiting: { label: 'Aguardando',cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20',dot: '#a78bfa' },
};

export const getStatusMap = (): Record<string, { label: string; cls: string; dot: string }> => {
    try {
        const saved = localStorage.getItem('axe_custom_status_config');
        if (saved) {
            const custom = JSON.parse(saved);
            return { ...STATUS_CONFIG, ...custom };
        }
    } catch (e) {
        console.error('Error reading custom status config', e);
    }
    return STATUS_CONFIG;
};

export const saveCustomStatusConfig = (updatedMap: Record<string, { label: string; cls: string; dot: string }>) => {
    try {
        localStorage.setItem('axe_custom_status_config', JSON.stringify(updatedMap));
    } catch (e) {
        console.error('Error saving custom status config', e);
    }
};

export const SOCIAL_TAG_COLORS: Record<string, { color: string; bg: string; border: string; bgActive: string; borderActive: string }> = {
    facebook:  { color: '#1877f2', bg: 'rgba(24, 119, 242, 0.05)',  border: 'rgba(24, 119, 242, 0.15)', bgActive: 'rgba(24, 119, 242, 0.15)', borderActive: 'rgba(24, 119, 242, 0.4)' },
    instagram: { color: '#e1306c', bg: 'rgba(225, 48, 108, 0.05)', border: 'rgba(225, 48, 108, 0.15)', bgActive: 'rgba(225, 48, 108, 0.15)', borderActive: 'rgba(225, 48, 108, 0.4)' },
    twitter:   { color: '#1da1f2', bg: 'rgba(29, 161, 242, 0.05)',  border: 'rgba(29, 161, 242, 0.15)', bgActive: 'rgba(29, 161, 242, 0.15)', borderActive: 'rgba(29, 161, 242, 0.4)' },
    tiktok:    { color: '#fe2c55', bg: 'rgba(254, 44, 85, 0.05)',  border: 'rgba(254, 44, 85, 0.15)', bgActive: 'rgba(254, 44, 85, 0.15)', borderActive: 'rgba(254, 44, 85, 0.4)' },
    linkedin:  { color: '#0a66c2', bg: 'rgba(10, 102, 194, 0.05)',  border: 'rgba(10, 102, 194, 0.15)', bgActive: 'rgba(10, 102, 194, 0.15)', borderActive: 'rgba(10, 102, 194, 0.4)' },
    youtube:   { color: '#ff0000', bg: 'rgba(255, 0, 0, 0.05)',    border: 'rgba(255, 0, 0, 0.15)',   bgActive: 'rgba(255, 0, 0, 0.15)',   borderActive: 'rgba(255, 0, 0, 0.4)' },
    google:    { color: '#4285f4', bg: 'rgba(66, 133, 244, 0.05)',  border: 'rgba(66, 133, 244, 0.15)', bgActive: 'rgba(66, 133, 244, 0.15)', borderActive: 'rgba(66, 133, 244, 0.4)' },
    meta:      { color: '#0064e0', bg: 'rgba(0, 100, 224, 0.05)',   border: 'rgba(0, 100, 224, 0.15)',   bgActive: 'rgba(0, 100, 224, 0.15)',   borderActive: 'rgba(0, 100, 224, 0.4)' },
    whatsapp:  { color: '#25d366', bg: 'rgba(37, 211, 102, 0.05)',  border: 'rgba(37, 211, 102, 0.15)', bgActive: 'rgba(37, 211, 102, 0.15)', borderActive: 'rgba(37, 211, 102, 0.4)' },
    telegram:  { color: '#0088cc', bg: 'rgba(0, 136, 204, 0.05)',  border: 'rgba(0, 136, 204, 0.15)', bgActive: 'rgba(0, 136, 204, 0.15)', borderActive: 'rgba(0, 136, 204, 0.4)' },
};

export const SOCIAL_ICONS: Record<string, (size: number) => React.ReactNode> = {
    facebook: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
    ),
    instagram: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
    ),
    twitter: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
        </svg>
    ),
    tiktok: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
        </svg>
    ),
    linkedin: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect width="4" height="12" x="2" y="9"/>
            <circle cx="4" cy="4" r="2"/>
        </svg>
    ),
    youtube: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
            <polygon points="10 15 15 12 10 9"/>
        </svg>
    ),
    google: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 10h12.3a1 1 0 0 1 1 1v2a10 10 0 1 1-10-10c2.7 0 5.2 1 7 3l-3 3a6 6 0 1 0-4 4v-4z"/>
        </svg>
    ),
    meta: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 6c-1.5 0-3 .6-4.2 1.8A7.8 7.8 0 0 0 6 13.5c0 1.5.5 3 1.5 4a6.3 6.3 0 0 0 8.7 0c1-1 1.5-2.5 1.5-4a7.8 7.8 0 0 0-1.8-5.7C15 6.6 13.5 6 12 6z"/>
            <path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/>
        </svg>
    ),
    whatsapp: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
    ),
    telegram: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
    ),
};

export const getTagIconElement = (tag: string, size: number = 14) => {
    const lower = tag.toLowerCase().trim();
    if (SOCIAL_ICONS[lower]) {
        return SOCIAL_ICONS[lower](size);
    }
    return <Tag size={size} />;
};

export interface TagTemplate {
    id: string;
    name: string;
    color: string;
    tags: string[];
}

export const DEFAULT_TAG_TEMPLATES: TagTemplate[] = [
    { id: 'social',  name: 'Social Media',  color: '#60a5fa', tags: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin'] },
    { id: 'ads',     name: 'Marketing',     color: '#fb923c', tags: ['ads', 'leads', 'campanhas', 'google', 'meta'] },
    { id: 'crypto',  name: 'Crypto / Web3', color: '#a78bfa', tags: ['defi', 'nft', 'wallet', 'trading', 'binance'] },
    { id: 'farm',    name: 'Farming',       color: '#34d399', tags: ['farming', 'warming', 'aged', 'pronto'] },
    { id: 'ecom',    name: 'E-commerce',    color: '#f472b6', tags: ['amazon', 'shopify', 'mercado-livre', 'ebay'] },
];

export const FOLDER_ICONS: { name: string; Icon: LucideIcon }[] = [
    { name: 'Folder',   Icon: FolderIcon },
    { name: 'Globe',    Icon: Globe },
    { name: 'Shield',   Icon: Shield },
    { name: 'Star',     Icon: Star },
    { name: 'Tag',      Icon: Tag },
    { name: 'Database', Icon: Database },
    { name: 'Zap',      Icon: Zap },
    { name: 'Users',    Icon: Users },
    { name: 'Layers',   Icon: Layers },
    { name: 'Monitor',  Icon: Monitor },
    { name: 'Bookmark', Icon: Bookmark },
    { name: 'Code',     Icon: Code },
    { name: 'Package',  Icon: Package },
    { name: 'Cpu',      Icon: Cpu },
];

export const FOLDER_COLORS = [
    '#a78bfa', '#60a5fa', '#34d399', '#f87171',
    '#fb923c', '#facc15', '#f472b6', '#22d3ee',
    '#4ade80', '#94a3b8',
] as const;

export type FolderCustomization = { color: string; iconName: string };
