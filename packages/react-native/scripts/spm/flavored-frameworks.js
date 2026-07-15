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

const {execFileSync} = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Info.plist parsing goes through plutil (as the pre-B1 swap script did): the
// `plist` npm module is NOT a react-native dependency, so it only resolves
// inside this monorepo via hoisting — requiring it breaks `spm add` in a
// fresh consumer app with "Cannot find module 'plist'".
function plistJson(p /*: string */) /*: $FlowFixMe */ {
  return JSON.parse(
    execFileSync('plutil', ['-convert', 'json', '-o', '-', p]).toString(),
  );
}

/*:: import type {
  FlavoredFrameworkManifestEntry,
  FlavoredFrameworksManifest,
  ParsedXcframework,
  PluginFlavoredFramework,
  XcframeworkSlice,
} from './spm-types'; */

/*::
type ArtifactIndexEntry = {xcframeworkPath: string, url?: string};
type ArtifactIndex = {[string]: ArtifactIndexEntry};
type ValidatedFramework = {
  id: string,
  frameworkName: string,
  executableName: string,
  linkage: 'dynamic',
  slices: Array<XcframeworkSlice>,
};
type StagedFramework = {
  id: string,
  frameworkName: string,
  executableName: string,
  linkage: 'dynamic',
  artifactRelativePath: string,
  slices: Array<XcframeworkSlice>,
  sourcePaths: {debug: string, release: string},
};
*/

const FLAVORS /*: ReadonlyArray<'debug' | 'release'> */ = ['debug', 'release'];

const FLAVORED_FRAMEWORKS_MANIFEST = 'flavored-frameworks.json';
const PENDING_ARTIFACT_STAMP = '.artifact-stamp.pending';
const PLUGIN_FRAMEWORKS_MANIFEST /*: string */ = path.join(
  'build',
  'generated',
  'autolinking',
  '.spm-plugin-flavored-frameworks.json',
);

const BUILTIN_FRAMEWORKS = [
  {id: 'react', artifactName: 'React'},
  {id: 'react-native-dependencies', artifactName: 'ReactNativeDependencies'},
  {id: 'hermes', artifactName: 'hermes-engine'},
];

const INVARIANT_BINARY_TARGETS = [
  'ReactNativeHeaders',
  'ReactNativeDependenciesHeaders',
];

function readJson(filePath /*: string */) /*: unknown */ {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requireString(
  value /*: unknown */,
  label /*: string */,
) /*: string */ {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
  return value;
}

function readArtifactIndex(artifactsDir /*: string */) /*: ArtifactIndex */ {
  const indexPath = path.join(artifactsDir, 'artifacts.json');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`artifacts.json missing in ${artifactsDir}`);
  }
  const parsed = readJson(indexPath);
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`artifacts.json in ${artifactsDir} is not an object`);
  }
  const result /*: ArtifactIndex */ = {};
  for (const name of Object.keys(parsed)) {
    const entry = parsed[name];
    if (
      entry == null ||
      typeof entry !== 'object' ||
      typeof entry.xcframeworkPath !== 'string'
    ) {
      throw new Error(
        `artifacts.json entry '${name}' in ${artifactsDir} is invalid`,
      );
    }
    result[name] = {
      xcframeworkPath: entry.xcframeworkPath,
      ...(typeof entry.url === 'string' ? {url: entry.url} : {}),
    };
  }
  return result;
}

function frameworkNameFromLibraryPath(libraryPath /*: string */) /*: string */ {
  if (!libraryPath.endsWith('.framework')) {
    throw new Error(
      `flavored binary '${libraryPath}' is not a dynamic framework; ` +
        'only .framework XCFramework libraries are supported',
    );
  }
  return path.basename(libraryPath, '.framework');
}

