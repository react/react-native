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

const {replaceRNCoreConfiguration} = require('../replace-rncore-version');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const VERSION = '0.87.0-test';
const SLICE = 'ios-arm64_x86_64-simulator';
const BINARY = path.join(SLICE, 'React.framework', 'React');
const SCRIPT = require.resolve('../replace-rncore-version.js');
const MARKER = path.join('React-Core-prebuilt', '.last_build_configuration');

// Runs the script the way the "[RNCore] Replace React Native Core for the right
// configuration" build phase does, from Pods/ and through the CLI entry point.
function runScriptPhase(podsRoot, configuration) {
  return execFileSync(
    process.execPath,
    [SCRIPT, '-c', configuration, '-r', VERSION, '-p', podsRoot],
    {cwd: podsRoot, encoding: 'utf8'},
  );
}

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, contents);
}

function buildTarball(podsRoot, configuration) {
  const stage = fs.mkdtempSync(path.join(podsRoot, `stage-${configuration}-`));
  writeFile(path.join(stage, 'React.xcframework', 'Info.plist'), '<plist/>');
  writeFile(
    path.join(stage, 'React.xcframework', BINARY),
    `binary-${configuration}`,
  );
  // The tarball must also ship ReactNativeHeaders: without it the pre-fix code
  // throws its fail-closed error before reaching the module map, so the
  // regression test below would pass for the wrong reason.
  writeFile(
    path.join(
      stage,
      'ReactNativeHeaders.xcframework',
      SLICE,
      'Headers',
      'module.modulemap',
    ),
    'module yoga {}\n',
  );
  const artifacts = path.join(podsRoot, 'ReactNativeCore-artifacts');
  fs.mkdirSync(artifacts, {recursive: true});
  execFileSync('tar', [
    '-czf',
    path.join(
      artifacts,
      `reactnative-core-${VERSION.toLowerCase()}-${configuration.toLowerCase()}.tar.gz`,
    ),
    '-C',
    stage,
    '.',
  ]);
  fs.rmSync(stage, {recursive: true, force: true});
}

