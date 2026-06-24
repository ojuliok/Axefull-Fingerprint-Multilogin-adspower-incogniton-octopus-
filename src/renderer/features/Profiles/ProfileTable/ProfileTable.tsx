import React from 'react';
import StatusBadge, { ProfileStatus } from '../../../components/ui/StatusBadge/StatusBadge';
import InlineNoteEditor from '../../Notes/InlineNoteEditor/InlineNoteEditor';

interface Profile {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    last_used: string | null;
    notes: string | null;
    status: ProfileStatus;
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

interface ProfileTableProps {
    profiles: Profile[];
    selectedIds: string[];
    onSelectProfile: (id: string) => void;
    onSelectAll: () => void;
    onLaunch: (id: string) => void;
    onClose: (id: string) => void;
    onEdit: (profile: Profile) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ProfileStatus) => void;
    onNotesChange: (id: string, notes: string) => void;
}

const ProfileTable: React.FC<ProfileTableProps> = ({
    profiles,
    selectedIds,
    onSelectProfile,
    onSelectAll,
    onLaunch,
    onClose,
    onEdit,
    onDelete,
    onStatusChange,
    onNotesChange,
}) => {
    // Get platform icon
    const getPlatformIcon = (platform: string) => {
        if (platform.includes('Win')) return '🪟';
        if (platform.includes('Mac')) return '🍎';
        return '🐧';
    };

    // Get browser info
    const getBrowserInfo = (profile: Profile) => {
        const type = profile.browser_type || 'chromium';
        if (type === 'firefox') return { name: 'Firefox', icon: '🦊' };
        return { name: 'Chrome', icon: '🌍' };
    };

    // Format date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const allSelected = profiles.length > 0 && selectedIds.length === profiles.length;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-theme-border text-left">
                        <th className="px-4 py-3 w-10">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={onSelectAll}
                                className="w-5 h-5 rounded-full border-2 border-theme-border/50 bg-theme-card text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all duration-200"
                            />
                        </th>
                        <th className="px-4 py-3 text-theme-text font-medium">Profile Name</th>
                        <th className="px-4 py-3 text-theme-text font-medium">Status</th>
                        <th className="px-4 py-3 text-theme-text font-medium min-w-[200px]">Notes</th>
                        <th className="px-4 py-3 text-theme-text font-medium">Proxy</th>
                        <th className="px-4 py-3 text-theme-text font-medium">Created</th>
                        <th className="px-4 py-3 text-theme-text font-medium">Last Used</th>
                        <th className="px-4 py-3 text-theme-text font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {profiles.map((profile) => {
                        const isActive = profile.is_active === 1;
                        const isSelected = selectedIds.includes(profile.id);
                        const browserInfo = getBrowserInfo(profile);

                        return (
                            <tr
                                key={profile.id}
                                className={`border-b border-theme-border transition-colors hover:bg-theme-surface ${isSelected ? 'bg-primary-500/10' : ''
                                    } ${isActive ? 'bg-green-500/5' : ''}`}
                            >
                                {/* Checkbox */}
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onSelectProfile(profile.id)}
                                        className="w-5 h-5 rounded-full border-2 border-theme-border/50 bg-theme-card text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all duration-200"
                                    />
                                </td>

                                {/* Profile Name */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/30 to-amber-500/20 flex items-center justify-center text-lg shadow-lg shadow-primary-500/10">
                                            {getPlatformIcon(profile.fingerprint.platform)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-theme-text flex items-center gap-2">
                                                {profile.name}
                                                {isActive && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-theme-text-muted flex items-center gap-1">
                                                <span>{browserInfo.icon}</span>
                                                <span>{browserInfo.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3">
                                    <StatusBadge
                                        status={profile.status}
                                        showDropdown={true}
                                        onStatusChange={(status) => onStatusChange(profile.id, status)}
                                    />
                                </td>

                                {/* Notes */}
                                <td className="px-4 py-3">
                                    <InlineNoteEditor
                                        value={profile.notes}
                                        onChange={(notes) => onNotesChange(profile.id, notes)}
                                    />
                                </td>

                                {/* Proxy */}
                                <td className="px-4 py-3">
                                    {profile.proxy ? (
                                        <span className="text-green-400 text-xs">
                                            {profile.proxy.type.toUpperCase()} • {profile.proxy.host}
                                        </span>
                                    ) : (
                                        <span className="text-theme-text-muted text-xs">No proxy</span>
                                    )}
                                </td>

                                {/* Created */}
                                <td className="px-4 py-3 text-theme-text-muted">
                                    <div>{formatDate(profile.created_at)}</div>
                                    <div className="text-xs">{formatTime(profile.created_at)}</div>
                                </td>

                                {/* Last Used */}
                                <td className="px-4 py-3 text-theme-text-muted">
                                    <div>{formatDate(profile.last_used)}</div>
                                    {profile.last_used && (
                                        <div className="text-xs">{formatTime(profile.last_used)}</div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        {isActive ? (
                                            <button
                                                onClick={() => onClose(profile.id)}
                                                className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                            >
                                                STOP
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onLaunch(profile.id)}
                                                className="px-4 py-1.5 text-xs font-medium rounded-lg gradient-primary text-theme-text hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary-500/20"
                                            >
                                                START
                                            </button>
                                        )}

                                        {/* More actions menu */}
                                        <div className="relative group">
                                            <button className="p-1.5 rounded-md text-theme-text-muted hover:bg-theme-card hover:text-theme-text transition-colors">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>

                                            {/* Dropdown menu */}
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-theme-surface border border-theme-border rounded-lg shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                                <button
                                                    onClick={() => onEdit(profile)}
                                                    className="w-full px-3 py-2 text-left text-xs text-theme-text hover:bg-theme-card hover:text-theme-text transition-colors"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => onDelete(profile.id)}
                                                    className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {profiles.length === 0 && (
                <div className="text-center py-12 text-theme-text-muted">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    <p className="text-lg font-medium">No profiles found</p>
                    <p className="text-sm mt-1">Create your first profile to get started</p>
                </div>
            )}
        </div>
    );
};

export default ProfileTable;
