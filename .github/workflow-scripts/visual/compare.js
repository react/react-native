/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const pixelmatch = require('pixelmatch');
const {PNG} = require('pngjs');

// Strict by default: any changed pixel fails. Loosen per test in
// packages/rn-tester/visual-tests/config.json, with evidence.
const DEFAULT_POLICY = {
  // pixelmatch's per-pixel color distance threshold, from 0 to 1.
  threshold: 0,
  // Count anti-aliased pixels as differences.
  includeAA: true,
  maxDiffPixels: 0,
  // Optional: also fail when this share of the image changes.
  maxDiffRatio: null,
};

function policyFor(testId, config) {
  return {...DEFAULT_POLICY, ...config?.defaults, ...config?.tests?.[testId]};
}

/**
 * Compares two PNG buffers. Returns the outcome and, when the images have
 * the same dimensions and differ, a diff image highlighting changed pixels.
 */
function compareImages(expectedBuffer, capturedBuffer, policy) {
  const expected = PNG.sync.read(expectedBuffer);
  const captured = PNG.sync.read(capturedBuffer);
  if (
    expected.width !== captured.width ||
    expected.height !== captured.height
  ) {
    return {
      status: 'dimension-mismatch',
      expectedSize: {width: expected.width, height: expected.height},
      capturedSize: {width: captured.width, height: captured.height},
      diffPixels: null,
      diffRatio: null,
      diff: null,
    };
  }

  const {width, height} = expected;
  const diff = new PNG({width, height});
  const diffPixels = pixelmatch(
    expected.data,
    captured.data,
    diff.data,
    width,
    height,
    {threshold: policy.threshold, includeAA: policy.includeAA},
  );
  const diffRatio = diffPixels / (width * height);
  const changed =
    diffPixels > policy.maxDiffPixels ||
    (policy.maxDiffRatio != null && diffRatio > policy.maxDiffRatio);
  return {
    status: changed ? 'changed' : 'unchanged',
    diffPixels,
    diffRatio,
    diff: diffPixels > 0 ? PNG.sync.write(diff) : null,
  };
}

/**
 * Compares every captured image with the baseline. `readExpected(id)` and
 * `readCaptured(id)` return PNG buffers. Results are sorted by test ID.
 */
async function compareCapture({
  manifest,
  baselineManifest,
  readExpected,
  readCaptured,
  config,
}) {
  const expectedById = new Map(
    (baselineManifest?.images ?? []).map(image => [image.id, image]),
  );
  const results = [];

  for (const image of manifest.images) {
    const expected = expectedById.get(image.id);
    expectedById.delete(image.id);
    if (expected == null) {
      results.push({id: image.id, status: 'added', captured: image});
      continue;
    }
    if (expected.sha256 === image.sha256) {
      results.push({
        id: image.id,
        status: 'unchanged',
        diffPixels: 0,
        diffRatio: 0,
        captured: image,
        expected,
      });
      continue;
    }
    const policy = policyFor(image.id, config);
    const {diff, ...outcome} = compareImages(
      await readExpected(image.id),
      await readCaptured(image.id),
      policy,
    );
    results.push({
      id: image.id,
      ...outcome,
      policy,
      captured: image,
      expected,
      diffImage: diff,
    });
  }

  for (const expected of expectedById.values()) {
    results.push({id: expected.id, status: 'removed', expected});
  }

  return results.sort((a, b) => a.id.localeCompare(b.id));
}

function summarize(results) {
  const counts = {
    unchanged: 0,
    changed: 0,
    'dimension-mismatch': 0,
    added: 0,
    removed: 0,
  };
  for (const result of results) {
    counts[result.status] += 1;
  }
  return {
    counts,
    hasDifferences: results.some(result => result.status !== 'unchanged'),
  };
}

module.exports = {
  DEFAULT_POLICY,
  compareCapture,
  compareImages,
  policyFor,
  summarize,
};
