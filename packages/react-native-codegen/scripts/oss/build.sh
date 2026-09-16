#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script assumes yarn is already installed.

THIS_DIR=$(cd -P "$(dirname "$(realpath "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

set -e
set -u

CODEGEN_DIR="$THIS_DIR/../.."

rm -rf "${CODEGEN_DIR:?}/lib" "${CODEGEN_DIR:?}/node_modules"

# Fallback to npm if yarn is not available
if [ -x "$(command -v yarn)" ]; then
  YARN_OR_NPM=$(command -v yarn)
else
  YARN_OR_NPM=$(command -v npm)
fi
YARN_BINARY="${YARN_BINARY:-$YARN_OR_NPM}"

# mv command to use when copying files into the working directory
SAFE_MV="mv"

# Detect if we are on a VirtioFS volume via Apple Virtualization.framework
if [[ "$OSTYPE" == "darwin"* ]] && /sbin/mount | /usr/bin/awk -v dev="$(/bin/df -P "$CODEGEN_DIR" | /usr/bin/awk 'NR==2 {print $1}')" '$1 == dev && /AppleVirtIOFS/ { found=1 } END { exit !found }'; then
  SAFE_MV="/bin/cp -R -X"
fi

if [ -x "$(command -v eden)" ]; then
  pushd "$THIS_DIR"

  # Detect if we are in an EdenFS checkout with `eden info` (we ignore the output as it creates noise on CI/IDE logs)
  # Also be sure to use /bin/cp in case users have GNU coreutils installed which is incompatible with -X
  if [[ "$OSTYPE" == "darwin"* ]] && eden info 2>/dev/null; then
    SAFE_MV="/bin/cp -R -X"
  fi

  popd >/dev/null
fi

if [[ ${FBSOURCE_ENV:-0} -eq 1 ]]; then
  # Custom FB-specific setup
  pushd "$CODEGEN_DIR" >/dev/null

  "$YARN_BINARY" install 2> >(grep -v '^warning' 1>&2)
  # Note: Within FBSOURCE_ENV, this has to explicitly run build.
  "$YARN_BINARY" run build

  popd >/dev/null

else
  # Run yarn install in a separate tmp dir to avoid conflict with the rest of the repo.
  # Note: OSS-only.
  TMP_DIR=$(mktemp -d)

  # On Windows this script gets run by a seprate Git Bash instance, which cannot perform the copy
  # due to file locks created by the host process. Need to exclude .lock files while copying.
  # Using in-memory tar operation because piping `find` and `grep` doesn't preserve folder structure
  # during recursive copying, and `rsync` is not installed by default in Git Bash.
  # As an added benefit, blob copy is faster.
  if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "cygwin" ]; then
    tar cf - --exclude='*.lock' "$CODEGEN_DIR" | (cd "$TMP_DIR" && tar xvf - );
  else
    /bin/cp -R "$CODEGEN_DIR/." "$TMP_DIR";
  fi

  pushd "$TMP_DIR" >/dev/null

  # Note: this automatically runs build as well.
  "$YARN_BINARY" install 2> >(grep -v '^warning' 1>&2)

  popd >/dev/null

  $SAFE_MV "$TMP_DIR/lib" "$CODEGEN_DIR"
  $SAFE_MV "$TMP_DIR/node_modules" "$CODEGEN_DIR"
  rm -rf "$TMP_DIR"
fi
