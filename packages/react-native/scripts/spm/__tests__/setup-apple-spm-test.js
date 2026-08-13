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
  cleanupDanglingPodsWorkspaceRef,
  detectStandardRnLayoutRedirect,
  determineVersion,
  disableAutomaticPodsInstallation,
  ensureBothArtifactFlavors,
  findExistingReactNativeConfig,
  findInjectedXcodeproj,
  generateAutolinkingConfigOrFailClosed,
  parseArgs,
  podfileHasRnIntegration,
  removeDanglingPodsFileRef,
  resolveAction,
  resolveConfigCommandToPin,
  resolveExplicitConfigCommand,
  restoreAutomaticPodsInstallation,
  shouldAutoDeintegrate,
  stripReactNativeFromPodfile,
  withAutomaticPodsInstallationDisabled,
  withAutomaticPodsInstallationEnabled,
} = require('../../setup-apple-spm');
const {REQUIRED_ARTIFACTS} = require('../download-spm-artifacts');
const {SPM_INJECTED_MARKER} = require('../generate-spm-xcodeproj');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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

// ---------------------------------------------------------------------------
// shouldAutoDeintegrate — the zero-arg safe-gate. Auto-convert ONLY a fresh
// CocoaPods RN project: CocoaPods pbxproj + stock Podfile (no third-party pods)
// + clean git tree. Anything else → false (strict `add`, fail-loud).
// ---------------------------------------------------------------------------

