/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ReadonlyURL} from '../types/ReadonlyURL';

export const ALLOWED_ORIGIN_HOSTNAMES: ReadonlySet<string> = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::]',
]);

/**
 * Whether a browser request from `origin` may use dev server endpoints that
 * act on the host machine: the dev server's own origin, or a local hostname.
 */
export default function isAllowedOrigin(
  origin: string,
  serverBaseUrl: ReadonlyURL,
): boolean {
  if (serverBaseUrl.origin === origin) {
    return true;
  }

  if (URL.canParse(origin)) {
    const {hostname} = new URL(origin);
    if (ALLOWED_ORIGIN_HOSTNAMES.has(hostname)) {
      return true;
    }
  }

  return false;
}
