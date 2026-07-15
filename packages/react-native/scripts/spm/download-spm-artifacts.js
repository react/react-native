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

/*:: import type {DownloadArgs, ResolvedArtifact, ProcessResult, ArtifactResultEntry} from './spm-types'; */

/**
 * download-spm-artifacts.js
 *
 * Downloads the three React Native iOS xcframeworks from Maven, extracts
 * them to a local cache directory, and writes artifacts.json for use by
 * generate-spm-package.js.
 *
 * Supports stable releases, nightlies, and snapshot builds, matching
 * the same resolution logic used by the existing CocoaPods scripts.
 *
 * Artifacts handled:
 *   React                  – react-native-core tarball from Maven
 *   ReactNativeDependencies – react-native-dependencies tarball from Maven
 *   hermes-engine          – hermes-ios tarball from Maven
 *
 * Usage:
 *   node scripts/download-spm-artifacts.js [options]
 *
 * Options:
 *   --version <ver>    RN version. Defaults to version in package.json.
 *                      Use "nightly" to resolve the latest nightly.
 *   --flavor  <f>      debug (default) or release.
 *   --output  <dir>    Where to write xcframeworks.
 *                      Default: ~/Library/Caches/ReactNative/spm-artifacts/{version}/{flavor}/
 *                      (downloaded tarballs are shared with CocoaPods in
 *                      ~/Library/Caches/ReactNative/; RCT_SKIP_CACHES=1 bypasses.)
 *
 * Per-artifact version overrides (mirrors existing env vars):
 *   HERMES_VERSION=<ver|nightly|latest-v1>
 *   RN_DEP_VERSION=<ver|nightly>
 *   ENTERPRISE_REPOSITORY=<url>   Custom Maven mirror (must match Maven structure)
 *
 * Output:
 *   <output>/React.xcframework/
 *   <output>/ReactNativeDependencies.xcframework/
 *   <output>/hermes-engine.xcframework/
 *   <output>/artifacts.json        ← maps target names to xcframework paths
 */

const {
  defaultCacheDir,
  displayPath,
  makeLogger,
  sharedCacheDir,
} = require('./spm-utils');
const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const yargs = require('yargs');

const {log, warn, die} = makeLogger('download-spm-artifacts');

function parseArgs(argv /*: Array<string> */) /*: DownloadArgs */ {
  const parsed = yargs(argv)
    .version(false)
    .option('version', {
      alias: 'v',
      type: 'string',
      describe:
        'RN version. Defaults to version in package.json. Use "nightly" to resolve the latest nightly.',
    })
    .option('flavor', {
      type: 'string',
      default: 'debug',
      describe: 'debug or release',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      describe:
        'Where to write xcframeworks. Default: ~/Library/Caches/ReactNative/spm-artifacts/{version}/{flavor}/',
    })
    .option('core-tarball', {
      type: 'string',
      describe:
        'Local React core tarball to use instead of downloading (e.g. the prebuild output). Env fallback: RN_CORE_TARBALL_PATH.',
    })
    .option('headers-tarball', {
      type: 'string',
      describe:
        'Local ReactNativeHeaders tarball to use instead of downloading. Env fallback: RN_HEADERS_TARBALL_PATH.',
    })
    .option('deps-tarball', {
      type: 'string',
      describe:
        'Local ReactNativeDependencies tarball to use instead of downloading (e.g. the deps prebuild output). Carries the headers sidecar beside the binary, so this subsumes --deps-headers-tarball for a local build. Env fallback: RN_DEPS_TARBALL_PATH.',
    })
    .option('deps-headers-tarball', {
      type: 'string',
      describe:
        'Local ReactNativeDependenciesHeaders tarball. Normally unneeded — the sidecar ships inside the ReactNativeDependencies tarball. Env fallback: RN_DEPS_HEADERS_TARBALL_PATH.',
    })
    .usage(
      'Usage: $0 [options]\n\nDownloads React Native iOS xcframeworks from Maven.',
    )
    .help()
    .parseSync();

  return {
    version: parsed.version ?? null,
    flavor: parsed.flavor.toLowerCase(),
    output: parsed.output ?? null,
    coreTarball:
      parsed['core-tarball'] ?? process.env.RN_CORE_TARBALL_PATH ?? null,
    headersTarball:
      parsed['headers-tarball'] ?? process.env.RN_HEADERS_TARBALL_PATH ?? null,
    depsTarball:
      parsed['deps-tarball'] ?? process.env.RN_DEPS_TARBALL_PATH ?? null,
    depsHeadersTarball:
      parsed['deps-headers-tarball'] ??
      process.env.RN_DEPS_HEADERS_TARBALL_PATH ??
      null,
  };
}

const MAVEN_RELEASE =
  process.env.ENTERPRISE_REPOSITORY ?? 'https://repo1.maven.org/maven2';
const MAVEN_SNAPSHOT =
  'https://central.sonatype.com/repository/maven-snapshots';

function rnCoreReleaseUrl(
  version /*: string */,
  flavor /*: string */,
) /*: string */ {
  return (
    `${MAVEN_RELEASE}/com/facebook/react/react-native-artifacts/${version}/` +
    `react-native-artifacts-${version}-reactnative-core-${flavor}.tar.gz`
  );
}
function rnDepsReleaseUrl(
  version /*: string */,
  flavor /*: string */,
) /*: string */ {
  return (
    `${MAVEN_RELEASE}/com/facebook/react/react-native-artifacts/${version}/` +
    `react-native-artifacts-${version}-reactnative-dependencies-${flavor}.tar.gz`
  );
}
function hermesReleaseUrl(
  version /*: string */,
  flavor /*: string */,
) /*: string */ {
  return (
    `${MAVEN_RELEASE}/com/facebook/hermes/hermes-ios/${version}/` +
    `hermes-ios-${version}-hermes-ios-${flavor}.tar.gz`
  );
}

/**
 * Resolves a Maven snapshot URL by fetching maven-metadata.xml and extracting
 * the latest timestamp+buildNumber. Mirrors computeNightlyTarballURL() in utils.js.
 *
 * @param {string} version    Base version without -SNAPSHOT suffix (e.g. "0.85.0")
 * @param {string} subGroup   com/facebook/<subGroup>
 * @param {string} coordinate Maven artifact coordinate (e.g. "react-native-artifacts")
 * @param {string} artifactName  Classifier part of the filename (e.g. "reactnative-core-debug.tar.gz")
 */
