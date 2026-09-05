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
  findPodspecs,
  readPodspecCached,
  readPodspecNames,
} = require('./read-podspec');
const {
  RESERVED_SWIFT_NAMES,
  isValidSwiftName,
  makeLogger,
  swiftNameKey,
  toC99Name,
  toSwiftName,
} = require('./spm-utils');
const {readSwiftpmConfig, stringList} = require('./swiftpm-config');
const fs = require('node:fs');
const path = require('node:path');

const {warn} = makeLogger('expand-spm-dependencies');

/**
 * expand-spm-dependencies.js — Resolves transitive native deps a library
 * declares in its `swiftpmConfig`.
 *
 * SPM has no equivalent of CocoaPods' podspec `s.dependency`, so library
 * authors declare the same relationships explicitly:
 *
 *   // react-native-reanimated/package.json
 *   { "swiftpmConfig": { "dependencies": ["react-native-worklets"] } }
 *
 * This module reads the directly-autolinked deps (from autolinking.json),
 * follows each one's declared dependencies recursively, and returns the deduped
 * list with autolinking-shaped entries so the downstream pipeline can convert
 * each to an SPM target without further branching.
 *
 * It also resolves each dep's Swift target name — see resolveSwiftName.
 *
 * I/O is injected (readConfig, resolveDep, readPodspec) so the logic stays pure
 * and testable.
 */

/*::
import type {AutolinkedDep} from './spm-types';
import type {SwiftpmConfig} from './swiftpm-config';

// react-native.config.js entries have a user-defined shape, so we use an
// inexact object type and access properties dynamically.
type RnConfig = {...};
type ReadConfig = (root: string) => ?RnConfig;
type ResolveDep = (name: string, fromRoot: string) => ?string;
// Where a resolved name came from: what the library declared, what its podspec
// says, or the npm-name guess. `podspecKey` narrows a podspec-sourced name to
// the field it was read from — `header_dir` and `module_name` can name the same
// library differently, and only one of them wins.
type PodspecNameKey = 'header_dir' | 'module_name' | 'name';
type ResolvedSwiftName = {
  name: string,
  source: 'config' | 'podspec' | 'npm',
  podspecKey?: PodspecNameKey,
};
// The podspec fields that name a library. A PodspecModel satisfies it.
type PodspecFacts = {
  readonly name?: ?string,
  readonly moduleName?: ?string,
  readonly headerDir?: ?string,
  ...
};
type ReadPodspec = (root: string, podspecPath: ?string) => ?PodspecFacts;
type ReadSwiftpmConfig = (root: string, rnConfig: ?RnConfig) => ?SwiftpmConfig;
// Keyed by swiftNameKey, valued with the canonical spelling: a name that only
// differs from a reserved one in case or punctuation is not distinct enough for
// the build to keep the two apart.
type ReservedNames = ReadonlyMap<string, string>;
type Options = {
  readConfig: ReadConfig,
  resolveDep: ResolveDep,
  readPodspec?: ?ReadPodspec,
  readSwiftpmConfig?: ?ReadSwiftpmConfig,
  // Names to reserve alongside RESERVED_SWIFT_NAMES, supplied by the caller
  // (remote mode relabels the RN package) since this module reads no config.
  extraReservedNames?: ?ReadonlyArray<string>,
};
*/

/**
 * A misconfiguration rather than a resolution failure: scaffoldAll degrades past
 * a transitive dep it cannot find, but must still surface this.
 */
class SpmNameCollisionError extends Error {
  constructor(message /*: string */) {
    super(message);
    this.name = 'SpmNameCollisionError';
  }
}

function reservedSwiftNames(
  extraReservedNames /*: ?ReadonlyArray<string> */,
) /*: ReservedNames */ {
  return new Map(
    [...RESERVED_SWIFT_NAMES, ...(extraReservedNames ?? [])].map(name => [
      swiftNameKey(name),
      name,
    ]),
  );
}

