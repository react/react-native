/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const VERSION_REGEX = /^v?((\d+)\.(\d+)\.(\d+)(?:-(.+))?)$/;

/*::
export type BuildType = 'dry-run' | 'release' | 'nightly';
export type Version = {
    version: string,
    major: string,
    minor: string,
    patch: string,
    prerelease: ?string,
}
*/
/**
 * Parses a version string and performs some checks to verify its validity.
 * A valid version is in the format vX.Y.Z[-KKK] where X, Y, Z are numbers and KKK can be something else.
 * The `builtType` is used to enforce that the major version can assume only specific
 * values.
 *
 * Some examples of valid versions are:
 * - stable: 0.68.1
 * - prerelease: 0.Y.Z-rc.K
 * - e2e-test: X.Y.Z-20221116-2018
 * - nightly: X.Y.Z-20221116-0bc4547fc
 * - dryrun: 1000.0.0
 */
function parseVersion(
  versionStr /*: string */,
  buildType /*: ?BuildType */,
) /*: Version */ {
  const match = extractMatchIfValid(versionStr);
  const [, version, major, minor, patch, prerelease] = match;

  const parsedVersion /*: Version */ = {
    version,
    major,
    minor,
    patch,
    prerelease,
  };

  if (buildType != null) {
    if (!validateBuildType(buildType)) {
      throw new Error(`Unsupported build type: ${buildType}`);
    }
    validateVersion(parsedVersion, buildType);
  }

  return parsedVersion;
}

function validateBuildType(
  buildType /*: string */,
) /*: buildType is BuildType */ {
  const validBuildTypes = new Set(['release', 'dry-run', 'nightly']);

  // $FlowFixMe[incompatible-type-guard]
  return validBuildTypes.has(buildType);
}

function extractMatchIfValid(versionStr /*: string */) {
  const match = versionStr.match(VERSION_REGEX);
  if (!match) {
    throw new Error(
      `You must pass a correctly formatted version; couldn't parse ${versionStr}`,
    );
  }
  return match;
}

function validateVersion(
  versionObject /*: Version */,
  buildType /*: BuildType */,
) {
  const map = {
    release: validateRelease,
    'dry-run': validateDryRun,
    nightly: validateNightly,
  };

  const validationFunction = map[buildType];
  validationFunction(versionObject);
}

/**
 * Releases are in the form of 0.Y.Z[-RC.0]
 */
function validateRelease(version /*: Version */) {
  const validRelease = isStableRelease(version) || isStablePrerelease(version);
  if (!validRelease) {
    throw new Error(`Version ${version.version} is not valid for Release`);
  }
}

function validateDryRun(version /*: Version */) {
  if (
    !isMain(version) &&
    !isNightly(version) &&
    !isStableRelease(version) &&
    !isStablePrerelease(version)
  ) {
    throw new Error(`Version ${version.version} is not valid for dry-runs`);
  }
}

function validateNightly(version /*: Version */) {
  // a valid nightly is a prerelease
  if (!isNightly(version)) {
    throw new Error(`Version ${version.version} is not valid for nightlies`);
  }
}

function isStableRelease(version /*: Version */) /*: boolean */ {
  return (
    version.major === '0' &&
    !!version.minor.match(/^\d+$/) &&
    !!version.patch.match(/^\d+$/) &&
    version.prerelease == null
  );
}

function isStablePrerelease(version /*: Version */) /*: boolean */ {
  return !!(
    version.major === '0' &&
    version.minor.match(/^\d+$/) &&
    version.patch.match(/^\d+$/) &&
    (version.prerelease?.startsWith('rc.') ||
      version.prerelease?.startsWith('rc-') ||
      version.prerelease?.match(/^(\d{8})-(\d{4})$/))
  );
}

function isNightly(version /*: Version */) /*: boolean */ {
  // Check if older nightly version
  if (version.major === '0' && version.minor === '0' && version.patch === '0') {
    return true;
  }

  return version.version.includes('nightly');
}

function isMain(version /*: Version */) /*: boolean */ {
  return (
    version.major === '1000' && version.minor === '0' && version.patch === '0'
  );
}

function isReleaseBranch(branch /*:string */) /*: boolean */ {
  return branch.endsWith('-stable');
}

module.exports = {
  validateBuildType,
  parseVersion,
  isNightly,
  isReleaseBranch,
  isMain,
  isStableRelease,
  isStablePrerelease,
};
