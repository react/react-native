/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*:: import type {BuildFlavor, MavenSubGroup} from './types'; */

const {execSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MAVEN_CENTRAL_REPOSITORY = 'https://repo1.maven.org/maven2';
const REACT_NATIVE_MAVEN_MIRROR_REPOSITORY =
  'https://repo.reactnative.dev/maven2';

/**
 * Creates a folder if it does not exist
 * @param {string} folderPath - The path to the folder
 * @returns {string} The path to the created or existing folder
 */
function createFolderIfNotExists(folderPath /*:string*/) /*: string */ {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {recursive: true});
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Failed to create folder: ${folderPath}`);
    }
  }
  return folderPath;
}

function findFirst(
  dir /*: string */,
  predicate /*: (name: string) => boolean */,
  depth /*: number */,
) /*: string | null */ {
  if (depth <= 0 || !fs.existsSync(dir)) {
    return null;
  }
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow but always string here
    const full /*: string */ = path.join(dir, entry.name);
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow but always string here
    if (predicate(entry.name)) {
      return full;
    }
    if (entry.isDirectory()) {
      const hit = findFirst(full, predicate, depth - 1);
      if (hit != null) {
        return hit;
      }
    }
  }
  return null;
}

function throwIfOnEden() {
  try {
    execSync('eden info', {stdio: 'ignore'});
  } catch (error) {
    // eden info failed, we are not on Eden, do nothing
    return;
  }

  throw new Error('Cannot prepare the iOS prebuilds on an Eden checkout');
}

function createLogger(
  prefix /*: string */,
) /*: (message: string, level?: 'info' | 'warning' | 'error') => void */ {
  return function (
    message /*: string */,
    level /*: 'info' | 'warning' | 'error' */ = 'info',
  ) {
    // Simple log coloring for terminal output
    const resolvedPrefix = `[${prefix}] `;
    let colorFn = (x /*:string*/) => x;
    if (process.stdout.isTTY) {
      if (level === 'info') colorFn = x => `\x1b[32m${x}\x1b[0m`;
      else if (level === 'error') colorFn = x => `\x1b[31m${x}\x1b[0m`;
      else colorFn = x => `\x1b[33m${x}\x1b[0m`;
    }

    console.log(colorFn(resolvedPrefix) + message);
  };
}

async function computeNightlyTarballURL(
  version /*: string */,
  buildType /*: BuildFlavor */,
  subGroup /*: MavenSubGroup */,
  artifactCoordinate /*: string */,
  artifactName /*: string */,
) /*: Promise<string> */ {
  const xmlUrl = `https://central.sonatype.com/repository/maven-snapshots/com/facebook/${subGroup}/${artifactCoordinate}/${version}-SNAPSHOT/maven-metadata.xml`;

  const response = await fetch(xmlUrl);
  if (!response.ok) {
    return '';
  }
  const xmlText = await response.text();

  // Extract the <snapshot> block
  const snapshotMatch = xmlText.match(/<snapshot>([\s\S]*?)<\/snapshot>/);
  if (!snapshotMatch) {
    return '';
  }
  const snapshotContent = snapshotMatch[1];

  // Extract <timestamp> from the snapshot block
  const timestampMatch = snapshotContent.match(/<timestamp>(.*?)<\/timestamp>/);
  if (!timestampMatch) {
    return '';
  }
  const timestamp = timestampMatch[1];

  // Extract <buildNumber> from the snapshot block
  const buildNumberMatch = snapshotContent.match(
    /<buildNumber>(.*?)<\/buildNumber>/,
  );
  if (!buildNumberMatch) {
    return '';
  }
  const buildNumber = buildNumberMatch[1];

  const fullVersion = `${version}-${timestamp}-${buildNumber}`;
  const finalUrl = `https://central.sonatype.com/repository/maven-snapshots/com/facebook/${subGroup}/${artifactCoordinate}/${version}-SNAPSHOT/${artifactCoordinate}-${fullVersion}-${artifactName}`;
  return finalUrl;
}

function getMavenRepositoryUrls() /*: Array<string> */ {
  // You can use the `ENTERPRISE_REPOSITORY` variable to customise the base url from which artifacts will be downloaded.
  // The mirror's structure must be the same of the Maven repo the react-native core team publishes on Maven Central.
  const enterpriseRepository = process.env.ENTERPRISE_REPOSITORY;
  if (enterpriseRepository != null && enterpriseRepository !== '') {
    return [enterpriseRepository.replace(/\/+$/, '')];
  }

  // Keep the React Native Maven mirror before Maven Central so cached artifacts are tried first
  // and Maven Central remains the fallback.
  return isReactNativeMavenMirrorEnabled()
    ? [REACT_NATIVE_MAVEN_MIRROR_REPOSITORY, MAVEN_CENTRAL_REPOSITORY]
    : [MAVEN_CENTRAL_REPOSITORY];
}

function isReactNativeMavenMirrorEnabled() /*: boolean */ {
  const value = process.env.RCT_REACT_NATIVE_MAVEN_MIRROR_ENABLED;
  if (value == null || value === '') {
    return true;
  }

  return value.toLowerCase() !== 'false' && value !== '0';
}

module.exports = {
  createFolderIfNotExists,
  findFirst,
  throwIfOnEden,
  createLogger,
  computeNightlyTarballURL,
  getMavenRepositoryUrls,
};