// The prefix a podspec publishes its headers under, and the field it came from
// — or null when the podspec declares none. A prefix Swift cannot spell is
// normalized rather than abandoned: reverting to the npm name would silently
// produce a prefix nothing imports.
function podspecSwiftName(
  npmName /*: string */,
  podspec /*: ?PodspecFacts */,
) /*: ?{name: string, key: PodspecNameKey} */ {
  // CocoaPods' own order is `module_name` first (specification.rb), but our
  // single name is the ObjC include prefix as well as the Swift module: a
  // declared `header_dir` IS the prefix a library's consumers write, so it keeps
  // winning. `module_name` comes next, being what Swift and `@import` consumers
  // spell, and the pod name — often dashed — is the last resort.
  const candidates /*: ReadonlyArray<[PodspecNameKey, ?string]> */ = [
    ['header_dir', podspec?.headerDir],
    ['module_name', podspec?.moduleName],
    ['name', podspec?.name],
  ];
  for (const [key, candidate] of candidates) {
    if (typeof candidate !== 'string' || candidate.length === 0) {
      continue;
    }
    // Ruby the evaluator never ran: what the prefix would be is unknowable, so
    // the npm name is the honest answer — and, not being derived, it is not
    // recorded in the library's package.json.
    if (candidate.includes('#{')) {
      return null;
    }
    if (isValidSwiftName(candidate)) {
      return {name: candidate, key};
    }
    const normalized = toC99Name(candidate);
    warn(
      `'${npmName}' declares the podspec prefix '${candidate}', which is not a valid Swift target name; using '${normalized}'. ` +
        `Set 'swiftpmConfig.name' in ${npmName}'s package.json to choose the prefix yourself.`,
    );
    return {name: normalized, key};
  }
  return null;
}

/**
 * The Swift target name for one dep, which is also the prefix its headers are
 * imported under (`#import <Name/Header.h>`), and where it came from. The name
 * a library declares wins; the podspec is the transitional source of truth
 * behind it — `react-native-svg` publishes `RNSVG`, not `ReactNativeSvg` — in
 * the order `header_dir` → `module_name` → pod name. The npm name is the last
 * resort, for a library that ships a `Package.swift` and no podspec.
 *
 * The source is what tells the scaffolder which names are safe to write into a
 * library's package.json: a derived one, never a guessed one.
 */
function resolveSwiftName(
  npmName /*: string */,
  spmConfig /*: ?SwiftpmConfig */,
  podspec /*: ?PodspecFacts */,
) /*: ResolvedSwiftName */ {
  const declared = spmConfig?.name;
  if (declared != null) {
    if (typeof declared !== 'string' || declared.length === 0) {
      throw new Error(
        `react-native autolinking: '${npmName}' declares an invalid SwiftPM name: expected a non-empty string, got ${String(declared)}. Set 'swiftpmConfig.name' in its package.json.`,
      );
    }
    if (!isValidSwiftName(declared)) {
      throw new Error(
        `react-native autolinking: '${npmName}' declares an invalid SwiftPM name '${declared}': must start with a letter or underscore and contain only letters, digits, underscores, or hyphens. Set 'swiftpmConfig.name' in its package.json.`,
      );
    }
    return {name: declared, source: 'config'};
  }

  const fromPodspec = podspecSwiftName(npmName, podspec);
  if (fromPodspec != null) {
    return {
      name: fromPodspec.name,
      source: 'podspec',
      podspecKey: fromPodspec.key,
    };
  }
  const fromNpm = toSwiftName(npmName);
  if (podspec != null) {
    warn(
      `'${npmName}' ships a podspec React Native could not read a name from (CocoaPods may not be installed), so it is named '${fromNpm}' after its npm package instead. ` +
        `A machine that can read the podspec may resolve a different name — set 'swiftpmConfig.name' in ${npmName}'s package.json to settle it everywhere.`,
    );
  }
  return {name: fromNpm, source: 'npm'};
}

function collisionDiagnosis(
  existing /*: string */,
  swiftName /*: string */,
) /*: string */ {
  if (existing === swiftName) {
    return `both resolve to '${swiftName}'.`;
  }
  if (existing.toLowerCase() === swiftName.toLowerCase()) {
    return `differ only in case, which collides on case-insensitive filesystems.`;
  }
  return `both compile as the module '${toC99Name(swiftName)}' — SwiftPM replaces every character C99 rejects.`;
}

// Vaguer about the clash than the dep-vs-dep message on purpose: this set spans
// package identities and product names, which collide differently.
function reservedDiagnosis(
  swiftName /*: string */,
  reservedName /*: string */,
) /*: string */ {
  if (reservedName === swiftName) {
    return `which React Native reserves for its own SPM package and products.`;
  }
  if (reservedName.toLowerCase() === swiftName.toLowerCase()) {
    return `which differs from React Native's reserved '${reservedName}' only in case — not distinct enough for the build to keep the two apart.`;
  }
  return `which compiles as the same module as React Native's reserved '${reservedName}'.`;
}

