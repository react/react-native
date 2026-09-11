/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MARKER = '<!-- react-native-format-report -->';
const MAX_ARTIFACT_BYTES = 1024 * 1024;
const MAX_COMMENTS = 20;
const MAX_REPLACEMENT_LINES = 100;

function readBoundedFile(file) {
  return fs.readFileSync(file, 'utf8').slice(0, MAX_ARTIFACT_BYTES);
}

function safePatchPath(candidate) {
  return candidate !== '' &&
    !candidate.includes('\0') &&
    !candidate.split('/').includes('..') &&
    !path.posix.isAbsolute(candidate)
    ? candidate
    : null;
}

function changedFilesFromPatch(patch) {
  return [
    ...new Set(
      patch
        .split('\n')
        .filter(line => line.startsWith('+++ b/'))
        .map(line => safePatchPath(line.slice(6)))
        .filter(Boolean),
    ),
  ];
}

function parsePatch(patch) {
  const changes = [];
  let file = null;
  let hunk = null;

  function finishHunk() {
    const completedHunk = hunk;
    hunk = null;
    if (file == null || completedHunk == null) {
      return;
    }
    let prefix = 0;
    while (
      prefix < completedHunk.oldLines.length &&
      prefix < completedHunk.newLines.length &&
      completedHunk.oldLines[prefix] === completedHunk.newLines[prefix]
    ) {
      prefix++;
    }
    let suffix = 0;
    while (
      suffix < completedHunk.oldLines.length - prefix &&
      suffix < completedHunk.newLines.length - prefix &&
      completedHunk.oldLines[completedHunk.oldLines.length - suffix - 1] ===
        completedHunk.newLines[completedHunk.newLines.length - suffix - 1]
    ) {
      suffix++;
    }
    const oldLines = completedHunk.oldLines.slice(
      prefix,
      completedHunk.oldLines.length - suffix,
    );
    const newLines = completedHunk.newLines.slice(
      prefix,
      completedHunk.newLines.length - suffix,
    );
    if (
      oldLines.length > 0 &&
      oldLines.length <= MAX_REPLACEMENT_LINES &&
      newLines.length <= MAX_REPLACEMENT_LINES &&
      !newLines.some(line => line.includes('```'))
    ) {
      const startLine = completedHunk.oldStart + prefix;
      changes.push({
        path: file,
        startLine,
        endLine: startLine + oldLines.length - 1,
        replacement: newLines.join('\n'),
      });
    }
  }

  for (const line of patch.split('\n')) {
    if (line.startsWith('diff --git ')) {
      finishHunk();
      file = null;
    } else if (line.startsWith('+++ b/')) {
      const candidate = line.slice(6);
      file = safePatchPath(candidate);
    } else if (line.startsWith('@@ ')) {
      finishHunk();
      const match = /^@@ -(\d+)(?:,(\d+))? \+\d+(?:,(\d+))? @@/.exec(line);
      hunk =
        match == null
          ? null
          : {
              oldStart: Number(match[1]),
              oldRemaining: Number(match[2] ?? 1),
              newRemaining: Number(match[3] ?? 1),
              oldLines: [],
              newLines: [],
            };
    } else if (hunk != null && !line.startsWith('\\ No newline')) {
      if (line.startsWith(' ')) {
        hunk.oldLines.push(line.slice(1));
        hunk.newLines.push(line.slice(1));
        hunk.oldRemaining--;
        hunk.newRemaining--;
      } else if (line.startsWith('-')) {
        hunk.oldLines.push(line.slice(1));
        hunk.oldRemaining--;
      } else if (line.startsWith('+')) {
        hunk.newLines.push(line.slice(1));
        hunk.newRemaining--;
      }
      if (hunk.oldRemaining === 0 && hunk.newRemaining === 0) {
        finishHunk();
      }
    }
  }
  finishHunk();
  return changes;
}

function commentableRightLines(patch) {
  const lines = new Set();
  let newLine = 0;
  for (const line of (patch ?? '').split('\n')) {
    const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (match != null) {
      newLine = Number(match[1]);
    } else if (line.startsWith('+') || line.startsWith(' ')) {
      lines.add(newLine++);
    }
  }
  return lines;
}