function sdkConditionForSlice(
  platform /*: string */,
  variant /*: ?string */,
) /*: string */ {
  if (platform === 'ios' && variant === 'simulator') {
    return 'iphonesimulator*';
  }
  if (platform === 'ios' && variant === 'maccatalyst') {
    return 'macosx*';
  }
  if (platform === 'ios') {
    return 'iphoneos*';
  }
  if (platform === 'tvos' && variant === 'simulator') {
    return 'appletvsimulator*';
  }
  if (platform === 'tvos') {
    return 'appletvos*';
  }
  if (platform === 'xros' && variant === 'simulator') {
    return 'xrsimulator*';
  }
  if (platform === 'xros') {
    return 'xros*';
  }
  if (platform === 'macos') {
    return 'macosx*';
  }
  throw new Error(
    `unsupported XCFramework platform '${platform}'` +
      (variant != null ? ` variant '${variant}'` : ''),
  );
}

function parseXcframework(
  xcframeworkPath /*: string */,
) /*: ParsedXcframework */ {
  const infoPath = path.join(xcframeworkPath, 'Info.plist');
  if (!fs.existsSync(infoPath)) {
    throw new Error(`XCFramework Info.plist missing at ${infoPath}`);
  }
  const info = plistJson(infoPath);
  const libraries = info.AvailableLibraries;
  if (!Array.isArray(libraries) || libraries.length === 0) {
    throw new Error(
      `XCFramework has no AvailableLibraries: ${xcframeworkPath}`,
    );
  }
  let frameworkName = null;
  let executableName = null;
  const slices = libraries.map(library => {
    const identifier = library.LibraryIdentifier;
    const libraryPath = library.LibraryPath;
    const platform = library.SupportedPlatform;
    const variant = library.SupportedPlatformVariant ?? null;
    const architectures = library.SupportedArchitectures;
    if (
      typeof identifier !== 'string' ||
      typeof libraryPath !== 'string' ||
      typeof platform !== 'string' ||
      !Array.isArray(architectures) ||
      !architectures.every(a => typeof a === 'string')
    ) {
      throw new Error(
        `XCFramework contains an invalid library entry: ${xcframeworkPath}`,
      );
    }
    const sliceFrameworkName = frameworkNameFromLibraryPath(libraryPath);
    const binaryPath =
      typeof library.BinaryPath === 'string'
        ? library.BinaryPath
        : path.join(libraryPath, sliceFrameworkName);
    const sliceExecutableName = path.basename(binaryPath);
    if (frameworkName == null) {
      frameworkName = sliceFrameworkName;
      executableName = sliceExecutableName;
    } else if (
      frameworkName !== sliceFrameworkName ||
      executableName !== sliceExecutableName
    ) {
      throw new Error(
        `XCFramework changes framework or executable name between slices: ${xcframeworkPath}`,
      );
    }
    return {
      sdk: sdkConditionForSlice(platform, variant),
      platform,
      variant,
      architectures: [...architectures].sort(),
      libraryIdentifier: identifier,
      libraryPath,
      binaryPath,
    };
  });
  if (frameworkName == null || executableName == null) {
    throw new Error(
      `could not identify framework binary in ${xcframeworkPath}`,
    );
  }
  slices.sort((a, b) =>
    `${a.sdk}:${a.libraryIdentifier}`.localeCompare(
      `${b.sdk}:${b.libraryIdentifier}`,
    ),
  );
  return {
    path: xcframeworkPath,
    frameworkName,
    executableName,
    slices,
  };
}

function sliceShape(parsed /*: ParsedXcframework */) /*: string */ {
  return JSON.stringify(parsed.slices);
}

function walkFiles(root /*: string */) /*: Array<string> */ {
  const files = [];
  const visit = (dir /*: string */) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, String(entry.name));
      if (entry.isDirectory()) {
        visit(full);
      } else if (entry.isSymbolicLink()) {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          visit(full);
        } else {
          files.push(full);
        }
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  };
  if (fs.existsSync(root) && fs.statSync(root).isFile()) {
    files.push(root);
  } else if (fs.existsSync(root)) {
    visit(root);
  }
  return files.sort();
}

function hashTrees(roots /*: Array<string> */) /*: string */ {
  const hash = crypto.createHash('sha256');
  for (const root of roots) {
    const realRoot = fs.realpathSync(root);
    for (const file of walkFiles(realRoot)) {
      hash.update(path.relative(realRoot, file));
      hash.update('\0');
      hash.update(fs.readFileSync(file));
      hash.update('\0');
    }
  }
  return hash.digest('hex');
}

