import React from 'react';

interface Profile {
    id: string;
    name: string;
    created_at: string;
    is_active: number;
    browser_type?: 'chromium' | 'firefox';
    fingerprint: {
        user_agent: string;
        platform: string;
        timezone: string;
    };
    proxy: {
        type: string;
        host: string;
        port: number;
    } | null;
}

interface ProfileCardProps {
    profile: Profile;
    onLaunch: () => void;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    onLaunch,
    onClose,
    onEdit,
    onDelete,
}) => {
    const isActive = profile.is_active === 1;

    // Extract browser name from browser_type
    const getBrowserInfo = () => {
        const type = profile.browser_type || 'chromium';
        if (type === 'firefox') return { name: 'Firefox', icon: '🦊' };
        return { name: 'Chrome', icon: '🌍' };
    };

    const browserInfo = getBrowserInfo();

    // Get platform icon
    const getPlatformIcon = () => {
        const platform = profile.fingerprint.platform;
        if (platform.includes('Win')) return '🪟';
        if (platform.includes('Mac')) return '🍎';
        return '🐧';
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={`card card-hover relative overflow-hidden ${isActive ? 'border-green-500/50' : ''}`}>
            {/* Active indicator */}
            {isActive && (
                <div className="absolute top-3 right-3">
                    <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full pulse-ring" />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
                    {getPlatformIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{profile.name}</h3>
                    <p className="text-sm text-dark-400">{formatDate(profile.created_at)} · {formatTime(profile.created_at)}</p>
                </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{browserInfo.icon}</span>
                    <span className="text-dark-300">{browserInfo.name}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">🌍</span>
                    <span className="text-dark-300">{profile.fingerprint.timezone}</span>
                </div>

                {profile.proxy ? (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">🔒</span>
                        <span className="text-green-400">
                            {profile.proxy.type.toUpperCase()} • {profile.proxy.host}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">🔓</span>
                        <span className="text-dark-400">Sem proxy</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {isActive ? (
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                ) : (
                    <button
                        onClick={onLaunch}
                        className="flex-1 py-2 rounded-lg gradient-primary text-white hover:opacity-90 transition-opacity font-medium shadow-lg shadow-primary-500/20"
                    >
                        Abrir
                    </button>
                )}

                <button
                    onClick={onEdit}
                    className="p-2 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white transition-colors"
                    title="Editar"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>

                <button
                    onClick={onDelete}
                    className="p-2 rounded-lg bg-dark-700 text-dark-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    title="Excluir"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ProfileCard;
