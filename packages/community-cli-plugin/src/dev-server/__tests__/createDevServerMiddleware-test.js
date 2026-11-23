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
        projectRoot: '/project',
        watchFolders: ['/project'],
        logger: {warn: () => {}, error: () => {}},
      }).middleware,
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
  test('serves /status', async () => {
    const resp = await fetch(baseUrl + '/status');

    expect(resp.status).toBe(200);
    expect(await resp.text()).toBe('packager-status:running');
  });

  test('refuses a cross-origin request before any route', async () => {
    const resp = await fetch(baseUrl + '/status', {
      headers: {Origin: 'https://example.com'},
    });

    expect(resp.status).toBe(403);
  });
});

describe('createDevServerMiddleware sockets', () => {
  const {startTestServer} = require('./SocketTestUtils');
  let testServer;

  beforeEach(async () => {
    const connect = require('connect');
    const createDevServerMiddleware =
      require('../createDevServerMiddleware').default;
    testServer = await startTestServer();
    const {middleware, websocketEndpoints} = createDevServerMiddleware({
      serverBaseUrl: testServer.baseUrl,
      projectRoot: '/project',
      watchFolders: ['/project'],
      logger: {warn: () => {}, error: () => {}},
    });
    testServer.server.on('request', connect().use(middleware));
    testServer.mount('/message', websocketEndpoints['/message']);
  });

  afterEach(() => testServer.close());

  test('reloads the connected apps on /reload', async () => {
    const app = await testServer.connect('/message');

    const resp = await fetch(testServer.baseUrl.origin + '/reload');

    expect(await resp.text()).toBe('OK');
    expect(await app.next()).toEqual({version: 2, method: 'reload'});
  });
});
