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

/**
 * Red tests for the SPM port of packages/react-native/scripts/cocoapods/autolinking.rb.
 *
 * The Ruby script (list_native_modules!) does the following:
 *   1. Accepts a config_command (default-documented as ['npx', '@react-native-community/cli', 'config'])
 *   2. Warns if config_command is empty / invalid (autolinking.rb:19-26)
 *   3. Captures stdout + exit status of the command (autolinking.rb:28)
 *   4. Warns if exit status is non-zero (autolinking.rb:30-37)
 *   5. Parses the JSON output (autolinking.rb:38)
 *   6. Derives output path = <config.project.ios.sourceDir>/build/generated/autolinking/autolinking.json (autolinking.rb:41-43)
 *   7. Creates the output directory if missing (autolinking.rb:46)
 *   8. Writes the RAW JSON string unchanged to that path (autolinking.rb:47)
 *
 * These tests assert the same surface for the JS port (generate-spm-autolinking-config.js),
 * which does not yet exist — so they are red by construction.
 */

const {
  generateAutolinkingConfig,
  resolveDefaultConfigCommand,
} = require('../generate-spm-autolinking-config');
const fs = require('fs');
const os = require('os');
const path = require('path');

let tmpProjects = [];

function makeTmpProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-autolink-config-'));
  tmpProjects.push(tmp);
  const projectRoot = path.join(tmp, 'project');
  const iosDir = path.join(projectRoot, 'ios');
  fs.mkdirSync(iosDir, {recursive: true});
  return {tmp, projectRoot, iosDir};
}

function fakeCliConfig(iosSourceDir) {
  return {
    root: path.dirname(iosSourceDir),
    reactNativePath: '../react-native',
    project: {
      ios: {sourceDir: iosSourceDir},
      android: {sourceDir: path.join(path.dirname(iosSourceDir), 'android')},
    },
    dependencies: {
      'react-native-test-library-apple': {
        name: 'react-native-test-library-apple',
        root: '/somewhere/react-native-test-library/apple',
        platforms: {
          ios: {
            podspecPath:
              '/somewhere/react-native-test-library/apple/TestLibraryApple.podspec',
            configurations: [],
            scriptPhases: [],
            version: '0.87.0-main',
          },
          android: null,
        },
      },
    },
  };
}

function autolinkingJsonPath(iosSourceDir) {
  return path.join(
    iosSourceDir,
    'build',
    'generated',
    'autolinking',
    'autolinking.json',
  );
}

// ---------------------------------------------------------------------------
// generateAutolinkingConfig
// ---------------------------------------------------------------------------

