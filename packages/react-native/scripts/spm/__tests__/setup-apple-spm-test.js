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

// `pod` is faked so the CocoaPods conversion tests need no CocoaPods install,
// and the autolinking config command (spawnSync → npx) fails fast instead of
// reaching the network. A test that sets mockAutolinkingSourceDir lets the
// config command succeed instead, so `main` gets far enough to write
// build/generated/ — what "refuses before any change" has to rule out. git and
// everything else run for real.
const mockPodCalls = [];
let mockAutolinkingSourceDir = null;
jest.mock('node:child_process', () => {
  const actual = jest.requireActual('node:child_process');
  return {
    ...actual,
    execFileSync: (command, args, options) => {
      if (command === 'pod') {
        mockPodCalls.push(args);
        return '';
      }
      return actual.execFileSync(command, args, options);
    },
    spawnSync: () =>
      mockAutolinkingSourceDir == null
        ? {status: 1, stdout: '', stderr: 'stubbed in test'}
        : {
            status: 0,
            stdout: JSON.stringify({
              project: {ios: {sourceDir: mockAutolinkingSourceDir}},
              dependencies: {},
            }),
            stderr: '',
          },
  };
});

// A test that sets mockInjectorCalls to an array runs `add` to the end: the
// xcframeworks package (which needs real XCFramework slices) is skipped, and
// the injector (which needs that package's output) only records its options,
// then refuses with mockInjectorRefusal when a test sets one. A test that sets
// mockCleanupError makes the cleanup that follows a successful injection throw.
let mockInjectorCalls = null;
let mockInjectorRefusal = null;
let mockCleanupError = null;
jest.mock('../generate-spm-package', () => {
  const actual = jest.requireActual('../generate-spm-package');
  return {
    ...actual,
    main: argv => (mockInjectorCalls == null ? actual.main(argv) : undefined),
  };
});
jest.mock('../generate-spm-xcodeproj', () => {
  const actual = jest.requireActual('../generate-spm-xcodeproj');
  return {
    ...actual,
    injectSpmIntoExistingXcodeproj: opts => {
      if (mockInjectorCalls == null) {
        return actual.injectSpmIntoExistingXcodeproj(opts);
      }
      mockInjectorCalls.push(opts);
      return mockInjectorRefusal == null
        ? {status: 'injected', target: 'MyApp'}
        : {status: 'refused', reason: mockInjectorRefusal};
    },
    cleanupDanglingJavaScriptCoreRef: xcodeprojPath => {
      if (mockCleanupError != null) {
        throw new Error(mockCleanupError);
      }
      return actual.cleanupDanglingJavaScriptCoreRef(xcodeprojPath);
    },
  };
});

const {
  appendGitignoreSpmEntries,
  detectStandardRnLayoutRedirect,
  determineVersion,
  ensureBothArtifactFlavors,
  findInjectedXcodeproj,
  generateAutolinkingConfigOrFailClosed,
  main,
  missingGitignoreSpmEntries,
  parseArgs,
  podfilePodNames,
  resolveAction,
  resolveAppIosDeploymentTarget,
  resolveConfigCommandToPin,
  resolveCxxApiDefines,
  resolveExplicitConfigCommand,
  runDeintegrate,
} = require('../../setup-apple-spm');
const {REQUIRED_ARTIFACTS} = require('../download-spm-artifacts');
const {SPM_INJECTED_MARKER} = require('../generate-spm-xcodeproj');
const {twoAppTargets} = require('./pbxproj-variants');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');

// Create an in-place-injected xcodeproj fixture: a directory carrying the
// `.spm-injected.json` marker (what injectSpmIntoExistingXcodeproj writes).
function mkInjectedXcodeproj(appRoot, name, markerFields = {}) {
  const dir = path.join(appRoot, name);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(
    path.join(dir, SPM_INJECTED_MARKER),
    JSON.stringify({
      rootUuid: 'X',
      target: 'MyApp',
      injectedUuids: [],
      ...markerFields,
    }),
  );
  return dir;
}

// Create a (CocoaPods or plain) xcodeproj fixture with a minimal pbxproj.
function mkXcodeproj(appRoot, name, {cocoapods = false} = {}) {
  const dir = path.join(appRoot, name);
  fs.mkdirSync(dir, {recursive: true});
  const baseConfig = cocoapods
    ? 'baseConfigurationReference = ABC /* Pods-MyApp.debug.xcconfig */;\n'
    : '';
  fs.writeFileSync(
    path.join(dir, 'project.pbxproj'),
    `// !$*UTF8*$!\n{\n\tobjects = {\n${baseConfig}\t};\n}\n`,
  );
  return dir;
}

// A Debug or Release artifact slot that passes validation: every required
// XCFramework directory, listed in artifacts.json.
function writeCompleteArtifactSlot(root, flavor) {
  const slot = path.join(root, flavor);
  fs.mkdirSync(path.join(slot, 'hermes-headers', 'hermes'), {
    recursive: true,
  });
  const artifacts = {};
  for (const name of REQUIRED_ARTIFACTS) {
    const xcframeworkPath = path.join(slot, `${name}.xcframework`);
    fs.mkdirSync(xcframeworkPath, {recursive: true});
    artifacts[name] = {xcframeworkPath};
  }
  fs.writeFileSync(
    path.join(slot, 'artifacts.json'),
    JSON.stringify(artifacts),
  );
  return slot;
}

function gitInitAndCommit(dir) {
  const opts = {cwd: dir, stdio: 'ignore'};
  execFileSync('git', ['init'], opts);
  execFileSync('git', ['config', 'user.email', 'test@example.com'], opts);
  execFileSync('git', ['config', 'user.name', 'Test'], opts);
  execFileSync('git', ['add', '-A'], opts);
  execFileSync('git', ['commit', '-m', 'init'], opts);
}

