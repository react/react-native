/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {
  generateChangelog,
  _computePreviousVersionFrom,
  _generateChangelog,
  _pushCommit,
  _createPR,
} = require('../generateChangelog');

const silence = () => {};
const mockGetNpmPackageInfo = jest.fn();
const mockExecSync = jest.fn();
const mockRun = jest.fn();
const mockFetch = jest.fn();
const mockExit = jest.fn();

jest.mock('../utils.js', () => ({
  log: silence,
  run: mockRun,
  getNpmPackageInfo: mockGetNpmPackageInfo,
}));

process.exit = mockExit;
global.fetch = mockFetch;

describe('Generate Changelog', () => {
  beforeEach(jest.clearAllMocks);

  describe('_computePreviousVersionFrom', () => {
    it('returns rc.0 when rc is 1', async () => {
      const currentVersion = '0.78.0-rc.1';
      const expectedVersion = '0.78.0-rc.0';

      const receivedVersion = await _computePreviousVersionFrom(currentVersion);

      expect(receivedVersion).toEqual(expectedVersion);
    });

    it('returns previous rc version when rc is > 1', async () => {
      const currentVersion = '0.78.0-rc.5';
      const expectedVersion = '0.78.0-rc.4';

      const receivedVersion = await _computePreviousVersionFrom(currentVersion);

      expect(receivedVersion).toEqual(expectedVersion);
    });

    it('returns previous patch version when rc is 0', async () => {
      const currentVersion = '0.78.0-rc.0';
      const expectedVersion = '0.77.1';

      mockGetNpmPackageInfo.mockReturnValueOnce(
        Promise.resolve({version: '0.77.1'}),
      );

      const receivedVersion = await _computePreviousVersionFrom(currentVersion);

      expect(receivedVersion).toEqual(expectedVersion);
    });

    it('returns patch 0 when patch is 1', async () => {
      const currentVersion = '0.78.1';
      const expectedVersion = '0.78.0';

      const receivedVersion = await _computePreviousVersionFrom(currentVersion);

      expect(receivedVersion).toEqual(expectedVersion);
    });

    it('returns previous patch when patch is > 1', async () => {
      const currentVersion = '0.78.5';
      const expectedVersion = '0.78.4';

      const receivedVersion = await _computePreviousVersionFrom(currentVersion);

      expect(receivedVersion).toEqual(expectedVersion);
    });

    it('returns null when patch is 0', async () => {
      const currentVersion = '0.78.0';

      const receivedVersion = await _computePreviousVersionFrom(currentVersion);

      expect(receivedVersion).toBeNull();
    });

    it("throws an error when the version can't be parsed", async () => {
      const currentVersion = '0.78.0-rc0';

      await expect(
        _computePreviousVersionFrom(currentVersion),
      ).rejects.toThrow();
    });
  });

  describe('_generateChangelog', () => {
    it('calls git in the right order', async () => {
      const currentVersion = '0.79.0-rc5';
      const previousVersion = '0.79.0-rc4';
      const token = 'token';

      expectedCommandArgs = [
        '@rnx-kit/rn-changelog-generator',
        '--base',
        `v${previousVersion}`,
        '--compare',
        `v${currentVersion}`,
        '--repo',
        '.',
        '--changelog',
        './CHANGELOG.md',
        '--token',
        `${token}`,
      ];

      _generateChangelog(previousVersion, currentVersion, token);

      expect(mockRun).toHaveBeenCalledTimes(4);
      expect(mockRun).toHaveBeenNthCalledWith(1, 'git checkout main');
      expect(mockRun).toHaveBeenNthCalledWith(2, 'git fetch');
      expect(mockRun).toHaveBeenNthCalledWith(3, 'git pull origin main');
      expect(mockRun).toHaveBeenNthCalledWith(
        4,
        `npx ${expectedCommandArgs.join(' ')}`,
      );
    });
  });

  describe('_pushCommit', () => {
    it('calls git in the right order', async () => {
      const currentVersion = '0.79.0-rc5';

      _pushCommit(currentVersion);

      expect(mockRun).toHaveBeenCalledTimes(4);
      expect(mockRun).toHaveBeenNthCalledWith(
        1,
        `git checkout -b changelog/v${currentVersion}`,
      );
      expect(mockRun).toHaveBeenNthCalledWith(2, 'git add CHANGELOG.md');
      expect(mockRun).toHaveBeenNthCalledWith(
        3,
        `git commit -m "[RN][Changelog] Add changelog for v${currentVersion}"`,
      );
      expect(mockRun).toHaveBeenNthCalledWith(
        4,
        `git push origin changelog/v${currentVersion}`,
      );
    });
  });

  describe('_createPR', () => {
    it('throws error when status is not 201', async () => {
      const currentVersion = '0.79.0-rc5';
      const token = 'token';

      mockFetch.mockReturnValueOnce(Promise.resolve({status: 401}));

      const headers = {
        Accept: 'Accept: application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      };

      const content = `
## Summary
Add Changelog for ${currentVersion}

## Changelog:
[Internal] - Add Changelog for ${currentVersion}

## Test Plan:
N/A`;

      const body = {
        title: `[RN][Changelog] Add changelog for v${currentVersion}`,
        head: `changelog/v${currentVersion}`,
        base: 'main',
        body: content,
      };

      await expect(_createPR(currentVersion, token)).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/react/react-native/pulls',
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
        },
      );
    });
    it('Returns the pr url', async () => {
      const currentVersion = '0.79.0-rc5';
      const token = 'token';
      const expectedPrURL =
        'https://github.com/react/react-native/pulls/1234';

      const returnedObject = {
        status: 201,
        json: () => Promise.resolve({html_url: expectedPrURL}),
      };
      mockFetch.mockReturnValueOnce(Promise.resolve(returnedObject));

      const headers = {
        Accept: 'Accept: application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      };

      const content = `
## Summary
Add Changelog for ${currentVersion}

## Changelog:
[Internal] - Add Changelog for ${currentVersion}

## Test Plan:
N/A`;

      const body = {
        title: `[RN][Changelog] Add changelog for v${currentVersion}`,
        head: `changelog/v${currentVersion}`,
        base: 'main',
        body: content,
      };

      const receivedPrURL = await _createPR(currentVersion, token);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/react/react-native/pulls',
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
        },
      );
      expect(receivedPrURL).toEqual(expectedPrURL);
    });
  });
});
