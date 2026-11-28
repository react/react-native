/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const {
  androidSourceLayout,
  iosSourceLayout,
  prefabHeaderRules,
} = require('../source');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const LAYOUTS_DIR = path.join(__dirname, '__fixtures__', 'layouts');
const PACKAGE_DIR = path.join(LAYOUTS_DIR, 'source/packages/react-native');

/** The files under `dir`, by their paths below it. */
function filesUnder(dir: string): Array<string> {
  return fs
    .readdirSync(dir, {recursive: true, encoding: 'utf8'})
    .filter(entry => fs.statSync(path.join(dir, entry)).isFile())
    .map(entry => entry.split(path.sep).join('/'))
    .sort();
}

describe('prefabHeaderRules', () => {
  test('reads the source folders of each prefab module', () => {
    const script = fs.readFileSync(
      path.join(PACKAGE_DIR, 'ReactAndroid/build.gradle.kts'),
      'utf8',
    );

    expect(prefabHeaderRules(script)).toEqual([
      {module: 'jsi', from: '../ReactCommon/jsi/', prefix: ''},
      {module: 'reactnative', from: '../ReactCommon/react/', prefix: 'react/'},
      {
        module: 'reactnative',
        from: '../ReactCommon/react/renderer/view/platform/android/',
        prefix: '',
      },
      {
        module: 'reactnative',
        from: '../ReactCommon/jsi/jsi/jsi.h',
        prefix: 'react/fabric/',
      },
      {module: 'reactnative', from: 'src/main/jni/react/missing', prefix: ''},
    ]);
  });

  test('rejects a rule it cannot read', () => {
    expect(() =>
      prefabHeaderRules(
        'PrefabPreprocessingEntry("jsi", Pair(jsiHeaders, ""))',
      ),
    ).toThrow(/Pair\(jsiHeaders, ""\)/);
  });

  test('rejects a script without prefab rules', () => {
    expect(() => prefabHeaderRules('android {}')).toThrow(/prefab/);
  });
});

describe('source layouts', () => {
  let outDir = '';

  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-source-'));
  });

  afterEach(() => {
    fs.rmSync(outDir, {recursive: true});
  });

  test('lays out Android headers as the prefab modules do', () => {
    const mavenModules = path.join(LAYOUTS_DIR, 'maven-android/prefab/modules');

    const layout = androidSourceLayout(PACKAGE_DIR, outDir);

    expect(layout.includeDirs).toEqual(
      ['jsi', 'reactnative'].map(module => path.join(outDir, module)),
    );
    expect([...layout.headers.keys()].sort()).toEqual(
      [
        ...filesUnder(path.join(mavenModules, 'jsi/include')),
        ...filesUnder(path.join(mavenModules, 'reactnative/include')),
      ].sort(),
    );
    expect(filesUnder(path.join(outDir, 'reactnative'))).toEqual(
      filesUnder(path.join(mavenModules, 'reactnative/include')),
    );
    expect(
      fs.readFileSync(
        layout.headers.get('react/renderer/view/HostProps.h') ?? '',
        'utf8',
      ),
    ).toBe(
      fs.readFileSync(
        path.join(
          PACKAGE_DIR,
          'ReactCommon/react/renderer/view/platform/android/react/renderer/view/HostProps.h',
        ),
        'utf8',
      ),
    );
  });

  test('lays out iOS headers as the headers spec places them', () => {
    const headers =
      'maven-ios/ReactNativeHeaders.xcframework/ios-arm64/Headers';
    const entries = [
      ...filesUnder(path.join(LAYOUTS_DIR, headers)).map(relPath => ({
        relPath,
        naturalPath: relPath,
        source: path.join(
          'ReactCommon',
          relPath === 'react/renderer/view/HostProps.h'
            ? 'react/renderer/view/platform/ios/react/renderer/view/HostProps.h'
            : relPath,
        ),
      })),
      {
        relPath: 'CoreModules/RCTRedirected.h',
        naturalPath: 'CoreModules/RCTRedirected.h',
        source: 'React/CoreModules/RCTRedirected.h',
        redirectTo: 'React/RCTRedirected.h',
      },
    ];

    const react = [
      {
        relPath: 'RCTDefines.h',
        naturalPath: 'React/RCTDefines.h',
        source: 'ReactCommon/jsi/jsi/jsi.h',
      },
    ];

    const layout = iosSourceLayout(PACKAGE_DIR, outDir, {
      reactNativeHeaders: entries,
      react,
    });

    expect(layout.includeDirs).toEqual([path.join(outDir, 'Headers')]);
    expect(layout.frameworkDirs).toEqual([path.join(outDir, 'Frameworks')]);
    expect(layout.headers.get('React/RCTDefines.h')).toBe(
      path.join(outDir, 'Frameworks/React.framework/Headers/RCTDefines.h'),
    );
    expect([...layout.headers.keys()].sort()).toEqual([
      'CoreModules/RCTRedirected.h',
      'React/RCTDefines.h',
      ...filesUnder(path.join(LAYOUTS_DIR, headers)),
    ]);
    expect(filesUnder(layout.includeDirs[0])).toEqual(
      [...layout.headers.keys()]
        .filter(header => !header.startsWith('React/'))
        .sort(),
    );
    expect(
      fs.readFileSync(
        layout.headers.get('CoreModules/RCTRedirected.h') ?? '',
        'utf8',
      ),
    ).toContain('#import <React/RCTRedirected.h>');
  });
});