describe('parseArgs', () => {
  it('parses --config-command as a JSON argv array', () => {
    const args = parseArgs([
      'update',
      '--config-command',
      '["a","b","config"]',
    ]);

    expect(args.action).toBe('update');
    expect(args.configCommand).toEqual(['a', 'b', 'config']);
  });

  it('sets configCommand to null when --config-command is omitted', () => {
    expect(parseArgs(['update']).configCommand).toBeNull();
  });

  it('throws for an invalid --config-command value', () => {
    expect(() => parseArgs(['update', '--config-command', 'not json'])).toThrow(
      /--config-command/,
    );
  });
});

// ---------------------------------------------------------------------------
// generateAutolinkingConfigOrFailClosed — the fail-closed policy main() applies
// to the autolinking config step. Swallowing a config-command error (the old
// behavior) let the build proceed with a silently-empty Autolinked package that
// only surfaced later as `unable to resolve module dependency`. A native-
// module-free app does NOT hit the error path: its command exits 0 with valid
// empty-dependency JSON and the generator returns normally.
// ---------------------------------------------------------------------------

describe('generateAutolinkingConfigOrFailClosed', () => {
  let prevExitCode;
  let warnSpy;

  beforeEach(() => {
    prevExitCode = process.exitCode;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = prevExitCode;
    jest.restoreAllMocks();
  });

  it('returns the config result and leaves the exit code untouched on success', () => {
    const result = {
      config: {},
      outputPath: '/app/ios/autolinking.json',
      rawJson: '{}',
    };
    const out = generateAutolinkingConfigOrFailClosed({
      projectRoot: '/app',
      generate: () => result,
    });

    expect(out).toBe(result);
    expect(process.exitCode).not.toBe(2);
  });

  it('passes projectRoot and configCommand through to the generator', () => {
    let received;
    generateAutolinkingConfigOrFailClosed({
      projectRoot: '/proj',
      configCommand: ['my-cli', 'config'],
      generate: opts => {
        received = opts;
        return {config: {}, outputPath: '', rawJson: ''};
      },
    });

    expect(received).toEqual({
      projectRoot: '/proj',
      configCommand: ['my-cli', 'config'],
    });
  });

  it('fails closed (null, exit 2, actionable error) when the config command errors', () => {
    const out = generateAutolinkingConfigOrFailClosed({
      projectRoot: '/app',
      generate: () => {
        throw new Error("'my-cli config' exited with status 1");
      },
    });

    expect(out).toBeNull();
    expect(process.exitCode).toBe(2);
    const warnings = warnSpy.mock.calls.map(c => c.join(' ')).join('\n');
    // Names the override so the next person can fix it...
    expect(warnings).toMatch(/RCT_SPM_AUTOLINKING_CONFIG_COMMAND/);
    // ...and preserves the underlying cause.
    expect(warnings).toMatch(/exited with status 1/);
  });
});

// ---------------------------------------------------------------------------
// resolveExplicitConfigCommand — the autolinking config command every action
// (add/update/sync/scaffold) runs with: `--config-command` →
// RCT_SPM_AUTOLINKING_CONFIG_COMMAND → the value pinned in `.spm-injected.json`
// → the built-in default. undefined means "let generateAutolinkingConfig pick
// the env var or the default".
// ---------------------------------------------------------------------------

describe('resolveCxxApiDefines', () => {
  const ENV_VARS = ['RN_STRICT_API', 'RN_ALLOW_FRAMEWORKS'];
  let tempDir;
  let prevEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-cxx-api-'));
    prevEnv = ENV_VARS.map(name => process.env[name]);
    ENV_VARS.forEach(name => delete process.env[name]);
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    ENV_VARS.forEach((name, i) => {
      if (prevEnv[i] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = prevEnv[i];
      }
    });
  });

  it('defines, on add/update, each opt-in whose env var is 1, whatever was recorded', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cxxApiDefines: ['RN_STRICT_API', 'RN_ALLOW_FRAMEWORKS'],
    });
    process.env.RN_STRICT_API = '1';
    process.env.RN_ALLOW_FRAMEWORKS = 'true';
    expect(resolveCxxApiDefines('add', tempDir)).toEqual(['RN_STRICT_API']);
    delete process.env.RN_STRICT_API;
    process.env.RN_ALLOW_FRAMEWORKS = '1';
    expect(resolveCxxApiDefines('update', tempDir)).toEqual([
      'RN_ALLOW_FRAMEWORKS',
    ]);
  });

  it('reuses the recorded macros on sync/codegen, which Xcode runs without the shell env', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cxxApiDefines: ['RN_ALLOW_FRAMEWORKS', 'NOT_A_CXX_API_MACRO'],
    });
    process.env.RN_STRICT_API = '1';
    expect(resolveCxxApiDefines('sync', tempDir)).toEqual([
      'RN_ALLOW_FRAMEWORKS',
    ]);
    expect(resolveCxxApiDefines('codegen', tempDir)).toEqual([
      'RN_ALLOW_FRAMEWORKS',
    ]);
  });

  it('defines nothing on sync before anything is injected', () => {
    expect(resolveCxxApiDefines('sync', tempDir)).toEqual([]);
  });
});

