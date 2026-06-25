/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {log, run} = require('./utils');
const fs = require('fs');

function _headers(token) {
  return {
    Accept: 'Accept: application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `Bearer ${token}`,
  };
}

function _extractChangelog(version) {
  if (version.endsWith('.0')) {
    // for RC.0 and for the release of a new stable minor, the changelog is too long
    // to be added in a release. The release body is usually something shorter.
    // See for example the release for 0.76.0 or 0.77.0:
    // 0.76: https://github.com/facebook/react-native/releases/tag/v0.76.0
    // 0.77: https://github.com/facebook/react-native/releases/tag/v0.77.0
    return '';
  }
  const changelog = String(fs.readFileSync('CHANGELOG.md', 'utf8')).split('\n');
  const changelogStarts = changelog.indexOf(`## v${version}`);
  let changelogEnds = changelogStarts;
  // Scan the changelog to find the next version
  for (var line = changelogStarts + 1; line < changelog.length; line++) {
    if (changelog[line].startsWith('## ')) {
      changelogEnds = line;
      break;
    }
  }
  return changelog.slice(changelogStarts, changelogEnds).join('\n').trim();
}

function _readHermesVersionFromProperties() {
  const propertiesPath =
    'packages/react-native/sdks/hermes-engine/version.properties';
  const content = String(fs.readFileSync(propertiesPath, 'utf8'));
  const match = content.match(/^HERMES_VERSION_NAME=(.+)$/m);
  if (!match) {
    throw new Error(`HERMES_VERSION_NAME not found in ${propertiesPath}`);
  }
  return match[1].trim();
}

function _computeBody(changelog, version, hermesVersion) {
  // The workflow input is optional and arrives as an empty string when unset,
  // so treat both missing and empty as "fall back to version.properties".
  // Falling back to ${version} would produce 404 dSYMS URLs since Hermes V1
  // versions (e.g. 250829098.0.13) don't track RN versions.
  if (hermesVersion == null || hermesVersion === '') {
    hermesVersion = _readHermesVersionFromProperties();
  }
  return `${changelog}

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

View the whole changelog in the [CHANGELOG.md file](https://github.com/facebook/react-native/blob/main/CHANGELOG.md).`;
}

async function _verifyTagExists(version) {
  const url = `https://github.com/facebook/react-native/releases/tag/v${version}`;

  const response = await fetch(url);
  if (response.status === 404) {
    throw new Error(`Tag v${version} does not exist`);
  }
}

async function _createDraftReleaseOnGitHub(version, body, latest, token) {
  const url = 'https://api.github.com/repos/facebook/react-native/releases';
  const method = 'POST';
  const headers = _headers(token);
  const fetchBody = JSON.stringify({
    tag_name: `v${version}`,
    name: `${version}`,
    body: body,
    draft: true, // NEVER CHANGE this value to false. If false, it will publish the release, and send a GH notification to all the subscribers.
    prerelease: version.includes('-rc.') ? true : false,
    make_latest: `${latest}`,
  });

  const response = await fetch(url, {
    method,
    headers,
    body: fetchBody,
  });

  if (response.status !== 201) {
    throw new Error(
      `Failed to create the release: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const {html_url, id} = data;
  return {
    html_url,
    id,
  };
}

function moveToChangelogBranch(version) {
  log(`Moving to changelog branch: changelog/v${version}`);
  run(`git checkout -b changelog/v${version}`);
}

async function createDraftRelease(version, latest, token, hermesVersion) {
  if (version.startsWith('v')) {
    version = version.substring(1);
  }

  _verifyTagExists(version);
  moveToChangelogBranch(version);
  const changelog = _extractChangelog(version);
  const body = _computeBody(changelog, version, hermesVersion);
  const release = await _createDraftReleaseOnGitHub(
    version,
    body,
    latest,
    token,
  );
  log(`Created draft release: ${release.html_url}, ID ${release.id}`);
  return release;
}

module.exports = {
  createDraftRelease,
  // Exported for testing purposes
  _verifyTagExists,
  _extractChangelog,
  _computeBody,
  _createDraftReleaseOnGitHub,
  _readHermesVersionFromProperties,
};
