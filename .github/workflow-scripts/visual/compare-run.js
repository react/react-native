/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Trusted half of the visual regression pipeline. Runs from the default
 * branch on `workflow_run`, after the untrusted capture workflow finishes.
 *
 *   node compare-run.js prepare  Validate captures, compare with baselines,
 *                                and lay out files to upload under OUT_DIR.
 *   node compare-run.js report   After the upload, create check runs and
 *                                evaluate the approval gate.
 */

const {
  APPROVAL_LABEL,
  CHECK_NAME_PREFIX,
  GATE_CHECK_NAME,
  differenceFingerprint,
  gateDecision,
} = require('./approval');
const {compareCapture, summarize} = require('./compare');
const {createGitHubClient} = require('./github');
const {
  COMMENT_MARKER,
  renderCheckOutput,
  renderPullRequestComment,
} = require('./report');
const {
  approvalKey,
  baselinePrefix,
  fetchBuffer,
  fetchJsonOrNull,
  findBaseline,
  publicUrl,
  reportPrefix,
} = require('./storage');
const {validateCapture} = require('./validate');
const fs = require('fs');
const path = require('path');

const BASELINE_SEARCH_DEPTH = 20;
const PLATFORMS = ['android', 'ios'];
// The default Actions token posts as this bot. Only its comments are edited.
const COMMENT_AUTHOR = 'github-actions[bot]';

function requireEnv(name) {
  const value = process.env[name];
  if (value == null || value === '') {
    throw new Error(`${name} is required`);
  }
  return value;
}

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, contents);
}

async function resolveContext(github) {
  const event = requireEnv('CAPTURE_EVENT');
  const headSha = requireEnv('CAPTURE_HEAD_SHA');
  const headBranch = requireEnv('CAPTURE_HEAD_BRANCH');
  const headRepository = requireEnv('CAPTURE_HEAD_REPOSITORY');
  const defaultBranch = requireEnv('DEFAULT_BRANCH');
  const runId = Number(requireEnv('CAPTURE_RUN_ID'));
  const runAttempt = Number(requireEnv('CAPTURE_RUN_ATTEMPT'));

  if (event === 'pull_request') {
    const pull = await github.findPullRequest(headSha, headRepository);
    if (pull == null) {
      return null;
    }
    return {
      kind: 'pull',
      prNumber: pull.number,
      headSha,
      runId,
      runAttempt,
      defaultBranch,
    };
  }
  if (
    event === 'push' &&
    headBranch === defaultBranch &&
    headRepository === github.repository
  ) {
    return {
      kind: 'main',
      prNumber: null,
      headSha,
      runId,
      runAttempt,
      defaultBranch,
    };
  }
  return null;
}

async function comparePlatform({
  github,
  context,
  captureDir,
  config,
  publicBaseUrl,
  outDir,
  prefix,
}) {
  const manifest = validateCapture(captureDir);
  const {platform, environmentKey, git} = manifest;
  if (git.headSha !== context.headSha) {
    throw new Error(
      `${platform}: manifest head ${git.headSha} does not match run head ${context.headSha}`,
    );
  }
  if (!(await github.isOnBranch(git.baseSha, context.defaultBranch))) {
    return {
      platform,
      environmentKey,
      manifest,
      baseline: null,
      results: [],
      error: {
        title: 'base commit is not on the default branch',
        summary: `The capture's base commit \`${git.baseSha}\` is not on \`${context.defaultBranch}\`, so there is no baseline to compare with. Rebase or merge \`${context.defaultBranch}\` and push again.`,
      },
    };
  }

  const candidateShas = await github.ancestry(
    git.baseSha,
    BASELINE_SEARCH_DEPTH,
  );
  const baseline = await findBaseline({
    publicBaseUrl,
    environmentKey,
    candidateShas,
  });
  if (baseline == null) {
    return {
      platform,
      environmentKey,
      manifest,
      baseline: null,
      results: [],
      error: {
        title: 'no baseline for this environment',
        summary: `No baseline for environment \`${environmentKey}\` was published for \`${git.baseSha.slice(0, 12)}\` or its ${BASELINE_SEARCH_DEPTH - 1} preceding commits on \`${context.defaultBranch}\`. If the environment key is new, the CI device image changed: the next push to \`${context.defaultBranch}\` publishes a baseline for it. Otherwise check that baseline publication on \`${context.defaultBranch}\` is succeeding.`,
      },
    };
  }

  const expectedUrl = id =>
    publicUrl(
      publicBaseUrl,
      `${baselinePrefix(environmentKey, baseline.sha)}/${id}.png`,
    );
  const results = await compareCapture({
    manifest,
    baselineManifest: baseline.manifest,
    readExpected: id => fetchBuffer(expectedUrl(id)),
    readCaptured: id =>
      fs.promises.readFile(path.join(captureDir, `${id}.png`)),
    config,
  });

  for (const result of results) {
    if (result.status === 'unchanged') {
      continue;
    }
    const platformPrefix = `${prefix}/${platform}`;
    if (result.captured != null) {
      writeFile(
        path.join(
          outDir,
          'upload',
          platformPrefix,
          'captured',
          `${result.id}.png`,
        ),
        fs.readFileSync(path.join(captureDir, `${result.id}.png`)),
      );
    }
    if (result.diffImage != null) {
      writeFile(
        path.join(outDir, 'upload', platformPrefix, 'diff', `${result.id}.png`),
        result.diffImage,
      );
    }
  }

  return {
    platform,
    environmentKey,
    manifest,
    baseline: {sha: baseline.sha, distance: baseline.distance},
    results,
    error: null,
  };
}

