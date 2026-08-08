#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Self-test for scripts/lint/_common.sh (select_source_files). It locks in the
# guarantees that motivated the helper: the file enumeration must fail loudly
# rather than let a formatter "pass" while checking nothing, and it must drop
# @generated and internal-only *.fb.* files. Runs in both a Git checkout
# (GitHub CI) and a Sapling checkout (fbsource).

set -o pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scripts/lint/_common.sh
source "${DIR}/_common.sh"

fail=0
# check <desc> <want: "ok"|"err"> <actual status>
check() {
  local desc="$1" want="$2" got="$3"
  if { [ "$want" = ok ] && [ "$got" -eq 0 ]; } ||
     { [ "$want" = err ] && [ "$got" -ne 0 ]; }; then
    echo "ok   - $desc"
  else
    echo "FAIL - $desc (wanted $want, got exit $got)"
    fail=1
  fi
}

# 1. Outside any VCS checkout it must error, not silently succeed with no files.
( cd "$(mktemp -d)" && source "${DIR}/_common.sh" && select_source_files '' '*.kt' ) >/dev/null 2>&1
check "errors outside any Git/Sapling checkout" err $?

# 2. A normal enumeration succeeds and returns a non-empty set.
select_source_files '' '*.kt' >/dev/null 2>&1
check "enumerates .kt in this checkout" ok $?
[ "${#SELECTED_FILES[@]}" -gt 0 ]
check "selected set is non-empty" ok $?

# 3. @generated and *.fb.* are never selected.
gen=0 fb=0
for f in "${SELECTED_FILES[@]}"; do
  case "$f" in *.fb.*) fb=1 ;; esac
  grep -Iq '@generated' "$f" 2>/dev/null && gen=1
done
[ "$gen" -eq 0 ]; check "no @generated file selected" ok $?
[ "$fb" -eq 0 ]; check "no *.fb.* file selected" ok $?

# 4. An empty match is an error, not a vacuous pass (the core B1 failure mode).
select_source_files '' '*.nonexistent-ext-xyzzy' >/dev/null 2>&1
check "empty match is treated as failure" err $?

# 5. The exclude regex removes matching paths.
select_source_files 'JsonUtilsTest' '*.kt' >/dev/null 2>&1
kept=0
for f in "${SELECTED_FILES[@]}"; do
  case "$f" in *JsonUtilsTest*) kept=1 ;; esac
done
[ "$kept" -eq 0 ]; check "exclude regex removes matching paths" ok $?

if [ "$fail" -ne 0 ]; then
  echo "lint runner self-test FAILED" >&2
  exit 1
fi
echo "lint runner self-test passed"
