import React from 'react';

export type ProfileStatus = 'ready' | 'running' | 'banned' | 'warning' | 'new' | 'farming';

interface StatusBadgeProps {
    status: ProfileStatus;
    onClick?: () => void;
    showDropdown?: boolean;
    onStatusChange?: (status: ProfileStatus) => void;
}

const statusConfig: Record<ProfileStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
    ready: { label: 'READY', color: 'text-green-400', bgColor: 'bg-green-500/20', dotColor: 'bg-green-500' },
    running: { label: 'RUNNING', color: 'text-blue-400', bgColor: 'bg-blue-500/20', dotColor: 'bg-blue-500' },
    banned: { label: 'BANNED', color: 'text-red-400', bgColor: 'bg-red-500/20', dotColor: 'bg-red-500' },
    warning: { label: 'WARNING', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', dotColor: 'bg-yellow-500' },
    new: { label: 'NEW', color: 'text-purple-400', bgColor: 'bg-purple-500/20', dotColor: 'bg-purple-500' },
    farming: { label: 'FARMING', color: 'text-orange-400', bgColor: 'bg-orange-500/20', dotColor: 'bg-orange-500' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    onClick,
    showDropdown = false,
    onStatusChange
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const config = statusConfig[status] || statusConfig.ready;

    const handleClick = () => {
        if (showDropdown && onStatusChange) {
            setIsOpen(!isOpen);
        }
        onClick?.();
    };

    const handleStatusSelect = (newStatus: ProfileStatus) => {
        onStatusChange?.(newStatus);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${config.bgColor} ${config.color} hover:opacity-80 flex items-center gap-1.5`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                {config.label}
            </button>

            {/* Dropdown */}
            {isOpen && showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-dark-950 border border-dark-700 rounded-xl shadow-2xl py-2 min-w-[140px] max-h-[280px] overflow-y-auto animate-fade-in">
                        {(Object.keys(statusConfig) as ProfileStatus[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => handleStatusSelect(s)}
                                className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-colors hover:bg-dark-800 flex items-center gap-2 ${s === status ? statusConfig[s].color : 'text-dark-300'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${statusConfig[s].dotColor}`} />
                                {statusConfig[s].label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default StatusBadge;
