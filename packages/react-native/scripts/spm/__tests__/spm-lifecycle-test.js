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

// Drives `setup-apple-spm.js` through scaffold → add → sync → sync → update →
// deinit on a fixture app, the way an adopter's project sees it. The Apple
// tools it shells out to are faked below; everything else is the real code.

jest.mock('node:child_process', () => {
  const actual = jest.requireActual('node:child_process');
  return {
    ...actual,
    execFileSync(command, args, options) {
      if (command === 'plutil') {
        const fs = jest.requireActual('node:fs');
        const plist = jest.requireActual('plist');
        return Buffer.from(
          JSON.stringify(plist.parse(fs.readFileSync(args.at(-1), 'utf8'))),
        );
      }
      if (command === 'otool') {
        return 'cmd LC_ID_DYLIB\n';
      }
      return actual.execFileSync(command, args, options);
    },
    execSync(command, options) {
      // Codegen has its own tests; here it would need a real app's JS specs.
      // Its output directory is what the tooling keys on, so that is faked.
      if (String(command).includes('generate-codegen-artifacts.js')) {
        const [, outputRoot] = /-o "([^"]+)"/.exec(String(command)) ?? [];
        if (outputRoot == null) {
          throw new Error(
            `Cannot find the -o "<dir>" output directory in: ${String(command)}`,
          );
        }
        jest
          .requireActual('node:fs')
          .mkdirSync(`${outputRoot}/build/generated/ios`, {recursive: true});
        return Buffer.from('');
      }
      return actual.execSync(command, options);
    },
    spawnSync(command, args, options) {
      if (command === 'pod') {
        return {
          status: null,
          stdout: '',
          stderr: '',
          error: new Error('ENOENT'),
        };
      }
      return actual.spawnSync(command, args, options);
    },
  };
});

const {main} = require('../../setup-apple-spm');
const {
  APP_DEPLOYMENT_TARGET,
  ARTIFACT_VERSIONS,
  PLUGIN_FRAMEWORKS,
  REACT_NATIVE_ROOT,
  createSpmFixtureApp,
} = require('./spm-fixture-app');
const {checkSpmInvariants} = require('./spm-invariants');
const {DOMParser} = require('@xmldom/xmldom');
const fs = require('node:fs');
const path = require('node:path');

const {spawnSync} = jest.requireActual('node:child_process');

const SPM_ENVIRONMENT = [
  'RCT_SPM_AUTOLINKING_CONFIG_COMMAND',
  'RN_SPM_REMOTE_URL',
  'RN_SPM_REMOTE_VERSION',
  'RN_CORE_TARBALL_PATH',
  'RN_DEPS_TARBALL_PATH',
  'RN_HEADERS_TARBALL_PATH',
  'RN_DEPS_HEADERS_TARBALL_PATH',
  'RN_DEP_VERSION',
  'HERMES_VERSION',
];
// Rewritten with the time of every sync, by design.
const SYNC_STAMP = 'build/generated/autolinking/.spm-sync-stamp';
const LIBS_DIR = 'build/generated/autolinking/libs';
const [CURRENT_VERSION, NEXT_VERSION] = ARTIFACT_VERSIONS;

let app;
let output;
let savedCwd;
let savedEnvironment;
let fetchSpy;

function artifactArgs(version) {
  return [
    '--version',
    version,
    '--artifacts',
    app.artifactsDirs[version],
    '--download',
    'skip',
  ];
}

async function spm(argv, expectedExitCode = 0) {
  output = [];
  process.exitCode = undefined;
  let exitCode;
  try {
    await main(argv);
  } finally {
    exitCode = process.exitCode ?? 0;
    process.exitCode = undefined;
  }
  if (exitCode !== expectedExitCode) {
    throw new Error(
      `spm ${argv.join(' ')} exited ${exitCode}, expected ${expectedExitCode}:\n${output.join('\n')}`,
    );
  }
}

function committedOutputs() {
  return {
    pbxproj: fs.readFileSync(app.pbxprojPath, 'utf8'),
    scheme: fs.readFileSync(app.schemePath, 'utf8'),
    marker: fs.readFileSync(app.markerPath, 'utf8'),
  };
}

function buildTree(dir = path.join(app.appRoot, 'build'), tree = {}) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const entryPath = path.join(dir, entry.name);
    const key = path.relative(app.appRoot, entryPath);
    if (key === SYNC_STAMP) {
      continue;
    }
    if (entry.isSymbolicLink()) {
      tree[key] = `-> ${fs.readlinkSync(entryPath)}`;
    } else if (entry.isDirectory()) {
      buildTree(entryPath, tree);
    } else {
      tree[key] = fs.readFileSync(entryPath, 'utf8');
    }
  }
  return tree;
}

function libInodes() {
  const libsDir = path.join(app.appRoot, LIBS_DIR);
  return Object.fromEntries(
    fs
      .readdirSync(libsDir)
      .map(name => [name, fs.lstatSync(path.join(libsDir, name)).ino]),
  );
}

