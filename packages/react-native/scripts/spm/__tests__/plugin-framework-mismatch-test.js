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

const {PLUGIN_FRAMEWORKS_MANIFEST} = require('../flavored-frameworks');
const {
  PluginFrameworkMismatchError,
  SPM_INJECTED_MARKER,
  assertPluginFrameworksLinked,
  injectSpmIntoExistingXcodeproj,
} = require('../generate-spm-xcodeproj');
const {main: syncAutolinking} = require('../sync-spm-autolinking');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PLAIN = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'plain-app.pbxproj'),
  'utf8',
);

function frameworkEntry(id, frameworkName, artifactRelativePath) {
  return {
    id,
    frameworkName,
    executableName: frameworkName,
    linkage: 'dynamic',
    artifactRelativePath,
    slices: [
      {
        sdk: 'iphoneos*',
        platform: 'ios',
        variant: null,
        architectures: ['arm64'],
        libraryIdentifier: 'ios-arm64',
        libraryPath: `${frameworkName}.framework`,
        binaryPath: `${frameworkName}.framework/${frameworkName}`,
      },
    ],
  };
}

const REACT = frameworkEntry('react', 'React', 'React.xcframework');
const HERMES = frameworkEntry('hermes', 'hermes', 'hermes-engine.xcframework');
const EXPO = frameworkEntry(
  'expo-core',
  'ExpoCore',
  'plugins/expo-core.xcframework',
);

let appRoots = [];
let errorSpy;
let warnSpy;

beforeEach(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const appRoot of appRoots) {
    fs.rmSync(appRoot, {recursive: true, force: true});
  }
  appRoots = [];
});

function scaffoldApp() {
  const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-plugin-check-'));
  appRoots.push(appRoot);
  const xcodeprojPath = path.join(appRoot, 'MyApp.xcodeproj');
  fs.mkdirSync(xcodeprojPath, {recursive: true});
  fs.writeFileSync(path.join(xcodeprojPath, 'project.pbxproj'), PLAIN);
  const rnRoot = path.join(appRoot, 'node_modules', 'react-native');
  fs.mkdirSync(rnRoot, {recursive: true});
  const artifactRoot = path.join(appRoot, 'build', 'xcframeworks');
  fs.mkdirSync(artifactRoot, {recursive: true});
  fs.writeFileSync(path.join(artifactRoot, '.artifact-stamp'), 'test\n');
  return {appRoot, xcodeprojPath, rnRoot};
}

// What `spm add` / `spm update` would have linked.
function inject({appRoot, xcodeprojPath, rnRoot}, frameworks) {
  fs.writeFileSync(
    path.join(appRoot, 'build', 'xcframeworks', 'flavored-frameworks.json'),
    JSON.stringify({version: 1, frameworks}),
  );
  injectSpmIntoExistingXcodeproj({
    appRoot,
    reactNativeRoot: rnRoot,
    xcodeprojPath,
  });
}

// What the build-time sync's plugins pair on this machine.
function writeSidecar(appRoot, frameworks) {
  const sidecarPath = path.join(appRoot, PLUGIN_FRAMEWORKS_MANIFEST);
  fs.mkdirSync(path.dirname(sidecarPath), {recursive: true});
  fs.writeFileSync(
    sidecarPath,
    JSON.stringify(
      frameworks.map(({id, frameworkName}) => ({
        id,
        frameworkName,
        linkage: 'dynamic',
        flavors: {
          debug: `/plugins/debug/${frameworkName}.xcframework`,
          release: `/plugins/release/${frameworkName}.xcframework`,
        },
      })),
    ),
  );
}

function projectFiles(xcodeprojPath) {
  return ['project.pbxproj', SPM_INJECTED_MARKER].map(name => {
    const file = path.join(xcodeprojPath, name);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  });
}

// Runs the check and proves it wrote neither the pbxproj nor the marker.
// Returns the printed lines and the thrown error, if any.
function check(app, env = {}) {
  const before = projectFiles(app.xcodeprojPath);
  let error = null;
  try {
    assertPluginFrameworksLinked(app.appRoot, env);
  } catch (e) {
    error = e;
  }
  expect(projectFiles(app.xcodeprojPath)).toEqual(before);
  return {error, lines: errorSpy.mock.calls.map(call => call.join(' '))};
}

function readLinkedFrameworks({xcodeprojPath}) {
  return JSON.parse(
    fs.readFileSync(path.join(xcodeprojPath, SPM_INJECTED_MARKER), 'utf8'),
  ).linkedFrameworks;
}

