/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import connect from 'connect';
import http from 'node:http';

jest.useRealTimers();
jest.mock('open', () => jest.fn());

const open: JestMockFn<[string], Promise<void>> = jest.requireMock('open');

let server: http$Server;
let baseUrl: string;

beforeEach(async () => {
  open.mockReset();
  open.mockImplementation(async () => {});

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
      '/open-url',
      require('../openURLMiddleware').default({
        serverBaseUrl: new URL(baseUrl),
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

function postURL(body: string, headers?: {Origin?: string}): Promise<Response> {
  return fetch(baseUrl + '/open-url', {
    method: 'POST',
    headers: {...headers, 'Content-Type': 'application/json'},
    body,
  });
}

describe('/open-url', () => {
  test.each([
    'https://reactnative.dev/docs/tutorial',
    'https://reactnative.dev/docs/a%20b?q=1&r=2#top',
  ])('opens %s in the browser', async url => {
    const resp = await postURL(JSON.stringify({url}));

    expect(resp.status).toBe(200);
    expect(await resp.text()).toBe('OK');
    expect(open).toHaveBeenCalledWith(url);
  });

  test('throttles a second launch inside the window', async () => {
    const body = JSON.stringify({url: 'https://reactnative.dev/'});

    const first = await postURL(body);
    const second = await postURL(body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(open).toHaveBeenCalledTimes(1);
  });

  test('refuses a cross-origin request', async () => {
    const resp = await postURL(
      JSON.stringify({url: 'https://reactnative.dev/'}),
      {Origin: 'https://example.com'},
    );

    expect(resp.status).toBe(403);
    expect(open).not.toHaveBeenCalled();
  });

  test('rejects a body that is not JSON', async () => {
    const resp = await postURL('not json');

    expect(resp.status).toBe(400);
    expect(open).not.toHaveBeenCalled();
  });

  test.each([
    ['a non-string url', {url: 123}],
    ['null', null],
  ])('rejects a body with %s', async (_, body) => {
    const resp = await postURL(JSON.stringify(body));

    expect(resp.status).toBe(400);
    expect(open).not.toHaveBeenCalled();
  });

  // CVE-2025-11953
  test.each([
    ['a bare executable', 'calc.exe'],
    [
      'a PowerShell subexpression in the query',
      'https://example.com/?x=$(calc)',
    ],
    ['a PowerShell escape in the query', 'https://example.com/?x=`n'],
    ['a file URL', 'file:///etc/passwd'],
  ])('rejects %s', async (_, url) => {
    const resp = await postURL(JSON.stringify({url}));

    expect(resp.status).toBe(400);
    expect(open).not.toHaveBeenCalled();
  });

  test('responds with 500 when the browser cannot be launched', async () => {
    open.mockImplementation(async () => {
      throw new Error('spawn xdg-open ENOENT');
    });

    const resp = await postURL(
      JSON.stringify({url: 'https://reactnative.dev/'}),
    );

    expect(resp.status).toBe(500);
  });

  test('passes a GET request through', async () => {
    const resp = await fetch(baseUrl + '/open-url');

    expect(resp.status).toBe(404);
    expect(open).not.toHaveBeenCalled();
  });
});