function missingCapture(platform, context) {
  return {
    platform,
    environmentKey: null,
    manifest: null,
    baseline: null,
    results: [],
    error: {
      title: 'no capture',
      summary: `Test All run ${context.runId} has no ${platform} capture, so there is nothing to compare. Its capture job failed or didn't run: check the run for a build or capture failure.`,
    },
  };
}

function stageBaseline({outDir, captureDir, manifest, sha}) {
  const prefix = baselinePrefix(manifest.environmentKey, sha);
  for (const image of manifest.images) {
    writeFile(
      path.join(outDir, 'baseline-images', prefix, `${image.id}.png`),
      fs.readFileSync(path.join(captureDir, `${image.id}.png`)),
    );
  }
  // Uploaded after the images: a baseline exists once its manifest does.
  writeFile(
    path.join(outDir, 'baseline-manifests', prefix, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

function serializableResults(results) {
  return results.map(({diffImage, ...result}) => ({
    ...result,
    hasDiffImage: diffImage != null,
  }));
}

async function prepare() {
  const github = createGitHubClient();
  const artifactsDir = requireEnv('VISUAL_ARTIFACTS_DIR');
  const outDir = requireEnv('OUT_DIR');
  const publicBaseUrl = requireEnv('VISUAL_PUBLIC_BASE_URL');
  const config = JSON.parse(
    fs.readFileSync(requireEnv('VISUAL_CONFIG'), 'utf8'),
  );

  const context = await resolveContext(github);
  if (context == null) {
    console.info('Not an open pull request or a push to the default branch.');
    writeFile(path.join(outDir, 'state.json'), 'null\n');
    return;
  }
  const prefix = reportPrefix(context);

  const platforms = [];
  for (const expectedPlatform of PLATFORMS) {
    const captureDir = path.join(
      artifactsDir,
      `visual-capture-${expectedPlatform}`,
    );
    if (!fs.existsSync(captureDir)) {
      platforms.push(missingCapture(expectedPlatform, context));
      continue;
    }
    const result = await comparePlatform({
      github,
      context,
      captureDir,
      config,
      publicBaseUrl,
      outDir,
      prefix,
    });
    if (result.platform !== expectedPlatform) {
      throw new Error(
        `visual-capture-${expectedPlatform}: manifest is for ${result.platform}`,
      );
    }
    if (context.kind === 'main') {
      stageBaseline({
        outDir,
        captureDir,
        manifest: result.manifest,
        sha: context.headSha,
      });
    }
    platforms.push(result);
  }

  const fingerprint = differenceFingerprint(
    platforms.map(platform => ({
      platform: platform.platform,
      environmentKey: platform.environmentKey,
      baselineSha: platform.baseline?.sha,
      results: platform.results,
    })),
  );
  const state = {
    context,
    reportPrefix: prefix,
    fingerprint,
    platforms: platforms.map(({manifest, results, ...platform}) => ({
      ...platform,
      git: manifest?.git ?? null,
      results: serializableResults(results),
    })),
  };
  writeFile(
    path.join(outDir, 'upload', prefix, 'results.json'),
    `${JSON.stringify(state, null, 2)}\n`,
  );
  writeFile(path.join(outDir, 'state.json'), `${JSON.stringify(state)}\n`);

  for (const platform of state.platforms) {
    const {counts} = summarize(platform.results);
    console.info(
      `${platform.platform} (${platform.environmentKey}): ${
        platform.error?.title ?? JSON.stringify(counts)
      }`,
    );
  }
}

async function report() {
  const github = createGitHubClient();
  const outDir = requireEnv('OUT_DIR');
  const publicBaseUrl = requireEnv('VISUAL_PUBLIC_BASE_URL');
  const state = JSON.parse(
    fs.readFileSync(path.join(outDir, 'state.json'), 'utf8'),
  );
  if (state == null) {
    return;
  }
  const {context, reportPrefix: prefix, fingerprint} = state;
  const detailsUrl = publicUrl(publicBaseUrl, `${prefix}/results.json`);

  const summaryLines = [];
  const commentPlatforms = [];
  for (const platform of state.platforms) {
    const imageUrl = (kind, id) =>
      kind === 'expected'
        ? publicUrl(
            publicBaseUrl,
            `${baselinePrefix(platform.environmentKey, platform.baseline.sha)}/${id}.png`,
          )
        : publicUrl(
            publicBaseUrl,
            `${prefix}/${platform.platform}/${kind}/${id}.png`,
          );
    const output = renderCheckOutput({...platform, imageUrl});
    const {hasDifferences} = summarize(platform.results);
    const checkRun = await github.createCheckRun({
      name: `${CHECK_NAME_PREFIX} (${platform.platform})`,
      headSha: context.headSha,
      conclusion:
        platform.error != null
          ? 'neutral'
          : hasDifferences
            ? 'failure'
            : 'success',
      output,
      detailsUrl,
    });
    commentPlatforms.push({...platform, imageUrl, checkUrl: checkRun.html_url});
    summaryLines.push(
      `## ${output.title}`,
      '',
      output.summary,
      '',
      output.text,
      '',
    );
  }

  if (context.kind === 'pull') {
    const labels = await github.labels(context.prNumber);
    const approval =
      fingerprint == null
        ? null
        : await fetchJsonOrNull(
            publicUrl(
              publicBaseUrl,
              approvalKey(context.prNumber, fingerprint),
            ),
          );
    const decision = gateDecision({
      fingerprint,
      labelPresent: labels.includes(APPROVAL_LABEL),
      approval,
    });
    if (decision.staleLabel) {
      await github.removeLabel(context.prNumber, APPROVAL_LABEL);
      await github.comment(
        context.prNumber,
        `The visual differences changed in \`${context.headSha.slice(0, 12)}\`, so \`${APPROVAL_LABEL}\` was removed. Review the new report and apply it again to approve.`,
      );
    }
    await github.createCheckRun({
      name: GATE_CHECK_NAME,
      headSha: context.headSha,
      conclusion: decision.conclusion,
      output: {title: decision.summary, summary: decision.summary},
      detailsUrl,
    });
    summaryLines.push(`## Approval`, '', decision.summary, '');
    await upsertComment({
      github,
      prNumber: context.prNumber,
      body: renderPullRequestComment({
        platforms: commentPlatforms,
        headSha: context.headSha,
        gateSummary: decision.summary,
      }),
      hasContent:
        fingerprint != null ||
        commentPlatforms.some(platform => platform.error != null),
    });
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryLines.join('\n'));
  }
}

/**
 * Keeps one report comment per PR up to date. A PR that never had
 * differences gets no comment. Once it has one, later runs edit it, including
 * to say the differences are gone.
 */
async function upsertComment({github, prNumber, body, hasContent}) {
  const existing = await github.findComment(
    prNumber,
    COMMENT_MARKER,
    COMMENT_AUTHOR,
  );
  if (existing != null) {
    await github.updateComment(existing.id, body);
  } else if (hasContent) {
    await github.comment(prNumber, body);
  }
}

async function main(command = process.argv[2]) {
  if (command === 'prepare') {
    await prepare();
  } else if (command === 'report') {
    await report();
  } else {
    throw new Error('Usage: node compare-run.js prepare|report');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {resolveContext};
