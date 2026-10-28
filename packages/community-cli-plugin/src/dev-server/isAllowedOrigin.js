/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const ALLOWED_ORIGIN_HOSTNAMES: ReadonlySet<string> = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::]',
]);

/**
 * Whether a browser request from `origin` may use a dev server endpoint that
 * acts on the host machine: the dev server's own origin, or a local hostname,
 * as the inspector proxy allows for debugger connections.
 */
export default function isAllowedOrigin(
  origin: string,
  serverBaseUrl: URL,
): boolean {
  if (serverBaseUrl.origin === origin) {
    return true;
  }

  return URL.canParse(origin)
    ? ALLOWED_ORIGIN_HOSTNAMES.has(new URL(origin).hostname)
    : false;
}
