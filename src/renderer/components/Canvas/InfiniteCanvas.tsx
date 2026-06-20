import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import {
    Trash2, ZoomIn, ZoomOut, Maximize2, Minimize2, Crop,
    Type, Image, FileText, MousePointer2,
    Bold, Italic, Underline, Strikethrough,
    Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    ArrowUpToLine, ArrowDownToLine,
    Copy, Pencil, Eraser, Minus, Plus, Smile, HelpCircle,
    ArrowUpRight, Grid, Share2, Filter, ListTodo, Palette,
    ExternalLink, RotateCw, Table, ScrollText, Download, X,
    Undo2, Redo2, Layers, LayoutTemplate,
    Globe, Play, Square, Lock, Unlock
} from 'lucide-react';
import { CanvasNode, CanvasData, Stroke, CanvasConnection, debouncedSaveCanvasData, createCanvas } from './canvasStorage';
import { Profile } from '../../types';
import { ProfileAIScore } from '../AI/ProfileAIScore';
import { LinearPageRenderer } from './LinearPageRenderer';
import { CanvasMinimap } from './CanvasMinimap';
import styles from './InfiniteCanvas.module.css';

// ── Curated Emojis and Icons Catalog ──

const EMOJI_LIST = [
    '😀', '😂', '🥰', '😎', '🤔', '👍', '👎', '👏', '🙌', '🔥', '❤️', '💡', '🚀', '🎉', '✨', '⭐', '👀', '💩',
    '💻', '💼', '📈', '📊', '📝', '📅', '📌', '✉️', '🔒', '🔑', '🎯', '📢', '🤝', '💰', '🏢', '🛠️', '⚙️', '🚨',
    '✅', '❌', '⚠️', '🛑', 'ℹ️', '❓', '🌀', '🏁', '➕', '➖', '💬', '💭', '🌍', '🏠', '🎁'
];

const ICON_LIST = [
    'Star', 'Heart', 'Shield', 'Flame', 'Sparkles', 'Compass', 'Anchor', 'Activity', 'Award', 'Trophy',
    'Workflow', 'Network', 'GitFork', 'Layers', 'GitBranch', 'ArrowRight', 'CornerRightDown', 'Link2',
    'Briefcase', 'LineChart', 'PieChart', 'TrendingUp', 'Target', 'Crown', 'Users', 'User', 'MessageSquare',
    'Laptop', 'Smartphone', 'Database', 'Server', 'Globe', 'Mail', 'Send', 'Lock', 'Unlock', 'Key', 'Bell'
];

// ── Social Media Catalog ──
interface SocialPlatform {
    id: string;
    name: string;
    color: string;
    bg: string;
    svgPath: string;
    viewBox?: string;
}

