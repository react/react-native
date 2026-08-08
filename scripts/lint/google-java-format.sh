#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Formats (or checks) Java with the OSS google-java-format release, so internal
# and GitHub use identical Java formatting. Pass --check to verify without
# writing. Downloads the pinned jar on first use (cached under the repo).

set -euo pipefail

# shellcheck source=scripts/lint/_common.sh
source "$(dirname "$0")/_common.sh"

GJF_VERSION="1.23.0"
GJF_SHA256="7c6375ac24b4825be6bbe61900e8b58b1a3e8944a1367a8363210f9ed2d08570"
CACHE_DIR="${HOME}/.cache/react-native-gjf"
JAR="${CACHE_DIR}/google-java-format-${GJF_VERSION}-all-deps.jar"
URL="https://repo1.maven.org/maven2/com/google/googlejavaformat/google-java-format/${GJF_VERSION}/google-java-format-${GJF_VERSION}-all-deps.jar"

if [ ! -f "$JAR" ]; then
  mkdir -p "$CACHE_DIR"
  echo "Downloading google-java-format ${GJF_VERSION}..."
  curl -fsSL --retry 5 --retry-delay 3 --max-time 300 -o "$JAR" "$URL"
fi

# Supply-chain integrity: verify the jar against a pinned SHA-256 before running
# it (sha256sum on Linux/CI, shasum on macOS). A mismatch removes the jar and aborts.
if command -v sha256sum >/dev/null 2>&1; then
  actual_sha=$(sha256sum "$JAR" | awk '{print $1}')
else
  actual_sha=$(shasum -a 256 "$JAR" | awk '{print $1}')
fi
if [ "$actual_sha" != "$GJF_SHA256" ]; then
  echo "google-java-format jar checksum mismatch (expected ${GJF_SHA256}, got ${actual_sha}); refusing to run." >&2
  rm -f "$JAR"
  exit 1
fi

# google-java-format 1.23 requires Java 17+. Prefer JAVA_HOME (GitHub CI's
# setup-java sets it), then fall back to `java` on PATH.
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
  echo "google-java-format requires Java 17+. Set JAVA_HOME to a JDK 17+ install or put a Java 17+ on PATH." >&2
  exit 1
fi

# google-java-format reaches into JDK compiler internals; JDK 17 needs these open.
JVM_ARGS=(
  --add-exports jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED
  --add-exports jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED
  --add-exports jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED
  --add-exports jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED
  --add-exports jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED
)

# Tracked Java sources; @generated and internal-only *.fb.* are dropped by
# select_source_files.
select_source_files '' '*.java' || exit 1
FILES=("${SELECTED_FILES[@]}")

if [ "${1:-}" = "--check" ]; then
  "$JAVA_BIN" "${JVM_ARGS[@]}" -jar "$JAR" --dry-run --set-exit-if-changed "${FILES[@]}"
else
  "$JAVA_BIN" "${JVM_ARGS[@]}" -jar "$JAR" --replace "${FILES[@]}"
fi