function assertNameNotReserved(
  swiftName /*: string */,
  reserved /*: ReservedNames */,
  labels /*: {label: string, remedy: string} */,
) /*: void */ {
  const reservedName = reserved.get(swiftNameKey(swiftName));
  if (reservedName == null) {
    return;
  }
  throw new SpmNameCollisionError(
    `react-native autolinking: SPM Swift name collision: ${labels.label} resolves to '${swiftName}', ` +
      reservedDiagnosis(swiftName, reservedName) +
      ` ${labels.remedy}`,
  );
}

/**
 * Throws when `swiftName` is one React Native's own manifests use. `remedy` is
 * the fix: a library sets `swiftpmConfig.name`, an app renames its
 * `swiftpmConfig.modules` entry.
 */
function assertSwiftNameNotReserved(
  swiftName /*: string */,
  options /*: {
    label: string,
    remedy: string,
    extraReservedNames?: ?ReadonlyArray<string>,
  } */,
) /*: void */ {
  const {label, remedy, extraReservedNames} = options;
  assertNameNotReserved(swiftName, reservedSwiftNames(extraReservedNames), {
    label,
    remedy,
  });
}

// Reserved-name backstop over the resolved set. Unconditional: a plugin-shipping
// library is checked like any other, so `spm scaffold` — which knows nothing
// about plugins — cannot disagree with the autolinker about the same dep.
function assertNoReservedSwiftNames(
  deps /*: ReadonlyArray<AutolinkedDep> */,
  reserved /*: ReservedNames */,
) /*: void */ {
  for (const dep of deps) {
    const swiftName = dep.swiftName;
    if (swiftName == null) {
      continue;
    }
    assertNameNotReserved(swiftName, reserved, {
      label: `'${dep.name}'`,
      remedy: `Set a different 'swiftpmConfig.name' in ${dep.name}'s package.json.`,
    });
  }
}

function expandSpmDependencies(
  directDeps /*: Array<AutolinkedDep> */,
  options /*: Options */,
) /*: Array<AutolinkedDep> */ {
  const {readConfig, resolveDep, readPodspec, extraReservedNames} = options;
  const spmConfigOf = options.readSwiftpmConfig ?? readSwiftpmConfig;
  const reserved = reservedSwiftNames(extraReservedNames);
  const byName /*: Map<string, AutolinkedDep> */ = new Map();
  for (const dep of directDeps) {
    byName.set(dep.name, {...dep, spmDependencies: []});
  }
  // A podspec that cannot be read leaves the name to the next precedence step,
  // rather than failing a build over a file only CocoaPods needs.
  const podspecFor = (
    root /*: string */,
    podspecPath /*: ?string */,
  ) /*: ?PodspecFacts */ => {
    if (readPodspec == null) {
      return null;
    }
    try {
      return readPodspec(root, podspecPath);
    } catch {
      return null;
    }
  };

  const queue /*: Array<string> */ = directDeps.map(d => d.name);
  while (queue.length > 0) {
    const currentName = queue.shift();
    if (typeof currentName !== 'string') {
      continue;
    }
    const current = byName.get(currentName);
    if (current == null) {
      continue;
    }
    const spmConfig = spmConfigOf(current.root, readConfig(current.root));
    if (current.swiftName == null) {
      const resolved = resolveSwiftName(
        currentName,
        spmConfig,
        podspecFor(current.root, current.platforms.ios.podspecPath),
      );
      current.swiftName = resolved.name;
      current.swiftNameSource = resolved.source;
      current.swiftNamePodspecKey = resolved.podspecKey;
    }
    const transitives = stringList(spmConfig?.dependencies);

    const currentSpmDeps /*: Array<string> */ = [];
    for (const transitiveName of transitives) {
      if (!byName.has(transitiveName)) {
        const transitiveRoot = resolveDep(transitiveName, current.root);
        if (transitiveRoot == null) {
          throw new Error(
            `react-native autolinking: '${currentName}' declares an unresolvable SwiftPM dependency '${transitiveName}'. Ensure '${transitiveName}' is installed and visible via Node module resolution from ${current.root}.`,
          );
        }

        const transitiveConfig = readConfig(transitiveRoot);
        // $FlowFixMe[prop-missing] config has dynamic shape
        const iosPlatform = transitiveConfig?.dependency?.platforms?.ios;
        if (iosPlatform == null) {
          // No iOS native code — nothing to autolink and nothing to declare
          // as an SPM target dep; mirrors the silent skip in
          // autolinkingDepToSpmTarget for android-only deps.
          continue;
        }

        const resolved = resolveSwiftName(
          transitiveName,
          spmConfigOf(transitiveRoot, transitiveConfig),
          podspecFor(transitiveRoot, iosPlatform.podspecPath),
        );
        byName.set(transitiveName, {
          name: transitiveName,
          root: transitiveRoot,
          platforms: {ios: iosPlatform},
          swiftName: resolved.name,
          swiftNameSource: resolved.source,
          swiftNamePodspecKey: resolved.podspecKey,
          spmDependencies: [],
        });
        queue.push(transitiveName);
      }
      currentSpmDeps.push(transitiveName);
    }
    current.spmDependencies = currentSpmDeps;
  }

  const allDeps /*: Array<AutolinkedDep> */ = Array.from(byName.values());

  assertNoReservedSwiftNames(allDeps, reserved);

  // Collision check: two deps mapping to the same Swift name would clobber each
  // other in the synth package layout and the centralized headers tree. Surface
  // it now with a clear message instead of letting SPM emit a confusing
  // duplicate-target error later. swiftNameKey is what makes two names two
  // targets — punctuation collapses into one module, case into one directory.
  const seen /*: Map<string, {name: string, swiftName: string}> */ = new Map();
  for (const dep of allDeps) {
    const swiftName = dep.swiftName;
    if (swiftName == null) {
      continue;
    }
    const key = swiftNameKey(swiftName);
    const existing = seen.get(key);
    if (existing != null) {
      throw new SpmNameCollisionError(
        `react-native autolinking: SPM Swift name collision: '${existing.name}' ('${existing.swiftName}') and '${dep.name}' ('${swiftName}') ` +
          collisionDiagnosis(existing.swiftName, swiftName) +
          ` Set a distinct 'swiftpmConfig.name' in one of their package.json files.`,
      );
    }
    seen.set(key, {name: dep.name, swiftName});
  }

  return allDeps;
}

