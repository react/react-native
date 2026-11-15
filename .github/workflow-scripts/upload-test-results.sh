#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copies Test All's test results for one run attempt to GCS, for
# upload-test-results.yml. Artifacts, including those from forks, are treated
# as inert data: only each one's results.json is copied, after validation, and
# nothing in them is executed.
#
#   upload-test-results.sh list      Stage artifacts.json, and output whether
#                                    this attempt should be recorded
#   upload-test-results.sh collect   Stage each downloaded results.json
#   upload-test-results.sh describe  Stage run.json from $WORKFLOW_RUN
#   upload-test-results.sh upload    Copy $DEST to $PREFIX, run.json last

set -euo pipefail

MAX_RESULTS_BYTES=1048576
STATE_ARTIFACT='^e2e_[a-z]+_[a-z]+_state_[A-Za-z0-9_-]+$'
# The artifacts the workflow's e2e_*_state_* download pattern matches.
DOWNLOAD_PATTERN='^e2e_.*_state_'

retry() {
  for attempt in 1 2 3; do
    "$@" && return 0
    echo "Attempt $attempt failed"
    sleep $((attempt * 10))
  done
  return 1
}

list_artifacts() {
  gh api --paginate "repos/$GITHUB_REPOSITORY/actions/runs/$RUN_ID/artifacts?per_page=100" --jq '.artifacts[]' > /tmp/artifacts.jsonl
}

list() {
  mkdir -p "$DEST"
  retry list_artifacts
  # A rerun replaces the per-flow state of the jobs it reruns, so once a later
  # attempt has replaced any, this attempt's results are gone and it isn't
  # recorded.
  if jq -e --slurp --arg pattern "$DOWNLOAD_PATTERN" '[.[] | select(.created_at > env.RUN_UPDATED_AT and (.name | test($pattern)))] | length > 0' /tmp/artifacts.jsonl > /dev/null; then
    echo "A later attempt replaced this attempt's test state, so it isn't recorded"
    echo "record=false" >> "$GITHUB_OUTPUT"
    return
  fi
  # Every artifact from this attempt, so recordings and logs can be linked.
  jq --slurp --arg base "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$RUN_ID/artifacts" '[.[]
    | select(.created_at <= env.RUN_UPDATED_AT)
    | {id, name, sizeInBytes: .size_in_bytes, createdAt: .created_at, expiresAt: .expires_at, expired, url: "\($base)/\(.id)"}]' \
    /tmp/artifacts.jsonl > "$DEST/artifacts.json"
  echo "record=true" >> "$GITHUB_OUTPUT"
}

# Stages one artifact's results.json, if it's a regular file of valid JSON
# within the size limit.
copy_results() {
  local name=$1 file=$2
  if [[ "$name" =~ $STATE_ARTIFACT && -f "$file" && ! -L "$file" ]] &&
    (( $(wc -c < "$file") <= MAX_RESULTS_BYTES )) && jq empty "$file" 2>/dev/null; then
    mkdir -p "$DEST/artifacts/$name"
    cp "$file" "$DEST/artifacts/$name/results.json"
  else
    echo "Skipping ${name:-artifact}: no results.json, too large or not JSON"
  fi
}

collect() {
  mkdir -p "$DEST/artifacts"
  # download-artifact extracts a single matching artifact without a directory
  # of its own.
  if [[ -e "$DOWNLOADS/results.json" ]]; then
    copy_results "$(jq -r --arg pattern "$DOWNLOAD_PATTERN" '[.[].name | select(test($pattern))] | if length == 1 then .[0] else "" end' "$DEST/artifacts.json")" "$DOWNLOADS/results.json"
  else
    for dir in "$DOWNLOADS"/*/; do
      if [[ -d "$dir" ]]; then
        copy_results "$(basename "$dir")" "$dir/results.json"
      fi
    done
  fi
  find "$DEST" -type f
}

describe() {
  # pull_requests omits fork PRs and can list unrelated PRs on a push, so only
  # PRs into this repository are kept, and only for pull request runs. The head
  # repository and branch identify a fork PR.
  jq --argjson repoId "$REPO_ID" '{
    repository: .repository.full_name,
    runId: .id,
    runAttempt: .run_attempt,
    event,
    conclusion,
    headSha: .head_sha,
    headBranch: .head_branch,
    headRepository: .head_repository.full_name,
    pullRequests: (if .event == "pull_request"
      then [.pull_requests[] | select(.base.repo.id == $repoId) | .number]
      else [] end),
    createdAt: .created_at,
    runStartedAt: .run_started_at,
    updatedAt: .updated_at,
    url: .html_url
  }' <<< "$WORKFLOW_RUN" > "$DEST/run.json"
  cat "$DEST/run.json"
}

upload() {
  if [[ -n "$(ls -A "$DEST/artifacts")" ]]; then
    retry gcloud storage cp --recursive --no-clobber "$DEST/artifacts" "$PREFIX/"
  fi
  retry gcloud storage cp --no-clobber "$DEST/artifacts.json" "$PREFIX/artifacts.json"
  # A run is complete once its run.json exists, so it goes last.
  retry gcloud storage cp --no-clobber "$DEST/run.json" "$PREFIX/run.json"
}

case "${1:-}" in
  list | collect | describe | upload) "$1" ;;
  *)
    echo "Usage: $0 list|collect|describe|upload" >&2
    exit 1
    ;;
esac
