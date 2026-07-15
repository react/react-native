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
  findSourcePath,
  generateXCFrameworksPackageSwift,
  main,
} = require('../generate-spm-package');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// generateXCFrameworksPackageSwift
// ---------------------------------------------------------------------------

describe('generateXCFrameworksPackageSwift', () => {
  it('exposes only invariant compile-time products', () => {
    const result = generateXCFrameworksPackageSwift();
    expect(result).toContain(
      '.library(name: "ReactHeaders", targets: ["ReactHeaders"])',
    );
    expect(result).toContain(
      '.library(name: "ReactNativeHeaders", targets: ["ReactNativeHeaders"])',
    );
    expect(result).toContain(
      '.library(name: "ReactNativeDependenciesHeaders", targets: ["ReactNativeDependenciesHeaders"])',
    );
    expect(result).not.toContain('.library(name: "ReactNative"');
    expect(result).not.toContain('.library(name: "hermes-engine"');
  });

  it('uses a Clang ReactHeaders target and header-only binary targets', () => {
    const result = generateXCFrameworksPackageSwift();
    expect(result).toContain(
      'name: "ReactHeaders",\n            dependencies: ["ReactNativeHeaders"]',
    );
    expect(result).toContain('path: "ReactHeadersTarget"');
    expect(result).toContain('publicHeadersPath: "include"');
    expect(result).toContain(
      'name: "ReactNativeHeaders",\n            path: "ReactNativeHeaders.xcframework"',
    );
    expect(result).not.toContain('.binaryTarget(\n            name: "React",');
  });

  it('includes auto-generated header comment', () => {
    const result = generateXCFrameworksPackageSwift();
    expect(result).toContain('AUTO-GENERATED');
    expect(result).toContain('swift-tools-version: 6.0');
    expect(result).toContain('name: "ReactNative"');
  });
});

// ---------------------------------------------------------------------------
// findSourcePath
// ---------------------------------------------------------------------------

describe('findSourcePath', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-find-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('finds directory matching derived name', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp'));
    expect(findSourcePath(tempDir, 'my-app')).toBe('MyApp');
  });

  it('falls back to ios directory', () => {
    fs.mkdirSync(path.join(tempDir, 'ios'));
    expect(findSourcePath(tempDir, 'unknown-pkg')).toBe('ios');
  });

  it('scans for directory with native sources', () => {
    fs.mkdirSync(path.join(tempDir, 'CustomDir'));
    fs.writeFileSync(path.join(tempDir, 'CustomDir', 'main.m'), '');
    expect(findSourcePath(tempDir, 'unrelated-name')).toBe('CustomDir');
  });

  it('returns derived name when nothing found', () => {
    expect(findSourcePath(tempDir, 'my-app')).toBe('MyApp');
  });
});

// ---------------------------------------------------------------------------
// main — end-to-end generation of build/xcframeworks/{Package.swift,symlinks}
// from a local artifacts.json. The headers composer is injected so the
// happy paths stay inside a tempdir with no cross-package side effects.
// ---------------------------------------------------------------------------