function frameworkHeaderHashes(
  parsed /*: ParsedXcframework */,
) /*: Array<string> */ {
  return parsed.slices.map(slice => {
    const framework = path.join(
      parsed.path,
      slice.libraryIdentifier,
      slice.libraryPath,
    );
    const roots = [];
    const headers = path.join(framework, 'Headers');
    const moduleMap = path.join(framework, 'Modules', 'module.modulemap');
    if (fs.existsSync(headers)) {
      roots.push(headers);
    }
    if (fs.existsSync(moduleMap)) {
      roots.push(moduleMap);
    }
    return roots.length === 0 ? '' : hashTrees(roots);
  });
}

function invariantHeadersHashes(
  xcframeworkPath /*: string */,
) /*: Array<string> */ {
  const info = plistJson(path.join(xcframeworkPath, 'Info.plist'));
  if (!Array.isArray(info.AvailableLibraries)) {
    throw new Error(`XCFramework has no libraries: ${xcframeworkPath}`);
  }
  return info.AvailableLibraries.map(library => {
    const identifier = library.LibraryIdentifier;
    const headersPath = library.HeadersPath;
    if (typeof identifier !== 'string' || typeof headersPath !== 'string') {
      throw new Error(
        `headers XCFramework has an invalid slice: ${xcframeworkPath}`,
      );
    }
    return hashTrees([path.join(xcframeworkPath, identifier, headersPath)]);
  });
}

function assertOneHash(
  label /*: string */,
  hashes /*: Array<string> */,
) /*: string */ {
  const distinct = Array.from(new Set(hashes));
  if (distinct.length !== 1) {
    throw new Error(`${label} headers differ between XCFramework slices`);
  }
  return distinct[0];
}

function assertDynamicFramework(parsed /*: ParsedXcframework */) /*: void */ {
  for (const slice of parsed.slices) {
    const binary = path.join(
      parsed.path,
      slice.libraryIdentifier,
      slice.binaryPath,
    );
    if (!fs.existsSync(binary)) {
      throw new Error(
        `${parsed.frameworkName} binary is missing from slice ${slice.libraryIdentifier}: ${binary}`,
      );
    }
    let output;
    try {
      output = execFileSync('otool', ['-l', binary], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      throw new Error(`could not inspect ${binary}: ${e.message}`);
    }
    if (!output.includes('LC_ID_DYLIB')) {
      throw new Error(
        `${parsed.frameworkName} is not a dynamic framework: ${binary}`,
      );
    }
    const frameworkRoot = path.join(
      parsed.path,
      slice.libraryIdentifier,
      slice.libraryPath,
    );
    const nested = walkFiles(frameworkRoot).find(file =>
      file.includes(`${path.sep}Frameworks${path.sep}`),
    );
    if (nested != null) {
      throw new Error(
        `${parsed.frameworkName} contains nested code that RN cannot manage: ${nested}`,
      );
    }
  }
}

function validatePair(
  id /*: string */,
  debugPath /*: string */,
  releasePath /*: string */,
  declaredFrameworkName /*: ?string */,
  validateBinaries /*: boolean */,
) /*: ValidatedFramework */ {
  const debug = parseXcframework(debugPath);
  const release = parseXcframework(releasePath);
  if (
    debug.frameworkName !== release.frameworkName ||
    debug.executableName !== release.executableName ||
    sliceShape(debug) !== sliceShape(release)
  ) {
    throw new Error(
      `flavored framework '${id}' has incompatible Debug and Release XCFrameworks`,
    );
  }
  if (
    declaredFrameworkName != null &&
    declaredFrameworkName !== debug.frameworkName
  ) {
    throw new Error(
      `flavored framework '${id}' declared '${declaredFrameworkName}' but contains '${debug.frameworkName}'`,
    );
  }
  // Headers and Swift module interfaces may legitimately differ between SDK
  // slices (for example device vs simulator generated `-Swift.h` files and
  // target-specific `.swiftinterface` names). `sliceShape` above already
  // guarantees a one-to-one slice mapping, so compare each Debug slice with
  // its matching Release slice instead of requiring every slice within one
  // XCFramework to be byte-identical.
  const debugHeaders = frameworkHeaderHashes(debug);
  const releaseHeaders = frameworkHeaderHashes(release);
  if (JSON.stringify(debugHeaders) !== JSON.stringify(releaseHeaders)) {
    throw new Error(
      `flavored framework '${id}' exposes different Debug and Release headers`,
    );
  }
  if (validateBinaries) {
    assertDynamicFramework(debug);
    assertDynamicFramework(release);
  }
  return {
    id,
    frameworkName: debug.frameworkName,
    executableName: debug.executableName,
    linkage: 'dynamic',
    slices: debug.slices,
  };
}

function transformReactModuleMap(contents /*: string */) /*: string */ {
  if (!/framework\s+module\s+React\b/.test(contents)) {
    throw new Error('React module map does not declare framework module React');
  }
  return contents
    .replace(/framework\s+module\s+React\b/, 'module React')
    .replace(
      /(umbrella header|textual header|private header|header)\s+"([^"]+)"/g,
      (match, kind, header) =>
        `${kind} "${header.startsWith('React/') ? header : `React/${header}`}"`,
    );
}

