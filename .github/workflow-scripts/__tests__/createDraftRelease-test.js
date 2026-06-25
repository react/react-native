/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {
  _verifyTagExists,
  _extractChangelog,
  _computeBody,
  _createDraftReleaseOnGitHub,
} = require('../createDraftRelease');

const fs = require('fs');

const silence = () => {};
const mockFetch = jest.fn();

jest.mock('../utils.js', () => ({
  log: silence,
}));

global.fetch = mockFetch;

describe('Create Draft Release', () => {
  beforeEach(jest.clearAllMocks);

  describe('#_verifyTagExists', () => {
    it('throws if the tag does not exists', async () => {
      const token = 'token';
      mockFetch.mockReturnValueOnce(Promise.resolve({status: 404}));

      await expect(_verifyTagExists('0.77.1')).rejects.toThrowError(
        `Tag v0.77.1 does not exist`,
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://github.com/facebook/react-native/releases/tag/v0.77.1',
      );
    });
  });

  describe('#_extractChangelog', () => {
    it(`extracts changelog from CHANGELOG.md`, async () => {
      const mockedReturnValue = `# Changelog

## v0.77.2

- [PR #1234](https://github.com/facebook/react-native/pull/1234) - Some change
- [PR #5678](https://github.com/facebook/react-native/pull/5678) - Some other change


## v0.77.1
### Breaking Changes
- [PR #9012](https://github.com/facebook/react-native/pull/9012) - Some other change

#### Android
- [PR #3456](https://github.com/facebook/react-native/pull/3456) - Some other change
- [PR #3457](https://github.com/facebook/react-native/pull/3457) - Some other change

#### iOS
- [PR #3436](https://github.com/facebook/react-native/pull/3436) - Some other change
- [PR #3437](https://github.com/facebook/react-native/pull/3437) - Some other change

### Fixed
- [PR #9012](https://github.com/facebook/react-native/pull/9012) - Some other change

#### Android
- [PR #3456](https://github.com/facebook/react-native/pull/3456) - Some other change

#### iOS
- [PR #3437](https://github.com/facebook/react-native/pull/3437) - Some other change


## v0.77.0

- [PR #3456](https://github.com/facebook/react-native/pull/3456) - Some other change

## v0.76.0

- [PR #7890](https://github.com/facebook/react-native/pull/7890) - Some other change`;

      jest.spyOn(fs, 'readFileSync').mockImplementationOnce(func => {
        return mockedReturnValue;
      });
      const changelog = _extractChangelog('0.77.1');
      expect(changelog).toEqual(`## v0.77.1
### Breaking Changes
- [PR #9012](https://github.com/facebook/react-native/pull/9012) - Some other change

#### Android
- [PR #3456](https://github.com/facebook/react-native/pull/3456) - Some other change
- [PR #3457](https://github.com/facebook/react-native/pull/3457) - Some other change

#### iOS
- [PR #3436](https://github.com/facebook/react-native/pull/3436) - Some other change
- [PR #3437](https://github.com/facebook/react-native/pull/3437) - Some other change

### Fixed
- [PR #9012](https://github.com/facebook/react-native/pull/9012) - Some other change

#### Android
- [PR #3456](https://github.com/facebook/react-native/pull/3456) - Some other change

#### iOS
- [PR #3437](https://github.com/facebook/react-native/pull/3437) - Some other change`);
    });

    it('does not extract changelog for rc.0', async () => {
      const changelog = _extractChangelog('0.77.0-rc.0');
      expect(changelog).toEqual('');
    });

    it('does not extract changelog for 0.X.0', async () => {
      const changelog = _extractChangelog('0.77.0');
      expect(changelog).toEqual('');
    });
  });

  describe('#_computeBody', () => {
    it('falls back to HERMES_VERSION_NAME from version.properties when no hermes version is passed', async () => {
      const version = '0.77.1';
      const hermesVersion = '250829098.0.13';
      jest.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
        return `HERMES_VERSION_NAME=${hermesVersion}\n`;
      });
      const changelog = `## v${version}
### Breaking Changes
- [PR #9012](https://github.com/facebook/react-native/pull/9012) - Some other change

#### Android
- [PR #3456](https://github.com/facebook/react-native/pull/3456) - Some other change
- [PR #3457](https://github.com/facebook/react-native/pull/3457) - Some other change

#### iOS
- [PR #3436](https://github.com/facebook/react-native/pull/3436) - Some other change
- [PR #3437](https://github.com/facebook/react-native/pull/3437) - Some other change`;
      const body = _computeBody(changelog, version);

      expect(body).toEqual(`${changelog}

---

Hermes V1 dSYMS:
- [Debug](https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${hermesVersion}/hermes-ios-${hermesVersion}-hermes-framework-dSYM-debug.tar.gz)
- [Release](https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${hermesVersion}/hermes-ios-${hermesVersion}-hermes-framework-dSYM-release.tar.gz)

ReactNativeDependencies dSYMs:
- [Debug](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-dependencies-dSYM-debug.tar.gz)
- [Release](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-dependencies-dSYM-release.tar.gz)

ReactNative Core dSYMs:
- [Debug](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-core-debug.tar.gz)
- [Release](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-core-release.tar.gz)

---

You can file issues or pick requests against this release [here](https://github.com/reactwg/react-native-releases/issues/new/choose).

---

To help you upgrade to this version, you can use the [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) ⚛️.

---

View the whole changelog in the [CHANGELOG.md file](https://github.com/facebook/react-native/blob/main/CHANGELOG.md).`);
    });

    it('computes body for release when hermes versions are passed', async () => {
      const version = '0.77.1';
      const hermesVersion = '0.15.0';
      const changelog = `## v${version}
### Breaking Changes
- [PR #9012](https://github.com/facebook/react-native/pull/9012) - Some other change

#### Android
- [PR #3456](https://github.com/facebook/react-native/pull/3456) - Some other change
- [PR #3457](https://github.com/facebook/react-native/pull/3457) - Some other change

#### iOS
- [PR #3436](https://github.com/facebook/react-native/pull/3436) - Some other change
- [PR #3437](https://github.com/facebook/react-native/pull/3437) - Some other change`;
      const body = _computeBody(changelog, version, hermesVersion);

      expect(body).toEqual(`${changelog}

---

Hermes V1 dSYMS:
- [Debug](https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${hermesVersion}/hermes-ios-${hermesVersion}-hermes-framework-dSYM-debug.tar.gz)
- [Release](https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${hermesVersion}/hermes-ios-${hermesVersion}-hermes-framework-dSYM-release.tar.gz)

ReactNativeDependencies dSYMs:
- [Debug](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-dependencies-dSYM-debug.tar.gz)
- [Release](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-dependencies-dSYM-release.tar.gz)

ReactNative Core dSYMs:
- [Debug](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-core-debug.tar.gz)
- [Release](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-core-release.tar.gz)

---

You can file issues or pick requests against this release [here](https://github.com/reactwg/react-native-releases/issues/new/choose).

---

To help you upgrade to this version, you can use the [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) ⚛️.

---

View the whole changelog in the [CHANGELOG.md file](https://github.com/facebook/react-native/blob/main/CHANGELOG.md).`);
    });
  });

  describe('#_createDraftReleaseOnGitHub', () => {
    it('creates a draft release on GitHub', async () => {
      const version = '0.77.1';
      const url = 'https://api.github.com/repos/facebook/react-native/releases';
      const token = 'token';
      const headers = {
        Accept: 'Accept: application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      };
      const body = `Draft release body`;
      const latest = true;
      const fetchBody = JSON.stringify({
        tag_name: `v${version}`,
        name: `${version}`,
        body: body,
        draft: true,
        prerelease: false,
        make_latest: `${latest}`,
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          status: 201,
          json: () =>
            Promise.resolve({
              id: 1,
              html_url:
                'https://github.com/facebook/react-native/releases/tag/v0.77.1',
            }),
        }),
      );
      const response = await _createDraftReleaseOnGitHub(
        version,
        body,
        latest,
        token,
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/facebook/react-native/releases`,
        {
          method: 'POST',
          headers: headers,
          body: fetchBody,
        },
      );
      expect(response).toEqual({
        id: 1,
        html_url:
          'https://github.com/facebook/react-native/releases/tag/v0.77.1',
      });
    });

    it('creates a draft release for prerelease on GitHub', async () => {
      const version = '0.77.0-rc.2';
      const url = 'https://api.github.com/repos/facebook/react-native/releases';
      const token = 'token';
      const headers = {
        Accept: 'Accept: application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      };
      const body = `Draft release body`;
      const latest = true;
      const fetchBody = JSON.stringify({
        tag_name: `v${version}`,
        name: `${version}`,
        body: body,
        draft: true,
        prerelease: true,
        make_latest: `${latest}`,
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          status: 201,
          json: () =>
            Promise.resolve({
              id: 1,
              html_url:
                'https://github.com/facebook/react-native/releases/tag/v0.77.1',
            }),
        }),
      );
      const response = await _createDraftReleaseOnGitHub(
        version,
        body,
        latest,
        token,
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/facebook/react-native/releases`,
        {
          method: 'POST',
          headers: headers,
          body: fetchBody,
        },
      );
      expect(response).toEqual({
        id: 1,
        html_url:
          'https://github.com/facebook/react-native/releases/tag/v0.77.1',
      });
    });

    it('throws if the post failes', async () => {
      const version = '0.77.0-rc.2';
      const url = 'https://api.github.com/repos/facebook/react-native/releases';
      const token = 'token';
      const headers = {
        Accept: 'Accept: application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      };
      const body = `Draft release body`;
      const latest = true;
      const fetchBody = JSON.stringify({
        tag_name: `v${version}`,
        name: `${version}`,
        body: body,
        draft: true,
        prerelease: true,
        make_latest: `${latest}`,
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          status: 401,
        }),
      );
      await expect(
        _createDraftReleaseOnGitHub(version, body, latest, token),
      ).rejects.toThrowError();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/facebook/react-native/releases`,
        {
          method: 'POST',
          headers: headers,
          body: fetchBody,
        },
      );
    });
  });
});
