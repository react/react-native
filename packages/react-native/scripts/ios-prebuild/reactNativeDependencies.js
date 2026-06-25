/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*:: import type {BuildFlavor} from './types'; */

const {computeNightlyTarballURL, createLogger} = require('./utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const {promisify} = require('util');

const pipeline = promisify(stream.pipeline);

const dependencyLog = createLogger('ReactNativeDependencies');

/**
 * Downloads ReactNativeDependencies artifacts from the specified version and build type. If you want to specify a specific
 * version of ReactNativeDependencies, use the RN_DEP_VERSION environment variable. The path to the artifacts will be inside
 * the packages/react-native/third-party folder.
 */
async function prepareReactNativeDependenciesArtifactsAsync(
  version /*:string*/,
  buildType /*: BuildFlavor */,
) /*: Promise<string> */ {
  dependencyLog(`Preparing ReactNativeDependencies...`);

  // Create artifacts folder
  const artifactsPath /*: string*/ = path.resolve(process.cwd(), 'third-party');

  // Ensure that the artifacts folder exists
  fs.mkdirSync(artifactsPath, {recursive: true});

  // Path for keeping track of the current version in the artifacts folder
  const versionFilePath = path.join(artifactsPath, 'version.txt');

  // Resolve the version from the environment variable or use the default version
  let resolvedVersion = process.env.RN_DEP_VERSION ?? version;

  if (resolvedVersion === 'nightly') {
    dependencyLog('Using latest nightly tarball');
    const rnVersion = await getNightlyVersionFromNPM();
    resolvedVersion = rnVersion;
  }

  // Check if the ReactNativeDependencies artifacts are already downloaded
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

  const sourceType = await reactNativeDependenciesSourceType(
    resolvedVersion,
    buildType,
  );
  const localPath = await resolveSourceFromSourceType(
    sourceType,
    resolvedVersion,
    buildType,
    artifactsPath,
  );

  // Extract the tar.gz
  const tmpPath = '/tmp/react-native-dependencies';
  fs.mkdirSync(tmpPath, {recursive: true});
  execSync(`tar -xzf "${localPath}" -C "${tmpPath}"`, {
    stdio: 'inherit',
  });

  const xcframeworkSource = path.join(
    tmpPath,
    'packages',
    'react-native',
    'third-party',
    'ReactNativeDependencies.xcframework',
  );
  // Copy the extracted files to the artifacts folder
  execSync(`cp -R "${xcframeworkSource}" "${artifactsPath}"`, {
    stdio: 'inherit',
  });

  // Delete the tarball after extraction
  if (!process.env.HERMES_ENGINE_TARBALL_PATH) {
    fs.unlinkSync(localPath);
  }

  return artifactsPath;
}

async function getNightlyVersionFromNPM() /*: Promise<string> */ {
  const npmResponse /*: Response */ = await fetch(
    'https://registry.npmjs.org/react-native/nightly',
  );

  if (!npmResponse.ok) {
    throw new Error(
      `Couldn't get an answer from NPM: ${npmResponse.status} ${npmResponse.statusText}`,
    );
  }

  const json = await npmResponse.json();
  const latestNightly = json.version;
  dependencyLog(`Using version ${latestNightly}`);
  return latestNightly;
}

/*::
type ReactNativeDependenciesEngineSourceType =
  | 'download_prebuild_tarball'
  | 'download_prebuilt_nightly_tarball'
*/

const ReactNativeDependenciesEngineSourceTypes /*: {
  readonly DOWNLOAD_PREBUILD_TARBALL: "download_prebuild_tarball",
  readonly DOWNLOAD_PREBUILT_NIGHTLY_TARBALL: "download_prebuilt_nightly_tarball"
} */ = {
  DOWNLOAD_PREBUILD_TARBALL: 'download_prebuild_tarball',
  DOWNLOAD_PREBUILT_NIGHTLY_TARBALL: 'download_prebuilt_nightly_tarball',
};

/**
 * Checks if the ReactNativeDependencies artifacts are already downloaded and up to date with the specified version.
 * Returns true if the artifacts are up to date, false otherwise.
 */
function checkExistingVersion(
  versionFilePath /*: string */,
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string */,
) {
  const resolvedVersion = `${version}-${buildType}`;
  const rndepXCFramework = path.join(
    artifactsPath,
    'ReactNativeDependencies.xcframework',
  );

  if (fs.existsSync(rndepXCFramework)) {
    if (fs.existsSync(versionFilePath)) {
      const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
      dependencyLog(`Version found on disk: ${versionFileContent}`);
      if (versionFileContent.trim() === resolvedVersion) {
        dependencyLog(
          `ReactNativeDependencies artifacts already downloaded and up to date: ${artifactsPath}`,
        );
        return true;
      }
    } else {
      dependencyLog(
        `React Native Dependencies found on disk at: ${artifactsPath}.\nNo version file has been found. We are going to use it anyway, but there might be some unexpected behaviors.`,
      );
    }
  } else {
    dependencyLog('React Native Dependencies not found on disk');
  }

  // If the version file does not exist or the version does not match, delete the artifacts folder
  fs.rmSync(artifactsPath, {recursive: true, force: true});

  // Lets create the version.txt file
  fs.mkdirSync(artifactsPath, {recursive: true});
  fs.writeFileSync(versionFilePath, resolvedVersion, 'utf8');
  dependencyLog(
    `ReactNativeDependencies artifacts folder created: ${artifactsPath} with version: ${resolvedVersion}`,
  );
  return false;
}

function getTarballUrl(
  version /*: string */,
  buildType /*: BuildFlavor */,
) /*: string */ {
  // You can use the `ENTERPRISE_REPOSITORY` ariable to customise the base url from which artifacts will be downloaded.
  // The mirror's structure must be the same of the Maven repo the react-native core team publishes on Maven Central.
  const mavenRepoUrl =
    process.env.ENTERPRISE_REPOSITORY ?? 'https://repo1.maven.org/maven2';
  const namespace = 'com/facebook/react';
  return `${mavenRepoUrl}/${namespace}/react-native-artifacts/${version}/react-native-artifacts-${version}-reactnative-dependencies-${buildType.toLowerCase()}.tar.gz`;
}

async function getNightlyTarballUrl(
  version /*: string */,
  buildType /*: BuildFlavor */,
) /*: Promise<string> */ {
  const coordinate = 'react-native-artifacts';
  const artifactName = `reactnative-dependencies-${buildType.toLowerCase()}.tar.gz`;

  return await computeNightlyTarballURL(
    version,
    buildType,
    'react',
    coordinate,
    artifactName,
  );
}

/**
 * Checks if a ReactNativeDependencies artifact exists at the given URL using fetch instead of curl
 */
async function reactNativeDependenciesArtifactExists(
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
 * Determines the source type for ReactNativeDependencies based on availability
 */
async function reactNativeDependenciesSourceType(
  version /*: string */,
  buildType /*: BuildFlavor */,
) /*: Promise<ReactNativeDependenciesEngineSourceType> */ {
  const tarballUrl = getTarballUrl(version, buildType);
  if (await reactNativeDependenciesArtifactExists(tarballUrl)) {
    dependencyLog(`Using download prebuild ${buildType} tarball`);
    return ReactNativeDependenciesEngineSourceTypes.DOWNLOAD_PREBUILD_TARBALL;
  }

  // For nightly tarball, we need to resolve redirects first
  const nightlyUrl = await getNightlyTarballUrl(version, buildType);
  if (await reactNativeDependenciesArtifactExists(nightlyUrl)) {
    dependencyLog('Using download prebuild nightly tarball');
    return ReactNativeDependenciesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
  }

  dependencyLog(
    'Using download prebuild nightly tarball - this is a fallback and might not work.',
  );
  return ReactNativeDependenciesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
}

async function resolveSourceFromSourceType(
  sourceType /*: ReactNativeDependenciesEngineSourceType */,
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string*/,
) /*: Promise<string> */ {
  switch (sourceType) {
    case ReactNativeDependenciesEngineSourceTypes.DOWNLOAD_PREBUILD_TARBALL:
      return downloadPrebuildTarball(version, buildType, artifactsPath);
    case ReactNativeDependenciesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL:
      return downloadPrebuiltNightlyTarball(version, buildType, artifactsPath);
    default:
      abort(
        `[ReactNativeDependencies] Unsupported or invalid source type provided: ${sourceType}`,
      );
      return '';
  }
}

async function downloadPrebuildTarball(
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string*/,
) /*: Promise<string> */ {
  const url = getTarballUrl(version, buildType);
  dependencyLog(`Using release tarball from URL: ${url}`);
  return downloadStableReactNativeDependencies(
    version,
    buildType,
    artifactsPath,
  );
}

async function downloadPrebuiltNightlyTarball(
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string*/,
) /*: Promise<string> */ {
  const url = await getNightlyTarballUrl(version, buildType);
  dependencyLog(`Using nightly tarball from URL: ${url}`);
  return downloadReactNativeDependenciesTarball(
    url,
    version,
    buildType,
    artifactsPath,
  );
}

async function downloadStableReactNativeDependencies(
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string */,
) /*: Promise<string> */ {
  const tarballUrl = getTarballUrl(version, buildType);
  return downloadReactNativeDependenciesTarball(
    tarballUrl,
    version,
    buildType,
    artifactsPath,
  );
}

/**
 * Downloads a ReactNativeDependencies tarball using fetch instead of curl
 */
async function downloadReactNativeDependenciesTarball(
  tarballUrl /*: string */,
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactsPath /*: string */,
) /*: Promise<string> */ {
  const destPath = buildType
    ? `${artifactsPath}/reactnative-dependencies-${version}-${buildType}.tar.gz`
    : `${artifactsPath}/reactnative-dependencies-${version}.tar.gz`;

  if (!fs.existsSync(destPath)) {
    const tmpFile = `${artifactsPath}/reactnative-dependencies.download`;
    try {
      fs.mkdirSync(artifactsPath, {recursive: true});
      dependencyLog(
        `Downloading ReactNativeDependencies tarball from ${tarballUrl}`,
      );

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
        `Failed to download ReactNativeDependencies tarball from ${tarballUrl}: ${e.message}`,
      );
    }
  }
  return destPath;
}

function abort(message /*: string */) {
  dependencyLog(message, 'error');
  throw new Error(message);
}

module.exports = {
  prepareReactNativeDependenciesArtifactsAsync,
};
