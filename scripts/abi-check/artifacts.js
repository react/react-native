/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {BuildType, Platform} from './dump';
import type {HeaderLayout} from './layout';

const {
  download: downloadWithRetries,
} = require('../../packages/react-native/scripts/spm/download-spm-artifacts');
const {layoutFromEntries, mergeLayouts} = require('./layout');
const {execFileSync} = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

export type Download = (url: string, destination: string) => Promise<void>;

function downloadArtifact(url: string, destination: string): Promise<void> {
  // Without a progress callback, it writes its progress to stdout, which the
  // CLI keeps for the result.
  return downloadWithRetries(
    url,
    destination,
    (name, bytes, total, speed, done) => {
      if (done) {
        console.error(`Downloaded ${name}`);
      }
    },
  );
}

export type PublishedVersion = {
  version: string,
  platform: Platform,
  buildType: BuildType,
  /** Where downloaded archives and their extracted headers are kept. */
  cacheDir: string,
};

const MAVEN_REPOSITORY = 'https://repo1.maven.org/maven2';

const XCFRAMEWORK_HEADERS =
  /^(?:.*\/)?[^/]+\.xcframework\/ios-arm64\/Headers\//;
const XCFRAMEWORK_FRAMEWORK =
  /^((?:.*\/)?[^/]+\.xcframework\/ios-arm64)\/([^/]+)\.framework\/Headers\/(.+)$/;
const PREFAB_HEADERS = /^prefab\/modules\/[^/]+\/include\//;

function mavenUrl(
  group: string,
  artifact: string,
  version: string,
  suffix: string,
): string {
  return (
    `${MAVEN_REPOSITORY}/${group.replaceAll('.', '/')}/${artifact}/` +
    `${version}/${artifact}-${version}${suffix}`
  );
}

/**
 * The archives that ship the React Native headers of `version`. On iOS: the
 * core, with the ReactNativeHeaders xcframework and React.framework, whose
 * headers some ReactNativeHeaders include, and the
 * ReactNativeDependenciesHeaders xcframework. On Android: the react-android
 * AAR, whose prefab modules hold the headers.
 */
function publishedArtifactUrls(
  version: string,
  platform: Platform,
  buildType: BuildType,
): Array<string> {
  if (platform === 'ios') {
    return ['reactnative-core', 'reactnative-dependencies-headers'].map(name =>
      mavenUrl(
        'com.facebook.react',
        'react-native-artifacts',
        version,
        `-${name}-${buildType}.tar.gz`,
      ),
    );
  }
  return [
    mavenUrl(
      'com.facebook.react',
      'react-android',
      version,
      `-${buildType}.aar`,
    ),
  ];
}

function fbjniVersionFromPom(pom: string): string {
  const version = pom.match(
    /<artifactId>fbjni<\/artifactId>\s*<version>([^<]+)<\/version>/,
  )?.[1];
  if (version == null) {
    throw new Error('The react-android POM has no fbjni dependency.');
  }
  return version.trim();
}

function fbjniVersionFromCatalog(catalog: string): string {
  const version = catalog.match(/^fbjni\s*=\s*"([^"]+)"/m)?.[1];
  if (version == null) {
    throw new Error('The Gradle version catalog has no fbjni version.');
  }
  return version;
}

async function fetchCached(
  url: string,
  cacheDir: string,
  download: Download,
): Promise<string> {
  const archive = path.join(cacheDir, path.basename(url));
  if (fs.existsSync(archive)) {
    return archive;
  }
  fs.mkdirSync(cacheDir, {recursive: true});
  // The archive gets its cache name only when its SHA-1 matches the one that
  // Maven lists, so that the cache holds only verified archives.
  const unverified = `${archive}.unverified`;
  const checksumFile = `${archive}.sha1`;
  try {
    await download(url, unverified);
    await download(`${url}.sha1`, checksumFile);
    const expected = fs
      .readFileSync(checksumFile, 'utf8')
      .trim()
      .split(/\s+/)[0]
      .toLowerCase();
    const hash = crypto.createHash('sha1');
    for await (const chunk of fs.createReadStream(unverified)) {
      hash.update(chunk);
    }
    const actual = hash.digest('hex');
    if (actual !== expected) {
      throw new Error(
        `The SHA-1 of ${url} is ${actual}, but Maven lists ${expected}. ` +
          'The download was deleted.',
      );
    }
    fs.renameSync(unverified, archive);
  } finally {
    fs.rmSync(unverified, {force: true});
    fs.rmSync(checksumFile, {force: true});
  }
  return archive;
}

