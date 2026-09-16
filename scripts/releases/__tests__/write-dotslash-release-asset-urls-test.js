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

const {
  writeReleaseAssetUrlsToDotSlashFile,
} = require('../write-dotslash-release-asset-urls');
const {removeAnsiColors, sanitizeSnapshots} = require('./snapshot-utils');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const signedsource = require('signedsource');

let server, serverUrl, tmpDir, consoleLog;

expect.addSnapshotSerializer(sanitizeSnapshots(() => tmpDir, '<tmpDir>'));
expect.addSnapshotSerializer(sanitizeSnapshots(() => serverUrl, '<serverUrl>'));
expect.addSnapshotSerializer(
  sanitizeSnapshots(
    /SignedSource<<[a-f0-9]{32}>>/g,
    'SignedSource<<SIGNATURE>>',
  ),
);
expect.addSnapshotSerializer(removeAnsiColors);

beforeEach(async () => {
  consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'write-dotslash-release-asset-urls-test-'),
  );
  await new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      if (req.url !== '/') {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('');
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
  consoleLog.mockRestore();
  await new Promise((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
  await fs.rm(tmpDir, {recursive: true, force: true});
});

describe('writeReleaseAssetUrlsToDotSlashFile', () => {
  test('fails if there are no upstream providers', async () => {
    const dotslashContents = `#!/usr/bin/env dotslash
{
  "name": "test",
  "platforms": {
    "linux-x86_64": {
      "providers": [
        {"url": "https://github.com/facebook/react-native/releases/download/v1000.0.0/test.tar.gz"},
      ],
      "size": 0,
      "hash": "sha256",
      "digest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "format": "tar.gz",
      "path": "bar"
    }
  }
}
`;
    await fs.writeFile(`${tmpDir}/entry-point`, dotslashContents);

    await expect(
      writeReleaseAssetUrlsToDotSlashFile({
        filename: `${tmpDir}/entry-point`,
        releaseTag: 'v1000.0.1',
      }),
    ).rejects.toThrowErrorMatchingSnapshot();

    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });

  test('adds a new release asset provider if missing (first release commit in a branch)', async () => {
    const dotslashContents = `#!/usr/bin/env dotslash
// @${'generated SignedSource<<00000000000000000000000000000000>>'}
{
  "name": "test",
  "platforms": {
    "linux-x86_64": {
      "providers": [
        {"url": "${serverUrl}"},
      ],
      "size": 0,
      "hash": "sha256",
      "digest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "path": "bar"
    }
  }
}
`;
    await fs.writeFile(`${tmpDir}/entry-point`, dotslashContents);

    await expect(
      writeReleaseAssetUrlsToDotSlashFile({
        filename: `${tmpDir}/entry-point`,
        releaseTag: 'v1000.0.1',
      }),
    ).resolves.toBeUndefined();

    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');

    const updatedContents = await fs.readFile(`${tmpDir}/entry-point`, 'utf8');

    expect(updatedContents).toMatchSnapshot('updated dotslash file');
    expect(signedsource.verifySignature(updatedContents)).toBe(true);
  });

  test('replaces the old release asset provider if exists (Nth release commit in a branch)', async () => {
    const dotslashContents = `#!/usr/bin/env dotslash
// @${'generated SignedSource<<00000000000000000000000000000000>>'}
{
  "name": "test",
  "platforms": {
    "linux-x86_64": {
      "providers": [
        {"url": "${serverUrl}"},
        {"url": "https://github.com/facebook/react-native/releases/download/v1000.0.0/test.tar.gz"}
      ],
      "size": 0,
      "hash": "sha256",
      "digest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "path": "bar"
    }
  }
}
`;
    await fs.writeFile(`${tmpDir}/entry-point`, dotslashContents);

    await expect(
      writeReleaseAssetUrlsToDotSlashFile({
        filename: `${tmpDir}/entry-point`,
        releaseTag: 'v1000.0.1',
      }),
    ).resolves.toBeUndefined();

    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');

    const updatedContents = await fs.readFile(`${tmpDir}/entry-point`, 'utf8');

    expect(updatedContents).toMatchSnapshot('updated dotslash file');
    expect(signedsource.verifySignature(updatedContents)).toBe(true);
  });

  test('fails if upstream returns an incorrect asset', async () => {
    const dotslashContents = `#!/usr/bin/env dotslash
// @${'generated SignedSource<<00000000000000000000000000000000>>'}
{
  "name": "test",
  "platforms": {
    "linux-x86_64": {
      "providers": [
        {"url": "${serverUrl}"},
      ],
      "size": 1,
      "hash": "sha256",
      "digest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "path": "bar"
    }
  }
}
`;
    await fs.writeFile(`${tmpDir}/entry-point`, dotslashContents);

    await expect(
      writeReleaseAssetUrlsToDotSlashFile({
        filename: `${tmpDir}/entry-point`,
        releaseTag: 'v1001.0.0',
      }),
    ).rejects.toThrowErrorMatchingSnapshot();

    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });
});
