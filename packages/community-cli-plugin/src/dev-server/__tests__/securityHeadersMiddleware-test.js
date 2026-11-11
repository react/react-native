/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import securityHeadersMiddleware from '../securityHeadersMiddleware';
import connect from 'connect';
import http from 'node:http';

jest.useRealTimers();

let server: http$Server;
let baseUrl: string;
let reached: JestMockFn<[], void>;

beforeEach(async () => {
  reached = jest.fn();
  const app = connect();
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  const address = server.address();
  if (address == null || typeof address === 'string') {
    throw new Error('Expected the server to listen on a TCP port');
  }
  baseUrl = `http://localhost:${address.port}`;
  app
    .use(securityHeadersMiddleware({serverBaseUrl: new URL(baseUrl)}))
    .use((req, res) => {
      reached();
      res.end('OK');
    });
});

afterEach(() => {
  server.closeAllConnections();
  return new Promise(resolve => server.close(() => resolve()));
});

describe('securityHeadersMiddleware', () => {
  test.each([
    ['no origin', undefined],
    ['the dev server origin', 'SERVER'],
    ['a local origin on another port', 'http://localhost:3000'],
    ['Chrome DevTools', 'devtools://devtools/bundled/inspector.html'],
  ])('accepts a request from %s', async (_, origin) => {
    const resp = await fetch(baseUrl, {
      headers:
        origin == null ? {} : {Origin: origin === 'SERVER' ? baseUrl : origin},
    });

    expect(resp.status).toBe(200);
    expect(resp.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(reached).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['another site', 'https://example.com'],
    ['a malformed origin', 'not an origin'],
  ])('refuses a request from %s', async (_, origin) => {
    const resp = await fetch(baseUrl, {headers: {Origin: origin}});

    expect(resp.status).toBe(403);
    expect(reached).not.toHaveBeenCalled();
  });
});
