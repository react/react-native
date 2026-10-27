/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

// Invariants every file `react-native spm` writes must hold, checked from the
// files alone. Each rule names a class of bug that has shipped before:
//
//   machine-path       committed outputs name a path on this machine (#58292)
//   scheme-script      the scheme pre-action loses its line breaks (#58826)
//   package-names      Package.swift names collide or do not resolve
//   deployment-target  a manifest floor differs from the app's, or for the
//                      fixed codegen template exceeds it (#58379)
//   pbxproj-integrity  the pbxproj is malformed or disagrees with the marker

const {SCAFFOLDER_MARKER} = require('../spm-utils');
const {isBalanced} = require('./pbxproj-oracles');
const {DOMParser} = require('@xmldom/xmldom');
const fs = require('node:fs');
const path = require('node:path');

const MARKER_FILE = '.spm-injected.json';
const SYNC_PRE_ACTION_TITLE = 'Sync SPM Autolinking';
const AUTOLINKED_MANIFEST = 'build/generated/autolinking/Package.swift';
const GENERATED_MANIFESTS = [
  AUTOLINKED_MANIFEST,
  'build/xcframeworks/Package.swift',
  'build/generated/ios/Package.swift',
];
// Copied verbatim from react-native/scripts/codegen/templates, so its floor
// (.v15) is fixed rather than derived from the app. A floor is a minimum: it
// may sit below the app's, but one above it would not build.
const FIXED_FLOOR_MANIFESTS = new Set(['build/generated/ios/Package.swift']);

const ALLOWED_ABSOLUTE_PATHS = {
  '/bin/bash':
    'the interpreter Xcode runs build phases and scheme actions under',
  '/usr/bin/rsync':
    'pinned so no PATH entry can shadow the tool that embeds frameworks',
  '/usr/bin/codesign':
    'pinned so no PATH entry can shadow the tool that signs frameworks',
  '/dev/null': 'a redirection target in the sync script',
};

const C99_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
// A `/` that starts a path rather than continuing one (`$(SRCROOT)/x`,
// `build/x`) or belonging to a URL.
const ABSOLUTE_PATH_TOKEN =
  /(?<![\w$)}\].:/~-])\/[A-Za-z_][^\s"'`;,()<>|&\\]*/g;
const PBXPROJ_STRING = /"(?:[^"\\]|\\.)*"/g;
const PBXPROJ_STRING_OR_COMMENT =
  /"(?:[^"\\]|\\.)*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;
const PBXPROJ_OBJECT_ID = /\b[0-9A-Fa-f]{24}\b/g;

/*::
type Violation = {rule: string, file: string, detail: string};
*/

function readIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function unquotePbxproj(value) {
  if (!value.startsWith('"')) {
    return value;
  }
  return value
    .slice(1, -1)
    .replace(/\\(.)/g, (_, c) => ({n: '\n', t: '\t'})[c] ?? c);
}

function braceBodyRange(text, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      for (i++; i < text.length && text[i] !== '"'; i++) {
        if (text[i] === '\\') i++;
      }
    } else if (c === '{') {
      depth++;
    } else if (c === '}' && --depth === 0) {
      return {start: openBraceIndex + 1, end: i};
    }
  }
  return {start: openBraceIndex + 1, end: text.length};
}

function buildSettingsBlocks(pbxproj) {
  return Array.from(pbxproj.matchAll(/\bbuildSettings = \{/g), m =>
    braceBodyRange(pbxproj, m.index + m[0].length - 1),
  );
}

function buildSettings(pbxproj) {
  const settings = [];
  for (const {start, end} of buildSettingsBlocks(pbxproj)) {
    const body = pbxproj.slice(start, end);
    const entry =
      /("(?:[^"\\]|\\.)*"|[^\s="]+)\s*=\s*(\((?:"(?:[^"\\]|\\.)*"|[^()"])*\)|"(?:[^"\\]|\\.)*"|[^;]*);/g;
    for (const [, key, value] of body.matchAll(entry)) {
      const values = value.startsWith('(')
        ? Array.from(value.matchAll(/"(?:[^"\\]|\\.)*"|[^\s,()]+/g), v =>
            unquotePbxproj(v[0]),
          )
        : [unquotePbxproj(value.trim())];
      for (const v of values) {
        settings.push({key: unquotePbxproj(key), value: v});
      }
    }
  }
  return settings;
}

