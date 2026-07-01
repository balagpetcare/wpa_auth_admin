#!/usr/bin/env python3

import os
import sys
from pathlib import Path

def fix_parentheses_in_file(filepath):
    """Fix missing closing parentheses in a file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    fixed_lines = []
    paren_stack = 0  # Track parenthesis nesting level
    
    for i, line in enumerate(lines):
        # Count opening and closing parens on this line
        for char in line:
            if char == '(':
                paren_stack += 1
            elif char == ')':
                paren_stack -= 1
        
        # If we end a line with unclosed parens and the next line doesn't start with ) or },
        # this line likely needs closing parens
        line_open_parens = line.count('(') - line.count(')')
        
        # Check if this line ends in a way that suggests missing closing parens
        stripped = line.rstrip()
        if line_open_parens > 0:
            # Line has unclosed parens
            # Check what it ends with
            if stripped and not stripped.endswith(('{', '[', ',', '(', '&&', '||', '?', ':', '//')):
                # Likely needs closing parens - but be careful about JSX
                if '<' not in stripped or '>' not in stripped:
                    # Add closing parens
                    for _ in range(line_open_parens):
                        line = line.rstrip() + ')' + line[len(line.rstrip()):]
        
        fixed_lines.append(line)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)

# Find and fix all TypeScript/TSX files
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            # Count parens before
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            opens = content.count('(')
            closes = content.count(')')
            
            if opens > closes:
                diff = opens - closes
                print(f"Fixing {filepath}: {diff} missing closing parens")
                fix_parentheses_in_file(filepath)

print("Done!")

