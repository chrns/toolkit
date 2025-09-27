#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.0.9"
  exit 1
fi

VERSION="$1"
TAG="v$VERSION"

# Stage all changes
git add .

# Commit with version message
git commit -m "Release $TAG"

# Create annotated tag
git tag -a "$TAG" -m "Release $TAG"

# Push commit and tag
git push origin HEAD
git push origin "$TAG"

echo "Pushed commit and tag $TAG to origin"