async function resolveSnapshotUrl(
  version /*: string */,
  subGroup /*: string */,
  coordinate /*: string */,
  artifactName /*: string */,
) /*: Promise<string> */ {
  const metadataUrl =
    `${MAVEN_SNAPSHOT}/com/facebook/${subGroup}/${coordinate}/` +
    `${version}-SNAPSHOT/maven-metadata.xml`;

  log(`  Fetching snapshot metadata: ${metadataUrl}`);
  const res = await fetch(metadataUrl);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch snapshot metadata (${res.status}): ${metadataUrl}`,
    );
  }
  const xml = await res.text();

  const ts = (xml.match(/<timestamp>(.*?)<\/timestamp>/) ?? [])[1];
  const bn = (xml.match(/<buildNumber>(.*?)<\/buildNumber>/) ?? [])[1];
  if (!ts || !bn) {
    throw new Error(
      `Could not parse timestamp/buildNumber from ${metadataUrl}`,
    );
  }

  const fullVersion = `${version}-${ts}-${bn}`;
  return (
    `${MAVEN_SNAPSHOT}/com/facebook/${subGroup}/${coordinate}/` +
    `${version}-SNAPSHOT/${coordinate}-${fullVersion}-${artifactName}`
  );
}

async function rnCoreSnapshotUrl(
  version /*: string */,
  flavor /*: string */,
) /*: Promise<string> */ {
  return resolveSnapshotUrl(
    version,
    'react',
    'react-native-artifacts',
    `reactnative-core-${flavor}.tar.gz`,
  );
}
async function rnDepsSnapshotUrl(
  version /*: string */,
  flavor /*: string */,
) /*: Promise<string> */ {
  return resolveSnapshotUrl(
    version,
    'react',
    'react-native-artifacts',
    `reactnative-dependencies-${flavor}.tar.gz`,
  );
}
async function hermesSnapshotUrl(
  version /*: string */,
  flavor /*: string */,
) /*: Promise<string> */ {
  return resolveSnapshotUrl(
    version,
    'hermes',
    'hermes-ios',
    `hermes-ios-${flavor}.tar.gz`,
  );
}

async function resolveNightlyVersion(
  npmPackage /*: string */,
) /*: Promise<string> */ {
  log(`  Resolving nightly version from npm: ${npmPackage}`);

  const res = await fetch(`https://registry.npmjs.org/${npmPackage}/nightly`);
  if (!res.ok) {
    throw new Error(`npm lookup failed for ${npmPackage}: ${res.status}`);
  }
  const ver = (await res.json())?.version;
  assertSafeVersion(ver, `${npmPackage}/nightly`);
  log(`  Resolved nightly: ${ver}`);
  return ver;
}

// A version string flows into Maven URLs and local tarball filenames (which are
// then passed to tar/cp via execFileSync). Constrain it to a safe charset so a
// malformed/hostile registry response can't produce a surprising path or a
// confusing 404 — and so static analysis sees an explicit sanitizer.
function assertSafeVersion(
  ver /*: unknown */,
  source /*: string */,
) /*: void */ {
  if (typeof ver !== 'string' || !/^[A-Za-z0-9._-]+$/.test(ver)) {
    throw new Error(
      `npm response for ${source} has no usable "version" field (got: ${String(ver)})`,
    );
  }
}

/**
 * Returns the cache-slot key for a given raw version label.
 *
 * Stable versions ('0.80.0', '0.81.0', …) become their own slot.
 * Dev / nightly labels ('1000.0.0', 'nightly') resolve to the current
 * nightly version (e.g. '0.85.0-nightly-20260515-abc') so each published
 * nightly is its own slot — a new nightly invalidates automatically
 * instead of sticking on a stale `1000.0.0` cache forever.
 *
 * If the npm registry lookup fails (offline, transient error), falls back
 * to the raw label so a previously-cached slot under that label can still
 * be used. A subsequent download attempt would surface the real error.
 */
async function resolveCacheSlotVersion(
  rawVersion /*: string */,
) /*: Promise<string> */ {
  if (rawVersion !== '1000.0.0' && rawVersion !== 'nightly') {
    return rawVersion;
  }
  try {
    return await resolveNightlyVersion('react-native');
  } catch {
    return rawVersion;
  }
}

async function resolveLatestV1Version() /*: Promise<string> */ {
  log('  Resolving latest-v1 Hermes from npm...');
  // $FlowFixMe[incompatible-call] global fetch not in Flow stubs
  const res = await fetch(
    'https://registry.npmjs.org/hermes-compiler/latest-v1',
  );
  if (!res.ok) {
    throw new Error(`npm lookup failed: ${res.status}`);
  }
  const ver = (await res.json())?.version;
  assertSafeVersion(ver, 'hermes-compiler/latest-v1');
  log(`  Resolved latest-v1: ${ver}`);
  return ver;
}

