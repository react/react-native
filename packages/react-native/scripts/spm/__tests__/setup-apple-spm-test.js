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
  detectStandardRnLayoutRedirect,
  ensureBothArtifactFlavors,
  findInjectedXcodeproj,
  resolveAction,
  shouldAutoDeintegrate,
} = require('../../setup-apple-spm');
const {REQUIRED_ARTIFACTS} = require('../download-spm-artifacts');
const {SPM_INJECTED_MARKER} = require('../generate-spm-xcodeproj');
const {execFileSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Create an in-place-injected xcodeproj fixture: a directory carrying the
// `.spm-injected.json` marker (what injectSpmIntoExistingXcodeproj writes).
function mkInjectedXcodeproj(appRoot, name) {
  const dir = path.join(appRoot, name);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(
    path.join(dir, SPM_INJECTED_MARKER),
    JSON.stringify({rootUuid: 'X', target: 'MyApp', injectedUuids: []}),
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
