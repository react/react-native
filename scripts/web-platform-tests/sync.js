/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const babel = require('@babel/core');
const {spawnSync} = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const WPT_REVISION = '6c7127bdd9f2cc6a3668fd9791757843e09d5a9e';
const SUITES = ['fetch', 'streams'];
const UNSUPPORTED_GLOBALS = new Set([
  'MessageChannel',
  'VideoFrame',
  'fetch',
  'garbageCollect',
  'gc',
]);

const REPO_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(
  REPO_ROOT,
  'packages/react-native/src/private/webapis/__tests__/wpt/generated',
);
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'wpt-fixtures.json');

function parseArgs() {
  const args = process.argv.slice(2);
  let wptRoot;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--wpt-root') {
      wptRoot = args[++i];
    } else if (arg.startsWith('--wpt-root=')) {
      wptRoot = arg.slice('--wpt-root='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (wptRoot == null) {
    throw new Error('Expected --wpt-root=/path/to/web-platform-tests/wpt');
  }

  return path.resolve(wptRoot);
}

function readBuffer(wptRoot, relativePath) {
  const absolutePath = path.join(wptRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing WPT file: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath);
}

function readFile(wptRoot, relativePath) {
  return readBuffer(wptRoot, relativePath).toString('utf8');
}

function readManifest(wptRoot) {
  const manifestPath = path.join(wptRoot, 'MANIFEST.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      'Missing MANIFEST.json. Generate it with WPT before running sync-wpt.',
    );
  }
  return {
    bytes: fs.readFileSync(manifestPath),
    value: JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
  };
}

function verifyRevision(wptRoot) {
  const result = spawnSync('git', ['-C', wptRoot, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      'The WPT root must be a Git checkout at the pinned commit.',
    );
  }
  const revision = result.stdout.trim();
  if (revision !== WPT_REVISION) {
    throw new Error(
      `Expected WPT ${WPT_REVISION}, but the checkout is at ${revision}.`,
    );
  }
}

function gitBlobHash(bytes) {
  return crypto
    .createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');
}

function flattenManifestTree(tree, manifestType, suite) {
  const entries = [];
  const pending = [{prefix: [], value: tree}];

  while (pending.length > 0) {
    const current = pending.pop();
    if (current == null) {
      continue;
    }
    for (const [name, value] of Object.entries(current.value ?? {})) {
      const prefix = [...current.prefix, name];
      if (Array.isArray(value)) {
        entries.push({
          hash: value[0],
          items: value.slice(1),
          manifestType,
          path: `${suite}/${prefix.join('/')}`,
        });
      } else {
        pending.push({prefix, value});
      }
    }
  }

  return entries;
}

function getManifestEntries(manifest, suite) {
  return Object.entries(manifest.items)
    .filter(([manifestType]) => manifestType !== 'support')
    .flatMap(([manifestType, tree]) =>
      flattenManifestTree(tree[suite], manifestType, suite),
    )
    .sort((a, b) =>
      a.path < b.path
        ? -1
        : a.path > b.path
          ? 1
          : a.manifestType.localeCompare(b.manifestType),
    );
}

function getMetadata(entry, name) {
  return [
    ...new Set(
      entry.items.flatMap(item =>
        (item[1]?.script_metadata ?? [])
          .filter(metadata => metadata[0] === name)
          .map(metadata => metadata[1]),
      ),
    ),
  ];
}

function getMetadataScripts(entry) {
  return getMetadata(entry, 'script').map(scriptPath =>
    scriptPath.startsWith('/')
      ? scriptPath.slice(1)
      : path.posix.normalize(
          path.posix.join(path.posix.dirname(entry.path), scriptPath),
        ),
  );
}

function hasDedicatedWorkerVariant(entry) {
  return entry.items.some(
    item =>
      typeof item[0] === 'string' &&
      /\.any\.worker(?:-module)?\.html$/.test(item[0]),
  );
}

function getManifestUrls(entry) {
  return entry.items
    .map(item => item[0])
    .filter(url => typeof url === 'string')
    .sort();
}

function validateManifestHash(wptRoot, entry) {
  const bytes = readBuffer(wptRoot, entry.path);
  const actualHash = gitBlobHash(bytes);
  if (actualHash !== entry.hash) {
    throw new Error(
      `WPT manifest hash mismatch for ${entry.path}: expected ${entry.hash}, got ${actualHash}.`,
    );
  }
}

