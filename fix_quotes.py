import os
import glob

directory = 'c:/Users/FAGNER/Documents/Axefull - Fingerprint/src/renderer'

for filepath in glob.glob(directory + '/**/*.tsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "\\'var(--bg-card)\\'" in content or "\\'1px solid var(--border-default)\\'" in content or "\\'var(--border-default)\\'" in content:
        new_content = content.replace("\\'var(--bg-card)\\'", "'var(--bg-card)'")
        new_content = new_content.replace("\\'1px solid var(--border-default)\\'", "'1px solid var(--border-default)'")
        new_content = new_content.replace("\\'var(--border-default)\\'", "'var(--border-default)'")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Fixed quotes in {filepath}')