// What a marker written before `linkedFrameworks` was recorded looks like.
function injectWithOlderMarker(app, frameworks) {
  inject(app, frameworks);
  const markerPath = path.join(app.xcodeprojPath, SPM_INJECTED_MARKER);
  const {linkedFrameworks, ...olderMarker} = JSON.parse(
    fs.readFileSync(markerPath, 'utf8'),
  );
  expect(linkedFrameworks).toBeDefined();
  fs.writeFileSync(markerPath, JSON.stringify(olderMarker, null, 2) + '\n');
}

const EXPO_NOT_LINKED =
  'error: ExpoCore (expo-core) is a precompiled framework from an autolinking plugin, but the Xcode project does not link it. Run `npx react-native spm update` to add ExpoCore to the committed project for the whole team.';
const EXPO_NOT_PROVIDED =
  'error: The Xcode project links ExpoCore.framework, but no autolinking plugin provides it on this machine. Running `npx react-native spm update` removes ExpoCore from the committed project for the whole team. Instead, precompile ExpoCore, then run `npx react-native spm sync`.';
const LINKED_CHECK_SKIPPED =
  'warning: Skipped the check for frameworks that the Xcode project links but no plugin provides. The project does not record them in .spm-injected.json, and build/xcframeworks/flavored-frameworks.json is missing. Run `npx react-native spm update` to record them.';

describe.each([
  ['the marker', inject],
  ['the project, for an older marker', injectWithOlderMarker],
])('assertPluginFrameworksLinked, linked frameworks from %s', (_, link) => {
  it('fails when a plugin pairs a framework the project does not link', () => {
    const app = scaffoldApp();
    link(app, [REACT]);
    writeSidecar(app.appRoot, [EXPO]);

    const {error, lines} = check(app);

    expect(error).toBeInstanceOf(PluginFrameworkMismatchError);
    expect(lines).toEqual([EXPO_NOT_LINKED]);
    expect(error.problems).toEqual(lines);
  });

  it('fails when the project links a plugin framework no plugin provides', () => {
    const app = scaffoldApp();
    link(app, [REACT, EXPO]);
    writeSidecar(app.appRoot, []);

    const {error, lines} = check(app);

    expect(error).toBeInstanceOf(PluginFrameworkMismatchError);
    expect(lines).toEqual([EXPO_NOT_PROVIDED]);
  });

  it('fails when a plugin renames its framework but keeps its id', () => {
    const app = scaffoldApp();
    link(app, [REACT, EXPO]);
    writeSidecar(app.appRoot, [{id: 'expo-core', frameworkName: 'NewCore'}]);

    const {error, lines} = check(app);

    expect(error).toBeInstanceOf(PluginFrameworkMismatchError);
    expect(lines).toEqual([
      'error: NewCore (expo-core) is a precompiled framework from an autolinking plugin, but the Xcode project does not link it. Run `npx react-native spm update` to add NewCore to the committed project for the whole team.',
      EXPO_NOT_PROVIDED,
    ]);
  });

  it('checks the project Xcode is building, not the first injected one', () => {
    const app = scaffoldApp();
    const stale = {
      ...app,
      xcodeprojPath: path.join(app.appRoot, 'A.xcodeproj'),
    };
    fs.mkdirSync(stale.xcodeprojPath);
    fs.writeFileSync(path.join(stale.xcodeprojPath, 'project.pbxproj'), PLAIN);
    link(stale, [REACT]);
    link(app, [REACT, EXPO]);
    writeSidecar(app.appRoot, [EXPO]);

    expect(check(app, {PROJECT_FILE_PATH: app.xcodeprojPath})).toEqual({
      error: null,
      lines: [],
    });
  });

  it('passes when the project links exactly the paired plugin frameworks', () => {
    const app = scaffoldApp();
    link(app, [REACT, HERMES, EXPO]);
    writeSidecar(app.appRoot, [EXPO]);

    expect(check(app)).toEqual({error: null, lines: []});
  });

  it('reads framework names that contain a space', () => {
    const app = scaffoldApp();
    const spaced = frameworkEntry('my-fw', 'My Fw', 'My Fw.xcframework');
    link(app, [REACT, HERMES, spaced]);
    writeSidecar(app.appRoot, [spaced]);

    expect(check(app)).toEqual({error: null, lines: []});
  });

  it('skips a project that was never injected', () => {
    const app = scaffoldApp();
    writeSidecar(app.appRoot, [EXPO]);

    expect(check(app)).toEqual({error: null, lines: []});
  });
});