describe('resolveExplicitConfigCommand', () => {
  const ENV = 'RCT_SPM_AUTOLINKING_CONFIG_COMMAND';
  const PINNED = ['npx', 'expo-modules-autolinking', 'react-native-config'];
  let tempDir;
  let prevEnv;
  let logSpy;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-config-command-'));
    prevEnv = process.env[ENV];
    delete process.env[ENV];
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    if (prevEnv === undefined) {
      delete process.env[ENV];
    } else {
      process.env[ENV] = prevEnv;
    }
    jest.restoreAllMocks();
  });

  function pin(configCommand) {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj', {configCommand});
  }

  it('prefers an explicit --config-command over the env var and the pin', () => {
    process.env[ENV] = '["from-env","config"]';
    pin(PINNED);
    expect(
      resolveExplicitConfigCommand(
        {configCommand: ['flag', 'config']},
        tempDir,
      ),
    ).toEqual(['flag', 'config']);
  });

  it('lets the env var win over the pin (a stale pin must not shadow it)', () => {
    process.env[ENV] = '["from-env","config"]';
    pin(PINNED);
    expect(resolveExplicitConfigCommand({configCommand: null}, tempDir)).toBe(
      undefined,
    );
  });

  it('uses the pin when neither the flag nor the env var is set', () => {
    pin(PINNED);
    expect(
      resolveExplicitConfigCommand({configCommand: null}, tempDir),
    ).toEqual(PINNED);
    // Names the source, so a stale pin is diagnosable from the build log.
    expect(logSpy.mock.calls.map(c => c.join(' ')).join('\n')).toMatch(
      /\.spm-injected\.json/,
    );
  });

  it('ignores a blank env var and falls through to the pin', () => {
    process.env[ENV] = '   ';
    pin(PINNED);
    expect(
      resolveExplicitConfigCommand({configCommand: null}, tempDir),
    ).toEqual(PINNED);
  });

  it('falls back to the default (undefined) with no flag, env var or pin', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveExplicitConfigCommand({configCommand: null}, tempDir)).toBe(
      undefined,
    );
  });

  it('falls back to the default when the pinned value is malformed', () => {
    pin('npx expo-modules-autolinking');
    expect(resolveExplicitConfigCommand({configCommand: null}, tempDir)).toBe(
      undefined,
    );
  });

  it('falls back to the default when no project is injected yet', () => {
    expect(resolveExplicitConfigCommand({configCommand: null}, tempDir)).toBe(
      undefined,
    );
  });
});

// ---------------------------------------------------------------------------
// resolveConfigCommandToPin — what `add`/`update` records in the injection
// marker: the explicit `--config-command`, else the env override, since the
// Xcode build phase inherits neither. null pins nothing (and preserves any
// earlier pin).
// ---------------------------------------------------------------------------

describe('resolveConfigCommandToPin', () => {
  const ENV = 'RCT_SPM_AUTOLINKING_CONFIG_COMMAND';
  const FROM_ENV = ['npx', 'expo-modules-autolinking', 'react-native-config'];
  let tempDir;
  let prevEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-config-command-pin-'));
    prevEnv = process.env[ENV];
    delete process.env[ENV];
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    if (prevEnv === undefined) {
      delete process.env[ENV];
    } else {
      process.env[ENV] = prevEnv;
    }
    jest.restoreAllMocks();
  });

  it('pins the env-derived command when only the env var is set', () => {
    process.env[ENV] = JSON.stringify(FROM_ENV);
    expect(resolveConfigCommandToPin({configCommand: null})).toEqual(FROM_ENV);
  });

  it('pins the explicit --config-command over the env var', () => {
    process.env[ENV] = JSON.stringify(FROM_ENV);
    expect(
      resolveConfigCommandToPin({configCommand: ['flag', 'config']}),
    ).toEqual(['flag', 'config']);
  });

  it('pins nothing when the env var is blank', () => {
    process.env[ENV] = '  \t ';
    expect(resolveConfigCommandToPin({configCommand: null})).toBeNull();
  });

  it('pins nothing when neither the flag nor the env var is set', () => {
    expect(resolveConfigCommandToPin({configCommand: null})).toBeNull();
  });

  it('fails loud rather than pinning garbage from an invalid env var', () => {
    process.env[ENV] = 'npx expo-modules-autolinking';
    expect(() => resolveConfigCommandToPin({configCommand: null})).toThrow(
      /RCT_SPM_AUTOLINKING_CONFIG_COMMAND/,
    );
  });

  it('is resolved back by a later run with neither flag nor env var', () => {
    process.env[ENV] = JSON.stringify(FROM_ENV);
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj', {
      configCommand: resolveConfigCommandToPin({configCommand: null}),
    });
    delete process.env[ENV];

    expect(
      resolveExplicitConfigCommand({configCommand: null}, tempDir),
    ).toEqual(FROM_ENV);
  });
});

// ---------------------------------------------------------------------------
// resolveAction — zero-arg default. Explicit action wins; otherwise `update`
// when an injection marker exists, else `add` (first run).
// ---------------------------------------------------------------------------

describe('resolveAction', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-resolve-action-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns the requested action verbatim when one is given', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveAction('add', tempDir)).toBe('add');
    expect(resolveAction('update', tempDir)).toBe('update');
    expect(resolveAction('deinit', tempDir)).toBe('deinit');
    expect(resolveAction('scaffold', tempDir)).toBe('scaffold');
  });

  it('defaults to `add` on first run (no injection marker)', () => {
    expect(resolveAction(null, tempDir)).toBe('add');
  });

  it('defaults to `add` even when a (non-injected) xcodeproj exists', () => {
    mkXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveAction(null, tempDir)).toBe('add');
  });

  it('defaults to `update` once an injection marker is present', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveAction(null, tempDir)).toBe('update');
  });
});

// ---------------------------------------------------------------------------
// findInjectedXcodeproj — locates the `.xcodeproj` carrying the injection marker
// ---------------------------------------------------------------------------

describe('findInjectedXcodeproj', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-find-injected-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns the injected project path when a marker is present', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(findInjectedXcodeproj(tempDir)).toBe(
      path.join(tempDir, 'MyApp.xcodeproj'),
    );
  });

  it('returns null when no injected project exists', () => {
    mkXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(findInjectedXcodeproj(tempDir)).toBeNull();
  });
});

