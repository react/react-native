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

/*:: import type {
  AggregatorInput,
  AutolinkedDep,
  AutolinkingArgs,
  DiscoveredPlugin,
  NpmDepRef,
  PluginFlavoredFramework,
  PluginPackageDep,
  PluginProductDep,
  ReactDescriptor,
  RawAutolinkingJson,
  SpmModuleConfig,
  SpmTarget,
  SynthPackageSpec,
  TargetEntry,
} from './spm-types'; */

/**
 * generate-spm-autolinking.js – Generates autolinked/Package.swift, the SPM
 * equivalent of CocoaPods' `use_native_modules!`.
 *
 * Usage:
 *   node generate-spm-autolinking.js [options]
 *
 * Options:
 *   --app-root <path>            Path to the app directory (default: cwd)
 *   --react-native-root <path>   Path to react-native package root
 *   --autolinking-json <path>    Path to autolinking.json (default: build/generated/autolinking/autolinking.json)
 *   --output <path>              Output dir (default: autolinked/)
 *
 * Reads:
 *   - build/generated/autolinking/autolinking.json (produced by react-native codegen)
 *   - react-native.config.js (for spm.modules extra modules, optional)
 *
 * Generates:
 *   - autolinked/Package.swift
 *
 * V1 behavior:
 *   - Processes npm-package native modules with platforms.ios != null from autolinking.json
 *   - Also processes any `spm.modules` entries from react-native.config.js for local modules
 *   - Targets resolve React headers via SPM product dependencies (no flags)
 *
 * V2 behavior (future):
 *   - npm packages with their own Package.swift use .package(url: ...) instead of inline targets
 */

const {discoverPlugins, invokePlugins} = require('./autolinking-plugins');
const {
  defaultReadConfig,
  defaultResolveDep,
  expandSpmDependencies,
} = require('./expand-spm-dependencies');
const {readPodspec} = require('./read-podspec');
const {
  RemoteVersionError,
  findProjectRoot,
  makeLogger,
  remotePackageConfig,
  toSwiftName,
} = require('./spm-utils');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const {log, warn} = makeLogger('generate-spm-autolinking');

// Targets compiling against React get all headers via SPM product
// dependencies — no search-path flags: the React module from the invariant
// ReactHeaders Clang target, every other RN namespace from ReactNativeHeaders
// binaryTarget (pure-RN), the third-party deps namespaces (folly/glog/
// boost/...) from the ReactNativeDependenciesHeaders sidecar, and the app's
// generated headers from the ReactAppHeaders target in the codegen package.
//
// Remote mode (remotePackageConfig): the ReactNative-family products come
// from the single remote package identity instead of the local path-based
// package, so app + every library unify on one SPM-resolved version.
let remoteCfg /*: ?{url: string, version: string, identity: string} */ = null;

function reactNativePackageLabel() /*: string */ {
  return remoteCfg != null ? remoteCfg.identity : 'ReactNative';
}
function reactNativePackageDecl(localDecl /*: string */) /*: string */ {
  return remoteCfg != null
    ? `.package(url: "${remoteCfg.url}", exact: "${remoteCfg.version}")`
    : localDecl;
}
// The React product set — single source of truth shared by reactProductDeps()
// (the emitted string) and the plugin ReactDescriptor. The invariant ReactNative
// products come from the RN package (identity varies local vs remote);
// ReactAppHeaders is in the separate, per-app React-GeneratedCode package
// (easy to miss when hand-rolling — hence exposing it to plugins).
function reactProducts() /*: Array<{name: string, package: string}> */ {
  const rn = reactNativePackageLabel();
  return [
    {name: 'ReactHeaders', package: rn},
    {name: 'ReactNativeHeaders', package: rn},
    {name: 'ReactNativeDependenciesHeaders', package: rn},
    {name: 'ReactAppHeaders', package: 'React-GeneratedCode'},
  ];
}
function reactProductDeps() /*: string */ {
  return reactProducts()
    .map(p => `.product(name: "${p.name}", package: "${p.package}")`)
    .join(', ');
}

// Structured React descriptor handed to autolinking plugins: how to depend on
// React through one source of truth, so a plugin's own Package.swift doesn't
// re-derive RN's package path / identity / product names.
//
// `packageRef` is local or remote (distinguished by which keys are present):
//   - local:  {name, path (ABSOLUTE), relPath (relative to outputDir)}
//   - remote: {name, url, version}
// The canonical `path` is ABSOLUTE because a plugin may write its manifests in
// arbitrary subdirs of outputDir, for which an outputDir-relative path would be
// wrong; the generated manifests are gitignored + regenerated every sync, so an
// absolute path carries no portability cost. `relPath` is a convenience for the
// common case. `products` derives from the SAME reactProducts() RN wires into
// its own autolinked targets (parity: a plugin's target gets exactly RN's React
// surface), filtered to only products whose package is resolvable this run —
// the invariant is that any listed product can be depended on without guarding.
// Returns null when there is no resolvable React dependency.
function reactDescriptor(
  absXcframeworks /*: ?string */,
  xcframeworksRelPath /*: ?string */,
  codegenPackageExists /*: boolean */,
) /*: ?ReactDescriptor */ {
  let packageRef;
  if (remoteCfg != null) {
    packageRef = {
      name: remoteCfg.identity,
      url: remoteCfg.url,
      version: remoteCfg.version,
    };
  } else if (absXcframeworks != null) {
    packageRef = {
      name: 'ReactNative',
      path: toPosix(absXcframeworks),
      relPath:
        xcframeworksRelPath != null ? toPosix(xcframeworksRelPath) : undefined,
    };
  } else {
    return null;
  }
  const products = reactProducts().filter(
    p => p.package !== 'React-GeneratedCode' || codegenPackageExists,
  );
  return {packageRef, products};
}

// Normalize a (possibly Windows) path to posix separators for embedding in
// a Package.swift `.package(path:)` literal — SPM expects forward slashes.
function toPosix(p /*: string */) /*: string */ {
  return p.split(path.sep).join('/');
}

function parseArgs(argv /*: Array<string> */) /*: AutolinkingArgs */ {
  const parsed = yargs(argv)
    .option('app-root', {
      type: 'string',
      default: process.cwd(),
      describe: 'Path to the app directory',
    })
    .option('react-native-root', {
      type: 'string',
      describe: 'Path to react-native package root',
    })
    .option('autolinking-json', {
      type: 'string',
      describe:
        'Path to autolinking.json (default: build/generated/autolinking/autolinking.json)',
    })
    .option('output', {
      type: 'string',
      describe: 'Output dir (default: autolinked/)',
    })
    .option('xcframeworks-path', {
      type: 'string',
      describe:
        'Path to the xcframeworks sub-package (absolute or relative to appRoot)',
    })
    .usage(
      'Usage: $0 [options]\n\nGenerates autolinked/Package.swift for SPM autolinking.',
    )
    .help()
    .parseSync();

  return {
    appRoot: parsed['app-root'],
    reactNativeRoot: parsed['react-native-root'] ?? null,
    autolinkingJson: parsed['autolinking-json'] ?? null,
    output: parsed.output ?? null,
    xcframeworksPath: parsed['xcframeworks-path'] ?? null,
  };
}

/**
 * Reads autolinking.json and returns dependencies with iOS platform support.
 */
function readAutolinkingJson(
  filePath /*: string */,
) /*: RawAutolinkingJson | null */ {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Attempts to read react-native.config.js to find spm.modules entries.
 * These are extra modules not discoverable via autolinking.json.
 *
 * Expected structure in react-native.config.js:
 * module.exports = {
 *   ...
 *   spm: {
 *     modules: [
 *       {
 *         name: "MyNativeModule",
 *         path: "ios/MyNativeModule",            // relative to appRoot
 *         exclude: ["*.js", "*.podspec"],        // optional
 *         publicHeadersPath: ".",                // optional
 *       }
 *     ]
 *   }
 * }
 */
function readSpmModulesFromConfig(
  appRoot /*: string */,
) /*: Array<SpmModuleConfig> */ {
  const configPath = path.join(appRoot, 'react-native.config.js');
  if (!fs.existsSync(configPath)) {
    return [];
  }
  try {
    // $FlowFixMe[unsupported-syntax] dynamic require by computed path
    const config = require(configPath);
    return config.spm?.modules ?? [];
  } catch (e) {
    // Config might use Ruby interop or other patterns – skip
    return [];
  }
}

/**
 * Reads the app's `spm.denyPlugins` — npm names of autolinking plugins to
 * skip. The escape hatch for the transitive plugin discovery (an app opts a
 * framework's plugin OUT); no allowlist is required.
 */
function readDenyPluginsFromConfig(appRoot /*: string */) /*: Array<string> */ {
  const configPath = path.join(appRoot, 'react-native.config.js');
  if (!fs.existsSync(configPath)) {
    return [];
  }
  try {
    // $FlowFixMe[unsupported-syntax] dynamic require by computed path
    const config = require(configPath);
    return config.spm?.denyPlugins ?? [];
  } catch (e) {
    return [];
  }
}

/**
 * Returns "." if the source directory has .h/.hpp files directly at its root
 * AND no subdirectories exist at that root (adjacent subdirectories would cause
 * Clang to reject the umbrella header).
 * Returns null otherwise.
 */
function inferPublicHeadersPath(sourcePath /*: string */) /*: string | null */ {
  if (!fs.existsSync(sourcePath)) return null;
  const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean, isSymbolicLink(): boolean}> */ =
    // $FlowFixMe[incompatible-type] Dirent typing
    fs.readdirSync(sourcePath, {withFileTypes: true});
  const hasHeaders = entries.some(
    e =>
      (e.isFile() || e.isSymbolicLink()) &&
      (e.name.endsWith('.h') || e.name.endsWith('.hpp')),
  );
  const hasSubdirs = entries.some(e => e.isDirectory());
  // Only use "." if headers at root AND no adjacent subdirectories.
  // If both headers and subdirectories exist, Clang rejects the module map
  // (umbrella header + adjacent directories = error).
  return hasHeaders && !hasSubdirs ? '.' : null;
}

