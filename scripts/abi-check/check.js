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
import type {AbiReport} from './index';
import type {HeaderLayout} from './layout';
import type {SkippedHeader} from './skipped-headers';

const {
  fbjniLayout,
  fbjniVersionFromCatalog,
  publishedLayout,
} = require('./artifacts');
const {dumpHeaders} = require('./dump');
const {abiReport} = require('./index');
const {mergeLayouts} = require('./layout');
const {SKIPPED_HEADERS} = require('./skipped-headers');
const {androidSourceLayout, iosSourceLayout} = require('./source');
const {stableApiHeaders} = require('./tiers');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

export type Side =
  {kind: 'version', version: string} | {kind: 'checkout', root: string};

export type CheckOptions = {
  platform: Platform,
  buildType: BuildType,
  /** The published version to compare against. */
  base: string,
  current: Side,
  /** Where downloaded artifacts and their extracted headers are kept. */
  cacheDir: string,
};

export type CheckResult = {
  ...AbiReport,
  /** The number of headers each side was dumped with. */
  headerCounts: {base: number, current: number},
  /** The number of layouts, vtables and enums each side dumped. */
  keyCounts: {base: number, current: number},
  /** The stable API headers left out by the skip list. */
  skippedHeaders: Array<string>,
};

/** The clang settings of a dump, other than its headers and search paths. */
export type DumpSettings = {
  platform?: Platform,
  buildType?: BuildType,
  clang?: string,
  sysroot?: string,
};

const NAMESPACE_PATTERN: RegExp = /^facebook::(?:react|yoga|jsi)::/;

/**
 * The stable API headers of either layout, each side with those it has. A
 * header that only one side declares stable is still dumped on both, so
 * that a change of tier alone does not report its types as removed or added.
 */
function headersToCompare(
  base: HeaderLayout,
  current: HeaderLayout,
  platform: Platform,
): {base: Array<string>, current: Array<string>} {
  const union = new Set([
    ...stableApiHeaders(base.headers, platform),
    ...stableApiHeaders(current.headers, platform),
  ]);
  const withHeadersOf = (layout: HeaderLayout) =>
    [...union].filter(header => layout.headers.has(header)).sort();
  return {base: withHeadersOf(base), current: withHeadersOf(current)};
}

async function currentLayout(
  {current, platform, buildType, cacheDir}: CheckOptions,
  base: HeaderLayout,
  outDir: string,
): Promise<HeaderLayout> {
  if (current.kind === 'version') {
    return publishedLayout({
      version: current.version,
      platform,
      buildType,
      cacheDir,
    });
  }
  const packageDir = path.join(current.root, 'packages', 'react-native');
  const source =
    platform === 'ios'
      ? // The headers spec comes from this repository's prebuild scripts,
        // whatever the checkout's version: another version is laid out by
        // today's rules, which can differ from those that built its artifacts.
        iosSourceLayout(packageDir, outDir)
      : mergeLayouts([
          androidSourceLayout(packageDir, outDir),
          await fbjniLayout(
            fbjniVersionFromCatalog(
              fs.readFileSync(
                path.join(packageDir, 'gradle', 'libs.versions.toml'),
                'utf8',
              ),
            ),
            cacheDir,
          ),
        ]);
  // The source tree has no third-party, codegen or Hermes headers. Clang
  // finds them in the base artifacts, after the headers of the source tree.
  return {
    includeDirs: [...source.includeDirs, ...base.includeDirs],
    frameworkDirs: [...source.frameworkDirs, ...base.frameworkDirs],
    headers: source.headers,
  };
}

/**
 * The NDK's clang and sysroot: from ANDROID_NDK_HOME, else the newest NDK
 * of the Android SDK.
 */
