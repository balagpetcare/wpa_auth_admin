#!/bin/bash

# Fix specific patterns of missing closing parentheses
echo "Fixing missing closing parentheses..."

# Pattern 1: useState/useMemo/useEffect lines ending with value but missing )
# Example: const [x, setX] = useState(true
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i '/useState.*true[[:space:]]*$/s/$/)/g' "$file"
  sed -i '/useState.*false[[:space:]]*$/s/$/)/g' "$file"
  sed -i '/useState.*null[[:space:]]*$/s/$/)/g' "$file"
  sed -i '/useState.*0[[:space:]]*$/s/$/)/g' "$file"
  sed -i '/useState.*1[[:space:]]*$/s/$/)/g' "$file"
  sed -i '/useState<.*>\([^)]*\)$/s/$/)/g' "$file"
  
  # Pattern 2: Lines ending with closing brace/bracket but missing final )
  # Example: }, [account]
  sed -i '/^[[:space:]]*}, \[.*\][[:space:]]*$/s/$/)/g' "$file"
  
  # Pattern 3: Lines ending with closing brace but missing )
  # Example: }
  # Only fix if it looks like it's part of a useEffect callback
  sed -i '/^[[:space:]]*}[[:space:]]*$/{ n; /^[[:space:]]*}, \[/i\)
}' "$file"
done

echo "Fix pass 1 complete"