/*::
type ExtensionFilter = ReadonlySet<string>;
*/

const HEADER_EXTENSIONS /*: ExtensionFilter */ = new Set(['.h', '.hpp']);
const IMPL_EXTENSIONS /*: ExtensionFilter */ = new Set([
  '.m',
  '.mm',
  '.c',
  '.cpp',
  '.swift',
]);
const ALL_SOURCE_EXTENSIONS /*: ExtensionFilter */ = new Set([
  ...HEADER_EXTENSIONS,
  ...IMPL_EXTENSIONS,
]);

// Directory names whose contents should never be included in an SPM target —
// test fixtures, Android sources, vendored modules. Shared between the source
// walker and the header linker so they agree on what to skip.
const SKIP_DIRS_DEFAULT /*: ReadonlySet<string> */ = new Set([
  'android',
  'tests',
  '__tests__',
  '__mocks__',
  'test',
  'jest',
  'node_modules',
]);

// Name of the dir-symlink inside each wrapper that points at the dep's real
// source dir. With target.path = "." (the wrapper), SPM resolves source paths
// like "<WRAPPER_ROOT_NAME>/Foo.mm" by following this link.
const WRAPPER_ROOT_NAME = 'root';

// The config-gated C++ defines the prebuilt React.framework is built with (see
// packages/react-native/Package.swift). Autolinked Fabric C++ must compile with
// the same NDEBUG state, else DebugStringConvertible's vtable / ShadowNode
// layout diverges from a Release React.framework and the link fails.
const REACT_CXX_CONFIG_DEFINES = [
  '.define("DEBUG", .when(configuration: .debug))',
  '.define("NDEBUG", .when(configuration: .release))',
];

// Marker the autolinker stamps onto every synth Package.swift it writes.
// Files lacking this marker are treated as user-managed (self-managed) and
// are referenced directly rather than wrapped — see findSelfManagedPackageDir.
const AUTOGEN_MARKER =
  '// AUTO-GENERATED by scripts/generate-spm-autolinking.js';

/**
 * A dep is "self-managed" when it ships a hand-written Package.swift
 * (i.e. one that lacks our AUTOGEN_MARKER). The autolinker skips wrapping
 * it and references the manifest's directory directly — useful for
 * libraries that want to ship a real SPM manifest and have full control
 * over their target settings.
 *
 * Two layouts are recognized:
 *   1. <dep>/Package.swift            — manifest at the npm-package root
 *   2. <dep>/ios/Package.swift        — manifest co-located with ObjC
 *                                       sources, keeping the npm-package
 *                                       root free of SPM artifacts
 *                                       (.build/, .swiftpm/, Package.resolved)
 *
 * Returns the directory that contains the hand-authored manifest, or null
 * when no candidate exists. That directory is what the aggregator hands to
 * SPM as `.package(path:)` — for layout 2 that means `<dep>/ios`.
 */
function findSelfManagedPackageDir(absSource /*: string */) /*: ?string */ {
  for (const sub of ['', 'ios']) {
    const dir = sub === '' ? absSource : path.join(absSource, sub);
    try {
      const content = fs.readFileSync(path.join(dir, 'Package.swift'), 'utf8');
      if (!content.includes(AUTOGEN_MARKER)) {
        return dir;
      }
    } catch {
      // candidate does not exist; try the next one
    }
  }
  return null;
}

/**
 * Does this dep ship a CocoaPods podspec? (Checked at the dep root and under
 * ios/.) A missing manifest is auto-scaffoldable only when a podspec exists —
 * the scaffolder translates the podspec into a Package.swift.
 */
function hasPodspec(absSource /*: string */) /*: boolean */ {
  for (const sub of ['', 'ios']) {
    const dir = sub === '' ? absSource : path.join(absSource, sub);
    try {
      if (
        fs
          .readdirSync(dir)
          .some(e => e.endsWith('.podspec') && !e.startsWith('.spm-scaffold-'))
      ) {
        return true;
      }
    } catch {
      // dir does not exist; try the next candidate
    }
  }
  return false;
}

/**
 * True when a dep has BOTH Swift and C-family (.m/.mm/.c/.cpp) sources. SPM
 * cannot compile mixed-language sources in a single target, and RN libs that
 * mix them are typically bidirectionally coupled (ObjC↔Swift) — which can't be
 * split into two targets either (it would be a circular dependency). So such a
 * dep is unsupportable by the scaffolder; we surface a clear, distinct error
 * instead of emitting a manifest that fails with a cryptic SPM resolve error.
 * Heuristic filesystem scan (bounded depth; skips examples/tests/build noise).
 */
function hasMixedLanguageSources(absSource /*: string */) /*: boolean */ {
  const SKIP /*: Set<string> */ = new Set([
    'node_modules',
    'Pods',
    'build',
    '.git',
    '__tests__',
    'example',
    'Example',
    'examples',
  ]);
  let hasSwift = false;
  let hasClang = false;
  const walk = (dir /*: string */, depth /*: number */) => {
    if (depth > 6 || (hasSwift && hasClang)) return;
    let entries: Array<{name: string, isDirectory(): boolean}>;
    try {
      // $FlowFixMe[incompatible-type] Dirent typing
      entries = fs.readdirSync(dir, {withFileTypes: true});
    } catch {
      return;
    }
    for (const e of entries) {
      // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in stubs
      const name /*: string */ = e.name;
      if (e.isDirectory()) {
        if (!name.startsWith('.') && !SKIP.has(name)) {
          walk(path.join(dir, name), depth + 1);
        }
      } else if (/\.swift$/i.test(name)) {
        hasSwift = true;
      } else if (/\.(mm?|c|cc|cpp|cxx)$/i.test(name)) {
        hasClang = true;
      }
      if (hasSwift && hasClang) return;
    }
  };
  walk(absSource, 0);
  return hasSwift && hasClang;
}

/**
 * Error thrown when one or more autolinked community npm deps have no Swift
 * Package Manager manifest (neither a shipped Package.swift nor a scaffolded
 * one). The autolinker no longer silently synthesizes a manifest for these —
 * that hid the gap and duplicated the scaffolder. Carries the dep list so the
 * CLI can surface a precise, actionable message and set a distinct exit code
 * (the Xcode build phase keys off it to fail the build).
 */
class MissingManifestError extends Error {
  /*:: missingManifests: Array<{name: string, npmName: string, hasPodspec: boolean, mixed?: boolean}>; */
  constructor(
    deps /*: Array<{name: string, npmName: string, hasPodspec: boolean, mixed?: boolean}> */,
  ) {
    super(
      `${deps.length} autolinked native module(s) have no Package.swift. ` +
        'Run `npx react-native spm scaffold` to generate them.',
    );
    this.name = 'MissingManifestError';
    this.missingManifests = deps;
  }
}

/**
 * Prints one `error:`-prefixed line per missing-manifest dep so Xcode surfaces
 * each as a build error (Xcode parses lines beginning with `error: `), then
 * returns the MissingManifestError to throw. Kept together so the message and
 * the thrown error never drift.
 */
function reportMissingManifests(
  deps /*: Array<{name: string, npmName: string, hasPodspec: boolean, mixed?: boolean}> */,
) /*: MissingManifestError */ {
  for (const d of deps) {
    if (d.mixed === true) {
      console.error(
        `error: "${d.npmName}" has mixed Swift + Objective-C/C++ sources, which Swift Package Manager cannot compile in a single target (and its Swift↔ObjC interop typically can't be split into two targets without a circular dependency).\n` +
          `  • Opt it out of SPM autolinking in your app's react-native.config.js:\n` +
          `      module.exports = { dependencies: { '${d.npmName}': { platforms: { ios: null } } } };\n` +
          `  • Or consume ${d.npmName} as a prebuilt binary (xcframework) instead.`,
      );
      continue;
    }
    if (d.hasPodspec) {
      console.error(
        `error: Package.swift is missing for library "${d.npmName}" — it ships no Swift Package Manager support.\n` +
          `  1. Run \`npx react-native spm scaffold\` to generate a Package.swift for ${d.npmName}.\n` +
          `  2. Persist it with a patch: \`npx patch-package ${d.npmName}\`, and commit the patch (node_modules is not committed).\n` +
          `  3. Ask ${d.npmName}'s maintainer to ship a Package.swift upstream (or contribute one).\n` +
          '  4. Without a committed patch, this same error returns whenever node_modules is reset (fresh install / CI).',
      );
    } else {
      console.error(
        `error: Package.swift is missing for library "${d.npmName}", and it ships no podspec so it cannot be scaffolded automatically.\n` +
          `  • It needs Swift Package Manager support added manually — ask ${d.npmName}'s maintainer to ship a Package.swift upstream (or contribute one).`,
      );
    }
  }
  return new MissingManifestError(deps);
}

/**
 * Mirrors every header file under `srcDir` as a relative symlink at the same
 * relative location under `destDir`. Used for the centralized cross-package
 * headers tree at `<outputDir>/headers/<SwiftName>/` so consumers can resolve
 * `#import <SwiftName/Header.h>` via a single `-I <outputDir>/headers` flag.
 *
 * Idempotent: existing symlinks pointing at the right target are left alone;
 * stale entries are pruned. Header symlinks here are inert to Xcode (it
 * doesn't navigate them as editable source — they're compiler-only).
 */
