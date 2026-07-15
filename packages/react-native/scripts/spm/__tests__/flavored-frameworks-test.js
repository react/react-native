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

// flavored-frameworks.js shells out to `plutil` to read xcframework
// Info.plists as JSON — plutil is macOS-only, so stand in with a portable
// plist-parse for Linux CI. Module-level mock because the module destructures
// `execFileSync` at require time (same pattern as the old swap-flavor-test).
jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return {
    ...actual,
    execFileSync: (cmd, args, opts) => {
      if (cmd === 'plutil') {
        const fsActual = require('fs');
        const plistActual = jest.requireActual('plist');
        const file = args[args.length - 1];
        return Buffer.from(
          JSON.stringify(
            plistActual.parse(fsActual.readFileSync(file, 'utf8')),
          ),
        );
      }
      return actual.execFileSync(cmd, args, opts);
    },
  };
});

const {
  PLUGIN_FRAMEWORKS_MANIFEST,
  finalizeArtifactPublication,
  prepareFlavoredFrameworks,
  sdkConditionForSlice,
  transformReactModuleMap,
} = require('../flavored-frameworks');
const fs = require('fs');
const os = require('os');
const path = require('path');
const plist = require('plist');

const BUILTINS = [
  ['React', 'React'],
  ['ReactNativeDependencies', 'ReactNativeDependencies'],
  ['hermes-engine', 'hermesvm'],
];

function writeFrameworkXcframework(
  root,
  artifactName,
  frameworkName,
  options = {},
) {
  const xcframework = path.join(root, `${artifactName}.xcframework`);
  const architectures = options.architectures ?? ['arm64', 'x86_64'];
  const identifier = options.identifier ?? 'ios-arm64_x86_64-simulator';
  const framework = path.join(
    xcframework,
    identifier,
    `${frameworkName}.framework`,
  );
  fs.mkdirSync(path.join(framework, 'Headers'), {recursive: true});
  fs.mkdirSync(path.join(framework, 'Modules'), {recursive: true});
  fs.writeFileSync(
    path.join(framework, 'Headers', `${frameworkName}.h`),
    options.header ?? `void ${frameworkName}Header(void);\n`,
  );
  fs.writeFileSync(
    path.join(framework, 'Modules', 'module.modulemap'),
    `framework module ${frameworkName} {\n  umbrella header "${frameworkName}.h"\n  export *\n}\n`,
  );
  if (options.swiftInterface != null) {
    fs.writeFileSync(
      path.join(framework, 'Modules', `${frameworkName}.swiftinterface`),
      options.swiftInterface,
    );
  }
  fs.writeFileSync(path.join(framework, frameworkName), 'not-a-real-mach-o');
  fs.writeFileSync(
    path.join(xcframework, 'Info.plist'),
    plist.build({
      CFBundlePackageType: 'XFWK',
      XCFrameworkFormatVersion: '1.0',
      AvailableLibraries: [
        {
          LibraryIdentifier: identifier,
          LibraryPath: `${frameworkName}.framework`,
          SupportedArchitectures: architectures,
          SupportedPlatform: 'ios',
          SupportedPlatformVariant: 'simulator',
        },
      ],
    }),
  );
  return xcframework;
}

function writeHeadersXcframework(root, name, header = 'void Header(void);\n') {
  const xcframework = path.join(root, `${name}.xcframework`);
  const identifier = 'ios-arm64_x86_64-simulator';
  const headers = path.join(xcframework, identifier, 'Headers');
  fs.mkdirSync(headers, {recursive: true});
  fs.writeFileSync(path.join(headers, `${name}.h`), header);
  fs.writeFileSync(
    path.join(xcframework, 'Info.plist'),
    plist.build({
      CFBundlePackageType: 'XFWK',
      XCFrameworkFormatVersion: '1.0',
      AvailableLibraries: [
        {
          LibraryIdentifier: identifier,
          LibraryPath: `lib${name}.a`,
          HeadersPath: 'Headers',
          SupportedArchitectures: ['arm64', 'x86_64'],
          SupportedPlatform: 'ios',
          SupportedPlatformVariant: 'simulator',
        },
      ],
    }),
  );
  return xcframework;
}

