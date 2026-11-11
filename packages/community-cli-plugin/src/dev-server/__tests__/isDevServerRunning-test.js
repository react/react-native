/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import isDevServerRunning from '../isDevServerRunning';
import statusMiddleware from '../statusMiddleware';
import connect from 'connect';
import http from 'node:http';

jest.useRealTimers();

test('matches a running dev server for a project root that needs URL encoding', async () => {
  const projectRoot = '/root with spaces/ü';
  const app = connect().use('/status', statusMiddleware({projectRoot}));
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  try {
    const address = server.address();
    if (address == null || typeof address === 'string') {
      throw new Error('Expected the server to listen on a TCP port');
    }
    const devServerUrl = `http://localhost:${address.port}`;

    expect(await isDevServerRunning(devServerUrl, projectRoot)).toBe(
      'matched_server_running',
    );
    expect(await isDevServerRunning(devServerUrl, '/other/root')).toBe(
      'port_taken',
    );
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(() => resolve()));
  }
});
