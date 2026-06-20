import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Profile, Folder } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { TagTemplate, FolderCustomization, DEFAULT_TAG_TEMPLATES } from '../../../utils/constants';

interface DashboardContextType {
    profiles: Profile[];
    setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    folders: Folder[];
    setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
    selectedCategory: string;
    setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
    selectedFolder: string | null;
    setSelectedFolder: React.Dispatch<React.SetStateAction<string | null>>;
    selectedTag: string | null;
    setSelectedTag: React.Dispatch<React.SetStateAction<string | null>>;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    viewMode: 'grid' | 'list';
    setViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
    selectedProfileIds: string[];
    setSelectedProfileIds: React.Dispatch<React.SetStateAction<string[]>>;
    loadProfiles: () => Promise<void>;
    handleUpdateProfile: (profileId: string, data: any) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { toast } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const result = await window.api.profiles.list();
            if (result.success) {
                setProfiles(result.data as Profile[]);
            }
            
            const foldersResult = await window.api.profiles.listFolders();
            if (foldersResult.success) {
                setFolders(foldersResult.data as Folder[]);
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (profileId: string, data: any) => {
        try {
            const result = await window.api.profiles.update(profileId, data);
            if (result.success) {
                setProfiles(prev => prev.map(p => 
                    p.id === profileId ? { ...p, ...data } : p
                ));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    return (
        <DashboardContext.Provider value={{
            profiles, setProfiles,
            loading, setLoading,
            folders, setFolders,
            selectedCategory, setSelectedCategory,
            selectedFolder, setSelectedFolder,
            selectedTag, setSelectedTag,
            searchQuery, setSearchQuery,
            viewMode, setViewMode,
            selectedProfileIds, setSelectedProfileIds,
            loadProfiles, handleUpdateProfile
        }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboardContext = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboardContext must be used within a DashboardProvider');
    }
    return context;
};
