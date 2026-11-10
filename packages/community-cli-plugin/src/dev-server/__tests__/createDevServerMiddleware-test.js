/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import http from 'node:http';

jest.useRealTimers();

let server: http$Server;
let baseUrl: string;

beforeEach(async () => {
  const connect = require('connect');
  const createDevServerMiddleware =
    require('../createDevServerMiddleware').default;
  const app = connect();
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  const address = server.address();
  if (address == null || typeof address === 'string') {
    throw new Error('Expected the server to listen on a TCP port');
  }
  baseUrl = `http://localhost:${address.port}`;
  app
    .use(
      createDevServerMiddleware({
        serverBaseUrl: new URL(baseUrl),
        watchFolders: ['/project'],
      }),
    )
    .use((req, res) => {
      res.writeHead(404);
      res.end();
    });
});

afterEach(() => {
  server.closeAllConnections();
  return new Promise(resolve => server.close(() => resolve()));
});

describe('createDevServerMiddleware', () => {
  test('refuses a cross-origin request before any route', async () => {
    const resp = await fetch(baseUrl + '/open-url', {
      headers: {Origin: 'https://example.com'},
    });

    expect(resp.status).toBe(403);
  });
});