// ---------------------------------------------------------------------------
// Default I/O implementations
// ---------------------------------------------------------------------------

function defaultReadConfig(root /*: string */) /*: ?RnConfig */ {
  const configPath = path.join(root, 'react-native.config.js');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    // $FlowFixMe[unsupported-syntax]
    const mod = require(configPath);
    // Read both export styles, because the community CLI's two loaders
    // disagree with each other: its sync path (`loadConfig`) requires the
    // module and sees named exports at top level, its async path
    // (`loadConfigAsync`) takes the default export only. Merging covers both,
    // with named exports winning — the shape the sync path already resolves.
    // Every sibling key of the default export is preserved
    // (`dependency.platforms.ios` is read from this result too).
    // A function-style config (`module.exports = () => ({...})`) and other
    // non-objects pass through untouched — there is no default export to
    // unwrap, and nulling them would hide a config that used to be read.
    if (mod == null || typeof mod !== 'object') {
      return mod;
    }
    const dflt = mod.default;
    if (dflt == null || typeof dflt !== 'object') {
      return mod;
    }
    const {default: _unused, ...named} = mod;
    return {...dflt, ...named};
  } catch (e) {
    // A config can fail to load for reasons unrelated to SPM (it may import a
    // devDependency absent in a consumer install), so this stays a warning —
    // but a silent null turns a dropped `spm` block into a link error much
    // later.
    warn(
      `Failed to load ${configPath}: ${e.message}. Any 'spm' settings in it are ignored.`,
    );
    return null;
  }
}

function defaultResolveDep(
  name /*: string */,
  fromRoot /*: string */,
) /*: ?string */ {
  try {
    const pkgJsonPath = require.resolve(`${name}/package.json`, {
      paths: [fromRoot],
    });
    return path.dirname(pkgJsonPath);
  } catch {
    return null;
  }
}

function defaultReadPodspec(
  root /*: string */,
  podspecPath /*: ?string */,
) /*: ?PodspecFacts */ {
  // Deps synthesized from declared dependencies carry no podspecPath — only
  // autolinking.json records one — so the dep root is searched as well.
  const found = podspecPath ?? findPodspecs(root)[0];
  if (found == null) {
    return null;
  }
  try {
    // Ruby-computed fields need the real evaluator; everything else is spared
    // the `pod ipc spec` spawn.
    return readPodspecNames(found) ?? readPodspecCached(found);
  } catch {
    return null;
  }
}

module.exports = {
  SpmNameCollisionError,
  assertSwiftNameNotReserved,
  expandSpmDependencies,
  resolveSwiftName,
  defaultReadConfig,
  defaultReadPodspec,
  defaultResolveDep,
};