function replaceDirectoryAtomically(
  destination /*: string */,
  populate /*: (temp: string) => void */,
) /*: void */ {
  const temp = `${destination}.tmp-${process.pid}`;
  fs.rmSync(temp, {recursive: true, force: true});
  fs.mkdirSync(temp, {recursive: true});
  populate(temp);
  fs.rmSync(destination, {recursive: true, force: true});
  fs.renameSync(temp, destination);
}

function stageReactHeadersTarget(
  packageRoot /*: string */,
  canonicalReact /*: ParsedXcframework */,
) /*: void */ {
  const slice = canonicalReact.slices[0];
  const framework = path.join(
    canonicalReact.path,
    slice.libraryIdentifier,
    slice.libraryPath,
  );
  const sourceHeaders = path.join(framework, 'Headers');
  const sourceModuleMap = path.join(framework, 'Modules', 'module.modulemap');
  if (!fs.existsSync(sourceHeaders) || !fs.existsSync(sourceModuleMap)) {
    throw new Error(
      `React headers or module map missing from canonical framework ${framework}`,
    );
  }
  const destination = path.join(packageRoot, 'ReactHeadersTarget');
  const transformed = transformReactModuleMap(
    fs.readFileSync(sourceModuleMap, 'utf8'),
  );
  const expectedHash = crypto
    .createHash('sha256')
    .update(hashTrees([sourceHeaders]))
    .update(transformed)
    .digest('hex');
  const marker = path.join(destination, '.headers-hash');
  try {
    if (fs.readFileSync(marker, 'utf8') === `${expectedHash}\n`) {
      return;
    }
  } catch {}
  replaceDirectoryAtomically(destination, temp => {
    const include = path.join(temp, 'include');
    fs.mkdirSync(include, {recursive: true});
    fs.cpSync(sourceHeaders, path.join(include, 'React'), {
      recursive: true,
      dereference: true,
    });
    fs.writeFileSync(
      path.join(include, 'module.modulemap'),
      transformed,
      'utf8',
    );
    fs.writeFileSync(
      path.join(temp, 'empty.c'),
      'void RNReactHeadersAnchor(void) {}\n',
      'utf8',
    );
    fs.writeFileSync(path.join(temp, '.headers-hash'), `${expectedHash}\n`);
  });
}

function ensureSymlink(target /*: string */, link /*: string */) /*: void */ {
  try {
    if (fs.lstatSync(link).isSymbolicLink()) {
      const current = path.resolve(path.dirname(link), fs.readlinkSync(link));
      if (current === path.resolve(target)) {
        return;
      }
    }
  } catch {}
  const temp = `${link}.tmp-${process.pid}`;
  fs.rmSync(temp, {recursive: true, force: true});
  fs.mkdirSync(path.dirname(link), {recursive: true});
  fs.symlinkSync(target, temp);
  fs.rmSync(link, {recursive: true, force: true});
  fs.renameSync(temp, link);
}