describe('dual-flavor artifact input', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-dual-artifacts-'));
  });

  afterEach(() => fs.rmSync(root, {recursive: true, force: true}));

  function writeCompleteSlot(flavor) {
    return writeCompleteArtifactSlot(root, flavor);
  }

  function args() {
    return {
      version: null,
      artifacts: root,
      downloadPolicy: 'skip',
    };
  }

  it('requires and returns complete Debug and Release slots', async () => {
    const debug = writeCompleteSlot('debug');
    const release = writeCompleteSlot('release');
    await expect(ensureBothArtifactFlavors(args(), '0.85.0')).resolves.toEqual({
      debug,
      release,
    });
  });

  it('fails if either flavor is incomplete', async () => {
    writeCompleteSlot('debug');
    await expect(ensureBothArtifactFlavors(args(), '0.85.0')).rejects.toThrow(
      /complete release slot/,
    );
  });

  it('rejects a single XCFramework as local artifact input', async () => {
    const single = path.join(root, 'React.xcframework');
    fs.mkdirSync(single);
    await expect(
      ensureBothArtifactFlavors({...args(), artifacts: single}, '0.85.0'),
    ).rejects.toThrow(/single XCFramework cannot satisfy automatic switching/);
  });
});

// ---------------------------------------------------------------------------
// detectStandardRnLayoutRedirect — auto-redirect into ios/ when run from the JS
// root of a standard RN app.
// ---------------------------------------------------------------------------

describe('detectStandardRnLayoutRedirect', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-redirect-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns the ios/ subdir when cwd === projectRoot AND ios/ exists', () => {
    fs.mkdirSync(path.join(tempDir, 'ios'));
    expect(detectStandardRnLayoutRedirect(tempDir, tempDir)).toBe(
      path.join(tempDir, 'ios'),
    );
  });

  it('returns null when running from a subdirectory (already cd-ed)', () => {
    fs.mkdirSync(path.join(tempDir, 'ios'));
    expect(
      detectStandardRnLayoutRedirect(path.join(tempDir, 'ios'), tempDir),
    ).toBeNull();
  });

  it('returns null for flat layouts (no ios/ subdir, e.g. rn-tester)', () => {
    expect(detectStandardRnLayoutRedirect(tempDir, tempDir)).toBeNull();
  });

  it('returns null when `ios` is a file, not a directory', () => {
    fs.writeFileSync(path.join(tempDir, 'ios'), '');
    expect(detectStandardRnLayoutRedirect(tempDir, tempDir)).toBeNull();
  });
});