function writeArtifactSlot(root, options = {}) {
  fs.mkdirSync(root, {recursive: true});
  const artifacts = {};
  for (const [artifactName, frameworkName] of BUILTINS) {
    if (options.missing === artifactName) {
      continue;
    }
    artifacts[artifactName] = {
      xcframeworkPath: writeFrameworkXcframework(
        root,
        artifactName,
        frameworkName,
        artifactName === 'React'
          ? {
              header: options.reactHeader,
              swiftInterface: options.reactSwiftInterface,
              identifier: options.reactIdentifier,
              architectures: options.reactArchitectures,
            }
          : {},
      ),
    };
  }
  for (const name of ['ReactNativeHeaders', 'ReactNativeDependenciesHeaders']) {
    if (options.missing === name) {
      continue;
    }
    artifacts[name] = {
      xcframeworkPath: writeHeadersXcframework(
        root,
        name,
        options[`${name}Header`],
      ),
    };
  }
  fs.writeFileSync(
    path.join(root, 'artifacts.json'),
    `${JSON.stringify(artifacts, null, 2)}\n`,
  );
  return artifacts;
}

describe('flavored framework preparation', () => {
  let root;
  let appRoot;
  let debugRoot;
  let releaseRoot;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-flavored-frameworks-'));
    appRoot = path.join(root, 'app');
    debugRoot = path.join(root, 'artifacts', 'debug');
    releaseRoot = path.join(root, 'artifacts', 'release');
    fs.mkdirSync(appRoot, {recursive: true});
  });

  afterEach(() => fs.rmSync(root, {recursive: true, force: true}));

  function prepare() {
    return prepareFlavoredFrameworks({
      appRoot,
      debugArtifactsDir: debugRoot,
      releaseArtifactsDir: releaseRoot,
      validateBinaries: false,
    });
  }

  it('publishes immutable Debug/Release slots and invariant React headers', () => {
    writeArtifactSlot(debugRoot);
    writeArtifactSlot(releaseRoot);

    const manifest = prepare();
    const packageRoot = path.join(appRoot, 'build', 'xcframeworks');
    expect(manifest.frameworks.map(f => f.frameworkName)).toEqual([
      'React',
      'ReactNativeDependencies',
      'hermesvm',
    ]);
    for (const flavor of ['debug', 'release']) {
      expect(
        fs
          .lstatSync(path.join(packageRoot, flavor, 'React.xcframework'))
          .isSymbolicLink(),
      ).toBe(true);
    }
    expect(
      fs.readFileSync(
        path.join(
          packageRoot,
          'ReactHeadersTarget',
          'include',
          'module.modulemap',
        ),
        'utf8',
      ),
    ).toContain('module React');
    expect(
      fs.existsSync(
        path.join(
          packageRoot,
          'ReactHeadersTarget',
          'include',
          'React',
          'React.h',
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, '.artifact-stamp.pending')),
    ).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, '.artifact-stamp'))).toBe(
      false,
    );
    expect(finalizeArtifactPublication(appRoot)).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, '.artifact-stamp'))).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, '.artifact-stamp.pending')),
    ).toBe(false);
  });

  it('is byte-identical when repeated with unchanged artifacts', () => {
    writeArtifactSlot(debugRoot);
    writeArtifactSlot(releaseRoot);
    prepare();
    finalizeArtifactPublication(appRoot);
    const manifestPath = path.join(
      appRoot,
      'build',
      'xcframeworks',
      'flavored-frameworks.json',
    );
    const first = fs.readFileSync(manifestPath);
    const reactLink = path.join(
      appRoot,
      'build',
      'xcframeworks',
      'debug',
      'React.xcframework',
    );
    const inode = fs.lstatSync(reactLink).ino;
    prepare();
    expect(fs.readFileSync(manifestPath)).toEqual(first);
    expect(fs.lstatSync(reactLink).ino).toBe(inode);
  });

  it('changes the artifact stamp when a selected binary changes in place', () => {
    const debug = writeArtifactSlot(debugRoot);
    writeArtifactSlot(releaseRoot);
    prepare();
    finalizeArtifactPublication(appRoot);
    const stampPath = path.join(
      appRoot,
      'build',
      'xcframeworks',
      '.artifact-stamp',
    );
    const first = fs.readFileSync(stampPath, 'utf8');
    const binary = path.join(
      debug.React.xcframeworkPath,
      'ios-arm64_x86_64-simulator',
      'React.framework',
      'React',
    );
    fs.appendFileSync(binary, '-updated');
    prepare();
    finalizeArtifactPublication(appRoot);
    expect(fs.readFileSync(stampPath, 'utf8')).not.toBe(first);
  });

  it('preserves the last complete publication when new artifacts fail validation', () => {
    writeArtifactSlot(debugRoot);
    const release = writeArtifactSlot(releaseRoot);
    prepare();
    finalizeArtifactPublication(appRoot);
    const manifestPath = path.join(
      appRoot,
      'build',
      'xcframeworks',
      'flavored-frameworks.json',
    );
    const first = fs.readFileSync(manifestPath, 'utf8');
    fs.writeFileSync(
      path.join(
        release.React.xcframeworkPath,
        'ios-arm64_x86_64-simulator',
        'React.framework',
        'Headers',
        'React.h',
      ),
      'void BrokenReleaseHeaders(void);\n',
    );
    expect(prepare).toThrow(/different Debug and Release headers/);
    expect(fs.readFileSync(manifestPath, 'utf8')).toBe(first);
  });

  it('fails before publication when either flavor is incomplete', () => {
    writeArtifactSlot(debugRoot);
    writeArtifactSlot(releaseRoot, {missing: 'hermes-engine'});
    expect(prepare).toThrow(/both flavors must contain 'hermes-engine'/);
    expect(fs.existsSync(path.join(appRoot, 'build', 'xcframeworks'))).toBe(
      false,
    );
  });

  it('rejects Debug/Release header differences', () => {
    writeArtifactSlot(debugRoot, {reactHeader: 'void DebugOnly(void);\n'});
    writeArtifactSlot(releaseRoot, {reactHeader: 'void ReleaseOnly(void);\n'});
    expect(prepare).toThrow(/different Debug and Release headers/);
  });

  it('accepts flavor-specific Swift module metadata when public headers match', () => {
    writeArtifactSlot(debugRoot, {
      reactSwiftInterface: '// Debug -Onone interface metadata\n',
    });
    writeArtifactSlot(releaseRoot, {
      reactSwiftInterface: '// Release -O interface metadata\n',
    });
    expect(prepare).not.toThrow();
  });

  it('rejects incompatible Debug/Release slices', () => {
    writeArtifactSlot(debugRoot);
    writeArtifactSlot(releaseRoot, {
      reactIdentifier: 'ios-arm64-simulator',
      reactArchitectures: ['arm64'],
    });
    expect(prepare).toThrow(/incompatible Debug and Release XCFrameworks/);
  });

  it('normalizes plugin frameworks and rejects destination collisions', () => {
    writeArtifactSlot(debugRoot);
    writeArtifactSlot(releaseRoot);
    const pluginDebug = writeFrameworkXcframework(
      path.join(root, 'plugin-debug'),
      'Plugin',
      'React',
    );
    const pluginRelease = writeFrameworkXcframework(
      path.join(root, 'plugin-release'),
      'Plugin',
      'React',
    );
    const pluginManifest = path.join(appRoot, PLUGIN_FRAMEWORKS_MANIFEST);
    fs.mkdirSync(path.dirname(pluginManifest), {recursive: true});
    fs.writeFileSync(
      pluginManifest,
      JSON.stringify([
        {
          id: 'plugin',
          frameworkName: 'React',
          linkage: 'dynamic',
          flavors: {debug: pluginDebug, release: pluginRelease},
        },
      ]),
    );
    expect(prepare).toThrow(/multiple flavored frameworks embed as React/);
  });

  it('rejects plugin IDs that collide with built-in framework settings', () => {
    writeArtifactSlot(debugRoot);
    writeArtifactSlot(releaseRoot);
    const pluginDebug = writeFrameworkXcframework(
      path.join(root, 'plugin-debug'),
      'Plugin',
      'PluginFramework',
    );
    const pluginRelease = writeFrameworkXcframework(
      path.join(root, 'plugin-release'),
      'Plugin',
      'PluginFramework',
    );
    const pluginManifest = path.join(appRoot, PLUGIN_FRAMEWORKS_MANIFEST);
    fs.mkdirSync(path.dirname(pluginManifest), {recursive: true});
    fs.writeFileSync(
      pluginManifest,
      JSON.stringify([
        {
          id: 'react',
          frameworkName: 'PluginFramework',
          linkage: 'dynamic',
          flavors: {debug: pluginDebug, release: pluginRelease},
        },
      ]),
    );
    expect(prepare).toThrow(/duplicate flavored framework id 'react'/);
  });
});

describe('XCFramework helpers', () => {
  it.each([
    ['ios', null, 'iphoneos*'],
    ['ios', 'simulator', 'iphonesimulator*'],
    ['ios', 'maccatalyst', 'macosx*'],
    ['tvos', 'simulator', 'appletvsimulator*'],
    ['xros', null, 'xros*'],
  ])('maps %s/%s to %s', (platform, variant, expected) => {
    expect(sdkConditionForSlice(platform, variant)).toBe(expected);
  });

  it('converts the framework module map to a plain prefixed React module', () => {
    expect(
      transformReactModuleMap(
        'framework module React {\n  umbrella header "React.h"\n  textual header "RCTDefines.h"\n}\n',
      ),
    ).toBe(
      'module React {\n  umbrella header "React/React.h"\n  textual header "React/RCTDefines.h"\n}\n',
    );
  });
});