function analyzeSource(source) {
  const ast = babel.parseSync(source, {
    babelrc: false,
    configFile: false,
    sourceType: 'script',
  });
  if (ast == null) {
    throw new Error('Babel did not return an AST for a WPT source.');
  }
  const functions = new Map();
  const rootCalls = new Set();
  const rootGlobals = new Set();

  function ensureFunction(name) {
    if (!functions.has(name)) {
      functions.set(name, {calls: new Set(), globals: new Set()});
    }
    return functions.get(name);
  }

  function visit(node, owner, parent) {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item, owner, parent);
      }
      return;
    }
    if (node == null || typeof node !== 'object') {
      return;
    }

    let childOwner = owner;
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      const functionName =
        node.id?.name ??
        (parent?.type === 'VariableDeclarator' &&
        parent.id.type === 'Identifier'
          ? parent.id.name
          : parent?.type === 'AssignmentExpression' &&
              parent.left.type === 'Identifier'
            ? parent.left.name
            : owner);
      childOwner = functionName;
      if (functionName != null) {
        ensureFunction(functionName);
      }
    }

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      const name = node.callee.name;
      (childOwner == null ? rootCalls : ensureFunction(childOwner).calls).add(
        name,
      );
      if (UNSUPPORTED_GLOBALS.has(name)) {
        (childOwner == null
          ? rootGlobals
          : ensureFunction(childOwner).globals
        ).add(name);
      }
    }
    if (
      node.type === 'NewExpression' &&
      node.callee.type === 'Identifier' &&
      UNSUPPORTED_GLOBALS.has(node.callee.name)
    ) {
      (childOwner == null
        ? rootGlobals
        : ensureFunction(childOwner).globals
      ).add(node.callee.name);
    }

    for (const [key, value] of Object.entries(node)) {
      if (!['end', 'loc', 'start'].includes(key)) {
        visit(value, childOwner, node);
      }
    }
  }

  visit(ast, null, null);

  return {functions, rootCalls, rootGlobals};
}

function findUnsupportedGlobal(wptRoot, entry, dependencyPaths) {
  const analyses = [entry.path, ...dependencyPaths].map(sourcePath => ({
    ...analyzeSource(readFile(wptRoot, sourcePath)),
    sourcePath,
  }));
  const functions = new Map();
  const pendingFunctions = [];
  const requirements = [];

  for (const analysis of analyses) {
    pendingFunctions.push(...analysis.rootCalls);
    for (const name of analysis.rootGlobals) {
      requirements.push({name, sourcePath: analysis.sourcePath});
    }
    for (const [name, data] of analysis.functions) {
      if (!functions.has(name)) {
        functions.set(name, []);
      }
      functions.get(name).push({
        ...data,
        sourcePath: analysis.sourcePath,
      });
    }
  }

  const visitedFunctions = new Set();
  while (pendingFunctions.length > 0) {
    const functionName = pendingFunctions.pop();
    if (functionName == null || visitedFunctions.has(functionName)) {
      continue;
    }
    visitedFunctions.add(functionName);
    for (const definition of functions.get(functionName) ?? []) {
      pendingFunctions.push(...definition.calls);
      for (const name of definition.globals) {
        requirements.push({
          functionName,
          name,
          sourcePath: definition.sourcePath,
        });
      }
    }
  }

  return requirements.sort((a, b) =>
    `${a.name}:${a.sourcePath}:${a.functionName ?? ''}`.localeCompare(
      `${b.name}:${b.sourcePath}:${b.functionName ?? ''}`,
    ),
  )[0];
}