const SOCIAL_MEDIA_CATALOG: SocialPlatform[] = [
    { id: 'facebook',  name: 'Facebook',  color: '#1877F2', bg: 'rgba(24,119,242,0.15)', svgPath: 'M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z' },
    { id: 'instagram', name: 'Instagram', color: '#E4405F', bg: 'rgba(228,64,95,0.15)', svgPath: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913a5.885 5.885 0 001.384 2.126A5.868 5.868 0 004.14 23.37c.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558a5.898 5.898 0 002.126-1.384 5.86 5.86 0 001.384-2.126c.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913a5.89 5.89 0 00-1.384-2.126A5.847 5.847 0 0019.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 01-.899 1.382 3.744 3.744 0 01-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 01-1.379-.899 3.644 3.644 0 01-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z' },
    { id: 'whatsapp',  name: 'WhatsApp',  color: '#25D366', bg: 'rgba(37,211,102,0.15)', svgPath: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' },
    { id: 'youtube',   name: 'YouTube',   color: '#FF0000', bg: 'rgba(255,0,0,0.15)', svgPath: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    { id: 'tiktok',    name: 'TikTok',    color: '#69C9D0', bg: 'rgba(105,201,208,0.15)', svgPath: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
    { id: 'x',         name: 'X (Twitter)', color: '#ffffff', bg: 'rgba(255,255,255,0.08)', svgPath: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { id: 'linkedin',  name: 'LinkedIn',  color: '#0A66C2', bg: 'rgba(10,102,194,0.15)', svgPath: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { id: 'telegram',  name: 'Telegram',  color: '#26A5E4', bg: 'rgba(38,165,228,0.15)', svgPath: 'M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
    { id: 'pinterest', name: 'Pinterest', color: '#BD081C', bg: 'rgba(189,8,28,0.15)', svgPath: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z' },
    { id: 'snapchat',  name: 'Snapchat',  color: '#FFFC00', bg: 'rgba(255,252,0,0.12)', svgPath: 'M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.285.06-.045.12-.075.195-.09a.72.72 0 01.72.12c.18.15.27.375.24.6-.045.27-.24.455-.479.54a4.079 4.079 0 01-1.199.285c-.12.015-.241.03-.36.06-.165.045-.27.255-.3.45-.03.195-.015.39.09.525 1.29 1.815 2.939 2.79 3.089 2.88.21.12.391.27.48.48.09.18.12.39.07.59-.15.675-.72.93-.96.99-.33.09-.659.15-1.02.18a.72.72 0 00-.51.195c-.15.15-.21.36-.27.57-.06.21-.15.42-.36.525-.21.12-.465.12-.66.06-.45-.135-1.02-.27-1.77-.12-.84.165-1.65.885-2.67 1.77-.69.585-1.47 1.245-2.52 1.77-1.65.81-3.15.3-3.72.045-.57-.255-1.2-.63-1.74-1.05-.72-.57-1.35-1.245-2.01-1.815-.84-.765-1.5-1.38-2.19-1.515a5.345 5.345 0 00-1.02-.06c-.3.015-.555-.12-.69-.285a.806.806 0 01-.18-.45c-.03-.12-.06-.24-.105-.33-.045-.09-.105-.165-.195-.225a.69.69 0 00-.42-.12c-.345-.03-.72-.09-1.065-.195-.27-.075-.81-.315-.945-.96-.045-.195-.015-.42.06-.585.105-.21.27-.36.48-.48.15-.09 1.8-1.065 3.09-2.88.105-.135.12-.33.09-.525-.03-.195-.135-.405-.3-.45a5.3 5.3 0 00-.36-.06c-.45-.06-.84-.165-1.17-.285-.24-.09-.42-.27-.479-.54a.573.573 0 01.239-.6.706.706 0 01.2-.09.866.866 0 01.519-.015c.27.09.63.195.93.195.195 0 .33-.045.405-.09l-.006-.51c-.105-1.628-.23-3.654.3-4.848C6.07 1.07 9.46.793 10.45.793h1.756z' },
    { id: 'discord',   name: 'Discord',   color: '#5865F2', bg: 'rgba(88,101,242,0.15)', svgPath: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z' },
    { id: 'reddit',    name: 'Reddit',    color: '#FF4500', bg: 'rgba(255,69,0,0.15)', svgPath: 'M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 000-.463.327.327 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z' },
    { id: 'threads',   name: 'Threads',   color: '#ffffff', bg: 'rgba(255,255,255,0.08)', svgPath: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.963-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 013.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.581-1.28-.876-2.28-.876h-.04c-.748.003-1.9.066-2.77.785l-1.326-1.544c1.329-1.098 2.98-1.357 4.111-1.357h.06c1.669 0 3.003.554 3.862 1.604.73.889 1.168 2.07 1.302 3.51a8.14 8.14 0 011.217.857c1.32 1.115 2.14 2.678 2.378 4.517.162 1.264-.072 3.26-1.82 5.007C17.706 23.19 15.333 23.975 12.186 24zm-1.638-8.01c-.32.018-2.428.168-2.339 1.69.045.802.652 1.378 1.726 1.455 1.282.072 2.243-.321 2.854-1.17.39-.54.657-1.263.79-2.153a11.57 11.57 0 00-3.031.178z' },
    { id: 'twitch',    name: 'Twitch',    color: '#9146FF', bg: 'rgba(145,70,255,0.15)', svgPath: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z' },
    { id: 'spotify',   name: 'Spotify',   color: '#1DB954', bg: 'rgba(29,185,84,0.15)', svgPath: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' },
];

// ── Social SVG Icon Component ──
const SocialIcon: React.FC<{ platform: SocialPlatform; size?: number }> = ({ platform, size = 24 }) => (
    <svg width={size} height={size} viewBox={platform.viewBox || '0 0 24 24'} fill={platform.color}>
        <path d={platform.svgPath} />
    </svg>
);

// ── Funnel Templates ──
interface FunnelStage {
    label: string;
    color: string;
    description?: string;
}

interface FunnelTemplate {
    id: string;
    name: string;
    description: string;
    stages: FunnelStage[];
}

const FUNNEL_TEMPLATES: FunnelTemplate[] = [
    {
        id: 'simple',
        name: 'Funil Simples',
        description: '3 etapas — Atração, Consideração, Conversão',
        stages: [
            { label: 'Topo de Funil', color: 'rgba(59, 130, 246, 0.45)', description: 'Atração — Captar atenção do público-alvo' },
            { label: 'Meio de Funil', color: 'rgba(168, 85, 247, 0.45)', description: 'Consideração — Nutrir interesse e confiança' },
            { label: 'Fundo de Funil', color: 'rgba(34, 197, 94, 0.45)', description: 'Conversão — Fechar a venda' },
        ],
    },
    {
        id: 'complete',
        name: 'Funil Completo',
        description: '5 etapas — Do descobrimento à ação final',
        stages: [
            { label: 'Descoberta', color: 'rgba(56, 189, 248, 0.45)', description: 'Awareness — Primeiro contato com a marca' },
            { label: 'Interesse', color: 'rgba(99, 102, 241, 0.45)', description: 'Interest — Despertar curiosidade' },
            { label: 'Consideração', color: 'rgba(168, 85, 247, 0.45)', description: 'Consideration — Avaliar soluções' },
            { label: 'Decisão', color: 'rgba(245, 158, 11, 0.45)', description: 'Decision — Escolher a oferta' },
            { label: 'Ação', color: 'rgba(34, 197, 94, 0.45)', description: 'Action — Conversão e compra' },
        ],
    },
    {
        id: 'social',
        name: 'Funil de Redes Sociais',
        description: '5 etapas — Conteúdo → Engajamento → Venda → Fidelização',
        stages: [
            { label: 'Conteúdo', color: 'rgba(236, 72, 153, 0.45)', description: 'Criar e publicar conteúdo de valor' },
            { label: 'Engajamento', color: 'rgba(249, 115, 22, 0.45)', description: 'Curtidas, comentários, compartilhamentos' },
            { label: 'Lead', color: 'rgba(139, 92, 246, 0.45)', description: 'Captura do contato e interesse' },
            { label: 'Venda', color: 'rgba(34, 197, 94, 0.45)', description: 'Converter lead em cliente' },
            { label: 'Fidelização', color: 'rgba(20, 184, 166, 0.45)', description: 'Retenção e recorrência' },
        ],
    },
];

// ── Dynamic Icon Component ──
const DynamicIcon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 20, color = 'currentColor' }) => {
    const IconComponent = (Lucide as any)[name];
    if (!IconComponent) return <HelpCircle size={size} color={color} />;
    return <IconComponent size={size} color={color} />;
};

const NODE_COLORS = [
    { id: 'default', value: 'rgba(20, 20, 28, 0.92)' },
    { id: 'purple',  value: 'rgba(88, 28, 135, 0.45)' },
    { id: 'blue',    value: 'rgba(30, 58, 138, 0.45)' },
    { id: 'green',   value: 'rgba(20, 83, 45, 0.45)' },
    { id: 'amber',   value: 'rgba(120, 53, 15, 0.45)' },
    { id: 'red',     value: 'rgba(127, 29, 29, 0.45)' },
];

const TEXT_COLORS = [
    { id: 'default',  value: '#e2e8f0', label: 'Padrão' },
    { id: 'white',    value: '#ffffff', label: 'Branco' },
    { id: 'purple',   value: '#c4b5fd', label: 'Roxo' },
    { id: 'blue',     value: '#93c5fd', label: 'Azul' },
    { id: 'green',    value: '#86efac', label: 'Verde' },
    { id: 'amber',    value: '#fcd34d', label: 'Amarelo' },
    { id: 'red',      value: '#fca5a5', label: 'Vermelho' },
    { id: 'pink',     value: '#f9a8d4', label: 'Rosa' },
    { id: 'cyan',     value: '#67e8f9', label: 'Ciano' },
    { id: 'orange',   value: '#fdba74', label: 'Laranja' },
];

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;
const PEN_COLOR = '#a78bfa';
const PEN_WIDTH = 2.5;

// ── Editable Text Component (avoids React re-render issues) ──
const EditableDiv: React.FC<{
    nodeId: string;
    initialContent: string;
    onSave: (id: string, content: string) => void;
    className: string;
    placeholder: string;
    style?: React.CSSProperties;
    autoFocus?: boolean;
    editable: boolean;
    onFocusCb?: () => void;
}> = ({ nodeId, initialContent, onSave, className, placeholder, style, autoFocus, editable, onFocusCb }) => {
    const ref = useRef<HTMLDivElement>(null);
    const savedContent = useRef(initialContent);

    useEffect(() => {
        if (ref.current && document.activeElement !== ref.current) {
            if (ref.current.innerHTML !== initialContent) {
                ref.current.innerHTML = initialContent;
                savedContent.current = initialContent;
            }
        }
    }, [nodeId, initialContent]);

    useEffect(() => {
        if (autoFocus && ref.current && editable) {
            try {
                ref.current.focus();
                const sel = window.getSelection();
                if (sel && ref.current.childNodes.length > 0) {
                    sel.selectAllChildren(ref.current);
                    sel.collapseToEnd();
                }
            } catch (err) {
                console.warn("Failed to set selection focus:", err);
            }
        }
    }, [autoFocus, editable]);

    const handleInput = useCallback(() => {
        if (ref.current) {
            const html = ref.current.innerHTML;
            savedContent.current = html;
            onSave(nodeId, html);
        }
    }, [nodeId, onSave]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.stopPropagation();

        if (e.key === ' ') {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const textNode = range.startContainer;

                if (textNode.nodeType === Node.TEXT_NODE) {
                    const text = textNode.textContent || '';
                    const offset = range.startOffset;
                    const beforeCursor = text.slice(0, offset);

                    const deletePrefix = (len: number) => {
                        const s = window.getSelection();
                        if (s) {
                            const r = document.createRange();
                            r.setStart(textNode, 0);
                            r.setEnd(textNode, len);
                            s.removeAllRanges();
                            s.addRange(r);
                            document.execCommand('delete', false);
                        }
                    };

                    if (beforeCursor === '#') {
                        e.preventDefault();
                        document.execCommand('formatBlock', false, 'H1');
                        deletePrefix(offset);
                        setTimeout(() => { if (ref.current) handleInput(); }, 10);
                    } else if (beforeCursor === '##') {
                        e.preventDefault();
                        document.execCommand('formatBlock', false, 'H2');
                        deletePrefix(offset);
                        setTimeout(() => { if (ref.current) handleInput(); }, 10);
                    } else if (beforeCursor === '###') {
                        e.preventDefault();
                        document.execCommand('formatBlock', false, 'H3');
                        deletePrefix(offset);
                        setTimeout(() => { if (ref.current) handleInput(); }, 10);
                    } else if (beforeCursor === '---') {
                        e.preventDefault();
                        deletePrefix(offset);
                        document.execCommand('insertHorizontalRule', false);
                        setTimeout(() => { if (ref.current) handleInput(); }, 10);
                    }
                }
            }
        }
    };

    return (
        <div
            ref={ref}
            contentEditable={editable}
            suppressContentEditableWarning
            className={className}
            onInput={handleInput}
            onFocus={onFocusCb}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => { if (editable) e.stopPropagation(); }}
            dir="ltr"
            style={{ direction: 'ltr', textAlign: 'left', ...style }}
            data-placeholder={placeholder}
        />
    );
};

// ── Main Component ──

interface InfiniteCanvasProps {
    canvasId: string;
    data: CanvasData;
    onDataChange: (data: CanvasData) => void;
    onOpenPage?: (id: string, name: string) => void;
    onCanvasCreated?: () => void;
    onNodesDeleted?: (canvasIds: string[]) => void;
}

interface ContextMenuState { x: number; y: number; nodeId: string; }
interface SelectionRect { x: number; y: number; w: number; h: number; }
interface ConnectionContextMenu { x: number; y: number; connectionId: string; }

const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ canvasId, data, onDataChange, onOpenPage, onCanvasCreated, onNodesDeleted }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState(data?.viewport || { x: 0, y: 0, zoom: 1 });
    const [nodes, setNodes] = useState<CanvasNode[]>(data?.nodes || []);
    const [strokes, setStrokes] = useState<Stroke[]>(data?.strokes || []);
    const [connections, setConnections] = useState<CanvasConnection[]>(data?.connections || []);

    // Touch Support Refs
    const initialPinchDist = useRef<number | null>(null);
    const lastTouchPos = useRef<{ x: number, y: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const isTextEditing = editingNodeId !== null;
    const [isPanning, setIsPanning] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isDragOver, setIsDragOver] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number } | null>(null);
    const [showFormatBar, setShowFormatBar] = useState(false);
    const [spaceHeld, setSpaceHeld] = useState(false);
    const [viewMode, setViewMode] = useState<'canvas' | 'page'>('canvas');
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [isPropSidebarMinimized, setIsPropSidebarMinimized] = useState(false);

    // Pasting and Webview Execution States
    const [pasteLinkDialog, setPasteLinkDialog] = useState<{ url: string; x: number; y: number } | null>(null);
    const [runningWebviews, setRunningWebviews] = useState<Set<string>>(new Set());
    const [editingUrlNodeId, setEditingUrlNodeId] = useState<string | null>(null);
    const [editingUrlValue, setEditingUrlValue] = useState('');

    // ── Image Lightbox / Full Viewer ──
    const [lightboxImage, setLightboxImage] = useState<{ src: string; fileName?: string } | null>(null);

    // ── Custom UI Dialogs ──
    type CustomDialogState = {
        isOpen: boolean;
        type: 'confirm' | 'prompt';
        message: string;
        defaultValue?: string;
        onConfirm: (val?: string) => void;
        onCancel: () => void;
    };
    const [customDialog, setCustomDialog] = useState<CustomDialogState>({ isOpen: false, type: 'confirm', message: '', onConfirm: () => {}, onCancel: () => {} });
    const [customDialogInputValue, setCustomDialogInputValue] = useState('');

    // ── History & Layers State ──
    const [history, setHistory] = useState<{nodes: CanvasNode[], connections: CanvasConnection[], strokes: Stroke[]}[]>([{ nodes: data?.nodes || [], connections: data?.connections || [], strokes: data?.strokes || [] }]);
    const historyIndexRef = useRef(0);
    const [historyTrigger, setHistoryTrigger] = useState(0); // For UI updates
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showTextSidebar, setShowTextSidebar] = useState(false);
    // Grid Snapping & Sketch Setas Modes
    const [gridSnap, setGridSnap] = useState(false);

    // Excalidraw-like Drawing Tool States
    type ActiveTool = 'select' | 'hand' | 'rectangle' | 'diamond' | 'ellipse' | 'line' | 'arrow' | 'triangle' | 'blockArrow' | 'elbowArrow' | 'pen' | 'arrowPen';
    const [activeTool, setActiveTool] = useState<ActiveTool>('select');
    const [isToolLocked, setIsToolLocked] = useState(false);

    // Selected Shape customization states
    const [currentStrokeColor, setCurrentStrokeColor] = useState('#a78bfa');
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
    const [currentStrokeStyle, setCurrentStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
    const [currentFillColor, setCurrentFillColor] = useState('transparent');
    const [currentShapeRoughness, setCurrentShapeRoughness] = useState(1); // 1 = sketchy (rough), 0 = clean

    // Shape drawing coordinates state
    const [isDrawingShape, setIsDrawingShape] = useState(false);
    const [currentShapeStart, setCurrentShapeStart] = useState<{ x: number; y: number } | null>(null);
    const [currentShapeTemp, setCurrentShapeTemp] = useState<{ x: number; y: number; width: number; height: number; flipped: boolean } | null>(null);

    // Backward compatibility helper constants & setters
    const penMode = activeTool === 'pen';
    const arrowPenMode = activeTool === 'arrowPen';
    const setPenMode = (val: boolean) => {
        if (val) {
            setActiveTool('pen');
        } else if (activeTool === 'pen') {
            setActiveTool('select');
        }
    };
    const setArrowPenMode = (val: boolean) => {
        if (val) {
            setActiveTool('arrowPen');
        } else if (activeTool === 'arrowPen') {
            setActiveTool('select');
        }
    };

    // Dynamic Connections State
    const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; side: 'n' | 'e' | 's' | 'w' } | null>(null);
    const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [connectionContextMenu, setConnectionContextMenu] = useState<ConnectionContextMenu | null>(null);

    // Emojis and Icons Picker
    const [showPickerPopover, setShowPickerPopover] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerTab, setPickerTab] = useState<'emoji' | 'icon'>('emoji');

    // Pen/drawing tool
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

    // Multi-select rubber band
    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionStartRef = useRef({ x: 0, y: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Profile Mentions States
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [showProfilePicker, setShowProfilePicker] = useState(false);
    const [profileSearch, setProfileSearch] = useState('');
    
    // Social and Funnel Pickers
    const [showSocialPicker, setShowSocialPicker] = useState(false);
    const [socialSearch, setSocialSearch] = useState('');
    const [showFunnelPicker, setShowFunnelPicker] = useState(false);

    // Notion Card States
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [activeCardMode, setActiveCardMode] = useState<'popup' | 'sidebar' | null>(null);
    const [cardData, setCardData] = useState<{
        title: string;
        content: string;
        comments: { id: string; author: string; initials: string; text: string; createdAt: number }[];
        checklist?: { id: string; text: string; checked: boolean }[];
    } | null>(null);
    const [newCommentText, setNewCommentText] = useState('');



    // ── Helpers ──
    const genId = () => Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
    const maxZ = () => {
        const values = nodes.map(n => n.zIndex).filter(z => typeof z === 'number' && !isNaN(z));
        return values.length > 0 ? Math.max(0, ...values) : 0;
    };

    const screenToCanvas = (clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: (clientX - rect.left - viewport.x) / viewport.zoom,
            y: (clientY - rect.top - viewport.y) / viewport.zoom,
        };
    };

    // ── Save helper ──
    const saveData = useCallback((
        updatedNodes: CanvasNode[], 
        updatedStrokes: Stroke[], 
        updatedViewport: typeof viewport, 
        updatedConnections: CanvasConnection[] = connections,
        pushToHistory: boolean = true
    ) => {
        const newData: CanvasData = { 
            nodes: updatedNodes, 
            strokes: updatedStrokes, 
            connections: updatedConnections, 
            viewport: updatedViewport 
        };
        onDataChange(newData);
        debouncedSaveCanvasData(canvasId, newData);

        if (pushToHistory) {
            setHistory(prev => {
                const currentIdx = historyIndexRef.current;
                const last = prev[currentIdx];
                if (last && last.nodes === updatedNodes && last.strokes === updatedStrokes && last.connections === updatedConnections) return prev;
                
                const next = prev.slice(0, currentIdx + 1);
                next.push({ nodes: updatedNodes, connections: updatedConnections, strokes: updatedStrokes });
                if (next.length > 50) next.shift();
                historyIndexRef.current = next.length - 1;
                setHistoryTrigger(t => t + 1);
                return next;
            });
        }
    }, [canvasId, onDataChange, connections]);

    const handleUndo = useCallback(() => {
        if (historyIndexRef.current > 0) {
            historyIndexRef.current -= 1;
            const state = history[historyIndexRef.current];
            setNodes(state.nodes);
            setConnections(state.connections);
            setStrokes(state.strokes);
            setHistoryTrigger(t => t + 1);
            saveData(state.nodes, state.strokes, viewport, state.connections, false);
        }
    }, [history, viewport, saveData]);

    const handleRedo = useCallback(() => {
        if (historyIndexRef.current < history.length - 1) {
            historyIndexRef.current += 1;
            const state = history[historyIndexRef.current];
            setNodes(state.nodes);
            setConnections(state.connections);
            setStrokes(state.strokes);
            setHistoryTrigger(t => t + 1);
            saveData(state.nodes, state.strokes, viewport, state.connections, false);
        }
    }, [history, viewport, saveData]);
    // Load Card Content when activeCardId is set
    useEffect(() => {
        if (!activeCardId) {
            setCardData(null);
            return;
        }

        if (window.api && window.api.cards) {
            window.api.cards.get(activeCardId).then(res => {
                if (res.success && res.data) {
                    setCardData({
                        title: res.data.title || 'Novo Card',
                        content: res.data.content || '',
                        comments: res.data.comments || [],
                        checklist: res.data.checklist || []
                    });
                }
            }).catch(err => console.error("Error loading card:", err));
        }
    }, [activeCardId]);

    // Save active card structured data
    const saveActiveCard = useCallback((updated: typeof cardData) => {
        if (!activeCardId || !updated) return;

        // 1. Update local cardData state
        setCardData(updated);

        // 2. Update node content in the Canvas (so the title stays updated live on the canvas!)
        setNodes(prev => {
            const next = prev.map(node => {
                if (node.id === activeCardId) {
                    return {
                        ...node,
                        content: updated.title || 'Sem título'
                    };
                }
                return node;
            });
            saveData(next, strokes, viewport);
            return next;
        });

        // 3. Save to physical file in second plan (IPC)
        if (window.api && window.api.cards) {
            window.api.cards.save(activeCardId, updated).catch(err => {
                console.error("Error saving card file:", err);
            });
        }
    }, [activeCardId, strokes, viewport, saveData]);

    const deleteSelectedElements = useCallback((ids: Set<string>, force = false) => {
        // Filter out locked node ids from deletion list unless forced
        const activeIds = new Set<string>();
        ids.forEach(id => {
            const node = nodes.find(n => n.id === id);
            if (!node || !node.isLocked || force) {
                activeIds.add(id);
            }
        });

        if (activeIds.size === 0) return;

        const deletedCanvasIds: string[] = [];
        nodes.forEach(n => {
            if (activeIds.has(n.id) && (n.type === 'page' || n.type === 'card') && n.targetCanvasId) {
                deletedCanvasIds.push(n.targetCanvasId);
            }
        });

        const updatedNodes = nodes.filter(n => !activeIds.has(n.id));
        const updatedStrokes = strokes.filter(s => !activeIds.has(s.id));
        const updatedConnections = connections.filter(c => !activeIds.has(c.id) && !activeIds.has(c.fromId) && !activeIds.has(c.toId));
        
        setNodes(updatedNodes);
        setStrokes(updatedStrokes);
        setConnections(updatedConnections);
        setSelectedIds(new Set());
        setEditingNodeId(null);
        setContextMenu(null);
        setConnectionContextMenu(null);
        saveData(updatedNodes, updatedStrokes, viewport, updatedConnections);

        if (deletedCanvasIds.length > 0) {
            onNodesDeleted?.(deletedCanvasIds);
        }
    }, [nodes, strokes, connections, viewport, saveData, onNodesDeleted]);

    const toggleNodeLock = useCallback((nodeId: string) => {
        setNodes(prev => {
            const next = prev.map(n => n.id === nodeId ? { ...n, isLocked: !n.isLocked } : n);
            saveData(next, strokes, viewport);
            return next;
        });
    }, [strokes, viewport, saveData]);

    const lockAllSelected = useCallback((lock: boolean) => {
        setNodes(prev => {
            const next = prev.map(n => selectedIds.has(n.id) ? { ...n, isLocked: lock } : n);
            saveData(next, strokes, viewport);
            return next;
        });
    }, [selectedIds, strokes, viewport, saveData]);

    const alignSelectedNodes = useCallback((alignment: 'left' | 'right' | 'center-v' | 'top' | 'middle-h' | 'bottom') => {
        const selectedNodes = nodes.filter(n => selectedIds.has(n.id) && !n.isLocked);
        if (selectedNodes.length <= 1) return;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        selectedNodes.forEach(n => {
            if (n.x < minX) minX = n.x;
            if (n.x + (n.width || 0) > maxX) maxX = n.x + (n.width || 0);
            if (n.y < minY) minY = n.y;
            if (n.y + (n.height || 0) > maxY) maxY = n.y + (n.height || 0);
        });

        const centerX = minX + (maxX - minX) / 2;
        const centerY = minY + (maxY - minY) / 2;

        setNodes(prev => {
            const next = prev.map(n => {
                if (!selectedIds.has(n.id) || n.isLocked) return n;
                const w = n.width || 0;
                const h = n.height || 0;
                let newX = n.x;
                let newY = n.y;

                switch (alignment) {
                    case 'left':
                        newX = minX;
                        break;
                    case 'right':
                        newX = maxX - w;
                        break;
                    case 'center-v':
                        newX = centerX - w / 2;
                        break;
                    case 'top':
                        newY = minY;
                        break;
                    case 'middle-h':
                        newY = centerY - h / 2;
                        break;
                    case 'bottom':
                        newY = maxY - h;
                        break;
                }
                return { ...n, x: newX, y: newY };
            });
            saveData(next, strokes, viewport);
            return next;
        });
    }, [selectedIds, nodes, strokes, viewport, saveData]);

    const addEmbedNode = useCallback((url: string, canvasX?: number, canvasY?: number) => {
        const cx = canvasX !== undefined ? canvasX : (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = canvasY !== undefined ? canvasY : (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        
        let formattedUrl = url.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        const newNode: CanvasNode = {
            id: genId(),
            type: 'embed',
            x: cx - 200,
            y: cy - 150,
            width: 400,
            height: 300,
            content: formattedUrl,
            zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const handleSetNodeSize = useCallback((id: string, width: number, height: number) => {
        setNodes(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, width, height } : n);
            saveData(updated, strokes, viewport);
            return updated;
        });
    }, [strokes, viewport, saveData]);

    const handleUpdateNodeUrl = useCallback((id: string, newUrl: string) => {
        let formattedUrl = newUrl.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
        }
        setNodes(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, content: formattedUrl } : n);
            saveData(updated, strokes, viewport);
            return updated;
        });
    }, [strokes, viewport, saveData]);

    const handleInsertLinkAs = useCallback((type: 'embed' | 'link' | 'text', url: string, x: number, y: number) => {
        let newNode: CanvasNode;
        if (type === 'embed') {
            newNode = {
                id: genId(),
                type: 'embed',
                x: x - 200,
                y: y - 150,
                width: 400,
                height: 300,
                content: url,
                zIndex: maxZ() + 1,
            };
        } else if (type === 'link') {
            newNode = {
                id: genId(),
                type: 'document',
                fileType: 'link',
                fileName: url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || 'Link',
                x: x - 130,
                y: y - 36,
                width: 260,
                height: 72,
                content: url,
                zIndex: maxZ() + 1,
            };
        } else {
            newNode = {
                id: genId(),
                type: 'freetext',
                x: x - 110,
                y: y - 18,
                width: 220,
                height: 36,
                content: url,
                textColor: '#e2e8f0',
                zIndex: maxZ() + 1,
            };
        }

        setNodes(prev => {
            const updated = [...prev, newNode];
            saveData(updated, strokes, viewport);
            return updated;
        });
        setSelectedIds(new Set([newNode.id]));
    }, [strokes, viewport, saveData]);

    // Load profiles and listen for window closed events in real-time
    useEffect(() => {
        const loadProfilesList = async () => {
            try {
                const result = await window.api.profiles.list();
                if (result.success) {
                    setProfiles(result.data);
                }
            } catch (error) {
                console.error('Error loading profiles in Canvas:', error);
            }
        };
        loadProfilesList();

        const cleanup = window.api.browser.onProfileClosed((closedProfileId: string) => {
            setProfiles((prev) => prev.map((p) =>
                p.id === closedProfileId ? { ...p, is_active: 0, status: p.status === 'running' ? 'ready' : p.status } : p
            ));
        });

        return cleanup;
    }, []);

    const launchProfileFromCanvas = async (profileId: string) => {
        setProfiles((prev) => prev.map((p) =>
            p.id === profileId ? { ...p, status: 'running' } : p
        ));
        try {
            const result = await window.api.browser.launch(profileId);
            if (result.success) {
                setProfiles((prev) => prev.map((p) =>
                    p.id === profileId ? { ...p, is_active: 1, status: 'running' } : p
                ));
            } else {
                setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, status: 'ready' } : p));
                alert(`Erro ao iniciar perfil: ${result.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, status: 'ready' } : p));
            console.error('Error launching profile from canvas:', error);
        }
    };

    const closeProfileFromCanvas = async (profileId: string) => {
        try {
            const result = await window.api.browser.close(profileId);
            if (result.success) {
                setProfiles((prev) => prev.map((p) =>
                    p.id === profileId ? { ...p, is_active: 0, status: 'ready' } : p
                ));
            }
        } catch (error) {
            console.error('Error closing profile from canvas:', error);
        }
    };

    const addProfileNodeAt = useCallback((profile: Profile) => {
        const cx = (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const newNode: CanvasNode = {
            id: genId(),
            type: 'profile',
            x: cx - 110,
            y: cy - 37.5,
            width: 220,
            height: 75,
            content: profile.name,
            profileId: profile.id,
            zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
        setShowProfilePicker(false);
        setProfileSearch('');
    }, [nodes, strokes, viewport, saveData]);

    const addSocialNode = useCallback((platform: SocialPlatform) => {
        const cx = (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const newNode: CanvasNode = {
            id: genId(),
            type: 'social',
            x: cx - 50,
            y: cy - 50,
            width: 100,
            height: 100,
            content: platform.name,
            socialPlatform: platform.id,
            zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
        setShowSocialPicker(false);
        setSocialSearch('');
    }, [nodes, strokes, viewport, saveData]);

    const insertFunnelTemplate = useCallback((template: FunnelTemplate) => {
        const cx = (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        
        let startY = cy - ((template.stages.length * 100) / 2);
        const newNodes: CanvasNode[] = [];
        const newConnections: CanvasConnection[] = [];
        const z = maxZ() + 1;
        
        template.stages.forEach((stage, idx) => {
            const nodeId = genId();
            newNodes.push({
                id: nodeId,
                type: 'text',
                x: cx - 100,
                y: startY + (idx * 120),
                width: 200,
                height: 70,
                content: stage.label,
                color: stage.color,
                zIndex: z + idx,
            });
            
            if (idx > 0) {
                newConnections.push({
                    id: genId(),
                    fromId: newNodes[idx - 1].id,
                    fromSide: 's',
                    toId: nodeId,
                    toSide: 'n',
                });
            }
        });
        
        const updatedNodes = [...nodes, ...newNodes];
        const updatedConnections = [...connections, ...newConnections];
        setNodes(updatedNodes);
        setConnections(updatedConnections);
        setSelectedIds(new Set(newNodes.map(n => n.id)));
        saveData(updatedNodes, strokes, viewport, updatedConnections);
        setShowFunnelPicker(false);
    }, [nodes, strokes, viewport, connections, saveData]);

    // ── Sync on canvas change ──
    useEffect(() => {
        setNodes(data?.nodes || []);
        setStrokes(data?.strokes || []);
        setConnections(data?.connections || []);
        setViewport(data?.viewport || { x: 0, y: 0, zoom: 1 });
        setSelectedIds(new Set());
        setEditingNodeId(null);
        setContextMenu(null);
        setConnectionContextMenu(null);
        setShowFormatBar(false);
        setActiveTool('select');
        setShowPickerPopover(false);
    }, [canvasId]);

    // ── Sync single selected shape properties to sidebar states ──
    useEffect(() => {
        if (selectedIds.size === 1) {
            const selectedId = Array.from(selectedIds)[0];
            const node = nodes.find(n => n.id === selectedId);
            if (node && node.type === 'shape') {
                if (node.color) setCurrentStrokeColor(node.color);
                if (node.shapeStrokeWidth) setCurrentStrokeWidth(node.shapeStrokeWidth);
                if (node.shapeStrokeStyle) setCurrentStrokeStyle(node.shapeStrokeStyle);
                if (node.shapeFillColor) setCurrentFillColor(node.shapeFillColor);
                if (node.shapeRoughness !== undefined) setCurrentShapeRoughness(node.shapeRoughness);
            }
        }
    }, [selectedIds, nodes]);

    // ── Close context menus on click ──
    useEffect(() => {
        const handleClick = () => {
            setContextMenu(null);
            setConnectionContextMenu(null);
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // ── Native non-passive wheel listener to prevent scroll leak ──
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            if (viewMode === 'page') return; // Do not intercept scrolling in page mode
            
            const target = e.target as HTMLElement;
            // Allow native scrolling inside popovers and floating panels
            if (target.closest(`.${styles.pickerPopover}`) || 
                target.closest(`.${styles.canvasContextMenu}`) ||
                target.closest(`.${styles.funnelPickerPanel}`)) {
                return;
            }

            e.preventDefault(); // Bloqueia scroll da pagina externa

            const rect = container.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const delta = e.deltaY > 0 ? 0.9 : 1.1;

            setViewport(v => {
                const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * delta));
                const newX = mx - (mx - v.x) * (newZoom / v.zoom);
                const newY = my - (my - v.y) * (newZoom / v.zoom);
                const newV = { x: newX, y: newY, zoom: newZoom };
                
                debouncedSaveCanvasData(canvasId, { nodes, strokes, connections, viewport: newV });
                return newV;
            });
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, [viewport, nodes, strokes, connections, canvasId, viewMode]);

    // ── Keydown controls ──
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const active = e.target as HTMLElement;
            const isTyping = active && (
                active.tagName === 'INPUT' || 
                active.tagName === 'TEXTAREA' || 
                active.isContentEditable ||
                active.closest('input, textarea, [contenteditable="true"]') !== null
            );

            if (e.code === 'Space' && !e.repeat && !isTyping) {
                e.preventDefault();
                setSpaceHeld(true);
            }
            if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
                if (isTyping) return;
                e.preventDefault();
                handleUndo();
            }
            if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
                if (isTyping) return;
                e.preventDefault();
                handleRedo();
            }
            if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                if (isTyping || selectedIds.size === 0) return;
                const copiedNodes = nodes.filter(n => selectedIds.has(n.id));
                if (copiedNodes.length > 0) {
                    localStorage.setItem('axefull-clipboard', JSON.stringify(copiedNodes));
                }
            }
            if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                if (isTyping) return;
                const clipStr = localStorage.getItem('axefull-clipboard');
                if (clipStr) {
                    try {
                        const copied: CanvasNode[] = JSON.parse(clipStr);
                        if (copied && copied.length > 0) {
                            const newSelected = new Set<string>();
                            const offset = 20;
                            const newNodes = copied.map(n => {
                                const newId = genId();
                                newSelected.add(newId);
                                return { ...n, id: newId, x: n.x + offset, y: n.y + offset, zIndex: maxZ() + 1 };
                            });
                            setNodes(prev => {
                                const next = [...prev, ...newNodes];
                                requestAnimationFrame(() => saveData(next, strokes, viewport));
                                return next;
                            });
                            setSelectedIds(newSelected);
                        }
                    } catch(err) {}
                }
            }
            if (e.key === 'Delete') {
                if (isTyping) return;
                if (selectedIds.size > 0) {
                    const nonLockedSelectedIds = new Set<string>();
                    selectedIds.forEach(id => {
                        const node = nodes.find(n => n.id === id);
                        if (!node || !node.isLocked) {
                            nonLockedSelectedIds.add(id);
                        }
                    });
                    if (nonLockedSelectedIds.size > 0) {
                        const count = nonLockedSelectedIds.size;
                        const confirmMessage = count === 1 
                            ? "Deseja realmente excluir o elemento selecionado?" 
                            : `Deseja realmente excluir os ${count} elementos selecionados?`;
                        
                        setCustomDialog({
                            isOpen: true,
                            type: 'confirm',
                            message: confirmMessage,
                            onConfirm: () => {
                                deleteSelectedElements(nonLockedSelectedIds);
                            },
                            onCancel: () => {}
                        });
                    }
                }
            }
            if (e.key === 'Escape') {
                setLightboxImage(null);
                setSelectedIds(new Set());
                setEditingNodeId(null);
                setShowFormatBar(false);
                setContextMenu(null);
                setConnectionContextMenu(null);
                setCanvasContextMenu(null);
                setConnectingFrom(null);
                setTempConnectionEnd(null);
                setShowPickerPopover(false);
            }
        };
        const up = (e: KeyboardEvent) => {
            if (e.code === 'Space') setSpaceHeld(false);
        };
        const blur = () => setSpaceHeld(false);

        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', blur);
        
        const handlePaste = (e: ClipboardEvent) => {
            const active = document.activeElement as HTMLElement;
            if (active && (active.isContentEditable || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
            
            // Check for images first
            if (e.clipboardData && e.clipboardData.items) {
                const items = Array.from(e.clipboardData.items);
                const imageItem = items.find(item => item.type.startsWith('image/'));
                
                if (imageItem) {
                    const file = imageItem.getAsFile();
                    if (file) {
                        e.preventDefault();
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            const result = ev.target?.result as string;
                            const newNode: CanvasNode = {
                                id: genId(),
                                type: 'image',
                                x: -viewport.x / viewport.zoom + 100,
                                y: -viewport.y / viewport.zoom + 100,
                                width: 200,
                                height: 200,
                                content: result,
                                fileName: 'Pasted Image',
                                zIndex: maxZ() + 1
                            };
                            const updated = [...nodes, newNode];
                            setNodes(updated);
                            saveData(updated, strokes, viewport);
                        };
                        reader.readAsDataURL(file);
                        return; // Prevent text pasting if an image is pasted
                    }
                }
            }

            const text = e.clipboardData?.getData('text/plain')?.trim();
            if (text && /^https?:\/\//i.test(text)) {
                const cx = (-viewport.x + (window.innerWidth) / 2) / viewport.zoom;
                const cy = (-viewport.y + (window.innerHeight) / 2) / viewport.zoom;
                setPasteLinkDialog({ url: text, x: cx, y: cy });
            } else if (text) {
                const cx = (-viewport.x + (window.innerWidth) / 2) / viewport.zoom;
                const cy = (-viewport.y + (window.innerHeight) / 2) / viewport.zoom;
                const newNode: CanvasNode = {
                    id: genId(),
                    type: 'freetext',
                    x: cx - 100,
                    y: cy - 20,
                    width: 220,
                    height: 36,
                    content: text,
                    textColor: '#e2e8f0',
                    zIndex: maxZ() + 1,
                };
                setNodes(prev => {
                    const updated = [...prev, newNode];
                    saveData(updated, strokes, viewport);
                    return updated;
                });
                setSelectedIds(new Set([newNode.id]));
            }
        };
        window.addEventListener('paste', handlePaste);

        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            window.removeEventListener('blur', blur);
            window.removeEventListener('paste', handlePaste);
        };
    }, [selectedIds, nodes, strokes, connections, viewport, deleteSelectedElements, saveData, handleUndo, handleRedo]);



    // ── Node Operations ──

    const addFreeTextAt = useCallback((canvasX: number, canvasY: number) => {
        const newNode: CanvasNode = {
            id: genId(),
            type: 'freetext',
            x: canvasX,
            y: canvasY,
            width: 220,
            height: 36,
            content: '',
            textColor: '#e2e8f0',
            zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        setEditingNodeId(newNode.id);
        setShowFormatBar(true);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const addTextNode = useCallback((canvasX?: number, canvasY?: number) => {
        const cx = canvasX !== undefined ? canvasX : (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = canvasY !== undefined ? canvasY : (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const newNode: CanvasNode = {
            id: genId(), type: 'text', x: cx - 125, y: cy - 70,
            width: 250, height: 140, content: '', zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        setEditingNodeId(newNode.id);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const addFrameNode = useCallback((canvasX?: number, canvasY?: number) => {
        const cx = canvasX !== undefined ? canvasX : (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = canvasY !== undefined ? canvasY : (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const newNode: CanvasNode = {
            id: genId(), type: 'frame', x: cx - 200, y: cy - 150,
            width: 400, height: 300, content: 'Novo Frame', zIndex: maxZ() - 100, // Frames usually stay behind
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const addTableNode = useCallback((canvasX?: number, canvasY?: number) => {
        const cx = canvasX !== undefined ? canvasX : (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = canvasY !== undefined ? canvasY : (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const initialTableData = [
            ['Cabeçalho 1', 'Cabeçalho 2'],
            ['Linha 1', 'Valor 1']
        ];
        const newNode: CanvasNode = {
            id: genId(), type: 'table', x: cx - 150, y: cy - 80,
            width: 300, height: 160, content: '', tableData: initialTableData, zIndex: maxZ() + 1,
            color: '#1e293b', textColor: '#e2e8f0'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const addPageNode = useCallback((canvasX?: number, canvasY?: number) => {
        const cx = canvasX !== undefined ? canvasX : (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = canvasY !== undefined ? canvasY : (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const pageId = genId();
        const targetCanvasId = `canvas_page_${pageId}`; // Ensure unique canvas
        
        createCanvas('Página Sem Título', canvasId, 'page', targetCanvasId);
        onCanvasCreated?.();

        const newNode: CanvasNode = {
            id: pageId, type: 'page', x: cx - 100, y: cy - 40,
            width: 200, height: 80, content: 'Página Sem Título', targetCanvasId, zIndex: maxZ() + 1,
            color: '#0f172a', textColor: '#ffffff'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        setEditingNodeId(newNode.id);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, canvasId, onCanvasCreated]);

    const addChecklistNode = useCallback((canvasX?: number, canvasY?: number) => {
        const cx = canvasX !== undefined ? canvasX : (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = canvasY !== undefined ? canvasY : (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const newNode: CanvasNode = {
            id: genId(), type: 'checklist', x: cx - 130, y: cy - 100,
            width: 260, height: 200, content: 'Novo Checklist', zIndex: maxZ() + 1,
            checklistData: [
                { id: genId(), text: 'Tarefa 1', checked: false },
                { id: genId(), text: 'Tarefa 2', checked: false }
            ]
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const addCardNode = useCallback((canvasX?: number, canvasY?: number) => {
        const cx = canvasX !== undefined ? canvasX : (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = canvasY !== undefined ? canvasY : (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const cardId = genId();
        const targetCanvasId = `canvas_card_${cardId}`;

        createCanvas('Novo Card', canvasId, 'card', targetCanvasId);
        onCanvasCreated?.();

        const newNode: CanvasNode = {
            id: cardId, type: 'card', x: cx - 130, y: cy - 80,
            width: 260, height: 160, content: 'Novo Card', targetCanvasId, zIndex: maxZ() + 1,
            color: '#1e293b' // Elegant slate dark color default
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);

        // Save initial default card content in filesystem
        if (window.api && window.api.cards) {
            window.api.cards.save(cardId, {
                title: 'Novo Card',
                content: '',
                comments: []
            }).catch(err => console.error("Error saving initial card file:", err));
        }
    }, [nodes, strokes, viewport, saveData, canvasId, onCanvasCreated]);

    const addImageNode = useCallback((base64: string, fileName: string) => {
        const cx = (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const newNode: CanvasNode = {
            id: genId(), type: 'image', x: cx - 150, y: cy - 100,
            width: 300, height: 220, content: base64, fileName, zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const addDocumentNode = useCallback((base64: string, fileName: string, fileType: string) => {
        const cx = (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const newNode: CanvasNode = {
            id: genId(), type: 'document', x: cx - 130, y: cy - 30,
            width: 260, height: 72, content: base64, fileName, fileType, zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const addEmojiOrIconNode = useCallback((type: 'emoji' | 'icon', content: string) => {
        const cx = (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        const newNode: CanvasNode = {
            id: genId(),
            type: type,
            x: cx - 35,
            y: cy - 35,
            width: 70,
            height: 70,
            content: content,
            zIndex: maxZ() + 1,
            color: type === 'icon' ? 'rgba(139, 92, 246, 0.2)' : undefined,
            textColor: type === 'icon' ? '#a78bfa' : undefined,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
        setShowPickerPopover(false);
    }, [nodes, strokes, viewport, saveData]);


    const duplicateNode = useCallback((id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;
        const dup: CanvasNode = { ...node, id: genId(), x: node.x + 30, y: node.y + 30, zIndex: maxZ() + 1 };
        const updated = [...nodes, dup];
        setNodes(updated);
        setSelectedIds(new Set([dup.id]));
        setContextMenu(null);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const downloadNode = useCallback((id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        let content = '';
        let filename = 'download';
        let mimeType = 'text/plain';

        if (node.type === 'table' && node.tableData) {
            content = node.tableData.map(row => row.join(',')).join('\n');
            filename = 'tabela.csv';
            mimeType = 'text/csv;charset=utf-8;';
        } else if (node.type === 'checklist' && node.checklistData) {
            content = node.content + '\n\n' + node.checklistData.map(i => `[${i.checked ? 'x' : ' '}] ${i.text}`).join('\n');
            filename = (node.content || 'checklist') + '.txt';
        } else if (node.type === 'image') {
            const a = document.createElement('a');
            a.href = node.content;
            a.download = node.fileName || 'imagem.png';
            a.click();
            setContextMenu(null);
            return;
        } else {
            // Text, Card, FreeText
            content = node.content.replace(/<[^>]*>?/gm, ''); // Strip simple HTML
            filename = 'anotacao.txt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setContextMenu(null);
    }, [nodes]);

    const updateNodeColor = useCallback((id: string, color: string) => {
        setNodes(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, color } : n);
            saveData(updated, strokes, viewport);
            return updated;
        });
    }, [strokes, viewport, saveData]);

    const updateNodeTableData = useCallback((id: string, tableData: string[][]) => {
        setNodes(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, tableData } : n);
            saveData(updated, strokes, viewport);
            return updated;
        });
    }, [strokes, viewport, saveData]);

    const updateNodeTextColor = useCallback((id: string, textColor: string) => {
        setNodes(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, textColor } : n);
            saveData(updated, strokes, viewport);
            return updated;
        });
    }, [strokes, viewport, saveData]);

    const applyFormat = useCallback((command: string, value: string = '') => {
        document.execCommand(command, false, value);
    }, []);

    const insertLine = useCallback(() => {
        document.execCommand('insertHorizontalRule', false);
    }, []);

    const adjustFontSize = useCallback((delta: number) => {
        if (!editingNodeId) return;
        setNodes(prev => {
            const updated = prev.map(n => {
                if (n.id === editingNodeId) {
                    const currentSize = n.fontSize || (n.type === 'freetext' ? 15 : 14);
                    const newSize = Math.max(8, Math.min(72, currentSize + delta));
                    return { ...n, fontSize: newSize };
                }
                return n;
            });
            saveData(updated, strokes, viewport);
            return updated;
        });
    }, [editingNodeId, strokes, viewport, saveData]);

    const saveNodeContent = useCallback((id: string, content: string) => {
        setNodes(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, content } : n);
            debouncedSaveCanvasData(canvasId, { nodes: updated, strokes, connections, viewport });
            return updated;
        });
    }, [canvasId, strokes, connections, viewport]);

    // ── Connections Operations ──

    const handleConnectStart = (e: React.MouseEvent, nodeId: string, side: 'n' | 'e' | 's' | 'w') => {
        e.stopPropagation();
        e.preventDefault();
        setConnectingFrom({ nodeId, side });
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setTempConnectionEnd(canvasPos);
    };

    const handleConnectionContextMenu = (e: React.MouseEvent, connectionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setConnectionContextMenu({ x: e.clientX, y: e.clientY, connectionId });
    };

    const deleteConnection = useCallback((id: string) => {
        setConnections(prev => {
            const updated = prev.filter(c => c.id !== id);
            saveData(nodes, strokes, viewport, updated);
            return updated;
        });
        setConnectionContextMenu(null);
    }, [nodes, strokes, viewport, saveData]);

    const renderShape = (node: CanvasNode) => {
        const strokeColor = node.color || '#a78bfa';
        const strokeWidth = node.shapeStrokeWidth || 2;
        const strokeStyle = node.shapeStrokeStyle || 'solid';
        const fillColor = node.shapeFillColor || 'transparent';
        const isRough = node.shapeRoughness !== 0; // default is sketchy (roughness = 1)
        const filter = isRough ? "url(#rough-filter)" : undefined;

        const strokeDasharray = strokeStyle === 'dashed' ? '6 6' : strokeStyle === 'dotted' ? '2 4' : undefined;

        switch (node.shapeType) {
            case 'rectangle':
                return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${node.width} ${node.height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <rect
                            x={strokeWidth / 2}
                            y={strokeWidth / 2}
                            width={Math.max(1, node.width - strokeWidth)}
                            height={Math.max(1, node.height - strokeWidth)}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            fill={fillColor}
                            rx={4}
                            ry={4}
                            filter={filter}
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray={strokeDasharray}
                        />
                    </svg>
                );
            case 'ellipse':
                return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${node.width} ${node.height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <ellipse
                            cx={node.width / 2}
                            cy={node.height / 2}
                            rx={Math.max(1, (node.width - strokeWidth) / 2)}
                            ry={Math.max(1, (node.height - strokeWidth) / 2)}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            fill={fillColor}
                            filter={filter}
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray={strokeDasharray}
                        />
                    </svg>
                );
            case 'diamond': {
                const w = node.width;
                const h = node.height;
                const pts = `${w/2},${strokeWidth/2} ${w - strokeWidth/2},${h/2} ${w/2},${h - strokeWidth/2} ${strokeWidth/2},${h/2}`;
                return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <polygon
                            points={pts}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            fill={fillColor}
                            filter={filter}
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray={strokeDasharray}
                        />
                    </svg>
                );
            }
            case 'line': {
                const x1 = node.flipped ? node.width : 0;
                const y1 = node.flipped ? node.height : 0;
                const x2 = node.flipped ? 0 : node.width;
                const y2 = node.flipped ? 0 : node.height;
                return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${node.width} ${node.height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            filter={filter}
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray={strokeDasharray}
                        />
                    </svg>
                );
            }
            case 'arrow': {
                const x1 = node.flipped ? node.width : 0;
                const y1 = node.flipped ? node.height : 0;
                const x2 = node.flipped ? 0 : node.width;
                const y2 = node.flipped ? 0 : node.height;
                
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const L = 14; // Arrowhead size
                const arrowTip1X = x2 - L * Math.cos(angle - Math.PI / 6);
                const arrowTip1Y = y2 - L * Math.sin(angle - Math.PI / 6);
                const arrowTip2X = x2 - L * Math.cos(angle + Math.PI / 6);
                const arrowTip2Y = y2 - L * Math.sin(angle + Math.PI / 6);

                const pathD = `M ${x1} ${y1} L ${x2} ${y2} M ${arrowTip1X} ${arrowTip1Y} L ${x2} ${y2} L ${arrowTip2X} ${arrowTip2Y}`;
                return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${node.width} ${node.height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <path d={pathD} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" filter={filter} vectorEffect="non-scaling-stroke" strokeDasharray={strokeDasharray} />
                    </svg>
                );
            }
            case 'triangle': {
                const w = node.width;
                const h = node.height;
                const pts = `${w/2},${strokeWidth/2} ${w - strokeWidth/2},${h - strokeWidth/2} ${strokeWidth/2},${h - strokeWidth/2}`;
                return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <polygon points={pts} stroke={strokeColor} strokeWidth={strokeWidth} fill={fillColor} filter={filter} vectorEffect="non-scaling-stroke" strokeDasharray={strokeDasharray} />
                    </svg>
                );
            }
            case 'blockArrow': {
                const w = node.width;
                const h = node.height;
                const hw = w * 0.6; 
                const pts = `${strokeWidth/2},${h*0.3} ${hw},${h*0.3} ${hw},${strokeWidth/2} ${w-strokeWidth/2},${h/2} ${hw},${h-strokeWidth/2} ${hw},${h*0.7} ${strokeWidth/2},${h*0.7}`;
                return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <polygon points={pts} stroke={strokeColor} strokeWidth={strokeWidth} fill={fillColor} filter={filter} vectorEffect="non-scaling-stroke" strokeDasharray={strokeDasharray} />
                    </svg>
                );
            }
            case 'elbowArrow': {
                const x1 = node.flipped ? node.width : 0;
                const y1 = node.flipped ? node.height : 0;
                const x2 = node.flipped ? 0 : node.width;
                const y2 = node.flipped ? 0 : node.height;
                const midX = x1 + (x2 - x1) / 2;
                const pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                const angle = Math.atan2(0, x2 > x1 ? 1 : -1);
                const L = 14; 
                const arrowTip1X = x2 - L * Math.cos(angle - Math.PI / 6);
                const arrowTip1Y = y2 - L * Math.sin(angle - Math.PI / 6);
                const arrowTip2X = x2 - L * Math.cos(angle + Math.PI / 6);
                const arrowTip2Y = y2 - L * Math.sin(angle + Math.PI / 6);
                const finalPathD = `${pathD} M ${arrowTip1X} ${arrowTip1Y} L ${x2} ${y2} L ${arrowTip2X} ${arrowTip2Y}`;
                return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${node.width} ${node.height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <path d={finalPathD} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" filter={filter} vectorEffect="non-scaling-stroke" strokeDasharray={strokeDasharray} />
                    </svg>
                );
            }
            default:
                return null;
        }
    };

    const getNodeSidePos = (node: CanvasNode, side: 'n' | 'e' | 's' | 'w') => {
        switch (side) {
            case 'n': return { x: node.x + node.width / 2, y: node.y };
            case 'e': return { x: node.x + node.width, y: node.y + node.height / 2 };
            case 's': return { x: node.x + node.width / 2, y: node.y + node.height };
            case 'w': return { x: node.x, y: node.y + node.height / 2 };
        }
    };

    const getBezierPath = (nodeFrom: CanvasNode, sideFrom: 'n' | 'e' | 's' | 'w', nodeTo: CanvasNode, sideTo: 'n' | 'e' | 's' | 'w') => {
        const p1 = getNodeSidePos(nodeFrom, sideFrom);
        const p2 = getNodeSidePos(nodeTo, sideTo);
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const controlDist = Math.min(150, Math.max(40, dist * 0.4)); // Estilo mais controlado e previsível

        const getOffset = (side: 'n' | 'e' | 's' | 'w', distVal: number) => {
            switch (side) {
                case 'n': return { dx: 0, dy: -distVal };
                case 'e': return { dx: distVal, dy: 0 };
                case 's': return { dx: 0, dy: distVal };
                case 'w': return { dx: -distVal, dy: 0 };
            }
        };

        const offset1 = getOffset(sideFrom, controlDist);
        const offset2 = getOffset(sideTo, controlDist);

        const cp1x = p1.x + offset1.dx;
        const cp1y = p1.y + offset1.dy;
        const cp2x = p2.x + offset2.dx;
        const cp2y = p2.y + offset2.dy;

        // Aproximação do ponto central da curva bezier cúbica (t=0.5)
        const midX = 0.125 * p1.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * p2.x;
        const midY = 0.125 * p1.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * p2.y;

        return { path: `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`, midX, midY };
    };

    const getTempBezierPath = () => {
        if (!connectingFrom || !tempConnectionEnd) return '';
        const node = nodes.find(n => n.id === connectingFrom.nodeId);
        if (!node) return '';
        const p1 = getNodeSidePos(node, connectingFrom.side);
        const p2 = tempConnectionEnd;
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const controlDist = Math.min(150, Math.max(40, dist * 0.4));

        const getOffset = (side: 'n' | 'e' | 's' | 'w', distVal: number) => {
            switch (side) {
                case 'n': return { dx: 0, dy: -distVal };
                case 'e': return { dx: distVal, dy: 0 };
                case 's': return { dx: 0, dy: distVal };
                case 'w': return { dx: -distVal, dy: 0 };
            }
        };

        const offset1 = getOffset(connectingFrom.side, controlDist);
        const cp1x = p1.x + offset1.dx;
        const cp1y = p1.y + offset1.dy;

        return `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${p2.x} ${p2.y}, ${p2.x} ${p2.y}`;
    };

    // ── Mouse & Touch Events for Canvas ──

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        if (viewMode === 'page') return;
        if (e.target !== containerRef.current && (e.target as Element).className !== styles.dotGrid && (e.target as Element).className !== styles.canvasSurface && (e.target as Element).tagName.toLowerCase() !== 'svg') return;
        
        try {
            const target = e.target as HTMLElement;
            if (!target) return;
            const isBackground = target === containerRef.current || 
                (target.classList && typeof target.classList.contains === 'function' && target.classList.contains(styles.dotGrid)) ||
                target.tagName === 'svg' || 
                target.tagName === 'polyline' || 
                target.tagName === 'path';

            if (!isBackground) return;

            setContextMenu(null);
            setConnectionContextMenu(null);
            setCanvasContextMenu(null);
            setShowPickerPopover(false);

            // Geometric Shape mode drawing
            const isShapeTool = ['rectangle', 'diamond', 'ellipse', 'line', 'arrow', 'triangle', 'blockArrow', 'elbowArrow'].includes(activeTool);
            if (isShapeTool && e.button === 0 && !spaceHeld) {
                const pos = screenToCanvas(e.clientX, e.clientY);
                setIsDrawingShape(true);
                setCurrentShapeStart(pos);
                setCurrentShapeTemp(null);
                return;
            }

            // Pen / Arrow Pen mode drawing
            if ((penMode || arrowPenMode) && e.button === 0 && !spaceHeld) {
                const pos = screenToCanvas(e.clientX, e.clientY);
                setIsDrawing(true);
                setCurrentStroke([pos]);
                return;
            }

            // Panning: space held OR middle mouse OR right mouse click
            if (spaceHeld || e.button === 1 || e.button === 2) {
                setIsPanning(true);
                setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
                return;
            }

            // Left click = Rubber Band Box Selection by default!
            if (e.button === 0) {
                setIsSelecting(true);
                selectionStartRef.current = { x: e.clientX, y: e.clientY };
                setSelectionRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
                
                // Clear active selection unless shift is held
                if (!e.shiftKey) {
                    setSelectedIds(new Set());
                    setEditingNodeId(null);
                    setShowFormatBar(false);
                }
            }
        } catch (err) {
            console.error("Canvas mouse down error:", err);
        }
    }, [viewport, activeTool, penMode, arrowPenMode, spaceHeld, viewMode]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        if (viewMode === 'page') return;
        if (connectingFrom) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            setTempConnectionEnd(pos);
            return;
        }

        if (isDrawingShape && currentShapeStart) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            let width = Math.abs(pos.x - currentShapeStart.x);
            let height = Math.abs(pos.y - currentShapeStart.y);
            
            if (e.shiftKey) {
                const maxDim = Math.max(width, height);
                width = maxDim;
                height = maxDim;
            }

            width = Math.max(5, width);
            height = Math.max(5, height);

            const x = pos.x < currentShapeStart.x ? currentShapeStart.x - width : currentShapeStart.x;
            const y = pos.y < currentShapeStart.y ? currentShapeStart.y - height : currentShapeStart.y;
            const flipped = (pos.x - currentShapeStart.x) * (pos.y - currentShapeStart.y) < 0;
            setCurrentShapeTemp({ x, y, width, height, flipped });
            return;
        }

        if (isDrawing) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            setCurrentStroke(prev => [...prev, pos]);
            return;
        }

        if (isPanning) {
            setViewport(v => ({ ...v, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
            return;
        }

        if (isSelecting) {
            const sx = selectionStartRef.current.x;
            const sy = selectionStartRef.current.y;
            setSelectionRect({
                x: Math.min(sx, e.clientX),
                y: Math.min(sy, e.clientY),
                w: Math.abs(e.clientX - sx),
                h: Math.abs(e.clientY - sy),
            });
        }
    }, [isPanning, dragStart, isDrawing, isSelecting, connectingFrom, viewMode, isDrawingShape, currentShapeStart]);

    const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
        if (viewMode === 'page') return;
        if (connectingFrom) {
            const dropPos = screenToCanvas(e.clientX, e.clientY);
            const targetNode = nodes.find(n => {
                if (n.id === connectingFrom.nodeId) return false;
                return dropPos.x >= n.x && dropPos.x <= n.x + n.width &&
                       dropPos.y >= n.y && dropPos.y <= n.y + n.height;
            });

            if (targetNode) {
                const centerX = targetNode.x + targetNode.width / 2;
                const centerY = targetNode.y + targetNode.height / 2;
                const dx = dropPos.x - centerX;
                const dy = dropPos.y - centerY;
                let toSide: 'n' | 'e' | 's' | 'w' = 'w';
                if (Math.abs(dx) > Math.abs(dy)) {
                    toSide = dx > 0 ? 'e' : 'w';
                } else {
                    toSide = dy > 0 ? 's' : 'n';
                }

                const newConnection: CanvasConnection = {
                    id: genId(),
                    fromId: connectingFrom.nodeId,
                    fromSide: connectingFrom.side,
                    toId: targetNode.id,
                    toSide: toSide,
                };
                setConnections(prev => {
                    const updated = [...prev, newConnection];
                    saveData(nodes, strokes, viewport, updated);
                    return updated;
                });
            }

            setConnectingFrom(null);
            setTempConnectionEnd(null);
            return;
        }

        if (isDrawingShape && currentShapeStart) {
            setIsDrawingShape(false);
            let finalShape = currentShapeTemp;
            if (!finalShape || (finalShape.width <= 5 && finalShape.height <= 5)) {
                let defaultW = 100;
                let defaultH = 100;
                switch(activeTool) {
                    case 'rectangle': defaultW = 150; defaultH = 100; break;
                    case 'ellipse': defaultW = 120; defaultH = 120; break;
                    case 'diamond': defaultW = 120; defaultH = 120; break;
                    case 'line': defaultW = 150; defaultH = 5; break;
                    case 'arrow': defaultW = 150; defaultH = 5; break;
                    case 'triangle': defaultW = 120; defaultH = 100; break;
                    case 'blockArrow': defaultW = 150; defaultH = 80; break;
                    case 'elbowArrow': defaultW = 120; defaultH = 120; break;
                }
                finalShape = {
                    x: currentShapeStart.x - defaultW / 2,
                    y: currentShapeStart.y - defaultH / 2,
                    width: defaultW,
                    height: defaultH,
                    flipped: false
                } as any;
            }

            if (finalShape && finalShape.width > 5 && finalShape.height > 5) {
                const shapeNode: CanvasNode = {
                    id: genId(),
                    type: 'shape',
                    shapeType: activeTool as any,
                    x: finalShape.x,
                    y: finalShape.y,
                    width: finalShape.width,
                    height: finalShape.height,
                    flipped: finalShape.flipped,
                    content: '',
                    color: currentStrokeColor,
                    shapeStrokeWidth: currentStrokeWidth,
                    shapeStrokeStyle: currentStrokeStyle,
                    shapeFillColor: currentFillColor,
                    shapeRoughness: currentShapeRoughness,
                    zIndex: maxZ() + 1,
                };
                setNodes(prev => {
                    const updated = [...prev, shapeNode];
                    saveData(updated, strokes, viewport);
                    return updated;
                });
                setSelectedIds(new Set([shapeNode.id]));
                
                if (!isToolLocked) {
                    setActiveTool('select');
                }
            }
            setCurrentShapeStart(null);
            setCurrentShapeTemp(null);
            return;
        }

        if (isDrawing) {
            setIsDrawing(false);
            if (currentStroke.length > 1) {
                const newStroke: Stroke = { 
                    id: genId(), 
                    points: currentStroke, 
                    color: PEN_COLOR, 
                    width: PEN_WIDTH,
                    isArrow: arrowPenMode 
                };
                setStrokes(prev => {
                    const updated = [...prev, newStroke];
                    saveData(nodes, updated, viewport);
                    return updated;
                });
            }
            setCurrentStroke([]);
            return;
        }

        if (isPanning) {
            setIsPanning(false);
            saveData(nodes, strokes, viewport);
            return;
        }

        if (isSelecting && selectionRect) {
            setIsSelecting(false);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect && selectionRect.w > 5 && selectionRect.h > 5) {
                const selLeft = (selectionRect.x - rect.left - viewport.x) / viewport.zoom;
                const selTop = (selectionRect.y - rect.top - viewport.y) / viewport.zoom;
                const selRight = selLeft + selectionRect.w / viewport.zoom;
                const selBottom = selTop + selectionRect.h / viewport.zoom;

                const newSelected = new Set<string>();
                nodes.forEach(n => {
                    const nRight = n.x + n.width;
                    const nBottom = n.y + n.height;
                    if (n.x < selRight && nRight > selLeft && n.y < selBottom && nBottom > selTop) {
                        newSelected.add(n.id);
                    }
                });
                setSelectedIds(newSelected);
            }
            setSelectionRect(null);
        }
    }, [isPanning, isDrawing, isSelecting, selectionRect, currentStroke, nodes, strokes, connections, viewport, connectingFrom, arrowPenMode, saveData, isDrawingShape, currentShapeStart, currentShapeTemp, activeTool, currentStrokeColor, currentStrokeWidth, currentStrokeStyle, currentFillColor, currentShapeRoughness, isToolLocked]);

    // ── Touch Events for Canvas (Mobile/Tablet Support) ──
    const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
        if (viewMode === 'page') return;
        
        if (e.touches.length === 2) {
            // Pinch-to-zoom start
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            initialPinchDist.current = dist;
            setIsPanning(false);
            setIsDrawing(false);
            setIsDrawingShape(false);
            setIsSelecting(false);
            return;
        }

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            lastTouchPos.current = { x: touch.clientX, y: touch.clientY };

            const target = e.target as HTMLElement;
            if (!target) return;
            const isBackground = target === containerRef.current || 
                (target.classList && typeof target.classList.contains === 'function' && target.classList.contains(styles.dotGrid)) ||
                target.tagName === 'svg' || 
                target.tagName === 'polyline' || 
                target.tagName === 'path';

            if (!isBackground) return;

            setContextMenu(null);
            setConnectionContextMenu(null);
            setCanvasContextMenu(null);
            setShowPickerPopover(false);

            const isShapeTool = ['rectangle', 'diamond', 'ellipse', 'line', 'arrow', 'triangle', 'blockArrow', 'elbowArrow'].includes(activeTool);
            if (isShapeTool) {
                const pos = screenToCanvas(touch.clientX, touch.clientY);
                setIsDrawingShape(true);
                setCurrentShapeStart(pos);
                setCurrentShapeTemp(null);
                return;
            }

            if (penMode || arrowPenMode) {
                const pos = screenToCanvas(touch.clientX, touch.clientY);
                setIsDrawing(true);
                setCurrentStroke([pos]);
                return;
            }

            // Default on mobile: 1 finger pans the canvas if it's select tool and tapped on background
            setIsPanning(true);
            setDragStart({ x: touch.clientX - viewport.x, y: touch.clientY - viewport.y });
        }
    }, [viewMode, activeTool, penMode, arrowPenMode, viewport]);

    const handleCanvasTouchMove = useCallback((e: React.TouchEvent) => {
        if (viewMode === 'page') return;

        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            
            if (initialPinchDist.current) {
                const scaleDiff = dist / initialPinchDist.current;
                
                setViewport(v => {
                    const c = containerRef.current;
                    const cx = c ? c.clientWidth / 2 : touch1.clientX;
                    const cy = c ? c.clientHeight / 2 : touch1.clientY;
                    
                    let z = v.zoom * scaleDiff;
                    z = Math.min(Math.max(MIN_ZOOM, z), MAX_ZOOM);
                    
                    // Simple center zoom
                    const newX = cx - (cx - v.x) * (z / v.zoom);
                    const newY = cy - (cy - v.y) * (z / v.zoom);

                    return { x: newX, y: newY, zoom: z };
                });
            }
            initialPinchDist.current = dist;
            return;
        }

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            lastTouchPos.current = { x: touch.clientX, y: touch.clientY };

            if (isDrawingShape && currentShapeStart) {
                const pos = screenToCanvas(touch.clientX, touch.clientY);
                let width = Math.max(5, Math.abs(pos.x - currentShapeStart.x));
                let height = Math.max(5, Math.abs(pos.y - currentShapeStart.y));
                const x = pos.x < currentShapeStart.x ? currentShapeStart.x - width : currentShapeStart.x;
                const y = pos.y < currentShapeStart.y ? currentShapeStart.y - height : currentShapeStart.y;
                const flipped = (pos.x - currentShapeStart.x) * (pos.y - currentShapeStart.y) < 0;
                setCurrentShapeTemp({ x, y, width, height, flipped });
                return;
            }

            if (isDrawing) {
                const pos = screenToCanvas(touch.clientX, touch.clientY);
                setCurrentStroke(prev => [...prev, pos]);
                return;
            }

            if (isPanning) {
                setViewport(v => ({ ...v, x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y }));
                return;
            }
        }
    }, [viewMode, isDrawingShape, currentShapeStart, isDrawing, isPanning, dragStart]);

    const handleCanvasTouchEnd = useCallback((e: React.TouchEvent) => {
        if (viewMode === 'page') return;
        initialPinchDist.current = null;

        if (isDrawingShape && currentShapeStart) {
            setIsDrawingShape(false);
            let finalShape = currentShapeTemp;
            if (!finalShape || (finalShape.width <= 5 && finalShape.height <= 5)) {
                finalShape = {
                    x: currentShapeStart.x - 50,
                    y: currentShapeStart.y - 50,
                    width: 100,
                    height: 100,
                    flipped: false
                } as any;
            }

            if (finalShape) {
                const shapeNode: CanvasNode = {
                    id: genId(),
                    type: 'shape',
                    shapeType: activeTool as any,
                    x: finalShape.x,
                    y: finalShape.y,
                    width: finalShape.width,
                    height: finalShape.height,
                    flipped: finalShape.flipped,
                    content: '',
                    color: currentStrokeColor,
                    shapeStrokeWidth: currentStrokeWidth,
                    shapeStrokeStyle: currentStrokeStyle,
                    shapeFillColor: currentFillColor,
                    shapeRoughness: currentShapeRoughness,
                    zIndex: maxZ() + 1,
                };
                setNodes(prev => {
                    const updated = [...prev, shapeNode];
                    saveData(updated, strokes, viewport);
                    return updated;
                });
                setSelectedIds(new Set([shapeNode.id]));
                if (!isToolLocked) setActiveTool('select');
            }
            setCurrentShapeStart(null);
            setCurrentShapeTemp(null);
            return;
        }

        if (isDrawing) {
            setIsDrawing(false);
            if (currentStroke.length > 1) {
                const newStroke: Stroke = { 
                    id: genId(), 
                    points: currentStroke, 
                    color: PEN_COLOR, 
                    width: PEN_WIDTH,
                    isArrow: arrowPenMode 
                };
                setStrokes(prev => {
                    const updated = [...prev, newStroke];
                    saveData(nodes, updated, viewport);
                    return updated;
                });
            }
            setCurrentStroke([]);
            return;
        }

        if (isPanning) {
            setIsPanning(false);
            saveData(nodes, strokes, viewport);
            return;
        }
    }, [viewMode, isDrawingShape, currentShapeStart, currentShapeTemp, activeTool, currentStrokeColor, currentStrokeWidth, currentStrokeStyle, currentFillColor, currentShapeRoughness, isToolLocked, isDrawing, currentStroke, arrowPenMode, isPanning, nodes, strokes, viewport, saveData]);

    // ── Double-click to insert free text (Fixed classList TypeError safe check) ──
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        try {
            const target = e.target as HTMLElement;
            if (!target) return;
            const isBackground = target === containerRef.current || 
                (target.classList && typeof target.classList.contains === 'function' && target.classList.contains(styles.dotGrid)) ||
                target.tagName === 'svg' || 
                target.tagName === 'polyline' || 
                target.tagName === 'path';

            if (!isBackground || penMode || arrowPenMode) return;

            const pos = screenToCanvas(e.clientX, e.clientY);
            addFreeTextAt(pos.x, pos.y);
        } catch (err) {
            console.error("Double click handler error:", err);
        }
    }, [penMode, arrowPenMode, addFreeTextAt]);

    const zoomIn = useCallback(() => {
        const c = containerRef.current; if (!c) return;
        const cx = c.clientWidth / 2; const cy = c.clientHeight / 2;
        const z = Math.min(MAX_ZOOM, viewport.zoom * 1.2);
        const v = { x: cx - (cx - viewport.x) * (z / viewport.zoom), y: cy - (cy - viewport.y) * (z / viewport.zoom), zoom: z };
        setViewport(v); saveData(nodes, strokes, v);
    }, [viewport, nodes, strokes, saveData]);

    const zoomOut = useCallback(() => {
        const c = containerRef.current; if (!c) return;
        const cx = c.clientWidth / 2; const cy = c.clientHeight / 2;
        const z = Math.max(MIN_ZOOM, viewport.zoom / 1.2);
        const v = { x: cx - (cx - viewport.x) * (z / viewport.zoom), y: cy - (cy - viewport.y) * (z / viewport.zoom), zoom: z };
        setViewport(v); saveData(nodes, strokes, v);
    }, [viewport, nodes, strokes, saveData]);

    const resetZoom = useCallback(() => {
        const v = { x: 0, y: 0, zoom: 1 }; setViewport(v); saveData(nodes, strokes, v);
    }, [nodes, strokes, saveData]);

    // ── Node Drag (with Grid Snapping support) ──

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setContextMenu(null);
        setConnectionContextMenu(null);
        setCanvasContextMenu(null);

        const wasAlreadySelected = selectedIds.has(nodeId);

        if (e.shiftKey) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
                return next;
            });
            return;
        }

        if (!wasAlreadySelected) {
            setSelectedIds(new Set([nodeId]));
        }

        const dragIds = new Set(wasAlreadySelected ? Array.from(selectedIds) : [nodeId]);
        
        // --- Frame Group Dragging Logic ---
        const initialNodesArray = Array.from(dragIds).map(id => nodes.find(n => n.id === id)).filter(Boolean) as CanvasNode[];
        const frames = initialNodesArray.filter(n => n.type === 'frame');
        
        frames.forEach(frame => {
            nodes.forEach(n => {
                if (n.id === frame.id) return;
                const cx = n.x + n.width / 2;
                const cy = n.y + n.height / 2;
                if (cx >= frame.x && cx <= frame.x + frame.width && cy >= frame.y && cy <= frame.y + frame.height) {
                    dragIds.add(n.id);
                }
            });
        });

        const startX = e.clientX;
        const startY = e.clientY;
        const origins = new Map<string, { x: number; y: number }>();
        nodes.forEach(n => { if (dragIds.has(n.id)) origins.set(n.id, { x: n.x, y: n.y }); });
        const z = maxZ() + 1;
        let moved = false;

        const handleMove = (me: MouseEvent) => {
            const dx = (me.clientX - startX) / viewport.zoom;
            const dy = (me.clientY - startY) / viewport.zoom;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
            if (!moved) return;

            // Clear text selection and exit edit mode to prevent horizontal dragging issues
            me.preventDefault();
            setEditingNodeId(null);
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            window.getSelection()?.removeAllRanges();

            setNodes(prev => prev.map(n => {
                const orig = origins.get(n.id);
                if (!orig) return n;
                if (n.isLocked) return n; // Keep it locked, do not move!
                let newX = orig.x + dx;
                let newY = orig.y + dy;
                
                // Snap to Grid 24px
                if (gridSnap) {
                    newX = Math.round(newX / 24) * 24;
                    newY = Math.round(newY / 24) * 24;
                }
                return { ...n, x: newX, y: newY, zIndex: z };
            }));
        };

        const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            if (moved) {
                setNodes(prev => {
                    requestAnimationFrame(() => saveData(prev, strokes, viewport));
                    return prev;
                });
            } else if (wasAlreadySelected) {
                const node = nodes.find(n => n.id === nodeId);
                if (node && !node.isLocked) {
                    if (node.type === 'text' || node.type === 'freetext' || node.type === 'shape') {
                        setEditingNodeId(nodeId);
                        setShowFormatBar(true);
                    } else if (node.type === 'card') {
                        setActiveCardId(nodeId);
                        setActiveCardMode('popup');
                    }
                }
            }
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    }, [nodes, viewport, strokes, selectedIds, gridSnap, saveData, setEditingNodeId]);

    // ── Node Resize (with Grid Snapping support) ──

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, nodeId: string, corner: string) => {
        e.stopPropagation();
        e.preventDefault();

        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.isLocked) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const { x: origX, y: origY, width: origW, height: origH } = node;

        const handleMove = (me: MouseEvent) => {
            let dx = (me.clientX - startX) / viewport.zoom;
            let dy = (me.clientY - startY) / viewport.zoom;

            if (me.shiftKey) {
                const ratio = origH / origW;
                if (Math.abs(dx) > Math.abs(dy)) {
                    dy = dx * ratio * (Math.sign(dx * dy) === -1 && corner.length === 2 && corner[0] !== corner[1] ? -1 : 1);
                } else {
                    dx = dy / ratio * (Math.sign(dx * dy) === -1 && corner.length === 2 && corner[0] !== corner[1] ? -1 : 1);
                }
            }

            let newX = origX, newY = origY, newW = origW, newH = origH;

            if (corner.includes('e')) { 
                newW = Math.max(30, origW + dx); 
                if (gridSnap) newW = Math.round(newW / 24) * 24;
            }
            if (corner.includes('w')) { 
                newW = Math.max(30, origW - dx); 
                if (gridSnap) newW = Math.round(newW / 24) * 24;
                newX = origX + origW - newW; 
            }
            if (corner.includes('s')) { 
                newH = Math.max(30, origH + dy); 
                if (gridSnap) newH = Math.round(newH / 24) * 24;
            }
            if (corner.includes('n')) { 
                newH = Math.max(30, origH - dy); 
                if (gridSnap) newH = Math.round(newH / 24) * 24;
                newY = origY + origH - newH; 
            }

            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: newX, y: newY, width: newW, height: newH } : n));
        };

        const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            setNodes(prev => {
                requestAnimationFrame(() => saveData(prev, strokes, viewport));
                return prev;
            });
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    }, [nodes, viewport, strokes, gridSnap, saveData]);

    // ── Double-click on node: enter edit mode ──
    const handleNodeDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.isLocked) return;
        if (node && (node.type === 'text' || node.type === 'freetext')) {
            setEditingNodeId(nodeId);
            setShowFormatBar(true);
        } else if (node && node.type === 'card') {
            setActiveCardId(nodeId);
            setActiveCardMode('popup');
        }
    }, [nodes]);

    // ── Image Manipulation ──
    const resizeImage = useCallback((nodeId: string, scale: number) => {
        setNodes(prev => {
            const next = prev.map(n => {
                if (n.id === nodeId && n.width && n.height && n.type === 'image') {
                    return { ...n, width: n.width * scale, height: n.height * scale };
                }
                return n;
            });
            saveData(next, strokes, viewport, connections);
            return next;
        });
        setContextMenu(null);
    }, [strokes, viewport, connections]);

    const restoreOriginalProportion = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !node.content || node.type !== 'image') return;
        const img = new globalThis.Image();
        img.onload = () => {
            setNodes(prev => {
                const next = prev.map(n => {
                    if (n.id === nodeId) {
                        return { ...n, width: img.width, height: img.height };
                    }
                    return n;
                });
                saveData(next, strokes, viewport, connections);
                return next;
            });
            setContextMenu(null);
        };
        img.src = node.content;
    }, [nodes, strokes, viewport, connections]);

    // ── Right-Click Context Menu ──
    const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedIds.has(nodeId)) setSelectedIds(new Set([nodeId]));
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    }, [selectedIds]);

    // ── Pen Tool: clear strokes ──
    const clearStrokes = useCallback(() => {
        setStrokes([]);
        saveData(nodes, [], viewport);
    }, [nodes, viewport, saveData]);

    // ── File Uploads ──
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => addImageNode(reader.result as string, file.name);
        reader.readAsDataURL(file); e.target.value = '';
    }, [addImageNode]);

    const handleDocUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => addDocumentNode(reader.result as string, file.name, file.type);
        reader.readAsDataURL(file); e.target.value = '';
    }, [addDocumentNode]);

    // ── Drag & Drop files ──
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        Array.from(e.dataTransfer.files).forEach(file => {
            const r = new FileReader();
            r.onload = () => {
                const res = r.result as string;
                if (file.type.startsWith('image/')) addImageNode(res, file.name);
                else addDocumentNode(res, file.name, file.type);
            };
            r.readAsDataURL(file);
        });
    }, [addImageNode, addDocumentNode]);

    // ── Grid Style ──
    const gridSize = (24 * (viewport?.zoom || 1)) || 24;
    const gridOffsetX = (viewport?.x || 0) % gridSize;
    const gridOffsetY = (viewport?.y || 0) % gridSize;
    const dotSize = Math.max(0.8, viewport?.zoom || 1);
    const gridStyle: React.CSSProperties = {
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
    };

    // ── SVG path for strokes ──
    const strokeToPath = (points: { x: number; y: number }[]) => {
        if (points.length < 2) return '';
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    };

    // ── Resize handles renderer (Corners & Edges) ──
    const renderResizeHandles = (nodeId: string, isSelected: boolean) => {
        if (!isSelected) return null;
        const node = nodes.find(n => n.id === nodeId);
        if (node?.isLocked) return null;
        
        const corners = [
            { key: 'nw', cursor: 'nwse-resize', style: { top: -4, left: -4 } },
            { key: 'ne', cursor: 'nesw-resize', style: { top: -4, right: -4 } },
            { key: 'sw', cursor: 'nesw-resize', style: { bottom: -4, left: -4 } },
            { key: 'se', cursor: 'nwse-resize', style: { bottom: -4, right: -4 } },
        ];

        const edges = [
            { key: 'n', className: `${styles.resizeEdge} ${styles.resizeEdgeNS}`, style: { top: -4, left: 4, right: 4 } },
            { key: 's', className: `${styles.resizeEdge} ${styles.resizeEdgeNS}`, style: { bottom: -4, left: 4, right: 4 } },
            { key: 'e', className: `${styles.resizeEdge} ${styles.resizeEdgeEW}`, style: { right: -4, top: 4, bottom: 4 } },
            { key: 'w', className: `${styles.resizeEdge} ${styles.resizeEdgeEW}`, style: { left: -4, top: 4, bottom: 4 } },
        ];

        return (
            <>
                {corners.map(c => (
                    <div
                        key={c.key}
                        className={styles.resizeCorner}
                        style={{ ...c.style, cursor: c.cursor } as React.CSSProperties}
                        onMouseDown={(e) => handleResizeMouseDown(e, nodeId, c.key)}
                    />
                ))}
                {edges.map(e => (
                    <div
                        key={e.key}
                        className={e.className}
                        style={e.style as React.CSSProperties}
                        onMouseDown={(evt) => handleResizeMouseDown(evt, nodeId, e.key)}
                    />
                ))}
            </>
        );
    };

    // ── Connection handles renderer (North, East, South, West) ──
    const renderConnectionHandles = (nodeId: string, isSelected: boolean) => {
        if (!isSelected && hoveredNodeId !== nodeId) return null;
        const handles: { side: 'n' | 'e' | 's' | 'w'; style: React.CSSProperties; title: string }[] = [
            { side: 'n', style: { top: -16, left: '50%', transform: 'translateX(-50%)' }, title: 'Conectar no Topo' },
            { side: 'e', style: { top: '50%', right: -16, transform: 'translateY(-50%)' }, title: 'Conectar na Direita' },
            { side: 's', style: { bottom: -16, left: '50%', transform: 'translateX(-50%)' }, title: 'Conectar Embaixo' },
            { side: 'w', style: { top: '50%', left: -16, transform: 'translateY(-50%)' }, title: 'Conectar na Esquerda' },
        ];
        return handles.map(h => (
            <div
                key={h.side}
                className={`${styles.connectionHandle} ${styles[`handle-${h.side}`]}`}
                style={h.style}
                onMouseDown={(e) => handleConnectStart(e, nodeId, h.side)}
                title={h.title}
            >
                <div className={styles.connectionHandleDot} />
            </div>
        ));
    };

    // ── Minimapa Data Calculation ──

    const getMinimapData = () => {
        let minX = -400;
        let maxX = 1200;
        let minY = -300;
        let maxY = 900;

        const validNodes = (nodes || []).filter(n => 
            n &&
            typeof n.x === 'number' && !isNaN(n.x) &&
            typeof n.y === 'number' && !isNaN(n.y) &&
            typeof n.width === 'number' && !isNaN(n.width) &&
            typeof n.height === 'number' && !isNaN(n.height)
        );

        if (validNodes.length > 0) {
            const xs = validNodes.map(n => n.x);
            const ys = validNodes.map(n => n.y);
            minX = Math.min(...xs) - 200;
            maxX = Math.max(...validNodes.map(n => n.x + n.width)) + 200;
            minY = Math.min(...ys) - 200;
            maxY = Math.max(...validNodes.map(n => n.y + n.height)) + 200;
        }

        const mapW = 160;
        const mapH = 100;
        let boundsW = maxX - minX;
        let boundsH = maxY - minY;
        if (isNaN(boundsW) || boundsW <= 0) boundsW = 1600;
        if (isNaN(boundsH) || boundsH <= 0) boundsH = 1200;

        let scale = Math.min(mapW / boundsW, mapH / boundsH);
        if (isNaN(scale) || scale <= 0 || !isFinite(scale)) scale = 0.1;
        
        const offsetX = (mapW - boundsW * scale) / 2;
        const offsetY = (mapH - boundsH * scale) / 2;

        const container = containerRef.current;
        const viewW = container ? container.clientWidth : 800;
        const viewH = container ? container.clientHeight : 600;

        const zoom = viewport?.zoom || 1;
        const cx1 = -viewport.x / zoom;
        const cy1 = -viewport.y / zoom;
        const cx2 = cx1 + viewW / zoom;
        const cy2 = cy1 + viewH / zoom;

        let rx = (cx1 - minX) * scale + offsetX;
        let ry = (cy1 - minY) * scale + offsetY;
        let rw = (cx2 - cx1) * scale;
        let rh = (cy2 - cy1) * scale;

        if (isNaN(rx)) rx = 0;
        if (isNaN(ry)) ry = 0;
        if (isNaN(rw)) rw = 20;
        if (isNaN(rh)) rh = 20;

        return {
            minX, minY, scale, offsetX, offsetY,
            rx: Math.max(0, Math.min(mapW, rx)),
            ry: Math.max(0, Math.min(mapH, ry)),
            rw: Math.max(8, Math.min(mapW, rw)),
            rh: Math.max(8, Math.min(mapH, rh)),
        };
    };

    const handleMinimapClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const m = getMinimapData();
        const canvasX = m.minX + (clickX - m.offsetX) / m.scale;
        const canvasY = m.minY + (clickY - m.offsetY) / m.scale;

        const container = containerRef.current;
        const viewW = container ? container.clientWidth : 800;
        const viewH = container ? container.clientHeight : 600;

        setViewport(v => {
            const newX = viewW / 2 - canvasX * v.zoom;
            const newY = viewH / 2 - canvasY * v.zoom;
            const newV = { ...v, x: newX, y: newY };
            saveData(nodes, strokes, newV);
            return newV;
        });
    };

    const isDrawingTool = ['rectangle', 'diamond', 'ellipse', 'line', 'arrow', 'triangle', 'blockArrow', 'elbowArrow', 'pen', 'arrowPen'].includes(activeTool);
    const cursorClass = isDrawingTool ? styles.penCursor : (spaceHeld || isPanning) ? styles.grabbing : connectingFrom ? styles.connectingCursor : '';

    const filteredEmojis = EMOJI_LIST.filter(emoji => 
        pickerSearch.trim() === '' || emoji.includes(pickerSearch)
    );

    const filteredIcons = ICON_LIST.filter(icon => 
        pickerSearch.trim() === '' || icon.toLowerCase().includes(pickerSearch.toLowerCase())
    );

    const alreadyAddedProfileIds = new Set(
        nodes.filter(n => n.type === 'profile' && n.profileId).map(n => n.profileId!)
    );

    const filteredProfiles = profiles
        .filter(p => !alreadyAddedProfileIds.has(p.id))
        .filter(p => {
            if (profileSearch.trim() === '') return true;
            const q = profileSearch.toLowerCase();
            const nameMatch = p.name.toLowerCase().includes(q);
            const tagMatch = p.tags ? p.tags.toLowerCase().includes(q) : false;
            return nameMatch || tagMatch;
        });

    const filteredSocial = SOCIAL_MEDIA_CATALOG.filter(platform =>
        socialSearch.trim() === '' || platform.name.toLowerCase().includes(socialSearch.toLowerCase())
    );

    const mapBounds = getMinimapData();

    return (
        <div
            ref={containerRef}
            className={`${styles.canvasContainer} ${viewMode === 'canvas' ? cursorClass : ''}`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
            onDoubleClick={handleDoubleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onContextMenu={(e) => {
                if (viewMode === 'canvas') {
                    e.preventDefault();
                    const rect = containerRef.current?.getBoundingClientRect();
                    const rx = e.clientX - (rect?.left || 0);
                    const ry = e.clientY - (rect?.top || 0);
                    const canvasX = (rx - viewport.x) / viewport.zoom;
                    const canvasY = (ry - viewport.y) / viewport.zoom;

                    setCanvasContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        canvasX,
                        canvasY
                    });
                    setContextMenu(null);
                    setConnectionContextMenu(null);
                }
            }}
            style={{ 
                overflow: viewMode === 'page' ? 'auto' : 'hidden',
                cursor: activeTool === 'hand' && !isPanning ? 'grab' : undefined
            }}
        >
            {viewMode === 'canvas' ? (
                <>
                    <div className={styles.dotGrid} style={gridStyle} />

                    {/* Transformable Surface */}
                    <div className={styles.canvasSurface} style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>

                        {/* SVG Drawing & Connections Layer */}
                        <svg className={styles.drawingLayer} style={{ overflow: 'visible' }}>
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="8"
                            markerHeight="6"
                            refX="6"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0 0 L8 3 L0 6 Z" fill="#8b5cf6" />
                        </marker>
                        <filter id="rough-filter" x="-20%" y="-20%" width="140%" height="140%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                    </defs>

                    {/* Active Saved Connections (Selectable) */}
                    {connections.map(c => {
                        const fromNode = nodes.find(n => n.id === c.fromId);
                        const toNode = nodes.find(n => n.id === c.toId);
                        if (!fromNode || !toNode) return null;
                        const isSelected = selectedIds.has(c.id);
                        const curveData = getBezierPath(fromNode, c.fromSide, toNode, c.toSide);
                        return (
                            <g key={c.id} className={styles.connectionGroup}>
                                <path
                                    d={curveData.path}
                                    stroke={isSelected ? '#c4b5fd' : '#8b5cf6'}
                                    strokeWidth={isSelected ? '4' : '2.5'}
                                    fill="none"
                                    markerEnd={c.hasArrow !== false ? "url(#arrowhead)" : undefined}
                                    className={`${styles.connectionPath} ${isSelected ? styles.selectedConnection : ''}`}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setContextMenu(null);
                                        setConnectionContextMenu(null);
                                        if (e.shiftKey) {
                                            setSelectedIds(prev => {
                                                const next = new Set(prev);
                                                if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                                                return next;
                                            });
                                        } else {
                                            setSelectedIds(new Set([c.id]));
                                        }
                                    }}
                                    onContextMenu={(e) => handleConnectionContextMenu(e, c.id)}
                                />
                                <foreignObject 
                                    x={curveData.midX - 12} 
                                    y={curveData.midY - 12} 
                                    width={24} 
                                    height={24} 
                                    className={styles.connectionTrashIcon}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        deleteSelectedElements(new Set([c.id]));
                                    }}
                                >
                                    <div style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} title="Deletar Conexão">
                                        <Trash2 size={12} />
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}

                    {/* Temporary Connection Arrow */}
                    {connectingFrom && tempConnectionEnd && (
                        <path
                            d={getTempBezierPath()}
                            stroke="#c4b5fd"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                            opacity={0.8}
                        />
                    )}

                    {/* Strokes/Drawings (Selectable hand drawn pencil lines and setas soltas) */}
                    {strokes.map(s => {
                        const isSelected = selectedIds.has(s.id);
                        const midIndex = Math.floor(s.points.length / 2);
                        const midPoint = s.points[midIndex] || {x: 0, y: 0};
                        return (
                            <g key={s.id} className={styles.connectionGroup}>
                                <path 
                                    d={strokeToPath(s.points)} 
                                    stroke={isSelected ? '#c4b5fd' : s.color} 
                                    strokeWidth={isSelected ? s.width + 1.5 : s.width} 
                                    fill="none" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    markerEnd={s.isArrow ? "url(#arrowhead)" : undefined}
                                    className={`${styles.strokePath} ${isSelected ? styles.selectedStroke : ''}`}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setContextMenu(null);
                                        setConnectionContextMenu(null);
                                        if (e.shiftKey) {
                                            setSelectedIds(prev => {
                                                const next = new Set(prev);
                                                if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                                                return next;
                                            });
                                        } else {
                                            setSelectedIds(new Set([s.id]));
                                        }
                                    }}
                                />
                                <foreignObject 
                                    x={midPoint.x - 12} 
                                    y={midPoint.y - 12} 
                                    width={24} 
                                    height={24} 
                                    className={styles.connectionTrashIcon}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        deleteSelectedElements(new Set([s.id]));
                                    }}
                                >
                                    <div style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} title="Deletar Desenho/Seta">
                                        <Trash2 size={12} />
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                    {isDrawing && currentStroke.length > 1 && (
                        <path 
                            d={strokeToPath(currentStroke)} 
                            stroke={PEN_COLOR} 
                            strokeWidth="3" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            opacity={0.8} 
                            markerEnd={arrowPenMode ? "url(#arrowhead)" : undefined}
                        />
                    )}
                    {isDrawingShape && currentShapeTemp && (() => {
                        const { x, y, width, height, flipped } = currentShapeTemp;
                        const strokeColor = '#a78bfa';
                        const strokeWidth = 2;
                        const fill = 'rgba(167, 139, 250, 0.1)';
                        const dash = '4 4';

                        switch (activeTool) {
                            case 'rectangle':
                                return (
                                    <rect
                                        x={x} y={y} width={width} height={height}
                                        stroke={strokeColor} strokeWidth={strokeWidth} fill={fill}
                                        strokeDasharray={dash} rx="4" ry="4"
                                    />
                                );
                            case 'ellipse':
                                return (
                                    <ellipse
                                        cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2}
                                        stroke={strokeColor} strokeWidth={strokeWidth} fill={fill}
                                        strokeDasharray={dash}
                                    />
                                );
                            case 'diamond':
                                return (
                                    <polygon
                                        points={`${x + width/2},${y} ${x + width},${y + height/2} ${x + width/2},${y + height} ${x},${y + height/2}`}
                                        stroke={strokeColor} strokeWidth={strokeWidth} fill={fill}
                                        strokeDasharray={dash}
                                    />
                                );
                            case 'line': {
                                const lx1 = flipped ? x + width : x;
                                const ly1 = flipped ? y + height : y;
                                const lx2 = flipped ? x : x + width;
                                const ly2 = flipped ? y : y + height;
                                return (
                                    <line
                                        x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                                        stroke={strokeColor} strokeWidth={strokeWidth}
                                        strokeDasharray={dash}
                                    />
                                );
                            }
                            case 'arrow': {
                                const lx1 = flipped ? x + width : x;
                                const ly1 = flipped ? y + height : y;
                                const lx2 = flipped ? x : x + width;
                                const ly2 = flipped ? y : y + height;
                                
                                const angle = Math.atan2(ly2 - ly1, lx2 - lx1);
                                const L = 14;
                                const tip1X = lx2 - L * Math.cos(angle - Math.PI / 6);
                                const tip1Y = ly2 - L * Math.sin(angle - Math.PI / 6);
                                const tip2X = lx2 - L * Math.cos(angle + Math.PI / 6);
                                const tip2Y = ly2 - L * Math.sin(angle + Math.PI / 6);

                                return (
                                    <path
                                        d={`M ${lx1} ${ly1} L ${lx2} ${ly2} M ${tip1X} ${tip1Y} L ${lx2} ${ly2} L ${tip2X} ${tip2Y}`}
                                        stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
                                        strokeDasharray={dash}
                                    />
                                );
                            }
                            default:
                                return null;
                        }
                    })()}
                </svg>

                {/* Nodes */}
                {nodes.map(node => {
                    const isFreeText = node.type === 'freetext';
                    const isCard = node.type === 'text';
                    const isSelected = selectedIds.has(node.id);
                    const isEditing = editingNodeId === node.id;
                    const isEmoji = node.type === 'emoji';
                    const isIcon = node.type === 'icon';
                    const isProfile = node.type === 'profile';
                    const isSocial = node.type === 'social';
                    const isCardNode = node.type === 'card';
                    const isShape = node.type === 'shape';

                    let nodeClass = styles.nodeCard;
                    if (isFreeText) nodeClass = styles.freeTextNode;
                    else if (isEmoji) nodeClass = `${styles.emojiNode} ${styles.freeTextNode}`;
                    else if (isIcon) nodeClass = `${styles.iconNode} ${styles.freeTextNode}`;
                    else if (isProfile) nodeClass = styles.freeTextNode;
                    else if (isSocial) nodeClass = `${styles.socialNode} ${styles.freeTextNode}`;
                    else if (isCardNode) nodeClass = `${styles.cardNode}`;
                    else if (isShape) nodeClass = styles.freeTextNode;
                    else if (node.type === 'frame') nodeClass = styles.freeTextNode;

                    return (
                        <div
                            key={node.id}
                            className={`${styles.nodeWrapper} ${isSelected ? styles.selectedWrapper : ''}`}
                            style={{
                                left: node.x, top: node.y, width: node.width, height: node.height,
                                zIndex: node.zIndex,
                            }}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onMouseDown={(e) => {
                                if (isEditing && (e.target as HTMLElement).isContentEditable) return;
                                handleNodeMouseDown(e, node.id);
                            }}
                            onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                            onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                        >
                            <div
                                className={`${nodeClass} ${isSelected ? styles.selected : ''}`}
                                style={{
                                    width: '100%', height: '100%', position: 'relative',
                                    ...(!isFreeText && !isEmoji && !isIcon && !isProfile && !isShape && node.color ? { background: node.color } : {}),
                                    ...((isEmoji || isIcon) && node.color ? { background: node.color, border: '1.5px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)' } : {}),
                                }}
                            >
                                {/* Drag handle bar for card nodes */}
                            {isCard && (
                                <div className={styles.dragHandle} onMouseDown={(e) => handleNodeMouseDown(e, node.id)}>
                                    <div className={styles.dragDots} />
                                </div>
                            )}

                            {/* Node Toolbar for selected nodes (except free text and shapes) */}
                            {isSelected && !isFreeText && !isShape && (
                                <div className={styles.nodeToolbar}>
                                    {node.isLocked ? (
                                        <button onClick={() => toggleNodeLock(node.id)} className={styles.lockActiveBtn} title="Desbloquear">
                                            <Lock size={14} style={{ marginRight: '4px' }} /> Desbloquear
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => duplicateNode(node.id)} title="Duplicar"><Copy size={14} /></button>
                                            <div className={styles.colorPicker}>
                                                {NODE_COLORS.map(c => (
                                                    <div key={c.id} className={`${styles.colorDot} ${node.color === c.value || (!node.color && c.id === 'default') ? styles.activeColor : ''}`}
                                                        style={{ backgroundColor: c.value }}
                                                        onClick={(e) => { e.stopPropagation(); updateNodeColor(node.id, c.value); }}
                                                        title={c.id} />
                                                ))}
                                            </div>
                                            {isIcon && (
                                                <div className={styles.colorPicker} style={{ paddingLeft: 4, marginLeft: 2, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                                                    {TEXT_COLORS.slice(1, 7).map(c => (
                                                        <div key={c.id} className={`${styles.colorDot} ${node.textColor === c.value ? styles.activeColor : ''}`}
                                                            style={{ backgroundColor: c.value, borderRadius: '25%' }}
                                                            onClick={(e) => { e.stopPropagation(); updateNodeTextColor(node.id, c.value); }}
                                                            title={`Cor do ícone: ${c.label}`} />
                                                    ))}
                                                </div>
                                            )}
                                            <button onClick={() => toggleNodeLock(node.id)} title="Bloquear / Fixar"><Unlock size={14} /></button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Content Renderers */}
                            {node.type === 'shape' && (
                                <div className={styles.shapeNodeContent} style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                                    {renderShape(node)}
                                </div>
                            )}
                            {(node.type === 'text' || node.type === 'freetext') && (
                                <EditableDiv
                                    nodeId={node.id}
                                    initialContent={node.content}
                                    onSave={saveNodeContent}
                                    className={isFreeText ? styles.freeTextContent : styles.textContent}
                                    placeholder={isFreeText ? 'Texto livre...' : 'Digite aqui...'}
                                    style={{ 
                                        color: node.textColor || '#e2e8f0',
                                        fontSize: node.fontSize ? `${node.fontSize}px` : undefined
                                    }}
                                    autoFocus={isEditing}
                                    editable={isEditing}
                                    onFocusCb={() => setShowFormatBar(true)}
                                />
                            )}

                            {node.type === 'page' && (
                                <div className={styles.cardNodeContent} onDoubleClick={(e) => {
                                    if (node.isLocked) return;
                                    e.stopPropagation();
                                    if (onOpenPage && node.targetCanvasId) {
                                        onOpenPage(node.targetCanvasId, node.content || 'Página');
                                    }
                                }}>
                                    <div className={styles.cardNodeHeader}>
                                        <div className={styles.cardNodeIcon}>
                                            <FileText size={14} />
                                        </div>
                                        <div className={styles.cardNodeTitle}>
                                            <EditableDiv
                                                nodeId={node.id}
                                                initialContent={node.content}
                                                onSave={saveNodeContent}
                                                className={styles.textContent}
                                                placeholder="Página Sem Título"
                                                autoFocus={isEditing}
                                                editable={isEditing && !node.isLocked}
                                                singleLine={true}
                                                style={{ padding: 0, minHeight: 'auto', color: 'inherit' }}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.cardNodeBody} style={{ opacity: 0.7 }}>
                                        Página do Canvas. Clique duas vezes ou clique no botão abaixo para entrar e editar o conteúdo infinito desta página.
                                    </div>
                                    <div className={styles.cardNodeFooter}>
                                        <button 
                                            className={styles.cardNodeBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onOpenPage && node.targetCanvasId) {
                                                    onOpenPage(node.targetCanvasId, node.content || 'Página');
                                                }
                                            }}
                                        >
                                            <Lucide.ExternalLink size={10} />
                                            Abrir Página
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isCardNode && (
                                <div className={styles.cardNodeContent} onDoubleClick={(e) => {
                                    if (node.isLocked) return;
                                    e.stopPropagation();
                                    setActiveCardId(node.id);
                                    setActiveCardMode('popup');
                                }}>
                                    <div className={styles.cardNodeHeader}>
                                        <div className={styles.cardNodeIcon}>
                                            <Lucide.Notebook size={14} />
                                        </div>
                                        <div className={styles.cardNodeTitle}>
                                            {node.content || 'Sem título'}
                                        </div>
                                    </div>
                                    <div className={styles.cardNodeBody}>
                                        Clique duas vezes ou clique no botão abaixo para expandir e gerenciar anotações Notion com comentários.
                                    </div>
                                    <div className={styles.cardNodeFooter}>
                                        <button 
                                            className={styles.cardNodeBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveCardId(node.id);
                                                setActiveCardMode('popup');
                                            }}
                                        >
                                            <Lucide.BookOpen size={10} />
                                            Abrir Card
                                        </button>
                                        <div className={styles.cardNodeBadge} title="Salvo fisicamente no disco como arquivo local">
                                            <Lucide.Save size={10} />
                                            <span>Salvo local</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {node.type === 'checklist' && (
                                <div className={styles.checklistNode}>
                                    <div className={styles.checklistHeader}>
                                        <input
                                            className={styles.checklistTitle}
                                            value={node.content}
                                            onChange={(e) => {
                                                if (node.isLocked) return;
                                                const val = e.target.value;
                                                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, content: val } : n));
                                            }}
                                            onBlur={() => saveData(nodes, strokes, viewport)}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            placeholder="Título do Checklist"
                                            readOnly={node.isLocked}
                                        />
                                        {(() => {
                                            const total = node.checklistData?.length || 0;
                                            const checked = node.checklistData?.filter(i => i.checked).length || 0;
                                            const pct = total === 0 ? 0 : Math.round((checked / total) * 100);
                                            return (
                                                <div className={styles.checklistProgress}>
                                                    <div className={styles.checklistProgressBar} style={{ width: `${pct}%` }} />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className={styles.checklistItems} onMouseDown={e => e.stopPropagation()}>
                                        {(node.checklistData || []).map(item => (
                                            <div key={item.id} className={`${styles.checklistItem} ${item.checked ? styles.checked : ''}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.checked}
                                                    disabled={node.isLocked}
                                                    onChange={(e) => {
                                                        if (node.isLocked) return;
                                                        const isChecked = e.target.checked;
                                                        setNodes(prev => {
                                                            const updated = prev.map(n => {
                                                                if (n.id !== node.id) return n;
                                                                const newData = (n.checklistData || []).map(i => i.id === item.id ? { ...i, checked: isChecked } : i);
                                                                return { ...n, checklistData: newData };
                                                            });
                                                            saveData(updated, strokes, viewport);
                                                            return updated;
                                                        });
                                                    }}
                                                />
                                                <textarea
                                                    value={item.text}
                                                    rows={1}
                                                    readOnly={node.isLocked}
                                                    onChange={(e) => {
                                                        if (node.isLocked) return;
                                                        const val = e.target.value;
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                        setNodes(prev => prev.map(n => {
                                                            if (n.id !== node.id) return n;
                                                            const newData = (n.checklistData || []).map(i => i.id === item.id ? { ...i, text: val } : i);
                                                            return { ...n, checklistData: newData };
                                                        }));
                                                    }}
                                                    onBlur={() => saveData(nodes, strokes, viewport)}
                                                    placeholder="Tarefa..."
                                                />
                                                {!node.isLocked && (
                                                    <button
                                                        className={styles.deleteChecklistItemBtn}
                                                        title="Excluir tarefa"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            setNodes(prev => {
                                                                const updated = prev.map(n => {
                                                                    if (n.id !== node.id) return n;
                                                                    const newData = (n.checklistData || []).filter(i => i.id !== item.id);
                                                                    return { ...n, checklistData: newData };
                                                                });
                                                                saveData(updated, strokes, viewport);
                                                                return updated;
                                                            });
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {!node.isLocked && (
                                        <button 
                                            className={styles.addChecklistBtn}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={() => {
                                                setNodes(prev => {
                                                    const updated = prev.map(n => {
                                                        if (n.id !== node.id) return n;
                                                        const newData = [...(n.checklistData || []), { id: genId(), text: '', checked: false }];
                                                        return { ...n, checklistData: newData, height: Math.max(n.height, 120 + newData.length * 30) };
                                                    });
                                                    saveData(updated, strokes, viewport);
                                                    return updated;
                                                });
                                            }}
                                        >
                                            <Plus size={14} /> Adicionar Item
                                        </button>
                                    )}
                                </div>
                            )}
                            {node.type === 'frame' && (
                                <div className={`${styles.frameNode} ${selectedIds.has(node.id) ? styles.selected : ''}`}>
                                    <div 
                                        className={styles.frameHeader}
                                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            const newName = prompt('Nome do Frame:', node.content);
                                            if (newName !== null) {
                                                setNodes(prev => {
                                                    const updated = prev.map(n => n.id === node.id ? { ...n, content: newName } : n);
                                                    saveData(updated, strokes, viewport);
                                                    return updated;
                                                });
                                            }
                                        }}
                                    >
                                        <LayoutTemplate size={14} /> {node.content || 'Frame'}
                                    </div>
                                </div>
                            )}

                            {node.type === 'image' && (
                                <div
                                    className={styles.imageWrapper}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        if (!node.isLocked) {
                                            setLightboxImage({ src: node.content, fileName: node.fileName });
                                        }
                                    }}
                                    title={node.isLocked ? undefined : 'Duplo clique para ver em tela cheia'}
                                >
                                    <img
                                        src={node.content}
                                        alt={node.fileName || 'image'}
                                        className={styles.imageContent}
                                        draggable={false}
                                    />
                                </div>
                            )}

                            {node.type === 'document' && (
                                node.fileType === 'link' ? (
                                    <div 
                                        className={styles.linkCardContent}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.api && window.api.openExternal) {
                                                window.api.openExternal(node.content);
                                            } else {
                                                window.open(node.content, '_blank');
                                            }
                                        }}
                                    >
                                        <div className={styles.linkCardIcon}><ExternalLink size={20} /></div>
                                        <div className={styles.linkCardInfo}>
                                            <span className={styles.linkCardName}>{node.fileName || node.content}</span>
                                            <span className={styles.linkCardUrl}>{node.content}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.documentContent}>
                                        <div className={styles.documentIcon}><FileText size={20} /></div>
                                        <div className={styles.documentInfo}>
                                            <span className={styles.documentName}>{node.fileName || 'Documento'}</span>
                                            <span className={styles.documentType}>{node.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                                        </div>
                                    </div>
                                )
                            )}

                            {node.type === 'table' && (
                                <div className={styles.tableNodeWrapper}>
                                    {!node.isLocked && (
                                        <div className={styles.tableControls}>
                                            <button className={styles.tableCtrlBtn} onClick={(e) => {
                                                e.stopPropagation();
                                                const newData = [...(node.tableData || [])].map(r => [...r]);
                                                if (newData.length > 0) {
                                                    newData.push(new Array(newData[0].length).fill(''));
                                                } else {
                                                    newData.push(['']);
                                                }
                                                updateNodeTableData(node.id, newData);
                                            }}>+ Linha</button>
                                            <button className={styles.tableCtrlBtn} onClick={(e) => {
                                                e.stopPropagation();
                                                const newData = [...(node.tableData || [])].map(r => [...r]);
                                                newData.forEach(r => r.push(''));
                                                updateNodeTableData(node.id, newData);
                                            }}>+ Coluna</button>
                                        </div>
                                    )}
                                    <table className={styles.tableNodeTable}>
                                        <tbody>
                                            {node.tableData?.map((row, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    {row.map((cell, colIndex) => (
                                                        <td key={colIndex}>
                                                            <div
                                                                contentEditable={!node.isLocked}
                                                                suppressContentEditableWarning={true}
                                                                onBlur={(e) => {
                                                                    if (node.isLocked) return;
                                                                    const newData = [...(node.tableData || [])].map(r => [...r]);
                                                                    newData[rowIndex][colIndex] = e.target.innerText;
                                                                    updateNodeTableData(node.id, newData);
                                                                }}
                                                                className={styles.tableCellEditable}
                                                                style={{ color: node.textColor || 'inherit' }}
                                                            >
                                                                {cell}
                                                            </div>
                                                        </td>
                                                    ))}
                                                    {!node.isLocked && (
                                                        <td>
                                                            <button className={styles.tableRemoveBtn} onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newData = [...(node.tableData || [])].map(r => [...r]);
                                                                newData.splice(rowIndex, 1);
                                                                updateNodeTableData(node.id, newData);
                                                            }}><Minus size={12} /></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            {!node.isLocked && (
                                                <tr>
                                                    {node.tableData && node.tableData[0] && node.tableData[0].map((_, colIndex) => (
                                                        <td key={`rem-col-${colIndex}`} style={{ textAlign: 'center' }}>
                                                            <button className={styles.tableRemoveBtn} onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newData = [...(node.tableData || [])].map(r => [...r]);
                                                                newData.forEach(r => r.splice(colIndex, 1));
                                                                updateNodeTableData(node.id, newData);
                                                            }}><Minus size={12} /></button>
                                                        </td>
                                                    ))}
                                                    <td></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                             {node.type === 'embed' && (() => {
                                 const isRunning = runningWebviews.has(node.id);
                                 return (
                                     <div className={styles.embedContainer}>
                                         <div className={styles.embedHeader} onMouseDown={(e) => {
                                             if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'INPUT') {
                                                 e.stopPropagation();
                                             }
                                         }}>
                                             {/* Left side actions: Play, Stop, Close */}
                                             <div className={styles.embedActionsLeft}>
                                                 {!isRunning ? (
                                                     <button 
                                                         className={`${styles.iconBtn} ${styles.playBtn}`} 
                                                         title="Iniciar Navegador (Play)"
                                                         onClick={() => {
                                                             setRunningWebviews(prev => {
                                                                 const next = new Set(prev);
                                                                 next.add(node.id);
                                                                 return next;
                                                             });
                                                         }}
                                                     >
                                                         <Play size={12} fill="#22c55e" stroke="#22c55e" />
                                                     </button>
                                                 ) : (
                                                     <button 
                                                         className={`${styles.iconBtn} ${styles.runningIndicator}`} 
                                                         title="Navegador Rodando"
                                                         disabled
                                                     >
                                                         <Play size={12} fill="#22c55e" stroke="#22c55e" style={{ opacity: 0.5 }} />
                                                     </button>
                                                 )}

                                                 {isRunning && (
                                                     <button 
                                                         className={`${styles.iconBtn} ${styles.stopBtn}`} 
                                                         title="Parar Navegador (Stop)"
                                                         onClick={() => {
                                                             setRunningWebviews(prev => {
                                                                 const next = new Set(prev);
                                                                 next.delete(node.id);
                                                                 return next;
                                                             });
                                                         }}
                                                     >
                                                         <Square size={12} fill="#ef4444" stroke="#ef4444" />
                                                     </button>
                                                 )}

                                             </div>

                                             {/* Address Bar */}
                                             {editingUrlNodeId === node.id ? (
                                                 <input
                                                     className={styles.embedAddressInput}
                                                     value={editingUrlValue}
                                                     onChange={(e) => setEditingUrlValue(e.target.value)}
                                                     onBlur={() => {
                                                         if (editingUrlValue.trim()) {
                                                             handleUpdateNodeUrl(node.id, editingUrlValue.trim());
                                                         }
                                                         setEditingUrlNodeId(null);
                                                     }}
                                                     onKeyDown={(e) => {
                                                         if (e.key === 'Enter') {
                                                             if (editingUrlValue.trim()) {
                                                                 handleUpdateNodeUrl(node.id, editingUrlValue.trim());
                                                             }
                                                             setEditingUrlNodeId(null);
                                                         }
                                                         if (e.key === 'Escape') {
                                                             setEditingUrlNodeId(null);
                                                         }
                                                     }}
                                                     onClick={(e) => e.stopPropagation()}
                                                     onMouseDown={(e) => e.stopPropagation()}
                                                     autoFocus
                                                 />
                                             ) : (
                                                 <div 
                                                     className={styles.embedAddressBar} 
                                                     title={`${node.content} ${!isRunning && !node.isLocked ? '(Clique duas vezes para editar)' : ''}`}
                                                     onDoubleClick={(e) => {
                                                         if (!isRunning && !node.isLocked) {
                                                             e.stopPropagation();
                                                             setEditingUrlNodeId(node.id);
                                                             setEditingUrlValue(node.content);
                                                         }
                                                     }}
                                                 >
                                                     {node.content}
                                                 </div>
                                             )}

                                             {/* Window Size Presets & WebView controls */}
                                             <div className={styles.embedActionsRight}>
                                                 {/* Presets */}
                                                 <button 
                                                     className={`${styles.presetBtn} ${node.width === 1200 && node.height === 800 ? styles.activePreset : ''}`}
                                                     title="Proporção Tela Cheia (1200x800)"
                                                     onClick={() => {
                                                         if (node.isLocked) return;
                                                         handleSetNodeSize(node.id, 1200, 800);
                                                     }}
                                                 >
                                                     <Maximize2 size={12} />
                                                 </button>
                                                 <button 
                                                     className={`${styles.presetBtn} ${node.width === 800 && node.height === 600 ? styles.activePreset : ''}`}
                                                     title="Meia Proporção (800x600)"
                                                     onClick={() => {
                                                         if (node.isLocked) return;
                                                         handleSetNodeSize(node.id, 800, 600);
                                                     }}
                                                 >
                                                     <Minimize2 size={12} />
                                                 </button>
                                                 <button 
                                                     className={`${styles.presetBtn} ${node.width === 400 && node.height === 300 ? styles.activePreset : ''}`}
                                                     title="Tamanho Flexível/Padrão (400x300)"
                                                     onClick={() => {
                                                         if (node.isLocked) return;
                                                         handleSetNodeSize(node.id, 400, 300);
                                                     }}
                                                 >
                                                     <LayoutTemplate size={12} />
                                                 </button>

                                                 {/* WebView Specific Controls */}
                                                 {isRunning && (
                                                     <>
                                                         <button 
                                                             className={styles.iconBtn} 
                                                             title="Recarregar"
                                                             onClick={() => {
                                                                 const wv = document.getElementById(`webview-${node.id}`) as any;
                                                                 if (wv && wv.reload) wv.reload();
                                                             }}
                                                         >
                                                             <RotateCw size={12} />
                                                         </button>
                                                         <button 
                                                             className={styles.iconBtn} 
                                                             title="Abrir no navegador"
                                                             onClick={() => {
                                                                 if (window.api && window.api.openExternal) {
                                                                     window.api.openExternal(node.content);
                                                                 } else {
                                                                     window.open(node.content, '_blank');
                                                                 }
                                                             }}
                                                         >
                                                             <ExternalLink size={12} />
                                                         </button>
                                                     </>
                                                 )}
                                             </div>
                                         </div>

                                         {isRunning ? (
                                             <webview 
                                                 id={`webview-${node.id}`}
                                                 src={node.content} 
                                                 className={styles.embedWebview}
                                                 allowpopups={true}
                                                 useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                                                 style={{ pointerEvents: isPanning || spaceHeld ? 'none' : 'auto' }}
                                             />
                                         ) : (
                                             <div className={styles.browserCover}>
                                                 <div className={styles.browserCoverContent}>
                                                     <div className={styles.browserCoverIcon}>
                                                         <Globe size={40} className={styles.globeIconAnim} />
                                                     </div>
                                                     <span className={styles.browserCoverUrl}>{node.content}</span>
                                                     <button 
                                                         className={styles.browserPlayBtn}
                                                         onClick={() => {
                                                             setRunningWebviews(prev => {
                                                                 const next = new Set(prev);
                                                                 next.add(node.id);
                                                                 return next;
                                                             });
                                                         }}
                                                     >
                                                         <Play size={14} fill="#ffffff" stroke="#ffffff" />
                                                         <span>Iniciar Navegador</span>
                                                     </button>
                                                     <span className={styles.browserCoverHint}>O navegador consome recursos apenas quando ativo</span>
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 );
                             })()}

                            {isEmoji && (
                                <div className={styles.emojiNodeContent} style={{ fontSize: `${Math.min(node.width, node.height) * 0.55}px` }}>
                                    {node.content}
                                </div>
                            )}

                            {isIcon && (
                                <div className={styles.iconNodeContent}>
                                    <DynamicIcon name={node.content} size={Math.min(node.width, node.height) * 0.5} color={node.textColor || '#a78bfa'} />
                                </div>
                            )}

                            {isSocial && (() => {
                                const platform = SOCIAL_MEDIA_CATALOG.find(p => p.id === node.socialPlatform);
                                if (!platform) return null;
                                return (
                                    <div className={styles.socialNodeContent} style={{ background: platform.bg }}>
                                        <SocialIcon platform={platform} size={Math.min(node.width, node.height) * 0.4} />
                                        <span className={styles.socialNodeLabel} style={{ color: platform.color }}>
                                            {platform.name}
                                        </span>
                                    </div>
                                );
                            })()}

                            {isProfile && (() => {
                                const prof = profiles.find(p => p.id === node.profileId);
                                const isOnline = prof?.is_active === 1;
                                const isStarting = prof?.status === 'running' && !isOnline;
                                const statusLabel = isOnline ? 'Online' : (isStarting ? 'Iniciando...' : 'Pronto');
                                const statusColor = isOnline ? '#10b981' : (isStarting ? '#fb923c' : '#64748b');
                                
                                return (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        width: '100%',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        boxSizing: 'border-box',
                                        background: 'rgba(15, 15, 17, 0.94)',
                                        border: `1.5px solid ${isOnline ? 'rgba(16, 185, 129, 0.45)' : (isStarting ? 'rgba(251, 146, 60, 0.45)' : 'rgba(139, 92, 246, 0.22)')}`,
                                        borderRadius: 14,
                                        boxShadow: isOnline 
                                            ? '0 0 16px rgba(16, 185, 129, 0.15), inset 0 0 8px rgba(16, 185, 129, 0.05)'
                                            : (isStarting ? '0 0 16px rgba(251, 146, 60, 0.15)' : '0 8px 32px rgba(0,0,0,0.5)'),
                                        color: '#f1f5f9',
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        userSelect: 'none',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>
                                        {/* Top Row: Name and Status */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={node.content}>
                                                    {node.content}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                                    <span 
                                                        style={{ 
                                                            width: 6, 
                                                            height: 6, 
                                                            borderRadius: '50%', 
                                                            backgroundColor: statusColor,
                                                            boxShadow: isOnline || isStarting ? `0 0 8px ${statusColor}` : 'none'
                                                        }} 
                                                    />
                                                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{statusLabel}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {/* OS Badge */}
                                                {prof?.fingerprint?.platform && (
                                                    <span style={{
                                                        fontSize: 10,
                                                        padding: '2px 6px',
                                                        borderRadius: 6,
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                                        color: '#94a3b8',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 3
                                                    }}>
                                                        {prof.fingerprint.platform.includes('Win') ? '🪟 Win' : (prof.fingerprint.platform.includes('Mac') ? '🍎 Mac' : '🐧 Linux')}
                                                    </span>
                                                )}
                                                {/* AI Score */}
                                                {node.profileId && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ProfileAIScore profileId={node.profileId} size={30} strokeWidth={2.5} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Action Row */}
                                        <div style={{ display: 'flex', width: '100%', gap: 6, marginTop: 4 }}>
                                            {isOnline ? (
                                                <button
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => { e.stopPropagation(); closeProfileFromCanvas(node.profileId!); }}
                                                    style={{
                                                        flex: 1,
                                                        height: 24,
                                                        background: 'rgba(244, 63, 94, 0.12)',
                                                        border: '1px solid rgba(244, 63, 94, 0.3)',
                                                        borderRadius: 8,
                                                        color: '#fda4af',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 4,
                                                        transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.22)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)'}
                                                >
                                                    <Lucide.StopCircle size={11} />
                                                    Parar
                                                </button>
                                            ) : (
                                                <button
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    disabled={isStarting}
                                                    onClick={(e) => { e.stopPropagation(); launchProfileFromCanvas(node.profileId!); }}
                                                    style={{
                                                        flex: 1,
                                                        height: 24,
                                                        background: isStarting ? 'rgba(255, 255, 255, 0.03)' : 'rgba(139, 92, 246, 0.15)',
                                                        border: isStarting ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(139, 92, 246, 0.35)',
                                                        borderRadius: 8,
                                                        color: isStarting ? '#475569' : '#a78bfa',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: isStarting ? 'default' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 4,
                                                        transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { if (!isStarting) e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)'; }}
                                                    onMouseLeave={e => { if (!isStarting) e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; }}
                                                >
                                                    <Lucide.Play size={11} fill="currentColor" />
                                                    {isStarting ? 'Carregando...' : 'Iniciar'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            </div>

                            {/* Resize Handles (all 4 corners) */}
                            {renderResizeHandles(node.id, isSelected)}

                            {/* Lock Badge */}
                            {node.isLocked && (
                                <div 
                                    className={styles.lockBadge} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleNodeLock(node.id);
                                    }}
                                    title="Clique para desbloquear"
                                >
                                    <Lock size={10} />
                                </div>
                            )}

                            {/* Connection Handles (North, East, South, West) */}
                            {renderConnectionHandles(node.id, isSelected)}
                        </div>
                    );
                })}
            </div>
            
            {/* Empty hint */}
            {nodes.length === 0 && strokes.length === 0 && (
                <div className={styles.emptyHint}>
                    <MousePointer2 size={32} />
                    <p>Clique duas vezes para inserir texto<br /><strong>ou use os botões abaixo</strong></p>
                </div>
            )}
            </>
            ) : (
                <LinearPageRenderer 
                    nodes={nodes} 
                    connections={connections} 
                    onUpdateNode={(id, content) => {
                        const newNodes = nodes.map(n => n.id === id ? { ...n, content } : n);
                        setNodes(newNodes);
                        saveData(newNodes, strokes, viewport, connections);
                    }}
                    onUpdateChecklistData={(id, checklistData) => {
                        const newNodes = nodes.map(n => n.id === id ? { ...n, checklistData } : n);
                        setNodes(newNodes);
                        saveData(newNodes, strokes, viewport, connections);
                    }}
                    onOpenPage={onOpenPage}
                />
            )}

            {/* Drop overlay */}
            {isDragOver && <div className={styles.dropOverlay}><p>Solte para adicionar ao canvas</p></div>}

            {/* Rubber band selection rectangle */}
            {selectionRect && selectionRect.w > 2 && (
                <div className={styles.selectionRect} style={{ left: selectionRect.x, top: selectionRect.y, width: selectionRect.w, height: selectionRect.h }} />
            )}

            {/* ── Minimap (Object Locator) Canto Superior Direito ── */}
            <div className={styles.minimapContainer} onClick={handleMinimapClick} title="Minimapa — Clique para navegar">
                {nodes.map(n => {
                    const nx = (n.x - mapBounds.minX) * mapBounds.scale + mapBounds.offsetX;
                    const ny = (n.y - mapBounds.minY) * mapBounds.scale + mapBounds.offsetY;
                    const nw = Math.max(2, n.width * mapBounds.scale);
                    const nh = Math.max(2, n.height * mapBounds.scale);
                    return (
                        <div 
                            key={n.id}
                            className={styles.minimapNode}
                            style={{ left: nx, top: ny, width: nw, height: nh }}
                        />
                    );
                })}
                <div 
                    className={styles.minimapViewport}
                    style={{ 
                        left: mapBounds.rx, 
                        top: mapBounds.ry, 
                        width: mapBounds.rw, 
                        height: mapBounds.rh 
                    }}
                />
            </div>

            {/* ── Format Bar ── */}
            {showFormatBar && isTextEditing && (
                <div className={styles.formatBar}>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} title="Negrito" className={styles.formatBtn}><Bold size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} title="Itálico" className={styles.formatBtn}><Italic size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }} title="Sublinhado" className={styles.formatBtn}><Underline size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('strikeThrough'); }} title="Tachado" className={styles.formatBtn}><Strikethrough size={15} /></button>
                    <div className={styles.formatDivider} />
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'h1'); }} title="Título Grande H1" className={styles.formatBtn}><Heading1 size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'h2'); }} title="Título Médio H2" className={styles.formatBtn}><Heading2 size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'h3'); }} title="Título Pequeno H3" className={styles.formatBtn}><Heading3 size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'p'); }} title="Parágrafo" className={styles.formatBtn}><Type size={15} /></button>
                    <div className={styles.formatDivider} />
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('justifyLeft'); }} title="Alinhar à Esquerda" className={styles.formatBtn}><AlignLeft size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('justifyCenter'); }} title="Centralizar" className={styles.formatBtn}><AlignCenter size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('justifyRight'); }} title="Alinhar à Direita" className={styles.formatBtn}><AlignRight size={15} /></button>
                    <div className={styles.formatDivider} />
                    <button onMouseDown={(e) => { e.preventDefault(); insertLine(); }} title="Inserir Linha Horizontal" className={styles.formatBtn}><Minus size={15} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormat('insertText', '☐ '); }} title="Inserir Checklist" className={styles.formatBtn}><ListTodo size={15} /></button>
                    <div className={styles.formatDivider} />
                    <button onMouseDown={(e) => { e.preventDefault(); adjustFontSize(2); }} title="Aumentar Fonte (+2px)" className={styles.formatBtn}><Plus size={13} /><span style={{ fontSize: 9, fontWeight: 800, marginLeft: 1 }}>A</span></button>
                    <button onMouseDown={(e) => { e.preventDefault(); adjustFontSize(-2); }} title="Diminuir Fonte (-2px)" className={styles.formatBtn}><Minus size={13} /><span style={{ fontSize: 9, fontWeight: 800, marginLeft: 1 }}>A</span></button>
                    {(() => {
                        const editNode = nodes.find(n => n.id === editingNodeId);
                        const currentSize = editNode?.fontSize || (editNode?.type === 'freetext' ? 15 : 14);
                        return <span className={styles.fontSizeDisplay} title="Tamanho de Fonte Atual">{currentSize}px</span>;
                    })()}
                    <div className={styles.formatDivider} />
                    <div className={styles.textColorSection}>
                        <span className={styles.textColorLabel} title="Cor do Texto"><Pencil size={12} /></span>
                        <div className={styles.textColorPicker}>
                            {TEXT_COLORS.map(c => {
                                const editNode = nodes.find(n => n.id === editingNodeId);
                                return (
                                    <div key={c.id}
                                        className={`${styles.textColorDot} ${editNode?.textColor === c.value || (!editNode?.textColor && c.id === 'default') ? styles.textColorActive : ''}`}
                                        style={{ backgroundColor: c.value }} title={c.label}
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (editingNodeId) updateNodeTextColor(editingNodeId, c.value); }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className={styles.formatDivider} />
                    <div className={styles.textColorSection}>
                        <span className={styles.textColorLabel} title="Cor de Fundo (Background)"><Palette size={12} /></span>
                        <div className={styles.textColorPicker}>
                            {NODE_COLORS.map(c => {
                                const editNode = nodes.find(n => n.id === editingNodeId);
                                return (
                                    <div key={c.id}
                                        className={`${styles.textColorDot} ${editNode?.color === c.value || (!editNode?.color && c.id === 'default') ? styles.textColorActive : ''}`}
                                        style={{ backgroundColor: c.value, borderRadius: '4px' }} title={`Fundo: ${c.id}`}
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (editingNodeId) updateNodeColor(editingNodeId, c.value); }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Alignment Bar ── */}
            {selectedIds.size > 1 && (
                <div className={styles.alignmentBar}>
                    <button onClick={() => alignSelectedNodes('left')} title="Alinhar à Esquerda" className={styles.formatBtn}><AlignLeft size={15} /></button>
                    <button onClick={() => alignSelectedNodes('center-v')} title="Alinhar ao Centro H" className={styles.formatBtn}><AlignCenter size={15} /></button>
                    <button onClick={() => alignSelectedNodes('right')} title="Alinhar à Direita" className={styles.formatBtn}><AlignRight size={15} /></button>
                    <div className={styles.formatDivider} />
                    <button onClick={() => alignSelectedNodes('top')} title="Alinhar ao Topo" className={styles.formatBtn}><ArrowUpToLine size={15} /></button>
                    <button onClick={() => alignSelectedNodes('middle-h')} title="Alinhar ao Meio V" className={styles.formatBtn}><AlignJustify size={15} /></button>
                    <button onClick={() => alignSelectedNodes('bottom')} title="Alinhar Abaixo" className={styles.formatBtn}><ArrowDownToLine size={15} /></button>
                    <div className={styles.formatDivider} />
                    <button onClick={() => lockAllSelected(true)} title="Bloquear / Fixar Selecionados" className={styles.formatBtn}><Lock size={15} /></button>
                    <button onClick={() => lockAllSelected(false)} title="Desbloquear Selecionados" className={styles.formatBtn} style={{ color: '#ef4444' }}><Unlock size={15} /></button>
                </div>
            )}

            {/* ── Top Left Layers Toggle ── */}
            <button className={styles.toggleLayersBtn} onClick={() => setShowLayersPanel(p => !p)} title="Camadas">
                <Layers size={16} />
            </button>

            {/* ── Layers Panel (Figma-style) ── */}
            {showLayersPanel && (() => {
                const getLayerIcon = (node: CanvasNode) => {
                    switch (node.type) {
                        case 'frame': return <LayoutTemplate size={13} />;
                        case 'freetext': return <Type size={13} />;
                        case 'text': return <Lucide.StickyNote size={13} />;
                        case 'card': return <Lucide.Notebook size={13} />;
                        case 'image': return <Image size={13} />;
                        case 'table': return <Table size={13} />;
                        case 'document': return <FileText size={13} />;
                        case 'page': return <Lucide.BookOpen size={13} />;
                        case 'checklist': return <ListTodo size={13} />;
                        case 'emoji': return <Smile size={13} />;
                        case 'icon': return <Lucide.Sparkles size={13} />;
                        case 'profile': return <Lucide.User size={13} />;
                        case 'social': return <Share2 size={13} />;
                        case 'embed': return <Globe size={13} />;
                        case 'shape':
                            switch (node.shapeType) {
                                case 'rectangle': return <Square size={13} />;
                                case 'diamond': return <Lucide.Diamond size={13} />;
                                case 'ellipse': return <Lucide.Circle size={13} />;
                                case 'line': return <Minus size={13} />;
                                case 'arrow': return <ArrowUpRight size={13} />;
                                default: return <Square size={13} />;
                            }
                        default: return <Lucide.Component size={13} />;
                    }
                };
                const getLayerDisplayName = (node: CanvasNode) => {
                    if (node.layerName) return node.layerName;
                    if (node.fileName) return node.fileName;
                    switch (node.type) {
                        case 'frame': return 'Frame';
                        case 'freetext': return node.content?.replace(/<[^>]*>/g, '').slice(0, 24) || 'Texto';
                        case 'text': return node.content?.replace(/<[^>]*>/g, '').slice(0, 24) || 'Nota';
                        case 'card': return node.content?.replace(/<[^>]*>/g, '').slice(0, 24) || 'Card';
                        case 'image': return 'Imagem';
                        case 'table': return 'Tabela';
                        case 'document': return node.fileType === 'link' ? 'Link' : 'Documento';
                        case 'page': return node.content?.replace(/<[^>]*>/g, '').slice(0, 24) || 'Página';
                        case 'checklist': return 'Checklist';
                        case 'emoji': return node.content || 'Emoji';
                        case 'icon': return 'Ícone';
                        case 'profile': return 'Perfil';
                        case 'social': return node.socialPlatform || 'Social';
                        case 'embed': return 'Navegador';
                        case 'shape':
                            switch (node.shapeType) {
                                case 'rectangle': return 'Retângulo';
                                case 'diamond': return 'Losango';
                                case 'ellipse': return 'Elipse';
                                case 'line': return 'Linha';
                                case 'arrow': return 'Seta';
                                default: return 'Forma';
                            }
                        default: return node.type;
                    }
                };
                return (
                <div className={styles.layersPanel}>
                    <div className={styles.layersPanelHeader}>
                        <span className={styles.layersPanelTitle}>Camadas</span>
                        <button onClick={() => setShowLayersPanel(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: 2 }}><X size={12} /></button>
                    </div>
                    <div className={styles.layersPanelContent}>
                        {[...nodes].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)).map((node) => (
                            <div 
                                key={node.id} 
                                className={`${styles.layerItem} ${selectedIds.has(node.id) ? styles.selectedLayer : ''}`}
                                onClick={(e) => {
                                    if (e.shiftKey) {
                                        setSelectedIds(prev => { const next = new Set(prev); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; });
                                    } else {
                                        setSelectedIds(new Set([node.id]));
                                        const container = containerRef.current;
                                        if (container) {
                                            const viewW = container.clientWidth;
                                            const viewH = container.clientHeight;
                                            setViewport(v => ({
                                                ...v,
                                                x: viewW / 2 - (node.x + (node.width || 200) / 2) * v.zoom,
                                                y: viewH / 2 - (node.y + (node.height || 100) / 2) * v.zoom
                                            }));
                                        }
                                    }
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    const input = e.currentTarget.querySelector('input');
                                    if (input) { input.focus(); input.select(); }
                                }}
                            >
                                <div className={styles.layerTypeIcon}>
                                    {getLayerIcon(node)}
                                </div>
                                <input 
                                    className={styles.layerNameInput}
                                    value={getLayerDisplayName(node)}
                                    onChange={(e) => {
                                        setNodes(prev => {
                                            const next = prev.map(n => n.id === node.id ? { ...n, layerName: e.target.value } : n);
                                            saveData(next, strokes, viewport, connections);
                                            return next;
                                        });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    readOnly
                                    onFocus={(e) => { (e.target as HTMLInputElement).readOnly = false; }}
                                    onBlur={(e) => { (e.target as HTMLInputElement).readOnly = true; }}
                                />
                                {node.isLocked && (
                                    <div className={styles.layerLockIndicator}>
                                        <Lock size={10} />
                                    </div>
                                )}
                                <div className={styles.layerActions}>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        toggleNodeLock(node.id);
                                    }} title={node.isLocked ? "Desbloquear" : "Bloquear"}>
                                        {node.isLocked ? <Lock size={11} style={{ color: '#ef4444' }} /> : <Unlock size={11} />}
                                    </button>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setCustomDialog({
                                            isOpen: true,
                                            type: 'confirm',
                                            message: `Excluir "${getLayerDisplayName(node)}"?`,
                                            onConfirm: () => deleteSelectedElements(new Set([node.id]), true),
                                            onCancel: () => {}
                                        });
                                    }} title="Excluir" style={{ color: '#ef4444' }}>
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                );
            })()}

            {/* ── Central Dock (Grouped Toolbars) ── */}
            <div className={styles.canvasDock}>
                {/* Lock Tool toggle */}
                <button 
                    onClick={() => setIsToolLocked(l => !l)} 
                    className={isToolLocked ? styles.toolActive : ''} 
                    title={isToolLocked ? "Ferramenta travada (clique para destravar)" : "Travar ferramenta após desenhar"}
                >
                    {isToolLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>

                <div className={styles.dockDivider} />

                {/* 1. Seleção e Mão */}
                <button 
                    onClick={() => setActiveTool('select')} 
                    className={activeTool === 'select' ? styles.toolActive : ''} 
                    title="Cursor / Selecionar (V)"
                >
                    <MousePointer2 size={18} />
                </button>
                <button 
                    onClick={() => setActiveTool('hand')} 
                    className={activeTool === 'hand' ? styles.toolActive : ''} 
                    title="Mão / Pan (H)"
                >
                    <Lucide.Hand size={18} />
                </button>

                <div className={styles.dockDivider} />

                {/* 2. Formas Geométricas */}
                <div className={styles.dockPopoverContainer}>
                    <button 
                        className={['rectangle', 'diamond', 'ellipse', 'line', 'arrow', 'triangle', 'blockArrow', 'elbowArrow'].includes(activeTool) ? styles.toolActive : ''} 
                        title="Formas Geométricas"
                    >
                        <Lucide.Shapes size={18} />
                    </button>
                    <div className={styles.dockPopover} style={{ minWidth: '180px', flexDirection: 'column', gap: '2px', padding: '6px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Formas</div>
                        
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'rectangle' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('rectangle')}><Square size={14} style={{ marginRight: 8 }} /> Retângulo <span style={{ marginLeft: 'auto', opacity: 0.5 }}>R</span></button>
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'ellipse' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('ellipse')}><Lucide.Circle size={14} style={{ marginRight: 8 }} /> Elipse <span style={{ marginLeft: 'auto', opacity: 0.5 }}>O</span></button>
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'diamond' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('diamond')}><Lucide.Triangle size={14} style={{ marginRight: 8, transform: 'rotate(45deg)' }} /> Losango <span style={{ marginLeft: 'auto', opacity: 0.5 }}>D</span></button>
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'line' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('line')}><Minus size={14} style={{ marginRight: 8, transform: 'rotate(-45deg)' }} /> Linha <span style={{ marginLeft: 'auto', opacity: 0.5 }}>L</span></button>
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'arrow' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('arrow')}><ArrowUpRight size={14} style={{ marginRight: 8 }} /> Seta <span style={{ marginLeft: 'auto', opacity: 0.5 }}>A</span></button>
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'elbowArrow' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('elbowArrow')}><Lucide.CornerDownRight size={14} style={{ marginRight: 8 }} /> Seta em cotovelo</button>
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'blockArrow' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('blockArrow')}><ArrowUpRight size={14} style={{ marginRight: 8, strokeWidth: 3 }} /> Seta em bloco</button>
                        <div style={{ height: 1, background: '#ffffff1a', margin: '4px 0' }} />
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'triangle' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('triangle')}><Lucide.Triangle size={14} style={{ marginRight: 8 }} /> Triângulo</button>
                    </div>
                </div>

                {/* 3. Desenho Livre & Texto */}
                <div className={styles.dockPopoverContainer}>
                    <button 
                        className={['pen', 'arrowPen'].includes(activeTool) ? styles.toolActive : ''} 
                        title="Canetas e Desenho Livre"
                    >
                        <Pencil size={18} />
                    </button>
                    <div className={styles.dockPopover} style={{ minWidth: '180px', flexDirection: 'column', gap: '2px', padding: '6px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Desenho</div>
                        
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'pen' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('pen')}><Pencil size={14} style={{ marginRight: 8 }} /> Caneta Livre <span style={{ marginLeft: 'auto', opacity: 0.5 }}>P</span></button>
                        <button className={`${styles.ctxMenuItem} ${activeTool === 'arrowPen' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('arrowPen')}><Lucide.ChevronRightSquare size={14} style={{ marginRight: 8 }} /> Caneta com Seta</button>
                        
                        {strokes.length > 0 && (
                            <>
                                <div className={styles.ctxMenuDivider} />
                                <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px', color: '#ef4444' }} onClick={clearStrokes}><Eraser size={14} style={{ marginRight: 8 }} /> Apagar desenhos</button>
                            </>
                        )}
                    </div>
                </div>

                <button 
                    onClick={() => {
                        const pos = { x: -viewport.x/viewport.zoom + 200, y: -viewport.y/viewport.zoom + 200 };
                        addFreeTextAt(pos.x, pos.y);
                    }} 
                    title="Adicionar Texto (T)"
                >
                    <Type size={18} />
                </button>

                <div className={styles.dockDivider} />

                {/* 4. Componentes Axe Workspace */}
                <div className={styles.dockPopoverContainer}>
                    <button title="Inserir Componentes (Notion, Tabelas, Perfis...)"><Plus size={18} /><Lucide.ChevronDown size={10} style={{ marginLeft: 2 }} /></button>
                    <div className={styles.dockPopover} style={{ minWidth: '220px', flexDirection: 'column', gap: '2px', padding: '6px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Componentes</div>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addFrameNode()}><LayoutTemplate size={14} style={{ marginRight: 8 }} /> Frame Agrupador</button>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addPageNode()}><FileText size={14} style={{ marginRight: 8 }} /> Página Notion</button>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addCardNode()}><Lucide.Notebook size={14} style={{ marginRight: 8 }} /> Card Notion</button>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addChecklistNode()}><ListTodo size={14} style={{ marginRight: 8 }} /> Lista de Tarefas</button>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addTableNode()}><Table size={14} style={{ marginRight: 8 }} /> Tabela Flexível</button>
                        <div className={styles.ctxMenuDivider} />
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Arquivos</div>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => fileInputRef.current?.click()}><Image size={14} style={{ marginRight: 8 }} /> Imagem</button>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => docInputRef.current?.click()}><FileText size={14} style={{ marginRight: 8 }} /> Documento</button>
                        <div className={styles.ctxMenuDivider} />
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ativos</div>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => { setShowProfilePicker(true); setShowPickerPopover(false); setShowSocialPicker(false); setShowFunnelPicker(false); }}><Lucide.Users size={14} style={{ marginRight: 8 }} /> Perfil</button>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => { setShowPickerPopover(true); setShowProfilePicker(false); setShowSocialPicker(false); setShowFunnelPicker(false); }}><Smile size={14} style={{ marginRight: 8 }} /> Emoji</button>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => { setShowSocialPicker(true); setShowProfilePicker(false); setShowPickerPopover(false); setShowFunnelPicker(false); }}><Share2 size={14} style={{ marginRight: 8 }} /> Rede Social</button>
                        <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => { setShowFunnelPicker(true); setShowProfilePicker(false); setShowPickerPopover(false); setShowSocialPicker(false); }}><Filter size={14} style={{ marginRight: 8 }} /> Funil de Vendas</button>
                    </div>
                </div>

                <div className={styles.dockDivider} />

                {/* 5. Ações de Visualização e Grade */}
                <button onClick={() => setGridSnap(g => !g)} className={gridSnap ? styles.toolActive : ''} title="Ajustar à Grade"><Grid size={18} /></button>
                <button onClick={() => setViewMode(m => m === 'canvas' ? 'page' : 'canvas')} className={viewMode === 'page' ? styles.toolActive : ''} title="Modo Documento (Página)"><ScrollText size={18} /></button>
            </div>

            {/* ── Left Properties Panel (Excalidraw properties) ── */}
            {(() => {
                const selectedNodes = nodes.filter(n => selectedIds.has(n.id));
                const selectedShapes = selectedNodes.filter(n => n.type === 'shape');
                const selectedTexts = selectedNodes.filter(n => n.type === 'freetext' || n.type === 'text');
                
                if (selectedShapes.length === 0 && selectedTexts.length === 0) return null;

                const hasShapes = selectedShapes.length > 0;

                const borderColors = [
                    { value: '#a78bfa', label: 'Roxo' },
                    { value: '#3b82f6', label: 'Azul' },
                    { value: '#10b981', label: 'Verde' },
                    { value: '#f59e0b', label: 'Laranja' },
                    { value: '#ef4444', label: 'Vermelho' },
                    { value: '#e2e8f0', label: 'Branco' },
                    { value: '#000000', label: 'Preto' }
                ];

                const fillColors = [
                    { value: 'transparent', label: 'Nenhum' },
                    { value: 'rgba(167, 139, 250, 0.22)', label: 'Roxo' },
                    { value: 'rgba(59, 130, 246, 0.22)', label: 'Azul' },
                    { value: 'rgba(16, 185, 129, 0.22)', label: 'Verde' },
                    { value: 'rgba(245, 158, 11, 0.22)', label: 'Laranja' },
                    { value: 'rgba(239, 68, 68, 0.22)', label: 'Vermelho' },
                    { value: 'rgba(255, 255, 255, 0.15)', label: 'Branco' }
                ];

                const updateProp = (key: string, val: any) => {
                    setNodes(prev => {
                        const updated = prev.map(n => {
                            if (selectedIds.has(n.id)) {
                                return { ...n, [key]: val };
                            }
                            return n;
                        });
                        saveData(updated, strokes, viewport);
                        return updated;
                    });
                    
                    if (key === 'color') setCurrentStrokeColor(val);
                    if (key === 'shapeStrokeWidth') setCurrentStrokeWidth(val);
                    if (key === 'shapeStrokeStyle') setCurrentStrokeStyle(val);
                    if (key === 'shapeFillColor') setCurrentFillColor(val);
                    if (key === 'shapeRoughness') setCurrentShapeRoughness(val);
                };

                return (
                    <div className={`${styles.propertiesSidebar} ${isPropSidebarMinimized ? styles.propertiesSidebarMinimized : ''}`} onMouseDown={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isPropSidebarMinimized ? '0' : '8px', width: '100%' }}>
                            {!isPropSidebarMinimized && <span className={styles.propTitle} style={{ margin: 0 }}>Configurações</span>}
                            <button 
                                className={styles.propBtn}
                                style={{ width: isPropSidebarMinimized ? '100%' : '32px', border: isPropSidebarMinimized ? '1px solid rgba(139,92,246,0.3)' : 'none', background: isPropSidebarMinimized ? 'rgba(139,92,246,0.1)' : 'transparent' }}
                                onClick={(e) => { e.stopPropagation(); setIsPropSidebarMinimized(!isPropSidebarMinimized); }}
                                title={isPropSidebarMinimized ? "Abrir configurações do objeto" : "Minimizar configurações"}
                            >
                                <Lucide.Settings size={isPropSidebarMinimized ? 20 : 16} color={isPropSidebarMinimized ? '#c4b5fd' : '#94a3b8'} />
                            </button>
                        </div>
                        
                        {!isPropSidebarMinimized && (
                            <>
                                {/* Contorno / Cor do Texto */}
                        <div className={styles.propSection}>
                            <span className={styles.propTitle}>
                                {hasShapes ? 'Cor do Contorno' : 'Cor do Texto'}
                            </span>
                            <div className={styles.colorPalette}>
                                {borderColors.map(c => {
                                    const isActive = hasShapes 
                                        ? currentStrokeColor === c.value
                                        : selectedNodes[0]?.textColor === c.value;
                                    return (
                                        <div
                                            key={c.value}
                                            className={`${styles.colorPaletteDot} ${isActive ? styles.colorPaletteDotActive : ''}`}
                                            style={{ backgroundColor: c.value === '#000000' ? '#14141c' : c.value, border: c.value === '#000000' ? '1px solid rgba(255,255,255,0.2)' : undefined }}
                                            onClick={() => updateProp(hasShapes ? 'color' : 'textColor', c.value)}
                                            title={c.label}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Preenchimento */}
                        {hasShapes && (
                            <div className={styles.propSection}>
                                <span className={styles.propTitle}>Cor do Preenchimento</span>
                                <div className={styles.colorPalette}>
                                    {fillColors.map(c => {
                                        const isActive = currentFillColor === c.value;
                                        return (
                                            <div
                                                key={c.value}
                                                className={`${styles.colorPaletteDot} ${isActive ? styles.colorPaletteDotActive : ''}`}
                                                style={{ 
                                                    background: c.value === 'transparent' ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)' : c.value,
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                                onClick={() => updateProp('shapeFillColor', c.value)}
                                                title={c.label}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Espessura do Contorno / Tamanho da Fonte */}
                        <div className={styles.propSection}>
                            <span className={styles.propTitle}>
                                {hasShapes ? 'Espessura do Contorno' : 'Tamanho do Texto'}
                            </span>
                            {hasShapes ? (
                                <div className={styles.propButtonGroup}>
                                    <button 
                                        className={`${styles.propBtn} ${currentStrokeWidth === 2 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('shapeStrokeWidth', 2)}
                                    >
                                        Fina
                                    </button>
                                    <button 
                                        className={`${styles.propBtn} ${currentStrokeWidth === 4 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('shapeStrokeWidth', 4)}
                                    >
                                        Média
                                    </button>
                                    <button 
                                        className={`${styles.propBtn} ${currentStrokeWidth === 6 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('shapeStrokeWidth', 6)}
                                    >
                                        Grossa
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.propButtonGroup}>
                                    <button 
                                        className={`${styles.propBtn} ${(selectedNodes[0]?.fontSize || 15) === 14 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('fontSize', 14)}
                                    >
                                        P
                                    </button>
                                    <button 
                                        className={`${styles.propBtn} ${(selectedNodes[0]?.fontSize || 15) === 18 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('fontSize', 18)}
                                    >
                                        M
                                    </button>
                                    <button 
                                        className={`${styles.propBtn} ${(selectedNodes[0]?.fontSize || 15) === 24 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('fontSize', 24)}
                                    >
                                        G
                                    </button>
                                    <button 
                                        className={`${styles.propBtn} ${(selectedNodes[0]?.fontSize || 15) === 36 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('fontSize', 36)}
                                    >
                                        GG
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Estilo do Traço */}
                        {hasShapes && (
                            <div className={styles.propSection}>
                                <span className={styles.propTitle}>Estilo do Traço</span>
                                <div className={styles.propButtonGroup}>
                                    <button 
                                        className={`${styles.propBtn} ${currentStrokeStyle === 'solid' ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('shapeStrokeStyle', 'solid')}
                                    >
                                        Sólido
                                    </button>
                                    <button 
                                        className={`${styles.propBtn} ${currentStrokeStyle === 'dashed' ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('shapeStrokeStyle', 'dashed')}
                                    >
                                        Tracejado
                                    </button>
                                    <button 
                                        className={`${styles.propBtn} ${currentStrokeStyle === 'dotted' ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('shapeStrokeStyle', 'dotted')}
                                    >
                                        Pontilhado
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Estilo do Desenho */}
                        {hasShapes && (
                            <div className={styles.propSection}>
                                <span className={styles.propTitle}>Estilo de Desenho</span>
                                <div className={styles.propButtonGroup}>
                                    <button 
                                        className={`${styles.propBtn} ${currentShapeRoughness === 1 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('shapeRoughness', 1)}
                                    >
                                        Sketchy
                                    </button>
                                    <button 
                                        className={`${styles.propBtn} ${currentShapeRoughness === 0 ? styles.propBtnActive : ''}`}
                                        onClick={() => updateProp('shapeRoughness', 0)}
                                    >
                                        Clean
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Lock / Unlock */}
                        <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', gap: '6px' }}>
                            <button 
                                className={styles.propBtn} 
                                style={{ flex: 1, gap: 4 }}
                                onClick={() => {
                                    const allLocked = selectedNodes.every(n => n.isLocked);
                                    lockAllSelected(!allLocked);
                                }}
                            >
                                {selectedNodes.every(n => n.isLocked) ? <Unlock size={12} /> : <Lock size={12} />}
                                <span>{selectedNodes.every(n => n.isLocked) ? 'Desbloquear' : 'Bloquear'}</span>
                            </button>
                            <button 
                                className={styles.propBtn} 
                                style={{ flex: 'none', width: '28px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                                onClick={() => {
                                    setCustomDialog({
                                        isOpen: true,
                                        type: 'confirm',
                                        message: `Deseja realmente excluir os ${selectedNodes.length} itens selecionados?`,
                                        onConfirm: () => {
                                            deleteSelectedElements(new Set(selectedNodes.map(n => n.id)));
                                        },
                                        onCancel: () => {}
                                    });
                                }}
                                title="Excluir selecionados"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                            </>
                        )}
                    </div>
                );
            })()}

            {/* ── Right Text Editor Sidebar ── */}
            {(() => {
                const selectedTexts = nodes.filter(n => selectedIds.has(n.id) && (n.type === 'text' || n.type === 'freetext'));
                if (selectedTexts.length !== 1) return null;
                const node = selectedTexts[0];

                const htmlToText = (html: string) => {
                    return (html || '')
                        .replace(/<br\s*[\/]?>/gi, '\n')
                        .replace(/<div>/gi, '\n')
                        .replace(/<\/div>/gi, '')
                        .replace(/&nbsp;/gi, ' ')
                        .replace(/<[^>]+>/g, '');
                };

                return (
                    <>
                        {!showTextSidebar && (
                            <button 
                                className={styles.openTextSidebarBtn}
                                onClick={() => setShowTextSidebar(true)}
                                title="Abrir Editor de Texto"
                            >
                                <Lucide.PanelRightOpen size={18} />
                            </button>
                        )}
                        {showTextSidebar && (
                            <div className={styles.textSidebar} onMouseDown={(e) => e.stopPropagation()}>
                                <div className={styles.cardSidebarHeader} style={{ background: 'rgba(15, 17, 26, 0.5)' }}>
                                    <div className={styles.cardHeaderTitle}>
                                        <Type size={14} style={{ color: '#a78bfa' }} /> Editar Texto
                                    </div>
                                    <button onClick={() => setShowTextSidebar(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                                        <X size={14} />
                                    </button>
                                </div>
                                <textarea 
                                    className={styles.textSidebarTextarea}
                                    value={htmlToText(node.content || '')}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\n/g, '<br>');
                                        setNodes(prev => {
                                            const next = prev.map(n => n.id === node.id ? { ...n, content: val } : n);
                                            saveData(next, strokes, viewport, connections);
                                            return next;
                                        });
                                    }}
                                    placeholder="Insira as informações do texto aqui..."
                                    autoFocus
                                />
                            </div>
                        )}
                    </>
                );
            })()}

            {/* ── Zoom and History Bottom-Left Controls ── */}
            <div className={styles.zoomControls} onMouseDown={(e) => e.stopPropagation()}>
                <button onClick={zoomOut} title="Diminuir Zoom"><ZoomOut size={15} /></button>
                <div className={styles.zoomValue} onClick={resetZoom} title="Resetar Zoom (100%)">
                    {Math.round(viewport.zoom * 100)}%
                </div>
                <button onClick={zoomIn} title="Aumentar Zoom"><ZoomIn size={15} /></button>
                
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                
                <button onClick={handleUndo} disabled={historyIndexRef.current === 0} title="Desfazer (Ctrl+Z)"><Undo2 size={15} /></button>
                <button onClick={handleRedo} disabled={historyIndexRef.current >= history.length - 1} title="Refazer (Ctrl+Y)"><Redo2 size={15} /></button>
            </div>

            {/* ── Searchable Profiles Picker Panel ── */}
            {showProfilePicker && (
                <div className={styles.pickerPopover}>
                    <div className={styles.pickerHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 6px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Mencionar Perfil
                        </span>
                        <span className={styles.profileCountBadge}>
                            {filteredProfiles.length} disp.
                        </span>
                    </div>
                    
                    <input 
                        type="text" 
                        value={profileSearch}
                        onChange={(e) => setProfileSearch(e.target.value)}
                        placeholder="Buscar por nome ou #tag..." 
                        className={styles.pickerSearch}
                        autoFocus
                    />

                    <div className={styles.pickerGridContainer} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 12px 12px' }}>
                        {filteredProfiles.map(prof => {
                            const isOnline = prof.is_active === 1;
                            const isStarting = prof.status === 'running' && !isOnline;
                            const statusColor = isOnline ? '#10b981' : (isStarting ? '#fb923c' : '#64748b');
                            const tags = prof.tags ? prof.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

                            return (
                                <button 
                                    key={prof.id} 
                                    onClick={() => addProfileNodeAt(prof)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '8px 10px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: 8,
                                        color: '#e2e8f0',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.35)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {prof.name}
                                            </span>
                                        </div>
                                        <span 
                                            style={{ 
                                                width: 6, 
                                                height: 6, 
                                                borderRadius: '50%', 
                                                backgroundColor: statusColor,
                                                boxShadow: isOnline || isStarting ? `0 0 8px ${statusColor}` : 'none',
                                                flexShrink: 0
                                            }} 
                                        />
                                    </div>
                                    {tags.length > 0 && (
                                        <div className={styles.profileTagRow}>
                                            {tags.map((tag, i) => (
                                                <span key={i} className={styles.profileTagBadge}>#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        {filteredProfiles.length === 0 && (
                            <span style={{ fontSize: 11, color: '#64748b', textAlign: 'center', paddingTop: 20 }}>
                                {profileSearch ? 'Nenhum perfil encontrado' : 'Todos os perfis já foram adicionados'}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ── Searchable Social Media Picker Panel ── */}
            {showSocialPicker && (
                <div className={styles.pickerPopover}>
                    <div className={styles.pickerHeader} style={{ padding: '10px 12px 6px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Redes Sociais
                        </span>
                    </div>
                    
                    <input 
                        type="text" 
                        value={socialSearch}
                        onChange={(e) => setSocialSearch(e.target.value)}
                        placeholder="Buscar rede social..." 
                        className={styles.pickerSearch}
                        autoFocus
                    />

                    <div className={styles.pickerGridContainer}>
                        <div className={styles.socialGrid}>
                            {filteredSocial.map(platform => (
                                <button 
                                    key={platform.id} 
                                    className={styles.socialBtn}
                                    onClick={() => addSocialNode(platform)}
                                    title={`Adicionar ${platform.name}`}
                                >
                                    <SocialIcon platform={platform} size={26} />
                                    <span className={styles.socialBtnLabel}>{platform.name}</span>
                                </button>
                            ))}
                            {filteredSocial.length === 0 && <span className={styles.noResults}>Nenhuma rede encontrada</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Funnel Templates Picker Panel ── */}
            {showFunnelPicker && (
                <div className={styles.funnelPickerPanel}>
                    <div className={styles.funnelPickerHeader}>
                        <Filter size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                        Templates de Funis
                    </div>
                    <div className={styles.funnelPickerBody}>
                        {FUNNEL_TEMPLATES.map(template => (
                            <div 
                                key={template.id} 
                                className={styles.funnelCard}
                                onClick={() => insertFunnelTemplate(template)}
                            >
                                <div className={styles.funnelCardTitle}>{template.name}</div>
                                <div className={styles.funnelCardDesc}>{template.description}</div>
                                <div className={styles.funnelPreview}>
                                    {template.stages.map((stage, idx) => (
                                        <React.Fragment key={idx}>
                                            <div className={styles.funnelStep} style={{ background: stage.color }}>
                                                {stage.label}
                                            </div>
                                            {idx < template.stages.length - 1 && <span className={styles.funnelArrow}>→</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Searchable Emojis and Icons Picker Panel ── */}
            {showPickerPopover && (
                <div className={styles.pickerPopover}>
                    <div className={styles.pickerHeader}>
                        <div className={styles.pickerTabs}>
                            <button 
                                className={`${styles.pickerTabBtn} ${pickerTab === 'emoji' ? styles.activeTab : ''}`}
                                onClick={() => setPickerTab('emoji')}
                            >
                                Emojis
                            </button>
                            <button 
                                className={`${styles.pickerTabBtn} ${pickerTab === 'icon' ? styles.activeTab : ''}`}
                                onClick={() => setPickerTab('icon')}
                            >
                                Ícones
                            </button>
                        </div>
                    </div>
                    
                    <input 
                        type="text" 
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder="Buscar..." 
                        className={styles.pickerSearch}
                        autoFocus
                    />

                    <div className={styles.pickerGridContainer}>
                        {pickerTab === 'emoji' ? (
                            <div className={styles.emojiGrid}>
                                {filteredEmojis.map(emoji => (
                                    <button 
                                        key={emoji} 
                                        className={styles.emojiBtn}
                                        onClick={() => addEmojiOrIconNode('emoji', emoji)}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                {filteredEmojis.length === 0 && <span className={styles.noResults}>Nenhum emoji encontrado</span>}
                            </div>
                        ) : (
                            <div className={styles.iconGrid}>
                                {filteredIcons.map(icon => (
                                    <button 
                                        key={icon} 
                                        className={styles.iconBtn}
                                        onClick={() => addEmojiOrIconNode('icon', icon)}
                                        title={icon}
                                    >
                                        <DynamicIcon name={icon} size={20} color="#a78bfa" />
                                    </button>
                                ))}
                                {filteredIcons.length === 0 && <span className={styles.noResults}>Nenhum ícone encontrado</span>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Node Context Menu with Card Background Color Picker */}
            {contextMenu && (() => {
                const ctxNode = nodes.find(n => n.id === contextMenu.nodeId);
                return (
                    <div className={styles.canvasContextMenu} style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
                        {(ctxNode?.type === 'text' || ctxNode?.type === 'card') && (
                            <>
                                <div className={styles.ctxMenuHeader}>Cor do Card</div>
                                <div className={styles.ctxColorPicker}>
                                    {NODE_COLORS.map(c => (
                                        <div 
                                            key={c.id} 
                                            className={`${styles.ctxColorDot} ${ctxNode.color === c.value || (!ctxNode.color && c.id === 'default') ? styles.ctxColorActive : ''}`}
                                            style={{ backgroundColor: c.value }}
                                            onClick={(e) => { e.stopPropagation(); updateNodeColor(ctxNode.id, c.value); setContextMenu(null); }}
                                            title={`Colorir de ${c.id}`}
                                        />
                                    ))}
                                </div>
                                <div className={styles.ctxMenuDivider} />
                            </>
                        )}
                        {ctxNode?.type === 'image' && (
                            <>
                                <div className={styles.ctxMenuHeader} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Image size={14} /> Opções de Imagem</div>
                                <button className={styles.ctxMenuItem} onClick={(e) => { e.stopPropagation(); resizeImage(ctxNode.id, 1.5); }}><Maximize2 size={14} />Aumentar 50%</button>
                                <button className={styles.ctxMenuItem} onClick={(e) => { e.stopPropagation(); resizeImage(ctxNode.id, 0.5); }}><Minimize2 size={14} />Diminuir 50%</button>
                                <button className={styles.ctxMenuItem} onClick={(e) => { e.stopPropagation(); restoreOriginalProportion(ctxNode.id); }}><Crop size={14} />Proporção Original</button>
                                <div className={styles.ctxMenuDivider} />
                            </>
                        )}
                        {ctxNode?.type === 'embed' && (() => {
                            const isRunning = runningWebviews.has(ctxNode.id);
                            return (
                                <>
                                    <div className={styles.ctxMenuHeader}>Opções do Navegador</div>
                                    {!isRunning ? (
                                        <button 
                                            className={styles.ctxMenuItem} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRunningWebviews(prev => new Set(prev).add(ctxNode.id));
                                                setContextMenu(null);
                                            }}
                                        >
                                            <Play size={14} fill="#22c55e" stroke="#22c55e" /> Iniciar Navegador
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                className={styles.ctxMenuItem} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRunningWebviews(prev => {
                                                        const next = new Set(prev);
                                                        next.delete(ctxNode.id);
                                                        return next;
                                                    });
                                                    setContextMenu(null);
                                                }}
                                            >
                                                <Square size={14} fill="#ef4444" stroke="#ef4444" /> Parar Navegador
                                            </button>
                                            <button 
                                                className={styles.ctxMenuItem} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const wv = document.getElementById(`webview-${ctxNode.id}`) as any;
                                                    if (wv && wv.reload) wv.reload();
                                                    setContextMenu(null);
                                                }}
                                            >
                                                <RotateCw size={14} /> Recarregar Página
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        className={styles.ctxMenuItem} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.api && window.api.openExternal) {
                                                window.api.openExternal(ctxNode.content);
                                            } else {
                                                window.open(ctxNode.content, '_blank');
                                            }
                                            setContextMenu(null);
                                        }}
                                    >
                                        <ExternalLink size={14} /> Abrir no Navegador
                                    </button>
                                    <button 
                                        className={styles.ctxMenuItem} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCustomDialogInputValue(ctxNode.content || '');
                                            setCustomDialog({
                                                isOpen: true,
                                                type: 'prompt',
                                                message: "Digite o novo Link / URL:",
                                                defaultValue: ctxNode.content,
                                                onConfirm: (val) => {
                                                    if (val !== undefined && val.trim() !== "") {
                                                        saveNodeContent(ctxNode.id, val.trim());
                                                    }
                                                },
                                                onCancel: () => {}
                                            });
                                            setContextMenu(null);
                                        }}
                                    >
                                        <Pencil size={14} /> Editar Link / URL
                                    </button>
                                    <button 
                                        className={styles.ctxMenuItem} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNodes(prev => {
                                                const updated = prev.map(n => n.id === ctxNode.id ? { ...n, type: 'document', fileType: 'link' } : n);
                                                debouncedSaveCanvasData(canvasId, { nodes: updated, strokes, connections, viewport });
                                                return updated;
                                            });
                                            setRunningWebviews(prev => {
                                                const next = new Set(prev);
                                                next.delete(ctxNode.id);
                                                return next;
                                            });
                                            setContextMenu(null);
                                        }}
                                    >
                                        <FileText size={14} /> Converter em Card de Link
                                    </button>
                                    <div className={styles.ctxMenuDivider} />
                                    <div className={styles.ctxMenuHeader}>Presets de Proporção</div>
                                    <button 
                                        className={styles.ctxMenuItem} 
                                        onClick={(e) => { e.stopPropagation(); handleSetNodeSize(ctxNode.id, 1200, 800); setContextMenu(null); }}
                                    >
                                        <Maximize2 size={14} /> Tela Cheia (1200x800)
                                    </button>
                                    <button 
                                        className={styles.ctxMenuItem} 
                                        onClick={(e) => { e.stopPropagation(); handleSetNodeSize(ctxNode.id, 800, 600); setContextMenu(null); }}
                                    >
                                        <Minimize2 size={14} /> Meia Proporção (800x600)
                                    </button>
                                    <button 
                                        className={styles.ctxMenuItem} 
                                        onClick={(e) => { e.stopPropagation(); handleSetNodeSize(ctxNode.id, 400, 300); setContextMenu(null); }}
                                    >
                                        <LayoutTemplate size={14} /> Tamanho Flexível (400x300)
                                    </button>
                                    <div className={styles.ctxMenuDivider} />
                                </>
                            );
                        })()}
                        {ctxNode?.type === 'document' && ctxNode?.fileType === 'link' && (
                            <>
                                <div className={styles.ctxMenuHeader}>Opções do Link Card</div>
                                <button 
                                    className={styles.ctxMenuItem} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNodes(prev => {
                                            const updated = prev.map(n => n.id === ctxNode.id ? { ...n, type: 'embed' } : n);
                                            debouncedSaveCanvasData(canvasId, { nodes: updated, strokes, connections, viewport });
                                            return updated;
                                        });
                                        setContextMenu(null);
                                    }}
                                >
                                    <Globe size={14} /> Iniciar como Navegador
                                </button>
                                <button 
                                    className={styles.ctxMenuItem} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.api && window.api.openExternal) {
                                            window.api.openExternal(ctxNode.content);
                                        } else {
                                            window.open(ctxNode.content, '_blank');
                                        }
                                        setContextMenu(null);
                                    }}
                                >
                                    <ExternalLink size={14} /> Abrir Link
                                </button>
                                <button 
                                    className={styles.ctxMenuItem} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCustomDialogInputValue(ctxNode.content || '');
                                        setCustomDialog({
                                            isOpen: true,
                                            type: 'prompt',
                                            message: "Digite o novo Link / URL:",
                                            defaultValue: ctxNode.content,
                                            onConfirm: (val) => {
                                                if (val !== undefined && val.trim() !== "") {
                                                    saveNodeContent(ctxNode.id, val.trim());
                                                }
                                            },
                                            onCancel: () => {}
                                        });
                                        setContextMenu(null);
                                    }}
                                >
                                    <Pencil size={14} /> Editar Link / URL
                                </button>
                                <div className={styles.ctxMenuDivider} />
                            </>
                        )}
                        {ctxNode?.type === 'profile' && (() => {
                            const prof = profiles.find(p => p.id === ctxNode.profileId);
                            const isOnline = prof?.is_active === 1;
                            const isStarting = prof?.status === 'running' && !isOnline;
                            return (
                                <>
                                    <div className={styles.ctxMenuHeader}>Ações do Perfil</div>
                                    {!isOnline ? (
                                        <button 
                                            className={styles.ctxMenuItem} 
                                            disabled={isStarting}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                launchProfileFromCanvas(ctxNode.profileId!);
                                                setContextMenu(null);
                                            }}
                                        >
                                            <Play size={14} fill="#22c55e" stroke="#22c55e" /> {isStarting ? 'Iniciando Perfil...' : 'Iniciar Perfil'}
                                        </button>
                                    ) : (
                                        <button 
                                            className={styles.ctxMenuItem} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeProfileFromCanvas(ctxNode.profileId!);
                                                setContextMenu(null);
                                            }}
                                        >
                                            <Square size={14} fill="#ef4444" stroke="#ef4444" /> Parar Perfil
                                        </button>
                                    )}
                                    <div className={styles.ctxMenuDivider} />
                                </>
                            );
                        })()}
                        <button className={styles.ctxMenuItem} onClick={() => downloadNode(contextMenu.nodeId)}><Download size={14} />Exportar / Download</button>
                        {ctxNode && (
                            <button 
                                className={styles.ctxMenuItem} 
                                onClick={() => {
                                    if (selectedIds.has(ctxNode.id) && selectedIds.size > 1) {
                                        lockAllSelected(!ctxNode.isLocked);
                                    } else {
                                        toggleNodeLock(ctxNode.id);
                                    }
                                    setContextMenu(null);
                                }}
                            >
                                {ctxNode.isLocked ? (
                                    <>
                                        <Unlock size={14} />Desbloquear
                                    </>
                                ) : (
                                    <>
                                        <Lock size={14} />Bloquear / Fixar
                                    </>
                                )}
                            </button>
                        )}
                        {!ctxNode?.isLocked && (
                            <>
                                <button className={styles.ctxMenuItem} onClick={() => duplicateNode(contextMenu.nodeId)}><Copy size={14} />Duplicar</button>
                                <div className={styles.ctxMenuDivider} />
                                <button 
                                    className={`${styles.ctxMenuItem} ${styles.ctxMenuDanger}`} 
                                    onClick={() => {
                                        setCustomDialog({
                                            isOpen: true,
                                            type: 'confirm',
                                            message: "Deseja realmente excluir este elemento do canvas?",
                                            onConfirm: () => {
                                                deleteSelectedElements(new Set([ctxNode.id]));
                                            },
                                            onCancel: () => {}
                                        });
                                        setContextMenu(null);
                                    }}
                                >
                                    <Trash2 size={14} />Excluir
                                </button>
                            </>
                        )}
                    </div>
                );
            })()}

            {/* Connection Seta Context Menu */}
            {connectionContextMenu && (
                <div 
                    className={styles.canvasContextMenu} 
                    style={{ left: connectionContextMenu.x, top: connectionContextMenu.y }} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            setConnections(prev => {
                                const next = prev.map(c => c.id === connectionContextMenu.connectionId ? { ...c, hasArrow: !c.hasArrow } : c);
                                saveData(nodes, strokes, viewport, next);
                                return next;
                            });
                            setConnectionContextMenu(null);
                        }}
                    >
                        <ArrowUpRight size={14} /> Alternar Seta
                    </button>
                    <button 
                        className={`${styles.ctxMenuItem} ${styles.ctxMenuDanger}`} 
                        onClick={() => deleteConnection(connectionContextMenu.connectionId)}
                    >
                        <Trash2 size={14} />Excluir Conexão
                    </button>
                </div>
            )}

            {/* Canvas Context Menu (Right Click Inserter) */}
            {canvasContextMenu && (
                <div 
                    className={styles.canvasContextMenu} 
                    style={{ left: canvasContextMenu.x, top: canvasContextMenu.y }} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.ctxMenuHeader}>Inserir Elemento</div>
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            addFreeTextAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
                            setCanvasContextMenu(null);
                        }}
                    >
                        <AlignLeft size={14} /> Texto Livre
                    </button>
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            const url = window.prompt("Digite o Link / URL para o Navegador:", "https://www.google.com");
                            if (url && url.trim()) {
                                addEmbedNode(url.trim(), canvasContextMenu.canvasX, canvasContextMenu.canvasY);
                            }
                            setCanvasContextMenu(null);
                        }}
                    >
                        <Globe size={14} /> Navegador (Webview)
                    </button>
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            addPageNode(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
                            setCanvasContextMenu(null);
                        }}
                    >
                        <FileText size={14} /> Página Notion
                    </button>
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            addCardNode(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
                            setCanvasContextMenu(null);
                        }}
                    >
                        <Lucide.Notebook size={14} /> Card Notion
                    </button>
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            addChecklistNode(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
                            setCanvasContextMenu(null);
                        }}
                    >
                        <ListTodo size={14} /> Lista de Tarefas
                    </button>
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            addTableNode(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
                            setCanvasContextMenu(null);
                        }}
                    >
                        <Table size={14} /> Tabela Flexível
                    </button>
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            addFrameNode(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
                            setCanvasContextMenu(null);
                        }}
                    >
                        <LayoutTemplate size={14} /> Frame (Agrupador)
                    </button>
                    <button 
                        className={styles.ctxMenuItem}
                        onClick={() => {
                            addTextNode(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
                            setCanvasContextMenu(null);
                        }}
                    >
                        <Type size={14} /> Nota com Card
                    </button>
                </div>
            )}

            {/* Notion-Style Card Editor (Pop-up or Sidebar) */}
            {activeCardMode && cardData && (() => {
                const colors = [
                    { name: 'Slate', value: '#1e293b' },
                    { name: 'Dark Slate', value: '#0f172a' },
                    { name: 'Purple', value: '#2e1065' },
                    { name: 'Indigo', value: '#1e1b4b' },
                    { name: 'Blue', value: '#172554' },
                    { name: 'Green', value: '#064e3b' },
                    { name: 'Red', value: '#450a0a' },
                ];

                const currentCardColor = nodes.find(n => n.id === activeCardId)?.color || '#1e293b';

                const addChecklistItem = () => {
                    const newItem = { id: genId(), text: '', checked: false };
                    const nextChecklist = [...(cardData.checklist || []), newItem];
                    saveActiveCard({ ...cardData, checklist: nextChecklist });
                };

                const updateChecklistItem = (itemId: string, text: string, checked: boolean) => {
                    const nextChecklist = (cardData.checklist || []).map(item => {
                        if (item.id === itemId) return { ...item, text, checked };
                        return item;
                    });
                    saveActiveCard({ ...cardData, checklist: nextChecklist });
                };

                const removeChecklistItem = (itemId: string) => {
                    const nextChecklist = (cardData.checklist || []).filter(item => item.id !== itemId);
                    saveActiveCard({ ...cardData, checklist: nextChecklist });
                };

                const handleAddComment = () => {
                    if (!newCommentText.trim()) return;
                    const newComment = {
                        id: genId(),
                        author: 'Você (Membro)',
                        initials: 'VC',
                        text: newCommentText.trim(),
                        createdAt: Date.now()
                    };
                    const nextComments = [...(cardData.comments || []), newComment];
                    saveActiveCard({ ...cardData, comments: nextComments });
                    setNewCommentText('');
                };

                const changeCardBgColor = (colorHex: string) => {
                    setNodes(prev => {
                        const next = prev.map(n => {
                            if (n.id === activeCardId) return { ...n, color: colorHex };
                            return n;
                        });
                        saveData(next, strokes, viewport);
                        return next;
                    });
                };

                const contentSection = (
                    <div className={activeCardMode === 'sidebar' ? styles.editorWorkspaceSidebar : styles.editorWorkspace}>
                        {/* Title */}
                        <input
                            type="text"
                            className={styles.cardTitleInput}
                            value={cardData.title}
                            onChange={(e) => saveActiveCard({ ...cardData, title: e.target.value })}
                            placeholder="Título do Card..."
                        />

                        {/* Background Color Picker */}
                        <div className={styles.colorPickerContainer}>
                            <span className={styles.cardSectionTitle}>Fundo do Card:</span>
                            {colors.map(col => (
                                <div
                                    key={col.value}
                                    className={`${styles.colorBubble} ${currentCardColor === col.value ? styles.colorBubbleSelected : ''}`}
                                    style={{ backgroundColor: col.value }}
                                    onClick={() => changeCardBgColor(col.value)}
                                    title={col.name}
                                />
                            ))}
                        </div>

                        {/* Text Editor Section */}
                        <div>
                            <span className={styles.cardSectionTitle}>Anotações Notion:</span>
                            <div className={styles.editorTextToolbar} style={{ marginBottom: '8px' }}>
                                <button className={styles.editorToolbarBtn} onClick={() => {
                                    const tx = document.getElementById('card-editor-notepad') as HTMLTextAreaElement;
                                    if (tx) {
                                        const start = tx.selectionStart;
                                        const end = tx.selectionEnd;
                                        const val = tx.value;
                                        const bolded = val.substring(0, start) + '**' + val.substring(start, end) + '**' + val.substring(end);
                                        saveActiveCard({ ...cardData, content: bolded });
                                    }
                                }}>Negrito</button>
                                <button className={styles.editorToolbarBtn} onClick={() => {
                                    const tx = document.getElementById('card-editor-notepad') as HTMLTextAreaElement;
                                    if (tx) {
                                        const start = tx.selectionStart;
                                        const end = tx.selectionEnd;
                                        const val = tx.value;
                                        const italicized = val.substring(0, start) + '*' + val.substring(start, end) + '*' + val.substring(end);
                                        saveActiveCard({ ...cardData, content: italicized });
                                    }
                                }}>Itálico</button>
                                <button className={styles.editorToolbarBtn} onClick={() => {
                                    const tx = document.getElementById('card-editor-notepad') as HTMLTextAreaElement;
                                    if (tx) {
                                        const start = tx.selectionStart;
                                        const end = tx.selectionEnd;
                                        const val = tx.value;
                                        const header = val.substring(0, start) + '\n# ' + val.substring(start, end) + val.substring(end);
                                        saveActiveCard({ ...cardData, content: header });
                                    }
                                }}>Título H1</button>
                                <button className={styles.editorToolbarBtn} onClick={() => {
                                    const tx = document.getElementById('card-editor-notepad') as HTMLTextAreaElement;
                                    if (tx) {
                                        const start = tx.selectionStart;
                                        const end = tx.selectionEnd;
                                        const val = tx.value;
                                        const bullet = val.substring(0, start) + '\n- ' + val.substring(start, end) + val.substring(end);
                                        saveActiveCard({ ...cardData, content: bullet });
                                    }
                                }}>Lista</button>
                            </div>
                            <textarea
                                id="card-editor-notepad"
                                className={styles.cardRichTextarea}
                                value={cardData.content}
                                onChange={(e) => saveActiveCard({ ...cardData, content: e.target.value })}
                                placeholder="Digite suas anotações aqui no formato Markdown (use # para títulos, - para listas, ** para negrito)..."
                            />
                        </div>

                        {/* Checklist Section */}
                        <div>
                            <span className={styles.cardSectionTitle}>Subtarefas / Checklist:</span>
                            <div className={styles.checklistSection}>
                                {(cardData.checklist || []).map(item => (
                                    <div key={item.id} className={styles.checklistItem}>
                                        <input
                                            type="checkbox"
                                            className={styles.checklistCheckbox}
                                            checked={item.checked}
                                            onChange={(e) => updateChecklistItem(item.id, item.text, e.target.checked)}
                                        />
                                        <input
                                            type="text"
                                            className={`${styles.checklistInput} ${item.checked ? styles.checklistInputChecked : ''}`}
                                            value={item.text}
                                            onChange={(e) => updateChecklistItem(item.id, e.target.value, item.checked)}
                                            placeholder="Descreva a subtarefa..."
                                        />
                                        <button className={styles.removeChecklistItemBtn} onClick={() => removeChecklistItem(item.id)} title="Excluir subtarefa">
                                            <Lucide.X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button className={styles.addChecklistItemBtn} onClick={addChecklistItem}>
                                    <Lucide.Plus size={12} />
                                    <span>Adicionar subtarefa</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );

                const commentsSection = (
                    <div className={styles.commentsWorkspace}>
                        <div className={styles.commentsHeader}>
                            <div className={styles.commentsTitle}>
                                <Lucide.MessageSquare size={13} />
                                <span>Discussão & Comentários</span>
                            </div>
                        </div>
                        <div className={styles.commentsList}>
                            {(cardData.comments || []).length === 0 ? (
                                <div className={styles.noComments}>
                                    <Lucide.MessagesSquare size={24} />
                                    <span>Ainda não há comentários.<br/>Use a caixa abaixo para iniciar a discussão.</span>
                                </div>
                            ) : (
                                (cardData.comments || []).map(comm => (
                                    <div key={comm.id} className={styles.commentBubble}>
                                        <div className={styles.commentAvatar}>
                                            {comm.initials || 'VC'}
                                        </div>
                                        <div className={styles.commentContent}>
                                            <div className={styles.commentInfo}>
                                                <span className={styles.commentAuthor}>{comm.author}</span>
                                                <span className={styles.commentTime}>
                                                    {new Date(comm.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className={styles.commentText}>
                                                {comm.text}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className={styles.commentInputArea}>
                            <textarea
                                className={styles.commentTextarea}
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Adicione um comentário importante..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                }}
                            />
                            <div className={styles.commentSubmitRow}>
                                <button className={styles.commentBtn} onClick={handleAddComment}>
                                    Enviar Comentário
                                </button>
                            </div>
                        </div>
                    </div>
                );

                const headerContent = (
                    <>
                        <div className={styles.cardHeaderTitle}>
                            <Lucide.Notebook size={14} />
                            <span>Card Notion — {cardData.title || 'Sem título'}</span>
                        </div>
                        <div className={styles.cardHeaderControls}>
                            <button
                                className={`${styles.modeToggleBtn} ${activeCardMode === 'popup' ? styles.activeModeBtn : ''}`}
                                onClick={() => setActiveCardMode('popup')}
                                title="Visualizar em Pop-up Central"
                            >
                                <Lucide.Maximize2 size={12} />
                                <span>Centro</span>
                            </button>
                            <button
                                className={`${styles.modeToggleBtn} ${activeCardMode === 'sidebar' ? styles.activeModeBtn : ''}`}
                                onClick={() => setActiveCardMode('sidebar')}
                                title="Fixar na Lateral Direita"
                            >
                                <Lucide.ArrowRightToLine size={12} />
                                <span>Lateral</span>
                            </button>
                            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
                            <button className={styles.cardModalClose} onClick={() => { setActiveCardId(null); setActiveCardMode(null); }} title="Fechar editor">
                                <Lucide.X size={16} />
                            </button>
                        </div>
                    </>
                );

                if (activeCardMode === 'sidebar') {
                    return (
                        <div className={styles.cardSidebar}>
                            <div className={styles.cardSidebarHeader}>
                                {headerContent}
                            </div>
                            <div className={styles.cardSidebarContent} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {contentSection}
                                </div>
                                <div style={{ height: '300px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    {commentsSection}
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className={styles.cardOverlay} onClick={() => { setActiveCardId(null); setActiveCardMode(null); }}>
                        <div className={styles.cardPopup} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.cardEditorHeader}>
                                {headerContent}
                            </div>
                            <div className={styles.cardEditorContent}>
                                {contentSection}
                                {commentsSection}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Paste Link Choice Dialog */}
            {pasteLinkDialog && (
                <div className={styles.pasteLinkOverlay} onClick={() => setPasteLinkDialog(null)}>
                    <div className={styles.pasteLinkModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.pasteLinkHeader}>
                            <ExternalLink className={styles.pasteLinkTitleIcon} size={20} />
                            <h3 className={styles.pasteLinkTitle}>Como deseja colar este link?</h3>
                            <button className={styles.pasteLinkCloseBtn} onClick={() => setPasteLinkDialog(null)}>
                                <X size={16} />
                            </button>
                        </div>
                        <p className={styles.pasteLinkSub}>{pasteLinkDialog.url}</p>
                        <div className={styles.pasteLinkOptions}>
                            <button 
                                className={styles.pasteLinkOption} 
                                onClick={() => {
                                    handleInsertLinkAs('embed', pasteLinkDialog.url, pasteLinkDialog.x, pasteLinkDialog.y);
                                    setPasteLinkDialog(null);
                                }}
                            >
                                <div className={styles.pasteLinkOptionIconWrapper}>
                                    <Globe className={styles.pasteLinkIconWeb} size={24} />
                                </div>
                                <div className={styles.pasteLinkOptionText}>
                                    <span className={styles.pasteLinkOptionName}>Navegador Web (Webview)</span>
                                    <span className={styles.pasteLinkOptionDesc}>Inserir navegador interativo (Play/Stop/Presets)</span>
                                </div>
                            </button>

                            <button 
                                className={styles.pasteLinkOption}
                                onClick={() => {
                                    handleInsertLinkAs('link', pasteLinkDialog.url, pasteLinkDialog.x, pasteLinkDialog.y);
                                    setPasteLinkDialog(null);
                                }}
                            >
                                <div className={styles.pasteLinkOptionIconWrapper}>
                                    <ExternalLink className={styles.pasteLinkIconLink} size={24} />
                                </div>
                                <div className={styles.pasteLinkOptionText}>
                                    <span className={styles.pasteLinkOptionName}>Card de Link (Bookmark)</span>
                                    <span className={styles.pasteLinkOptionDesc}>Criar preview de link estático e clicável</span>
                                </div>
                            </button>

                            <button 
                                className={styles.pasteLinkOption}
                                onClick={() => {
                                    handleInsertLinkAs('text', pasteLinkDialog.url, pasteLinkDialog.x, pasteLinkDialog.y);
                                    setPasteLinkDialog(null);
                                }}
                            >
                                <div className={styles.pasteLinkOptionIconWrapper}>
                                    <Type className={styles.pasteLinkIconText} size={24} />
                                </div>
                                <div className={styles.pasteLinkOptionText}>
                                    <span className={styles.pasteLinkOptionName}>Texto Simples</span>
                                    <span className={styles.pasteLinkOptionDesc}>Adicionar a URL como um nó de texto puro</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv,.json,.md" style={{ display: 'none' }} onChange={handleDocUpload} />

            {/* ── Image Lightbox / Full Viewer ── */}
            {lightboxImage && (
                <div
                    className={styles.lightboxOverlay}
                    onClick={() => setLightboxImage(null)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setLightboxImage(null); }}
                    tabIndex={0}
                >
                    {/* Close button */}
                    <button
                        className={styles.lightboxClose}
                        onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
                        title="Fechar (Esc)"
                    >
                        <X size={18} />
                    </button>

                    {/* Image */}
                    <div
                        className={styles.lightboxImageWrap}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightboxImage.src}
                            alt={lightboxImage.fileName || 'Imagem'}
                            className={styles.lightboxImage}
                            draggable={false}
                        />
                    </div>

                    {/* Caption */}
                    {lightboxImage.fileName && (
                        <div className={styles.lightboxCaption}>
                            {lightboxImage.fileName}
                        </div>
                    )}

                    {/* Download button */}
                    <button
                        className={styles.lightboxDownloadBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            const a = document.createElement('a');
                            a.href = lightboxImage.src;
                            a.download = lightboxImage.fileName || 'imagem.png';
                            a.click();
                        }}
                        title="Baixar imagem em resolução original"
                    >
                        <Download size={14} />
                        Download Original
                    </button>
                </div>
            )}

            {/* Custom Dialog Modal */}
            {customDialog.isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}>
                    <div 
                        style={{ padding: '24px', width: '420px', maxWidth: '90%', background: 'rgba(20, 20, 28, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'nodeAppear 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ padding: '10px', background: customDialog.type === 'confirm' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', color: customDialog.type === 'confirm' ? '#f87171' : '#c4b5fd' }}>
                                {customDialog.type === 'confirm' ? <Lucide.AlertTriangle size={24} /> : <Lucide.Edit3 size={24} />}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
                                    {customDialog.type === 'confirm' ? 'Confirmar Ação' : 'Ação Necessária'}
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 }}>
                                    {customDialog.message}
                                </p>
                            </div>
                        </div>
                        
                        {customDialog.type === 'prompt' && (
                            <input 
                                type="text"
                                value={customDialogInputValue}
                                onChange={(e) => setCustomDialogInputValue(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px', background: '#14141c', border: '1px solid #272733', borderRadius: '8px', color: '#f1f5f9', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                onBlur={(e) => e.target.style.borderColor = '#272733'}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        customDialog.onConfirm(customDialogInputValue);
                                        setCustomDialog(prev => ({ ...prev, isOpen: false }));
                                    }
                                }}
                            />
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                            <button 
                                onClick={() => {
                                    customDialog.onCancel();
                                    setCustomDialog(prev => ({ ...prev, isOpen: false }));
                                }}
                                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => {
                                    customDialog.onConfirm(customDialog.type === 'prompt' ? customDialogInputValue : undefined);
                                    setCustomDialog(prev => ({ ...prev, isOpen: false }));
                                }}
                                style={{ padding: '10px 20px', background: customDialog.type === 'confirm' ? '#ef4444' : '#8b5cf6', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', boxShadow: customDialog.type === 'confirm' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(139, 92, 246, 0.3)' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
                            >
                                {customDialog.type === 'confirm' ? 'Excluir' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CanvasMinimap nodes={nodes} viewport={viewport} setViewport={setViewport} containerRef={containerRef} />
        </div>

    );
};

export default InfiniteCanvas;
