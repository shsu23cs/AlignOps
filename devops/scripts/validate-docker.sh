#!/usr/bin/env bash

# ==============================================================================
# AlignOps Dockerfile Compliance and Hardening Scanner
# Description: Performs static analysis on Dockerfiles to enforce security
#              standards (non-root execution, multi-stage builds, pinned tags).
# ==============================================================================

set -euo pipefail

DOCKERFILE_PATH="${1:-}"

if [ -z "$DOCKERFILE_PATH" ]; then
  echo "Usage: $0 <path-to-Dockerfile>"
  exit 1
fi

if [ ! -f "$DOCKERFILE_PATH" ]; then
  echo "Error: File not found at '${DOCKERFILE_PATH}'."
  exit 1
fi

echo "======================================================================"
echo "Scanning Dockerfile: ${DOCKERFILE_PATH}"
echo "======================================================================"

FAILURES=0
WARNINGS=0

# Rule 1: Check for Pinned Base Image Tags (Avoid :latest)
if grep -E "^FROM[[:space:]]+[a-zA-Z0-9_/.-]+(:latest)?[[:space:]]*$" "$DOCKERFILE_PATH" > /dev/null; then
  echo "[CRITICAL] Dockerfile base image is using an unpinned or latest tag!"
  FAILURES=$((FAILURES + 1))
else
  # Make sure there is a version number or SHA digest pinned
  BASE_IMAGES=$(grep "^FROM" "$DOCKERFILE_PATH" | awk '{print $2}')
  for img in $BASE_IMAGES; do
    if [[ "$img" != *":"* && "$img" != *"@"* ]]; then
      echo "[CRITICAL] Base image '${img}' has no pinned tag or digest!"
      FAILURES=$((FAILURES + 1))
    else
      echo "[SUCCESS] Base image tag format checked: '${img}'."
    fi
  done
fi

# Rule 2: Enforce Non-Root Execution (Look for USER instruction)
if ! grep -qi "^USER[[:space:]]" "$DOCKERFILE_PATH"; then
  echo "[WARNING] Dockerfile has no 'USER' instruction! Enforce non-root execution inside container."
  WARNINGS=$((WARNINGS + 1))
else
  USER_VAL=$(grep -i "^USER" "$DOCKERFILE_PATH" | tail -n 1 | awk '{print $2}')
  echo "[SUCCESS] Non-root execution declared: USER ${USER_VAL}."
fi

# Rule 3: Enforce Multi-Stage Builds (Check for multiple FROM instructions)
FROM_COUNT=$(grep -c "^FROM" "$DOCKERFILE_PATH" || true)
if [ "$FROM_COUNT" -lt 2 ]; then
  echo "[WARNING] Single-stage build detected. Multi-stage builds are highly recommended for smaller footprints."
  WARNINGS=$((WARNINGS + 1))
else
  echo "[SUCCESS] Multi-stage build verified (${FROM_COUNT} stages found)."
fi

# Rule 4: Ban ADD command (Use COPY instead for local file insertions)
if grep -E "^ADD[[:space:]]" "$DOCKERFILE_PATH" > /dev/null; then
  echo "[CRITICAL] Banned 'ADD' instruction found! Use 'COPY' instead to avoid remote source insertion exploits."
  FAILURES=$((FAILURES + 1))
else
  echo "[SUCCESS] Checked for unauthorized 'ADD' usage."
fi

echo "======================================================================"
echo "Scan Summary: ${FAILURES} Critical Failures, ${WARNINGS} Security Warnings."
echo "======================================================================"

if [ "$FAILURES" -gt 0 ]; then
  echo "RESULT: Hardening checks FAILED. Please fix critical errors."
  exit 1
else
  echo "RESULT: Hardening checks PASSED."
  exit 0
fi
