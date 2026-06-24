import os
import glob

directory = 'c:/Users/FAGNER/Documents/Axefull - Fingerprint/src/renderer'

count = 0
for filepath in glob.glob(directory + '/**/*.tsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace(r"\'var(--text-primary)\'", "'var(--text-primary)'")
    new_content = new_content.replace(r"\'var(--text-secondary)\'", "'var(--text-secondary)'")
    new_content = new_content.replace(r"\'var(--text-tertiary)\'", "'var(--text-tertiary)'")
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        print(f'Fixed quotes in {filepath}')

print(f'Files fixed: {count}')
