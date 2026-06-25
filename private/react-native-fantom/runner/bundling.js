/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RunBuildOptions} from 'metro';

import fs from 'fs';
import path from 'path';

type BundleOptions = {
  ...RunBuildOptions,
  customTransformOptions: ?{
    collectCoverage: boolean,
  },
  out: NonNullable<RunBuildOptions['out']>,
  testPath: string,
};

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

export async function createBundle(options: BundleOptions): Promise<void> {
  const bundleURL = getBundleURL(options);
  const response = await fetchBundleWithRetry(bundleURL);

  await fs.promises.writeFile(options.out, await response.text(), 'utf8');

  // Each test uses a unique entrypoint, so the bundle graph will never be
  // requested again. Send DELETE to evict Metro's cached dependency graph
  // and delta calculator for this bundle, freeing the memory.
  try {
    await fetch(bundleURL, {method: 'DELETE'});
  } catch {
    // Best-effort cleanup — don't fail the test if eviction fails.
  }
}

// Metro's file watcher can take a moment to observe a freshly written
// entrypoint (especially on Linux, where metro-file-map's FallbackWatcher
// debounces fs events by 100 ms). Until Metro fixes the consistency issue
// between HTTP requests and the file map (see TODO below), we retry on
// errors that look like the entry — or one of its transitive deps — has
// not been picked up yet:
//   - HTTP 404: returned when Metro can't resolve the entry file path
//     itself (`UnableToResolveError` thrown from `_resolveRelativePath`).
//   - HTTP 500 with `type: 'UnableToResolveError'`: a deeper require could
//     not be resolved while building the dependency graph.
//   - HTTP 500 with `type: 'ResourceNotFoundError'`: the entry was found
//     and then went missing (rare, but we treat it the same way).
//   - fetch network errors: brief connectivity issue.
// All other failures (syntax errors, transform errors, etc.) are real and
// thrown immediately so we don't waste time retrying them.
//
// TODO(T231910841): Remove this when Metro fixes consistency issues when
// resolving HTTP requests.
const MAX_BUNDLE_FETCH_ATTEMPTS = 10;
const BUNDLE_FETCH_BASE_BACKOFF_MS = 100;
const BUNDLE_FETCH_MAX_BACKOFF_MS = 2_000;

async function fetchBundleWithRetry(bundleURL: URL): Promise<Response> {
  let lastError: ?Error;
  let lastErrorMessage = '';

  for (let attempt = 0; attempt < MAX_BUNDLE_FETCH_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(
        BUNDLE_FETCH_BASE_BACKOFF_MS * 2 ** (attempt - 1),
        BUNDLE_FETCH_MAX_BACKOFF_MS,
      );
      await sleep(backoff);
    }

    let response;
    try {
      response = await fetch(bundleURL);
    } catch (error: unknown) {
      lastError =
        error instanceof Error
          ? error
          : new Error(typeof error === 'string' ? error : String(error));
      lastErrorMessage = lastError.message;
      continue;
    }

    if (response.ok) {
      return response;
    }

    const bodyText = await response.text();
    const {message, retryable} = parseMetroErrorBody(response.status, bodyText);
    lastErrorMessage = message;

    if (!retryable) {
      throw new Error(`Failed to request bundle from Metro:\n${message}`);
    }
  }

  throw new Error(
    `Failed to request bundle from Metro after ${MAX_BUNDLE_FETCH_ATTEMPTS} attempts:\n${lastErrorMessage}`,
  );
}

function parseMetroErrorBody(
  status: number,
  bodyText: string,
): {message: string, retryable: boolean} {
  let message = bodyText;
  let errorType: ?string;

  try {
    const parsed = JSON.parse(bodyText);
    if (typeof parsed?.message === 'string') {
      message = parsed.message;
    }
    if (typeof parsed?.type === 'string') {
      errorType = parsed.type;
    }
  } catch {
    // Not JSON — keep the raw body as the message.
  }

  // 404 is returned by Metro when the entry file path can't be resolved.
  // 500 with `UnableToResolveError`/`ResourceNotFoundError` signals that
  // either the entry or a transitive dep wasn't seen by the file watcher
  // yet — both should resolve themselves once Metro's file map catches up.
  const retryable =
    status === 404 ||
    (status === 500 &&
      (errorType === 'UnableToResolveError' ||
        errorType === 'ResourceNotFoundError'));

  return {message, retryable};
}

export async function createSourceMap(options: BundleOptions): Promise<void> {
  const sourceMapResult = await fetch(getSourceMapURL(options));

  if (!sourceMapResult.ok) {
    throw new Error();
  }

  await fs.promises.writeFile(
    options.out,
    await sourceMapResult.text(),
    'utf8',
  );
}

function getBundleURL(options: BundleOptions): URL {
  const baseURL = getBundleBaseURL(options);
  baseURL.pathname += '.bundle';
  return baseURL;
}

function getSourceMapURL(options: BundleOptions): URL {
  const baseURL = getBundleBaseURL(options);
  baseURL.pathname += '.map';
  return baseURL;
}

function getBundleBaseURL({
  entry,
  platform,
  minify,
  dev,
  sourceMap,
  sourceMapUrl,
  customTransformOptions,
}: BundleOptions): URL {
  const requestPath = path.relative(PROJECT_ROOT, entry).replace(/\.js$/, '');
  const port = getMetroPort();

  const baseURL = new URL(`http://localhost:${port}/${requestPath}`);

  if (platform != null) {
    baseURL.searchParams.append('platform', platform);
  }

  if (minify != null) {
    baseURL.searchParams.append('minify', minify ? 'true' : 'false');
  }

  if (dev != null) {
    baseURL.searchParams.append('dev', dev ? 'true' : 'false');
  }

  if (sourceMap != null) {
    baseURL.searchParams.append('sourceMap', sourceMap ? 'true' : 'false');
  }

  if (sourceMapUrl != null) {
    baseURL.searchParams.append('sourceMapUrl', sourceMapUrl);
  }

  if (customTransformOptions?.collectCoverage) {
    baseURL.searchParams.append('transform.collectCoverage', 'true');
  }

  return baseURL;
}

function getMetroPort(): number {
  if (process.env.__FANTOM_METRO_PORT__ == null) {
    throw new Error(
      'Could not find Metro server port (process.env.__FANTOM_METRO_PORT__ not set by Fantom)',
    );
  }

  const port = Number(process.env.__FANTOM_METRO_PORT__);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port for Metro server: ${port}`);
  }

  return port;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
