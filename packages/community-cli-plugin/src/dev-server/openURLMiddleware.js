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
import readJSONBody from './readJSONBody';
import open from 'open';

const LAUNCH_THROTTLE_MS = 2000;

// On Windows, `open` passes the URL inside a double-quoted PowerShell string,
// where these characters expand to variables, subexpressions and escapes.
const POWERSHELL_EXPANSION_CHARS = /[$`"]/;

type Options = Readonly<{
  serverBaseUrl: URL,
}>;

/**
 * Open an `http:` or `https:` URL in the user's default browser.
 */
export default function openURLMiddleware({
  serverBaseUrl,
}: Options): NextHandleFunction {
  let lastLaunchTime = -Infinity;

  return async (req, res, next) => {
    // `@react-native-community/cli-server-api` before v21, mounted ahead of
    // this middleware, serves this route.
    if (req.method !== 'POST' || res.writableEnded) {
      next();
      return;
    }

    const {origin} = req.headers;
    if (typeof origin === 'string' && !isAllowedOrigin(origin, serverBaseUrl)) {
      res.writeHead(403);
      res.end('Unauthorized origin');
      return;
    }

    let body;
    try {
      body = await readJSONBody(req);
    } catch {
      res.writeHead(400);
      res.end('Invalid request body');
      return;
    }

    const url = parseURL(body);
    if (url == null) {
      res.writeHead(400);
      res.end('Expected a JSON body with an http(s) `url`');
      return;
    }

    const now = Date.now();
    if (now - lastLaunchTime < LAUNCH_THROTTLE_MS) {
      res.writeHead(429);
      res.end('Too many requests');
      return;
    }
    lastLaunchTime = now;

    try {
      await open(url);
    } catch (e) {
      res.writeHead(500);
      res.end(`Could not open the URL: ${e.message}`);
      return;
    }

    res.writeHead(200);
    res.end('OK');
  };
}

function parseURL(body: unknown): ?string {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const {url} = body;
  if (typeof url !== 'string' || !URL.canParse(url)) {
    return null;
  }
  const {protocol, href} = new URL(url);
  if (
    (protocol !== 'http:' && protocol !== 'https:') ||
    POWERSHELL_EXPANSION_CHARS.test(href)
  ) {
    return null;
  }
  return href;
}
