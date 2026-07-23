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
  getReleaseAssetMap,
  uploadReleaseAssetsForDotSlashFile,
} = require('../upload-release-assets-for-dotslash');
const {
  removeAnsiColors,
  removeCurlPaths,
  sanitizeSnapshots,
} = require('./snapshot-utils');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

let server, serverUrl, tmpDir, consoleLog;

expect.addSnapshotSerializer(sanitizeSnapshots(() => tmpDir, '<tmpDir>'));
expect.addSnapshotSerializer(sanitizeSnapshots(() => serverUrl, '<serverUrl>'));
expect.addSnapshotSerializer(removeAnsiColors);
expect.addSnapshotSerializer(removeCurlPaths);

const mockAssets: Array<{
  id: string,
  ...
}> = [];

let nextAssetId = 1;

const octokit = {
  repos: {
    listReleaseAssets: jest.fn().mockImplementation(() => {
      return {
        data: mockAssets,
      };
    }),
    deleteReleaseAsset: jest.fn().mockImplementation(({asset_id}) => {
      const index = mockAssets.findIndex(asset => asset.id === asset_id);
      if (index === -1) {
        throw new Error('Asset not found');
      }
      mockAssets.splice(index, 1);
    }),
    uploadReleaseAsset: jest.fn().mockImplementation(() => {
      let assetId;
      do {
        assetId = String(nextAssetId++);
      } while (mockAssets.some(asset => asset.id === assetId));
      mockAssets.push({
        id: assetId,
      });
      return {
        data: {
          id: assetId,
          browser_download_url: `https://github.com/facebook/react-native/releases/download/untagged-0b602d8af97c6d3b784c/test.tar.gz`,
        },
      };
    }),
  },
};

