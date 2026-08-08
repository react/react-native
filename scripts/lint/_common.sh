# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Shared helpers for the scripts/lint/*.sh formatter runners. Not executable on
# its own; sourced by the runners.

# select_source_files <exclude_regex> <glob>...
#
# Enumerates tracked files matching the globs and populates the global array
# SELECTED_FILES with the ones a repository formatter should touch. It:
#   * works in BOTH a Git checkout (GitHub CI) and a Sapling checkout (fbsource),
#   * captures the enumerator's exit status and returns non-zero on failure — a
#     broken checkout must never let a formatter "pass" by silently checking
#     nothing (a bare `git ls-files` inside process substitution would),
#   * drops paths matching <exclude_regex> (may be empty),
#   * drops internal-only `*.fb.*` variants (not synced to GitHub; kept on the
#     central lint engine),
#   * drops `@generated` files (generated + SignedSource-signed outputs must be
#     formatted by their generator, not reformatted here),
#   * returns non-zero if the result is empty (treated as an enumeration failure).
select_source_files() {
  local exclude_re="$1"
  shift

  local raw status
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    raw="$(git ls-files -- "$@")"
    status=$?
  elif command -v sl >/dev/null 2>&1 && sl root >/dev/null 2>&1; then
    # Sapling: translate each `*.ext` glob to a recursive `glob:**/*.ext` fileset.
    local pats=() g
    for g in "$@"; do
      pats+=("glob:**/${g}")
    done
    raw="$(sl files "${pats[@]}")"
    status=$?
  else
    echo "error: $(basename "$0") must be run inside a Git or Sapling checkout" >&2
    return 1
  fi
  if [ "$status" -ne 0 ]; then
    echo "error: $(basename "$0") could not enumerate files ($*)" >&2
    return 1
  fi

  SELECTED_FILES=()
  local f
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    case "$f" in
      *.fb.*) continue ;;
    esac
    if [ -n "$exclude_re" ] && printf '%s\n' "$f" | grep -qE "$exclude_re"; then
      continue
    fi
    grep -Iq '@generated' "$f" 2>/dev/null && continue
    SELECTED_FILES+=("$f")
  done <<SELECT_EOF
$raw
SELECT_EOF

  if [ "${#SELECTED_FILES[@]}" -eq 0 ]; then
    echo "error: $(basename "$0") matched no files ($*) — refusing to run; the file enumeration likely failed for this checkout" >&2
    return 1
  fi
}