// pbxproj text outside every buildSettings block, strings decoded, so script
// text reads as the shell will run it.
function pbxprojScriptText(pbxproj) {
  let text = '';
  let at = 0;
  for (const {start, end} of buildSettingsBlocks(pbxproj)) {
    text += pbxproj.slice(at, start);
    at = end;
  }
  text += pbxproj.slice(at);
  return text.replace(PBXPROJ_STRING, unquotePbxproj);
}

function jsonStrings(value) {
  if (typeof value === 'string') {
    return [value];
  }
  if (value != null && typeof value === 'object') {
    return Object.values(value).flatMap(jsonStrings);
  }
  return [];
}

function parseXml(text) {
  const errors = [];
  const record = message => errors.push(message);
  let doc = null;
  try {
    doc = new DOMParser({
      errorHandler: {warning: () => {}, error: record, fatalError: record},
    }).parseFromString(text, 'text/xml');
  } catch (e) {
    record(e.message);
  }
  return {doc, errors};
}

function xmlAttributeValues(doc) {
  if (doc == null) {
    return [];
  }
  const elements = doc.getElementsByTagName('*');
  const values = [];
  for (let i = 0; i < elements.length; i++) {
    const attributes = elements[i].attributes;
    for (let j = 0; j < attributes.length; j++) {
      values.push(attributes[j].value);
    }
  }
  return values;
}

function schemeFiles(xcodeprojPath) {
  const dir = path.join(xcodeprojPath, 'xcshareddata', 'xcschemes');
  try {
    return fs
      .readdirSync(dir)
      .filter(name => name.endsWith('.xcscheme'))
      .map(name => path.join(dir, name));
  } catch {
    return [];
  }
}

function xcconfigFiles(appRoot, xcodeprojPath) {
  return [appRoot, xcodeprojPath].flatMap(dir => {
    try {
      return fs
        .readdirSync(dir)
        .filter(name => name.endsWith('.xcconfig'))
        .map(name => path.join(dir, name));
    } catch {
      return [];
    }
  });
}

function findPackageSwiftFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return [];
  }
  return entries.flatMap(entry => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return findPackageSwiftFiles(entryPath);
    }
    return entry.isFile() && entry.name === 'Package.swift' ? [entryPath] : [];
  });
}

// Scaffolded manifests live in node_modules; the autolinker links every
// self-managed library root into libs/, which is where SwiftPM reads them, so
// their relative package paths resolve from the alias, not the real directory.
function scaffoldedManifests(appRoot) {
  const libsDir = path.join(appRoot, 'build/generated/autolinking/libs');
  let names;
  try {
    names = fs.readdirSync(libsDir);
  } catch {
    return [];
  }
  return names.flatMap(name => {
    const alias = path.join(libsDir, name);
    try {
      const manifest = path.join(fs.realpathSync(alias), 'Package.swift');
      return readIfExists(manifest)?.includes(SCAFFOLDER_MARKER) === true
        ? [[manifest, alias]]
        : [];
    } catch {
      return [];
    }
  });
}

function parseManifest(text) {
  const code = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const all = (re, group = 1) => Array.from(code.matchAll(re), m => m[group]);
  const label = (args, name) =>
    new RegExp(`\\b${name}:\\s*"([^"]*)"`).exec(args)?.[1];
  return {
    targets: all(
      /\.(?:target|binaryTarget|testTarget|executableTarget|systemLibrary|macro)\(\s*name:\s*"([^"]*)"\s*,/g,
    ),
    products: Array.from(
      code.matchAll(
        /\.(?:library|executable)\(\s*name:\s*"([^"]*)"[^)]*?targets:\s*\[([^\]]*)\]/g,
      ),
      ([, name, targets]) => ({
        name,
        targets: Array.from(targets.matchAll(/"([^"]*)"/g), m => m[1]),
      }),
    ),
    packages: new Map(
      Array.from(code.matchAll(/\.package\(([^)]*)\)/g), ([, args]) => {
        const packagePath = label(args, 'path');
        const location = packagePath ?? label(args, 'url') ?? '';
        return [
          label(args, 'name') ?? path.basename(location, '.git'),
          packagePath,
        ];
      }),
    ),
    targetDependencies: all(/\.target\(\s*name:\s*"([^"]*)"\s*\)/g),
    productDependencies: Array.from(
      code.matchAll(
        /\.product\(\s*name:\s*"([^"]*)"\s*,\s*package:\s*"([^"]*)"/g,
      ),
      ([, name, pkg]) => ({name, package: pkg}),
    ),
  };
}

