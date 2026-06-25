/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {log, getNpmPackageInfo, run} = require('./utils');

async function _computePreviousVersionFrom(version) {
  log(`Computing previous version from: ${version}`);
  const regex = /^0\.(\d+)\.(\d+)(-rc\.(\d+))?$/;
  const match = version.match(regex);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  const minor = match[1];
  const patch = match[2];
  const rc = match[4];

  if (rc) {
    if (Number(rc) > 0) {
      return `0.${minor}.${patch}-rc.${Number(rc) - 1}`;
    }
    //fetch latest version on NPM
    const latestPkg = await getNpmPackageInfo('react-native', 'latest');
    return latestPkg.version;
  } else {
    if (Number(patch) === 0) {
      // No need to generate the changelog for 0.X.0 as we already generated it from RCs
      log(
        `Skipping changelog generation for ${version} as we already have it from the RCs`,
      );
      return null;
    }
    return `0.${minor}.${Number(patch) - 1}`;
  }
}

function _generateChangelog(previousVersion, version, token) {
  log(`Generating changelog for ${version} from ${previousVersion}`);
  run('git checkout main');
  run('git fetch');
  run('git pull origin main');
  const generateChangelogCommand = `npx @rnx-kit/rn-changelog-generator --base v${previousVersion} --compare v${version} --repo . --changelog ./CHANGELOG.md --token ${token}`;
  run(generateChangelogCommand);
}

function _pushCommit(version) {
  log(`Pushing commit to changelog/v${version}`);
  run(`git checkout -b changelog/v${version}`);
  run('git add CHANGELOG.md');
  run(`git commit -m "[RN][Changelog] Add changelog for v${version}"`);
  run(`git push origin changelog/v${version}`);
}

async function _createPR(version, token) {
  log('Creating changelog pr');
  const url = 'https://api.github.com/repos/facebook/react-native/pulls';
  const body = `
## Summary
Add Changelog for ${version}

## Changelog:
[Internal] - Add Changelog for ${version}

## Test Plan:
N/A`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'Accept: application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `[RN][Changelog] Add changelog for v${version}`,
      head: `changelog/v${version}`,
      base: 'main',
      body: body,
    }),
  });

  if (response.status !== 201) {
    throw new Error(
      `Failed to create PR: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.html_url;
}

async function generateChangelog(version, token) {
  if (version.startsWith('v')) {
    version = version.substring(1);
  }

  const previousVersion = await _computePreviousVersionFrom(version);
  if (previousVersion) {
    log(`Previous version is ${previousVersion}`);
    _generateChangelog(previousVersion, version, token);
    _pushCommit(version);
    const prURL = await _createPR(version, token);
    log(`Created PR: ${prURL}`);
  }
}

module.exports = {
  generateChangelog,
  // Exported only for testing purposes:
  _computePreviousVersionFrom,
  _generateChangelog,
  _pushCommit,
  _createPR,
};