async function exists(url /*: string */) /*: Promise<boolean> */ {
  try {
    // $FlowFixMe[incompatible-call] global fetch not in Flow stubs
    const res = await fetch(url, {method: 'HEAD'});
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Returns {url, version} for the React Native core xcframework tarball.
 * Resolution order:
 *   1. Stable release on Maven Central
 *   2. Snapshot build on Sonatype
 */
async function resolveRNCoreArtifact(
  version /*: string */,
  flavor /*: string */,
  localTarball /*: ?string */,
) /*: Promise<ResolvedArtifact> */ {
  // Local-tarball override (--core-tarball / RN_CORE_TARBALL_PATH): use a
  // locally built core tarball (e.g. the prebuild's output) instead of
  // downloading. processArtifact() treats an existing local path as "already
  // downloaded" and always re-extracts it. NOTE: distinct from CocoaPods'
  // RCT_TESTONLY_RNCORE_TARBALL_PATH — that one belongs to pod install.
  if (localTarball != null && localTarball !== '') {
    if (!fs.existsSync(localTarball)) {
      throw new Error(
        `core tarball override is set to ${localTarball} but the file does not exist`,
      );
    }
    log(`  Using LOCAL core tarball: ${localTarball}`);
    return {url: localTarball, version: `${version}-local`};
  }
  const releaseUrl = rnCoreReleaseUrl(version, flavor);
  if (await exists(releaseUrl)) {
    log(`  Using stable release: ${releaseUrl}`);
    return {url: releaseUrl, version};
  }
  log(`  Release not found, trying snapshot...`);
  const snapshotUrl = await rnCoreSnapshotUrl(version, flavor);
  return {url: snapshotUrl, version};
}

/**
 * Returns {url, version} for ReactNativeDependencies.
 * Respects RN_DEP_VERSION env var.
 */
async function resolveRNDepsArtifact(
  rnVersion /*: string */,
  flavor /*: string */,
  localTarball /*: ?string */,
) /*: Promise<ResolvedArtifact> */ {
  // Local-tarball override (--deps-tarball / RN_DEPS_TARBALL_PATH): use a
  // locally built deps tarball (the deps prebuild output) instead of
  // downloading. It carries ReactNativeDependenciesHeaders.xcframework beside
  // the binary, so the existing companion-staging path (COMPANION_XCFRAMEWORKS
  // 'rndeps' -> ReactNativeDependenciesHeaders) supplies the sidecar too — no
  // separate --deps-headers-tarball needed for a local build.
  if (localTarball != null && localTarball !== '') {
    if (!fs.existsSync(localTarball)) {
      throw new Error(
        `deps tarball override is set to ${localTarball} but the file does not exist`,
      );
    }
    log(`  Using LOCAL deps tarball: ${localTarball}`);
    return {url: localTarball, version: `${rnVersion}-local`};
  }
  let version = process.env.RN_DEP_VERSION ?? rnVersion;
  if (version === 'nightly') {
    version = await resolveNightlyVersion('react-native');
  }

  const releaseUrl = rnDepsReleaseUrl(version, flavor);
  if (await exists(releaseUrl)) {
    log(`  Using stable release: ${releaseUrl}`);
    return {url: releaseUrl, version};
  }
  log(`  Release not found, trying snapshot...`);
  const snapshotUrl = await rnDepsSnapshotUrl(version, flavor);
  return {url: snapshotUrl, version};
}

/**
 * Returns {url, version} for Hermes. Hermes uses its own version space
 * decoupled from React Native's nightly cadence — RN's `hermes-compiler`
 * npm package publishes a `latest-v1` dist-tag that always resolves to a
 * binary that's been built and uploaded to Maven. Our default mirrors RN's
 * CocoaPods prebuild path (see scripts/ios-prebuild/hermes.js):
 *
 *   HERMES_VERSION unset       → 'latest-v1' dist-tag
 *   HERMES_VERSION=latest-v1   → same (explicit)
 *   HERMES_VERSION=nightly     → hermes-compiler@nightly dist-tag
 *   HERMES_VERSION=<literal>   → use that version verbatim
 *
 * Note: rnVersion / rawVersion are intentionally not consulted. There is no
 * guarantee a hermes-ios artifact exists for any given RN nightly hash —
 * tying them together produces 404s like #(repro case from spikes/MyApp).
 */
async function resolveHermesArtifact(
  rnVersion /*: string */,
  flavor /*: string */,
  rawVersion /*: string | null */,
) /*: Promise<ResolvedArtifact> */ {
  let version = process.env.HERMES_VERSION ?? 'latest-v1';

  if (version === 'nightly') {
    version = await resolveNightlyVersion('hermes-compiler');
  } else if (version === 'latest-v1') {
    version = await resolveLatestV1Version();
  }

  const releaseUrl = hermesReleaseUrl(version, flavor);
  if (await exists(releaseUrl)) {
    log(`  Using stable release: ${releaseUrl}`);
    return {url: releaseUrl, version};
  }
  log(`  Release not found, trying snapshot...`);
  const snapshotUrl = await hermesSnapshotUrl(version, flavor);
  return {url: snapshotUrl, version};
}

function formatBytes(bytes /*: number */) /*: string */ {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatSpeed(bytesPerSec /*: number */) /*: string */ {
  if (bytesPerSec < 1024 * 1024) {
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  }
  return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
}

/**
 * Creates a multi-line progress display that keeps N lines pinned at the
 * bottom of the terminal. Each line is prefixed and truncated to the current
 * terminal width — without truncation, a long line (e.g. a FAILED message
 * carrying a URL) wraps to a second row and `\x1b[2K` only clears the first,
 * leaving stray fragments after the next update.
 */
function createProgressDisplay(
  lineCount /*: number */,
  prefix /*: string */ = '',
) /*: {update: (index: number, text: string) => void} */ {
  let initialized = false;

  function truncateToWidth(s /*: string */) /*: string */ {
    // $FlowFixMe[prop-missing] columns lives on tty$WriteStream not stream$Writable
    const cols = process.stdout.columns ?? 120;
    const budget = Math.max(10, cols - 1);
    let out = '';
    let visLen = 0;
    let i = 0;
    while (i < s.length) {
      if (s[i] === '\x1b' && s[i + 1] === '[') {
        // CSI escape: forward through the final letter without counting.
        let j = i + 2;
        while (j < s.length && !/[a-zA-Z]/.test(s[j])) j++;
        out += s.slice(i, j + 1);
        i = j + 1;
      } else {
        if (visLen >= budget - 1) return out + '…\x1b[0m';
        out += s[i];
        visLen++;
        i++;
      }
    }
    return out;
  }

  function update(index /*: number */, text /*: string */) {
    if (!initialized) {
      for (let i = 0; i < lineCount; i++) {
        process.stdout.write('\n');
      }
      initialized = true;
    }
    const moveUp = lineCount - index;
    const line = truncateToWidth(prefix + text);
    process.stdout.write(`\x1b[${moveUp}A\x1b[2K\r${line}\x1b[${moveUp}B\r`);
  }

  return {update};
}

/*::
type ProgressCallback = (label: string, downloaded: number, total: number, speed: number, done: boolean, elapsed: number) => void;
*/

async function download(
  url /*: string */,
  destPath /*: string */,
  onProgress /*:: ?: ProgressCallback */,
) /*: Promise<void> */ {
  if (fs.existsSync(destPath)) {
    log(`  Already cached: ${path.basename(destPath)}`);
    return;
  }

  const tmpPath = destPath + '.download';
  try {
    // $FlowFixMe[incompatible-call] global fetch not in Flow stubs
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
    }

    const totalBytes = parseInt(res.headers.get('content-length') ?? '0', 10);
    let downloadedBytes = 0;
    let lastPrintTime = Date.now();
    let lastPrintBytes = 0;
    const startTime = Date.now();

    const fileStream = fs.createWriteStream(tmpPath);

    const reportProgress = (final /*: boolean */ = false) => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const intervalMs = now - lastPrintTime;
      const intervalBytes = downloadedBytes - lastPrintBytes;
      const speed = intervalMs > 0 ? (intervalBytes / intervalMs) * 1000 : 0;

      if (onProgress) {
        onProgress(
          path.basename(destPath),
          downloadedBytes,
          totalBytes,
          speed,
          final,
          elapsed,
        );
      } else {
        // Fallback: single-line progress (used when not in parallel mode)
        let line = `  ${formatBytes(downloadedBytes)}`;
        if (totalBytes > 0) {
          const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          line += ` / ${formatBytes(totalBytes)} (${pct}%)`;
        }
        line += ` @ ${formatSpeed(speed)}`;

        if (final) {
          const totalMb = formatBytes(downloadedBytes);
          const totalSec = elapsed.toFixed(1);
          const avgSpeed =
            elapsed > 0 ? formatSpeed(downloadedBytes / elapsed) : '';
          process.stdout.write(
            `\r  Done: ${totalMb} in ${totalSec}s (avg ${avgSpeed})          \n`,
          );
        } else {
          process.stdout.write(`\r${line}    `);
        }
      }

      if (!final) {
        lastPrintTime = now;
        lastPrintBytes = downloadedBytes;
      }
    };

    if (res.body) {
      // fetch() returns a Web ReadableStream, not a Node.js Readable.
      // Convert it so we can pipe to a file stream and track progress.
      // $FlowFixMe[prop-missing] stream.Readable.fromWeb not in Flow stubs
      const nodeReadable = stream.Readable.fromWeb(res.body);

      await new Promise((resolve, reject) => {
        let progressInterval;
        try {
          progressInterval = setInterval(() => reportProgress(), 500);

          nodeReadable
            .on('data', chunk => {
              downloadedBytes += chunk.length;
            })
            .on('error', err => {
              clearInterval(progressInterval);
              reject(err);
            })
            .pipe(fileStream)
            .on('finish', () => {
              clearInterval(progressInterval);
              reportProgress(true);
              resolve();
            })
            .on('error', err => {
              clearInterval(progressInterval);
              reject(err);
            });
        } catch (err) {
          if (progressInterval != null) clearInterval(progressInterval);
          reject(err);
        }
      });
    } else {
      const buf = await res.arrayBuffer();
      downloadedBytes = buf.byteLength;
      fs.writeFileSync(tmpPath, Buffer.from(buf));
      reportProgress(true);
    }

    fs.renameSync(tmpPath, destPath);
  } catch (err) {
    // Clean up partial .download temp file on failure
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // temp file may not exist yet
    }
    throw err;
  }
}