function nameViolations(kind, names) {
  const problems = [];
  const byKey = new Map();
  for (const name of names) {
    if (!C99_IDENTIFIER.test(name)) {
      problems.push(`${kind} name "${name}" is not a C99 identifier`);
    }
    const key = name.toLowerCase();
    byKey.set(key, [...(byKey.get(key) ?? []), name]);
  }
  for (const group of byKey.values()) {
    if (group.length < 2) {
      continue;
    }
    problems.push(
      new Set(group).size === 1
        ? `declares ${kind} "${group[0]}" ${group.length} times`
        : `declares ${kind}s ${group.map(n => `"${n}"`).join(', ')}, which differ only in case`,
    );
  }
  return problems;
}

function parseFloor(argument) {
  const literal = /^"(\d+(?:\.\d+)*)"$/.exec(argument);
  const member = /^\.v(\d+(?:_\d+)*)$/.exec(argument);
  const version = literal?.[1] ?? member?.[1].replace(/_/g, '.');
  return version == null ? null : normalizeVersion(version);
}

function normalizeVersion(version) {
  return version
    .split('.')
    .map(Number)
    .join('.')
    .replace(/(\.0)+$/, '');
}

function compareVersions(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

function iosFloorArguments(text) {
  return [...text.matchAll(/\.iOS\(\s*([^)]*?)\s*\)/g)].map(
    ([, argument]) => argument,
  );
}

function checkMachinePaths(report, file, text, opts) {
  for (const forbidden of opts.forbiddenPaths) {
    if (text.includes(forbidden)) {
      report(file, `contains ${forbidden}, a path on this machine`);
    }
  }
  for (const {key, value} of opts.settings ?? []) {
    if (value.startsWith('/')) {
      report(file, `build setting ${key} has the absolute value ${value}`);
    }
  }
  for (const value of opts.recordedValues ?? []) {
    if (value.startsWith('/')) {
      report(file, `records the absolute path ${value}`);
    }
  }
  for (const script of opts.scripts ?? []) {
    for (const [token] of script.matchAll(ABSOLUTE_PATH_TOKEN)) {
      const alreadyReported = opts.forbiddenPaths.some(p => token.includes(p));
      if (!Object.hasOwn(ALLOWED_ABSOLUTE_PATHS, token) && !alreadyReported) {
        report(
          file,
          `names ${token}, which is not an allowlisted system tool (${Object.keys(ALLOWED_ABSOLUTE_PATHS).join(', ')})`,
        );
      }
    }
  }
}

