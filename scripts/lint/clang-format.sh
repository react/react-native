#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Formats (or checks) C/C++/Obj-C with the OSS clang-format release, so internal
# and GitHub use identical native formatting. Pass --check to verify without
# writing. Provisions the pinned clang-format from PyPI on first use.

set -euo pipefail

# shellcheck source=scripts/lint/_common.sh
source "$(dirname "$0")/_common.sh"

CLANG_FORMAT_VERSION="21.1.2"

CF="clang-format"
if ! "$CF" --version 2>/dev/null | grep -q "$CLANG_FORMAT_VERSION"; then
  # PyPI's clang-format wheel bundles the matching LLVM binary (public toolchain).
  python3 -m pip install --quiet --user "clang-format==${CLANG_FORMAT_VERSION}"
  CF="$(python3 -m site --user-base)/bin/clang-format"
fi

# Tracked native sources, excluding vendored trees; @generated and internal-only
# *.fb.* are dropped by select_source_files.
select_source_files 'ReactCommon/yoga/|ReactCommon/jsi/jsi/|/third-party/|/vendor/|/yogajni/|FBXXHashUtils\.h' '*.h' '*.cpp' '*.mm' '*.m' || exit 1
FILES=("${SELECTED_FILES[@]}")

if [ "${1:-}" = "--check" ]; then
  "$CF" --dry-run --Werror "${FILES[@]}"
else
  "$CF" -i "${FILES[@]}"
fi
