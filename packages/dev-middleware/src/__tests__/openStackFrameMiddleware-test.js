/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {DevToolLauncher} from '../types/DevToolLauncher';

import openStackFrameMiddleware from '../middleware/openStackFrameMiddleware';
import {requestLocal} from './FetchUtils';
import {baseUrlForServer, withServerForEachTest} from './ServerUtils';
import connect from 'connect';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

jest.useRealTimers();
jest.setTimeout(10000);

const projectRoot = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'openStackFrameMiddleware-test-')),
);
const appFile = path.join(projectRoot, 'App.js');
fs.writeFileSync(appFile, '');
const outsideRoot = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'openStackFrameMiddleware-outside-')),
);
const outsideFile = path.join(outsideRoot, 'secret.js');
fs.writeFileSync(outsideFile, '');
const symlinkOut = path.join(projectRoot, 'link.js');
fs.symlinkSync(outsideFile, symlinkOut);

afterAll(() => {
  fs.rmSync(projectRoot, {recursive: true, force: true});
  fs.rmSync(outsideRoot, {recursive: true, force: true});
});

const launchEditor = jest.fn<[string, ?number], Promise<void>>();
const toolLauncher: DevToolLauncher = {
  launchDebuggerAppWindow: async () => {},
  launchEditor,
};

beforeEach(() => {
  launchEditor.mockReset();
  launchEditor.mockResolvedValue();
});

function postFrame(
  serverBaseUrl: string,
  body: string,
  headers?: {[string]: string},
) {
  return requestLocal(serverBaseUrl + '/open-stack-frame', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', ...headers},
    body,
  });
}

describe('/open-stack-frame', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
    unstable_toolLauncher: toolLauncher,
    unstable_watchFolders: [projectRoot],
  });

  test('opens the frame in the editor', async () => {
    const resp = await postFrame(
      serverRef.serverBaseUrl,
      JSON.stringify({file: appFile, lineNumber: 12}),
    );

    expect(resp.statusCode).toBe(200);
    expect(resp.bodyBuffer.toString()).toBe('OK');
    expect(launchEditor).toHaveBeenCalledWith(appFile, 12);
  });

  test('throttles a second launch inside the window', async () => {
    const body = JSON.stringify({file: appFile, lineNumber: 12});

    const first = await postFrame(serverRef.serverBaseUrl, body);
    const second = await postFrame(serverRef.serverBaseUrl, body);

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(429);
    expect(launchEditor).toHaveBeenCalledTimes(1);
  });

  test('accepts a request from the dev server origin', async () => {
    const resp = await postFrame(
      serverRef.serverBaseUrl,
      JSON.stringify({file: appFile, lineNumber: 12}),
      {Origin: serverRef.serverBaseUrl},
    );

    expect(resp.statusCode).toBe(200);
    expect(launchEditor).toHaveBeenCalledTimes(1);
  });

  test('refuses a cross-origin request', async () => {
    const resp = await postFrame(
      serverRef.serverBaseUrl,
      JSON.stringify({file: appFile, lineNumber: 12}),
      {Origin: 'https://example.com'},
    );

    expect(resp.statusCode).toBe(403);
    expect(launchEditor).not.toHaveBeenCalled();
  });

  test('rejects a body that is not JSON', async () => {
    const resp = await postFrame(serverRef.serverBaseUrl, 'not json');

    expect(resp.statusCode).toBe(400);
    expect(launchEditor).not.toHaveBeenCalled();
  });

  test('opens a path relative to the first watch folder', async () => {
    const resp = await postFrame(
      serverRef.serverBaseUrl,
      JSON.stringify({file: 'App.js', lineNumber: 3}),
    );

    expect(resp.statusCode).toBe(200);
    expect(launchEditor).toHaveBeenCalledWith(appFile, 3);
  });

  test('drops a line number that is not a positive integer', async () => {
    const resp = await postFrame(
      serverRef.serverBaseUrl,
      JSON.stringify({file: appFile, lineNumber: '12'}),
    );

    expect(resp.statusCode).toBe(200);
    expect(launchEditor).toHaveBeenCalledWith(appFile, undefined);
  });

  test.each([
    ['a file outside every watch folder', outsideFile],
    [
      'a path that climbs out with ..',
      path.join(projectRoot, '..', path.basename(outsideRoot), 'secret.js'),
    ],
    ['a symlink out of a watch folder', symlinkOut],
    ['a nonexistent file', path.join(projectRoot, 'Missing.js')],
    ['a watch folder itself', projectRoot],
  ])('rejects %s', async (_, file) => {
    const resp = await postFrame(
      serverRef.serverBaseUrl,
      JSON.stringify({file, lineNumber: 1}),
    );

    expect(resp.statusCode).toBe(400);
    expect(launchEditor).not.toHaveBeenCalled();
  });

  test.each([
    ['a missing file', {lineNumber: 1}],
    ['a non-string file', {file: 42}],
    ['an array', [appFile]],
  ])('rejects a body with %s', async (_, body) => {
    const resp = await postFrame(serverRef.serverBaseUrl, JSON.stringify(body));

    expect(resp.statusCode).toBe(400);
    expect(launchEditor).not.toHaveBeenCalled();
  });

  test('rejects a null body', async () => {
    const resp = await postFrame(serverRef.serverBaseUrl, 'null');

    expect(resp.statusCode).toBe(400);
    expect(launchEditor).not.toHaveBeenCalled();
  });

  test('responds with 500 when the launcher rejects', async () => {
    launchEditor.mockRejectedValue(new Error('No editor found'));

    const resp = await postFrame(
      serverRef.serverBaseUrl,
      JSON.stringify({file: appFile, lineNumber: 12}),
    );

    expect(resp.statusCode).toBe(500);
  });
});

describe('/open-stack-frame behind a middleware that serves it', () => {
  let server: http$Server;
  let serverBaseUrl: string;

  beforeEach(done => {
    const app = connect()
      .use('/open-stack-frame', (req, res, next) => {
        res.end('handled upstream');
        next();
      })
      .use(
        '/open-stack-frame',
        openStackFrameMiddleware({
          serverBaseUrl: new URL('http://localhost'),
          watchFolders: [projectRoot],
          toolLauncher,
        }),
      );
    server = http.createServer(app);
    server.listen(() => {
      serverBaseUrl = baseUrlForServer(server, 'http');
      done();
    });
  });

  afterEach(done => {
    server.close(() => done());
  });

  test('leaves the response to that middleware', async () => {
    const resp = await postFrame(
      serverBaseUrl,
      JSON.stringify({file: appFile, lineNumber: 12}),
    );

    expect(resp.bodyBuffer.toString()).toBe('handled upstream');
    expect(launchEditor).not.toHaveBeenCalled();
  });
});