function expectInvariants() {
  expect(
    checkSpmInvariants({
      appRoot: app.appRoot,
      xcodeprojPath: app.xcodeprojPath,
      expectedDeploymentTarget: APP_DEPLOYMENT_TARGET,
      forbiddenPaths: app.forbiddenPaths,
      requiredManifests: [
        path.relative(
          app.appRoot,
          path.join(app.libs.podspecOnly, 'Package.swift'),
        ),
      ],
    }),
  ).toEqual([]);
  // An empty list would make the marker-vs-pbxproj framework check vacuous.
  expect(
    JSON.parse(fs.readFileSync(app.markerPath, 'utf8')).linkedFrameworks
      ?.length,
  ).toBeGreaterThan(0);
}

// #58292 baked hermes-compiler's absolute path into the pbxproj; when the
// package does not resolve, nothing is written and that check passes vacuously.
function assertHermesCompilerResolves() {
  try {
    require.resolve('hermes-compiler/package.json', {
      paths: [REACT_NATIVE_ROOT],
    });
  } catch {
    throw new Error(
      `hermes-compiler does not resolve from ${REACT_NATIVE_ROOT}; run yarn install.`,
    );
  }
}

function syncPreActionScript() {
  const scheme = new DOMParser().parseFromString(
    fs.readFileSync(app.schemePath, 'utf8'),
    'text/xml',
  );
  const actions = Array.from(scheme.getElementsByTagName('ActionContent'));
  const preAction = actions.find(
    action => action.getAttribute('title') === 'Sync SPM Autolinking',
  );
  if (preAction == null) {
    throw new Error('The scheme has no "Sync SPM Autolinking" pre-action');
  }
  return preAction.getAttribute('scriptText');
}

// Runs the scheme pre-action as Xcode would and reports whether its stale
// check dispatched a sync (the fake `node` on PATH records the dispatch).
function preActionDispatchesSync() {
  fs.rmSync(app.dispatchLog, {force: true});
  // --noprofile --norc: some sandboxed shells reset PATH from rc files on
  // startup, which would hide the fake `node` at the front of PATH below and
  // make every stale check read as fresh. Xcode runs scheme pre-actions
  // without rc files, so this also matches production more closely.
  const result = spawnSync(
    'bash',
    ['--noprofile', '--norc', '-c', syncPreActionScript()],
    {
      cwd: app.appRoot,
      encoding: 'utf8',
      env: {
        HOME: process.env.HOME,
        PATH: `${app.toolsDir}${path.delimiter}${process.env.PATH ?? ''}`,
        SRCROOT: app.appRoot,
        PROJECT_DIR: app.appRoot,
        PROJECT_FILE_PATH: app.xcodeprojPath,
      },
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `The pre-action exited ${String(result.status)}:\n${result.stdout}${result.stderr}`,
    );
  }
  const dispatched = fs.existsSync(app.dispatchLog)
    ? fs.readFileSync(app.dispatchLog, 'utf8')
    : '';
  return /setup-apple-spm\.js sync\b/.test(dispatched);
}

// Bash 3.2, which Xcode runs, compares `-nt` in whole seconds, so a change
// made in the same second as the sync would read as fresh.
function afterLastSync() {
  const stamp = fs.statSync(path.join(app.appRoot, SYNC_STAMP));
  return stamp.mtimeMs / 1000 + 10;
}

function withMtime(file, seconds, run) {
  const {atime, mtime} = fs.statSync(file);
  fs.utimesSync(file, seconds, seconds);
  try {
    return run();
  } finally {
    fs.utimesSync(file, atime, mtime);
  }
}