function linkHeaderTree(
  srcDir /*: string */,
  destDir /*: string */,
  skipDirNames /*: Set<string> */ = new Set(),
) /*: void */ {
  if (!srcDir || !path.isAbsolute(srcDir)) {
    throw new Error(
      `linkHeaderTree: srcDir must be a non-empty absolute path, got: "${srcDir}"`,
    );
  }
  if (!destDir || !path.isAbsolute(destDir)) {
    throw new Error(
      `linkHeaderTree: destDir must be a non-empty absolute path, got: "${destDir}"`,
    );
  }
  if (!fs.existsSync(srcDir)) {
    return;
  }

  /*:: type HeaderEntry = {relSrc: string, absSrc: string}; */
  const headers /*: Array<HeaderEntry> */ = [];
  function collect(dir /*: string */, relBase /*: string */) /*: void */ {
    const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent typing
      fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of entries) {
      const {name} = entry;
      if (entry.isDirectory()) {
        if (SKIP_DIRS_DEFAULT.has(name) || skipDirNames.has(name)) continue;
        collect(path.join(dir, name), path.join(relBase, name));
      } else if (entry.isFile() && HEADER_EXTENSIONS.has(path.extname(name))) {
        headers.push({
          relSrc: path.join(relBase, name),
          absSrc: path.join(dir, name),
        });
      }
    }
  }
  collect(srcDir, '');

  if (headers.length === 0) {
    try {
      if (fs.lstatSync(destDir).isDirectory()) {
        fs.rmSync(destDir, {recursive: true, force: true});
      }
    } catch {
      // destDir does not exist – fine
    }
    return;
  }

  fs.mkdirSync(destDir, {recursive: true});

  const expected /*: Set<string> */ = new Set();
  for (const {relSrc, absSrc} of headers) {
    const linkPath = path.join(destDir, relSrc);
    expected.add(relSrc);
    fs.mkdirSync(path.dirname(linkPath), {recursive: true});
    const desiredTarget = path.relative(path.dirname(linkPath), absSrc);
    try {
      const existing = fs.lstatSync(linkPath);
      if (
        existing.isSymbolicLink() &&
        fs.readlinkSync(linkPath) === desiredTarget
      ) {
        continue;
      }
      fs.unlinkSync(linkPath);
    } catch {
      // nothing to remove
    }
    fs.symlinkSync(desiredTarget, linkPath);
  }

  // Prune stale entries: walk destDir and delete anything not in `expected`.
  function pruneWalk(dir /*: string */, relBase /*: string */) /*: void */ {
    if (!fs.existsSync(dir)) return;
    const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean, isSymbolicLink(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent typing
      fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of entries) {
      const rel = path.join(relBase, entry.name);
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        pruneWalk(abs, rel);
        if (fs.readdirSync(abs).length === 0) {
          fs.rmdirSync(abs);
        }
      } else {
        if (!expected.has(rel)) {
          fs.unlinkSync(abs);
        }
      }
    }
  }
  pruneWalk(destDir, '');
}

/**
 * Searches sourcePath for a PrivacyInfo.xcprivacy file (at root or one level deep).
 * Returns the relative path from sourcePath if found, null otherwise.
 */
function findPrivacyManifest(sourcePath /*: string */) /*: string | null */ {
  if (!fs.existsSync(sourcePath)) return null;
  // Check root level
  if (fs.existsSync(path.join(sourcePath, 'PrivacyInfo.xcprivacy'))) {
    return 'PrivacyInfo.xcprivacy';
  }
  // Check one level deep (e.g. ios/PrivacyInfo.xcprivacy)
  const entries /*: Array<{name: string, isDirectory(): boolean}> */ =
    // $FlowFixMe[incompatible-type] Dirent typing
    fs.readdirSync(sourcePath, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = path.join(sourcePath, entry.name, 'PrivacyInfo.xcprivacy');
      if (fs.existsSync(nested)) {
        return path.join(entry.name, 'PrivacyInfo.xcprivacy');
      }
    }
  }
  return null;
}

/**
 * Recursively yields forward-slash paths (relative to sourcePath) for every
 * regular file under sourcePath, skipping directories whose name is in
 * SKIP_DIRS_DEFAULT. Used as the building block for both the auto-discovery
 * (collectSpmSources) and explicit-glob (expandSpmSourceGlobs) paths so they
 * agree on what's a candidate before extension/glob filtering applies.
 */
function walkSourceFiles(sourcePath /*: string */) /*: Array<string> */ {
  const out /*: Array<string> */ = [];
  if (!fs.existsSync(sourcePath)) {
    return out;
  }
  function walk(dir /*: string */, rel /*: string */) /*: void */ {
    const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean, isSymbolicLink(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent typing
      fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of entries) {
      const {name} = entry;
      const childRel = rel === '' ? name : `${rel}/${name}`;
      if (entry.isDirectory()) {
        if (SKIP_DIRS_DEFAULT.has(name)) continue;
        walk(path.join(dir, name), childRel);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        out.push(childRel);
      }
    }
  }
  walk(sourcePath, '');
  return out;
}

/**
 * Idempotent symlink: ensure `linkPath` is a symlink to `target`. If it
 * already is, leave it untouched (preserves inode). If it points elsewhere
 * or is a real file/directory, replace it. Returns true when the symlink
 * was created or replaced, false when it was already correct.
 */
function ensureSymlink(
  linkPath /*: string */,
  target /*: string */,
) /*: boolean */ {
  try {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink() && fs.readlinkSync(linkPath) === target) {
      return false;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      fs.unlinkSync(linkPath);
    } else {
      fs.rmSync(linkPath, {recursive: true, force: true});
    }
  } catch {
    // linkPath does not exist – fine
  }
  fs.symlinkSync(target, linkPath);
  return true;
}

// Default sources allowlist when no explicit glob is provided — analog of
// CocoaPods' `s.source_files` auto-discovery.
function collectSpmSources(sourcePath /*: string */) /*: Array<string> */ {
  return walkSourceFiles(sourcePath)
    .filter(p => ALL_SOURCE_EXTENSIONS.has(path.extname(p)))
    .sort();
}

// Filters walkSourceFiles output through CocoaPods-style globs via micromatch.
// Skip-dir filtering applies before matching, so `**/*.{h,mm}` never returns
// paths under `tests/`, `android/`, etc. — even if the pattern would match.
function expandSpmSourceGlobs(
  sourcePath /*: string */,
  patterns /*: Array<string> */,
) /*: Array<string> */ {
  if (patterns.length === 0) {
    return [];
  }
  // $FlowFixMe[untyped-import] micromatch ships no types
  const micromatch = require('micromatch');
  return micromatch(walkSourceFiles(sourcePath), patterns).sort();
}

/**
 * Converts an autolinking.json dependency to an SPM target spec.
 * Returns null if the dependency doesn't have iOS support.
 *
 * `swiftNameByNpm` maps each autolinked dep's npm name to its resolved Swift
 * name (populated by expandSpmDependencies, possibly overridden via the dep's
 * `spm.name` config). Optional for backwards compatibility with callers that
 * don't have the map; falls back to `toSwiftName(name)` per entry.
 */
/**
 * Read the dep's podspec (if any) and extract its declared
 * `pod_target_xcconfig` HEADER_SEARCH_PATHS, substituted relative to the dep
 * source dir. Returns paths suitable for an SPM `.headerSearchPath()`
 * directive whose target.path is the dep root (entries are NOT yet prefixed
 * with the synth wrapper's `root/` — the emission site adds that prefix
 * because the wrapper's target.path is `.`, not the source dir).
 *
 * Without these, path-style angle includes like
 * `<react/renderer/components/safeareacontext/X.h>` (used by
 * react-native-safe-area-context, reanimated, screens, etc.) fail to resolve
 * because the headers live under the dep's `common/cpp/` rather than under
 * the framework-imported xcframework headers.
 */