describe('generateAutolinkingConfig', () => {
  beforeEach(() => {
    tmpProjects = [];
  });

  afterEach(() => {
    for (const tmp of tmpProjects) {
      fs.rmSync(tmp, {recursive: true, force: true});
    }
  });

  it('writes the CLI config JSON to <project.ios.sourceDir>/build/generated/autolinking/autolinking.json (autolinking.rb:41-47)', () => {
    const {projectRoot, iosDir} = makeTmpProject();
    const raw = JSON.stringify(fakeCliConfig(iosDir));

    generateAutolinkingConfig({
      projectRoot,
      cliRunner: () => ({stdout: raw, stderr: '', exitCode: 0}),
    });

    const outPath = autolinkingJsonPath(iosDir);
    expect(fs.existsSync(outPath)).toBe(true);
    expect(fs.readFileSync(outPath, 'utf8')).toBe(raw);
  });

  it('writes the raw JSON unchanged — no filtering or reshaping of the upstream config (autolinking.rb:47)', () => {
    const {projectRoot, iosDir} = makeTmpProject();
    const cfg = fakeCliConfig(iosDir);
    const raw = JSON.stringify(cfg);

    generateAutolinkingConfig({
      projectRoot,
      cliRunner: () => ({stdout: raw, stderr: '', exitCode: 0}),
    });

    const parsed = JSON.parse(
      fs.readFileSync(autolinkingJsonPath(iosDir), 'utf8'),
    );
    // iOS dep preserved
    expect(
      parsed.dependencies['react-native-test-library-apple'].platforms.ios
        .podspecPath,
    ).toBe(
      cfg.dependencies['react-native-test-library-apple'].platforms.ios
        .podspecPath,
    );
    // Android section preserved (downstream consumer does its own iOS-only filtering)
    expect(parsed.project.android).toBeDefined();
    expect(
      parsed.dependencies['react-native-test-library-apple'].platforms.android,
    ).toBeNull();
  });

  it('creates the autolinking output directory if missing (autolinking.rb:46)', () => {
    const {projectRoot, iosDir} = makeTmpProject();
    const raw = JSON.stringify(fakeCliConfig(iosDir));

    expect(fs.existsSync(path.join(iosDir, 'build'))).toBe(false);

    generateAutolinkingConfig({
      projectRoot,
      cliRunner: () => ({stdout: raw, stderr: '', exitCode: 0}),
    });

    expect(
      fs.existsSync(path.join(iosDir, 'build', 'generated', 'autolinking')),
    ).toBe(true);
  });

  it('uses a no-install npx fallback when the local CLI cannot be resolved', () => {
    const {projectRoot, iosDir} = makeTmpProject();
    const raw = JSON.stringify(fakeCliConfig(iosDir));
    let receivedCommand /*: ?Array<string> */ = null;

    generateAutolinkingConfig({
      projectRoot,
      cliRunner: cmd => {
        receivedCommand = cmd;
        return {stdout: raw, stderr: '', exitCode: 0};
      },
    });

    expect(receivedCommand).toEqual([
      'npx',
      '--no-install',
      '@react-native-community/cli',
      'config',
    ]);
  });

  it('prefers the locally resolved React Native CLI over npx', () => {
    const {projectRoot} = makeTmpProject();
    const cliRoot = path.join(
      projectRoot,
      'node_modules',
      '@react-native-community',
      'cli',
    );
    fs.mkdirSync(path.join(cliRoot, 'build'), {recursive: true});
    fs.writeFileSync(
      path.join(cliRoot, 'package.json'),
      JSON.stringify({bin: {'rnc-cli': 'build/bin.js'}}),
    );
    fs.writeFileSync(path.join(cliRoot, 'build', 'bin.js'), '');

    expect(resolveDefaultConfigCommand(projectRoot)).toEqual([
      process.execPath,
      path.join(fs.realpathSync(cliRoot), 'build', 'bin.js'),
      'config',
    ]);
  });

  it('passes projectRoot as the CWD to the cliRunner', () => {
    const {projectRoot, iosDir} = makeTmpProject();
    const raw = JSON.stringify(fakeCliConfig(iosDir));
    let receivedCwd /*: ?string */ = null;

    generateAutolinkingConfig({
      projectRoot,
      cliRunner: (_cmd, opts) => {
        receivedCwd = opts && opts.cwd;
        return {stdout: raw, stderr: '', exitCode: 0};
      },
    });

    expect(receivedCwd).toBe(projectRoot);
  });

  it('throws when configCommand is empty (autolinking.rb:19-26)', () => {
    const {projectRoot} = makeTmpProject();
    expect(() =>
      generateAutolinkingConfig({
        projectRoot,
        configCommand: [],
        cliRunner: () => ({stdout: '{}', stderr: '', exitCode: 0}),
      }),
    ).toThrow(/config command/i);
  });

  it('throws when the CLI exits with a non-zero status (autolinking.rb:30-37)', () => {
    const {projectRoot} = makeTmpProject();
    expect(() =>
      generateAutolinkingConfig({
        projectRoot,
        cliRunner: () => ({
          stdout: '',
          stderr: 'cli failed',
          exitCode: 1,
        }),
      }),
    ).toThrow(/exit|status|1/i);
  });

  it('returns the parsed config, raw JSON, and path it wrote to', () => {
    const {projectRoot, iosDir} = makeTmpProject();
    const cfg = fakeCliConfig(iosDir);
    const raw = JSON.stringify(cfg);

    const returned = generateAutolinkingConfig({
      projectRoot,
      cliRunner: () => ({stdout: raw, stderr: '', exitCode: 0}),
    });

    expect(returned).toEqual({
      config: cfg,
      outputPath: autolinkingJsonPath(iosDir),
      rawJson: raw,
    });
  });
});
