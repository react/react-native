/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {SpecEntry} from '../../packages/react-native/scripts/ios-prebuild/headers-spec';
import type {HeaderLayout} from './layout';

const {
  computeSpecPlan,
} = require('../../packages/react-native/scripts/ios-prebuild/headers-compose');
const {mergeLayouts} = require('./layout');
const fs = require('node:fs');
const path = require('node:path');

/**
 * One rule of ReactAndroid's preparePrefab task: the headers below `from`, a
 * path relative to ReactAndroid, go to `prefix` in the prefab `module`.
 */
export type PrefabHeaderRule = {module: string, from: string, prefix: string};

const SOURCE_PAIR = /^Pair\(\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,?\s*\)/;
const BUILD_DIR_PAIR =
  /^Pair\(\s*File\(buildDir,\s*"[^"]*"\)\.absolutePath\s*,\s*"[^"]*"\s*,?\s*\)/;

/**
 * Reads the prefab header rules from ReactAndroid's build.gradle.kts. The
 * rules that copy from the build folder, for the third-party and codegen
 * headers, are left out: the source tree does not have those headers.
 */
function prefabHeaderRules(gradleScript: string): Array<PrefabHeaderRule> {
  const entries = gradleScript.split('PrefabPreprocessingEntry(').slice(1);
  if (entries.length === 0) {
    throw new Error(
      'Found no prefab modules (PrefabPreprocessingEntry) in build.gradle.kts.',
    );
  }
  return entries.flatMap(entry => {
    const module = entry.match(/^\s*"([^"]+)"/)?.[1];
    if (module == null) {
      throw new Error(`Cannot read the prefab module name in: ${entry}`);
    }
    return entry
      .split(/(?=\bPair\()/)
      .slice(1)
      .flatMap(pair => {
        const source = pair.match(SOURCE_PAIR);
        if (source != null) {
          return [{module, from: source[1], prefix: source[2]}];
        }
        if (BUILD_DIR_PAIR.test(pair)) {
          return [];
        }
        throw new Error(
          `Cannot read the prefab header rule ${pair.slice(0, pair.indexOf(')') + 1)}`,
        );
      });
  });
}

/** The `.h` files that a prefab rule copies from `from`, by their new paths. */
function prefabRuleHeaders(
  from: string,
  prefix: string,
): Array<[string, string]> {
  if (!fs.existsSync(from)) {
    return [];
  }
  const [dir, relativePaths] = fs.statSync(from).isDirectory()
    ? [from, fs.readdirSync(from, {recursive: true, encoding: 'utf8'})]
    : [path.dirname(from), [path.basename(from)]];
  return relativePaths
    .filter(relativePath => relativePath.endsWith('.h'))
    .map(relativePath => [
      path.posix.join(prefix, relativePath.split(path.sep).join('/')),
      path.join(dir, relativePath),
    ]);
}

function copyHeaders(
  dir: string,
  sources: ReadonlyMap<string, string>,
): HeaderLayout {
  const headers: Map<string, string> = new Map();
  for (const [includePath, source] of sources) {
    const destination = path.join(dir, includePath);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.copyFileSync(source, destination);
    headers.set(includePath, destination);
  }
  return {includeDirs: [dir], frameworkDirs: [], headers};
}

/**
 * Copies the headers of the React Native package at `packageDir` to `outDir`
 * as the react-android AAR's prefab modules ship them, one folder per module.
 * A later rule replaces a header that an earlier rule copied, as in Gradle.
 */
function androidSourceLayout(packageDir: string, outDir: string): HeaderLayout {
  const reactAndroid = path.join(packageDir, 'ReactAndroid');
  const rules = prefabHeaderRules(
    fs.readFileSync(path.join(reactAndroid, 'build.gradle.kts'), 'utf8'),
  );
  const modules: Map<string, Map<string, string>> = new Map();
  for (const {module, from, prefix} of rules) {
    const headers = modules.get(module) ?? new Map();
    modules.set(module, headers);
    for (const [includePath, file] of prefabRuleHeaders(
      path.resolve(reactAndroid, from),
      prefix,
    )) {
      headers.set(includePath, file);
    }
  }
  return mergeLayouts(
    [...modules]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, headers]) =>
        copyHeaders(path.join(outDir, module), headers),
      ),
  );
}

/** The parts of the iOS prebuild's headers spec that the check lays out. */
export type IosHeadersPlan = {
  readonly react: ReadonlyArray<Readonly<SpecEntry>>,
  readonly reactNativeHeaders: ReadonlyArray<Readonly<SpecEntry>>,
  ...
};

/** Writes each entry below `dir`, as a copy or as a redirect to its home. */
function writeSpecEntries(
  dir: string,
  entries: ReadonlyArray<Readonly<SpecEntry>>,
  packageDir: string,
): Map<string, string> {
  const headers: Map<string, string> = new Map();
  for (const {relPath, source, redirectTo} of entries) {
    const destination = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    if (redirectTo != null) {
      fs.writeFileSync(destination, `#import <${redirectTo}>\n`);
    } else {
      fs.copyFileSync(path.join(packageDir, source), destination);
    }
    headers.set(relPath, destination);
  }
  return headers;
}

/**
 * Writes the headers of the React Native package at `packageDir` to `outDir`
 * as the iOS core ships them: ReactNativeHeaders in `Headers`, and
 * React.framework, whose headers are included as `<React/...>`, in
 * `Frameworks`. `plan` defaults to the headers spec of the iOS prebuild.
 */
function iosSourceLayout(
  packageDir: string,
  outDir: string,
  plan: IosHeadersPlan = computeSpecPlan(packageDir),
): HeaderLayout {
  const headersDir = path.join(outDir, 'Headers');
  const frameworksDir = path.join(outDir, 'Frameworks');
  const reactHeaders = writeSpecEntries(
    path.join(frameworksDir, 'React.framework', 'Headers'),
    plan.react,
    packageDir,
  );
  return mergeLayouts([
    {
      includeDirs: [headersDir],
      frameworkDirs: [frameworksDir],
      headers: writeSpecEntries(
        headersDir,
        plan.reactNativeHeaders,
        packageDir,
      ),
    },
    {
      includeDirs: [],
      frameworkDirs: [],
      headers: new Map(
        [...reactHeaders].map(([header, file]) => [`React/${header}`, file]),
      ),
    },
  ]);
}

module.exports = {androidSourceLayout, iosSourceLayout, prefabHeaderRules};