function extractPodspecHeaderSearchPaths(
  sourceDir /*: string */,
) /*: Array<string> */ {
  let podspecPath /*: ?string */ = null;
  try {
    const entries = fs.readdirSync(sourceDir);
    // Skip a crashed run's leftover `.spm-scaffold-<pid>-<name>.podspec` copy.
    const candidate = entries.find(
      e => e.endsWith('.podspec') && !e.startsWith('.spm-scaffold-'),
    );
    if (candidate != null) {
      podspecPath = path.join(sourceDir, candidate);
    }
  } catch {
    return [];
  }
  if (podspecPath == null) return [];

  let model;
  try {
    model = readPodspec(podspecPath);
  } catch {
    return [];
  }

  const out /*: Array<string> */ = [];
  for (const raw of model.headerSearchPaths) {
    const substituted = raw
      .replace(/\$\(PODS_TARGET_SRCROOT\)/g, '.')
      .replace(/\$\{PODS_TARGET_SRCROOT\}/g, '.');
    // Drop entries still containing unresolved Xcode tokens — emitting them
    // verbatim would surface as clang "no such file" failures.
    if (/\$[({]/.test(substituted)) continue;
    const cleaned = substituted.replace(/^\.\//, '').replace(/^\//, '');
    if (cleaned.length > 0 && !out.includes(cleaned)) {
      out.push(cleaned);
    }
  }
  return out;
}

function autolinkingDepToSpmTarget(
  depName /*: string */,
  dep /*: AutolinkedDep */,
  outputDir /*: string */,
  swiftNameByNpm /*: ?Map<string, string> */,
) /*: SpmTarget | null */ {
  const iosPlatform = dep.platforms.ios;
  const sourceDir = iosPlatform.sourceDir ?? dep.root;
  if (sourceDir == null) {
    return null;
  }

  // target.path is stored relative to the autolinker's outputDir so main()'s
  // `path.resolve(outputDir, target.path)` recovers the absolute source dir —
  // same convention the spmModule branch in main() follows.
  const relSourcePath = path.relative(outputDir, sourceDir);

  // Prefer the resolved Swift name (which honors `spm.name` overrides set in
  // the dep's react-native.config.js). Fall back to toSwiftName(depName) when
  // the caller didn't run expandSpmDependencies.
  const targetName = dep.swiftName ?? toSwiftName(depName);

  // No exclude inference — main()'s emission loop emits `sources:` (an
  // explicit allowlist). User-supplied excludes still work.

  // Detect PrivacyInfo.xcprivacy
  const privacyManifest = findPrivacyManifest(sourceDir);
  const resources = privacyManifest != null ? [privacyManifest] : undefined;

  // Map declared spm.dependencies (npm names) to Swift target names so the
  // synth's .product(...) deps list reaches the consuming target. Each
  // transitive npm name's Swift name comes from the map (honoring overrides);
  // toSwiftName fallback handles entries the map doesn't know about.
  const spmDeps /*: Array<string> */ = dep.spmDependencies ?? [];
  const spmTargetDependencies =
    spmDeps.length > 0
      ? spmDeps.map(n => swiftNameByNpm?.get(n) ?? toSwiftName(n))
      : undefined;

  const headerSearchPaths = extractPodspecHeaderSearchPaths(sourceDir);

  return {
    name: targetName,
    path: relSourcePath,
    exclude: [],
    publicHeadersPath: inferPublicHeadersPath(sourceDir),
    resources,
    spmTargetDependencies,
    headerSearchPaths:
      headerSearchPaths.length > 0 ? headerSearchPaths : undefined,
  };
}

/**
 * Generates the full autolinked/Package.swift content.
 *
 * xcframeworksRelPath – path to the xcframeworks sub-package relative to the
 *   autolinked/ directory (e.g. "../build/xcframeworks"). When non-null a
 *   React dependency is declared. Headers need no search paths — React/react
 *   come from the ReactHeaders target, every other RN namespace from
 *   ReactNativeHeaders, folly/glog/boost from ReactNativeDependenciesHeaders,
 *   and the app's generated headers from the ReactAppHeaders product — so
 *   <React/...>, <ReactCommon/...>, <react/renderer/...>, folly/glog/boost,
 *   and <ReactCodegen/...> all resolve.
 */
/**
 * Top-level autolinked/Package.swift — a thin aggregator that references each
 * autolinked dep as its own sub-package (under packages/<SwiftName>) and
 * re-exports them through a single AutolinkedAggregate target. Per-dep
 * settings (header paths, cFlags, link order) live in each synth sub-package;
 * see generateSynthPackageSwift below.
 *
 * input: { deps: Array<{swiftName: string}> }
 */
function generateAutolinkedPackageSwift(
  input /*: AggregatorInput */,
) /*: string */ {
  const npmDeps /*: ReadonlyArray<NpmDepRef> */ = input.npmDeps ?? [];
  const inlineTargets /*: ReadonlyArray<SpmTarget> */ =
    input.inlineTargets ?? [];
  const hasReactDep /*: boolean */ = input.hasReactDep !== false;
  // Relative path from autolinked/ to build/xcframeworks/, e.g. "../build/xcframeworks".
  const xcframeworksRelPath /*: ?string */ = input.xcframeworksRelPath;
  // Autolinking-plugin contributions (Expo & other frameworks).
  const pluginPackageDeps /*: ReadonlyArray<PluginPackageDep> */ =
    input.pluginPackageDeps ?? [];
  const pluginProductDeps /*: ReadonlyArray<PluginProductDep> */ =
    input.pluginProductDeps ?? [];

  // Package-level dependencies: one .package(path:) per autolinked dep,
  // plus ReactNative if any inline target needs to import React headers.
  const packageDeps /*: Array<string> */ = npmDeps.map(d => {
    const pkgPath = d.packagePath ?? `packages/${d.swiftName}`;
    return `.package(name: "${d.swiftName}", path: "${pkgPath}")`;
  });
  // Framework plugin packages: local (path) or remote (url + exact version).
  for (const p of pluginPackageDeps) {
    packageDeps.push(
      p.path != null
        ? `.package(name: "${p.name}", path: "${p.path}")`
        : `.package(url: "${p.url ?? ''}", exact: "${p.version ?? ''}")`,
    );
  }
  if (
    inlineTargets.length > 0 &&
    hasReactDep &&
    typeof xcframeworksRelPath === 'string'
  ) {
    packageDeps.push(
      reactNativePackageDecl(
        `.package(name: "ReactNative", path: "${xcframeworksRelPath}")`,
      ),
    );
    // Per-app generated headers come from the ReactAppHeaders product in
    // the codegen package (sibling of the autolinking dir).
    packageDeps.push(`.package(name: "React-GeneratedCode", path: "../ios")`);
  }

  // AutolinkedAggregate's target dependencies: .product(...) for npm sub-package
  // products and .target(...) for inline spmModule targets in the same package.
  const aggregateDeps /*: Array<string> */ = [
    ...npmDeps.map(
      d => `.product(name: "${d.swiftName}", package: "${d.swiftName}")`,
    ),
    ...inlineTargets.map(t => `.target(name: "${t.name}")`),
    ...pluginProductDeps.map(
      p => `.product(name: "${p.name}", package: "${p.package}")`,
    ),
  ];

  const inlineDecls = inlineTargets.map(t => {
    const excludeLine =
      t.exclude && t.exclude.length > 0
        ? `\n            exclude: [${t.exclude.map(e => `"${e}"`).join(', ')}],`
        : '';
    const publicHeadersLine =
      t.publicHeadersPath != null
        ? `\n            publicHeadersPath: "${t.publicHeadersPath}",`
        : '';
    const resourcesLine =
      t.resources && t.resources.length > 0
        ? `\n            resources: [${t.resources.map(r => `.copy("${r}")`).join(', ')}],`
        : '';
    return `        .target(
            name: "${t.name}",
            dependencies: [${reactProductDeps()}],
            path: "${t.path}",${excludeLine}${publicHeadersLine}${resourcesLine}
            cxxSettings: [${REACT_CXX_CONFIG_DEFINES.join(', ')}],
            linkerSettings: [.linkedFramework("UIKit"), .linkedFramework("Foundation"), .linkedFramework("CoreGraphics")]
        )`;
  });

  const packageDepsBlock =
    packageDeps.length > 0
      ? `    dependencies: [\n        ${packageDeps.join(',\n        ')},\n    ],\n`
      : '';
  const aggregateDepsLine =
    aggregateDeps.length > 0
      ? `\n            dependencies: [${aggregateDeps.join(', ')}],`
      : '';

  const inlineDeclsBlock =
    inlineDecls.length > 0 ? `,\n${inlineDecls.join(',\n')}` : '';

  // Eval-time missing-manifest guard. SwiftPM resolves the package graph BEFORE
  // the Xcode "Sync SPM Autolinking" build phase runs, so a community library
  // whose Package.swift is absent at resolution time (e.g. a scaffolded manifest
  // wiped by a node_modules reset without a committed patch) fails resolution
  // with an opaque "package manifest cannot be accessed" error — and the
  // actionable sync-phase message never prints. Manifest evaluation may READ the
  // filesystem (only writes are sandboxed), so the aggregator checks each
  // referenced library here and explains the cause + fix at resolution time.
  const guardEntries = npmDeps.map(d => {
    const pkgPath = d.packagePath ?? `packages/${d.swiftName}`;
    return `    (path: "${pkgPath}", npm: "${d.npmName ?? d.swiftName}")`;
  });
  const guardBlock =
    guardEntries.length > 0
      ? `// Eval-time guard: surface a wiped/absent library Package.swift here (at
// resolution) instead of the opaque SwiftPM "manifest cannot be accessed".
let __rnAutolinkedLibs: [(path: String, npm: String)] = [
${guardEntries.join(',\n')},
]
do {
    let __here = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
    let __missing = __rnAutolinkedLibs.filter {
        !FileManager.default.fileExists(
            atPath: __here.appendingPathComponent($0.path)
                .appendingPathComponent("Package.swift").path)
    }
    if !__missing.isEmpty {
        var __msg = ""
        for lib in __missing {
            __msg += "error: Package.swift is missing for library \\"\\(lib.npm)\\" — its Swift Package Manager manifest is not present (a scaffolded manifest wiped by a node_modules reset without a committed patch, or the library ships none).\\n"
            __msg += "  1. Run \`npx react-native spm scaffold\` to (re)generate it.\\n"
            __msg += "  2. Persist it with \`npx patch-package \\(lib.npm)\` and commit the patch (node_modules is not committed).\\n"
            __msg += "  3. Ask \\(lib.npm)'s maintainer to ship a Package.swift upstream.\\n"
            __msg += "  4. Without a committed patch, this error returns on every fresh install / CI.\\n"
        }
        FileHandle.standardError.write(Data(__msg.utf8))
        fatalError("Missing Package.swift for: \\(__missing.map { $0.npm }.joined(separator: ", ")). See the message above.")
    }
}

`
      : '';

  return `// swift-tools-version: 6.0
// AUTO-GENERATED by scripts/generate-spm-autolinking.js – do not edit manually.
// Top-level Autolinked package. Every autolinked dep (npm or spmModule) is
// referenced as .package(path: <dep-source-dir>) — each has its own synth
// Package.swift written in-place. AutolinkedAggregate depends on every dep's
// product so the app build pulls them all in.

import PackageDescription
import Foundation

${guardBlock}let package = Package(
    name: "Autolinked",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "Autolinked", targets: ["AutolinkedAggregate"]),
    ],
${packageDepsBlock}    targets: [
        .target(
            name: "AutolinkedAggregate",${aggregateDepsLine}
            path: "AutolinkedAggregate"
        )${inlineDeclsBlock}
    ],
    cxxLanguageStandard: .cxx20
)
`;
}

/**
 * Per-dep synthesized Package.swift, written at
 * <outputDir>/packages/<SwiftName>/Package.swift. `targetPath` points at a
 * `root` directory symlink to the real source dir, so source files stay real
 * (Xcode atomic-save works).
 *
 * The React + codegen package references are plain relative paths supplied by
 * the caller (`reactNativePackagePath` / `codegenPackagePath`), computed from
 * the synth's fixed location under the autolinking dir — the manifest holds no
 * runtime discovery and no absolute paths. Headers are served by the
 * ReactHeaders/ReactNativeHeaders/ReactNativeDependenciesHeaders targets and
 * the ReactAppHeaders product, so no
 * search-path flags are needed. Siblings use their absolute synth path from
 * `siblingSynthAbsolutePaths` (production) or a `siblingPackageBaseRelative`
 * fallback (tests).
 */
function generateSynthPackageSwift(spec /*: SynthPackageSpec */) /*: string */ {
  const swiftName /*: string */ = spec.swiftName;
  const exclude /*: Array<string> */ = spec.exclude ?? [];
  const sources /*: ?Array<string> */ = spec.sources;
  const publicHeadersPath /*: ?string */ = spec.publicHeadersPath ?? null;
  // Per-dep header search paths from the podspec's
  // pod_target_xcconfig HEADER_SEARCH_PATHS — already prefixed by the caller
  // with the synth wrapper's `root/` so they resolve relative to target.path.
  // Emitted as `.headerSearchPath()` directives, which SPM accepts on
  // cSettings / cxxSettings without needing absolute paths.
  const headerSearchPaths /*: Array<string> */ = spec.headerSearchPaths ?? [];
  const spmDependencies /*: Array<{swiftName: string}> */ =
    spec.spmDependencies ?? [];
  const hasReactDep /*: boolean */ = spec.hasReactDep !== false;
  const resources /*: ?Array<string> */ = spec.resources;
  const isDynamic /*: boolean */ = spec.isDynamic !== false;
  const targetPath /*: string */ = spec.targetPath ?? `Sources/${swiftName}`;
  const siblingSynthAbsolutePaths /*: {[string]: string} */ =
    spec.siblingSynthAbsolutePaths ?? {};

  // Package dependencies — ReactNative + each spm sibling synth package.
  // The React + codegen package paths are plain relative strings computed by
  // the caller at generation time (the synth always lives at a fixed depth
  // under the autolinking dir, and is regenerated on every `react-native
  // spm` run), so the manifest holds no runtime discovery. Siblings use their
  // absolute synth path when the caller provides one (production); else a
  // relative fallback.
  const packageDeps /*: Array<string> */ = [];
  if (hasReactDep) {
    const reactNativePackagePath /*: string */ =
      spec.reactNativePackagePath ?? '../../../../xcframeworks';
    const codegenPackagePath /*: string */ =
      spec.codegenPackagePath ?? '../../../ios';
    packageDeps.push(
      reactNativePackageDecl(
        `.package(name: "ReactNative", path: "${reactNativePackagePath}")`,
      ),
    );
    // Per-app generated headers come from the ReactAppHeaders product in
    // the codegen package.
    packageDeps.push(
      `.package(name: "React-GeneratedCode", path: "${codegenPackagePath}")`,
    );
  }
  for (const dep of spmDependencies) {
    const absPath = siblingSynthAbsolutePaths[dep.swiftName];
    if (absPath != null) {
      packageDeps.push(
        `.package(name: "${dep.swiftName}", path: "${absPath}")`,
      );
    } else {
      const siblingRel /*: string */ = spec.siblingPackageBaseRelative ?? '..';
      packageDeps.push(
        `.package(name: "${dep.swiftName}", path: "${siblingRel}/${dep.swiftName}")`,
      );
    }
  }

  // Target dependencies — products from each declared package dep.
  const targetDeps /*: Array<string> */ = [];
  if (hasReactDep) {
    targetDeps.push(reactProductDeps());
  }
  for (const dep of spmDependencies) {
    targetDeps.push(
      `.product(name: "${dep.swiftName}", package: "${dep.swiftName}")`,
    );
  }

  const excludeLine =
    exclude.length > 0
      ? `\n            exclude: [${exclude.map(e => `"${e}"`).join(', ')}],`
      : '';
  // sources: explicit allowlist. One file per line because lists can run to
  // dozens of entries and an unbroken array becomes unreadable in diffs.
  const sourcesLine =
    sources != null && sources.length > 0
      ? `\n            sources: [\n${sources.map(s => `                "${s}",`).join('\n')}\n            ],`
      : '';
  const publicHeadersLine =
    publicHeadersPath != null
      ? `\n            publicHeadersPath: "${publicHeadersPath}",`
      : '';
  const resourcesLine =
    resources != null && resources.length > 0
      ? `\n            resources: [${resources.map(r => `.copy("${r}")`).join(', ')}],`
      : '';

  const packageDepsBlock =
    packageDeps.length > 0
      ? `    dependencies: [\n        ${packageDeps.join(',\n        ')},\n    ],\n`
      : '';
  // `.headerSearchPath(...)` entries from the podspec — first-class
  // directives keep SPM's diagnostics meaningful (clang reports the
  // dep-relative path on miss). React headers need no paths at all.
  const headerSearchPathList = headerSearchPaths.map(
    p => `.headerSearchPath("${p}")`,
  );
  const cSettingsLine =
    headerSearchPathList.length > 0
      ? `\n            cSettings: [${headerSearchPathList.join(', ')}],`
      : '';
  // ALWAYS emit the config-gated C++ defines (even with no header paths): a
  // Fabric C++ target must compile with the same NDEBUG state as the prebuilt
  // React.framework, else DebugStringConvertible's vtable / ShadowNode layout
  // diverges and a Release build fails to link. Mirrors Package.swift.
  const cxxEntries = [...REACT_CXX_CONFIG_DEFINES, ...headerSearchPathList];
  const cxxSettingsLine = `\n            cxxSettings: [${cxxEntries.join(', ')}],`;

  return `// swift-tools-version: 6.0
// AUTO-GENERATED by scripts/generate-spm-autolinking.js – do not edit manually.
// Synth Package.swift for autolinked dep "${swiftName}".

import PackageDescription

let package = Package(
    name: "${swiftName}",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "${swiftName}"${isDynamic ? ', type: .dynamic' : ''}, targets: ["${swiftName}"]),
    ],
${packageDepsBlock}    targets: [
        .target(
            name: "${swiftName}",
            dependencies: [${targetDeps.join(', ')}],
            path: "${targetPath}",${excludeLine}${sourcesLine}${publicHeadersLine}${resourcesLine}${cSettingsLine}${cxxSettingsLine}
            linkerSettings: [.linkedFramework("UIKit"), .linkedFramework("Foundation"), .linkedFramework("CoreGraphics")]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
`;
}

function main(argv /*:: ?: Array<string> */) /*: void */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  // Resolve to absolute so path.join() produces absolute paths everywhere —
  // entryAbsDirs, the headers farm, etc. all assume an absolute appRoot.
  const appRoot = path.resolve(args.appRoot);
  remoteCfg = remotePackageConfig(appRoot);
  if (remoteCfg != null) {
    log(`Remote ReactNative package: ${remoteCfg.url} @ ${remoteCfg.version}`);
  }

  let rnRoot = args.reactNativeRoot;
  if (rnRoot == null) {
    rnRoot = path.join(appRoot, 'node_modules', 'react-native');
    if (!fs.existsSync(rnRoot)) {
      // Monorepo: try walking up
      let dir = appRoot;
      for (let i = 0; i < 5; i++) {
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
        const c = path.join(dir, 'node_modules', 'react-native');
        if (fs.existsSync(c)) {
          rnRoot = c;
          break;
        }
      }
    }
    if (rnRoot == null || !fs.existsSync(rnRoot)) {
      console.error(
        '[generate-spm-autolinking] Could not find react-native. Pass --react-native-root.',
      );
      process.exitCode = 1;
      return;
    }
  }

  const autolinkingJsonPath =
    args.autolinkingJson ??
    path.join(appRoot, 'build', 'generated', 'autolinking', 'autolinking.json');

  // Output lands under <appRoot>/build/generated/autolinking/ — co-located
  // with autolinking.json (written by generate-spm-autolinking-config.js) and
  // alongside the iOS-conventional build/ tree (Pods/, build/xcframeworks/…).
  const outputDir =
    args.output != null
      ? path.resolve(appRoot, args.output)
      : path.join(appRoot, 'build', 'generated', 'autolinking');

  // Collect all targets along with their routing metadata.
  const entries /*: Array<TargetEntry> */ = [];
  // Autolinking plugins discovered from deps' react-native.config.js
  // (populated during the dep walk below; invoked before the aggregator write).
  let discoveredPlugins /*: Array<DiscoveredPlugin> */ = [];

  // 1. From autolinking.json (npm packages with iOS native modules), expanded
  //    with transitive deps declared via `spm.dependencies` in each package's
  //    react-native.config.js (analog of podspec `s.dependency`).
  const autolinkingData = readAutolinkingJson(autolinkingJsonPath);
  const depsMap = autolinkingData?.dependencies;
  if (depsMap != null) {
    // Narrow each on-disk AutolinkingDepJson into the validated AutolinkedDep
    // shape expected by expandSpmDependencies and autolinkingDepToSpmTarget.
    const directDeps /*: Array<AutolinkedDep> */ = [];
    for (const name of Object.keys(depsMap)) {
      const dep = depsMap[name];
      if (dep == null) continue;
      const iosPlatform = dep.platforms?.ios;
      const root = dep.root;
      if (iosPlatform == null || root == null) continue;
      directDeps.push({
        name,
        root,
        platforms: {ios: iosPlatform},
      });
    }
    const allDeps = expandSpmDependencies(directDeps, {
      readConfig: defaultReadConfig,
      resolveDep: defaultResolveDep,
    });

    // Map every autolinked npm name to its resolved Swift name (post-override)
    // so transitive references inside autolinkingDepToSpmTarget find the right
    // target identifier — not just the auto-derived toSwiftName.
    const swiftNameByNpm /*: Map<string, string> */ = new Map();
    for (const dep of allDeps) {
      if (dep.swiftName != null) {
        swiftNameByNpm.set(dep.name, dep.swiftName);
      }
    }

    // Discover framework autolinking plugins (Expo & others) from the same
    // dep set — invoked before the aggregator is written (below).
    discoveredPlugins = discoverPlugins(
      allDeps,
      defaultReadConfig,
      readDenyPluginsFromConfig(appRoot),
    );
    for (const p of discoveredPlugins) {
      log(`Found SPM autolinking plugin: ${p.depName}`);
    }

    // A dep that declares an autolinking plugin OWNS its native contribution:
    // the plugin (invoked below) returns its package/product/generated-source
    // deps. RN must not also try to source-build that package through the
    // community-lib path — it typically has no Package.swift and may be mixed
    // Swift/ObjC (e.g. expo → ExpoModulesCore), which would throw before the
    // plugin ever runs. Mirrors CocoaPods: `use_expo_modules!` owns Expo's
    // pods; podspec autolinking doesn't also build Expo as a community lib.
    // Skipping here also keeps the dep out of `entries` → out of the
    // missing-manifest scan and the aggregator's package refs.
    const pluginHostDeps /*: Set<string> */ = new Set(
      discoveredPlugins.map(p => p.depName),
    );

    for (const dep of allDeps) {
      if (pluginHostDeps.has(dep.name)) {
        log(
          `Skipping ${dep.name} target generation — provided by its SPM autolinking plugin`,
        );
        continue;
      }
      const target = autolinkingDepToSpmTarget(
        dep.name,
        dep,
        outputDir,
        swiftNameByNpm,
      );
      if (target != null) {
        entries.push({
          target,
          origin: 'npm',
          npmName: dep.name,
          root: dep.root,
        });
        log(`Found npm native module: ${target.name} → ${target.path}`);
      }
    }
  } else {
    log(
      `No autolinking.json found at ${path.relative(appRoot, autolinkingJsonPath)} or no dependencies. Using only built-in modules.`,
    );
  }

  // 2. From react-native.config.js spm.modules (user-defined extra modules).
  // If the module declares `sources: [glob, ...]` (CocoaPods-style), expand
  // the globs now relative to its dir and attach the file list to the target
  // so the emission loop below renders `sources: [...]` literally.
  const configModules = readSpmModulesFromConfig(appRoot);
  for (const mod of configModules) {
    const absPath = path.resolve(appRoot, mod.path);
    const relPath = path.relative(outputDir, absPath);
    const userSources =
      Array.isArray(mod.sources) && mod.sources.length > 0
        ? expandSpmSourceGlobs(absPath, mod.sources)
        : null;
    entries.push({
      target: {
        name: mod.name,
        path: relPath,
        exclude: mod.exclude ?? [],
        publicHeadersPath: mod.publicHeadersPath ?? null,
        sources: userSources,
      },
      origin: 'spmModule',
    });
    log(`Config module: ${mod.name} → ${relPath}`);
  }

  // Resolve xcframeworks package path relative to outputDir (autolinked/).
  // When provided this causes each target to declare a React dependency so
  // Xcode adds the xcframework's header search paths (needed for <React/...>).
  // Always set xcframeworksRelPath to the default even if the directory doesn't
  // exist yet — on first run, step 2 (autolinking) runs before step 4
  // (xcframework symlinks), but the generated Swift code resolves paths at
  // Xcode build time, not generation time.
  let xcframeworksRelPath /*: string | null */ = null;
  const absXcframeworks /*: string */ =
    args.xcframeworksPath != null
      ? path.resolve(appRoot, args.xcframeworksPath)
      : path.join(appRoot, 'build', 'xcframeworks');
  xcframeworksRelPath = path.relative(outputDir, absXcframeworks);

  if (xcframeworksRelPath != null) {
    log(
      `React xcframeworks → ${xcframeworksRelPath} (relative to autolinked/)`,
    );
  }

  // Whether autolinked targets declare a React dependency at all. Headers are
  // served by the ReactHeaders/ReactNativeHeaders/ReactNativeDependenciesHeaders
  // binaryTargets and the ReactAppHeaders product — no `-I` flags anywhere.
  const hasReactDep = xcframeworksRelPath != null;

  // Each entry gets a wrapper dir at <outputDir>/packages/<SwiftName>/ that
  // contains the synth Package.swift and a `root` directory symlink pointing
  // at the dep's real source dir. SPM derives package identity from the path
  // basename, so the wrapper's unique name (SwiftName) sidesteps the basename
  // collision that in-place at the source dir would have. Files inside the
  // source dir stay real, so Xcode's atomic-save works through the dir
  // symlink (intermediate path components — even symlinks — resolve cleanly;
  // the issue was only file-symlinks as the final path component).
  const entryAbsDirs /*: Map<string, string> */ = new Map();
  for (const entry of entries) {
    entryAbsDirs.set(
      entry.target.name,
      path.resolve(outputDir, entry.target.path),
    );
  }

  const packagesDir = path.join(outputDir, 'packages');
  const headersDir = path.join(outputDir, 'headers');
  // libs/<SwiftName>/ symlinks for self-managed deps. The symlink basename
  // is the Swift module name (guaranteed unique per dep), so SPM's
  // path-basename-based package identity never collides — even when two
  // libs ship their own Package.swift inside `ios/` (a common convention).
  // Wiped on every run; populated below as self-managed deps are visited.
  const libsDir = path.join(outputDir, 'libs');
  fs.mkdirSync(packagesDir, {recursive: true});
  fs.mkdirSync(headersDir, {recursive: true});
  fs.rmSync(libsDir, {recursive: true, force: true});
  fs.mkdirSync(libsDir, {recursive: true});

  const wrapperDirs /*: Map<string, string> */ = new Map();
  const selfManagedDirs /*: Map<string, string> */ = new Map();
  const aggregatorPackageDeps /*: Array<NpmDepRef> */ = [];
  // Community npm deps that autolink but ship/scaffold no Package.swift. We no
  // longer silently synthesize one for them (that duplicated the scaffolder and
  // hid the gap from the developer and the library author) — collect them and
  // fail with an actionable message after the classification pass. spmModules
  // (app-local, podspec-less, explicitly declared in react-native.config.js)
  // keep their synth wrappers: there is nothing to scaffold for them.
  const missingManifests /*: Array<{name: string, npmName: string, hasPodspec: boolean, mixed?: boolean}> */ =
    [];

  for (const entry of entries) {
    const {target} = entry;
    const absSource /*: string */ = entryAbsDirs.get(target.name) ?? '';
    if (!fs.existsSync(absSource)) {
      log(`Skipping ${target.name}: source dir missing (${absSource})`);
      continue;
    }
    const selfManagedDir = findSelfManagedPackageDir(absSource);
    if (selfManagedDir != null) {
      // Record the manifest's actual directory — for the nested layout this
      // is <dep>/ios, not <dep>. SPM resolves `.package(path:)` against that
      // directory expecting Package.swift to live alongside.
      selfManagedDirs.set(target.name, selfManagedDir);
      // If a wrapper exists from a prior synth-mode run (i.e. the dep WAS
      // autolinker-wrapped, then later transitioned to self-managed via
      // `spm scaffold` or shipping its own Package.swift), remove the
      // wrapper now. Without this, the pruning loop below preserves it
      // (because the dep is "active" via selfManagedDirs) and Xcode's
      // SwiftPM cache picks up the stale wrapper Package.swift instead of
      // the self-managed one.
      const staleWrapper = path.join(packagesDir, target.name);
      if (fs.existsSync(staleWrapper)) {
        fs.rmSync(staleWrapper, {recursive: true, force: true});
        log(`Removed stale wrapper: packages/${target.name}/`);
      }
      log(
        `Self-managed: ${target.name} → ${path.relative(appRoot, selfManagedDir)} (using its own Package.swift)`,
      );
      continue;
    }
    if (entry.origin === 'npm') {
      // No shipped or scaffolded manifest — this is the gap we now surface.
      // A mixed-language dep is reported distinctly (it can't be scaffolded at
      // all, so "run spm scaffold" would be misleading).
      missingManifests.push({
        name: target.name,
        npmName: entry.npmName ?? target.name,
        hasPodspec: hasPodspec(absSource),
        mixed: hasMixedLanguageSources(absSource),
      });
      // Drop any stale wrapper from a previous synth-mode run so SPM doesn't
      // resolve against it.
      const staleWrapper = path.join(packagesDir, target.name);
      if (fs.existsSync(staleWrapper)) {
        fs.rmSync(staleWrapper, {recursive: true, force: true});
      }
      continue;
    }
    // spmModule: synth wrapper is the legitimate mechanism (no podspec exists
    // to scaffold from, and the app developer declared it explicitly). But a
    // mixed-language module can't be wrapped either — SPM can't compile Swift +
    // C-family sources in one target, and a synth wrapper would fail with a
    // cryptic SPM resolve error. Surface the same friendly diagnostic the
    // community-dep path uses instead of letting SPM emit the cryptic one.
    if (hasMixedLanguageSources(absSource)) {
      throw new Error(
        `react-native autolinking: the spm.module "${target.name}" mixes Swift ` +
          `and C-family (.m/.mm/.c/.cpp) sources, which SwiftPM cannot compile ` +
          `in a single target. Split it into separate single-language modules, ` +
          `or ship a hand-written Package.swift with multiple targets.`,
      );
    }
    const wrapperDir = path.join(packagesDir, target.name);
    wrapperDirs.set(target.name, wrapperDir);
    fs.mkdirSync(wrapperDir, {recursive: true});
    ensureSymlink(path.join(wrapperDir, WRAPPER_ROOT_NAME), absSource);
  }

  // Fail before writing any wrappers/aggregator: a missing community-lib
  // manifest is a hard error the developer must resolve by scaffolding (or the
  // library shipping its own). reportMissingManifests prints one `error:` line
  // per dep so Xcode renders them as build errors.
  if (missingManifests.length > 0) {
    throw reportMissingManifests(missingManifests);
  }

  // Sibling refs: each synth Package.swift declares its sibling deps via the
  // dep's actual package root — wrapper dir for autolinker-managed deps,
  // source dir for self-managed ones. SPM identity stays unique either way
  // (wrapper basename = SwiftName; self-managed manifests declare the same
  // package name).
  const siblingPackagePaths /*: {[string]: string} */ = {};
  for (const [name, wrapper] of wrapperDirs.entries()) {
    siblingPackagePaths[name] = wrapper;
  }
  for (const [name, sourceDir] of selfManagedDirs.entries()) {
    siblingPackagePaths[name] = sourceDir;
  }

  for (const entry of entries) {
    const {target} = entry;
    const absSource /*: string */ = entryAbsDirs.get(target.name) ?? '';

    // Self-managed deps: skip the synth step entirely. The dep's own
    // Package.swift handles its targets, headers, and React framework
    // wiring. We just register it with the aggregator so the app pulls it
    // in alongside autolinker-managed deps. The central headers/<SwiftName>/
    // tree still gets populated so consumers (host app + sibling synths
    // that hit -I autolinking/headers) can resolve `<SwiftName/Header.h>`
    // by file path — synth packages use `-fno-implicit-module-maps`, so
    // we can't rely on SPM's auto-generated module map alone.
    if (selfManagedDirs.has(target.name)) {
      // Centralized headers tree walks the WHOLE dep root, not just the
      // manifest's directory — headers may live anywhere (e.g. common/cpp/
      // outside of ios/), and cross-package consumers should still resolve
      // them via the centralized -I path.
      linkHeaderTree(absSource, path.join(headersDir, target.name));
      // Route the manifest reference through a uniquely-named symlink at
      // libs/<SwiftName>/ so SPM derives the package identity from the
      // alias basename. Two libs that both ship Package.swift inside their
      // own `ios/` subdir would otherwise collide with identity "ios".
      const realPackageDir = selfManagedDirs.get(target.name) ?? absSource;
      const aliasPath = path.join(libsDir, target.name);
      ensureSymlink(aliasPath, realPackageDir);
      aggregatorPackageDeps.push({
        swiftName: target.name,
        packagePath: `libs/${target.name}`,
        npmName: entry.npmName ?? target.name,
      });
      continue;
    }

    const wrapperDir = wrapperDirs.get(target.name);
    if (wrapperDir == null) continue;
    const skipDirNames = new Set(
      (target.exclude || [])
        .filter(e => e.endsWith('/'))
        .map(e => e.slice(0, -1)),
    );

    const siblingSynthAbsolutePaths /*: {[string]: string} */ = {};
    for (const sibling of target.spmTargetDependencies ?? []) {
      const sibPath = siblingPackagePaths[sibling];
      if (sibPath != null) {
        siblingSynthAbsolutePaths[sibling] = sibPath;
      }
    }

    // target.path = "." (the wrapper dir) so SPM sees an empty `include/`
    // sibling of `root/` for its required `publicHeadersPath`. Without that,
    // SPM defaults publicHeadersPath to "include" and errors out when no
    // such dir exists inside the dep's source tree. Sources come from
    // `root/<...>` via the dir symlink — paths from auto-discovery or
    // user globs are relative to the dep's source dir, so we prefix with
    // `root/` to keep them inside target.path.
    const withRoot = (p /*: string */) => `${WRAPPER_ROOT_NAME}/${p}`;
    const prefixedExclude /*: Array<string> */ = (target.exclude ?? []).map(
      withRoot,
    );
    const prefixedResources /*: ?Array<string> */ =
      target.resources != null ? target.resources.map(withRoot) : undefined;

    // sources: explicit allowlist. Pre-resolved on the target (spmModule
    // glob expansion) or auto-collected here. We always emit `sources:` so
    // SPM never falls back to scanning the source dir verbatim (which would
    // pick up tests/, *.js, *.podspec, etc.).
    const rawSources /*: Array<string> */ =
      target.sources != null && target.sources.length > 0
        ? target.sources
        : collectSpmSources(absSource);
    const prefixedSources /*: ?Array<string> */ =
      rawSources.length > 0 ? rawSources.map(withRoot) : null;

    // Podspec HEADER_SEARCH_PATHS were captured relative to the dep's source
    // dir. The wrapper exposes the source dir under `root/` (target.path is
    // `.`, the wrapper dir), so each entry must be prefixed with `root/` so
    // clang sees the real subtree.
    const prefixedHeaderSearchPaths /*: ?Array<string> */ =
      target.headerSearchPaths != null && target.headerSearchPaths.length > 0
        ? target.headerSearchPaths.map(withRoot)
        : null;

    const synthContent = generateSynthPackageSwift({
      swiftName: target.name,
      exclude: prefixedExclude,
      sources: prefixedSources,
      // Stub include/ subdir lives in the wrapper dir; satisfies SPM's
      // publicHeadersPath requirement without exposing anything. Cross-pkg
      // angle includes resolve through the merged header tree (the autolinking
      // header farm at <outputDir>/headers is folded into it).
      publicHeadersPath: 'include',
      resources: prefixedResources,
      headerSearchPaths: prefixedHeaderSearchPaths,
      spmDependencies: (target.spmTargetDependencies ?? []).map(swiftName => ({
        swiftName,
      })),
      hasReactDep,
      // Relative paths from the synth dir (<outputDir>/packages/<Name>) to the
      // app's React xcframeworks + codegen packages. Computed here because the
      // synth's depth is fixed and it is regenerated every run — no runtime
      // discovery needed in the manifest.
      reactNativePackagePath: toPosix(
        path.relative(wrapperDir, absXcframeworks),
      ),
      codegenPackagePath: toPosix(
        path.relative(
          wrapperDir,
          path.join(appRoot, 'build', 'generated', 'ios'),
        ),
      ),
      isDynamic: false,
      targetPath: '.',
      siblingSynthAbsolutePaths,
    });

    fs.writeFileSync(
      path.join(wrapperDir, 'Package.swift'),
      synthContent,
      'utf8',
    );
    // Centralized headers tree at <outputDir>/headers/<SwiftName>/<relpath>.h.
    // Used two ways:
    //   * SPM-internal: cFlags add `-I <outputDir>/headers`, so cross-package
    //     angle includes like <SwiftName/Header.h> resolve.
    //   * Host app + sibling consumers: each wrapper's `include/` is a dir
    //     symlink to its slice of this tree, so `#import <RelPath/Header.h>`
    //     (e.g. <ReactCommon/RCTSampleTurboModule.h>) resolves through SPM's
    //     publicHeadersPath propagation (-I .../packages/<SwiftName>/include).
    const pkgHeadersDir = path.join(headersDir, target.name);
    linkHeaderTree(absSource, pkgHeadersDir, skipDirNames);

    const includePath = path.join(wrapperDir, 'include');
    if (fs.existsSync(pkgHeadersDir)) {
      ensureSymlink(includePath, pkgHeadersDir);
    } else {
      // Header-less package (rare): keep an empty dir so SPM's
      // publicHeadersPath: "include" requirement is still satisfied.
      fs.mkdirSync(includePath, {recursive: true});
    }

    log(
      `Synth: packages/${target.name}/ → ${path.relative(appRoot, absSource)}`,
    );

    aggregatorPackageDeps.push({
      swiftName: target.name,
      packagePath: `packages/${target.name}`,
    });
  }

  // Prune stale wrappers + header dirs for entries no longer autolinked.
  // Preserve both wrapper-managed and self-managed names; only entries that
  // are no longer autolinked at all get removed. Note: `packages/` only has
  // wrapper-managed names (self-managed deps live in their own source dirs),
  // but `headers/` has both since we populate the central tree for everyone.
  const activeNames /*: Set<string> */ = new Set([
    ...wrapperDirs.keys(),
    ...selfManagedDirs.keys(),
  ]);
  for (const subdir of ['packages', 'headers']) {
    const dir = path.join(outputDir, subdir);
    try {
      const existing /*: Array<{name: string, isSymbolicLink(): boolean, isDirectory(): boolean}> */ =
        // $FlowFixMe[incompatible-type] Dirent typing
        fs.readdirSync(dir, {withFileTypes: true});
      for (const entry of existing) {
        if (activeNames.has(entry.name)) continue;
        const stale = path.join(dir, entry.name);
        if (entry.isSymbolicLink() || !entry.isDirectory()) {
          fs.unlinkSync(stale);
        } else {
          fs.rmSync(stale, {recursive: true, force: true});
        }
        log(`Removed stale ${subdir}/${entry.name}`);
      }
    } catch {
      // dir doesn't exist – fine
    }
  }

  // Invoke discovered framework plugins now that the RN dep graph + autolinking
  // data are final. Their package/product contributions merge into the
  // aggregator below; this runs in add/update AND every build-time sync (both
  // call main), so a plugin's contribution survives every regeneration.
  let pluginPackageDeps /*: Array<PluginPackageDep> */ = [];
  let pluginProductDeps /*: Array<PluginProductDep> */ = [];
  let pluginGeneratedSources /*: Array<{path: string}> */ = [];
  let pluginFlavoredFrameworks /*: Array<PluginFlavoredFramework> */ = [];
  let pluginWatchPaths /*: Array<string> */ = [];
  if (discoveredPlugins.length > 0) {
    // React-GeneratedCode is the per-app codegen package (referenced as
    // `../ios` from outputDir). It may be absent (no codegen this run), so the
    // descriptor only lists its products when it actually resolves.
    const codegenPackageExists = fs.existsSync(
      path.join(outputDir, '..', 'ios', 'Package.swift'),
    );
    const result = invokePlugins(
      discoveredPlugins,
      {
        appRoot,
        projectRoot: findProjectRoot(appRoot),
        reactNativeRoot: rnRoot,
        autolinking: autolinkingData ?? {},
        outputDir,
        react: reactDescriptor(
          absXcframeworks,
          xcframeworksRelPath,
          codegenPackageExists,
        ),
      },
      {warn},
    );
    pluginPackageDeps = result.packageDependencies;
    pluginProductDeps = result.productDependencies;
    pluginGeneratedSources = result.generatedSources;
    pluginFlavoredFrameworks = result.flavoredFrameworks;
    pluginWatchPaths = result.watchPaths;
    log(
      `SPM plugins contributed ${pluginPackageDeps.length} package(s), ` +
        `${pluginProductDeps.length} product(s), ` +
        `${pluginGeneratedSources.length} generated source(s), ` +
        `${pluginFlavoredFrameworks.length} flavored framework(s)`,
    );
  }

  // Plugin sidecars. Both are ALWAYS written — even `[]` — so removing a
  // plugin (or dropping its declaration) clears stale entries. Machine-local
  // absolute paths; gitignored + regenerated every sync.
  fs.mkdirSync(outputDir, {recursive: true});
  // Generated-source registration (e.g. Expo's ExpoModulesProvider.swift),
  // consumed by the injector at add/update time — the provider ordering
  // contract is still Preview and co-designed with the first consumer.
  fs.writeFileSync(
    path.join(outputDir, '.spm-plugin-generated-sources.json'),
    JSON.stringify(pluginGeneratedSources, null, 2) + '\n',
    'utf8',
  );
  // Flavored-framework sidecar consumed by `spm add` / `spm update` when it
  // regenerates the app's linker settings and sole embed phase.
  fs.writeFileSync(
    path.join(outputDir, '.spm-plugin-flavored-frameworks.json'),
    JSON.stringify(pluginFlavoredFrameworks, null, 2) + '\n',
    'utf8',
  );

  // Top-level aggregator: references every entry as .package(path:) and
  // depends on each via .product(...). No more inline targets — every
  // autolinked dep is a real SPM package in its own source dir.
  const aggregatorContent = generateAutolinkedPackageSwift({
    npmDeps: aggregatorPackageDeps,
    hasReactDep,
    xcframeworksRelPath,
    pluginPackageDeps,
    pluginProductDeps,
  });
  fs.mkdirSync(outputDir, {recursive: true});
  const outputPath = path.join(outputDir, 'Package.swift');
  fs.writeFileSync(outputPath, aggregatorContent, 'utf8');
  log(`Generated: ${path.relative(appRoot, outputPath)}`);

  // .spm-sync-watch-paths: absolute paths (dirs OR files) the Xcode auto-sync
  // build phase watches for staleness. Three kinds of input, mixed freely:
  //   1. Each module's source dir (entryAbsDirs) — a dir; adding/removing a
  //      child bumps its mtime so `find -newer` trips and the `sources:`
  //      allowlist regenerates.
  //   2. Each npm dep's checked-in root `Package.swift` (a file) and its
  //      `.react-native/` metadata dir. Editing a manifest does NOT bump the
  //      source dir's mtime, so without these a manifest edit stays silently
  //      stale until an unrelated install triggers a sync. The dep ROOT is
  //      threaded through the entry (entry.root, from the autolinking model),
  //      not derived by walking up from the (possibly nested) source dir.
  //   3. Plugin-contributed paths (e.g. Expo's own Package.swift / per-module
  //      manifests) — already validated absolute in invokePlugins.
  // The phase distinguishes dir vs file with `-d`/`-f` at build time (no
  // markers). The existsSync filter here is safe: these paths come from a
  // successful sync so they exist now; a path that later VANISHES is caught at
  // phase time against this file and forces a re-sync.
  const watchCandidates /*: Array<string> */ = [...entryAbsDirs.values()];
  for (const entry of entries) {
    const root = entry.root;
    if (entry.origin !== 'npm' || root == null) {
      continue;
    }
    watchCandidates.push(path.join(root, 'Package.swift'));
    watchCandidates.push(path.join(root, '.react-native'));
  }
  watchCandidates.push(...pluginWatchPaths);
  const watchPaths = Array.from(new Set(watchCandidates))
    .filter(p => p.length > 0 && fs.existsSync(p))
    .sort();
  fs.writeFileSync(
    path.join(outputDir, '.spm-sync-watch-paths'),
    watchPaths.join('\n') + (watchPaths.length > 0 ? '\n' : ''),
    'utf8',
  );

  // AutolinkedAggregate is glue; needs at least one source file (Swift, so we
  // sidestep the Obj-C public-headers-dir requirement).
  const aggregateDir = path.join(outputDir, 'AutolinkedAggregate');
  fs.mkdirSync(aggregateDir, {recursive: true});
  const stubPath = path.join(aggregateDir, 'AutolinkedAggregate.swift');
  if (!fs.existsSync(stubPath)) {
    fs.writeFileSync(
      stubPath,
      '// Placeholder. Real native modules live in transitively-referenced sub-packages.\n',
      'utf8',
    );
  }
  const legacyStub = path.join(aggregateDir, 'AutolinkedAggregate.m');
  if (fs.existsSync(legacyStub)) {
    fs.unlinkSync(legacyStub);
  }

  // One-time migration cleanup: remove the legacy <appRoot>/autolinked/ tree
  // and any stale in-source `Package.swift` / `include/<Name>/` from the
  // prior in-place layout (those files lived in user source dirs and have
  // been replaced by the wrapper layout under outputDir).
  const legacyAutolinkedDir = path.join(appRoot, 'autolinked');
  if (
    fs.existsSync(legacyAutolinkedDir) &&
    path.resolve(legacyAutolinkedDir) !== path.resolve(outputDir)
  ) {
    fs.rmSync(legacyAutolinkedDir, {recursive: true, force: true});
    log(`Removed legacy autolinked/ tree`);
  }
  for (const absSource of entryAbsDirs.values()) {
    const legacyPkg = path.join(absSource, 'Package.swift');
    let removedLegacyPkg = false;
    try {
      const content = fs.readFileSync(legacyPkg, 'utf8');
      if (content.includes(AUTOGEN_MARKER)) {
        fs.unlinkSync(legacyPkg);
        removedLegacyPkg = true;
        log(
          `Removed legacy in-place synth: ${path.relative(appRoot, legacyPkg)}`,
        );
      }
    } catch {
      // not present – fine
    }
    // Only treat include/ as a legacy leftover when the in-place synth
    // manifest was just removed alongside it: a SCAFFOLDED dep legitimately
    // owns include/<SwiftName>/ (the namespaced shim headers behind its
    // publicHeadersPath: "include") — nuking it unconditionally would break
    // every dependent's `#import <SwiftName/Header.h>` on the next sync.
    if (removedLegacyPkg) {
      const legacyInclude = path.join(absSource, 'include');
      try {
        if (fs.lstatSync(legacyInclude).isDirectory()) {
          fs.rmSync(legacyInclude, {recursive: true, force: true});
          log(
            `Removed legacy in-place include/: ${path.relative(appRoot, legacyInclude)}`,
          );
        }
      } catch {
        // not present – fine
      }
    }
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    if (e instanceof RemoteVersionError) {
      log(e.message);
      process.exitCode = 2;
    } else {
      throw e;
    }
  }
}

module.exports = {
  main,
  generateAutolinkedPackageSwift,
  generateSynthPackageSwift,
  reactDescriptor,
  linkHeaderTree,
  collectSpmSources,
  expandSpmSourceGlobs,
  findSelfManagedPackageDir,
  hasPodspec,
  hasMixedLanguageSources,
  MissingManifestError,
  reportMissingManifests,
  AUTOGEN_MARKER,
};