function symlinkPointsTo(
  target /*: string */,
  link /*: string */,
) /*: boolean */ {
  try {
    return (
      fs.lstatSync(link).isSymbolicLink() &&
      path.resolve(path.dirname(link), fs.readlinkSync(link)) ===
        path.resolve(target)
    );
  } catch {
    return false;
  }
}

function sourceIdentity(framework /*: StagedFramework */) /*: {
  debug: {path: string, info: number, binaries: Array<{path: string, size: number, mtime: number}>},
  release: {path: string, info: number, binaries: Array<{path: string, size: number, mtime: number}>},
} */ {
  const identity /*: {[string]: {path: string, info: number, binaries: Array<{path: string, size: number, mtime: number}>}} */ =
    {};
  for (const flavor of FLAVORS) {
    const xcframeworkPath = framework.sourcePaths[flavor];
    identity[flavor] = {
      path: fs.realpathSync(xcframeworkPath),
      info: fs.statSync(path.join(xcframeworkPath, 'Info.plist')).mtimeMs,
      binaries: framework.slices.map(slice => {
        const binary = path.join(
          xcframeworkPath,
          slice.libraryIdentifier,
          slice.binaryPath,
        );
        const stat = fs.statSync(binary);
        return {path: slice.binaryPath, size: stat.size, mtime: stat.mtimeMs};
      }),
    };
  }
  return {
    debug: identity.debug,
    release: identity.release,
  };
}

function publicationIsCurrent(
  packageRoot /*: string */,
  sources /*: ReadonlyArray<StagedFramework> */,
  debugIndex /*: ArtifactIndex */,
  stamp /*: string */,
  manifestContents /*: string */,
) /*: boolean */ {
  try {
    const pendingStamp = path.join(packageRoot, PENDING_ARTIFACT_STAMP);
    const currentStamp = fs.existsSync(pendingStamp)
      ? pendingStamp
      : path.join(packageRoot, '.artifact-stamp');
    if (
      fs.readFileSync(currentStamp, 'utf8') !== stamp ||
      fs.readFileSync(
        path.join(packageRoot, FLAVORED_FRAMEWORKS_MANIFEST),
        'utf8',
      ) !== manifestContents ||
      !fs.existsSync(
        path.join(packageRoot, 'ReactHeadersTarget', '.headers-hash'),
      )
    ) {
      return false;
    }
    for (const flavor of FLAVORS) {
      for (const framework of sources) {
        if (
          !symlinkPointsTo(
            framework.sourcePaths[flavor],
            path.join(packageRoot, flavor, framework.artifactRelativePath),
          )
        ) {
          return false;
        }
      }
    }
    return INVARIANT_BINARY_TARGETS.every(name =>
      symlinkPointsTo(
        debugIndex[name].xcframeworkPath,
        path.join(packageRoot, `${name}.xcframework`),
      ),
    );
  } catch {
    return false;
  }
}

function publishDirectoryAtomically(
  staged /*: string */,
  destination /*: string */,
) /*: void */ {
  const previous = `${destination}.previous-${process.pid}`;
  fs.rmSync(previous, {recursive: true, force: true});
  const hadPrevious = fs.existsSync(destination);
  if (hadPrevious) {
    fs.renameSync(destination, previous);
  }
  try {
    fs.renameSync(staged, destination);
  } catch (error) {
    if (hadPrevious && !fs.existsSync(destination)) {
      fs.renameSync(previous, destination);
    }
    throw error;
  }
  fs.rmSync(previous, {recursive: true, force: true});
}

function writeIfChanged(filePath /*: string */, contents /*: string */) {
  try {
    if (fs.readFileSync(filePath, 'utf8') === contents) {
      return false;
    }
  } catch {}
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, contents, 'utf8');
  return true;
}

