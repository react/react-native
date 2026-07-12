/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import fs from 'fs';
import path from 'path';

// react-native-github repo root (repl -> ../../.. ).
export const PROJECT_ROOT: string = path.resolve(__dirname, '..', '..', '..');

const RELATIVE_WARMUP_ENTRY = path.join(
  'private',
  'react-native-fantom',
  'runtime',
  'ReplEntryPoint.js',
);

const MAX_BUNDLE_FETCH_ATTEMPTS = 10;
const BUNDLE_FETCH_BASE_BACKOFF_MS = 100;
const BUNDLE_FETCH_MAX_BACKOFF_MS = 2_000;

function getMetroPort(): number {
  const value = process.env.__FANTOM_METRO_PORT__;
  if (value == null) {
    throw new Error(
      'Could not find Metro server port (process.env.__FANTOM_METRO_PORT__ not set)',
    );
  }
  const port = Number(value);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port for Metro server: ${port}`);
  }
  return port;
}

function getBundleURL(
  relativeEntryPath: string,
  extraParams: {[string]: string},
): URL {
  const requestPath = relativeEntryPath.replace(/\.js$/, '');
  const url = new URL(
    `http://localhost:${getMetroPort()}/${requestPath}.bundle`,
  );
  url.searchParams.append('platform', 'android');
  url.searchParams.append('dev', 'true');
  url.searchParams.append('minify', 'false');
  for (const key of Object.keys(extraParams)) {
    url.searchParams.append(key, extraParams[key]);
  }
  return url;
}

async function fetchBundleWithRetry(bundleURL: URL): Promise<string> {
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
      lastErrorMessage = error instanceof Error ? error.message : String(error);
      continue;
    }

    if (response.ok) {
      return response.text();
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

  const retryable =
    status === 404 ||
    (status === 500 &&
      (errorType === 'UnableToResolveError' ||
        errorType === 'ResourceNotFoundError'));

  return {message, retryable};
}

/**
 * Builds the full warm-up bundle (with the Metro runtime + polyfills) and writes
 * it to `outPath`. This is loaded once by the tester binary to set up the
 * environment before any REPL input is evaluated.
 */
export async function buildWarmupBundle(outPath: string): Promise<void> {
  const code = await fetchBundleWithRetry(
    getBundleURL(RELATIVE_WARMUP_ENTRY, {}),
  );
  await fs.promises.writeFile(outPath, code, 'utf8');
}

/**
 * Builds a delta bundle for a single REPL entry: only `__d` registrations (the
 * Metro runtime is already loaded from the warm-up bundle) plus the `__r` run
 * statement for the entry. Already-registered modules are harmlessly re-declared
 * (metro-runtime's `__d` is a no-op for existing module ids).
 */
export async function fetchDeltaBundle(entryPath: string): Promise<string> {
  const relativeEntryPath = path.relative(PROJECT_ROOT, entryPath);
  const bundleURL = getBundleURL(relativeEntryPath, {
    modulesOnly: 'true',
    runModule: 'true',
  });
  const code = await fetchBundleWithRetry(bundleURL);

  // Evict Metro's cached dependency graph for this one-off entry to free memory.
  try {
    await fetch(bundleURL, {method: 'DELETE'});
  } catch {
    // Best-effort cleanup.
  }

  return code;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