beforeEach(async () => {
  mockAssets.length = 0;
  octokit.repos.listReleaseAssets.mockClear();
  octokit.repos.deleteReleaseAsset.mockClear();
  octokit.repos.uploadReleaseAsset.mockClear();

  consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'upload-release-assets-for-dotslash-test-'),
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

describe('uploadReleaseAssetsForDotSlashFile', () => {
  beforeEach(async () => {
    // Simulate the repo in a state where the DotSlash file has been updated
    // (by write-release-asset-urls-to-dotslash-file) but the release assets
    // have not been uploaded yet.
    const dotslashContents = `#!/usr/bin/env dotslash
{
  "name": "test",
  "platforms": {
    "linux-x86_64": {
      "providers": [
        {"url": "https://github.com/facebook/react-native/releases/download/v1000.0.1/test.tar.gz"},
        {"url": "${serverUrl}"}
      ],
      "size": 0,
      "hash": "sha256",
      "digest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "format": "tar.gz",
      "path": "bar"
    },
  },
}`;
    await fs.writeFile(path.join(tmpDir, 'entry-point'), dotslashContents);
  });

  const releaseId = '1';

  test('uploads the asset if not already present', async () => {
    await uploadReleaseAssetsForDotSlashFile(
      path.join(tmpDir, 'entry-point'),
      {
        releaseId,
        releaseTag: 'v1000.0.1',
        existingAssetsByName: await getReleaseAssetMap({releaseId}, octokit),
      },
      {
        force: false,
        dryRun: false,
      },
      octokit,
    );

    expect(octokit.repos.deleteReleaseAsset).not.toHaveBeenCalled();
    expect(octokit.repos.uploadReleaseAsset.mock.calls).toMatchSnapshot(
      'uploadReleaseAsset calls',
    );
    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });

  test('skips uploading the asset if already present', async () => {
    mockAssets.push({
      id: '1',
      name: 'test.tar.gz',
    });
    await uploadReleaseAssetsForDotSlashFile(
      path.join(tmpDir, 'entry-point'),
      {
        releaseId,
        releaseTag: 'v1000.0.1',
        existingAssetsByName: await getReleaseAssetMap({releaseId}, octokit),
      },
      {
        force: false,
        dryRun: false,
      },
      octokit,
    );

    expect(octokit.repos.deleteReleaseAsset).not.toHaveBeenCalled();
    expect(octokit.repos.uploadReleaseAsset).not.toHaveBeenCalled();
    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });

  test('deletes and reuploads the asset if force is true', async () => {
    mockAssets.push({
      id: '1',
      name: 'test.tar.gz',
    });
    await uploadReleaseAssetsForDotSlashFile(
      path.join(tmpDir, 'entry-point'),
      {
        releaseId,
        releaseTag: 'v1000.0.1',
        existingAssetsByName: await getReleaseAssetMap({releaseId}, octokit),
      },
      {
        force: true,
        dryRun: false,
      },
      octokit,
    );

    expect(octokit.repos.deleteReleaseAsset.mock.calls).toMatchSnapshot(
      'deleteReleaseAsset calls',
    );
    expect(octokit.repos.uploadReleaseAsset.mock.calls).toMatchSnapshot(
      'uploadReleaseAsset calls',
    );
    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });

  test('does not upload the asset if dryRun is true', async () => {
    await uploadReleaseAssetsForDotSlashFile(
      path.join(tmpDir, 'entry-point'),
      {
        releaseId,
        releaseTag: 'v1000.0.1',
        existingAssetsByName: await getReleaseAssetMap({releaseId}, octokit),
      },
      {
        force: false,
        dryRun: true,
      },
      octokit,
    );

    expect(octokit.repos.deleteReleaseAsset).not.toHaveBeenCalled();
    expect(octokit.repos.uploadReleaseAsset).not.toHaveBeenCalled();
    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });

  test('does not overwrite an existing asset if dryRun is true', async () => {
    mockAssets.push({
      id: '1',
      name: 'test.tar.gz',
    });
    await uploadReleaseAssetsForDotSlashFile(
      path.join(tmpDir, 'entry-point'),
      {
        releaseId,
        releaseTag: 'v1000.0.1',
        existingAssetsByName: await getReleaseAssetMap({releaseId}, octokit),
      },
      {
        force: false,
        dryRun: true,
      },
      octokit,
    );

    expect(octokit.repos.deleteReleaseAsset).not.toHaveBeenCalled();
    expect(octokit.repos.uploadReleaseAsset).not.toHaveBeenCalled();
    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });

  test('fails loudly if asset has been renamed by GitHub', async () => {
    octokit.repos.uploadReleaseAsset.mockImplementationOnce(async () => {
      return {
        data: {
          id: '1',
          browser_download_url: `https://github.com/facebook/react-native/releases/download/untagged-0b602d8af97c6d3b784c/test-renamed.tar.gz`,
        },
      };
    });
    await expect(
      uploadReleaseAssetsForDotSlashFile(
        path.join(tmpDir, 'entry-point'),
        {
          releaseId,
          releaseTag: 'v1000.0.1',
          existingAssetsByName: await getReleaseAssetMap({releaseId}, octokit),
        },
        {
          force: false,
          dryRun: false,
        },
        octokit,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();

    expect(octokit.repos.deleteReleaseAsset).not.toHaveBeenCalled();
    expect(octokit.repos.uploadReleaseAsset.mock.calls).toMatchSnapshot(
      'uploadReleaseAsset calls',
    );
    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });

  test('fails loudly if the upstream asset is unreachable', async () => {
    const dotslashContents = await fs.readFile(
      path.join(tmpDir, 'entry-point'),
      'utf8',
    );
    await fs.writeFile(
      path.join(tmpDir, 'entry-point'),
      dotslashContents.replace(serverUrl, `${serverUrl}/error`),
    );
    await expect(
      uploadReleaseAssetsForDotSlashFile(
        path.join(tmpDir, 'entry-point'),
        {
          releaseId,
          releaseTag: 'v1000.0.1',
          existingAssetsByName: await getReleaseAssetMap({releaseId}, octokit),
        },
        {
          force: false,
          dryRun: false,
        },
        octokit,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();

    expect(octokit.repos.deleteReleaseAsset).not.toHaveBeenCalled();
    expect(octokit.repos.uploadReleaseAsset).not.toHaveBeenCalled();
    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });

  test('fails loudly if the upstream asset is corrupt', async () => {
    const dotslashContents = await fs.readFile(
      path.join(tmpDir, 'entry-point'),
      'utf8',
    );
    await fs.writeFile(
      path.join(tmpDir, 'entry-point'),
      dotslashContents.replace('"size": 0', `"size": 1`),
    );
    await expect(
      uploadReleaseAssetsForDotSlashFile(
        path.join(tmpDir, 'entry-point'),
        {
          releaseId,
          releaseTag: 'v1000.0.1',
          existingAssetsByName: await getReleaseAssetMap({releaseId}, octokit),
        },
        {
          force: false,
          dryRun: false,
        },
        octokit,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();

    expect(octokit.repos.deleteReleaseAsset).not.toHaveBeenCalled();
    expect(octokit.repos.uploadReleaseAsset).not.toHaveBeenCalled();
    expect(consoleLog.mock.calls).toMatchSnapshot('console.log calls');
  });
});