function checkScheme(report, file, text) {
  const {doc, errors} = parseXml(text);
  if (errors.length > 0) {
    report(file, `is not well-formed XML: ${errors[0]}`);
    return;
  }
  const actions = doc.getElementsByTagName('ActionContent');
  for (let i = 0; i < actions.length; i++) {
    if (actions[i].getAttribute('title') !== SYNC_PRE_ACTION_TITLE) {
      continue;
    }
    const lines = (actions[i].getAttribute('scriptText') ?? '').split('\n');
    if (lines.length < 2) {
      report(
        file,
        `the "${SYNC_PRE_ACTION_TITLE}" scriptText reads as one line, so everything after its first "#" is a comment`,
      );
    } else if (lines.slice(1).every(line => /^\s*(#.*)?$/.test(line))) {
      report(
        file,
        `every line of the "${SYNC_PRE_ACTION_TITLE}" scriptText after the first is a comment, so the script body never runs`,
      );
    }
  }
}

function localPackageProductNames(baseDir, packagePath) {
  const text = readIfExists(
    path.resolve(baseDir, packagePath, 'Package.swift'),
  );
  return text == null
    ? null
    : new Set(parseManifest(text).products.map(p => p.name));
}

function productDependencyProblem(manifest, baseDir, dep) {
  if (!manifest.packages.has(dep.package)) {
    return `depends on product "${dep.name}" of package "${dep.package}", which it does not depend on`;
  }
  const packagePath = manifest.packages.get(dep.package);
  if (packagePath == null) {
    return null;
  }
  const products = localPackageProductNames(baseDir, packagePath);
  if (products == null) {
    return `depends on package "${dep.package}" at ${packagePath}, which has no Package.swift`;
  }
  return products.has(dep.name)
    ? null
    : `depends on product "${dep.name}", which package "${dep.package}" at ${packagePath} does not declare`;
}

function checkManifestNames(report, file, text, baseDir) {
  const manifest = parseManifest(text);
  const targets = new Set(manifest.targets);
  const problems = [
    ...nameViolations('target', manifest.targets),
    ...nameViolations(
      'product',
      manifest.products.map(p => p.name),
    ),
    ...manifest.products.flatMap(product =>
      product.targets
        .filter(name => !targets.has(name))
        .map(
          name =>
            `product "${product.name}" lists target "${name}", which it does not declare`,
        ),
    ),
    ...manifest.targetDependencies
      .filter(name => !targets.has(name))
      .map(name => `depends on target "${name}", which it does not declare`),
    ...manifest.productDependencies
      .map(dep => productDependencyProblem(manifest, baseDir, dep))
      .filter(Boolean),
  ];
  for (const problem of problems) {
    report(file, problem);
  }
}

function checkDeploymentTarget(report, file, text, expected) {
  for (const argument of iosFloorArguments(text)) {
    const floor = parseFloor(argument);
    if (floor !== normalizeVersion(expected)) {
      report(
        file,
        `declares .iOS(${argument}), but the app deploys to iOS ${expected}`,
      );
    }
  }
}

function checkFixedFloor(report, file, text, expected) {
  const floorArguments = iosFloorArguments(text);
  if (floorArguments.length === 0) {
    report(file, 'declares no iOS deployment target');
  }
  for (const argument of floorArguments) {
    const floor = parseFloor(argument);
    if (floor == null) {
      report(file, `declares .iOS(${argument}), which is not a version`);
    } else if (compareVersions(floor, expected) > 0) {
      report(
        file,
        `declares .iOS(${argument}), above the iOS ${expected} the app deploys to`,
      );
    }
  }
}

function checkPbxprojIntegrity(report, file, pbxproj) {
  if (!isBalanced(pbxproj)) {
    report(file, 'has unbalanced braces or parentheses');
  }
  const defined = new Set(
    Array.from(
      pbxproj.matchAll(/^\s*([0-9A-Fa-f]{24})\b(?:\s*\/\*.*?\*\/)?\s*=\s*\{/gm),
      m => m[1],
    ),
  );
  const references = new Set(
    pbxproj.replace(PBXPROJ_STRING_OR_COMMENT, ' ').match(PBXPROJ_OBJECT_ID),
  );
  for (const id of references) {
    if (!defined.has(id)) {
      report(file, `references object ${id}, which it does not define`);
    }
  }
}

function frameworkSettingPrefix(id) {
  return `RN_SPM_${id.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
}

// The embed phase lists each framework's setting in inputPaths and its
// destination in outputPaths, in the same order.
function embeddedFrameworks(pbxproj) {
  const prefixes = Array.from(
    pbxproj.matchAll(/"\$\((RN_SPM_\w+?)_FRAMEWORK\)"/g),
    m => m[1],
  );
  const names = Array.from(
    pbxproj.matchAll(/\$\(FRAMEWORKS_FOLDER_PATH\)\/([^"/]+)\.framework/g),
    m => m[1],
  );
  return names.map((name, i) => `${prefixes[i] ?? '?'} ${name}`).sort();
}

function checkLinkedFrameworks(report, file, marker, pbxproj) {
  const recorded = (marker.linkedFrameworks ?? [])
    .map(
      ({id, frameworkName}) => `${frameworkSettingPrefix(id)} ${frameworkName}`,
    )
    .sort();
  const embedded = embeddedFrameworks(pbxproj);
  if (JSON.stringify(recorded) !== JSON.stringify(embedded)) {
    report(
      file,
      `linkedFrameworks [${recorded.join(', ')}] differ from the frameworks the pbxproj embeds [${embedded.join(', ')}]`,
    );
  }
}

/**
 * Checks the files an `spm add`/`update`/`sync` leaves in an app and returns
 * every violation found ([] when all hold). A file a rule needs that is
 * missing is itself a violation, so a broken layout never passes vacuously.
 * `requiredManifests` (relative to `appRoot`) names manifests the caller
 * expects to be checked, such as scaffolded ones, which are otherwise only
 * found by their marker. `file` in each violation is relative to `appRoot`.
 */
function checkSpmInvariants(
  options /*: {
    appRoot: string,
    xcodeprojPath: string,
    expectedDeploymentTarget: string,
    forbiddenPaths: ReadonlyArray<string>,
    requiredManifests?: ReadonlyArray<string>,
  } */,
) /*: Array<Violation> */ {
  const {
    appRoot,
    xcodeprojPath,
    expectedDeploymentTarget,
    forbiddenPaths,
    requiredManifests = [],
  } = options;
  const violations = [];
  const relative = filePath => path.relative(appRoot, filePath);
  const reporter = rule => (filePath, detail) =>
    violations.push({rule, file: relative(filePath), detail});
  const machinePath = reporter('machine-path');
  const schemeScript = reporter('scheme-script');
  const packageNames = reporter('package-names');
  const deploymentTarget = reporter('deployment-target');
  const pbxprojIntegrity = reporter('pbxproj-integrity');

  const pbxprojPath = path.join(xcodeprojPath, 'project.pbxproj');
  const pbxproj = readIfExists(pbxprojPath);
  if (pbxproj == null) {
    machinePath(pbxprojPath, 'is missing');
    pbxprojIntegrity(pbxprojPath, 'is missing');
  } else {
    checkMachinePaths(machinePath, pbxprojPath, pbxproj, {
      forbiddenPaths,
      settings: buildSettings(pbxproj),
      scripts: [pbxprojScriptText(pbxproj)],
    });
    checkPbxprojIntegrity(pbxprojIntegrity, pbxprojPath, pbxproj);
  }

  const markerPath = path.join(xcodeprojPath, MARKER_FILE);
  const markerText = readIfExists(markerPath);
  let marker = null;
  try {
    marker = markerText != null ? JSON.parse(markerText) : null;
  } catch (e) {
    pbxprojIntegrity(markerPath, `is not valid JSON: ${e.message}`);
  }
  if (markerText == null) {
    machinePath(markerPath, 'is missing');
    pbxprojIntegrity(markerPath, 'is missing');
  } else {
    checkMachinePaths(machinePath, markerPath, markerText, {
      forbiddenPaths,
      recordedValues: jsonStrings(marker),
    });
    if (marker != null && pbxproj != null) {
      checkLinkedFrameworks(pbxprojIntegrity, markerPath, marker, pbxproj);
    }
  }

  let schemesWithPreAction = 0;
  for (const schemePath of schemeFiles(xcodeprojPath)) {
    const text = fs.readFileSync(schemePath, 'utf8');
    if (text.includes(`title = "${SYNC_PRE_ACTION_TITLE}"`)) {
      schemesWithPreAction++;
    }
    checkMachinePaths(machinePath, schemePath, text, {
      forbiddenPaths,
      scripts: xmlAttributeValues(parseXml(text).doc),
    });
    checkScheme(schemeScript, schemePath, text);
  }
  if (schemesWithPreAction === 0) {
    schemeScript(
      path.join(xcodeprojPath, 'xcshareddata', 'xcschemes'),
      `no scheme carries the "${SYNC_PRE_ACTION_TITLE}" pre-action`,
    );
  }

  for (const xcconfigPath of xcconfigFiles(appRoot, xcodeprojPath)) {
    const text = fs.readFileSync(xcconfigPath, 'utf8');
    checkMachinePaths(machinePath, xcconfigPath, text, {
      forbiddenPaths,
      scripts: [text],
    });
  }

  const manifests = new Map([
    ...findPackageSwiftFiles(path.join(appRoot, 'build')).map(manifest => [
      manifest,
      path.dirname(manifest),
    ]),
    ...scaffoldedManifests(appRoot),
  ]);
  for (const required of GENERATED_MANIFESTS) {
    if (!manifests.has(path.join(appRoot, required))) {
      packageNames(path.join(appRoot, required), 'is missing');
    }
  }
  const autolinkedPath = path.join(appRoot, AUTOLINKED_MANIFEST);
  if (!manifests.has(autolinkedPath)) {
    deploymentTarget(autolinkedPath, 'is missing');
  }
  const requiredPaths = requiredManifests.map(p => path.resolve(appRoot, p));
  for (const requiredPath of requiredPaths) {
    if (!manifests.has(requiredPath)) {
      deploymentTarget(
        requiredPath,
        'is required but was not among the manifests checked',
      );
    }
  }
  for (const [manifestPath, baseDir] of manifests) {
    const text = fs.readFileSync(manifestPath, 'utf8');
    checkManifestNames(packageNames, manifestPath, text, baseDir);
    const checkFloor = FIXED_FLOOR_MANIFESTS.has(relative(manifestPath))
      ? checkFixedFloor
      : checkDeploymentTarget;
    checkFloor(deploymentTarget, manifestPath, text, expectedDeploymentTarget);
  }
  for (const flooredPath of new Set([autolinkedPath, ...requiredPaths])) {
    if (
      manifests.has(flooredPath) &&
      !/\.iOS\(/.test(fs.readFileSync(flooredPath, 'utf8'))
    ) {
      deploymentTarget(flooredPath, 'declares no iOS deployment target');
    }
  }

  return violations;
}

module.exports = {checkSpmInvariants};