function readPluginFrameworks(
  appRoot /*: string */,
) /*: Array<PluginFlavoredFramework> */ {
  const manifestPath = path.join(appRoot, PLUGIN_FRAMEWORKS_MANIFEST);
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  const parsed = readJson(manifestPath);
  if (!Array.isArray(parsed)) {
    throw new Error(`${PLUGIN_FRAMEWORKS_MANIFEST} must contain an array`);
  }
  const frameworks /*: Array<PluginFlavoredFramework> */ = [];
  for (const plugin of parsed) {
    if (
      plugin == null ||
      typeof plugin !== 'object' ||
      typeof plugin.id !== 'string' ||
      !/^[A-Za-z0-9_.-]+$/.test(plugin.id) ||
      typeof plugin.frameworkName !== 'string' ||
      plugin.linkage !== 'dynamic' ||
      plugin.flavors == null ||
      typeof plugin.flavors !== 'object' ||
      typeof plugin.flavors.debug !== 'string' ||
      typeof plugin.flavors.release !== 'string'
    ) {
      throw new Error(
        'plugin flavoredFrameworks entries require a stable id, frameworkName, ' +
          'linkage="dynamic", and absolute debug/release paths',
      );
    }
    frameworks.push({
      id: plugin.id,
      frameworkName: plugin.frameworkName,
      linkage: 'dynamic',
      flavors: {
        debug: plugin.flavors.debug,
        release: plugin.flavors.release,
      },
    });
  }
  return frameworks;
}

