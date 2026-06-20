import React from 'react';
import * as LucideIcons from 'lucide-react';

export const ICON_CATEGORIES = [
  {
    name: 'Principais',
    icons: ['Box', 'LayoutDashboard', 'FileText', 'KanbanSquare', 'Folder']
  },
  {
    name: 'Geral',
    icons: ['FileText', 'Clipboard', 'File', 'Folder', 'FolderOpen', 'Archive', 'Search', 'Layout', 'Settings', 'Home', 'Menu', 'MoreHorizontal', 'MoreVertical']
  },
  {
    name: 'Documentos & Negócios',
    icons: ['Book', 'BarChart', 'TrendingUp', 'TrendingDown', 'Target', 'Briefcase', 'PieChart', 'LineChart', 'Activity', 'Calendar', 'Clock', 'CreditCard', 'DollarSign', 'Wallet']
  },
  {
    name: 'Comunicação',
    icons: ['MessageSquare', 'MessageCircle', 'Mail', 'Inbox', 'Send', 'Phone', 'Bell', 'Video', 'Mic']
  },
  {
    name: 'Design & Criatividade',
    icons: ['Palette', 'Brush', 'PenTool', 'Image', 'Camera', 'Type', 'Wand2', 'Sparkles', 'Star', 'Heart', 'Smile']
  },
  {
    name: 'Desenvolvimento & TI',
    icons: ['Terminal', 'Code', 'Database', 'Server', 'Cpu', 'Monitor', 'Laptop', 'Smartphone', 'Cloud', 'Bug', 'GitBranch', 'Command', 'Hash', 'Globe']
  },
  {
    name: 'Ferramentas & Construção',
    icons: ['Wrench', 'Hammer', 'Ruler', 'Box', 'Layers', 'Puzzle', 'Key', 'Lock', 'Shield', 'Anchor', 'Compass', 'Map', 'Pin']
  },
  {
    name: 'Ciência & Educação',
    icons: ['Microscope', 'Telescope', 'TestTube', 'FlaskConical', 'Atom', 'Brain', 'GraduationCap', 'Library', 'Rocket', 'Flame', 'Lightbulb']
  },
  {
    name: 'Mídia & Entretenimento',
    icons: ['Clapperboard', 'Gamepad2', 'Dices', 'Music', 'Play', 'Radio', 'Headphones', 'Ticket', 'Film', 'Tv']
  }
];

export const CANVAS_ICONS = ICON_CATEGORIES.flatMap(cat => cat.icons);

interface DynamicIconProps {
    name?: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 16, className = '', style }) => {
    // If name is not provided or not found, fallback to FileText
    // Note: We also support emojis historically, so if it contains non-ascii, render it as text
    if (name && /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/.test(name)) {
        return <span style={{ fontSize: size, lineHeight: 1, ...style }} className={className}>{name}</span>;
    }

    const IconCmp = (LucideIcons as any)[name || 'FileText'] || LucideIcons.FileText;
    return <IconCmp size={size} className={className} style={style} />;
};