describe('replaceRNCoreConfiguration', () => {
  let podsRoot;
  let pod;
  let cwd;

  beforeEach(() => {
    podsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rncore-test-'));
    pod = path.join(podsRoot, 'React-Core-prebuilt');
    // What the podspec prepare_command leaves behind after `pod install`.
    writeFile(
      path.join(pod, 'Headers', 'module.modulemap'),
      'module yoga {}\n',
    );
    writeFile(path.join(pod, 'React.xcframework', 'Info.plist'), '<plist/>');
    writeFile(path.join(pod, 'React.xcframework', BINARY), 'binary-Debug');
    buildTarball(podsRoot, 'Release');
    cwd = process.cwd();
    // The script phase runs with Pods/ as its working directory.
    process.chdir(podsRoot);
  });

  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(podsRoot, {recursive: true, force: true});
  });

  it('installs the framework for the requested configuration', () => {
    replaceRNCoreConfiguration('Release', VERSION, podsRoot);

    expect(
      fs.readFileSync(path.join(pod, 'React.xcframework', BINARY), 'utf8'),
    ).toBe('binary-Release');
  });

  // Regression test for #57803: recreating the module map mid-build lets a
  // concurrent dependency scan miss it, and the React module then precompiles
  // without -fmodule-map-file and fails on non-modular includes.
  it('leaves Headers/module.modulemap untouched', () => {
    const moduleMap = path.join(pod, 'Headers', 'module.modulemap');
    const before = fs.statSync(moduleMap).ino;
    const contentsBefore = fs.readFileSync(moduleMap, 'utf8');

    replaceRNCoreConfiguration('Release', VERSION, podsRoot);

    expect(fs.statSync(moduleMap).ino).toBe(before);
    expect(fs.readFileSync(moduleMap, 'utf8')).toBe(contentsBefore);
  });

  // The swap used to purge every directory and restore this file by hand. It
  // now replaces React.xcframework alone, so the file is never disturbed.
  it('leaves an Expo-generated React-use-frameworks.modulemap in place', () => {
    const expoModuleMap = path.join(pod, 'React-use-frameworks.modulemap');
    writeFile(expoModuleMap, 'module React {}\n');

    replaceRNCoreConfiguration('Release', VERSION, podsRoot);

    expect(fs.readFileSync(expoModuleMap, 'utf8')).toBe('module React {}\n');
  });

  // Regression tests for #57598. The marker used to be written only after the
  // framework had already been replaced, so a build cancelled in between left it
  // naming a flavor that was no longer on disk. Every later build for that
  // flavor then took the "nothing to do" path and linked against the other
  // configuration's core, which fails with undefined C++ symbols and which a
  // clean does not undo because the pod directory survives it.
  describe('marker bookkeeping', () => {
    const marker = () => path.join(podsRoot, MARKER);
    const binary = () =>
      fs.readFileSync(path.join(pod, 'React.xcframework', BINARY), 'utf8');

    it('records the configuration when it skips a fresh install', () => {
      // `pod install` leaves the debug flavor and no marker, so a Debug build
      // has nothing to swap. It still has to write down what is on disk,
      // otherwise the state stays implicit and stays unverifiable.
      expect(fs.existsSync(marker())).toBe(false);

      runScriptPhase(podsRoot, 'Debug');

      expect(fs.readFileSync(marker(), 'utf8')).toBe('Debug');
      expect(binary()).toBe('binary-Debug');
    });

    it('invalidates the marker before it touches the framework', () => {
      fs.writeFileSync(marker(), 'Debug');
      // Drop the tarball so the Release run fails once it is already under way,
      // standing in for a build cancelled part way through the swap.
      fs.rmSync(
        path.join(
          podsRoot,
          'ReactNativeCore-artifacts',
          `reactnative-core-${VERSION.toLowerCase()}-release.tar.gz`,
        ),
      );

      expect(() => runScriptPhase(podsRoot, 'Release')).toThrow();

      // The marker must no longer claim Debug: the framework may already have
      // been swapped, and a Debug build that trusts it would silently skip.
      expect(fs.readFileSync(marker(), 'utf8')).not.toBe('Debug');
    });

    it('replaces the framework when the marker shows an unfinished swap', () => {
      buildTarball(podsRoot, 'Debug');
      // A swap that was interrupted: the Release flavor is on disk and the
      // marker never got its final value.
      replaceRNCoreConfiguration('Release', VERSION, podsRoot);
      fs.writeFileSync(marker(), 'in-progress');
      expect(binary()).toBe('binary-Release');

      runScriptPhase(podsRoot, 'Debug');

      expect(binary()).toBe('binary-Debug');
      expect(fs.readFileSync(marker(), 'utf8')).toBe('Debug');
    });

    it('still skips when the marker already matches the configuration', () => {
      fs.writeFileSync(marker(), 'Release');
      const before = binary();

      const output = runScriptPhase(podsRoot, 'Release');

      expect(output).toContain('No need to replace React-Core-prebuilt');
      expect(binary()).toBe(before);
    });
  });

  it('fails when the tarball has no React.xcframework', () => {
    const stage = fs.mkdtempSync(path.join(podsRoot, 'stage-bad-'));
    writeFile(path.join(stage, 'unrelated.txt'), 'nope');
    execFileSync('tar', [
      '-czf',
      path.join(
        podsRoot,
        'ReactNativeCore-artifacts',
        `reactnative-core-${VERSION.toLowerCase()}-release.tar.gz`,
      ),
      '-C',
      stage,
      '.',
    ]);

    expect(() =>
      replaceRNCoreConfiguration('Release', VERSION, podsRoot),
    ).toThrow(/Extraction verification failed/);
  });
});
