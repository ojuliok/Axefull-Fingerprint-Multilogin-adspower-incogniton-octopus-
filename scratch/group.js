const fs = require('fs');

let code = fs.readFileSync('src/renderer/pages/Dashboard.tsx', 'utf8');

// 1. Add collapsedGroups state
if (!code.includes('collapsedGroups')) {
    code = code.replace(
        "const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');",
        "const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');\n    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});\n    const toggleGroup = (key: string) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));"
    );
}

// 2. Add groupedProfiles logic right after filteredProfiles
const filteredProfilesBlock = "return matchesSearch && matchesCategory && matchesFolder && matchesTag;\n    });";
const groupedProfilesLogic = `
    const groupedProfiles = React.useMemo(() => {
        const groups: Record<string, Profile[]> = {};
        filteredProfiles.forEach(p => {
            const key = p.folder_id || 'uncategorized';
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return groups;
    }, [filteredProfiles]);
`;
if (!code.includes('const groupedProfiles')) {
    code = code.replace(filteredProfilesBlock, filteredProfilesBlock + "\n" + groupedProfilesLogic);
}

// 3. Wrap the mondayTableContainer rendering with the groups map
const tableContainerStart = `<div className={styles.mondayTableContainer}>`;
const wrapperStart = `<div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px', width: '100%' }}>
                            {Object.entries(groupedProfiles).map(([groupKey, groupProfiles]: [any, any]) => {
                                const isCollapsed = collapsedGroups[groupKey];
                                const groupColor = getFolderColor(groupKey) || '#64748b';
                                const groupName = getFolderName(groupKey) || (groupKey === 'uncategorized' ? 'Outros' : groupKey);
                                
                                return (
                                    <div key={groupKey} className={styles.boardGroup}>
                                        <div className={styles.boardHeader} onClick={() => toggleGroup(groupKey)}>
                                            <div className={styles.boardHeaderLeft}>
                                                <div style={{ color: groupColor }}>
                                                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                                <h2 className={styles.boardTitle} style={{ color: groupColor }}>{groupName}</h2>
                                                <span className={styles.boardCount}>{groupProfiles.length} Perfis</span>
                                            </div>
                                        </div>
                                        
                                        {!isCollapsed && (
                                            <div className={styles.mondayTableContainer} style={{ marginTop: 0 }}>`;

if (!code.includes('className={styles.boardGroup}')) {
    code = code.replace(tableContainerStart, wrapperStart);
}

// Replace filteredProfiles.map with groupProfiles.map
code = code.replace(`{filteredProfiles.map((profile: Profile) => {`, `{groupProfiles.map((profile: Profile) => {`);

// Close the wrapper
const regexOldEnd = /\s*\}\)\}\s*<\/div>\s*\)\}/;
const newEndStr = `                            })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}`;

if (!code.includes('</div>\n                                        )}\n                                    </div>')) {
    code = code.replace(regexOldEnd, newEndStr);
}

fs.writeFileSync('src/renderer/pages/Dashboard.tsx', code);
console.log("Dashboard grouped mapping modified successfully!");
