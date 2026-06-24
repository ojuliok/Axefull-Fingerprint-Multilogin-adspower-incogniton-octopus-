import sys
import re

with open('src/renderer/pages/CanvasPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the first duplicate function (the one with `[handleGoHome, navigationStack]`)
pattern1 = re.compile(r'\n\s*const handleBreadcrumbClick = useCallback\(async \(index: number\) => \{.*?\n\s*\}, \[handleGoHome, navigationStack\]\);\n', re.DOTALL)
content = pattern1.sub('\n', content)

# Replace the original one (the one with `await getCanvasData`)
pattern2 = re.compile(r'\n\s*const handleBreadcrumbClick = useCallback\(async \(index: number\) => \{\s*if \(index === -1\) \{\s*handleGoHome\(\);\s*return;\s*\}\s*setNavigationStack\(prev => \{\s*const next = prev\.slice\(0, index \+ 1\);\s*const targetCanvasId = next\[next\.length - 1\]\.id;\s*const data = await getCanvasData\(targetCanvasId\);\s*setActiveCanvasData\(data \|\| \{ nodes: \[\], viewport: \{ x: 0, y: 0, zoom: 1 \} \}\);\s*return next;\s*\}\);\s*\}, \[handleGoHome\]\);\n', re.DOTALL)

replacement = """
    const handleBreadcrumbClick = useCallback(async (index: number) => {
        if (index === -1) {
            handleGoHome();
            return;
        }
        const next = navigationStack.slice(0, index + 1);
        setNavigationStack(next);
        const targetCanvasId = next[next.length - 1].id;
        const data = await getCanvasData(targetCanvasId);
        setActiveCanvasData(data || { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
    }, [handleGoHome, navigationStack]);
"""

content = pattern2.sub(replacement, content)

with open('src/renderer/pages/CanvasPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
