#!/bin/bash

fix_file() {
  local file="$1"
  local temp_file="$file.tmp"
  
  # Process the file line by line
  while IFS= read -r line; do
    # Count opening and closing delimiters on this line
    opens=$(echo "$line" | grep -o '[({[]' | wc -l)
    closes=$(echo "$line" | grep -o '[)}\]]' | wc -l)
    diff=$((opens - closes))
    
    # If we have unmatched opening delimiters at the end, add closing ones
    if [ "$diff" -gt 0 ]; then
      # Check if line ends with something that needs a closing delimiter
      if [[ "$line" =~ ^[[:space:]]*$ ]]; then
        # Empty or whitespace-only line, don't modify
        echo "$line"
      elif [[ "$line" =~ true[[:space:]]*$ ]] || [[ "$line" =~ false[[:space:]]*$ ]] || [[ "$line" =~ null[[:space:]]*$ ]] || [[ "$line" =~ [0-9][[:space:]]*$ ]]; then
        # Line ending with a value - likely missing closing parens for useState/useMemo/etc
        # Add closing parens
        for ((i=0; i<diff; i++)); do
          line="$line)"
        done
        echo "$line"
      elif [[ "$line" =~ \}[[:space:]]*$ ]]; then
        # Line ending with closing brace - might need closing paren for useState/etc
        if [ "$diff" -eq 1 ]; then
          echo "$line)"
        else
          echo "$line"
        fi
      elif [[ "$line" =~ \][[:space:]]*$ ]]; then
        # Line ending with closing bracket - might need closing paren for useState/etc
        if [ "$diff" -eq 1 ]; then
          echo "$line)"
        else
          echo "$line"
        fi
      else
        echo "$line"
      fi
    else
      echo "$line"
    fi
  done < "$file" > "$temp_file"
  
  mv "$temp_file" "$file"
}

export -f fix_file

# Get list of files with unbalanced delimiters
echo "Fixing files with unbalanced delimiters..."
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  opens=$(grep -o '[({[]' "$file" | wc -l)
  closes=$(grep -o '[)}\]]' "$file" | wc -l)
  if [ "$opens" -ne "$closes" ]; then
    echo "Fixing: $file (opens=$opens, closes=$closes)"
    fix_file "$file"
  fi
done

