#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

git fetch origin main >/dev/null 2>&1 || true

CURRENT_REMOTE=$(git rev-parse origin/main)
NEXT_COMMIT=$(git rev-list --reverse origin/main..main | head -n 1)

if [ -n "$NEXT_COMMIT" ]; then
    COMMIT_MSG=$(git log --format="%s" -n 1 "$NEXT_COMMIT")
    echo "Pushing next commit ($NEXT_COMMIT): $COMMIT_MSG"
    git push origin "$NEXT_COMMIT:main"
else
    echo "All commits are up to date on origin/main!"
fi