describe('main', () => {
  let appRoot;
  let rnRoot;
  let origExitCode;
  let logSpy;
  let errSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-pkg-app-'));
    rnRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-pkg-rn-'));
    origExitCode = process.exitCode;
    process.exitCode = undefined;
    // main() is chatty via makeLogger/console.error — silence to keep output
    // readable; assertions target the filesystem, not the logs.
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    process.exitCode = origExitCode;
    fs.rmSync(appRoot, {recursive: true, force: true});
    fs.rmSync(rnRoot, {recursive: true, force: true});
  });

  // Writes the app package.json so findProjectRoot/readPackageJson resolve.
  function writeAppPkg(name /*: string */ = 'my-app') {
    fs.writeFileSync(
      path.join(appRoot, 'package.json'),
      JSON.stringify({name, version: '1.0.0'}),
      'utf8',
    );
  }

  function writeArtifacts(entries /*: Array<string> */) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-pkg-art-'));
    const json = {};
    for (const name of entries) {
      const xcfwPath = path.join(dir, `${name}.xcframework`);
      fs.mkdirSync(xcfwPath, {recursive: true});
      json[name] = {xcframeworkPath: xcfwPath, url: 'https://example'};
    }
    fs.writeFileSync(
      path.join(dir, 'artifacts.json'),
      JSON.stringify(json),
      'utf8',
    );
    return dir;
  }

  function run(
    debugArtifactsDir /*:: ?: ?string */,
    releaseArtifactsDir /*:: ?: ?string */,
    prepare /*:: ?: ?Function */,
  ) {
    const argv = [
      '--app-root',
      appRoot,
      '--react-native-root',
      rnRoot,
      '--version',
      '0.85.0',
    ];
    if (debugArtifactsDir != null) {
      argv.push('--debug-artifacts-dir', debugArtifactsDir);
    }
    if (releaseArtifactsDir != null) {
      argv.push('--release-artifacts-dir', releaseArtifactsDir);
    }
    main(
      argv,
      prepare == null ? undefined : {prepareFlavoredFrameworks: prepare},
    );
  }

  it('prepares both flavors before generating the invariant Package.swift', () => {
    writeAppPkg();
    const debugArtifactsDir = writeArtifacts([
      'React',
      'ReactNativeDependencies',
      'hermes-engine',
      'ReactNativeHeaders',
      'ReactNativeDependenciesHeaders',
    ]);
    const releaseArtifactsDir = writeArtifacts([
      'React',
      'ReactNativeDependencies',
      'hermes-engine',
      'ReactNativeHeaders',
      'ReactNativeDependenciesHeaders',
    ]);
    const prepare = jest.fn(({appRoot: root}) => {
      fs.mkdirSync(path.join(root, 'build', 'xcframeworks'), {recursive: true});
    });
    try {
      run(debugArtifactsDir, releaseArtifactsDir, prepare);

      expect(process.exitCode).toBeUndefined();
      expect(prepare).toHaveBeenCalledWith({
        appRoot,
        debugArtifactsDir,
        releaseArtifactsDir,
      });

      const pkgSwift = path.join(
        appRoot,
        'build',
        'xcframeworks',
        'Package.swift',
      );
      expect(fs.existsSync(pkgSwift)).toBe(true);
      const contents = fs.readFileSync(pkgSwift, 'utf8');
      expect(contents).toContain('.library(name: "ReactHeaders"');
      expect(contents).not.toContain(
        '.binaryTarget(\n            name: "React",',
      );
    } finally {
      fs.rmSync(debugArtifactsDir, {recursive: true, force: true});
      fs.rmSync(releaseArtifactsDir, {recursive: true, force: true});
    }
  });

  it('requires Debug and Release together', () => {
    writeAppPkg();
    const artifactsDir = writeArtifacts([
      'React',
      'ReactNativeDependencies',
      'hermes-engine',
    ]);
    try {
      expect(() => run(artifactsDir, null, jest.fn())).toThrow(
        /both --debug-artifacts-dir and --release-artifacts-dir are required/,
      );
    } finally {
      fs.rmSync(artifactsDir, {recursive: true, force: true});
    }
  });

  it('throws when no package.json is found', () => {
    // No app package.json written.
    expect(() => run(null, null)).toThrow(/No package\.json/);
  });

  it('does not publish Package.swift if artifact preparation fails', () => {
    writeAppPkg();
    const debugDir = writeArtifacts([]);
    const releaseDir = writeArtifacts([]);
    try {
      expect(() =>
        run(debugDir, releaseDir, () => {
          throw new Error('invalid release artifacts');
        }),
      ).toThrow(/invalid release artifacts/);
      expect(
        fs.existsSync(
          path.join(appRoot, 'build', 'xcframeworks', 'Package.swift'),
        ),
      ).toBe(false);
    } finally {
      fs.rmSync(debugDir, {recursive: true, force: true});
      fs.rmSync(releaseDir, {recursive: true, force: true});
    }
  });

  it('auto-detects an existing build/xcframeworks without --artifacts-dir', () => {
    writeAppPkg();
    const xcfwDir = path.join(appRoot, 'build', 'xcframeworks');
    fs.mkdirSync(xcfwDir, {recursive: true});
    fs.writeFileSync(path.join(xcfwDir, 'Package.swift'), '// existing');
    run(null, null);
    // No artifacts-dir: it should leave the existing manifest untouched.
    expect(process.exitCode).toBeUndefined();
    expect(fs.readFileSync(path.join(xcfwDir, 'Package.swift'), 'utf8')).toBe(
      '// existing',
    );
  });
});
