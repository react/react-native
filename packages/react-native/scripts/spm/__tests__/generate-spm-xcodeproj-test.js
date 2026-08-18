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
  addPreActionToScheme,
  buildEmbedFrameworksScript,
  buildSchemePreActionScript,
  buildSyncAutolinkingScript,
  flavorForBuildConfiguration,
  frameworkConditionalSettings,
  generateXcscheme,
  readScriptPhasesManifest,
} = require('../generate-spm-xcodeproj');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const FRAMEWORK = {
  id: 'react',
  frameworkName: 'React',
  executableName: 'React',
  artifactRelativePath: 'React.xcframework',
  slices: [
    {
      sdk: 'iphoneos*',
      platform: 'ios',
      variant: null,
      architectures: ['arm64'],
      libraryIdentifier: 'ios-arm64',
      libraryPath: 'React.framework',
      binaryPath: 'React.framework/React',
    },
    {
      sdk: 'iphonesimulator*',
      platform: 'ios',
      variant: 'simulator',
      architectures: ['arm64', 'x86_64'],
      libraryIdentifier: 'ios-arm64_x86_64-simulator',
      libraryPath: 'React.framework',
      binaryPath: 'React.framework/React',
    },
    {
      sdk: 'macosx*',
      platform: 'ios',
      variant: 'maccatalyst',
      architectures: ['arm64', 'x86_64'],
      libraryIdentifier: 'ios-arm64_x86_64-maccatalyst',
      libraryPath: 'React.framework',
      binaryPath: 'React.framework/React',
    },
  ],
};

