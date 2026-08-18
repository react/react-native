/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {getWithCurl} = require('../curl-utils');
const http = require('node:http');

let server, serverUrl;

beforeEach(async () => {
  await new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      if (req.url !== '/') {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello World\n');
    });
    server.on('error', reject);
    server.listen(0, 'localhost', () => {
      const {port} = server.address();
      serverUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterEach(async () => {
  await new Promise((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
});

describe('getWithCurl', () => {
  test('success', async () => {
    await expect(getWithCurl(serverUrl)).resolves.toEqual({
      data: Buffer.from('Hello World\n'),
      contentType: 'text/plain',
    });
  });

  test('fails on 404', async () => {
    await expect(getWithCurl(serverUrl + '/error')).rejects.toThrowError();
  });
});
