/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {SHA_PATTERN} = require('./manifest');

// Object layout. Every key is write-once: reports and approvals include the
// run that produced them, and a baseline is only ever written for a new SHA.
//
//   baselines/<environment-key>/<main-sha>/manifest.json
//   baselines/<environment-key>/<main-sha>/<test-id>.png
//   reports/pull/<pr>/<head-sha>/<run-id>-<attempt>/results.json
//   reports/pull/<pr>/<head-sha>/<run-id>-<attempt>/<platform>/{expected,captured,diff}/<test-id>.png
//   reports/main/<sha>/<run-id>-<attempt>/...
//   approvals/pull/<pr>/<fingerprint>.json

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
  approvalKey,
  baselinePrefix,
  fetchBuffer,
  fetchJsonOrNull,
  findBaseline,
  listPrefixes,
  publicUrl,
  reportPrefix,
};
