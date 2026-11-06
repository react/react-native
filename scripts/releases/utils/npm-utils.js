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
  exitIfNotOnGit,
  getCurrentCommit,
  isTaggedLatest,
} = require('./scm-utils');
const {parseVersion} = require('./version-utils');
const {exec} = require('shelljs');

/*::
import type { ExecOptsSync, ShellString } from 'shelljs';

type BuildType = 'dry-run' | 'release' | 'nightly';
type NpmInfo = {
  version: string,
  tag: ?string,
}
type PackageJSON = {
  name: string,
  version: string,
  dependencies: {[key: string]: string},
  devDependencies: {[key: string]: string},
  ...
}
type NpmPackageOptions = {
  tags: ?Array<string> | ?Array<?string>,
  access?: ?('public' | 'restricted')
}
*/

// Get `next` version from npm and +1 on the minor for `main` version
function getMainVersion() {
  const versionStr = getPackageVersionStrByTag('react-native', 'next');
  const {major, minor} = parseVersion(versionStr, 'release');
  return `${major}.${parseInt(minor, 10) + 1}.0`;
}

function getNpmInfo(buildType /*: BuildType */) /*: NpmInfo */ {
  const currentCommit = getCurrentCommit();
  const shortCommit = currentCommit.slice(0, 9);

  if (buildType === 'dry-run') {
    return {
      version: `1000.0.0-${shortCommit}`,
      tag: null, // We never end up publishing this
    };
  }

  if (buildType === 'nightly') {
    const mainVersion = getMainVersion();
    const dateIdentifier = new Date()
      .toISOString()
      .slice(0, -14)
      .replace(/[-]/g, '');
    return {
      version: `${mainVersion}-nightly-${dateIdentifier}-${shortCommit}`,
      tag: 'nightly',
    };
  }

  if (buildType === 'release') {
    let versionTag /*: string*/ = '';
    if (
      process.env.GITHUB_REF != null &&
      process.env.GITHUB_REF.includes('/tags/') &&
      process.env.GITHUB_REF_NAME != null &&
      process.env.GITHUB_REF_NAME !== ''
    ) {
      // GITHUB_REF contains the fully qualified ref, for example refs/tags/v0.75.0-rc.0
      // GITHUB_REF_NAME contains the short name, for example v0.75.0-rc.0
      versionTag = process.env.GITHUB_REF_NAME;
    }

    if (versionTag === '') {
      throw new Error(
        'No version tag found in CI. It looks like this script is running in release mode, but the GITHUB_REF_NAME are missing.',
      );
    }

    const {version, major, minor, patch, prerelease} = parseVersion(
      versionTag,
      buildType,
    );

    // See if releaser indicated that this version should be tagged "latest"
    // Set in `trigger-react-native-release`
    const isLatest = exitIfNotOnGit(
      () => isTaggedLatest(currentCommit),
      'Not in git. We do not want to publish anything',
    );

    const releaseBranchTag = `${major}.${minor}-stable`;
    let tag = releaseBranchTag;
    // npm will automatically tag the version as `latest` if no tag is set when we publish
    // To prevent this, use `releaseBranchTag` when we don't want that (ex. releasing a patch on older release)
    if (prerelease != null) {
      if (patch === '0') {
        // Set `next` tag only on prereleases of 0.m.0-RC.k.
        tag = 'next';
      } else {
        tag = '--no-tag';
      }
    } else if (isLatest === true) {
      tag = 'latest';
    }

    return {
      version,
      tag,
    };
  }

  throw new Error(`Unsupported build type: ${buildType}`);
}

function publishPackage(
  packagePath /*: string */,
  packageOptions /*: NpmPackageOptions */,
  execOptions /*: ?ExecOptsSync */,
) /*: ShellString */ {
  const {tags, access} = packageOptions;

  let tagsFlag = '';
  if (tags != null) {
    tagsFlag = tags.includes('--no-tag')
      ? ' --no-tag'
      : tags
          .filter(Boolean)
          .map(t => ` --tag ${t}`)
          .join('');
  }

  const accessFlag = access != null ? ` --access ${access}` : '';
  const options /*: ExecOptsSync */ = execOptions
    ? {...execOptions, cwd: packagePath}
    : {cwd: packagePath};

  return exec(`npm publish${tagsFlag}${accessFlag}`, options);
}

/**
 * `packageName`: name of npm package
 * `tag`: npm tag like `latest` or `next`
 *
 * This will fetch version of `packageName` with npm tag specified
 */
function getPackageVersionStrByTag(
  packageName /*: string */,
  tag /*: ?string */,
) /*: string */ {
  const npmString =
    tag != null
      ? `npm view ${packageName}@${tag} version`
      : `npm view ${packageName} version`;
  const result = exec(npmString, {silent: true});

  if (result.code) {
    throw new Error(`Failed to run '${npmString}'\n${result.stderr}`);
  }
  return result.stdout.trim();
}

module.exports = {
  getNpmInfo,
  publishPackage,
  getPackageVersionStrByTag,
};
