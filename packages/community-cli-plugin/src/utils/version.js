/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Config} from '@react-native-community/cli-types';
import type {TerminalReporter} from 'metro';

import semver from 'semver';
import {styleText} from 'util';

const debug = require('debug')('ReactNative:CommunityCliPlugin');

type Release = {
  // The current stable release
  stable: string,
  // The current candidate release. These are only populated if the latest release is a candidate release.
  candidate?: string,
  changelogUrl: string,
  diffUrl: string,
};

interface DiffPurge {
  name: string;
  zipball_url: string;
  tarball_url: string;
  commit: {
    sha: string,
    url: string,
  };
  node_id: string;
}

type LatestVersions = {
  candidate?: string,
  stable: string,
};

type Headers = {
  'User-Agent': string,
  [header: string]: string,
};

/**
 * Logs out a message if the user's version is behind a stable version of React Native
 */
export async function logIfUpdateAvailable(
  cliConfig: Config,
  reporter: TerminalReporter,
): Promise<void> {
  const {reactNativeVersion: currentVersion} = cliConfig;
  let newVersion = null;

  try {
    const upgrade = await getLatestRelease(currentVersion);

    if (upgrade) {
      newVersion = upgrade;
    }
  } catch (e) {
    // We let the flow continue as this component is not vital for the rest of
    // the CLI.
    debug(
      'Cannot detect current version of React Native, ' +
        'skipping check for a newer release',
    );
    debug(e);
  }

  if (newVersion == null) {
    return;
  }

  if (semver.gt(newVersion.stable, currentVersion)) {
    reporter.update({
      type: 'unstable_server_log',
      level: 'info',
      data: `React Native v${newVersion.stable} is now available (your project is running on v${currentVersion}).
Changelog: ${styleText(['dim', 'underline'], newVersion?.changelogUrl ?? 'none')}
Diff: ${styleText(['dim', 'underline'], newVersion?.diffUrl ?? 'none')}
`,
    });
  }
}

// $FlowFixMe[incompatible-type-guard]
function isDiffPurgeEntry(data: Partial<DiffPurge>): data is DiffPurge {
  return (
    // $FlowFixMe[incompatible-type-guard]
    [data.name, data.zipball_url, data.tarball_url, data.node_id].filter(
      e => typeof e !== 'undefined',
    ).length === 0
  );
}

/**
 * Checks via GitHub API if there is a newer stable React Native release and,
 * if it exists, returns the release data.
 *
 * If the latest release is not newer or if it's a prerelease, the function
 * will return undefined.
 */
export default async function getLatestRelease(
  currentVersion: string,
): Promise<Release | void> {
  debug('Checking for a newer version of React Native');
  try {
    debug(`Current version: ${currentVersion}`);

    // if the version is a nightly/canary build, we want to bail
    // since they are nightlies or unreleased versions
    if (['-canary', '-nightly'].some(s => currentVersion.includes(s))) {
      return;
    }

    debug('Checking for newer releases on GitHub');
    const latestVersion = await getLatestRnDiffPurgeVersion();
    if (latestVersion == null) {
      debug('Failed to get latest release');
      return;
    }
    const {stable, candidate} = latestVersion;
    debug(`Latest release: ${stable} (${candidate ?? ''})`);

    if (semver.compare(stable, currentVersion) >= 0) {
      return {
        stable,
        candidate,
        changelogUrl: buildChangelogUrl(stable),
        diffUrl: buildDiffUrl(currentVersion, stable),
      };
    }
  } catch (e) {
    debug('Something went wrong with remote version checking, moving on');
    debug(e);
  }
}

function buildChangelogUrl(version: string) {
  return `https://github.com/facebook/react-native/releases/tag/v${version}`;
}

function buildDiffUrl(oldVersion: string, newVersion: string) {
  return `https://react-native-community.github.io/upgrade-helper/?from=${oldVersion}&to=${newVersion}`;
}

/**
 * Returns the most recent React Native version available to upgrade to.
 */
async function getLatestRnDiffPurgeVersion(): Promise<LatestVersions | void> {
  const options: RequestOptions = {
    // https://developer.github.com/v3/#user-agent-required
    headers: {'User-Agent': '@react-native/community-cli-plugin'} as Headers,
  };

  const resp = await fetch(
    'https://api.github.com/repos/react-native-community/rn-diff-purge/tags',
    options,
  );

  const result: LatestVersions = {stable: '0.0.0'};

  if (resp.status !== 200) {
    return;
  }

  const body: DiffPurge[] = (await resp.json()).filter(isDiffPurgeEntry);
  for (const {name: version} of body) {
    if (result.candidate != null && version.includes('-rc')) {
      result.candidate = version.substring(8);
      continue;
    }
    if (!version.includes('-rc')) {
      result.stable = version.substring(8);
      return result;
    }
  }
  return result;
}