describe('spm lifecycle on a fixture app', () => {
  let original;
  let afterAdd;

  beforeAll(() => {
    jest.useRealTimers();
    assertHermesCompilerResolves();
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async url => {
      throw new Error(`The lifecycle test must not fetch ${String(url)}`);
    });
    savedEnvironment = Object.fromEntries(
      SPM_ENVIRONMENT.map(name => [name, process.env[name]]),
    );
    for (const name of SPM_ENVIRONMENT) {
      delete process.env[name];
    }
    for (const method of ['log', 'warn', 'error']) {
      jest
        .spyOn(console, method)
        .mockImplementation((...args) =>
          output.push(`[${method}] ${args.join(' ')}`),
        );
    }
    app = createSpmFixtureApp();
    savedCwd = process.cwd();
    process.chdir(app.projectRoot);
    original = {
      pbxproj: fs.readFileSync(app.pbxprojPath, 'utf8'),
      scheme: fs.readFileSync(app.schemePath, 'utf8'),
    };
  });

  afterEach(() => {
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  afterAll(() => {
    try {
      app?.cleanup();
    } finally {
      if (savedCwd != null) {
        process.chdir(savedCwd);
      }
      for (const [name, value] of Object.entries(savedEnvironment ?? {})) {
        if (value === undefined) {
          delete process.env[name];
        } else {
          process.env[name] = value;
        }
      }
      jest.restoreAllMocks();
    }
  });

  it('scaffolds a manifest for the podspec-only library', async () => {
    await spm([
      'scaffold',
      ...artifactArgs(CURRENT_VERSION),
      '--config-command',
      JSON.stringify(app.configCommand),
    ]);

    expect(
      fs.existsSync(path.join(app.libs.podspecOnly, 'Package.swift')),
    ).toBe(true);
    expectInvariants();
  });

  // `scaffold` injects too and has no flag to skip that, so `add` never sees a
  // pristine project here; deinit's byte comparison covers the pristine side.
  it('adds SwiftPM to the app', async () => {
    await spm(['add', ...artifactArgs(CURRENT_VERSION)]);

    afterAdd = {
      outputs: committedOutputs(),
      inodes: libInodes(),
    };
    expect(Object.keys(afterAdd.inodes).sort()).toEqual([
      'AcmeNative',
      'AcmeWidgets',
      'ReactNativeScoped',
    ]);
    expectInvariants();
  });

  it('syncs twice without changing any output or replacing a libs/ entry', async () => {
    await spm(['sync']);
    const afterFirstSync = {
      outputs: committedOutputs(),
      build: buildTree(),
      inodes: libInodes(),
    };
    expectInvariants();

    await spm(['sync']);

    expectInvariants();
    expect(afterFirstSync.outputs).toEqual(afterAdd.outputs);
    expect(committedOutputs()).toEqual(afterAdd.outputs);
    expect(buildTree()).toEqual(afterFirstSync.build);
    expect(afterFirstSync.inodes).toEqual(afterAdd.inodes);
    expect(libInodes()).toEqual(afterAdd.inodes);
  });

  describe('the scheme pre-action stale check', () => {
    beforeEach(async () => {
      await spm(['sync']);
      expectInvariants();
      expect(preActionDispatchesSync()).toBe(false);
    });

    it('ignores the state Xcode writes into a library .swiftpm folder', () => {
      const userData = path.join(
        app.libs.selfManaged,
        '.swiftpm',
        'xcuserdata',
      );
      const file = path.join(userData, 'x');
      const later = afterLastSync();
      const {atime, mtime} = fs.statSync(userData);
      fs.writeFileSync(file, '');
      fs.utimesSync(file, later, later);
      fs.utimesSync(userData, later, later);
      try {
        expect(preActionDispatchesSync()).toBe(false);
      } finally {
        fs.rmSync(file);
        fs.utimesSync(userData, atime, mtime);
      }
    });

    it('re-syncs when a watched path that was absent appears', () => {
      // The parent keeps its mtime, so the new path itself is the only change
      // the check can react to.
      const parent = path.dirname(app.absentPluginWatchPath);
      const {atime, mtime} = fs.statSync(parent);
      fs.mkdirSync(app.absentPluginWatchPath);
      fs.utimesSync(parent, atime, mtime);
      try {
        expect(preActionDispatchesSync()).toBe(true);
      } finally {
        fs.rmSync(app.absentPluginWatchPath, {recursive: true});
        fs.utimesSync(parent, atime, mtime);
      }
    });

    it('re-syncs when the marker changes', () => {
      withMtime(app.markerPath, afterLastSync(), () => {
        expect(preActionDispatchesSync()).toBe(true);
      });
    });
  });

  it('fails sync with exit 2 when a plugin adds a framework the project does not link', async () => {
    app.setPluginFrameworks(PLUGIN_FRAMEWORKS);
    try {
      await spm(['sync'], 2);
      expect(output.join('\n')).toContain(
        'AcmeHostExtras (AcmeHostExtras) is a precompiled framework from an autolinking plugin, but the Xcode project does not link it',
      );
      expectInvariants();
    } finally {
      app.setPluginFrameworks(PLUGIN_FRAMEWORKS.slice(0, 1));
    }
    await spm(['sync']);
    expectInvariants();
  });

  it('updates to the same version without changing the project or scheme', async () => {
    await spm(['update', ...artifactArgs(CURRENT_VERSION)]);

    expectInvariants();
    const {pbxproj, scheme} = committedOutputs();
    expect(pbxproj).toBe(afterAdd.outputs.pbxproj);
    expect(scheme).toBe(afterAdd.outputs.scheme);
  });

  it('updates to a new version', async () => {
    await spm(['update', ...artifactArgs(NEXT_VERSION)]);

    expectInvariants();
  });

  it('deinit restores the project and scheme the app started with', async () => {
    await spm(['deinit']);

    expect(fs.readFileSync(app.pbxprojPath, 'utf8')).toBe(original.pbxproj);
    expect(fs.readFileSync(app.schemePath, 'utf8')).toBe(original.scheme);
    expect(fs.existsSync(app.markerPath)).toBe(false);
  });
});
