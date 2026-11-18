/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import statusMiddleware from '../statusMiddleware';
import connect from 'connect';
import http from 'node:http';

jest.useRealTimers();

async function fetchStatus(projectRoot: string): Promise<Response> {
  const app = connect().use('/status', statusMiddleware({projectRoot}));
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  try {
    const address = server.address();
    if (address == null || typeof address === 'string') {
      throw new Error('Expected the server to listen on a TCP port');
    }
    return await fetch(`http://localhost:${address.port}/status`);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(() => resolve()));
  }
}

describe('/status', () => {
  // React Native apps and `isDevServerRunning` depend on this exact response.
  test('reports that the packager is running for the project root', async () => {
    const resp = await fetchStatus('/mocked/path');

    expect(resp.status).toBe(200);
    expect(await resp.text()).toBe('packager-status:running');
    expect(resp.headers.get('X-React-Native-Project-Root')).toBe(
      '/mocked/path',
    );
    expect(resp.headers.get('Cache-Control')).toBe('no-store');
  });
});