function prepareFlavoredFrameworks(
  opts /*: {
    appRoot: string,
    debugArtifactsDir: string,
    releaseArtifactsDir: string,
    validateBinaries?: boolean,
  } */,
) /*: FlavoredFrameworksManifest */ {
  const appRoot = path.resolve(opts.appRoot);
  const packageRoot = path.join(appRoot, 'build', 'xcframeworks');
  const debugIndex = readArtifactIndex(path.resolve(opts.debugArtifactsDir));
  const releaseIndex = readArtifactIndex(
    path.resolve(opts.releaseArtifactsDir),
  );
  const validateBinaries = opts.validateBinaries !== false;
  const sources /*: Array<StagedFramework> */ = [];
  const destinations /*: Set<string> */ = new Set();
  const frameworkIds /*: Set<string> */ = new Set();

  for (const builtin of BUILTIN_FRAMEWORKS) {
    const debugEntry = debugIndex[builtin.artifactName];
    const releaseEntry = releaseIndex[builtin.artifactName];
    if (debugEntry == null || releaseEntry == null) {
      throw new Error(
        `both flavors must contain '${builtin.artifactName}' in artifacts.json`,
      );
    }
    const normalized = validatePair(
      builtin.id,
      path.resolve(debugEntry.xcframeworkPath),
      path.resolve(releaseEntry.xcframeworkPath),
      null,
      validateBinaries,
    );
    const artifactRelativePath = `${builtin.artifactName}.xcframework`;
    if (destinations.has(normalized.frameworkName)) {
      throw new Error(
        `multiple flavored frameworks embed as ${normalized.frameworkName}.framework`,
      );
    }
    frameworkIds.add(normalized.id);
    destinations.add(normalized.frameworkName);
    sources.push({
      id: normalized.id,
      frameworkName: normalized.frameworkName,
      executableName: normalized.executableName,
      linkage: 'dynamic',
      slices: normalized.slices,
      artifactRelativePath,
      sourcePaths: {
        debug: path.resolve(debugEntry.xcframeworkPath),
        release: path.resolve(releaseEntry.xcframeworkPath),
      },
    });
  }

  for (const plugin of readPluginFrameworks(appRoot)) {
    if (
      plugin == null ||
      typeof plugin !== 'object' ||
      typeof plugin.id !== 'string' ||
      !/^[A-Za-z0-9_.-]+$/.test(plugin.id) ||
      typeof plugin.frameworkName !== 'string' ||
      plugin.linkage !== 'dynamic' ||
      plugin.flavors == null ||
      typeof plugin.flavors.debug !== 'string' ||
      typeof plugin.flavors.release !== 'string' ||
      !path.isAbsolute(plugin.flavors.debug) ||
      !path.isAbsolute(plugin.flavors.release)
    ) {
      throw new Error(
        'plugin flavoredFrameworks entries require a stable id, frameworkName, ' +
          'linkage="dynamic", and absolute debug/release paths',
      );
    }
    const normalized = validatePair(
      plugin.id,
      plugin.flavors.debug,
      plugin.flavors.release,
      plugin.frameworkName,
      validateBinaries,
    );
    if (frameworkIds.has(normalized.id)) {
      throw new Error(`duplicate flavored framework id '${normalized.id}'`);
    }
    if (destinations.has(normalized.frameworkName)) {
      throw new Error(
        `multiple flavored frameworks embed as ${normalized.frameworkName}.framework`,
      );
    }
    frameworkIds.add(normalized.id);
    destinations.add(normalized.frameworkName);
    sources.push({
      id: normalized.id,
      frameworkName: normalized.frameworkName,
      executableName: normalized.executableName,
      linkage: 'dynamic',
      slices: normalized.slices,
      artifactRelativePath: `plugins/${plugin.id}.xcframework`,
      sourcePaths: {
        debug: plugin.flavors.debug,
        release: plugin.flavors.release,
      },
    });
  }

  for (const name of INVARIANT_BINARY_TARGETS) {
    const debugEntry = debugIndex[name];
    const releaseEntry = releaseIndex[name];
    if (debugEntry == null || releaseEntry == null) {
      throw new Error(`both flavors must contain invariant target '${name}'`);
    }
    const debugHash = assertOneHash(
      `${name} Debug`,
      invariantHeadersHashes(debugEntry.xcframeworkPath),
    );
    const releaseHash = assertOneHash(
      `${name} Release`,
      invariantHeadersHashes(releaseEntry.xcframeworkPath),
    );
    if (debugHash !== releaseHash) {
      throw new Error(`${name} headers differ between Debug and Release`);
    }
  }

  const canonicalReact = parseXcframework(debugIndex.React.xcframeworkPath);
  const manifest /*: FlavoredFrameworksManifest */ = {
    version: 1,
    frameworks: sources.map(({sourcePaths, ...framework}) => framework),
  };
  const contents = `${JSON.stringify(manifest, null, 2)}\n`;
  const stampMaterial = JSON.stringify(
    sources.map(framework => ({
      id: framework.id,
      sourceIdentity: sourceIdentity(framework),
    })),
  );
  const stamp = `${crypto
    .createHash('sha256')
    .update(contents)
    .update(stampMaterial)
    .digest('hex')}\n`;
  if (publicationIsCurrent(packageRoot, sources, debugIndex, stamp, contents)) {
    return manifest;
  }

  const staged = `${packageRoot}.publish-${process.pid}`;
  fs.rmSync(staged, {recursive: true, force: true});
  fs.mkdirSync(staged, {recursive: true});
  try {
    for (const flavor of FLAVORS) {
      for (const framework of sources) {
        ensureSymlink(
          framework.sourcePaths[flavor],
          path.join(staged, flavor, framework.artifactRelativePath),
        );
      }
    }
    for (const name of INVARIANT_BINARY_TARGETS) {
      ensureSymlink(
        debugIndex[name].xcframeworkPath,
        path.join(staged, `${name}.xcframework`),
      );
    }
    stageReactHeadersTarget(staged, canonicalReact);
    writeIfChanged(path.join(staged, FLAVORED_FRAMEWORKS_MANIFEST), contents);
    writeIfChanged(path.join(staged, PENDING_ARTIFACT_STAMP), stamp);
    const existingPackage = path.join(packageRoot, 'Package.swift');
    if (fs.existsSync(existingPackage)) {
      fs.copyFileSync(existingPackage, path.join(staged, 'Package.swift'));
    }
    const existingStamp = path.join(packageRoot, '.artifact-stamp');
    if (fs.existsSync(existingStamp)) {
      fs.copyFileSync(existingStamp, path.join(staged, '.artifact-stamp'));
    }
    fs.mkdirSync(path.dirname(packageRoot), {recursive: true});
    publishDirectoryAtomically(staged, packageRoot);
  } finally {
    fs.rmSync(staged, {recursive: true, force: true});
  }
  return manifest;
}

function finalizeArtifactPublication(appRoot /*: string */) /*: boolean */ {
  const packageRoot = path.join(path.resolve(appRoot), 'build', 'xcframeworks');
  const pending = path.join(packageRoot, PENDING_ARTIFACT_STAMP);
  if (!fs.existsSync(pending)) {
    return false;
  }
  const stamp = fs.readFileSync(pending, 'utf8');
  writeIfChanged(path.join(packageRoot, '.artifact-stamp'), stamp);
  fs.rmSync(pending, {force: true});
  return true;
}

