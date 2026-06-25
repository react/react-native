/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {createLogger} = require('./utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const {promisify} = require('util');

const pipeline = promisify(stream.pipeline);
const hermesLog = createLogger('Hermes');

/*::
import type {BuildFlavor, Destination, Platform} from './types';
*/

/**
 * Downloads hermes artifacts from the specified version and build type.
 *
 * Version resolution (in order):
 * 1. `HERMES_ENGINE_TARBALL_PATH` env var → use that local file directly
 * 2. `HERMES_VERSION` env var:
 *    - `"latest-v1"` (default) → resolve latest version from npm's `latest-v1` dist-tag
 *    - any semver string → use that exact version from Maven Central
 * The resolved version is downloaded from Maven Central (stable) or from a
 * Maven snapshot repo as fallback.
 */
async function prepareHermesArtifactsAsync(
  reactNativeVersion /*:string*/,
  buildType /*: BuildFlavor */,
) /*: Promise<string> */ {
  hermesLog(`Preparing Hermes...`);

  // See if the user has set the HERMES_ENGINE_TARBALL_PATH environment variable
  let localPath = process.env.HERMES_ENGINE_TARBALL_PATH ?? '';

  // Create artifacts folder
  const artifactsPath /*: string*/ = path.resolve(
    process.cwd(),
    '.build',
    'artifacts',
    'hermes',
  );

  // Ensure that the artifacts folder exists
  fs.mkdirSync(artifactsPath, {recursive: true});

  // Path for keeping track of the current version in the artifacts folder
  const versionFilePath = path.join(artifactsPath, 'version.txt');

  // Only check if the artifacts folder exists if we are not using a local tarball
  if (!localPath) {
    // Resolve the version from the environment variable or use the default version
    let resolvedVersion = process.env.HERMES_VERSION ?? 'latest-v1';

    if (resolvedVersion === 'latest-v1') {
      // TODO: rename 'latest-v1' to 'latest' once V1 is the only Hermes on npm
      hermesLog('Using latest-v1 tarball');
      const hermesVersion = await getLatestHermesVersionFromNPM();
      resolvedVersion = hermesVersion;
    }

    // Check if the Hermes artifacts are already downloaded
    if (
      checkExistingVersion(
        versionFilePath,
        resolvedVersion,
        buildType,
        artifactsPath,
      )
    ) {
      return artifactsPath;
    }

    const sourceType = await hermesSourceType(resolvedVersion, buildType);
    localPath = await resolveSourceFromSourceType(
      sourceType,
      resolvedVersion,
      buildType,
      artifactsPath,
    );
  } else {
    hermesLog('Using local tarball, skipping artifacts folder check');
    // Delete version.txt if it exists
    if (fs.existsSync(versionFilePath)) {
      fs.unlinkSync(versionFilePath);
    }
  }

  // Extract the tar.gz
  execSync(`tar -xzf "${localPath}" -C "${artifactsPath}"`, {
    stdio: 'inherit',
  });

  // Delete the tarball after extraction
  if (!process.env.HERMES_ENGINE_TARBALL_PATH) {
    fs.unlinkSync(localPath);
  }

  return artifactsPath;
}

async function getLatestHermesVersionFromNPM() /*: Promise<string> */ {
  // TODO: rename 'latest-v1' to 'latest' once V1 is the only Hermes on npm
  const npmResponse /*: Response */ = await fetch(
    'https://registry.npmjs.org/hermes-compiler/latest-v1',
  );

  if (!npmResponse.ok) {
    throw new Error(
      `Couldn't get a response from NPM: ${npmResponse.status} ${npmResponse.statusText}`,
    );
  }

  const json = await npmResponse.json();
  const latestVersion = json.version;
  hermesLog(`Using version ${latestVersion}`);
  return latestVersion;
}

/*::
type HermesEngineSourceType =
  | 'local_prebuilt_tarball'
  | 'download_prebuild_tarball'
*/

const HermesEngineSourceTypes /*:{
  readonly DOWNLOAD_PREBUILD_TARBALL: "download_prebuild_tarball",
  readonly LOCAL_PREBUILT_TARBALL: "local_prebuilt_tarball"
} */ = {
  LOCAL_PREBUILT_TARBALL: 'local_prebuilt_tarball',
  DOWNLOAD_PREBUILD_TARBALL: 'download_prebuild_tarball',
};

/**
 * Checks if the Hermes artifacts are already downloaded and up to date with the specified version.
 * Returns true if the artifacts are up to date, false otherwise.
 */
function checkExistingVersion(
  versionFilePath /*: string */,
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string */,
) {
  const resolvedVersion = `${version}-${buildType}`;
  const hermesXCFramework = path.join(
    artifactsPath,
    'destroot',
    'Library',
    'Frameworks',
    'universal',
    'hermesvm.xcframework',
  );

  if (fs.existsSync(versionFilePath) && fs.existsSync(hermesXCFramework)) {
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
    if (versionFileContent.trim() === resolvedVersion) {
      hermesLog(
        `Hermes artifacts already downloaded and up to date: ${artifactsPath}`,
      );
      return true;
    }
  }
  // If the version file does not exist or the version does not match, delete the artifacts folder
  fs.rmSync(artifactsPath, {recursive: true, force: true});
  hermesLog(
    `Hermes artifacts folder already exists, but version does not match. Deleting: ${artifactsPath}`,
  );
  // Lets create the version.txt file
  fs.mkdirSync(artifactsPath, {recursive: true});
  fs.writeFileSync(versionFilePath, resolvedVersion, 'utf8');
  hermesLog(
    `Hermes artifacts folder created: ${artifactsPath} with version: ${resolvedVersion}`,
  );
  return false;
}

function hermesEngineTarballEnvvarDefined() /*: boolean */ {
  return !!process.env.HERMES_ENGINE_TARBALL_PATH;
}

function getTarballUrl(
  version /*: string */,
  buildType /*: BuildFlavor */,
) /*: string */ {
  // You can use the `ENTERPRISE_REPOSITORY` ariable to customise the base url from which artifacts will be downloaded.
  // The mirror's structure must be the same of the Maven repo the react-native core team publishes on Maven Central.
  const mavenRepoUrl =
    process.env.ENTERPRISE_REPOSITORY ?? 'https://repo1.maven.org/maven2';
  const namespace = 'com/facebook/hermes';
  return `${mavenRepoUrl}/${namespace}/hermes-ios/${version}/hermes-ios-${version}-hermes-ios-${buildType.toLowerCase()}.tar.gz`;
}

/**
 * Checks if a Hermes artifact exists at the given URL using fetch instead of curl
 */
async function hermesArtifactExists(
  tarballUrl /*: string */,
) /*: Promise<boolean> */ {
  try {
    const response /*: Response */ = await fetch(tarballUrl, {
      method: 'HEAD',
    });

    return response.status === 200;
  } catch (e) {
    return false;
  }
}

/**
 * Determines the source type for Hermes based on availability
 */
async function hermesSourceType(
  version /*: string */,
  buildType /*: BuildFlavor */,
) /*: Promise<HermesEngineSourceType> */ {
  if (hermesEngineTarballEnvvarDefined()) {
    hermesLog('Using local prebuild tarball');
    return HermesEngineSourceTypes.LOCAL_PREBUILT_TARBALL;
  }

  const tarballUrl = getTarballUrl(version, buildType);
  if (await hermesArtifactExists(tarballUrl)) {
    hermesLog(`Using download prebuild ${buildType} tarball`);
    return HermesEngineSourceTypes.DOWNLOAD_PREBUILD_TARBALL;
  }

  hermesLog(
    `No prebuilt tarball found for version ${version}. Falling back to DOWNLOAD_PREBUILD_TARBALL, which may fail.`,
  );
  return HermesEngineSourceTypes.DOWNLOAD_PREBUILD_TARBALL;
}

async function resolveSourceFromSourceType(
  sourceType /*: HermesEngineSourceType */,
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string*/,
) /*: Promise<string> */ {
  switch (sourceType) {
    case HermesEngineSourceTypes.LOCAL_PREBUILT_TARBALL:
      return localPrebuiltTarball();
    case HermesEngineSourceTypes.DOWNLOAD_PREBUILD_TARBALL:
      return downloadPrebuildTarball(version, buildType, artifactsPath);
    default:
      abort(
        `[Hermes] Unsupported or invalid source type provided: ${sourceType}`,
      );
      return '';
  }
}

function localPrebuiltTarball() /*: string */ {
  const tarballPath = process.env.HERMES_ENGINE_TARBALL_PATH;
  if (tarballPath && fs.existsSync(tarballPath)) {
    hermesLog(
      `Using pre-built binary from local path defined by HERMES_ENGINE_TARBALL_PATH envvar: ${tarballPath}`,
    );
    return tarballPath;
  }
  abort(
    `[Hermes] HERMES_ENGINE_TARBALL_PATH is set, but points to a non-existing file: "${tarballPath ?? 'unknown'}"\nIf you don't want to use tarball, run 'unset HERMES_ENGINE_TARBALL_PATH'`,
  );
  return '';
}

async function downloadPrebuildTarball(
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string*/,
) /*: Promise<string> */ {
  const url = getTarballUrl(version, buildType);
  hermesLog(`Using release tarball from URL: ${url}`);
  return downloadStableHermes(version, buildType, artifactsPath);
}

async function downloadStableHermes(
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string */,
) /*: Promise<string> */ {
  const tarballUrl = getTarballUrl(version, buildType);
  return downloadHermesTarball(tarballUrl, version, buildType, artifactsPath);
}

/**
 * Downloads a Hermes tarball using fetch instead of curl
 */
async function downloadHermesTarball(
  tarballUrl /*: string */,
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string */,
) /*: Promise<string> */ {
  const destPath = buildType
    ? `${artifactsPath}/hermes-ios-${version}-${buildType}.tar.gz`
    : `${artifactsPath}/hermes-ios-${version}.tar.gz`;

  if (!fs.existsSync(destPath)) {
    const tmpFile = `${artifactsPath}/hermes-ios.download`;
    try {
      fs.mkdirSync(artifactsPath, {recursive: true});
      hermesLog(`Downloading Hermes tarball from ${tarballUrl}`);

      const response /*: Response */ = await fetch(tarballUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download: ${response.status} ${response.statusText}`,
        );
      }

      // Create a write stream to the temporary file
      const fileStream = fs.createWriteStream(tmpFile);

      // Use Node.js stream pipeline to safely pipe the response body to the file
      if (response.body) {
        await pipeline(response.body, fileStream);
      } else {
        // For older fetch implementations that don't support response.body as a stream
        const buffer = await response.arrayBuffer();

        fs.writeFileSync(tmpFile, Buffer.from(buffer));
      }

      // Move the temporary file to the destination path
      fs.renameSync(tmpFile, destPath);
    } catch (e) {
      // Clean up the temporary file if it exists
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
      abort(
        `Failed to download Hermes tarball from ${tarballUrl}: ${e.message}`,
      );
    }
  }
  return destPath;
}

function abort(message /*: string */) {
  hermesLog(message, 'error');
  throw new Error(message);
}

module.exports = {
  prepareHermesArtifactsAsync,
};