describe('shouldAutoDeintegrate', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-safegate-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('false when the project is not CocoaPods-integrated', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: false,
    });
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(false);
  });

  it('false when there is no target project at all', () => {
    expect(shouldAutoDeintegrate(tempDir, null)).toBe(false);
  });

  it('false for a CocoaPods project whose Podfile has third-party pods', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(
      path.join(tempDir, 'Podfile'),
      "target 'MyApp' do\n  use_react_native!\n  pod 'MBProgressHUD'\nend\n",
    );
    gitInitAndCommit(tempDir);
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(false);
  });

  it('false when the pbxproj has uncommitted edits (not revertible)', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(
      path.join(tempDir, 'Podfile'),
      "target 'MyApp' do\n  use_react_native!\nend\n",
    );
    gitInitAndCommit(tempDir);
    // Dirty the pbxproj itself after the commit → conversion not revertible.
    fs.appendFileSync(
      path.join(xcodeproj, 'project.pbxproj'),
      '\n// local edit\n',
    );
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(false);
  });

  it('true despite an unrelated dirty file when pbxproj + Podfile are clean', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(
      path.join(tempDir, 'Podfile'),
      "target 'MyApp' do\n  config = use_native_modules!\n  use_react_native!(:path => config[:reactNativePath])\nend\n",
    );
    gitInitAndCommit(tempDir);
    // A dirty lockfile / untracked file elsewhere must NOT block — the
    // conversion only touches the pbxproj + Podfile, which stay clean.
    fs.writeFileSync(path.join(tempDir, 'package-lock.json'), '{}');
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// stripReactNativeFromPodfile — removes the RN Podfile DSL calls, including
// multi-line argument lists (the stock template's `use_react_native!(...)`
// spans several lines), without corrupting the rest of the Podfile.
// ---------------------------------------------------------------------------

describe('stripReactNativeFromPodfile', () => {
  it('strips a single-line call', () => {
    const podfile = "target 'MyApp' do\n  use_react_native!\nend\n";
    expect(stripReactNativeFromPodfile(podfile)).toBe(
      "target 'MyApp' do\nend\n",
    );
  });

  it('strips a multi-line call with a parenthesized argument list, consuming the enclosing assignment', () => {
    const podfile =
      "target 'HelloWorld' do\n" +
      '  config = use_native_modules!\n' +
      '\n' +
      '  use_react_native!(\n' +
      '    :path => "../../../packages/react-native",\n' +
      '    # An absolute path to your application root.\n' +
      '    :app_path => "#{Pod::Config.instance.installation_root}/.."\n' +
      '  )\n' +
      '\n' +
      "  target 'HelloWorldTests' do\n" +
      '    inherit! :complete\n' +
      '  end\n' +
      'end\n';
    const stripped = stripReactNativeFromPodfile(podfile);
    expect(stripped).not.toMatch(/use_react_native!/);
    expect(stripped).not.toMatch(/:app_path/);
    expect(stripped).not.toMatch(/^\s*\)\s*$/m);
    // The `config = ` assignment is dropped along with the call — leaving it
    // behind would let Ruby fold it into the next statement (the blank line,
    // then `target 'HelloWorldTests' do ... end` would become the RHS of
    // `config =`), which is worse than losing the `config` binding outright.
    expect(stripped).not.toMatch(/config\s*=\s*$/m);
    expect(stripped).toBe(
      "target 'HelloWorld' do\n" +
        '\n' +
        '\n' +
        "  target 'HelloWorldTests' do\n" +
        '    inherit! :complete\n' +
        '  end\n' +
        'end\n',
    );
  });

  it('strips `prepare_react_native_project!` on its own line', () => {
    const podfile =
      'platform :ios, min_ios_version_supported\n' +
      'prepare_react_native_project!\n' +
      '\n' +
      "target 'MyApp' do\nend\n";
    expect(stripReactNativeFromPodfile(podfile)).toBe(
      'platform :ios, min_ios_version_supported\n' +
        '\n' +
        "target 'MyApp' do\nend\n",
    );
  });

  it('leaves an unrelated Podfile untouched', () => {
    const podfile = "target 'MyApp' do\n  pod 'MBProgressHUD'\nend\n";
    expect(stripReactNativeFromPodfile(podfile)).toBe(podfile);
  });

  it('leaves a call mentioned inside a comment untouched', () => {
    const podfile =
      "target 'MyApp' do\n" +
      '  # use_react_native! does a lot of setup, see the docs\n' +
      "  pod 'MBProgressHUD'\n" +
      'end\n';
    expect(stripReactNativeFromPodfile(podfile)).toBe(podfile);
  });

  it('leaves a call embedded in other code (not at statement position) untouched', () => {
    const podfile =
      "target 'MyApp' do\n" +
      "  puts 'about to call use_react_native!'\n" +
      'end\n';
    expect(stripReactNativeFromPodfile(podfile)).toBe(podfile);
  });

  it('the stock template, once stripped, still needs `post_install` removed by hand — podfileHasRnIntegration says so', () => {
    // Full stock react-native init Podfile shape, including the post_install
    // block that references the (now-removed) use_native_modules! return
    // value. stripReactNativeFromPodfile intentionally doesn't try to strip
    // that block — its shape is too open-ended — so podfileHasRnIntegration
    // must still flag the leftover `react_native_post_install` call.
    const podfile =
      "target 'HelloWorld' do\n" +
      '  config = use_native_modules!\n' +
      '\n' +
      '  use_react_native!(\n' +
      '    :path => config[:reactNativePath],\n' +
      '    :app_path => "#{Pod::Config.instance.installation_root}/.."\n' +
      '  )\n' +
      '\n' +
      '  post_install do |installer|\n' +
      '    react_native_post_install(\n' +
      '      installer,\n' +
      '      config[:reactNativePath],\n' +
      '      :mac_catalyst_enabled => false\n' +
      '    )\n' +
      '  end\n' +
      'end\n';
    const stripped = stripReactNativeFromPodfile(podfile);
    expect(stripped).not.toMatch(/use_react_native!/);
    expect(stripped).not.toMatch(/use_native_modules!/);
    // The post_install block (and its react_native_post_install call) is
    // left in place on purpose.
    expect(stripped).toMatch(/react_native_post_install/);

    const appRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'spm-podfile-leftover-'),
    );
    try {
      fs.writeFileSync(path.join(appRoot, 'Podfile'), stripped, 'utf8');
      expect(podfileHasRnIntegration(appRoot)).toBe(true);
    } finally {
      fs.rmSync(appRoot, {recursive: true, force: true});
    }
  });
});

