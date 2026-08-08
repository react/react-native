#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Formats (or checks) Kotlin with the OSS ktfmt release, so internal and GitHub
# use identical Kotlin formatting. Pass --check to verify without writing.
# Downloads the pinned ktfmt jar on first use (cached under the repo).

set -euo pipefail

# shellcheck source=scripts/lint/_common.sh
source "$(dirname "$0")/_common.sh"

KTFMT_VERSION="0.64"
KTFMT_SHA256="5b3d5286fd2defcc7dc8e28c21ddf156cc6b2d8682bdcd929ce4333e7a6201f2"
CACHE_DIR="${HOME}/.cache/react-native-ktfmt"
JAR="${CACHE_DIR}/ktfmt-${KTFMT_VERSION}-with-dependencies.jar"
URL="https://repo1.maven.org/maven2/com/facebook/ktfmt/${KTFMT_VERSION}/ktfmt-${KTFMT_VERSION}-with-dependencies.jar"

if [ ! -f "$JAR" ]; then
  mkdir -p "$CACHE_DIR"
  echo "Downloading ktfmt ${KTFMT_VERSION}..."
  curl -fsSL --retry 5 --retry-delay 3 --max-time 600 -o "$JAR" "$URL"
fi

# Supply-chain integrity: verify the jar against a pinned SHA-256 before running
# it (sha256sum on Linux/CI, shasum on macOS). A mismatch removes the jar and aborts.
if command -v sha256sum >/dev/null 2>&1; then
  actual_sha=$(sha256sum "$JAR" | awk '{print $1}')
else
  actual_sha=$(shasum -a 256 "$JAR" | awk '{print $1}')
fi
if [ "$actual_sha" != "$KTFMT_SHA256" ]; then
  echo "ktfmt jar checksum mismatch (expected ${KTFMT_SHA256}, got ${actual_sha}); refusing to run." >&2
  rm -f "$JAR"
  exit 1
fi

# ktfmt's default (meta) style matches the repository config: 2-space block
# indent, 4-space continuation, 100 column width. Keep unused imports.
KTFMT_ARGS=(--do-not-remove-unused-imports)
if [ "${1:-}" = "--check" ]; then
  KTFMT_ARGS+=(--dry-run --set-exit-if-changed)
fi

# All tracked Kotlin source (.kt and .kts). @generated (e.g. ReactNativeVersion,
# generated feature-flag files) and internal-only *.fb.* are dropped by
# select_source_files; hand-written sources under a `build` package (e.g.
# ReactBuildConfig.kt) or hermes-engine (build.gradle.kts) are NOT — a substring
# path filter used to skip those by mistake. We format .kts build scripts here too
# (the repo's gradle ktfmt tasks are disabled).
select_source_files '' '*.kt' '*.kts' || exit 1
FILES=("${SELECTED_FILES[@]}")

# ktfmt 0.64 requires Java 17+. Prefer JAVA_HOME (GitHub CI's setup-java sets it),
# then fall back to `java` on PATH; error clearly if neither is new enough.
java_major() {
  local ver
  ver=$("$1" -version 2>&1 | awk -F '"' '/version/ {print $2; exit}')
  [ -z "$ver" ] && return 1
  local major=${ver%%.*}
  [ "$major" = "1" ] && major=$(printf '%s' "$ver" | awk -F. '{print $2}')
  printf '%s' "${major:-0}"
}
JAVA_BIN=""
for cand in "${JAVA_HOME:+$JAVA_HOME/bin/java}" java; do
  [ -n "$cand" ] || continue
  command -v "$cand" >/dev/null 2>&1 || [ -x "$cand" ] || continue
  if [ "$(java_major "$cand" 2>/dev/null || echo 0)" -ge 17 ] 2>/dev/null; then
    JAVA_BIN="$cand"; break
  fi
done
if [ -z "$JAVA_BIN" ]; then
  echo "ktfmt requires Java 17+. Set JAVA_HOME to a JDK 17+ install or put a Java 17+ on PATH." >&2
  exit 1
fi

"$JAVA_BIN" -jar "$JAR" "${KTFMT_ARGS[@]}" "${FILES[@]}"