async function deletePreviousComments(github, owner, repo, pullNumber) {
  const issueComments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pullNumber,
    per_page: 100,
  });
  for (const comment of issueComments) {
    if (
      comment.user?.login === 'github-actions[bot]' &&
      comment.body?.includes(MARKER)
    ) {
      await github.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: comment.id,
      });
    }
  }

  const reviewComments = await github.paginate(
    github.rest.pulls.listReviewComments,
    {owner, repo, pull_number: pullNumber, per_page: 100},
  );
  for (const comment of reviewComments) {
    if (
      comment.user?.login === 'github-actions[bot]' &&
      comment.body?.includes(MARKER)
    ) {
      await github.rest.pulls.deleteReviewComment({
        owner,
        repo,
        comment_id: comment.id,
      });
    }
  }
}

module.exports = async function reportFormattingErrors({
  github,
  context,
  core,
}) {
  const run = context.payload.workflow_run;
  const pullRequests = run.pull_requests ?? [];

  const metadata = JSON.parse(readBoundedFile('.format-results/metadata.json'));
  const pullNumber = Number(metadata.PR_NUMBER);
  const headSha = metadata.HEAD_SHA;
  if (
    metadata.EVENT_NAME !== 'pull_request' ||
    !Number.isSafeInteger(pullNumber) ||
    !/^[0-9a-f]{40}$/.test(headSha)
  ) {
    throw new Error('Formatting artifact metadata does not match this run.');
  }
  if (
    pullRequests.length > 0 &&
    !pullRequests.some(pullRequest => pullRequest.number === pullNumber)
  ) {
    throw new Error(
      'Formatting artifact pull request does not match this run.',
    );
  }

  const {owner, repo} = context.repo;
  const {data: pullRequest} = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });
  if (pullRequest.head.sha !== headSha) {
    core.info(
      'Ignoring a stale formatting result for an older pull request revision.',
    );
    return;
  }

  await deletePreviousComments(github, owner, repo, pullNumber);
  if (run.conclusion !== 'failure') {
    return;
  }

  const patchFile = '.format-results/format.patch';
  const patch = fs.existsSync(patchFile) ? readBoundedFile(patchFile) : '';
  const outputFile = '.format-results/output.txt';
  const output = fs.existsSync(outputFile) ? readBoundedFile(outputFile) : '';
  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });
  const pullPatches = new Map(files.map(file => [file.filename, file.patch]));
  const parsedChanges = parsePatch(patch);
  const eligibleSuggestions = parsedChanges.filter(change => {
    const commentable = commentableRightLines(pullPatches.get(change.path));
    for (let line = change.startLine; line <= change.endLine; line++) {
      if (!commentable.has(line)) {
        return false;
      }
    }
    return true;
  });
  const suggestions = eligibleSuggestions.slice(0, MAX_COMMENTS);

  let postedSuggestions = 0;
  for (const suggestion of suggestions) {
    try {
      const location =
        suggestion.startLine === suggestion.endLine
          ? {}
          : {
              start_line: suggestion.startLine,
              start_side: 'RIGHT',
            };
      await github.rest.pulls.createReviewComment({
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: headSha,
        path: suggestion.path,
        ...location,
        line: suggestion.endLine,
        side: 'RIGHT',
        body: `${MARKER}\n\`yarn format\` suggests:\n\n\`\`\`suggestion\n${suggestion.replacement}\n\`\`\``,
      });
      postedSuggestions++;
    } catch (error) {
      core.warning(
        `Could not attach a suggestion to ${suggestion.path}: ${error}`,
      );
    }
  }

  const changedFiles = changedFilesFromPatch(patch).filter(file =>
    pullPatches.has(file),
  );
  const details =
    changedFiles.length > 0
      ? changedFiles
          .map(
            file =>
              `- \`${file.replaceAll('`', '\\`').replaceAll('\n', ' ')}\``,
          )
          .join('\n')
      : 'The formatter stopped before producing a patch. See the workflow log.';
  const outputExcerpt = output
    .slice(-4000)
    .replaceAll('```', '``\\`')
    .replaceAll('<', '&lt;');
  const body = `${MARKER}
## Formatting required

Run \`yarn format\` from the repository root and commit the result.

${details}

${postedSuggestions} inline suggestion${postedSuggestions === 1 ? '' : 's'} posted${eligibleSuggestions.length > MAX_COMMENTS ? ` (${eligibleSuggestions.length - MAX_COMMENTS} more omitted)` : ''}. Suggestions can only be attached to lines visible in the pull request diff.

<details><summary>Formatter output</summary>

\`\`\`text
${outputExcerpt}
\`\`\`
</details>`;

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
};

module.exports.parsePatch = parsePatch;
module.exports.commentableRightLines = commentableRightLines;
module.exports.changedFilesFromPatch = changedFilesFromPatch;
