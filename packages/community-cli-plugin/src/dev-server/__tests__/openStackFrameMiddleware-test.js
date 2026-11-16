/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Server} from 'connect';

import connect from 'connect';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

jest.useRealTimers();
jest.mock('launch-editor', () => jest.fn());

const launchEditor: JestMockFn<[string, ?string], void> =
  jest.requireMock('launch-editor');

const projectRoot = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'openStackFrameMiddleware-test-')),
);
const appFile = path.join(projectRoot, 'App.js');
fs.writeFileSync(appFile, '');
const outsideRoot = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'openStackFrameMiddleware-outside-')),
);
const outsideFile = path.join(outsideRoot, 'secret.txt');
fs.writeFileSync(outsideFile, '');
const symlinkOut = path.join(projectRoot, 'SettingsScreen.tsx');
fs.symlinkSync(outsideFile, symlinkOut);

const originalEditor = process.env.REACT_EDITOR;

beforeAll(() => {
  process.env.REACT_EDITOR = 'test-editor';
});

afterAll(() => {
  process.env.REACT_EDITOR = originalEditor;
  fs.rmSync(projectRoot, {recursive: true, force: true});
  fs.rmSync(outsideRoot, {recursive: true, force: true});
});

beforeEach(() => {
  launchEditor.mockReset();
});

async function startServer(
  mount: (app: Server) => void,
): Promise<{server: http$Server, baseUrl: string}> {
  const app = connect();
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  const address = server.address();
  if (address == null || typeof address === 'string') {
    throw new Error('Expected the server to listen on a TCP port');
  }
  const baseUrl = `http://localhost:${address.port}`;
  mount(app);
  app.use((req, res) => {
    res.writeHead(404);
    res.end();
  });
  return {server, baseUrl};
}

function mountOpenStackFrame(app: Server) {
  app.use(
    '/open-stack-frame',
    require('../openStackFrameMiddleware').default({
      watchFolders: [projectRoot],
    }),
  );
}

function stopServer(server: http$Server): Promise<void> {
  server.closeAllConnections();
  return new Promise(resolve => server.close(() => resolve()));
}

function postFrame(baseUrl: string, body: string): Promise<Response> {
  return fetch(baseUrl + '/open-stack-frame', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  });
}

describe('/open-stack-frame', () => {
  let server: http$Server;
  let baseUrl: string;

  beforeEach(async () => {
    ({server, baseUrl} = await startServer(mountOpenStackFrame));
  });

  afterEach(() => stopServer(server));

  test('opens the frame in the editor', async () => {
    const resp = await postFrame(
      baseUrl,
      JSON.stringify({file: appFile, lineNumber: 12}),
    );

    expect(resp.status).toBe(200);
    expect(await resp.text()).toBe('OK');
    expect(launchEditor).toHaveBeenCalledWith(`${appFile}:12`, 'test-editor');
  });

  test('throttles a second launch inside the window', async () => {
    const body = JSON.stringify({file: appFile, lineNumber: 12});

    const first = await postFrame(baseUrl, body);
    const second = await postFrame(baseUrl, body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(launchEditor).toHaveBeenCalledTimes(1);
  });

  test('rejects a body that is not JSON', async () => {
    const resp = await postFrame(baseUrl, 'not json');

    expect(resp.status).toBe(400);
    expect(launchEditor).not.toHaveBeenCalled();
  });

  test('opens a path relative to the first watch folder', async () => {
    const resp = await postFrame(
      baseUrl,
      JSON.stringify({file: 'App.js', lineNumber: 3}),
    );

    expect(resp.status).toBe(200);
    expect(launchEditor).toHaveBeenCalledWith(`${appFile}:3`, 'test-editor');
  });

  test.each([
    ['a file outside every watch folder', outsideFile],
    ['a symlink out of a watch folder', symlinkOut],
    ['a nonexistent file', path.join(projectRoot, 'Missing.js')],
  ])('rejects %s', async (_, file) => {
    const resp = await postFrame(
      baseUrl,
      JSON.stringify({file, lineNumber: 1}),
    );

    expect(resp.status).toBe(400);
    expect(launchEditor).not.toHaveBeenCalled();
  });

  test.each([
    ['a missing file', {lineNumber: 1}],
    ['null', null],
  ])('rejects a body with %s', async (_, body) => {
    const resp = await postFrame(baseUrl, JSON.stringify(body));

    expect(resp.status).toBe(400);
    expect(launchEditor).not.toHaveBeenCalled();
  });

  test('passes a GET request through', async () => {
    const resp = await fetch(baseUrl + '/open-stack-frame');

    expect(resp.status).toBe(404);
    expect(launchEditor).not.toHaveBeenCalled();
  });
});