describe('scheme pre-action', () => {
  it('contains the sync script and target-scoped build environment', () => {
    const result = generateXcscheme(
      'MyApp',
      'TARGET_UUID',
      'MyApp',
      'SYNC_SENTINEL',
    );
    expect(result).toContain('<PreActions>');
    expect(result).toContain('SYNC_SENTINEL');
    expect(result).toContain('<EnvironmentBuildable>');
    expect(result).toContain('BlueprintIdentifier = "TARGET_UUID"');
  });

  it('XML-escapes the shell script', () => {
    const result = generateXcscheme(
      'MyApp',
      'TARGET_UUID',
      'MyApp',
      'echo "x" > /tmp/x 2>&1 < /tmp/in',
    );
    expect(result).toContain('&quot;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
  });

  it('refreshes stale script text and is idempotent', () => {
    const first = generateXcscheme(
      'MyApp',
      'TARGET_UUID',
      'MyApp',
      'OLD_SCRIPT',
    );
    const updated = addPreActionToScheme(first, 'TARGET_UUID', 'NEW_SCRIPT');
    expect(updated).toContain('NEW_SCRIPT');
    expect(updated).not.toContain('OLD_SCRIPT');
    expect(addPreActionToScheme(updated, 'TARGET_UUID', 'NEW_SCRIPT')).toBe(
      updated,
    );
  });
});

describe('sync scripts', () => {
  const baked = '../node_modules/react-native';
  const script = buildSyncAutolinkingScript(baked);

  it('resolves Node and React Native at build time and dispatches sync', () => {
    expect(script).toContain('NODE_BINARY="${NODE_BINARY:-}"');
    expect(script).toContain('. "$SRCROOT/.xcode.env"');
    expect(script).toContain(
      "require('path').dirname(require.resolve('react-native/package.json'))",
    );
    expect(script).toContain(
      '"$NODE_BINARY" "$RN_DIR/scripts/setup-apple-spm.js" sync',
    );
    expect(script).toContain('npx react-native spm sync');
  });

  it('does not select or mutate runtime framework flavors', () => {
    expect(script).not.toContain('swap-flavor');
    expect(script).not.toContain('RN_SPM_FLAVOR');
    expect(script).not.toContain('React.xcframework');
    expect(script).not.toContain('BUILT_PRODUCTS_DIR');
  });

  it('watches mixed directories/files and treats vanished paths as stale', () => {
    expect(script).toContain('if [ -d "$P" ]; then');
    expect(script).toContain('elif [ -f "$P" ]; then');
    expect(script).toContain(
      'WATCH_FILE="$SRCROOT/build/generated/autolinking/.spm-sync-watch-paths"',
    );
  });

  it('is deterministic, shared with the pre-action, and valid POSIX shell', () => {
    expect(buildSyncAutolinkingScript(baked)).toBe(script);
    expect(buildSchemePreActionScript(baked)).toBe(script);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-sync-script-'));
    const file = path.join(dir, 'sync.sh');
    fs.writeFileSync(file, script);
    try {
      expect(() => execFileSync('/bin/sh', ['-n', file])).not.toThrow();
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
});

describe('configuration-driven framework settings', () => {
  it.each([
    ['Debug', 'debug'],
    ['MyDEBUGBuild', 'debug'],
    ['Development', 'debug'],
    ['MyDevelopmentConfig', 'debug'],
    ['Release', 'release'],
    ['Staging', 'release'],
    ['Production', 'release'],
  ])('maps %s to %s', (configuration, expected) => {
    expect(flavorForBuildConfiguration(configuration)).toBe(expected);
  });

  it('emits SDK-qualified exact framework, binary, and search paths', () => {
    const settings = frameworkConditionalSettings([FRAMEWORK]);
    const serialized = JSON.stringify(settings);
    expect(serialized).toContain('RN_SPM_REACT_FRAMEWORK[sdk=iphoneos*]');
    expect(serialized).toContain('RN_SPM_REACT_BINARY[sdk=iphonesimulator*]');
    expect(serialized).toContain(
      '$(SRCROOT)/build/xcframeworks/$(RN_SPM_FLAVOR)/React.xcframework/ios-arm64',
    );
    expect(serialized).toContain('RN_SPM_REACT_SEARCH_PATH[sdk=macosx*]');
  });

  it('uses architecture conditions when one SDK has disjoint slices', () => {
    const split = {
      ...FRAMEWORK,
      slices: [
        {...FRAMEWORK.slices[1], architectures: ['arm64']},
        {
          ...FRAMEWORK.slices[1],
          architectures: ['x86_64'],
          libraryIdentifier: 'ios-x86_64-simulator',
        },
      ],
    };
    const serialized = JSON.stringify(frameworkConditionalSettings([split]));
    expect(serialized).toContain(
      'RN_SPM_REACT_FRAMEWORK[sdk=iphonesimulator*][arch=arm64]',
    );
    expect(serialized).toContain(
      'RN_SPM_REACT_FRAMEWORK[sdk=iphonesimulator*][arch=x86_64]',
    );
  });
});

describe('embed framework phase script', () => {
  const script = buildEmbedFrameworksScript([FRAMEWORK]);

  it('validates, rsyncs, and signs the exact selected framework', () => {
    expect(script).toContain(
      'validate_framework "${RN_SPM_REACT_FRAMEWORK:-}" "React.framework"',
    );
    expect(script).toContain(
      'copy_and_sign "${RN_SPM_REACT_FRAMEWORK:-}" "React.framework"',
    );
    expect(script.indexOf('validate_framework "${RN_SPM_REACT')).toBeLessThan(
      script.indexOf('copy_and_sign "${RN_SPM_REACT'),
    );
    expect(script).toContain('/usr/bin/rsync -a --delete');
    expect(script).toContain('EXPANDED_CODE_SIGN_IDENTITY');
    expect(script).toContain('/usr/bin/codesign --force --sign -');
    expect(script).toContain('CODE_SIGNING_ALLOWED:-YES');
  });

  it('reports configuration, framework, SDK, and selected source on failure', () => {
    expect(script).toContain("framework '$name' is unavailable");
    expect(script).toContain("configuration '$CONFIGURATION'");
    expect(script).toContain("SDK '$SDK_NAME': $source");
  });

  it('uses no Node, network, symlink mutation, or SwiftPM cache path', () => {
    expect(script).not.toContain('node');
    expect(script).not.toContain('curl');
    expect(script).not.toContain('ln -s');
    expect(script).not.toContain('SourcePackages');
  });
});

describe('readScriptPhasesManifest', () => {
  let appRoot;
  let logSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-script-phases-'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(appRoot, {recursive: true, force: true});
  });

  const write = contents => {
    const dir = path.join(appRoot, 'build', 'generated', 'autolinking');
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(
      path.join(dir, '.spm-plugin-script-phases.json'),
      contents,
      'utf8',
    );
  };

  it('is [] when the manifest does not exist (first `spm add`)', () => {
    expect(readScriptPhasesManifest(appRoot)).toEqual([]);
  });

  it('is [] for unparseable JSON, warning about it', () => {
    write('{not json');
    expect(readScriptPhasesManifest(appRoot)).toEqual([]);
    expect(
      logSpy.mock.calls.some(([msg]) =>
        /could not parse .*\.spm-plugin-script-phases\.json/.test(msg),
      ),
    ).toBe(true);
  });

  it('is [] for a non-array payload', () => {
    write('{"id": "x"}');
    expect(readScriptPhasesManifest(appRoot)).toEqual([]);
  });

  it('parses valid entries and defaults position to end', () => {
    write(
      JSON.stringify([
        {
          id: 'expo-constants.generate-app-config',
          name: 'Generate Expo App Config',
          script: 'node ./write-app-config.js',
          position: 'beforeCompile',
          inputPaths: ['$(SRCROOT)/../app.config.js'],
          outputPaths: ['$(DERIVED_FILE_DIR)/app.config'],
          alwaysOutOfDate: true,
        },
        {id: 'b.stamp', name: 'Stamp', script: 'echo hi'},
      ]),
    );
    expect(readScriptPhasesManifest(appRoot)).toEqual([
      {
        id: 'expo-constants.generate-app-config',
        name: 'Generate Expo App Config',
        script: 'node ./write-app-config.js',
        position: 'beforeCompile',
        inputPaths: ['$(SRCROOT)/../app.config.js'],
        outputPaths: ['$(DERIVED_FILE_DIR)/app.config'],
        alwaysOutOfDate: true,
      },
      {id: 'b.stamp', name: 'Stamp', script: 'echo hi', position: 'end'},
    ]);
  });

  it('skips malformed entries and duplicate ids, keeping the valid ones', () => {
    write(
      JSON.stringify([
        {name: 'No id', script: 'echo'},
        {id: 'a', name: 'A', script: 'echo one'},
        {id: 'a', name: 'A again', script: 'echo two'},
        null,
      ]),
    );
    expect(readScriptPhasesManifest(appRoot)).toEqual([
      {id: 'a', name: 'A', script: 'echo one', position: 'end'},
    ]);
  });

  // The same ids the plugin contract accepts: a scoped npm name is the natural
  // stable key for a package-owned phase.
  it.each([['@expo/log-box'], ['@expo/ui']])(
    'keeps the scoped npm name %s as an id',
    id => {
      write(JSON.stringify([{id, name: 'X', script: 'echo'}]));
      expect(readScriptPhasesManifest(appRoot)).toEqual([
        {id, name: 'X', script: 'echo', position: 'end'},
      ]);
    },
  );

  it.each([
    // `:` is excluded so the `plugin:<id>` UUID seed stays unambiguous.
    ['an id with a colon', {id: 'a:b', name: 'X', script: 'echo'}],
    ['an id with a space', {id: 'a b', name: 'X', script: 'echo'}],
    ['the reserved id __proto__', {id: '__proto__', name: 'X', script: 'echo'}],
    [
      'the reserved id constructor',
      {id: 'constructor', name: 'X', script: 'echo'},
    ],
    ['the reserved id prototype', {id: 'prototype', name: 'X', script: 'echo'}],
    [
      'an unknown position',
      {id: 'a', name: 'X', script: 'echo', position: 'afterLink'},
    ],
    // A line break is the one thing no Xcode phase name can carry. This reader
    // is the only gate on a stale or hand-edited sidecar.
    ['a name with a newline', {id: 'a', name: 'L1\nL2', script: 'echo'}],
    [
      'a name with a carriage return',
      {id: 'a', name: 'L1\rL2', script: 'echo'},
    ],
  ])('skips an entry with %s', (_label, entry) => {
    write(JSON.stringify([entry, {id: 'keep', name: 'Keep', script: 'echo'}]));
    expect(readScriptPhasesManifest(appRoot)).toEqual([
      {id: 'keep', name: 'Keep', script: 'echo', position: 'end'},
    ]);
  });

  // The injector normalizes the name for the `/* … */` comments and escapes it
  // in the `name` field, so a pbxproj-hostile name needs no coercion here.
  it.each([
    ['needs pbxproj quoting', 'Bundle "app.config"'],
    ['closes a comment', 'Bad */ = { x'],
    ['opens a comment', 'Bad /* x'],
  ])('keeps a name that %s', (_label, name) => {
    write(JSON.stringify([{id: 'a', name, script: 'echo'}]));
    expect(readScriptPhasesManifest(appRoot)).toEqual([
      {id: 'a', name, script: 'echo', position: 'end'},
    ]);
  });

  it('drops non-string and empty input/output path entries', () => {
    write(
      JSON.stringify([
        {
          id: 'a',
          name: 'A',
          script: 'echo',
          inputPaths: ['$(SRCROOT)/in', '', 7, null, '$(SRCROOT)/in2'],
          outputPaths: [{}, '$(DERIVED_FILE_DIR)/out'],
        },
        {id: 'b', name: 'B', script: 'echo', inputPaths: 'not-an-array'},
      ]),
    );
    expect(readScriptPhasesManifest(appRoot)).toEqual([
      {
        id: 'a',
        name: 'A',
        script: 'echo',
        position: 'end',
        inputPaths: ['$(SRCROOT)/in', '$(SRCROOT)/in2'],
        outputPaths: ['$(DERIVED_FILE_DIR)/out'],
      },
      {id: 'b', name: 'B', script: 'echo', position: 'end'},
    ]);
  });
});
