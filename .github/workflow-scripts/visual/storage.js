/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

const {SHA_PATTERN} = require('./manifest');

// How many commits back from a capture's base commit to look for a baseline.
const BASELINE_SEARCH_DEPTH = 20;

// Object layout. Every key is write-once: reports and approvals include the
// run that produced them, a baseline is only ever written for a new SHA, and
// a blob's key is its contents' SHA-256.
//
//   blobs/<sha256>.png
//   baselines/<environment-key>/<main-sha>/manifest.json
//   baselines/<environment-key>/<main-sha>/<test-id>.png
//   reports/pull/<pr>/<head-sha>/<run-id>-<attempt>/results.json
//   reports/pull/<pr>/<head-sha>/<run-id>-<attempt>/<platform>/{expected,captured,diff}/<test-id>.png
//   reports/main/<sha>/<run-id>-<attempt>/...
//   approvals/pull/<pr>/<fingerprint>.json
//
// A baseline manifest with `imageStore: 'blobs'` refers to its images in
// `blobs/` by hash, so an image unchanged across commits is stored once.
// Older baselines have a copy of each image under their own prefix.

function assertSha(sha) {
  if (!SHA_PATTERN.test(sha)) {
    throw new Error(`Invalid SHA: ${String(sha)}`);
  }
}

function assertPositiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${name}: ${String(value)}`);
  }
}

function baselinePrefix(environmentKey, sha) {
  assertSha(sha);
  return `baselines/${environmentKey}/${sha}`;
}

function blobKey(sha256) {
  if (!/^[0-9a-f]{64}$/.test(sha256)) {
    throw new Error(`Invalid SHA-256: ${String(sha256)}`);
  }
  return `blobs/${sha256}.png`;
}

/** The key of `image` in the baseline published for `sha`. */
function baselineImageKey({environmentKey, sha, imageStore}, image) {
  return imageStore === 'blobs'
    ? blobKey(image.sha256)
    : `${baselinePrefix(environmentKey, sha)}/${image.id}.png`;
}

function reportPrefix({prNumber, headSha, runId, runAttempt}) {
  assertSha(headSha);
  assertPositiveInteger(runId, 'run ID');
  assertPositiveInteger(runAttempt, 'run attempt');
  if (prNumber == null) {
    return `reports/main/${headSha}/${runId}-${runAttempt}`;
  }
  assertPositiveInteger(prNumber, 'PR number');
  return `reports/pull/${prNumber}/${headSha}/${runId}-${runAttempt}`;
}

function approvalKey(prNumber, fingerprint) {
  assertPositiveInteger(prNumber, 'PR number');
  if (!/^[0-9a-f]{16}$/.test(fingerprint)) {
    throw new Error(`Invalid fingerprint: ${String(fingerprint)}`);
  }
  return `approvals/pull/${prNumber}/${fingerprint}.json`;
}

function publicUrl(publicBaseUrl, key) {
  return `${publicBaseUrl.replace(/\/$/, '')}/${key
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

async function fetchOrNull(url) {
  const response = await fetch(url, {cache: 'no-store'});
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
  return response;
}

async function existsAt(url) {
  const response = await fetch(url, {method: 'HEAD', cache: 'no-store'});
  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(`HEAD ${url} failed with ${response.status}`);
  }
  return true;
}

async function fetchJsonOrNull(url) {
  const response = await fetchOrNull(url);
  return response == null ? null : response.json();
}

async function fetchBuffer(url) {
  const response = await fetchOrNull(url);
  if (response == null) {
    throw new Error(`GET ${url} returned 404`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Lists the immediate "subdirectories" under a prefix, using the public GCS
 * JSON API.
 */
async function listPrefixes(bucket, prefix) {
  const prefixes = [];
  let pageToken = null;
  do {
    const url = new URL(
      `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o`,
    );
    url.searchParams.set('prefix', prefix);
    url.searchParams.set('delimiter', '/');
    if (pageToken != null) {
      url.searchParams.set('pageToken', pageToken);
    }
    const page = await fetchJsonOrNull(url.toString());
    prefixes.push(...(page?.prefixes ?? []));
    pageToken = page?.nextPageToken ?? null;
  } while (pageToken != null);
  return prefixes;
}

function newestPerPlatform(statesNewestFirst) {
  const byPlatform = new Map();
  for (const state of statesNewestFirst) {
    for (const platform of state.platforms) {
      if (!byPlatform.has(platform.platform)) {
        byPlatform.set(platform.platform, {
          ...platform,
          reportPrefix: state.reportPrefix,
        });
      }
    }
  }
  return [...byPlatform.values()].sort((a, b) =>
    a.platform.localeCompare(b.platform),
  );
}

async function latestPlatformResults({
  bucket,
  publicBaseUrl,
  prNumber,
  headSha,
  current = null,
}) {
  const runs = (
    await listPrefixes(bucket, `reports/pull/${prNumber}/${headSha}/`)
  )
    .map(prefix => {
      const match = /\/(\d+)-(\d+)\/$/.exec(prefix);
      return match == null
        ? null
        : {prefix, runId: Number(match[1]), attempt: Number(match[2])};
    })
    .filter(Boolean)
    .sort((a, b) => b.runId - a.runId || b.attempt - a.attempt);
  const states = current == null ? [] : [current];
  for (const run of runs) {
    if (current != null && run.prefix === `${current.reportPrefix}/`) {
      continue;
    }
    const state = await fetchJsonOrNull(
      publicUrl(publicBaseUrl, `${run.prefix}results.json`),
    );
    if (state != null) {
      states.push(state);
    }
  }
  return newestPerPlatform(states);
}

/**
 * Returns the first of `candidateShas` (newest first) that has a published
 * baseline for `environmentKey`, with its manifest, or null.
 */
async function findBaseline({publicBaseUrl, environmentKey, candidateShas}) {
  for (const [distance, sha] of candidateShas.entries()) {
    const manifest = await fetchJsonOrNull(
      publicUrl(
        publicBaseUrl,
        `${baselinePrefix(environmentKey, sha)}/manifest.json`,
      ),
    );
    if (manifest != null) {
      return {sha, distance, manifest};
    }
  }
  return null;
}

module.exports = {
  BASELINE_SEARCH_DEPTH,
  approvalKey,
  baselineImageKey,
  baselinePrefix,
  blobKey,
  existsAt,
  fetchBuffer,
  fetchJsonOrNull,
  findBaseline,
  latestPlatformResults,
  listPrefixes,
  newestPerPlatform,
  publicUrl,
  reportPrefix,
};
