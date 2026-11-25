/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {Platform} from './dump';

const fs = require('node:fs');
const path = require('node:path');

// Keep in sync with scripts/cxx-api/parser/tiers.py.
const GUARD =
  /^\s*#\s*include\s*[<"]react\/cxxstableapi\/(Private|Frameworks|Umbrella)Guard\.h[>"]/m;
const GUARD_DIR = '/react/cxxstableapi/';
const STABLE_API_GUARDS = new Set(['Frameworks', 'Umbrella']);

// Keep in sync with _TEMPLATE_EXCLUDE_PATTERNS in
// scripts/cxx-api/parser/__main__.py and with scripts/cxx-api/config.yml: the
// top-level list, then the ReactApple or ReactAndroid view's list.
const TEMPLATE_EXCLUDE_PATTERNS = ['*/tests/*', '*/samples/*'];
const GLOBAL_EXCLUDE_PATTERNS = [
  '*/ReactCommon/react/nativemodule/fantomtestspecificmethods/*',
  '*/ReactCommon/react/nativemodule/featureflags/*',
  '*/ReactCommon/react/featureflags/*',
  '*/test_utils/*',
  '*/test/*',
  '*/test_helper/*',
  '*/stubs/*',
  '*/metainternal/*',
];
const PLATFORM_EXCLUDE_PATTERNS: {
  readonly [platform: Platform]: Array<string>,
} = {
  ios: [
    '*/jni/*',
    '*/platform/cxx/*',
    '*/platform/windows/*',
    '*/platform/macos/*',
    '*/platform/android/*',
    '*+Private.h',
    '*+Internal.h',
    '*/scripts/*',
    '*/templates/*',
    '*/components/progressbar/android/*',
    '*/components/switch/androidswitch/*',
  ],
  android: [
    '*/ReactAndroid/src/main/jni/react/featureflags/*',
    '*/components/switch/iosswitch/*',
    '*/components/inputaccessory/*',
    '*/platform/cxx/*',
    '*/platform/windows/*',
    '*/platform/macos/*',
    '*/platform/ios/*',
  ],
};

// The source folders that the iOS and Android builds ship as include roots.
// The headers below them keep their paths in `#include <...>`.
const SOURCE_INCLUDE_ROOTS = ['*/ReactCommon/', '*/ReactAndroid/src/main/jni/'];

/**
 * The fnmatch patterns of the headers that the C++ API snapshot of `platform`
 * leaves out. The C++ API snapshot matches them against source-tree paths.
 */
function excludePatterns(platform: Platform): Array<string> {
  return [
    ...new Set([
      ...TEMPLATE_EXCLUDE_PATTERNS,
      ...GLOBAL_EXCLUDE_PATTERNS,
      ...PLATFORM_EXCLUDE_PATTERNS[platform],
    ]),
  ];
}

/** Python's `fnmatch.fnmatchcase`, without `[...]` sets, which no list uses. */
function fnmatchRegExp(pattern: string): RegExp {
  if (pattern.includes('[')) {
    throw new Error(`Unsupported exclude pattern: ${pattern}`);
  }
  const source = pattern
    .split('')
    .map(char =>
      char === '*'
        ? '.*'
        : char === '?'
          ? '.'
          : char.replace(/[.+^${}()|\]\\/]/, '\\$&'),
    )
    .join('');
  return new RegExp(`^${source}$`, 's');
}

/**
 * `pattern` as matched against `/` and an include path. A pattern that starts
 * with a source include root, such as the one for ReactCommon's feature
 * flags, matches from the include root instead.
 */
function includePathPattern(pattern: string): RegExp {
  const root = SOURCE_INCLUDE_ROOTS.find(prefix => pattern.startsWith(prefix));
  return fnmatchRegExp(
    root != null ? `/${pattern.slice(root.length)}` : pattern,
  );
}

const PLATFORM_FOLDER_COPY = /^(?:.*\/)?platform\/[^/]+\/(.+)$/;

function walkHeaders(dir: string): Array<string> {
  return fs.readdirSync(dir).flatMap(name => {
    const entryPath = path.join(dir, name);
    // lstat, so that symlinked directories are not followed, like os.walk.
    if (fs.lstatSync(entryPath).isDirectory()) {
      return walkHeaders(entryPath);
    }
    return name.endsWith('.h') ? [entryPath] : [];
  });
}

/**
 * Whether `file`, at `pathInRoot` below a header root, declares the public or
 * for-frameworks tier with the first `react/cxxstableapi/*Guard.h` it
 * includes, and no `excluded` pattern matches `/` and `pathInRoot`.
 */
function isStableApiHeader(
  pathInRoot: string,
  file: string,
  excluded: ReadonlyArray<RegExp>,
): boolean {
  const rooted = `/${pathInRoot}`;
  if (
    rooted.includes(GUARD_DIR) ||
    excluded.some(pattern => pattern.test(rooted))
  ) {
    return false;
  }
  const guard = fs.readFileSync(file, 'utf8').match(GUARD)?.[1];
  return guard != null && STABLE_API_GUARDS.has(guard);
}

/**
 * Returns the include paths, sorted, of the `headers` in the public or
 * for-frameworks tier of the C++ stable API, without those that the C++ API
 * snapshot of `platform` excludes. `headers` maps each include path, the path
 * written in `#include <...>`, to its file.
 *
 * The verdict depends only on the include path and the file, so a header gets
 * the same verdict from the source tree and from a Maven artifact. A header at
 * `.../platform/<name>/<path>` is left out when `<path>` is also in
 * `headers`: the prefab modules copy platform folders whole, and also put one
 * platform's folder at the include root, where code includes it from. A
 * header that is only in a platform folder stays.
 */
function stableApiHeaders(
  headers: ReadonlyMap<string, string>,
  platform: Platform,
): Array<string> {
  const excluded = excludePatterns(platform).map(includePathPattern);
  return [...headers]
    .filter(
      ([includePath, file]) =>
        !headers.has(includePath.match(PLATFORM_FOLDER_COPY)?.[1] ?? '') &&
        isStableApiHeader(includePath, file, excluded),
    )
    .map(([includePath]) => includePath)
    .sort();
}

/**
 * Returns the absolute paths, sorted, of the headers in the source tree under
 * `headerRoot` that are in the public or for-frameworks tier of the C++
 * stable API, without those that the C++ API snapshot of `platform` excludes.
 */
function collectStableApiHeaders(
  headerRoot: string,
  platform: Platform,
): Array<string> {
  const root = path.resolve(headerRoot);
  const excluded = excludePatterns(platform).map(includePathPattern);
  return walkHeaders(root)
    .filter(header =>
      isStableApiHeader(
        path.relative(root, header).split(path.sep).join('/'),
        header,
        excluded,
      ),
    )
    .sort();
}

module.exports = {collectStableApiHeaders, excludePatterns, stableApiHeaders};