function classifyManifestEntry(wptRoot, entry) {
  const manifest = {
    globals: getMetadata(entry, 'global'),
    type: entry.manifestType,
    urls: getManifestUrls(entry),
  };

  if (entry.manifestType !== 'testharness') {
    return {
      manifest,
      path: entry.path,
      reason: `WPT manifest type ${entry.manifestType} requires a browser-specific runner.`,
    };
  }
  if (!entry.path.endsWith('.any.js')) {
    return {
      manifest,
      path: entry.path,
      reason:
        'The WPT manifest does not classify this source as an .any.js multi-global test.',
    };
  }
  if (!hasDedicatedWorkerVariant(entry)) {
    return {
      manifest,
      path: entry.path,
      reason:
        'The WPT manifest does not generate a dedicated-worker variant for this test.',
    };
  }
  if (entry.path.includes('.sub.')) {
    return {
      manifest,
      path: entry.path,
      reason:
        'The .sub. filename declares WPT server-side substitution, which Fantom does not provide.',
    };
  }

  const dependencyPaths = getMetadataScripts(entry);
  if (dependencyPaths.includes('resources/idlharness.js')) {
    return {
      manifest: {...manifest, scripts: dependencyPaths},
      path: entry.path,
      reason:
        'META scripts declare the WPT WebIDL harness, which requires browser IDL exposure data.',
    };
  }

  const missingDependency = dependencyPaths.find(
    dependencyPath => !fs.existsSync(path.join(wptRoot, dependencyPath)),
  );
  if (missingDependency != null) {
    return {
      manifest: {...manifest, scripts: dependencyPaths},
      path: entry.path,
      reason: `META script ${missingDependency} is not present in the WPT checkout.`,
    };
  }

  const unsupportedGlobal = findUnsupportedGlobal(
    wptRoot,
    entry,
    dependencyPaths,
  );
  if (unsupportedGlobal != null) {
    const via =
      unsupportedGlobal.functionName == null
        ? ''
        : ` through ${unsupportedGlobal.functionName}()`;
    const reasons = {
      MessageChannel:
        'requires MessageChannel and transferable MessagePort support',
      VideoFrame: 'requires the browser VideoFrame API',
      fetch:
        "requires a completed network request, but Fantom's StubHttpClient never invokes request callbacks",
      garbageCollect: 'requires exposed deterministic garbage collection',
      gc: 'requires exposed deterministic garbage collection',
    };
    return {
      manifest: {...manifest, scripts: dependencyPaths},
      path: entry.path,
      reason: `Static analysis found global ${unsupportedGlobal.name}${via} in ${unsupportedGlobal.sourcePath}; this ${reasons[unsupportedGlobal.name]}.`,
    };
  }

  return {
    dependencyPaths,
    manifest,
    path: entry.path,
  };
}

function makeTestFixture(wptRoot, classification) {
  return {
    dependencies: classification.dependencyPaths.map(dependencyPath => ({
      path: dependencyPath,
      source: readFile(wptRoot, dependencyPath),
    })),
    manifest: classification.manifest,
    path: classification.path,
    source: readFile(wptRoot, classification.path),
  };
}

function validateFixtureSources(wptRoot, fixtures) {
  const sourceFiles = [
    {path: 'resources/testharness.js', source: fixtures.testharness},
    ...SUITES.flatMap(suite =>
      fixtures.suites[suite].flatMap(fixture => [
        ...fixture.dependencies,
        {path: fixture.path, source: fixture.source},
      ]),
    ),
  ];

  for (const sourceFile of sourceFiles) {
    if (
      !Buffer.from(sourceFile.source, 'utf8').equals(
        readBuffer(wptRoot, sourceFile.path),
      )
    ) {
      throw new Error(`WPT fixture source mismatch for ${sourceFile.path}.`);
    }
  }
}

function main() {
  const wptRoot = parseArgs();
  verifyRevision(wptRoot);
  const manifest = readManifest(wptRoot);
  const classifications = Object.fromEntries(
    SUITES.map(suite => [
      suite,
      getManifestEntries(manifest.value, suite).map(entry => {
        validateManifestHash(wptRoot, entry);
        return classifyManifestEntry(wptRoot, entry);
      }),
    ]),
  );
  const fixtures = {
    manifest: {
      sha256: crypto.createHash('sha256').update(manifest.bytes).digest('hex'),
      version: manifest.value.version,
    },
    revision: WPT_REVISION,
    selection: {
      environment: 'dedicatedworker',
      manifestTypes: ['testharness'],
      sourceFormat: '.any.js',
    },
    source:
      'https://chromium.googlesource.com/external/w3c/web-platform-tests/+/' +
      WPT_REVISION,
    testharness: readFile(wptRoot, 'resources/testharness.js'),
    suites: Object.fromEntries(
      SUITES.map(suite => [
        suite,
        classifications[suite]
          .filter(classification => classification.reason == null)
          .map(classification => makeTestFixture(wptRoot, classification)),
      ]),
    ),
    unsupported: Object.fromEntries(
      SUITES.map(suite => [
        suite,
        classifications[suite]
          .filter(classification => classification.reason != null)
          .map(({manifest: manifestMetadata, path: testPath, reason}) => ({
            manifest: manifestMetadata,
            path: testPath,
            reason,
          })),
      ]),
    ),
  };

  fs.mkdirSync(OUTPUT_DIR, {recursive: true});
  const output = `${JSON.stringify(fixtures, null, 2)}\n`;
  fs.writeFileSync(OUTPUT_PATH, output);
  validateFixtureSources(wptRoot, JSON.parse(output));

  console.log(
    `Synced ${fixtures.suites.fetch.length} fetch files and ${fixtures.suites.streams.length} streams files from WPT ${WPT_REVISION}.`,
  );
  console.log(
    `Recorded ${fixtures.unsupported.fetch.length} unsupported fetch files and ${fixtures.unsupported.streams.length} unsupported streams files from MANIFEST.json.`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {WPT_REVISION};
