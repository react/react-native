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

/*:: import type {GeneratePackageArgs} from './spm-types'; */

/**
 * generate-spm-package.js – Generates the xcframeworks sub-package for a
 * React Native app using prebuilt XCFrameworks via Swift Package Manager.
 *
 * Usage:
 *   node generate-spm-package.js [options]
 *
 * Options:
 *   --app-root <path>            Path to the app directory (default: cwd)
 *   --react-native-root <path>   Path to react-native package root
 *   --version <ver>              RN version for Maven artifact URLs
 *   --debug-artifacts-dir <path>   Complete Debug artifact cache slot
 *   --release-artifacts-dir <path> Complete Release artifact cache slot
 *   --app-name <name>            App/package name (default: from package.json)
 *   --target-name <name>         Main app target name (default: derived from app-name)
 *   --source-path <path>         Path to app source relative to app-root (default: auto-detected)
 *   --ios-version <ver>          Minimum iOS version (default: 15)
 *
 * Generates build/xcframeworks/Package.swift + symlinks. The xcodeproj
 * references this sub-package directly; no separate app-level Package.swift
 * is needed.
 */

const {prepareFlavoredFrameworks} = require('./flavored-frameworks');
const {
  deriveAppName,
  displayPath,
  findProjectRoot,
  makeLogger,
  readPackageJson,
  resolveReactNativeRoot,
  toSwiftName,
} = require('./spm-utils');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const {log} = makeLogger('generate-spm-package');

function parseArgs(argv /*: Array<string> */) /*: GeneratePackageArgs */ {
  const parsed = yargs(argv)
    .version(false)
    .option('app-root', {
      type: 'string',
      default: process.cwd(),
      describe: 'Path to the app directory',
    })
    .option('react-native-root', {
      type: 'string',
      describe: 'Path to react-native package root',
    })
    .option('version', {
      type: 'string',
      describe: 'RN version for Maven artifact URLs',
    })
    .option('debug-artifacts-dir', {
      type: 'string',
      describe: 'Path to the complete Debug artifacts cache slot',
    })
    .option('release-artifacts-dir', {
      type: 'string',
      describe: 'Path to the complete Release artifacts cache slot',
    })
    .option('app-name', {
      type: 'string',
      describe: 'App/package name (default: from package.json)',
    })
    .option('target-name', {
      type: 'string',
      describe: 'Main app target name (default: derived from app-name)',
    })
    .option('source-path', {
      type: 'string',
      describe:
        'Path to app source relative to app-root (default: auto-detected)',
    })
    .option('ios-version', {
      type: 'string',
      default: '15',
      describe: 'Minimum iOS version',
    })
    .usage(
      'Usage: $0 [options]\n\nGenerates the xcframeworks sub-package for a React Native app using SPM.',
    )
    .help()
    .parseSync();

  return {
    appRoot: parsed['app-root'],
    reactNativeRoot: parsed['react-native-root'] ?? null,
    version: parsed.version ?? null,
    debugArtifactsDir: parsed['debug-artifacts-dir'] ?? null,
    releaseArtifactsDir: parsed['release-artifacts-dir'] ?? null,
    appName: parsed['app-name'] ?? null,
    targetName: parsed['target-name'] ?? null,
    sourcePath: parsed['source-path'] ?? null,
    iosVersion: parsed['ios-version'],
  };
}

/**
 * Find the app's main Swift/ObjC source directory.
 * Looks for directories that contain native iOS source files.
 */
function findSourcePath(
  appRoot /*: string */,
  packageName /*: string */,
) /*: string */ {
  // Derive from package name (e.g. "@react-native/tester" -> "Tester")
  const derived = toSwiftName(packageName.replace(/^@[^/]+\//, ''));

  // Also check "RN" + derived (e.g. "Tester" -> "RNTester") and "RN" + whole name
  const rnPrefixed = 'RN' + derived;
  const candidates = [derived, rnPrefixed, 'ios', 'App', 'Sources', 'src'];
  for (const c of candidates) {
    if (fs.existsSync(path.join(appRoot, c))) {
      return c;
    }
  }

  // Scan for a directory that looks like an iOS source root
  // (contains .m, .mm, .swift, or .h files)
  try {
    const entries /*: Array<{name: string, isDirectory(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow but always string here
      fs.readdirSync(appRoot, {withFileTypes: true});
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const dirPath = path.join(appRoot, entry.name);
      const subEntries = fs.readdirSync(dirPath);
      const hasNativeSources = subEntries.some((f /*: string | Buffer */) =>
        /\.(m|mm|swift|cpp|h|hpp)$/.test(String(f)),
      );
      if (hasNativeSources) {
        return entry.name;
      }
    }
  } catch (_) {
    // ignore
  }

  return derived;
}