describe('assertPluginFrameworksLinked, linked frameworks from the marker', () => {
  it('records every framework the embed phase links', () => {
    const app = scaffoldApp();
    inject(app, [REACT, HERMES, EXPO]);

    expect(readLinkedFrameworks(app)).toEqual([
      {id: 'react', frameworkName: 'React'},
      {id: 'hermes', frameworkName: 'hermes'},
      {id: 'expo-core', frameworkName: 'ExpoCore'},
    ]);
  });

  it('reports an unprovided framework when the frameworks manifest is missing', () => {
    const app = scaffoldApp();
    inject(app, [REACT, HERMES, EXPO]);
    writeSidecar(app.appRoot, []);
    fs.rmSync(
      path.join(app.appRoot, 'build/xcframeworks/flavored-frameworks.json'),
    );

    expect(check(app).lines).toEqual([EXPO_NOT_PROVIDED]);
  });

  it('reads the marker, not the project', () => {
    const app = scaffoldApp();
    inject(app, [REACT, EXPO]);
    writeSidecar(app.appRoot, []);
    fs.writeFileSync(path.join(app.xcodeprojPath, 'project.pbxproj'), PLAIN);

    expect(check(app).lines).toEqual([EXPO_NOT_PROVIDED]);
  });
});

describe('assertPluginFrameworksLinked, linked frameworks from the project, for an older marker', () => {
  it('compares only setting prefixes when the frameworks manifest is missing', () => {
    const app = scaffoldApp();
    injectWithOlderMarker(app, [REACT, HERMES, EXPO]);
    writeSidecar(app.appRoot, [EXPO]);
    fs.rmSync(
      path.join(app.appRoot, 'build/xcframeworks/flavored-frameworks.json'),
    );

    expect(check(app)).toEqual({error: null, lines: []});
  });

  it('warns that it skipped the unprovided check when the frameworks manifest is missing', () => {
    const app = scaffoldApp();
    injectWithOlderMarker(app, [REACT, HERMES, EXPO]);
    writeSidecar(app.appRoot, []);
    fs.rmSync(
      path.join(app.appRoot, 'build/xcframeworks/flavored-frameworks.json'),
    );

    expect(check(app)).toEqual({error: null, lines: []});
    expect(warnSpy.mock.calls).toEqual([[LINKED_CHECK_SKIPPED]]);
  });

  it('does not warn when the frameworks manifest is present', () => {
    const app = scaffoldApp();
    injectWithOlderMarker(app, [REACT, HERMES, EXPO]);
    writeSidecar(app.appRoot, [EXPO]);

    expect(check(app)).toEqual({error: null, lines: []});
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('skips a project without the embed phase', () => {
    const app = scaffoldApp();
    injectWithOlderMarker(app, [REACT]);
    writeSidecar(app.appRoot, [EXPO]);
    fs.writeFileSync(path.join(app.xcodeprojPath, 'project.pbxproj'), PLAIN);

    expect(check(app)).toEqual({error: null, lines: []});
  });
});

describe('recovering from an unprovided framework', () => {
  // A build-time sync whose plugins provide `provided` on this machine.
  function sync(app, provided) {
    return syncAutolinking(
      ['--app-root', app.appRoot, '--react-native-root', app.rnRoot],
      {
        runCodegenAndInstallTemplate: jest.fn(),
        installSpmCodegenTemplate: jest.fn(),
        buildPerAppHeaderTree: jest.fn(),
        findProjectRoot: () => app.appRoot,
        generateAutolinking: () => writeSidecar(app.appRoot, provided),
      },
    );
  }

  const mismatchPath = app =>
    path.join(app.appRoot, 'build/generated/autolinking/.spm-plugin-mismatch');

  it('passes the sync the error names once the framework is precompiled', async () => {
    const app = scaffoldApp();
    inject(app, [REACT, EXPO]);
    await expect(sync(app, [])).rejects.toBeInstanceOf(
      PluginFrameworkMismatchError,
    );
    const recorded = fs.readFileSync(mismatchPath(app), 'utf8');
    expect(recorded).toBe(EXPO_NOT_PROVIDED + '\n');
    expect(recorded.trim()).toMatch(/run `npx react-native spm sync`\.$/);

    // The developer precompiles ExpoCore, then runs `npx react-native spm sync`.
    await sync(app, [EXPO]);

    expect(fs.existsSync(mismatchPath(app))).toBe(false);
  });
});

it('injects a plugin framework idempotently', () => {
  const app = scaffoldApp();
  inject(app, [REACT, EXPO]);
  const pbxprojPath = path.join(app.xcodeprojPath, 'project.pbxproj');
  const once = fs.readFileSync(pbxprojPath, 'utf8');

  inject(app, [REACT, EXPO]);

  expect(fs.readFileSync(pbxprojPath, 'utf8')).toBe(once);
});