// ---------------------------------------------------------------------------
// withAutomaticPodsInstallationDisabled — sets
// project.ios.automaticPodsInstallation to false in react-native.config.js,
// inserting `project` / `ios` / the key itself as needed. Left `true` (the
// CLI default), a future `react-native run-ios` silently re-runs CocoaPods
// and re-breaks the SPM package graph.
// ---------------------------------------------------------------------------

describe('withAutomaticPodsInstallationDisabled', () => {
  it('inserts a project.ios block into an empty config', () => {
    expect(
      withAutomaticPodsInstallationDisabled('module.exports = {};\n'),
    ).toBe(
      'module.exports = {\n' +
        '  project: {\n' +
        '    ios: {\n' +
        '      automaticPodsInstallation: false,\n' +
        '    },\n' +
        '  },\n' +
        '};\n',
    );
  });

  it('inserts a project.ios block ahead of existing keys', () => {
    const config =
      'module.exports = {\n' +
      '  dependencies: {\n' +
      '    foo: {},\n' +
      '  },\n' +
      '};\n';
    expect(withAutomaticPodsInstallationDisabled(config)).toBe(
      'module.exports = {\n' +
        '  project: {\n' +
        '    ios: {\n' +
        '      automaticPodsInstallation: false,\n' +
        '    },\n' +
        '  },\n' +
        '  dependencies: {\n' +
        '    foo: {},\n' +
        '  },\n' +
        '};\n',
    );
  });

  it('inserts an ios block into an existing project with no ios key', () => {
    const config =
      'module.exports = {\n' +
      '  project: {\n' +
      "    android: {\n      sourceDir: './android',\n    },\n" +
      '  },\n' +
      '};\n';
    expect(withAutomaticPodsInstallationDisabled(config)).toBe(
      'module.exports = {\n' +
        '  project: {\n' +
        '    ios: {\n' +
        '      automaticPodsInstallation: false,\n' +
        '    },\n' +
        "    android: {\n      sourceDir: './android',\n    },\n" +
        '  },\n' +
        '};\n',
    );
  });

  it('inserts the key into an existing project.ios block', () => {
    const config =
      'module.exports = {\n' +
      '  project: {\n' +
      "    ios: {\n      sourceDir: './ios',\n    },\n" +
      '  },\n' +
      '};\n';
    expect(withAutomaticPodsInstallationDisabled(config)).toBe(
      'module.exports = {\n' +
        '  project: {\n' +
        '    ios: {\n' +
        '      automaticPodsInstallation: false,\n' +
        "      sourceDir: './ios',\n" +
        '    },\n' +
        '  },\n' +
        '};\n',
    );
  });

  it('flips an existing `true` to `false`', () => {
    const config =
      'module.exports = {\n' +
      '  project: {\n' +
      '    ios: {\n      automaticPodsInstallation: true,\n    },\n' +
      '  },\n' +
      '};\n';
    expect(withAutomaticPodsInstallationDisabled(config)).toBe(
      'module.exports = {\n' +
        '  project: {\n' +
        '    ios: {\n      automaticPodsInstallation: false,\n    },\n' +
        '  },\n' +
        '};\n',
    );
  });

  it('is a no-op when already `false`', () => {
    const config =
      'module.exports = {\n' +
      '  project: {\n' +
      '    ios: {\n      automaticPodsInstallation: false,\n    },\n' +
      '  },\n' +
      '};\n';
    expect(withAutomaticPodsInstallationDisabled(config)).toBe(config);
  });

  it('returns null for an unrecognized config shape', () => {
    expect(
      withAutomaticPodsInstallationDisabled(
        'export default { project: {} };\n',
      ),
    ).toBeNull();
  });

  it('is not confused by a `}` inside a comment when locating project.ios', () => {
    // A naive brace-depth scan over raw text sees this `}` and thinks
    // `project`'s object closed one line early, so `ios: {` looks like a
    // sibling of `project` instead of nested inside it — inserting a
    // duplicate `ios` key ahead of the real one instead of editing it.
    const config =
      'module.exports = {\n' +
      '  project: {\n' +
      '    // closes the } block\n' +
      "    ios: {sourceDir: './ios'},\n" +
      '  },\n' +
      '};\n';
    const updated = withAutomaticPodsInstallationDisabled(config);
    expect(updated).not.toBeNull();
    // Exactly one `ios:` object — a duplicate would mean the scanner treated
    // the `}` in the comment as closing `project` early.
    expect((updated ?? '').match(/ios:\s*{/g)).toHaveLength(1);
    expect(updated).toContain('automaticPodsInstallation: false');
    // The original sourceDir survives in the SAME ios block — a duplicate-key
    // insertion ahead of the real `ios: {` would have orphaned it instead.
    expect(updated).toMatch(
      /ios:\s*{\s*automaticPodsInstallation: false,\s*sourceDir: '\.\/ios'},/,
    );
  });

  it('matches a quoted `project` key', () => {
    const config = "module.exports = {\n  'project': {},\n};\n";
    const updated = withAutomaticPodsInstallationDisabled(config);
    expect(updated).not.toBeNull();
    expect(updated).toContain('automaticPodsInstallation: false');
    expect((updated ?? '').match(/project['"]?\s*:\s*{/g)).toHaveLength(1);
  });

  it('a commented-out `automaticPodsInstallation: false,` does not count as already disabled', () => {
    const config =
      'module.exports = {\n' +
      '  project: {\n' +
      '    ios: {\n' +
      '      // automaticPodsInstallation: false,\n' +
      "      sourceDir: './ios',\n" +
      '    },\n' +
      '  },\n' +
      '};\n';
    const updated = withAutomaticPodsInstallationDisabled(config);
    expect(updated).not.toBeNull();
    // The real (uncommented) key must actually be inserted, not skipped
    // because a commented-out mention of the key was mistaken for it.
    expect(updated).toMatch(/^\s*automaticPodsInstallation: false,$/m);
  });

  it('an `automaticPodsInstallation` set under an unrelated key does not count as already disabled', () => {
    const config =
      'module.exports = {\n' +
      '  dependencies: {\n' +
      '    foo: {\n' +
      '      automaticPodsInstallation: false,\n' +
      '    },\n' +
      '  },\n' +
      '};\n';
    const updated = withAutomaticPodsInstallationDisabled(config);
    expect(updated).not.toBeNull();
    expect(updated).toMatch(
      /project:\s*{\s*ios:\s*{\s*automaticPodsInstallation: false,/,
    );
  });
});

// ---------------------------------------------------------------------------
// withAutomaticPodsInstallationEnabled — the inverse used by `spm deinit` to
// restore project.ios.automaticPodsInstallation after --deintegrate disabled
// it.
// ---------------------------------------------------------------------------

describe('withAutomaticPodsInstallationEnabled', () => {
  it('flips an existing `false` back to `true`', () => {
    const config =
      'module.exports = {\n' +
      '  project: {\n' +
      '    ios: {\n      automaticPodsInstallation: false,\n    },\n' +
      '  },\n' +
      '};\n';
    expect(withAutomaticPodsInstallationEnabled(config)).toBe(
      'module.exports = {\n' +
        '  project: {\n' +
        '    ios: {\n      automaticPodsInstallation: true,\n    },\n' +
        '  },\n' +
        '};\n',
    );
  });

  it('returns null when the value is no longer `false` (hand-edited since)', () => {
    const config =
      'module.exports = {\n' +
      '  project: {\n' +
      '    ios: {\n      automaticPodsInstallation: true,\n    },\n' +
      '  },\n' +
      '};\n';
    expect(withAutomaticPodsInstallationEnabled(config)).toBeNull();
  });

  it('returns null when project.ios is absent', () => {
    expect(
      withAutomaticPodsInstallationEnabled('module.exports = {};\n'),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// findExistingReactNativeConfig / disableAutomaticPodsInstallation —
// disableAutomaticPodsInstallation must write to projectRoot (the only
// directory @react-native-community/cli-config's cosmiconfig lookup
// searches), never to appRoot, and must never create a second
// react-native.config.js that shadows an existing .ts/.cjs/.mjs config.
// ---------------------------------------------------------------------------

describe('findExistingReactNativeConfig', () => {
  let projectRoot;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-rnconfig-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, {recursive: true, force: true});
  });

  it('returns null when no config file exists', () => {
    expect(findExistingReactNativeConfig(projectRoot)).toBeNull();
  });

  it('finds react-native.config.js', () => {
    const p = path.join(projectRoot, 'react-native.config.js');
    fs.writeFileSync(p, 'module.exports = {};\n');
    expect(findExistingReactNativeConfig(projectRoot)).toBe(p);
  });

  it('finds a .ts config when there is no .js config', () => {
    const p = path.join(projectRoot, 'react-native.config.ts');
    fs.writeFileSync(p, 'export default {};\n');
    expect(findExistingReactNativeConfig(projectRoot)).toBe(p);
  });

  it('finds a .cjs config when there is no .js config', () => {
    const p = path.join(projectRoot, 'react-native.config.cjs');
    fs.writeFileSync(p, 'module.exports = {};\n');
    expect(findExistingReactNativeConfig(projectRoot)).toBe(p);
  });
});

describe('disableAutomaticPodsInstallation', () => {
  let projectRoot;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-disable-pods-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, {recursive: true, force: true});
  });

  it('creates react-native.config.js in projectRoot when none exists', () => {
    const result = disableAutomaticPodsInstallation(projectRoot);
    expect(result.kind).toBe('created');
    const configPath = path.join(projectRoot, 'react-native.config.js');
    expect(result.configPath).toBe(configPath);
    expect(fs.existsSync(configPath)).toBe(true);
    expect(fs.readFileSync(configPath, 'utf8')).toContain(
      'automaticPodsInstallation: false',
    );
  });

  it('edits an existing react-native.config.js in place', () => {
    const configPath = path.join(projectRoot, 'react-native.config.js');
    fs.writeFileSync(
      configPath,
      'module.exports = {\n  project: { ios: {} },\n};\n',
    );
    const result = disableAutomaticPodsInstallation(projectRoot);
    expect(result.kind).toBe('edited');
    expect(result.configPath).toBe(configPath);
    expect(fs.readFileSync(configPath, 'utf8')).toContain(
      'automaticPodsInstallation: false',
    );
  });

  it('reports already-disabled without rewriting the file', () => {
    const configPath = path.join(projectRoot, 'react-native.config.js');
    const contents =
      'module.exports = {\n' +
      '  project: { ios: { automaticPodsInstallation: false } },\n' +
      '};\n';
    fs.writeFileSync(configPath, contents);
    const before = fs.statSync(configPath).mtimeMs;
    const result = disableAutomaticPodsInstallation(projectRoot);
    expect(result.kind).toBe('already-disabled');
    expect(fs.readFileSync(configPath, 'utf8')).toBe(contents);
    expect(fs.statSync(configPath).mtimeMs).toBe(before);
  });

  it('does NOT create a second config when a .ts config already exists (no shadowing)', () => {
    const tsPath = path.join(projectRoot, 'react-native.config.ts');
    fs.writeFileSync(tsPath, 'export default { dependencies: {} };\n');
    const result = disableAutomaticPodsInstallation(projectRoot);
    expect(result.kind).toBe('unrecognized');
    expect(result.configPath).toBe(tsPath);
    expect(
      fs.existsSync(path.join(projectRoot, 'react-native.config.js')),
    ).toBe(false);
    // The .ts file itself is left completely untouched.
    expect(fs.readFileSync(tsPath, 'utf8')).toBe(
      'export default { dependencies: {} };\n',
    );
  });

  it('writes next to package.json (projectRoot), not the .xcodeproj directory (appRoot)', () => {
    // Regression test for the standard `<projectRoot>/ios` layout: appRoot
    // (where the .xcodeproj lives) and projectRoot (where package.json and
    // react-native.config.js live) are different directories.
    const appRoot = path.join(projectRoot, 'ios');
    fs.mkdirSync(appRoot, {recursive: true});
    disableAutomaticPodsInstallation(projectRoot);
    expect(
      fs.existsSync(path.join(projectRoot, 'react-native.config.js')),
    ).toBe(true);
    expect(fs.existsSync(path.join(appRoot, 'react-native.config.js'))).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// restoreAutomaticPodsInstallation — the `spm deinit` counterpart, driven by
// the AutomaticPodsInstallationResult recorded in the .spm-injected.json
// marker by disableAutomaticPodsInstallation.
// ---------------------------------------------------------------------------

describe('restoreAutomaticPodsInstallation', () => {
  let projectRoot;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-restore-pods-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, {recursive: true, force: true});
  });

  it('removes the file it created, if untouched since', () => {
    const result = disableAutomaticPodsInstallation(projectRoot);
    expect(result.kind).toBe('created');
    restoreAutomaticPodsInstallation(result);
    expect(fs.existsSync(result.configPath)).toBe(false);
  });

  it('leaves a created file in place if the user has since edited it', () => {
    const result = disableAutomaticPodsInstallation(projectRoot);
    expect(result.kind).toBe('created');
    fs.appendFileSync(result.configPath, '// a note the user added\n');
    restoreAutomaticPodsInstallation(result);
    expect(fs.existsSync(result.configPath)).toBe(true);
  });

  it('flips an edited file back to `true`', () => {
    const configPath = path.join(projectRoot, 'react-native.config.js');
    fs.writeFileSync(
      configPath,
      'module.exports = {\n  project: { ios: { sourceDir: "./ios" } },\n};\n',
    );
    const result = disableAutomaticPodsInstallation(projectRoot);
    expect(result.kind).toBe('edited');
    restoreAutomaticPodsInstallation(result);
    expect(fs.readFileSync(configPath, 'utf8')).toContain(
      'automaticPodsInstallation: true',
    );
  });

  it('is a no-op for already-disabled (we made no edit to undo)', () => {
    const configPath = path.join(projectRoot, 'react-native.config.js');
    const contents =
      'module.exports = {\n' +
      '  project: { ios: { automaticPodsInstallation: false } },\n' +
      '};\n';
    fs.writeFileSync(configPath, contents);
    const result = disableAutomaticPodsInstallation(projectRoot);
    expect(result.kind).toBe('already-disabled');
    restoreAutomaticPodsInstallation(result);
    expect(fs.readFileSync(configPath, 'utf8')).toBe(contents);
  });

  it('is a no-op for null (deintegrate never ran)', () => {
    expect(() => restoreAutomaticPodsInstallation(null)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// removeDanglingPodsFileRef — strips the `group:Pods/Pods.xcodeproj` FileRef
// `pod install` adds to contents.xcworkspacedata. `pod deintegrate` doesn't
// touch the workspace, so left alone this is a permanent red/missing row in
// Xcode's workspace navigator.
// ---------------------------------------------------------------------------

describe('removeDanglingPodsFileRef', () => {
  it('removes the Pods.xcodeproj FileRef, leaving the app project ref intact', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<Workspace\n' +
      '   version = "1.0">\n' +
      '   <FileRef\n' +
      '      location = "group:HelloWorld.xcodeproj">\n' +
      '   </FileRef>\n' +
      '   <FileRef\n' +
      '      location = "group:Pods/Pods.xcodeproj">\n' +
      '   </FileRef>\n' +
      '</Workspace>\n';
    expect(removeDanglingPodsFileRef(xml)).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Workspace\n' +
        '   version = "1.0">\n' +
        '   <FileRef\n' +
        '      location = "group:HelloWorld.xcodeproj">\n' +
        '   </FileRef>\n' +
        '</Workspace>\n',
    );
  });

  it('is a no-op when there is no Pods.xcodeproj reference', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<Workspace\n' +
      '   version = "1.0">\n' +
      '   <FileRef\n' +
      '      location = "group:HelloWorld.xcodeproj">\n' +
      '   </FileRef>\n' +
      '</Workspace>\n';
    expect(removeDanglingPodsFileRef(xml)).toBe(xml);
  });

  it('matches a `container:` prefix and a nested path, not just `group:Pods/Pods.xcodeproj`', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<Workspace\n' +
      '   version = "1.0">\n' +
      '   <FileRef\n' +
      '      location = "group:HelloWorld.xcodeproj">\n' +
      '   </FileRef>\n' +
      '   <FileRef location = "container:ios/Pods/Pods.xcodeproj"/>\n' +
      '</Workspace>\n';
    expect(removeDanglingPodsFileRef(xml)).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Workspace\n' +
        '   version = "1.0">\n' +
        '   <FileRef\n' +
        '      location = "group:HelloWorld.xcodeproj">\n' +
        '   </FileRef>\n' +
        '</Workspace>\n',
    );
  });
});

// ---------------------------------------------------------------------------
// cleanupDanglingPodsWorkspaceRef — the safety-gated wrapper `add
// --deintegrate` calls: only rewrites contents.xcworkspacedata when
// Pods/Pods.xcodeproj is actually gone from disk, so a still-valid
// side-by-side CocoaPods integration is never disturbed.
// ---------------------------------------------------------------------------

describe('cleanupDanglingPodsWorkspaceRef', () => {
  let appRoot;
  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-workspace-'));
  });
  afterEach(() => {
    fs.rmSync(appRoot, {recursive: true, force: true});
  });

  function mkWorkspace(root, name) {
    const dir = path.join(root, name);
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(
      path.join(dir, 'contents.xcworkspacedata'),
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Workspace\n' +
        '   version = "1.0">\n' +
        '   <FileRef\n' +
        `      location = "group:${path.basename(name, '.xcworkspace')}.xcodeproj">\n` +
        '   </FileRef>\n' +
        '   <FileRef\n' +
        '      location = "group:Pods/Pods.xcodeproj">\n' +
        '   </FileRef>\n' +
        '</Workspace>\n',
    );
    return dir;
  }

  it('removes the dangling ref when Pods.xcodeproj is gone from disk', () => {
    const xcodeprojPath = mkXcodeproj(appRoot, 'MyApp.xcodeproj');
    const workspace = mkWorkspace(appRoot, 'MyApp.xcworkspace');
    expect(cleanupDanglingPodsWorkspaceRef(appRoot, xcodeprojPath)).toBe(true);
    const data = fs.readFileSync(
      path.join(workspace, 'contents.xcworkspacedata'),
      'utf8',
    );
    expect(data).not.toMatch(/Pods\.xcodeproj/);
  });

  it('leaves the ref alone when Pods.xcodeproj still exists on disk', () => {
    const xcodeprojPath = mkXcodeproj(appRoot, 'MyApp.xcodeproj');
    const workspace = mkWorkspace(appRoot, 'MyApp.xcworkspace');
    fs.mkdirSync(path.join(appRoot, 'Pods', 'Pods.xcodeproj'), {
      recursive: true,
    });
    expect(cleanupDanglingPodsWorkspaceRef(appRoot, xcodeprojPath)).toBe(false);
    const data = fs.readFileSync(
      path.join(workspace, 'contents.xcworkspacedata'),
      'utf8',
    );
    expect(data).toMatch(/Pods\.xcodeproj/);
  });

  it('is a no-op when there is no .xcworkspace', () => {
    const xcodeprojPath = mkXcodeproj(appRoot, 'MyApp.xcodeproj');
    expect(cleanupDanglingPodsWorkspaceRef(appRoot, xcodeprojPath)).toBe(false);
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
