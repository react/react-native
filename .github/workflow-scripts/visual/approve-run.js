/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

/**
 * Records a maintainer's approval of a PR's visual differences and updates
 * the approval gate. Runs from the default branch on `pull_request_target`
 * when the approval label is added or removed. It never checks out or runs
 * pull request code.
 *
 *   node approve-run.js prepare  Decide, and stage an approval record to
 *                                upload under OUT_DIR.
 *   node approve-run.js report   After the upload, update the gate check.
 */

const {
  APPROVAL_LABEL,
  APPROVER_PERMISSIONS,
  GATE_CHECK_NAME,
  differenceFingerprint,
  gateDecision,
} = require('./approval');
const {createGitHubClient} = require('./github');
const {
  approvalKey,
  fetchJsonOrNull,
  latestPlatformResults,
  publicUrl,
} = require('./storage');
const fs = require('node:fs');
const path = require('node:path');

function requireEnv(name) {
  const value = process.env[name];
  if (value == null || value === '') {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function prepare() {
  const github = createGitHubClient();
  const outDir = requireEnv('OUT_DIR');
  const event = JSON.parse(
    fs.readFileSync(requireEnv('GITHUB_EVENT_PATH'), 'utf8'),
  );
  const writeState = state =>
    fs.writeFileSync(
      path.join(outDir, 'state.json'),
      `${JSON.stringify(state)}\n`,
    );
  fs.mkdirSync(outDir, {recursive: true});

  if (event.label?.name !== APPROVAL_LABEL) {
    writeState(null);
    return;
  }

  const prNumber = event.pull_request.number;
  const headSha = event.pull_request.head.sha;
  const platforms = await latestPlatformResults({
    bucket: requireEnv('VISUAL_BUCKET'),
    publicBaseUrl: requireEnv('VISUAL_PUBLIC_BASE_URL'),
    prNumber,
    headSha,
  });
  const fingerprint = differenceFingerprint(platforms);

  if (event.action === 'labeled') {
    const approver = event.sender.login;
    const permission = await github.permission(approver);
    if (!APPROVER_PERMISSIONS.includes(permission)) {
      await github.removeLabel(prNumber, APPROVAL_LABEL);
      await github.comment(
        prNumber,
        `@${approver} \`${APPROVAL_LABEL}\` needs write access to this repository, so it was removed.`,
      );
      writeState(null);
      return;
    }
    if (platforms.length === 0) {
      await github.removeLabel(prNumber, APPROVAL_LABEL);
      await github.comment(
        prNumber,
        `There is no visual report for \`${headSha.slice(0, 12)}\` yet, so \`${APPROVAL_LABEL}\` was removed. Apply it again once the report is posted.`,
      );
      writeState(null);
      return;
    }
    if (fingerprint != null) {
      const key = approvalKey(prNumber, fingerprint);
      const record = {
        fingerprint,
        approver,
        approvedAt: new Date().toISOString(),
        headSha,
      };
      const recordPath = path.join(outDir, 'upload', key);
      fs.mkdirSync(path.dirname(recordPath), {recursive: true});
      fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    }
  }

  writeState({
    prNumber,
    headSha,
    fingerprint,
    labelPresent: event.action === 'labeled',
  });
}

async function report() {
  const github = createGitHubClient();
  const outDir = requireEnv('OUT_DIR');
  const state = JSON.parse(
    fs.readFileSync(path.join(outDir, 'state.json'), 'utf8'),
  );
  if (state == null) {
    return;
  }
  const {prNumber, headSha, fingerprint, labelPresent} = state;
  const approval =
    fingerprint == null
      ? null
      : await fetchJsonOrNull(
          publicUrl(
            requireEnv('VISUAL_PUBLIC_BASE_URL'),
            approvalKey(prNumber, fingerprint),
          ),
        );
  const decision = gateDecision({fingerprint, labelPresent, approval});
  await github.createCheckRun({
    name: GATE_CHECK_NAME,
    headSha,
    conclusion: decision.conclusion,
    output: {title: decision.summary, summary: decision.summary},
  });
  console.info(decision.summary);
}

async function main(command = process.argv[2]) {
  if (command === 'prepare') {
    await prepare();
  } else if (command === 'report') {
    await report();
  } else {
    throw new Error('Usage: node approve-run.js prepare|report');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
