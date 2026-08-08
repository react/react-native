#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Formats (or checks) Python with the OSS ufmt (ruff-api formatter + usort import
# sorting), so internal and GitHub use identical Python formatting. Pass --check
# to verify without writing. Provisions the pinned tools from PyPI on first use.
# Formatter/sorter selection lives in pyproject.toml ([tool.ufmt]).

set -euo pipefail

# shellcheck source=scripts/lint/_common.sh
source "$(dirname "$0")/_common.sh"

# Every one of these affects output (ruff-api is the pinned ruff formatting
# engine; usort orders imports and its output changes across versions), so all
# three are pinned AND verified exactly.
UFMT_VERSION="2.8.0"
RUFF_API_VERSION="0.2.0"
USORT_VERSION="1.0.8.post1"

# Provision into an isolated, version-keyed venv — never the shared `--user` site
# — so another package in the developer's environment can't change formatting and
# two machines/dates produce identical output. The venv is rebuilt if the pins
# drift or the exact installed versions don't match.
PY="${PYTHON:-python3}"
VENV="${HOME}/.cache/react-native-pyfmt/venv-${UFMT_VERSION}-${RUFF_API_VERSION}-${USORT_VERSION}"
UFMT="${VENV}/bin/ufmt"

versions_ok() {
  [ -x "$UFMT" ] || return 1
  "${VENV}/bin/python" - "$UFMT_VERSION" "$RUFF_API_VERSION" "$USORT_VERSION" <<'PYEOF' >/dev/null 2>&1
import sys
from importlib.metadata import version
want = {"ufmt": sys.argv[1], "ruff-api": sys.argv[2], "usort": sys.argv[3]}
sys.exit(0 if all(version(k) == v for k, v in want.items()) else 1)
PYEOF
}

if ! versions_ok; then
  rm -rf "$VENV"
  "$PY" -m venv "$VENV"
  "${VENV}/bin/pip" install --quiet --upgrade pip
  "${VENV}/bin/pip" install --quiet \
    "ufmt==${UFMT_VERSION}" "ruff-api==${RUFF_API_VERSION}" "usort==${USORT_VERSION}"
  versions_ok || {
    echo "pyfmt: failed to provision pinned ufmt/ruff-api/usort in ${VENV}" >&2
    exit 1
  }
fi

# Tracked Python sources; @generated and internal-only *.fb.* dropped by helper.
select_source_files '' '*.py' || exit 1
FILES=("${SELECTED_FILES[@]}")

if [ "${1:-}" = "--check" ]; then
  "$UFMT" check "${FILES[@]}"
else
  "$UFMT" format "${FILES[@]}"
fi