function listFiles(command: string, args: Array<string>): Array<string> {
  return execFileSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\n')
    .map(entry => entry.replace(/^\.\//, ''))
    .filter(entry => entry !== '' && !entry.endsWith('/'));
}

/** Throws if an entry of `archive` is absolute or goes up with `..`. */
function checkArchiveEntries(
  archive: string,
  entries: ReadonlyArray<string>,
): void {
  const unsafe = entries.find(
    entry => entry.startsWith('/') || entry.split('/').includes('..'),
  );
  if (unsafe != null) {
    throw new Error(`${archive} has a path outside its folder: ${unsafe}`);
  }
}

/** Extracts the headers of `archive` to `dir` and returns their paths. */
function extractHeaders(archive: string, dir: string): Array<string> {
  if (archive.endsWith('.aar')) {
    // The AAR also holds the native libraries, hundreds of megabytes.
    const headers = 'prefab/modules/*/include/*';
    const entries = listFiles('unzip', ['-Z1', archive, headers]);
    checkArchiveEntries(archive, entries);
    execFileSync('unzip', ['-q', '-o', archive, headers, '-d', dir]);
    return entries;
  }
  const entries = listFiles('tar', ['-tzf', archive]);
  checkArchiveEntries(archive, entries);
  execFileSync('tar', ['-xzf', archive, '-C', dir]);
  return entries;
}

/**
 * The layout of the headers in `archive`, extracted next to it once. The
 * archive's own paths are the include paths, so their case is kept on a
 * case-insensitive file system. A framework's headers are included as
 * `<Framework/Header.h>` through the `-F` directories.
 */
function archiveLayout(archive: string, headerRoot: RegExp): HeaderLayout {
  const dir = `${archive}-headers`;
  // Written last, so that an interrupted extraction is done again.
  const entriesFile = path.join(dir, '.entries.json');
  if (!fs.existsSync(entriesFile)) {
    fs.rmSync(dir, {recursive: true, force: true});
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(entriesFile, JSON.stringify(extractHeaders(archive, dir)));
  }
  const entries: Array<string> = JSON.parse(
    fs.readFileSync(entriesFile, 'utf8'),
  );
  const frameworkSlices: Set<string> = new Set();
  const frameworkHeaders: Map<string, string> = new Map();
  for (const entry of entries) {
    const match = entry.match(XCFRAMEWORK_FRAMEWORK);
    if (match != null && entry.endsWith('.h')) {
      const [, slice, framework, header] = match;
      frameworkSlices.add(slice);
      frameworkHeaders.set(`${framework}/${header}`, path.join(dir, entry));
    }
  }
  return mergeLayouts([
    layoutFromEntries(dir, entries, headerRoot),
    {
      includeDirs: [],
      frameworkDirs: [...frameworkSlices]
        .sort()
        .map(slice => path.join(dir, slice)),
      headers: frameworkHeaders,
    },
  ]);
}

/** The headers of the fbjni AAR, which ReactAndroid's JNI headers include. */
async function fbjniLayout(
  version: string,
  cacheDir: string,
  download: Download = downloadArtifact,
): Promise<HeaderLayout> {
  const url = mavenUrl('com.facebook.fbjni', 'fbjni', version, '.aar');
  return archiveLayout(
    await fetchCached(url, cacheDir, download),
    PREFAB_HEADERS,
  );
}

/**
 * The headers that React Native `version` published on Maven for `platform`
 * and `buildType`, downloaded to the cache unless they are there. On Android
 * they include the headers of the fbjni version that react-android uses.
 */
async function publishedLayout(
  {version, platform, buildType, cacheDir}: PublishedVersion,
  download: Download = downloadArtifact,
): Promise<HeaderLayout> {
  const archives = await Promise.all(
    publishedArtifactUrls(version, platform, buildType).map(url =>
      fetchCached(url, cacheDir, download),
    ),
  );
  if (platform === 'ios') {
    return mergeLayouts(
      archives.map(archive => archiveLayout(archive, XCFRAMEWORK_HEADERS)),
    );
  }
  const pom = await fetchCached(
    mavenUrl('com.facebook.react', 'react-android', version, '.pom'),
    cacheDir,
    download,
  );
  return mergeLayouts([
    ...archives.map(archive => archiveLayout(archive, PREFAB_HEADERS)),
    await fbjniLayout(
      fbjniVersionFromPom(fs.readFileSync(pom, 'utf8')),
      cacheDir,
      download,
    ),
  ]);
}

module.exports = {
  checkArchiveEntries,
  fbjniLayout,
  fbjniVersionFromCatalog,
  fbjniVersionFromPom,
  publishedArtifactUrls,
  publishedLayout,
};
