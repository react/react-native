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
 * Retakes screenshots, once, before they're uploaded. System UI can briefly
 * cover the app, for example the Apple Intelligence notification iOS shows
 * shortly after boot, and a covered screenshot published from `main` fails
 * every PR based on that commit.
 *
 * - A screenshot that differs from the baseline is retaken, and the retake
 *   replaces it only if the retake matches the baseline. A real change
 *   differs both times and is kept.
 * - A screenshot with no baseline is retaken, and is unstable unless both
 *   captures are identical. Compare doesn't publish unstable screenshots as
 *   the baseline, so a new test's first baseline is one that was captured
 *   the same way twice.
 *
 * Screenshots that already matched the baseline are never retaken, so a
 * retake can't spoil them.
 */

const {buildManifest, sha256} = require('./manifest');
const {BASELINE_SEARCH_DEPTH, findBaseline} = require('./storage');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Long enough for a notification banner to be dismissed.
const RETAKE_DELAY_MS = 10000;

/** The test IDs a flow's `takeScreenshot` commands write. */
function screenshotIds(flowText) {
  return [...flowText.matchAll(/\$\{VISUAL_OUTPUT_DIR\}\/([^\s'"]+)/g)].map(
    match => match[1],
  );
}

/** The flows that take any of `ids`, in the order of `flows`. */
function flowsTaking(flows, ids, readFile = fs.readFileSync) {
  const wanted = new Set(ids);
  return flows.filter(flow =>
    screenshotIds(readFile(flow, 'utf8')).some(id => wanted.has(id)),
  );
}

/**
 * Splits captured images by how they relate to the baseline: `changed` exist
 * in it with different contents, and `added` aren't in it.
 */
function retakeCandidates(images, baselineManifest) {
  const expected = new Map(
    baselineManifest.images.map(image => [image.id, image.sha256]),
  );
  const changed = [];
  const added = [];
  for (const image of images) {
    if (!expected.has(image.id)) {
      added.push(image.id);
    } else if (expected.get(image.id) !== image.sha256) {
      changed.push(image.id);
    }
  }
  return {changed, added};
}

/**
 * Decides what to do with each retake. `retakeSha` maps a test ID to its
 * retake's SHA-256, or null if the retake is missing. Returns the changed IDs
 * whose retake matches the baseline, so replaces the original, and the added
 * IDs whose retake doesn't match the original.
 */
function judgeRetakes({changed, added, images, baselineManifest, retakeSha}) {
  const expected = new Map(
    baselineManifest.images.map(image => [image.id, image.sha256]),
  );
  const original = new Map(images.map(image => [image.id, image.sha256]));
  return {
    replaced: changed.filter(id => {
      const sha = retakeSha(id);
      return sha != null && sha === expected.get(id);
    }),
    unstable: added.filter(id => retakeSha(id) !== original.get(id)),
  };
}

/** `HEAD^1` and its first-parent ancestors, newest first. */
function baselineCandidates() {
  return childProcess
    .execFileSync(
      'git',
      [
        'rev-list',
        '--first-parent',
        `--max-count=${BASELINE_SEARCH_DEPTH}`,
        'HEAD^1',
      ],
      {encoding: 'utf8', timeout: 30000},
    )
    .trim()
    .split('\n');
}

/**
 * Retakes the changed and new screenshots in `outputDir` by running
 * `runFlows` on the flows that take them, into a separate directory. Returns
 * the IDs of unstable new screenshots, and summary lines.
 */
async function retakeScreenshots({
  platform,
  environment,
  flows,
  outputDir,
  publicBaseUrl,
  runFlows,
  candidateShas = baselineCandidates(),
}) {
  const {environmentKey, images} = buildManifest({
    captureDir: outputDir,
    platform,
    environment,
    git: null,
  });
  const baseline = await findBaseline({
    publicBaseUrl,
    environmentKey,
    candidateShas,
  });
  if (baseline == null) {
    return {
      unstable: [],
      lines: [`No baseline for \`${environmentKey}\`, so nothing was retaken.`],
    };
  }
  const {changed, added} = retakeCandidates(images, baseline.manifest);
  if (changed.length === 0 && added.length === 0) {
    return {unstable: [], lines: []};
  }

  const retakeDir = `${outputDir}-retake`;
  fs.rmSync(retakeDir, {recursive: true, force: true});
  fs.mkdirSync(retakeDir, {recursive: true});
  await new Promise(resolve => setTimeout(resolve, RETAKE_DELAY_MS));
  runFlows(flowsTaking(flows, [...changed, ...added]), retakeDir);

  const retakePath = id => path.join(retakeDir, `${id}.png`);
  const {replaced, unstable} = judgeRetakes({
    changed,
    added,
    images,
    baselineManifest: baseline.manifest,
    retakeSha: id =>
      fs.existsSync(retakePath(id))
        ? sha256(fs.readFileSync(retakePath(id)))
        : null,
  });
  for (const id of replaced) {
    fs.copyFileSync(retakePath(id), path.join(outputDir, `${id}.png`));
  }
  fs.rmSync(retakeDir, {recursive: true, force: true});

  const lines = [
    `Retook ${changed.length + added.length} screenshot(s) against the baseline at \`${baseline.sha.slice(0, 12)}\`:`,
    ...changed.map(
      id =>
        `- \`${id}\`: ${replaced.includes(id) ? 'matched the baseline on the retake, replaced' : 'differed again, kept'}`,
    ),
    ...added.map(
      id =>
        `- \`${id}\`: new, ${unstable.includes(id) ? 'unstable (the two captures differ)' : 'identical twice'}`,
    ),
  ];
  return {unstable, lines};
}

module.exports = {
  flowsTaking,
  judgeRetakes,
  retakeCandidates,
  retakeScreenshots,
  screenshotIds,
};
