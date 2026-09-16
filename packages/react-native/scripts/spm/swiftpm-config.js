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

const {isValidSwiftName, makeLogger} = require('./spm-utils');
const fs = require('node:fs');
const path = require('node:path');

const {log, warn} = makeLogger('swiftpm-config');

/**
 * swiftpm-config.js — one reader for a package's SwiftPM settings.
 *
 * They live in `swiftpmConfig` in the package's package.json:
 *
 *   { "swiftpmConfig": { "name": "RNSVG" } }
 *
 * A library owns `name`, `dependencies`, `autolinkingPlugin` and `scaffold`;
 * an app owns `modules` and `denyPlugins`. The `spm` block in
 * react-native.config.js is the deprecated spelling of the same fields — still
 * read so nothing breaks mid-migration, but package.json wins field by field.
 */

/*::
export type SwiftpmNameOutcome =
  | 'created'
  | 'inserted'
  | 'already-set'
  | 'skipped'
  | 'failed';
// User-authored, so values stay unknown and are validated where consumed.
export type SwiftpmConfig = {
  readonly name?: unknown,
  readonly dependencies?: unknown,
  readonly autolinkingPlugin?: unknown,
  readonly scaffold?: unknown,
  readonly modules?: unknown,
  readonly denyPlugins?: unknown,
  ...
};
type RnConfig = {...};
*/

const SWIFTPM_FIELDS /*: ReadonlyArray<string> */ = [
  'name',
  'dependencies',
  'autolinkingPlugin',
  'scaffold',
  'modules',
  'denyPlugins',
];

// Config file paths already warned about, by kind of warning.
const deprecationsReported /*: Set<string> */ = new Set();
const unknownKeysReported /*: Set<string> */ = new Set();

function readPackageJson(
  root /*: string */,
) /*: ?{readonly [string]: unknown} */ {
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return parsed != null && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    warn(
      `Failed to read ${pkgPath}: ${e.message}. 'swiftpmConfig' is ignored.`,
    );
    return null;
  }
}

// A settings object, or null for anything else the author may have written
// there — an array included, since its indices are not fields.
function objectField(
  source /*: ?{readonly [string]: unknown} */,
  key /*: string */,
) /*: ?SwiftpmConfig */ {
  const value = source?.[key];
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null;
}

function declaredFields(
  config /*: ?{readonly [string]: unknown} */,
) /*: Array<string> */ {
  return config == null
    ? []
    : SWIFTPM_FIELDS.filter(field => config[field] !== undefined);
}

function stringList(value /*: unknown */) /*: Array<string> */ {
  return Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];
}

function reportDeprecation(
  root /*: string */,
  fields /*: Array<string> */,
) /*: void */ {
  const configPath = path.join(root, 'react-native.config.js');
  if (deprecationsReported.has(configPath)) {
    return;
  }
  deprecationsReported.add(configPath);
  warn(
    `${configPath} declares SwiftPM settings in the deprecated 'spm' block (${fields.join(', ')}). ` +
      `Move them to 'swiftpmConfig' in the package's package.json — the 'spm' block still works, but will stop being read.`,
  );
}

// A misspelled field would otherwise do nothing at all. Unknown keys are only
// reported, never rejected: a library may declare a field a newer React Native
// knows and this one does not.
function reportUnknownKeys(
  root /*: string */,
  config /*: SwiftpmConfig */,
) /*: void */ {
  const pkgPath = path.join(root, 'package.json');
  const unknown = Object.keys(config).filter(
    key => !SWIFTPM_FIELDS.includes(key),
  );
  if (unknown.length === 0 || unknownKeysReported.has(pkgPath)) {
    return;
  }
  unknownKeysReported.add(pkgPath);
  warn(
    `${pkgPath} declares 'swiftpmConfig' fields React Native does not know (${unknown.join(', ')}). ` +
      `They are ignored — check the spelling against ${SWIFTPM_FIELDS.join(', ')}.`,
  );
}

/**
 * The SwiftPM settings that apply to the package at `root`: `swiftpmConfig`
 * from its package.json over the deprecated `spm` block of its already-loaded
 * react-native.config.js. Null when the package declares neither.
 */
function readSwiftpmConfig(
  root /*: string */,
  rnConfig /*: ?RnConfig */,
) /*: ?SwiftpmConfig */ {
  const fromPackageJson = objectField(readPackageJson(root), 'swiftpmConfig');
  if (fromPackageJson != null) {
    reportUnknownKeys(root, fromPackageJson);
  }
  const deprecated = objectField(rnConfig, 'spm');
  const deprecatedFields = declaredFields(deprecated);
  if (deprecatedFields.length > 0) {
    reportDeprecation(root, deprecatedFields);
  }
  if (fromPackageJson == null) {
    return deprecatedFields.length > 0 ? deprecated : null;
  }
  return {...deprecated, ...fromPackageJson};
}

// The file's own indentation, so writing a field back does not reformat it.
function detectIndent(source /*: string */) /*: string */ {
  return /\n([ \t]+)"/.exec(source)?.[1] ?? '  ';
}

/**
 * Records `swiftName` as `swiftpmConfig.name` in the package's package.json —
 * the scaffolder's migration step, which is what lets a library stop deriving
 * its SwiftPM name from a podspec. A name the author already chose is never
 * overwritten.
 */
function writeSwiftpmName(
  root /*: string */,
  swiftName /*: string */,
  options /*:: ?: {dryRun?: boolean} */,
) /*: SwiftpmNameOutcome */ {
  if (!isValidSwiftName(swiftName)) {
    return 'skipped';
  }
  const pkgPath = path.join(root, 'package.json');
  let source;
  let pkg;
  try {
    source = fs.readFileSync(pkgPath, 'utf8');
    pkg = JSON.parse(source);
  } catch {
    return 'skipped';
  }
  if (pkg == null || typeof pkg !== 'object') {
    return 'skipped';
  }
  const existing = objectField(pkg, 'swiftpmConfig');
  if (existing == null && pkg.swiftpmConfig !== undefined) {
    warn(
      `${pkgPath} has a 'swiftpmConfig' that is not an object; leaving it alone. ` +
        `React Native resolved the name '${swiftName}' from the podspec.`,
    );
    return 'skipped';
  }
  const declaredName = existing?.name;
  if (declaredName === swiftName) {
    return 'already-set';
  }
  if (declaredName != null) {
    warn(
      `${pkgPath} already sets 'swiftpmConfig.name' to '${String(declaredName)}'; leaving it. ` +
        `React Native resolved '${swiftName}' from the podspec — set them to the same value to silence this.`,
    );
    return 'skipped';
  }
  const outcome = existing == null ? 'created' : 'inserted';
  pkg.swiftpmConfig = {...existing, name: swiftName};
  if (options?.dryRun === true) {
    log(`Would set 'swiftpmConfig.name' to '${swiftName}' in ${pkgPath}`);
    return outcome;
  }
  const serialized = JSON.stringify(pkg, null, detectIndent(source));
  const content = source.endsWith('\n') ? `${serialized}\n` : serialized;
  // Staged and renamed, so an interrupted or out-of-space write cannot leave a
  // third-party package.json truncated.
  const tmpPath = `${pkgPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, pkgPath);
  } catch (e) {
    fs.rmSync(tmpPath, {force: true});
    warn(
      `Could not record 'swiftpmConfig.name' in ${pkgPath}: ${e.message}. The manifest is written; the name is not.`,
    );
    return 'failed';
  }
  return outcome;
}

module.exports = {
  readSwiftpmConfig,
  stringList,
  writeSwiftpmName,
};