/**
 * Extracts a .tar.gz and returns the path to the first .xcframework found.
 */
function extractXCFramework(
  tarPath /*: string */,
  extractDir /*: string */,
) /*: string */ {
  fs.mkdirSync(extractDir, {recursive: true});
  log(`  Extracting ${path.basename(tarPath)}...`);
  execFileSync('tar', ['-xzf', tarPath, '-C', extractDir], {stdio: 'pipe'});

  const found = findFirst(extractDir, name => name.endsWith('.xcframework'), 8);
  if (found == null) {
    throw new Error(`No .xcframework found after extracting ${tarPath}`);
  }
  log(`  Found: ${path.relative(extractDir, found)}`);
  return found;
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

/**
 * The hermes-ios tarball ships its public C++ API headers in
 * `destroot/include/hermes` alongside the framework — which extractXCFramework
 * discards (it keeps only the .xcframework). Stage the `hermes/` namespace into
 * `<outputDir>/hermes-headers/hermes` so headers-compose can fold it into
 * ReactNativeHeaders (making `<hermes/hermes.h>` resolve for any RN-linking
 * target). Only `hermes/` is staged — `jsi/` is already vended elsewhere.
 * Best-effort: a tarball without these headers just leaves hermes unavailable.
 */
function stageHermesHeaders(
  extractDir /*: string */,
  outputDir /*: string */,
) /*: void */ {
  let includeDir = path.join(extractDir, 'destroot', 'include');
  if (!fs.existsSync(path.join(includeDir, 'hermes', 'hermes.h'))) {
    // Fall back to locating the include dir wherever it landed in the tarball.
    const hit = findFirst(extractDir, name => name === 'include', 8);
    if (hit != null) {
      includeDir = hit;
    }
  }
  const src = path.join(includeDir, 'hermes');
  if (!fs.existsSync(path.join(src, 'hermes.h'))) {
    log('  Hermes public headers not found in tarball — skipping header stage');
    return;
  }
  const destRoot = path.join(outputDir, 'hermes-headers');
  const dest = path.join(destRoot, 'hermes');
  fs.rmSync(dest, {recursive: true, force: true});
  fs.mkdirSync(destRoot, {recursive: true});
  execFileSync('/bin/cp', ['-R', src, dest], {stdio: 'pipe'});
  log('  Staged Hermes public headers → hermes-headers/hermes');
}

const DEPS_HEADERS_NAME = 'ReactNativeDependenciesHeaders';

// Headers-only companion xcframeworks that ship INSIDE another artifact's
// tarball: the ReactCore tarball carries ReactNativeHeaders.xcframework
// beside React.xcframework, and the ReactNativeDependencies tarball carries
// the ReactNativeDependenciesHeaders sidecar beside the binary (the binary is
// framework-type, so only the LIBRARY-type sidecar can serve the deps
// namespaces — folly/glog/boost/... — to SwiftPM; ReactNativeHeaders is
// pure-RN). extractXCFramework keeps only the first xcframework, so
// companions are staged separately into their own
// `<outputDir>/<name>.xcframework`.
const COMPANION_XCFRAMEWORKS /*: {[label: string]: string} */ = {
  'react-core': 'ReactNativeHeaders',
  rndeps: DEPS_HEADERS_NAME,
};

/**
 * Stages a companion xcframework out of an extract dir. Returns true when
 * staged; false when the tarball predates the companion.
 */
function stageCompanionXcframework(
  extractDir /*: string */,
  outputDir /*: string */,
  name /*: string */,
) /*: boolean */ {
  const src = findFirst(extractDir, n => n === `${name}.xcframework`, 8);
  if (src == null) {
    return false;
  }
  const dest = path.join(outputDir, `${name}.xcframework`);
  fs.rmSync(dest, {recursive: true, force: true});
  fs.renameSync(src, dest);
  log(`  Staged companion ${name}.xcframework`);
  return true;
}

/**
 * Self-heal: stage a companion xcframework into an already-extracted slot
 * (the fast path skips extraction, so the companion was never staged).
 * Prefers a CACHED tarball (no network); downloads only as a last resort.
 */
async function ensureCompanionStaged(
  url /*: string */,
  downloadDir /*: string */,
  sharedTarballName /*: ?string */,
  outputDir /*: string */,
  name /*: string */,
) /*: Promise<void> */ {
  const candidates = [
    !/^https?:\/\//.test(url) ? url : null, // local-tarball override
    path.join(downloadDir, url.split('/').pop() ?? ''),
    sharedTarballName != null
      ? path.join(sharedCacheDir(), sharedTarballName)
      : null,
  ].filter(Boolean);
  let tarPath /*: ?string */ = candidates.find(
    p => p != null && fs.existsSync(p),
  );
  if (tarPath == null) {
    if (!/^https?:\/\//.test(url)) {
      return; // local override missing — nothing to recover from
    }
    const localPath = path.join(
      downloadDir,
      url.split('/').pop() ?? 'artifact.tar.gz',
    );
    fs.mkdirSync(downloadDir, {recursive: true});
    await download(url, localPath);
    tarPath = localPath;
  }
  const tmp = path.join(outputDir, `.companion-tmp-${name}`);
  fs.rmSync(tmp, {recursive: true, force: true});
  fs.mkdirSync(tmp, {recursive: true});
  try {
    execFileSync('tar', ['-xzf', tarPath, '-C', tmp], {stdio: 'pipe'});
    stageCompanionXcframework(tmp, outputDir, name);
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

/**
 * Self-heal: stage Hermes headers into an already-extracted slot (the fast
 * path skips extraction, so the headers were never staged). Prefers a CACHED
 * hermes tarball (no network); downloads only as a last resort so the slot
 * can't get stuck "incomplete" forever. No-op only when the headers can't be
 * obtained at all (e.g. a missing local-tarball override).
 */
async function ensureHermesHeadersStaged(
  url /*: string */,
  downloadDir /*: string */,
  sharedTarballName /*: ?string */,
  outputDir /*: string */,
) /*: Promise<void> */ {
  const candidates = [
    !/^https?:\/\//.test(url) ? url : null, // local-tarball override
    path.join(downloadDir, url.split('/').pop() ?? ''),
    sharedTarballName != null
      ? path.join(sharedCacheDir(), sharedTarballName)
      : null,
  ].filter(Boolean);
  let tarPath /*: ?string */ = candidates.find(
    p => p != null && fs.existsSync(p),
  );
  if (tarPath == null) {
    if (!/^https?:\/\//.test(url)) {
      return; // local override missing — nothing to recover from
    }
    const localPath = path.join(
      downloadDir,
      url.split('/').pop() ?? 'hermes.tar.gz',
    );
    fs.mkdirSync(downloadDir, {recursive: true});
    await download(url, localPath);
    tarPath = localPath;
  }
  const tmp = path.join(outputDir, '.hermes-hdr-tmp');
  fs.rmSync(tmp, {recursive: true, force: true});
  fs.mkdirSync(tmp, {recursive: true});
  try {
    execFileSync('tar', ['-xzf', tarPath, '-C', tmp], {stdio: 'pipe'});
    stageHermesHeaders(tmp, outputDir);
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

/**
 * Downloads a tarball, extracts the xcframework, and places it directly in
 * the output directory as <xcframeworkName>.xcframework/.
 *
 * SPM binaryTarget(path:) accepts a bare .xcframework directory — no zip or
 * checksum needed for local path-based targets.
 *
 * @param {string} label           Internal label (used for log messages)
 * @param {string} xcframeworkName The SPM target name (e.g. "React", "hermes-engine")
 * @param resolvedArtifact         {url, version} from resolve*Artifact()
 * @param {string} downloadDir     Where to cache downloaded tarballs
 * @param {string} outputDir       Where to place the final <name>.xcframework directory
 * @param sharedTarballName        Filename in the flat shared cache to reuse/populate
 *                                 (matches CocoaPods' convention), or null to not share.
 */
async function processArtifact(
  label /*: string */,
  xcframeworkName /*: string */,
  resolvedArtifact /*: ResolvedArtifact */,
  downloadDir /*: string */,
  outputDir /*: string */,
  onProgress /*:: ?: ProgressCallback */,
  sharedTarballName /*:: ?: ?string */,
) /*: Promise<ProcessResult> */ {
  const {url, version} = resolvedArtifact;

  const destXcfwPath = path.join(outputDir, `${xcframeworkName}.xcframework`);
  // Local-tarball override: `url` is an existing local file. Always
  // re-extract (a changed local tarball must win over a previous extraction)
  // and never touch the shared cache.
  const isLocalTarball = !/^https?:\/\//.test(url) && fs.existsSync(url);
  if (isLocalTarball && fs.existsSync(destXcfwPath)) {
    fs.rmSync(destXcfwPath, {recursive: true, force: true});
  }
  if (fs.existsSync(destXcfwPath)) {
    if (onProgress) {
      onProgress(xcframeworkName, 0, 0, 0, true, 0);
    } else {
      log(`  Already extracted: ${xcframeworkName}.xcframework`);
    }
    // The xcframework is cached, but a slot from older tooling won't have the
    // Hermes headers staged. Backfill them from a cached tarball (no network).
    if (
      label === 'hermes' &&
      !fs.existsSync(path.join(outputDir, 'hermes-headers', 'hermes'))
    ) {
      try {
        await ensureHermesHeadersStaged(
          url,
          downloadDir,
          sharedTarballName,
          outputDir,
        );
      } catch (e) {
        log(`  Hermes header backfill failed (${e.message}) — continuing`);
      }
    }
    // Same for the headers-only companions (ReactNativeHeaders from the core
    // tarball, the ReactNativeDependenciesHeaders sidecar from the deps
    // tarball): backfill into slots extracted by older tooling from the
    // cached tarball.
    const companion = COMPANION_XCFRAMEWORKS[label];
    if (
      companion != null &&
      !fs.existsSync(path.join(outputDir, `${companion}.xcframework`))
    ) {
      try {
        await ensureCompanionStaged(
          url,
          downloadDir,
          sharedTarballName,
          outputDir,
          companion,
        );
      } catch (e) {
        log(`  ${companion} backfill failed (${e.message}) — continuing`);
      }
    }
    return {label, version, xcframeworkPath: destXcfwPath, url};
  }

  // Tarball acquisition: prefer the flat shared cache (~/Library/Caches/
  // ReactNative/<name>) that CocoaPods also populates, so SPM and `pod install`
  // reuse the same download. RCT_SKIP_CACHES=1 bypasses it (mirrors CocoaPods).
  const skipCaches = process.env.RCT_SKIP_CACHES === '1';
  const sharedPath =
    !skipCaches && sharedTarballName != null
      ? path.join(sharedCacheDir(), sharedTarballName)
      : null;

  const downloadAndCache = async () /*: Promise<string> */ => {
    const tarName = url.split('/').pop() ?? '';
    const localPath = path.join(downloadDir, tarName);
    await download(
      url,
      localPath,
      onProgress
        ? (name, downloaded, total, speed, done, elapsed) =>
            onProgress(xcframeworkName, downloaded, total, speed, done, elapsed)
        : undefined,
    );
    // Best-effort: save into the flat shared cache for future SPM/CocoaPods runs.
    if (sharedPath != null) {
      try {
        fs.mkdirSync(sharedCacheDir(), {recursive: true});
        fs.copyFileSync(localPath, sharedPath);
      } catch {
        // ignore shared-cache write failures
      }
    }
    return localPath;
  };

  let tarPath: string;
  let fromShared = false;
  if (isLocalTarball) {
    tarPath = url;
    if (onProgress) {
      onProgress(xcframeworkName, 0, 0, 0, true, 0);
    } else {
      log(`  Using local tarball: ${url}`);
    }
  } else if (sharedPath != null && fs.existsSync(sharedPath)) {
    // Shared cache hit — skip the download entirely.
    tarPath = sharedPath;
    fromShared = true;
    if (onProgress) {
      onProgress(xcframeworkName, 0, 0, 0, true, 0);
    } else {
      log(`  Shared cache hit: ${path.basename(sharedPath)}`);
    }
  } else {
    tarPath = await downloadAndCache();
  }

  // Extract to a temp dir, rename to the expected name, then move into outputDir
  if (onProgress) {
    onProgress(xcframeworkName, 0, 0, 0, false, 0);
  }
  const tmpExtractDir = path.join(outputDir, '.extract-tmp', label);
  let xcfwPath: string;
  try {
    xcfwPath = extractXCFramework(tarPath, tmpExtractDir);
  } catch (e) {
    // A poisoned shared tarball must not permanently break SPM: drop it and
    // re-download to the local dir once.
    if (fromShared) {
      try {
        fs.rmSync(tarPath, {force: true});
      } catch {}
      tarPath = await downloadAndCache();
      xcfwPath = extractXCFramework(tarPath, tmpExtractDir);
    } else {
      throw e;
    }
  }

  const actualBasename = path.basename(xcfwPath);
  const expectedBasename = `${xcframeworkName}.xcframework`;
  if (actualBasename !== expectedBasename) {
    const renamed = path.join(tmpExtractDir, expectedBasename);
    fs.renameSync(xcfwPath, renamed);
    fs.renameSync(renamed, destXcfwPath);
  } else {
    fs.renameSync(xcfwPath, destXcfwPath);
  }

  // Hermes ships its public headers in the same tarball; stage them next to
  // the xcframeworks so headers-compose can fold `hermes/` into
  // ReactNativeHeaders. (Other artifacts have no such headers — no-op.)
  if (label === 'hermes') {
    try {
      stageHermesHeaders(tmpExtractDir, outputDir);
    } catch (e) {
      log(`  Hermes header staging failed (${e.message}) — continuing`);
    }
  }

  // Headers-only companions ship inside the same tarball (ReactNativeHeaders
  // in the core tarball, the ReactNativeDependenciesHeaders sidecar in the
  // deps tarball) — stage them as their own artifacts.
  const companionName = COMPANION_XCFRAMEWORKS[label];
  if (companionName != null) {
    if (!stageCompanionXcframework(tmpExtractDir, outputDir, companionName)) {
      log(
        `  ${companionName}.xcframework not present in the ${label} tarball (pre-companion artifact)`,
      );
    }
  }

  fs.rmSync(tmpExtractDir, {recursive: true, force: true});

  return {label, version, xcframeworkPath: destXcfwPath, url};
}

async function main(argv /*:: ?: Array<string> */) /*: Promise<void> */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  const rnRoot = path.resolve(__dirname, '../..');
  const flavor = args.flavor;

  // Resolve base RN version
  // rawVersion preserves the original --version arg (e.g. 'nightly') before resolution.
  // It is passed to Hermes resolution so it can independently resolve its nightly.
  let rawVersion = args.version;
  let rnVersion = args.version;
  if (rnVersion == null) {
    // $FlowFixMe[incompatible-type] JSON.parse returns any
    const rnPkg /*: {version: string} */ = JSON.parse(
      fs.readFileSync(path.join(rnRoot, 'package.json'), 'utf8'),
    );
    rnVersion = rnPkg.version;
  }
  if (rnVersion === '1000.0.0') {
    log('Detected dev version (1000.0.0), resolving as nightly...');
    rawVersion = 'nightly';
  }
  if (rnVersion === 'nightly' || rnVersion === '1000.0.0') {
    rnVersion = await resolveNightlyVersion('react-native');
  }
  if (rnVersion == null) {
    die('Could not determine RN version');
  }
  // Re-bind to const so Flow keeps the non-null narrowing across the closures
  // below (let-bound vars are widened across function boundaries).
  const resolvedRnVersion /*: string */ = rnVersion;

  // Cache key: stable versions slot under their own number. Dev / nightly
  // labels use the resolved nightly hash (e.g. "0.85.0-nightly-20260515-abc")
  // so each published nightly is its own slot — picks up new specs and fixes
  // automatically instead of sticking on a stale "1000.0.0" cache forever.
  const cacheVersionKey =
    rawVersion === 'nightly' || rawVersion === '1000.0.0' || rawVersion == null
      ? resolvedRnVersion
      : rawVersion;
  const outputDir =
    args.output != null
      ? path.resolve(args.output)
      : defaultCacheDir(cacheVersionKey, flavor);
  // Tarballs are cached in a .downloads/ subdirectory to keep them separate
  // from the extracted .xcframework directories.
  const downloadDir = path.join(outputDir, '.downloads');

  fs.mkdirSync(outputDir, {recursive: true});
  fs.mkdirSync(downloadDir, {recursive: true});

  log(`RN version : ${resolvedRnVersion}`);
  log(`Flavor     : ${flavor}`);
  log(`Output     : ${displayPath(outputDir)}`);
  log('');

  // Download all three artifacts in parallel for faster setup
  log('Downloading artifacts in parallel...');

  // `sharedName` builds the flat shared-cache filename in the canonical
  // ~/Library/Caches/ReactNative/ dir, matching the names other RN tooling uses
  // (CocoaPods' rncore.rb / rndependencies.rb for core+deps, and the hermes
  // prebuilt tarball name) so SPM and `pod install` reuse the same downloads.
  // `v` is each artifact's resolved version (RN version for core/deps, the
  // hermes-ios version for hermes).
  const artifactSpecs = [
    {
      label: 'react-core',
      name: 'React',
      resolve: () =>
        resolveRNCoreArtifact(resolvedRnVersion, flavor, args.coreTarball),
      // Local overrides skip the shared cache (test artifacts must not
      // poison the canonical downloads).
      sharedName:
        args.coreTarball != null
          ? null
          : (v /*: string */) => `reactnative-core-${v}-${flavor}.tar.gz`,
    },
    {
      label: 'rndeps',
      name: 'ReactNativeDependencies',
      resolve: () =>
        resolveRNDepsArtifact(resolvedRnVersion, flavor, args.depsTarball),
      // Local override skips the shared cache (as with core) so a local deps
      // build can't poison the canonical downloads.
      sharedName:
        args.depsTarball != null
          ? null
          : (v /*: string */) =>
              `reactnative-dependencies-${v}-${flavor}.tar.gz`,
    },
    {
      label: 'hermes',
      name: 'hermes-engine',
      resolve: () =>
        resolveHermesArtifact(resolvedRnVersion, flavor, rawVersion),
      sharedName: (v /*: string */) => `hermes-ios-${v}-${flavor}.tar.gz`,
    },
  ];

  // ReactNativeHeaders is normally staged straight out of the ReactCore
  // tarball (it ships beside React.xcframework). The override exists for
  // testing a standalone headers tarball (e.g. the prebuild output at
  // .build/output/xcframeworks/<flavor>/ReactNativeHeaders.xcframework.tar.gz,
  // published on Maven under classifier reactnative-headers-<flavor>).
  const headersTarball = args.headersTarball;
  if (headersTarball != null && headersTarball !== '') {
    if (!fs.existsSync(headersTarball)) {
      die(
        `headers tarball override is set to ${headersTarball} but the file does not exist`,
      );
    }
    artifactSpecs.push({
      label: 'rnheaders',
      name: 'ReactNativeHeaders',
      resolve: () =>
        Promise.resolve({
          url: headersTarball,
          version: `${resolvedRnVersion}-local`,
        }),
      sharedName: null,
    });
  }

  // ReactNativeDependenciesHeaders: normally staged straight out of the deps
  // tarball (the sidecar ships inside it). The override exists for testing a
  // standalone sidecar tarball (classifier
  // reactnative-dependencies-headers-<flavor>).
  const depsHeadersTarball = args.depsHeadersTarball;
  if (depsHeadersTarball != null && depsHeadersTarball !== '') {
    if (!fs.existsSync(depsHeadersTarball)) {
      die(
        `deps-headers tarball override is set to ${depsHeadersTarball} but the file does not exist`,
      );
    }
    artifactSpecs.push({
      label: 'rndeps-headers',
      name: DEPS_HEADERS_NAME,
      resolve: () =>
        Promise.resolve({
          url: depsHeadersTarball,
          version: `${resolvedRnVersion}-local`,
        }),
      sharedName: null,
    });
  }

  const progress = createProgressDisplay(
    artifactSpecs.length,
    '\x1b[32m[download-spm-artifacts]\x1b[0m ',
  );

  const makeCallback = (index /*: number */) /*: ProgressCallback */ =>
    (name, downloaded, total, speed, done, elapsed) => {
      if (done && downloaded === 0 && total === 0) {
        progress.update(index, `  ${name}: already cached`);
      } else if (done) {
        const avg = elapsed > 0 ? formatSpeed(downloaded / elapsed) : '';
        progress.update(
          index,
          `  ${name}: done ${formatBytes(downloaded)} in ${elapsed.toFixed(1)}s (${avg})`,
        );
      } else if (total > 0) {
        const pct = ((downloaded / total) * 100).toFixed(1);
        progress.update(
          index,
          `  ${name}: ${formatBytes(downloaded)} / ${formatBytes(total)} (${pct}%) @ ${formatSpeed(speed)}`,
        );
      } else {
        progress.update(index, `  ${name}: extracting...`);
      }
    };

  const results /*: Array<ArtifactResultEntry> */ = await Promise.all(
    artifactSpecs.map(async (spec, index) => {
      try {
        const artifact = await spec.resolve();
        progress.update(index, `  ${spec.name}: resolving...`);
        const sharedTarballName =
          spec.sharedName != null ? spec.sharedName(artifact.version) : null;
        const r = await processArtifact(
          spec.label,
          spec.name,
          artifact,
          downloadDir,
          outputDir,
          makeCallback(index),
          sharedTarballName,
        );
        const ok /*: ArtifactResultEntry */ = {
          name: spec.name,
          error: undefined,
          ...r,
        };
        return ok;
      } catch (e) {
        progress.update(index, `  ${spec.name}: FAILED - ${e.message}`);
        const failed /*: ArtifactResultEntry */ = {
          name: spec.name,
          error: e.message,
        };
        return failed;
      }
    }),
  );
  log('');

  const succeeded = results.filter(r => r.error == null);
  const failed = results.filter(r => r.error != null);

  log('='.repeat(60));
  if (succeeded.length > 0) {
    log('Extracted xcframeworks:');
    log('');
    for (const r of succeeded) {
      if (r.error == null) {
        log(`  ${r.name}`);
        log(`    path: ${displayPath(r.xcframeworkPath)}`);
        log('');
      }
    }
  }
  // Abort on ANY failure — every artifact (React, ReactNativeDependencies,
  // hermes-engine + the headers companions) is required; proceeding with a
  // partial set would only surface as a confusing build error in Xcode. We
  // also intentionally do NOT
  // write artifacts.json when there are failures: the orchestrator uses its
  // presence as the "already present" signal, so a partial write would mask
  // the problem and prevent retries.
  if (failed.length > 0) {
    log('Failed:');
    for (const r of failed) {
      warn(`  ${r.name}: ${r.error ?? 'unknown error'}`);
    }
    die(
      `Failed to download ${failed.length} of ${results.length} artifact(s): ` +
        failed.map(r => r.name).join(', '),
    );
  }

  // Write artifacts.json only on full success.
  const artifactsJson /*: {[string]: {xcframeworkPath: string, url: string}} */ =
    {};
  for (const r of succeeded) {
    if (r.error == null) {
      artifactsJson[r.name] = {xcframeworkPath: r.xcframeworkPath, url: r.url};
    }
  }
  // The headers-only companions are staged by their parent's extraction (or
  // by the --headers-tarball / --deps-headers-tarball overrides above, which
  // already produced entries). A slot without them cannot resolve any
  // non-React namespace (ReactNativeHeaders) or the <folly/...>-style deps
  // includes (the sidecar; ReactNativeHeaders is pure-RN) — fail closed
  // rather than hand Xcode a package graph that breaks with header-not-found
  // errors much later.
  const companions = [
    {
      name: 'ReactNativeHeaders',
      parent: 'React',
      advice:
        'The React core tarball predates the headers-spec layout — use a ' +
        'matching react-native version, or pass --headers-tarball / ' +
        'RN_HEADERS_TARBALL_PATH.',
    },
    {
      name: DEPS_HEADERS_NAME,
      parent: 'ReactNativeDependencies',
      advice:
        'The ReactNativeDependencies tarball predates the headers sidecar — ' +
        'use a matching react-native version, or pass ' +
        '--deps-headers-tarball / RN_DEPS_HEADERS_TARBALL_PATH.',
    },
  ];
  for (const {name, parent, advice} of companions) {
    if (artifactsJson[name] != null) {
      continue;
    }
    const companionPath = path.join(outputDir, `${name}.xcframework`);
    if (!fs.existsSync(companionPath)) {
      die(`${name}.xcframework is missing from the artifact slot. ${advice}`);
    }
    const parentEntry = artifactsJson[parent];
    artifactsJson[name] = {
      xcframeworkPath: companionPath,
      url: parentEntry != null ? parentEntry.url : '',
    };
  }
  const artifactsJsonPath = path.join(outputDir, 'artifacts.json');
  fs.writeFileSync(
    artifactsJsonPath,
    JSON.stringify(artifactsJson, null, 2) + '\n',
    'utf8',
  );
  log(`Artifact index: ${displayPath(artifactsJsonPath)}`);
}

// Canonical set of xcframework artifacts an SPM slot must provide. The
// xcodeproj references them as package products; missing any one surfaces as
// "Missing package product" only at Xcode build time. Used by
// `setup-apple-spm.js` to validate the cache before skipping a re-download.
// ReactNativeHeaders (pure-RN) and ReactNativeDependenciesHeaders (the deps
// sidecar) are the two headers-only targets — both required: without the
// sidecar no <folly/...>-style include resolves.
const REQUIRED_ARTIFACTS = [
  'React',
  'ReactNativeHeaders',
  'ReactNativeDependencies',
  'ReactNativeDependenciesHeaders',
  'hermes-engine',
];

/**
 * Returns null if `artifacts.json` is present, complete (covers every entry
 * in REQUIRED_ARTIFACTS), and each entry's xcframework dir exists on disk.
 * Otherwise returns a string describing what's wrong — caller treats that as
 * "needs re-download". Catches stale partial-write states from older runs
 * that didn't fail loudly on download errors.
 */
function validateArtifactsCache(
  artifactsDir /*: string */,
) /*: string | null */ {
  const artifactsJsonPath = path.join(artifactsDir, 'artifacts.json');
  if (!fs.existsSync(artifactsJsonPath)) {
    return `artifacts.json missing in ${artifactsDir}`;
  }
  let json: {[string]: {xcframeworkPath: string, url: string}};
  try {
    // $FlowFixMe[unclear-type] JSON.parse returns any
    const parsed /*: any */ = JSON.parse(
      fs.readFileSync(artifactsJsonPath, 'utf8'),
    );
    json = parsed;
  } catch (e) {
    return `artifacts.json is unreadable: ${e.message}`;
  }
  for (const name of REQUIRED_ARTIFACTS) {
    const entry = json[name];
    if (entry == null) {
      return `artifacts.json missing entry for "${name}"`;
    }
    if (!fs.existsSync(entry.xcframeworkPath)) {
      return `xcframework for "${name}" not found at ${entry.xcframeworkPath}`;
    }
  }
  // The Hermes public headers must be staged for headers-compose to fold
  // `<hermes/...>` into ReactNativeHeaders. A slot from older tooling won't
  // have them — report incomplete so ensureArtifacts re-runs the download
  // (which, with the xcframeworks already present, only backfills the headers
  // from the cached tarball — no network re-download).
  if (!fs.existsSync(path.join(artifactsDir, 'hermes-headers', 'hermes'))) {
    return 'Hermes public headers not staged (hermes-headers/hermes)';
  }
  return null;
}

if (require.main === module) {
  main().catch(err => {
    console.error(`\x1b[31m${err.message}\x1b[0m`);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
  resolveCacheSlotVersion,
  resolveHermesArtifact,
  REQUIRED_ARTIFACTS,
  validateArtifactsCache,
  // Exposed for unit tests (pure / fetch-stubbable helpers).
  rnCoreReleaseUrl,
  rnDepsReleaseUrl,
  hermesReleaseUrl,
  resolveSnapshotUrl,
  resolveNightlyVersion,
  resolveLatestV1Version,
  resolveRNCoreArtifact,
  resolveRNDepsArtifact,
  exists,
  formatBytes,
  formatSpeed,
  findFirst,
  extractXCFramework,
};
