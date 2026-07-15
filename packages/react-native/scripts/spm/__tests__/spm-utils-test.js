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

const {
  RemoteVersionError,
  buildPerAppHeaderTree,
  defaultCacheDir,
  displayPath,
  isPublishableVersion,
  makeLogger,
  readPackageJson,
  remotePackageConfig,
  resolveInstalledRnVersion,
  resolveReactNativeRoot,
  runCodegenAndInstallTemplate,
  sharedCacheDir,
  toSwiftName,
} = require('../spm-utils');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// toSwiftName
// ---------------------------------------------------------------------------

describe('toSwiftName', () => {
  it.each([
    ['@react-native/tester', 'Tester'],
    ['my-app', 'MyApp'],
    ['@scope/foo-bar', 'FooBar'],
    ['simple', 'Simple'],
    ['a--b', 'AB'],
    ['my_great_app', 'MyGreatApp'],
  ])('toSwiftName(%j) => %j', (input, expected) => {
    expect(toSwiftName(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// defaultCacheDir
// ---------------------------------------------------------------------------

describe('sharedCacheDir', () => {
  it('matches CocoaPods shared_cache_dir (~/Library/Caches/ReactNative)', () => {
    expect(sharedCacheDir()).toBe(
      path.join(os.homedir(), 'Library', 'Caches', 'ReactNative'),
    );
  });
});

describe('defaultCacheDir', () => {
  it('nests SPM artifacts under the canonical ReactNative cache root', () => {
    const result = defaultCacheDir('0.80.0', 'debug');
    expect(result).toBe(
      path.join(
        os.homedir(),
        'Library',
        'Caches',
        'ReactNative',
        'spm-artifacts',
        '0.80.0',
        'debug',
      ),
    );
    // No bundle-id-named dir that other tools might also use.
    expect(result).not.toContain('com.facebook.ReactNative');
  });

  it('varies by flavor', () => {
    const debug = defaultCacheDir('1.0.0', 'debug');
    const release = defaultCacheDir('1.0.0', 'release');
    expect(debug).not.toBe(release);
    expect(debug).toContain('debug');
    expect(release).toContain('release');
  });
});

// ---------------------------------------------------------------------------
// displayPath
// ---------------------------------------------------------------------------

describe('displayPath', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('replaces homedir with ~', () => {
    const home = os.homedir();
    expect(displayPath(path.join(home, 'projects', 'app'))).toBe(
      '~/projects/app',
    );
  });

  it('returns ~ for exact homedir', () => {
    expect(displayPath(os.homedir())).toBe('~');
  });

  it('returns relative path when close to cwd and not under $HOME', () => {
    const cwd = path.join(os.tmpdir(), 'spm-display-cwd');
    jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    jest.spyOn(os, 'homedir').mockReturnValue('/home/spm-display-user');
    expect(displayPath(path.join(cwd, 'sub', 'dir'))).toBe(
      path.join('sub', 'dir'),
    );
  });

  it('returns absolute path for deep relative', () => {
    // Paths more than 2 levels above cwd should stay absolute
    // (unless they fall under $HOME)
    const home = os.homedir();
    const p = path.join(home, 'deep', 'nested', 'path');
    // This is under $HOME, so it should use ~/
    expect(displayPath(p)).toBe('~/deep/nested/path');
  });
});

// ---------------------------------------------------------------------------
// makeLogger
// ---------------------------------------------------------------------------

describe('makeLogger', () => {
  let spies;

  afterEach(() => {
    if (spies) {
      spies.forEach(s => s.mockRestore());
      spies = null;
    }
  });

  function mockConsole(...methods) {
    spies = methods.map(m =>
      jest.spyOn(console, m).mockImplementation(() => {}),
    );
    return spies;
  }

  it('log writes to stdout with green prefix', () => {
    const [spy] = mockConsole('log');
    const {log} = makeLogger('test');
    log('hello');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[test]'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('hello'));
  });

  it('warn writes to stderr with yellow prefix', () => {
    const [spy] = mockConsole('warn');
    const {warn} = makeLogger('test');
    warn('caution');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[test]'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('caution'));
  });

  it('die throws, sets exitCode, writes to stderr', () => {
    const [spy] = mockConsole('error');
    const origExitCode = process.exitCode;
    try {
      const {die} = makeLogger('test');
      expect(() => die('fatal')).toThrow('fatal');
      expect(process.exitCode).toBe(1);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('fatal'));
    } finally {
      process.exitCode = origExitCode;
    }
  });
});

// ---------------------------------------------------------------------------
// readPackageJson
// ---------------------------------------------------------------------------

describe('readPackageJson', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns parsed JSON for valid file', () => {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({name: 'test-pkg', version: '1.0.0'}),
    );
    const result = readPackageJson(tempDir);
    expect(result).toEqual({name: 'test-pkg', version: '1.0.0'});
  });

  it('returns null for missing file', () => {
    expect(readPackageJson(tempDir)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveReactNativeRoot
// ---------------------------------------------------------------------------

describe('resolveReactNativeRoot', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('finds react-native hoisted above the app package root', () => {
    const workspaceRoot = path.join(tempDir, 'workspace');
    const appRoot = path.join(workspaceRoot, 'packages', 'app', 'ios');
    const rnRoot = path.join(workspaceRoot, 'node_modules', 'react-native');
    fs.mkdirSync(appRoot, {recursive: true});
    fs.mkdirSync(rnRoot, {recursive: true});

    expect(
      resolveReactNativeRoot(
        appRoot,
        path.join(workspaceRoot, 'packages', 'app'),
      ),
    ).toBe(rnRoot);
  });
});

// ---------------------------------------------------------------------------
// isPublishableVersion
// ---------------------------------------------------------------------------

describe('isPublishableVersion', () => {
  it.each([
    ['0.86.3', true],
    ['0.87.0-nightly-20260608-2ff3b81dc', true],
    ['1.2.3', true],
    ['1000.0.0', false],
    ['0.0.0', false],
    ['0.0.0-canary', false],
    [null, false],
    ['', false],
  ])('isPublishableVersion(%j) => %j', (input, expected) => {
    expect(isPublishableVersion(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// resolveInstalledRnVersion
// ---------------------------------------------------------------------------

describe('resolveInstalledRnVersion', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  function writeRn(dir /*: string */, version /*: string */) {
    const rnDir = path.join(dir, 'node_modules', 'react-native');
    fs.mkdirSync(rnDir, {recursive: true});
    fs.writeFileSync(
      path.join(rnDir, 'package.json'),
      JSON.stringify({name: 'react-native', version}),
    );
  }

  it('reads the version from appRoot/node_modules/react-native', () => {
    writeRn(tempDir, '0.86.3');
    expect(resolveInstalledRnVersion(tempDir)).toBe('0.86.3');
  });

  it('walks up to find a hoisted react-native', () => {
    const appRoot = path.join(tempDir, 'packages', 'app', 'ios');
    fs.mkdirSync(appRoot, {recursive: true});
    writeRn(tempDir, '0.87.0');
    expect(resolveInstalledRnVersion(appRoot)).toBe('0.87.0');
  });

  it('returns null when react-native is not installed', () => {
    expect(resolveInstalledRnVersion(tempDir)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// remotePackageConfig
// ---------------------------------------------------------------------------

describe('remotePackageConfig', () => {
  const REMOTE_CONFIG_REL = 'build/generated/autolinking/spm-remote.json';
  let tempDir;
  let savedEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-utils-test-'));
    savedEnv = {
      url: process.env.RN_SPM_REMOTE_URL,
      version: process.env.RN_SPM_REMOTE_VERSION,
    };
    delete process.env.RN_SPM_REMOTE_URL;
    delete process.env.RN_SPM_REMOTE_VERSION;
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    if (savedEnv.url == null) {
      delete process.env.RN_SPM_REMOTE_URL;
    } else {
      process.env.RN_SPM_REMOTE_URL = savedEnv.url;
    }
    if (savedEnv.version == null) {
      delete process.env.RN_SPM_REMOTE_VERSION;
    } else {
      process.env.RN_SPM_REMOTE_VERSION = savedEnv.version;
    }
  });

  function writeRn(version /*: string */) {
    const rnDir = path.join(tempDir, 'node_modules', 'react-native');
    fs.mkdirSync(rnDir, {recursive: true});
    fs.writeFileSync(
      path.join(rnDir, 'package.json'),
      JSON.stringify({name: 'react-native', version}),
    );
  }

  function writePersisted(obj /*: Object */) {
    const cfgPath = path.join(tempDir, REMOTE_CONFIG_REL);
    fs.mkdirSync(path.dirname(cfgPath), {recursive: true});
    fs.writeFileSync(cfgPath, JSON.stringify(obj));
  }

  function readPersisted() /*: Object */ {
    return JSON.parse(
      fs.readFileSync(path.join(tempDir, REMOTE_CONFIG_REL), 'utf8'),
    );
  }

  it('returns null in local mode (no URL anywhere)', () => {
    expect(remotePackageConfig(tempDir)).toBeNull();
  });

  it('env override: activates remote mode and persists versionOverride', () => {
    process.env.RN_SPM_REMOTE_URL = 'file:///tmp/react-native-apple';
    process.env.RN_SPM_REMOTE_VERSION = '0.86.0';
    writeRn('0.86.3'); // present but ignored — override wins

    const result = remotePackageConfig(tempDir);
    expect(result).toEqual({
      url: 'file:///tmp/react-native-apple',
      version: '0.86.0',
      identity: 'react-native-apple',
    });
    expect(readPersisted()).toEqual({
      url: 'file:///tmp/react-native-apple',
      versionOverride: '0.86.0',
    });
  });

  it('env URL only: derives version from npm and persists NO version', () => {
    process.env.RN_SPM_REMOTE_URL = 'file:///tmp/react-native-apple';
    writeRn('0.86.3');

    const result = remotePackageConfig(tempDir);
    expect(result).toEqual({
      url: 'file:///tmp/react-native-apple',
      version: '0.86.3',
      identity: 'react-native-apple',
    });
    // Derived version is never frozen.
    expect(readPersisted()).toEqual({url: 'file:///tmp/react-native-apple'});
  });

  it('throws RemoteVersionError for a non-publishable derived version', () => {
    process.env.RN_SPM_REMOTE_URL = 'file:///tmp/react-native-apple';
    writeRn('1000.0.0');
    expect(() => remotePackageConfig(tempDir)).toThrow(RemoteVersionError);
  });

  it('throws RemoteVersionError when react-native is not installed', () => {
    process.env.RN_SPM_REMOTE_URL = 'file:///tmp/react-native-apple';
    expect(() => remotePackageConfig(tempDir)).toThrow(RemoteVersionError);
  });

  it('honors a persisted versionOverride with no env', () => {
    writePersisted({
      url: 'file:///tmp/react-native-apple',
      versionOverride: '0.86.0',
    });
    writeRn('1000.0.0'); // dev placeholder — override still wins, no throw

    expect(remotePackageConfig(tempDir)).toEqual({
      url: 'file:///tmp/react-native-apple',
      version: '0.86.0',
      identity: 'react-native-apple',
    });
  });

  it('reads a legacy persisted {url, version} as an override', () => {
    writePersisted({
      url: 'file:///tmp/react-native-apple',
      version: '0.85.1',
    });
    writeRn('1000.0.0');

    expect(remotePackageConfig(tempDir)).toEqual({
      url: 'file:///tmp/react-native-apple',
      version: '0.85.1',
      identity: 'react-native-apple',
    });
  });

  it('persisted URL only: derives from npm without an env (the sync lever)', () => {
    writePersisted({url: 'file:///tmp/react-native-apple'});
    writeRn('0.86.3');

    expect(remotePackageConfig(tempDir)).toEqual({
      url: 'file:///tmp/react-native-apple',
      version: '0.86.3',
      identity: 'react-native-apple',
    });
    // No env → no re-write of the persisted file.
    expect(readPersisted()).toEqual({url: 'file:///tmp/react-native-apple'});
  });
});

// ---------------------------------------------------------------------------
// runCodegenAndInstallTemplate
// ---------------------------------------------------------------------------

describe('runCodegenAndInstallTemplate', () => {
  let tempDir;
  let reactNativeRoot;
  let appRoot;
  let codegenPkgSwift;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-codegen-test-'));
    reactNativeRoot = path.join(tempDir, 'react-native');
    appRoot = path.join(tempDir, 'app');

    // Minimal fake codegen script (no-op) so the execSync call exits cleanly.
    fs.mkdirSync(path.join(reactNativeRoot, 'scripts'), {recursive: true});
    fs.writeFileSync(
      path.join(reactNativeRoot, 'scripts', 'generate-codegen-artifacts.js'),
      '// no-op codegen for tests\n',
    );
    // Codegen template that installSpmCodegenTemplate renders + writes.
    fs.mkdirSync(
      path.join(reactNativeRoot, 'scripts', 'codegen', 'templates'),
      {
        recursive: true,
      },
    );
    fs.writeFileSync(
      path.join(
        reactNativeRoot,
        'scripts',
        'codegen',
        'templates',
        'Package.swift.spm-template',
      ),
      '// template\n',
    );
    // build/generated/ios must exist for the template to be installed.
    fs.mkdirSync(path.join(appRoot, 'build', 'generated', 'ios'), {
      recursive: true,
    });
    codegenPkgSwift = path.join(
      appRoot,
      'build',
      'generated',
      'ios',
      'Package.swift',
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('installs the codegen template by default', () => {
    runCodegenAndInstallTemplate(appRoot, appRoot, reactNativeRoot);
    expect(fs.existsSync(codegenPkgSwift)).toBe(true);
  });

  it('skips the template install when installTemplate is false', () => {
    runCodegenAndInstallTemplate(appRoot, appRoot, reactNativeRoot, undefined, {
      installTemplate: false,
    });
    // The SPM sync re-points the xcframework symlinks and installs the template
    // itself afterwards, so this in-codegen install must be suppressed.
    expect(fs.existsSync(codegenPkgSwift)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildMergedHeaderTree
// ---------------------------------------------------------------------------
describe('per-app header farm (ReactAppHeaders SPM target)', () => {
  let tempDir;
  let appRoot;
  let perAppDir;

  function writeFile(p, contents) {
    fs.mkdirSync(path.dirname(p), {recursive: true});
    fs.writeFileSync(p, contents);
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-farm-test-'));
    appRoot = path.join(tempDir, 'app');
    perAppDir = path.join(
      appRoot,
      'build',
      'generated',
      'ios',
      'ReactAppHeaders',
    );
    // Autolinking header farm — a SYMLINK farm (leaf headers are symlinks to
    // the dep's real source). foldDir must follow symlinks, not skip them.
    const realProviderHeader = path.join(tempDir, 'src', 'Provider.h');
    writeFile(realProviderHeader, '#pragma once\n// provider\n');
    const farmHeader = path.join(
      appRoot,
      'build',
      'generated',
      'autolinking',
      'headers',
      'MyLib',
      'Provider.h',
    );
    fs.mkdirSync(path.dirname(farmHeader), {recursive: true});
    fs.symlinkSync(realProviderHeader, farmHeader);
    // Codegen output (folded both at generated/ios root and ReactCodegen/).
    writeFile(
      path.join(
        appRoot,
        'build',
        'generated',
        'ios',
        'ReactCodegen',
        'react',
        'renderer',
        'EventEmitters.h',
      ),
      '#pragma once\n// codegen\n',
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('folds codegen + autolinking headers and lives inside the codegen package', () => {
    const result = buildPerAppHeaderTree(appRoot);
    expect(result.path).toBe(perAppDir);
    expect(fs.existsSync(path.join(perAppDir, 'MyLib', 'Provider.h'))).toBe(
      true,
    );
    expect(
      fs.existsSync(
        path.join(perAppDir, 'react', 'renderer', 'EventEmitters.h'),
      ),
    ).toBe(true);
    // <ReactCodegen/...> include form resolves via the farm root.
    expect(
      fs.existsSync(
        path.join(
          perAppDir,
          'ReactCodegen',
          'react',
          'renderer',
          'EventEmitters.h',
        ),
      ),
    ).toBe(true);
  });

  it('carries the SPM stub source so the farm is a valid target', () => {
    buildPerAppHeaderTree(appRoot);
    expect(fs.existsSync(path.join(perAppDir, 'ReactAppHeadersStub.c'))).toBe(
      true,
    );
  });

  it('rebuilds cleanly on re-run without folding its previous self', () => {
    buildPerAppHeaderTree(appRoot);
    const second = buildPerAppHeaderTree(appRoot);
    // No nested ReactAppHeaders/ReactAppHeaders self-fold artifacts.
    expect(fs.existsSync(path.join(perAppDir, 'ReactAppHeaders'))).toBe(false);
    // ...and no ReactAppHeaders.tmp/ either: the temp build dir must NOT live
    // under a folded root (build/generated/ios), else foldDir walks the
    // half-built farm and creates a spurious `ReactAppHeaders.tmp/` namespace
    // duplicating every codegen header.
    expect(fs.existsSync(path.join(perAppDir, 'ReactAppHeaders.tmp'))).toBe(
      false,
    );
    expect(
      [...second.virtualPaths].some(p => p.includes('ReactAppHeaders.tmp')),
    ).toBe(false);
    // The out-of-tree temp is consumed (renamed into place), not left behind.
    expect(
      fs.existsSync(path.join(appRoot, 'build', '.react-app-headers.tmp')),
    ).toBe(false);
    expect(second.virtualPaths.has('MyLib/Provider.h')).toBe(true);
  });
});
