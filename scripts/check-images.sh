#!/bin/bash
# Check all image references in MDX files against actual files on disk.
# Also checks mode coverage and detects duplicate screenshots.
# Run from the documentation root: bash scripts/check-images.sh

DOCS_DIR="docs"
STATIC_DIR="static"
ERRORS=0
WARNINGS=0

echo "=== ShiftControl Docs Image QA ==="
echo ""

# ─── Check 1: Broken <img> references ───
echo "## Checking <img> references..."
grep -rn 'src="/img/[^"]*"' "$DOCS_DIR" --include="*.mdx" | grep -v "<source" | while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  lineno=$(echo "$line" | cut -d: -f2)
  src=$(echo "$line" | grep -o 'src="/img/[^"]*"' | sed 's/src="//;s/"//')
  filepath="$STATIC_DIR$src"
  if [ ! -f "$filepath" ]; then
    echo "  BROKEN IMG: $file:$lineno"
    echo "    src=$src"
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
done

# ─── Check 2: Broken ModeScreenshot references (jc-google fallback) ───
echo "## Checking ModeScreenshot references..."
grep -rn 'path="[^"]*"' "$DOCS_DIR" --include="*.mdx" | grep "ModeScreenshot" | while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  lineno=$(echo "$line" | cut -d: -f2)
  path=$(echo "$line" | grep -o 'path="[^"]*"' | sed 's/path="//;s/"//')
  section="${path%%/*}"
  name="${path#*/}"

  filepath="$STATIC_DIR/img/ShiftControl/$section/jc-google/light/$name.webp"
  if [ ! -f "$filepath" ]; then
    echo "  BROKEN ModeScreenshot: $file:$lineno"
    echo "    path=$path"
    echo "    expected: $filepath"
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
done

# ─── Check 3: Mode coverage for ModeScreenshot ───
echo "## Checking mode coverage..."
grep -roh 'path="[^"]*"' "$DOCS_DIR" --include="*.mdx" | sed 's/path="//;s/"//' | sort -u | while IFS= read -r p; do
  section="${p%%/*}"
  name="${p#*/}"
  missing=""
  for mode in jc-google jc-only gws-only; do
    if [ ! -f "$STATIC_DIR/img/ShiftControl/$section/$mode/light/$name.webp" ]; then
      missing="$missing $mode"
    fi
  done
  if [ -n "$missing" ]; then
    echo "  MISSING MODE: $p →$missing"
    WARNINGS=$((WARNINGS + 1))
  fi
done

# ─── Check 4: Broken video/source references ───
echo "## Checking video references..."
grep -rn 'src="/img/[^"]*"' "$DOCS_DIR" --include="*.mdx" | grep "<source" | while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  lineno=$(echo "$line" | cut -d: -f2)
  src=$(echo "$line" | grep -o 'src="/img/[^"]*"' | sed 's/src="//;s/"//')
  filepath="$STATIC_DIR$src"
  if [ ! -f "$filepath" ]; then
    echo "  BROKEN VIDEO: $file:$lineno"
    echo "    src=$src"
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
done

# ─── Check 5: Duplicate detection ───
echo "## Checking for duplicate screenshots..."
DUPES=0
for mode in jc-google jc-only gws-only; do
  count=$(find "$STATIC_DIR/img/ShiftControl" -path "*/$mode/light/*.webp" -exec md5 -r {} \; 2>/dev/null | sort | awk '{print $1}' | uniq -d | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    echo "  $mode: $count duplicate hash groups"
    find "$STATIC_DIR/img/ShiftControl" -path "*/$mode/light/*.webp" -exec md5 -r {} \; 2>/dev/null | sort | awk '{sizes[$1] = sizes[$1] ? sizes[$1] "\n      " $2 : $2} END {for (h in sizes) {n=split(sizes[h], a, "\n"); if (n > 1) print "    DUPES (" n "):\n      " sizes[h]}}'
    DUPES=$((DUPES + count))
  fi
done
if [ "$DUPES" -eq 0 ]; then
  echo "  No duplicates found."
fi

# ─── Summary ───
echo ""
echo "=== Summary ==="
echo "Errors (broken references): $ERRORS"
echo "Warnings (missing modes): $WARNINGS"
echo "Duplicate groups: $DUPES"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "FAIL: $ERRORS broken image reference(s) found."
  exit 1
elif [ "$WARNINGS" -gt 0 ] || [ "$DUPES" -gt 0 ]; then
  echo ""
  echo "WARN: All references resolve but $WARNINGS mode gaps and $DUPES duplicate groups found."
  exit 0
else
  echo ""
  echo "PASS: All checks clean."
  exit 0
fi
