/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {NextHandleFunction} from 'connect';

import isAllowedOrigin from './isAllowedOrigin';

type Options = Readonly<{
  serverBaseUrl: URL,
}>;

/**
 * Refuse browser requests from an origin other than the dev server's own, a
 * local hostname, or Chrome's built-in DevTools, and block MIME-type sniffing
 * on every response.
 */
export default function securityHeadersMiddleware({
  serverBaseUrl,
}: Options): NextHandleFunction {
  return (req, res, next) => {
    const {origin} = req.headers;
    if (
      typeof origin === 'string' &&
      !origin.startsWith('devtools://devtools') &&
      !isAllowedOrigin(origin, serverBaseUrl)
    ) {
      res.writeHead(403);
      res.end('Unauthorized origin');
      return;
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  };
}