describe('podfilePodNames', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-pod-names-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  function namesIn(lines) {
    fs.writeFileSync(path.join(tempDir, 'Podfile'), lines.join('\n'));
    return podfilePodNames(tempDir);
  }

  it('lists each declared pod once, in declaration order', () => {
    expect(
      namesIn([
        "target 'MyApp' do",
        '  use_react_native!',
        "  pod 'A'",
        "  pod('B', :path => 'x')",
        '  target \'MyAppTests\' do; pod "C"; end',
        "  pod 'A', :path => 'y'",
        'end',
      ]),
    ).toEqual(['A', 'B', 'C']);
  });

  it.each([
    ["  pod 'MBProgressHUD'", 'MBProgressHUD'],
    ['  pod "MBProgressHUD"', 'MBProgressHUD'],
    ["  pod('Firebase/Analytics')", 'Firebase/Analytics'],
    ['  pod ("Firebase/Analytics")', 'Firebase/Analytics'],
    ["  pod( 'Firebase/Analytics', '~> 10.0')", 'Firebase/Analytics'],
    ["target 'App' do; pod('Foo'); end", 'Foo'],
    ["  use_frameworks!; pod 'Foo'", 'Foo'],
  ])('finds the pod in %s', (line, name) => {
    expect(namesIn([line])).toEqual([name]);
  });

  it('ignores commented-out pods and pod-like words', () => {
    expect(
      namesIn([
        "# pod 'Commented'",
        "  use_frameworks! # pod 'Trailing'",
        "  use_frameworks!; # pod 'AfterSemicolon'",
        "  podspec :path => '../MyLib.podspec'",
        "  use_frameworks!; podspec :path => '../MyLib.podspec'",
        "  pods_root = 'Pods'",
        "  pod_targets = ['MyApp']",
      ]),
    ).toEqual([]);
  });

  it('reads a pod statement that continues on the next lines', () => {
    expect(
      namesIn([
        "  pod 'React-Core',",
        "    :path => '../node_modules/react-native/'",
        "  pod 'React-RCTText', # text",
        '    :modular_headers => true,',
        "    :path => '../node_modules/react-native/Libraries/Text'",
        "  pod 'RNSVG',",
        "    :path => '../node_modules/react-native-svg'",
        "  pod 'OCMock', '~> 3.9.1'",
      ]),
    ).toEqual(['RNSVG', 'OCMock']);
  });

  it('reads past blank and comment lines inside a continued pod statement', () => {
    expect(
      namesIn([
        "  pod 'React-Core',",
        '    # comment',
        "    :path => '../node_modules/react-native/'",
        "  pod 'React-RCTText',",
        '',
        "    :path => '../node_modules/react-native/Libraries/Text'",
        "  pod 'OCMock', '~> 3.9.1'",
      ]),
    ).toEqual(['OCMock']);
  });

  it('keeps pods whose names use Ruby interpolation', () => {
    expect(
      namesIn([
        '  pod "#{prefix}Core"',
        '  pod "Foo#{suffix}", :path => \'x\' # comment',
      ]),
    ).toEqual(['#{prefix}Core', 'Foo#{suffix}']);
  });

  it('leaves out pods that come from the react-native package', () => {
    expect(
      namesIn([
        "  pod 'React-Core', :path => '../node_modules/react-native/'",
        "  pod 'React', :path => '../node_modules/react-native'",
        '  pod "React-RCTText", :path => "../../node_modules/react-native/Libraries/Text"',
        "  pod 'glog', :podspec => '../node_modules/react-native/third-party-podspecs/glog.podspec'",
        "  pod('RCT-Folly', podspec: '../node_modules/react-native/third-party-podspecs/RCT-Folly.podspec')",
        "  pod 'RNSVG', :path => '../node_modules/react-native-svg'",
        "  pod 'Local', :path => '../native/react-native/Local'",
      ]),
    ).toEqual(['RNSVG', 'Local']);
  });

  it('is empty without a Podfile', () => {
    expect(podfilePodNames(tempDir)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// CocoaPods conversion keeps the Podfile: `--deintegrate` only runs
// `pod deintegrate`, and `deinit` + `pod install` go back to CocoaPods.
// ---------------------------------------------------------------------------

describe('CocoaPods conversion', () => {
  // Same shape as private/helloworld/ios/Podfile: a multi-line
  // use_react_native! call and a post_install hook, which line-based
  // stripping would leave as invalid Ruby.
  const STOCK_PODFILE = [
    'require_relative "../node_modules/react-native/scripts/react_native_pods"',
    '',
    'platform :ios, min_ios_version_supported',
    'prepare_react_native_project!',
    '',
    "target 'MyApp' do",
    '  config = use_native_modules!',
    '',
    '  use_react_native!(',
    '    :path => config[:reactNativePath],',
    '    :app_path => "#{Pod::Config.instance.installation_root}/.."',
    '  )',
    '',
    '  post_install do |installer|',
    '    react_native_post_install(',
    '      installer,',
    '      config[:reactNativePath],',
    '      :mac_catalyst_enabled => false',
    '    )',
    '  end',
    'end',
    '',
  ].join('\n');
  // Shaped like packages/rn-tester/Podfile: a React Native pod by path, local
  // example pods, then a test pod in a nested target.
  const PODFILE_WITH_THIRD_PARTY_PODS = STOCK_PODFILE.replace(
    '  config = use_native_modules!\n',
    [
      '  config = use_native_modules!',
      "  pod 'React-Core', :path => '../node_modules/react-native/'",
      "  pod 'ScreenshotManager', :path => 'NativeModuleExample'",
      "  pod 'MyNativeView', :path => 'NativeComponentExample'",
      "  target 'MyAppTests' do",
      "    pod 'OCMock', '~> 3.9.1'",
      '  end',
      '',
    ].join('\n'),
  );
  const POD_INSTALL_LINE = 'To go back to CocoaPods, run `pod install`.';

  let appRoot;
  let podfilePath;
  let backupPath;
  let logSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-cocoapods-'));
    podfilePath = path.join(appRoot, 'Podfile');
    backupPath = path.join(appRoot, 'Podfile.bak');
    mockPodCalls.length = 0;
    jest.spyOn(process, 'cwd').mockReturnValue(appRoot);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.exitCode = undefined;
    mockAutolinkingSourceDir = null;
    mockInjectorCalls = null;
    mockInjectorRefusal = null;
    mockCleanupError = null;
    fs.rmSync(appRoot, {recursive: true, force: true});
  });

  // `spm add` that runs to the end offline: a successful config command,
  // complete local artifact slots, and a recording injector.
  function runAdd(...flags) {
    const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-artifacts-'));
    writeCompleteArtifactSlot(artifacts, 'debug');
    writeCompleteArtifactSlot(artifacts, 'release');
    mockAutolinkingSourceDir = appRoot;
    mockInjectorCalls = [];
    return main([
      'add',
      ...flags,
      '--skip-codegen',
      '--version',
      '0.85.0',
      '--download',
      'skip',
      '--artifacts',
      artifacts,
    ]).finally(() => fs.rmSync(artifacts, {recursive: true, force: true}));
  }

  function expectCocoaPodsAdvice() {
    expect(errors()).toContain('CocoaPods-integrated');
    expect(errors()).toContain('`npx react-native spm add --deintegrate`');
    expect(errors()).toMatch(/keeps the Podfile/);
    expect(errors()).toMatch(/`npx react-native spm deinit`[^]*`pod install`/);
    expect(errors()).toMatch(/other than React Native[^]*SwiftPM provides/);
    expect(errors()).not.toContain('Podfile.bak');
    expect(errors()).not.toContain('https://');
  }

  function expectNoPipelineOutput(xcodeproj) {
    expect(mockPodCalls).not.toContainEqual(['deintegrate']);
    expect(fs.existsSync(path.join(appRoot, '.gitignore'))).toBe(false);
    expect(fs.existsSync(path.join(appRoot, 'build'))).toBe(false);
    expect(fs.existsSync(path.join(xcodeproj, SPM_INJECTED_MARKER))).toBe(
      false,
    );
  }

  function output(spy) {
    return spy.mock.calls.map(call => call.join(' ')).join('\n');
  }

  function errors() {
    return output(warnSpy) + '\n' + output(errorSpy);
  }

  function mkInjectedProject(markerFields = {}) {
    const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj');
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj', markerFields);
    return xcodeproj;
  }

  describe('add --deintegrate', () => {
    it('runs `pod deintegrate` and leaves the Podfile byte-identical, with no Podfile.bak', () => {
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      runDeintegrate(appRoot);

      expect(mockPodCalls).toContainEqual(['deintegrate']);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.existsSync(backupPath)).toBe(false);
    });

    it('converts anyway and warns about the pods that are not part of React Native', async () => {
      mkXcodeproj(appRoot, 'MyApp.xcodeproj', {cocoapods: true});
      fs.writeFileSync(podfilePath, PODFILE_WITH_THIRD_PARTY_PODS);

      await runAdd('--deintegrate');

      const warning = output(logSpy)
        .split('\n')
        .find(line => line.includes('ScreenshotManager'));
      expect(warning).toContain('ScreenshotManager, MyNativeView, OCMock.');
      expect(warning).not.toContain('React-Core');
      expect(warning).toMatch(/not installed while the app uses SwiftPM/);
      expect(warning).toMatch(/Podfile is kept/);
      expect(warning).toMatch(/`npx react-native spm deinit`[^]*`pod install`/);
      expect(warning).not.toContain('Podfile.bak');
      expect(errors()).not.toContain('ScreenshotManager');
      expect(mockPodCalls).toContainEqual(['deintegrate']);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(
        PODFILE_WITH_THIRD_PARTY_PODS,
      );
      expect(fs.existsSync(backupPath)).toBe(false);
      expect(fs.existsSync(path.join(appRoot, 'build'))).toBe(true);
    });

    // Shows that expectNoPipelineOutput can fail: this run gets past every
    // refusal and writes what the refusal tests rule out.
    it('runs the pipeline when nothing refuses the conversion', async () => {
      mkXcodeproj(appRoot, 'MyApp.xcodeproj');
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      await runAdd('--deintegrate');

      expect(process.exitCode).toBeUndefined();
      expect(mockPodCalls).toContainEqual(['deintegrate']);
      expect(fs.existsSync(path.join(appRoot, 'build'))).toBe(true);
      expect(fs.existsSync(path.join(appRoot, '.gitignore'))).toBe(true);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
    });

    it('says when --deintegrate applies if the project is still CocoaPods-integrated after it', async () => {
      // The faked `pod deintegrate` leaves the pbxproj integrated.
      mkXcodeproj(appRoot, 'MyApp.xcodeproj', {cocoapods: true});
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      await runAdd('--deintegrate');

      expect(process.exitCode).toBe(1);
      expectCocoaPodsAdvice();
    });

    describe('on a project with uncommitted changes', () => {
      let isTTY;
      let question;

      beforeEach(() => {
        isTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
        Object.defineProperty(process.stdin, 'isTTY', {
          value: true,
          configurable: true,
        });
        question = jest.fn((_, answer) => answer('n'));
        jest
          .spyOn(readline, 'createInterface')
          .mockReturnValue({question, close: () => {}});
      });

      afterEach(() => {
        if (isTTY == null) {
          delete process.stdin.isTTY;
        } else {
          Object.defineProperty(process.stdin, 'isTTY', isTTY);
        }
      });

      it('asks before `pod deintegrate`, and "no" changes nothing', async () => {
        const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj', {
          cocoapods: true,
        });
        fs.writeFileSync(podfilePath, STOCK_PODFILE);
        gitInitAndCommit(appRoot);
        const pbxprojPath = path.join(xcodeproj, 'project.pbxproj');
        fs.appendFileSync(pbxprojPath, '// local edit\n');
        const pbxprojBefore = fs.readFileSync(pbxprojPath, 'utf8');

        await runAdd('--deintegrate');

        expect(question).toHaveBeenCalledTimes(1);
        expect(process.exitCode).toBe(1);
        expect(output(logSpy)).toContain('Aborted');
        expect(mockPodCalls).not.toContainEqual(['deintegrate']);
        expect(mockInjectorCalls).toEqual([]);
        expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
        expect(fs.readFileSync(pbxprojPath, 'utf8')).toBe(pbxprojBefore);
        expect(fs.existsSync(path.join(appRoot, '.gitignore'))).toBe(false);
      });
    });
  });

  it('says when --deintegrate applies on an explicit `spm add` of a CocoaPods project', async () => {
    const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(podfilePath, PODFILE_WITH_THIRD_PARTY_PODS);

    await runAdd();

    expect(process.exitCode).toBe(1);
    expectCocoaPodsAdvice();
    expectNoPipelineOutput(xcodeproj);
  });

  it('does not convert a fresh CocoaPods app on a plain `spm`, and changes nothing', async () => {
    const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(podfilePath, STOCK_PODFILE);
    gitInitAndCommit(appRoot);
    mockAutolinkingSourceDir = appRoot;

    await main([]);

    expect(process.exitCode).toBe(1);
    expectCocoaPodsAdvice();
    expectNoPipelineOutput(xcodeproj);
    expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
  });

  describe('deinit', () => {
    it('leaves the Podfile byte-identical and says to run `pod install`', async () => {
      mkInjectedProject();
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      await main(['deinit']);

      expect(process.exitCode).toBeUndefined();
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.existsSync(backupPath)).toBe(false);
      expect(output(logSpy)).toContain(POD_INSTALL_LINE);
    });

    it('does not mention `pod install` without a Podfile', async () => {
      mkInjectedProject();

      await main(['deinit']);

      expect(output(logSpy)).not.toContain('pod install');
      expect(fs.existsSync(podfilePath)).toBe(false);
    });

    it('says there is nothing to remove when there is nothing to do', async () => {
      await main(['deinit']);

      expect(output(logSpy)).toContain(
        'No SPM injection found — nothing to remove.',
      );
    });

    it('does not mention `pod install` when it removed nothing', async () => {
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      await main(['deinit']);

      expect(output(logSpy)).not.toContain('pod install');
    });

    it('says where to run `pod install` when run from the JS root', async () => {
      const iosDir = path.join(appRoot, 'ios');
      fs.mkdirSync(iosDir);
      fs.writeFileSync(path.join(appRoot, 'package.json'), '{}');
      mkXcodeproj(iosDir, 'MyApp.xcodeproj');
      mkInjectedXcodeproj(iosDir, 'MyApp.xcodeproj');
      fs.writeFileSync(path.join(iosDir, 'Podfile'), STOCK_PODFILE);

      await main(['deinit']);

      expect(output(logSpy)).toContain(
        'To go back to CocoaPods, run `cd ios && pod install`.',
      );
    });

    it('still says to run `pod install` when removing an empty directory fails', async () => {
      mkInjectedProject();
      fs.mkdirSync(path.join(appRoot, 'ReactNativeSPM', 'Scripts'), {
        recursive: true,
      });
      fs.writeFileSync(podfilePath, STOCK_PODFILE);
      jest.spyOn(fs, 'rmdirSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      await main(['deinit']);

      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(output(logSpy)).toContain(POD_INSTALL_LINE);
      expect(errors()).toContain('EACCES');
    });
  });

  describe('deinit undoes exactly the .gitignore lines add recorded', () => {
    const HEADER = '# SPM – auto-generated at build time (do not commit)';
    const ENTRIES = [
      'Package.resolved',
      'build/generated/',
      'build/xcframeworks/',
      '.build/',
    ];
    let gitignorePath;

    beforeEach(() => {
      gitignorePath = path.join(appRoot, '.gitignore');
    });

    // What a first `add` does to .gitignore, with its record in the marker.
    function add() {
      const appended = missingGitignoreSpmEntries(appRoot);
      if (appended != null) {
        appendGitignoreSpmEntries(appRoot, appended);
      }
      mkInjectedProject(appended != null ? {gitignore: appended} : {});
      return appended;
    }

    // Only deinit's output counts as a note; add's own log line does not.
    async function deinit() {
      jest.clearAllMocks();
      await main(['deinit']);
    }

    function readGitignore() {
      return fs.readFileSync(gitignorePath, 'utf8');
    }

    function gitignoreNotes() {
      return [output(logSpy), errors()]
        .join('\n')
        .split('\n')
        .filter(line => line.includes('.gitignore'));
    }

    it('records the lines it appended, and none the file already had', () => {
      fs.writeFileSync(gitignorePath, 'node_modules/\nPackage.resolved\n');

      expect(add()).toEqual({
        created: false,
        lines: [HEADER, 'build/generated/', 'build/xcframeworks/', '.build/'],
      });
    });

    it('records that it created the file', () => {
      expect(add()).toEqual({created: true, lines: [HEADER, ...ENTRIES]});
    });

    it('appends nothing on a later run', () => {
      add();

      expect(missingGitignoreSpmEntries(appRoot)).toBeNull();
    });

    it('deletes a .gitignore that add created and nobody changed', async () => {
      add();

      await deinit();

      expect(fs.existsSync(gitignorePath)).toBe(false);
    });

    it('removes only the lines add appended to an existing .gitignore', async () => {
      const userContent = 'node_modules/\n*.log\n';
      fs.writeFileSync(gitignorePath, userContent);
      add();

      await deinit();

      expect(readGitignore()).toBe(userContent);
    });

    it('keeps the entries the user already had', async () => {
      const userContent = 'node_modules/\nPackage.resolved\n';
      fs.writeFileSync(gitignorePath, userContent);
      add();
      expect(readGitignore()).not.toBe(userContent);

      await deinit();

      expect(readGitignore()).toBe(userContent);
    });

    it('leaves a .gitignore that already had every entry untouched', async () => {
      const userContent = ['node_modules/', HEADER, ...ENTRIES, ''].join('\n');
      fs.writeFileSync(gitignorePath, userContent);
      add();

      await deinit();

      expect(readGitignore()).toBe(userContent);
      expect(gitignoreNotes()).toEqual([]);
    });

    it('keeps an empty .gitignore the user had', async () => {
      fs.writeFileSync(gitignorePath, '');
      add();

      await deinit();

      expect(readGitignore()).toBe('');
    });

    it('keeps lines the user added to a .gitignore add created, and says so in one line', async () => {
      add();
      fs.appendFileSync(gitignorePath, '\n# mine\nsecrets/\n');

      await deinit();

      expect(readGitignore()).toBe('\n# mine\nsecrets/\n');
      expect(gitignoreNotes()).toHaveLength(1);
    });

    it('keeps a recorded line the user edited, and says so in one line', async () => {
      add();
      fs.writeFileSync(
        gitignorePath,
        readGitignore().replace('build/generated/\n', 'build/generated/**\n'),
      );

      await deinit();

      expect(readGitignore()).toBe('build/generated/**\n');
      expect(gitignoreNotes()).toHaveLength(1);
      expect(process.exitCode).toBeUndefined();
    });

    it('leaves .gitignore alone when the marker has no record (an older add)', async () => {
      appendGitignoreSpmEntries(appRoot, missingGitignoreSpmEntries(appRoot));
      mkInjectedProject();
      const before = readGitignore();

      await deinit();

      expect(readGitignore()).toBe(before);
      expect(gitignoreNotes()).toEqual([]);
    });

    it('leaves .gitignore alone when there is no marker', async () => {
      const userContent = ['node_modules/', '', HEADER, ...ENTRIES, ''].join(
        '\n',
      );
      fs.writeFileSync(gitignorePath, userContent);

      await deinit();

      expect(readGitignore()).toBe(userContent);
    });

    it('also removes an entry that a later add appended', async () => {
      const userContent = 'node_modules/\n';
      const olderLines = [HEADER, ...ENTRIES.slice(0, 3)];
      fs.writeFileSync(
        gitignorePath,
        userContent + ['', ...olderLines, ''].join('\n'),
      );
      const appended = missingGitignoreSpmEntries(appRoot);
      expect(appended).toEqual({created: false, lines: [HEADER, '.build/']});
      appendGitignoreSpmEntries(appRoot, appended);
      // The record as the injector merges it (remove-spm-injection-test.js).
      mkInjectedProject({
        gitignore: {created: false, lines: [...olderLines, ...appended.lines]},
      });

      await deinit();

      expect(readGitignore()).toBe(userContent);
    });

    it('still says to run `pod install` when the .gitignore cleanup fails', async () => {
      add();
      fs.writeFileSync(podfilePath, STOCK_PODFILE);
      const readFileSync = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...rest) => {
        if (file === gitignorePath) {
          throw new Error('EIO: i/o error');
        }
        return readFileSync(file, ...rest);
      });

      await deinit();

      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(output(logSpy)).toContain(POD_INSTALL_LINE);
      expect(gitignoreNotes().join('\n')).toContain('EIO');
    });

    describe('add hands the injector the lines it appends', () => {
      it('writes and hands over a .gitignore that add created', async () => {
        mkXcodeproj(appRoot, 'MyApp.xcodeproj');

        await runAdd();

        expect(process.exitCode).toBeUndefined();
        expect(mockInjectorCalls).toHaveLength(1);
        expect(mockInjectorCalls[0].gitignoreAppended).toEqual({
          created: true,
          lines: [HEADER, ...ENTRIES],
        });
        expect(readGitignore()).toBe(['', HEADER, ...ENTRIES, ''].join('\n'));
      });

      it('hands over only the lines this run appends', async () => {
        const olderLines = [HEADER, ...ENTRIES.slice(0, 3)];
        fs.writeFileSync(gitignorePath, ['', ...olderLines, ''].join('\n'));
        mkInjectedProject({gitignore: {created: true, lines: olderLines}});

        await runAdd();

        expect(mockInjectorCalls[0].gitignoreAppended).toEqual({
          created: false,
          lines: [HEADER, '.build/'],
        });
      });

      it('writes no .gitignore when the injection fails', async () => {
        mkXcodeproj(appRoot, 'MyApp.xcodeproj');
        mockInjectorRefusal = 'no app target';

        await runAdd();

        expect(process.exitCode).toBe(1);
        expect(mockInjectorCalls).toHaveLength(1);
        expect(fs.existsSync(gitignorePath)).toBe(false);
      });

      it('writes the lines the marker records even when a later step fails', async () => {
        mkXcodeproj(appRoot, 'MyApp.xcodeproj');
        mockCleanupError = 'EACCES: permission denied';

        await runAdd();

        expect(process.exitCode).toBe(1);
        expect(errors()).toContain('EACCES');
        expect(mockInjectorCalls[0].gitignoreAppended.lines).toEqual([
          HEADER,
          ...ENTRIES,
        ]);
        expect(readGitignore()).toBe(['', HEADER, ...ENTRIES, ''].join('\n'));
      });
    });
  });
});