function androidToolchain(): {clang: string, sysroot: string} {
  const sdk =
    process.env.ANDROID_HOME ??
    process.env.ANDROID_SDK_ROOT ??
    path.join(os.homedir(), 'Library', 'Android', 'sdk');
  const ndks = path.join(sdk, 'ndk');
  const newestNdk = fs.existsSync(ndks)
    ? fs
        .readdirSync(ndks)
        .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))
        .at(-1)
    : null;
  const ndk =
    process.env.ANDROID_NDK_HOME ??
    (newestNdk != null ? path.join(ndks, newestNdk) : null);
  if (ndk == null) {
    throw new Error(
      `Android needs the NDK. Set ANDROID_NDK_HOME, or install an NDK in ${ndks}.`,
    );
  }
  const host = process.platform === 'darwin' ? 'darwin' : 'linux';
  const toolchain = path.join(
    ndk,
    'toolchains',
    'llvm',
    'prebuilt',
    `${host}-x86_64`,
  );
  return {
    clang: path.join(toolchain, 'bin', 'clang++'),
    sysroot: path.join(toolchain, 'sysroot'),
  };
}

/**
 * The headers that `entries` skip for `platform` when comparing `versions`,
 * the base and the current version.
 */
function skippedHeadersFor(
  entries: ReadonlyArray<SkippedHeader>,
  platform: Platform,
  versions: ReadonlyArray<string>,
): Set<string> {
  return new Set(
    entries
      .filter(
        entry =>
          entry.platform === platform &&
          (entry.versions == null ||
            entry.versions.some(version => versions.includes(version))),
      )
      .map(entry => entry.header),
  );
}

/** The published version, or the version of a checkout's package.json. */
function sideVersion(side: Side): string {
  if (side.kind === 'version') {
    return side.version;
  }
  const packageJson = path.join(
    side.root,
    'packages',
    'react-native',
    'package.json',
  );
  return String(JSON.parse(fs.readFileSync(packageJson, 'utf8')).version);
}

/**
 * Dumps the stable API headers of both layouts, without the `skipped`
 * headers, and compares them. Rejects with the name of any other header that
 * does not compile.
 */
async function compareLayouts(
  base: HeaderLayout,
  current: HeaderLayout,
  platform: Platform,
  settings: DumpSettings,
  skipped: ReadonlySet<string>,
): Promise<CheckResult> {
  const headers = headersToCompare(base, current, platform);
  const kept = (layoutHeaders: Array<string>) =>
    layoutHeaders.filter(header => !skipped.has(header));
  const dump = (layout: HeaderLayout, layoutHeaders: Array<string>) =>
    dumpHeaders({
      ...settings,
      headers: layoutHeaders,
      includeDirs: layout.includeDirs,
      frameworkDirs: layout.frameworkDirs,
      namespacePattern: NAMESPACE_PATTERN,
    });
  const baseHeaders = kept(headers.base);
  const currentHeaders = kept(headers.current);
  const [baseLayouts, currentLayouts] = await Promise.all([
    dump(base, baseHeaders),
    dump(current, currentHeaders),
  ]);
  return {
    ...abiReport(baseLayouts, currentLayouts),
    headerCounts: {base: baseHeaders.length, current: currentHeaders.length},
    keyCounts: {base: baseLayouts.size, current: currentLayouts.size},
    skippedHeaders: [...new Set([...headers.base, ...headers.current])]
      .filter(header => skipped.has(header))
      .sort(),
  };
}

/**
 * Compares the C++ ABI of the stable API headers of a published version with
 * that of another published version or a checkout.
 */
async function checkAbi(options: CheckOptions): Promise<CheckResult> {
  const {platform, buildType, cacheDir} = options;
  const base = await publishedLayout({
    version: options.base,
    platform,
    buildType,
    cacheDir,
  });
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-source-'));
  try {
    const current = await currentLayout(options, base, outDir);
    return await compareLayouts(
      base,
      current,
      platform,
      {
        platform,
        buildType,
        ...(platform === 'android' ? androidToolchain() : {}),
      },
      skippedHeadersFor(SKIPPED_HEADERS, platform, [
        options.base,
        sideVersion(options.current),
      ]),
    );
  } finally {
    fs.rmSync(outDir, {recursive: true, force: true});
  }
}

module.exports = {
  NAMESPACE_PATTERN,
  checkAbi,
  compareLayouts,
  headersToCompare,
  sideVersion,
  skippedHeadersFor,
};
