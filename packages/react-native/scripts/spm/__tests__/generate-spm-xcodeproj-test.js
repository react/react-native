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
} = require('../generate-spm-xcodeproj');
const {execFileSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

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
