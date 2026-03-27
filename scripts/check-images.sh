#!/bin/bash
# Check all image references in MDX files against actual files on disk.
# Run from the documentation root: bash scripts/check-images.sh

DOCS_DIR="docs"
STATIC_DIR="static"
ERRORS=0

echo "Checking image references in MDX files..."
echo ""

# Check <img src="/img/..." /> tags
grep -rn 'src="/img/[^"]*"' "$DOCS_DIR" --include="*.mdx" | while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  lineno=$(echo "$line" | cut -d: -f2)
  src=$(echo "$line" | grep -o 'src="/img/[^"]*"' | sed 's/src="//;s/"//')
  filepath="$STATIC_DIR$src"
  if [ ! -f "$filepath" ]; then
    echo "BROKEN IMG: $file:$lineno"
    echo "  src=$src"
    echo "  expected: $filepath"
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
done

# Check <ModeScreenshot path="..." /> — these resolve to {Section}/{mode}/{theme}/{Name}.webp
grep -rn 'path="[^"]*"' "$DOCS_DIR" --include="*.mdx" | grep "ModeScreenshot" | while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  lineno=$(echo "$line" | cut -d: -f2)
  path=$(echo "$line" | grep -o 'path="[^"]*"' | sed 's/path="//;s/"//')
  section="${path%%/*}"
  name="${path#*/}"

  # Check if at least jc-google/light version exists (the fallback)
  filepath="$STATIC_DIR/img/ShiftControl/$section/jc-google/light/$name.webp"
  if [ ! -f "$filepath" ]; then
    echo "BROKEN ModeScreenshot: $file:$lineno"
    echo "  path=$path"
    echo "  expected: $filepath"
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
done

# Check <source src="/img/..." /> (video tags)
grep -rn 'src="/img/[^"]*"' "$DOCS_DIR" --include="*.mdx" | grep "<source" | while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  lineno=$(echo "$line" | cut -d: -f2)
  src=$(echo "$line" | grep -o 'src="/img/[^"]*"' | sed 's/src="//;s/"//')
  filepath="$STATIC_DIR$src"
  if [ ! -f "$filepath" ]; then
    echo "BROKEN VIDEO: $file:$lineno"
    echo "  src=$src"
    echo "  expected: $filepath"
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -eq 0 ]; then
  echo "All image references OK."
else
  echo "$ERRORS broken image reference(s) found."
  exit 1
fi