// ---------------------------------------------------------------------------
// determineVersion — which RN version the artifact slots are wired to:
// explicit --version → the `artifactsVersionOverride` pinned in the injection
// marker by a previous `--version` → node_modules/react-native/package.json.
// ---------------------------------------------------------------------------

describe('determineVersion', () => {
  let appRoot;
  let reactNativeRoot;
  let logSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-version-app-'));
    reactNativeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-version-rn-'));
    fs.writeFileSync(
      path.join(reactNativeRoot, 'package.json'),
      JSON.stringify({name: 'react-native', version: '1000.0.0'}),
    );
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(appRoot, {recursive: true, force: true});
    fs.rmSync(reactNativeRoot, {recursive: true, force: true});
  });

  const logged = () => logSpy.mock.calls.map(c => c.join(' ')).join('\n');

  it('prefers an explicit --version over a pinned override', () => {
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj', {
      artifactsVersionOverride: '0.80.0',
    });

    expect(
      determineVersion({version: '0.81.0'}, reactNativeRoot, appRoot),
    ).toBe('0.81.0');
    expect(logged()).not.toMatch(/spm-injected\.json/);
  });

  it('uses the pinned override when --version is omitted', () => {
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj', {
      artifactsVersionOverride: '0.80.0',
    });

    expect(determineVersion({version: null}, reactNativeRoot, appRoot)).toBe(
      '0.80.0',
    );
  });

  it('names the marker in the log when the pin is the source', () => {
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj', {
      artifactsVersionOverride: '0.80.0',
    });
    determineVersion({version: null}, reactNativeRoot, appRoot);

    expect(logged()).toMatch(/0\.80\.0/);
    expect(logged()).toMatch(/spm-injected\.json/);
  });

  it("falls back to react-native's package.json with no pin recorded", () => {
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj');

    expect(determineVersion({version: null}, reactNativeRoot, appRoot)).toBe(
      '1000.0.0',
    );
    expect(logged()).not.toMatch(/spm-injected\.json/);
  });

  it("falls back to react-native's package.json when no project is injected", () => {
    mkXcodeproj(appRoot, 'MyApp.xcodeproj');

    expect(determineVersion({version: null}, reactNativeRoot, appRoot)).toBe(
      '1000.0.0',
    );
  });

  it('falls back without throwing when the marker is corrupt', () => {
    const xcodeproj = path.join(appRoot, 'MyApp.xcodeproj');
    fs.mkdirSync(xcodeproj, {recursive: true});
    fs.writeFileSync(path.join(xcodeproj, SPM_INJECTED_MARKER), '{not json');

    expect(determineVersion({version: null}, reactNativeRoot, appRoot)).toBe(
      '1000.0.0',
    );
  });
});

describe('resolveAppIosDeploymentTarget', () => {
  let appRoot;
  let logSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-setup-iosdt-'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(appRoot, {recursive: true, force: true});
  });

  function logged() {
    return logSpy.mock.calls.map(call => call.join(' ')).join('\n');
  }

  // No marker — the first `spm add`, where only --product-name identifies the
  // target among the fixture's two app targets.
  function mkTwoTargetProject() {
    const dir = path.join(appRoot, 'MyApp.xcodeproj');
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(
      path.join(dir, 'project.pbxproj'),
      twoAppTargets('16.4'),
      'utf8',
    );
  }

  it('reads the app target --product-name selects, not the lowest one', () => {
    mkTwoTargetProject();
    expect(resolveAppIosDeploymentTarget({productName: 'MyApp'}, appRoot)).toBe(
      '16.4',
    );
    expect(logged()).toContain(
      'iOS deployment target: 16.4 (from MyApp.xcodeproj)',
    );
  });

  it('names the reason alongside the default when no project could be picked', () => {
    expect(resolveAppIosDeploymentTarget({}, appRoot)).toBe('15.1');
    expect(logged()).toContain(
      'iOS deployment target: 15.1 (react-native default; no .xcodeproj found',
    );
  });
});