/**
 * Generates the Package.swift for the xcframeworks sub-package.
 *
 * When using local xcframeworks (from the cache), we put the binary targets in
 * a dedicated Package.swift at build/xcframeworks/. The generated .xcodeproj
 * references this sub-package via XCLocalSwiftPackageReference; the codegen
 * Package.swift also imports it as a named package dependency.
 */
function generateXCFrameworksPackageSwift() /*: string */ {
  return `// swift-tools-version: 6.0
// AUTO-GENERATED by scripts/generate-spm-package.js – do not edit manually.
import PackageDescription

let package = Package(
    name: "ReactNative",
    products: [
        .library(name: "ReactHeaders", targets: ["ReactHeaders"]),
        .library(name: "ReactNativeHeaders", targets: ["ReactNativeHeaders"]),
        .library(name: "ReactNativeDependenciesHeaders", targets: ["ReactNativeDependenciesHeaders"]),
    ],
    targets: [
        .target(
            name: "ReactHeaders",
            dependencies: ["ReactNativeHeaders"],
            path: "ReactHeadersTarget",
            publicHeadersPath: "include"
        ),
        .binaryTarget(
            name: "ReactNativeHeaders",
            path: "ReactNativeHeaders.xcframework"
        ),
        .binaryTarget(
            name: "ReactNativeDependenciesHeaders",
            path: "ReactNativeDependenciesHeaders.xcframework"
        ),
    ]
)
`;
}

function main(
  argv /*:: ?: Array<string> */,
  dependencies /*:: ?: {prepareFlavoredFrameworks?: typeof prepareFlavoredFrameworks} */,
) /*: void */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  // Ensure appRoot is always absolute so path.join/path.resolve produce absolute paths
  // even when called with --app-root . or other relative paths.
  const appRoot = path.resolve(args.appRoot);

  // Read app package.json
  // package.json may be in a parent directory (e.g. when appRoot is ios/).
  const projectRoot = findProjectRoot(appRoot);
  const pkgJson = readPackageJson(projectRoot);
  if (!pkgJson) {
    throw new Error(
      `[generate-spm-package] No package.json found in ${appRoot} or parent directories`,
    );
  }

  let rnRoot =
    args.reactNativeRoot != null
      ? path.resolve(args.reactNativeRoot)
      : resolveReactNativeRoot(appRoot, projectRoot);
  if (rnRoot == null) {
    throw new Error(
      '[generate-spm-package] Could not find react-native. Pass --react-native-root.',
    );
  }

  let version = args.version;
  if (version == null) {
    const rnPkg = readPackageJson(rnRoot);
    version = rnPkg?.version ?? '0.0.0';
  }

  const rawName = pkgJson.name ?? path.basename(appRoot);
  const sourcePath = args.sourcePath ?? findSourcePath(appRoot, rawName);
  const appName = args.appName ?? deriveAppName(rawName, sourcePath);
  const targetName = args.targetName ?? appName + 'App';

  log(`App name:    ${appName}`);
  log(`Target name: ${targetName}`);
  log(`Source path: ${sourcePath}`);
  log(`Version:     ${version}`);

  const debugArtifactsDir = args.debugArtifactsDir;
  const releaseArtifactsDir = args.releaseArtifactsDir;
  if ((debugArtifactsDir == null) !== (releaseArtifactsDir == null)) {
    throw new Error(
      '[generate-spm-package] both --debug-artifacts-dir and --release-artifacts-dir are required',
    );
  }
  if (debugArtifactsDir != null && releaseArtifactsDir != null) {
    const prepare =
      dependencies?.prepareFlavoredFrameworks ?? prepareFlavoredFrameworks;
    prepare({
      appRoot,
      debugArtifactsDir,
      releaseArtifactsDir,
    });
    const xcfwLinksDir = path.join(appRoot, 'build', 'xcframeworks');
    const xcfwPkgContent = generateXCFrameworksPackageSwift();
    const xcfwPkgPath = path.join(xcfwLinksDir, 'Package.swift');
    let packageChanged = true;
    try {
      packageChanged = fs.readFileSync(xcfwPkgPath, 'utf8') !== xcfwPkgContent;
    } catch {}
    if (packageChanged) {
      fs.writeFileSync(xcfwPkgPath, xcfwPkgContent, 'utf8');
    }
    log(
      `${packageChanged ? 'Generated' : 'Unchanged'}: ${path.relative(
        appRoot,
        xcfwPkgPath,
      )}`,
    );
    log(
      `Artifact slots: debug=${displayPath(debugArtifactsDir)}, ` +
        `release=${displayPath(releaseArtifactsDir)}`,
    );
  } else {
    // Auto-detect an already-generated invariant package.
    const xcfwLinksDir = path.join(appRoot, 'build', 'xcframeworks');
    if (fs.existsSync(path.join(xcfwLinksDir, 'Package.swift'))) {
      log(`Auto-detected local xcframeworks: build/xcframeworks`);
    }
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}

module.exports = {
  main,
  generateXCFrameworksPackageSwift,
  findSourcePath,
};