function readFlavoredFrameworksManifest(
  appRoot /*: string */,
) /*: FlavoredFrameworksManifest */ {
  const manifestPath = path.join(
    appRoot,
    'build',
    'xcframeworks',
    FLAVORED_FRAMEWORKS_MANIFEST,
  );
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `${FLAVORED_FRAMEWORKS_MANIFEST} is missing; run npx react-native spm update`,
    );
  }
  const parsed = readJson(manifestPath);
  if (
    parsed == null ||
    typeof parsed !== 'object' ||
    parsed.version !== 1 ||
    !Array.isArray(parsed.frameworks)
  ) {
    throw new Error(`${FLAVORED_FRAMEWORKS_MANIFEST} has an invalid format`);
  }
  const frameworks /*: Array<FlavoredFrameworkManifestEntry> */ = [];
  for (const framework of parsed.frameworks) {
    if (
      framework == null ||
      typeof framework !== 'object' ||
      typeof framework.id !== 'string' ||
      typeof framework.frameworkName !== 'string' ||
      typeof framework.executableName !== 'string' ||
      framework.linkage !== 'dynamic' ||
      typeof framework.artifactRelativePath !== 'string' ||
      !Array.isArray(framework.slices)
    ) {
      throw new Error(`${FLAVORED_FRAMEWORKS_MANIFEST} has an invalid entry`);
    }
    const id = framework.id;
    const frameworkName = framework.frameworkName;
    const executableName = framework.executableName;
    const artifactRelativePath = framework.artifactRelativePath;
    const rawSlices = framework.slices;
    const slices /*: Array<XcframeworkSlice> */ = [];
    for (const slice of rawSlices) {
      if (
        slice == null ||
        typeof slice !== 'object' ||
        typeof slice.sdk !== 'string' ||
        typeof slice.platform !== 'string' ||
        (slice.variant != null && typeof slice.variant !== 'string') ||
        !Array.isArray(slice.architectures) ||
        typeof slice.libraryIdentifier !== 'string' ||
        typeof slice.libraryPath !== 'string' ||
        typeof slice.binaryPath !== 'string'
      ) {
        throw new Error(
          `${FLAVORED_FRAMEWORKS_MANIFEST} has an invalid XCFramework slice`,
        );
      }
      const architectures /*: Array<string> */ = [];
      for (const architecture of slice.architectures) {
        if (typeof architecture !== 'string') {
          throw new Error(
            `${FLAVORED_FRAMEWORKS_MANIFEST} has an invalid XCFramework architecture`,
          );
        }
        architectures.push(architecture);
      }
      const sdk = requireString(slice.sdk, 'XCFramework SDK');
      const platform = requireString(slice.platform, 'XCFramework platform');
      const variant = typeof slice.variant === 'string' ? slice.variant : null;
      const libraryIdentifier = requireString(
        slice.libraryIdentifier,
        'XCFramework library identifier',
      );
      const libraryPath = requireString(
        slice.libraryPath,
        'XCFramework library path',
      );
      const binaryPath = requireString(
        slice.binaryPath,
        'XCFramework binary path',
      );
      slices.push({
        sdk,
        platform,
        variant,
        architectures,
        libraryIdentifier,
        libraryPath,
        binaryPath,
      });
    }
    frameworks.push({
      id,
      frameworkName,
      executableName,
      linkage: 'dynamic',
      artifactRelativePath,
      slices,
    });
  }
  return {version: 1, frameworks};
}

module.exports = {
  BUILTIN_FRAMEWORKS,
  FLAVORED_FRAMEWORKS_MANIFEST,
  PENDING_ARTIFACT_STAMP,
  INVARIANT_BINARY_TARGETS,
  PLUGIN_FRAMEWORKS_MANIFEST,
  parseXcframework,
  finalizeArtifactPublication,
  prepareFlavoredFrameworks,
  readFlavoredFrameworksManifest,
  sdkConditionForSlice,
  transformReactModuleMap,
  validatePair,
};
