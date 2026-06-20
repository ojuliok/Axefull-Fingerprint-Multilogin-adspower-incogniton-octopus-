import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';

interface MiniSidebarItemProps {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    danger?: boolean;
    badge?: number;
    badgeDanger?: boolean;
    color?: string;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}

export const MiniSidebarItem: React.FC<MiniSidebarItemProps> = ({
    icon: Icon, label, active, danger, badge, badgeDanger, color,
    onClick, onContextMenu, onDragOver, onDrop
}) => {
    const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

    const showTip = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setTip({ x: rect.right + 10, y: rect.top + rect.height / 2 });
    };

    return (
        <>
            <div
                className={[
                    styles.miniItem,
                    active && !danger ? styles.miniItemActive : '',
                    danger ? (active ? styles.miniItemDangerActive : styles.miniItemDanger) : '',
                ].filter(Boolean).join(' ')}
                onClick={onClick}
                onContextMenu={onContextMenu}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onMouseEnter={showTip}
                onMouseLeave={() => setTip(null)}
            >
                <Icon size={20} style={color ? { color } : {}} />
                {badge !== undefined && badge > 0 && (
                    <span className={`${styles.miniBadge} ${badgeDanger ? styles.miniBadgeDanger : ''}`}>
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </div>
            {tip && (
                <div
                    className={styles.miniTooltipFixed}
                    style={{ left: tip.x, top: tip.y }}
                    onMouseEnter={() => setTip(null)}
                >
                    {label}
                </div>
            )}
        </>
    );
};
