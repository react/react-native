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

const {toSwiftName} = require('./spm-utils');
const fs = require('fs');
const path = require('path');

/**
 * expand-spm-dependencies.js — Resolves transitive native deps declared via
 * `spm.dependencies` in a library's react-native.config.js.
 *
 * SPM has no equivalent of CocoaPods' podspec `s.dependency`, so library
 * authors declare the same relationships explicitly:
 *
 *   // react-native-reanimated/react-native.config.js
 *   module.exports = {
 *     dependency: { platforms: { ios: {} } },
 *     spm: { dependencies: ['react-native-worklets'] },
 *   };
 *
 * This module reads the directly-autolinked deps (from autolinking.json),
 * follows each one's spm.dependencies recursively, and returns the deduped
 * list with autolinking-shaped entries so the downstream pipeline can convert
 * each to an SPM target without further branching.
 *
 * I/O is injected (readConfig, resolveDep) so the logic stays pure and
 * testable.
 */

/*::
import type {AutolinkedDep} from './spm-types';

// react-native.config.js entries have a user-defined shape, so we use an
// inexact object type and access properties dynamically.
type RnConfig = {...};
type ReadConfig = (root: string) => ?RnConfig;
type ResolveDep = (name: string, fromRoot: string) => ?string;
type Options = {
  readConfig: ReadConfig,
  resolveDep: ResolveDep,
};
*/

// Validates and returns the Swift target name for a dep. Falls back to
// toSwiftName(npmName) when no override is set. The override is the dep's
// `react-native.config.js` `spm.name`, intended for libraries whose import
// prefix differs from the auto-derived name (e.g. `react-native-worklets`
// publishes headers under `<worklets/...>` via the podspec `s.header_dir`,
// so the SPM target name should be `worklets`, not `ReactNativeWorklets`).
function resolveSwiftName(
  npmName /*: string */,
  config /*: ?RnConfig */,
) /*: string */ {
  // $FlowFixMe[prop-missing] config has dynamic shape
  const override = config?.spm?.name;
  if (override == null) {
    return toSwiftName(npmName);
  }
  if (typeof override !== 'string' || override.length === 0) {
    throw new Error(
      `react-native autolinking: '${npmName}' has an invalid 'spm.name' override: expected a non-empty string, got ${JSON.stringify(override)}.`,
    );
  }
  // Accept Swift-identifier style (TitleCase / snake_case) and header-dir
  // style (lowercase, optional hyphens). Reject whitespace, slashes, and
  // other characters that would break SPM target / module identifiers.
  if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(override)) {
    throw new Error(
      `react-native autolinking: '${npmName}' has an invalid 'spm.name' override '${override}': must start with a letter or underscore and contain only letters, digits, underscores, or hyphens.`,
    );
  }
  return override;
}

function expandSpmDependencies(
  directDeps /*: Array<AutolinkedDep> */,
  options /*: Options */,
) /*: Array<AutolinkedDep> */ {
  const {readConfig, resolveDep} = options;
  const byName /*: Map<string, AutolinkedDep> */ = new Map();
  for (const dep of directDeps) {
    byName.set(dep.name, {...dep, spmDependencies: []});
  }

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
    const config = readConfig(current.root);
    // Resolve swiftName lazily from the same config read we already need for
    // spm.dependencies — saves a duplicate readConfig call per direct dep.
    if (current.swiftName == null) {
      current.swiftName = resolveSwiftName(currentName, config);
    }
    // $FlowFixMe[prop-missing] config has dynamic shape
    const transitives /*: Array<string> */ = config?.spm?.dependencies ?? [];

    const currentSpmDeps /*: Array<string> */ = [];
    for (const transitiveName of transitives) {
      if (!byName.has(transitiveName)) {
        const transitiveRoot = resolveDep(transitiveName, current.root);
        if (transitiveRoot == null) {
          throw new Error(
            `react-native autolinking: '${currentName}' declares an unresolvable spm.dependency '${transitiveName}'. Ensure '${transitiveName}' is installed and visible via Node module resolution from ${current.root}.`,
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

        byName.set(transitiveName, {
          name: transitiveName,
          root: transitiveRoot,
          platforms: {ios: iosPlatform},
          swiftName: resolveSwiftName(transitiveName, transitiveConfig),
          spmDependencies: [],
        });
        queue.push(transitiveName);
      }
      currentSpmDeps.push(transitiveName);
    }
    current.spmDependencies = currentSpmDeps;
  }

  // Collision check: two deps mapping to the same Swift name (whether via
  // override or auto-derivation) would clobber each other in the synth
  // package layout and the centralized headers tree. Surface it now with a
  // clear message instead of letting SPM emit a confusing duplicate-target
  // error later.
  // Key case-INSENSITIVELY: resolveSwiftName permits lowercase ('worklets')
  // while toSwiftName produces TitleCase ('Worklets') — an exact-equality check
  // passes but the two still collide as directories on the default
  // case-insensitive macOS filesystem (synth package layout + headers tree).
  const seen /*: Map<string, {name: string, swiftName: string}> */ = new Map();
  for (const dep of byName.values()) {
    const swiftName = dep.swiftName;
    if (swiftName == null) {
      continue;
    }
    const key = swiftName.toLowerCase();
    const existing = seen.get(key);
    if (existing != null) {
      const same = existing.swiftName === swiftName;
      throw new Error(
        `react-native autolinking: SPM Swift name collision: '${existing.name}' ('${existing.swiftName}') and '${dep.name}' ('${swiftName}') ` +
          (same
            ? `both resolve to '${swiftName}'.`
            : `differ only in case, which collides on case-insensitive filesystems.`) +
          ` Set a distinct 'spm.name' in one of their react-native.config.js files.`,
      );
    }
    seen.set(key, {name: dep.name, swiftName});
  }

  return Array.from(byName.values());
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
    return require(configPath);
  } catch {
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

module.exports = {
  expandSpmDependencies,
  resolveSwiftName,
  defaultReadConfig,
  defaultResolveDep,
};
