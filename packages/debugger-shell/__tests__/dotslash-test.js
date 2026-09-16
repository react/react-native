/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {
  prepareDebuggerShellFromDotSlashFile,
} = require('../src/node/private/LaunchUtils');
const fs = require('node:fs').promises;
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

// The implementation of prepareDebuggerShellFromDotSlashFile relies on
// details of DotSlash that are not guaranteed to be stable (support for
// `dotslash -- fetch <file>`, certain strings being printed to stderr).
// This (admittedly elaborate) test suite ensures we'll fail loudly if we
// try to upgrade DotSlash to a version that breaks our assumptions.
describe('prepareDebuggerShellFromDotSlashFile', () => {
  test('fails with the expected error message for missing platforms', async () => {
    const result = await prepareDebuggerShellFromDotSlashFile(
      path.join(__dirname, 'dotslash-file-with-missing-platforms.jsonc'),
    );
    expect(result).toMatchSnapshot({
      verboseInfo: expect.any(String),
    });
  });

  test('fails with the expected error message for a missing dotslash file', async () => {
    const result = await prepareDebuggerShellFromDotSlashFile(
      path.join(__dirname, 'dotslash-file-that-does-not-exist.jsonc'),
    );
    expect(result).toMatchSnapshot({
      verboseInfo: expect.any(String),
    });
  });

  describe('scenarios requiring a local HTTP server', () => {
    let server, scratchDir;

    beforeEach(async () => {
      scratchDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dotslash-test-'));
      server = http.createServer((request, response) => {
        if (request.url === '/corrupted.tar.gz') {
          response.writeHead(200, {'Content-Type': 'application/gzip'});
          response.end(
            'Hello, world!\n' + 'This simulated a corrupted tarball.',
          );
        } else {
          response.writeHead(404);
          response.end();
        }
      });
      await new Promise((resolve, reject) => {
        server.on('error', reject);
        server.listen(0, 'localhost', () => {
          server.removeListener('error', reject);
          resolve();
        });
      });
    });

    afterEach(async () => {
      await fs.rm(scratchDir, {recursive: true, force: true});
      if (server.listening) {
        await new Promise((resolve, reject) => {
          server.close(error => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }
    });

    test('fails with the expected error message for a corrupted tarball', async () => {
      const dotslashFileContents = injectHostPort(
        await fs.readFile(
          path.join(
            __dirname,
            'dotslash-file-simulating-data-corruption.jsonc',
          ),
          'utf8',
        ),
        server.address(),
      );

      await fs.writeFile(
        path.join(scratchDir, 'dotslash-file.jsonc'),
        dotslashFileContents,
      );
      const result = await prepareDebuggerShellFromDotSlashFile(
        path.join(scratchDir, 'dotslash-file.jsonc'),
      );
      expect(result).toMatchSnapshot({
        verboseInfo: expect.any(String),
      });
    });

    test('fails with the expected error message for a network error', async () => {
      const dotslashFileContents = injectHostPort(
        await fs.readFile(
          path.join(__dirname, 'dotslash-file-simulating-network-error.jsonc'),
          'utf8',
        ),
        server.address(),
      );

      await fs.writeFile(
        path.join(scratchDir, 'dotslash-file.jsonc'),
        dotslashFileContents,
      );
      const result = await prepareDebuggerShellFromDotSlashFile(
        path.join(scratchDir, 'dotslash-file.jsonc'),
      );
      expect(result).toMatchSnapshot({
        verboseInfo: expect.any(String),
      });
    });
  });
});

function injectHostPort(
  dotslashFileContents: string,
  address: net$Socket$address,
) {
  const host =
    address.family === 'IPv6' ? `[${address.address}]` : address.address;
  return dotslashFileContents
    .replaceAll('$HOST', host)
    .replaceAll('$PORT', address.port.toString());
}
