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
  checkArchiveEntries,
  fbjniVersionFromCatalog,
  fbjniVersionFromPom,
  publishedArtifactUrls,
  publishedLayout,
} = require('../artifacts');
const {execFileSync} = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const LAYOUTS_DIR = path.join(__dirname, '__fixtures__', 'layouts');
const MAVEN = 'https://repo1.maven.org/maven2';
const ARTIFACTS = `${MAVEN}/com/facebook/react/react-native-artifacts/0.88.1`;

describe('publishedArtifactUrls', () => {
  test.each([['debug'], ['release']])(
    'names the iOS %s core, which has the headers, and dependencies headers',
    buildType => {
      expect(
        publishedArtifactUrls(
          '0.88.1',
          'ios',
          buildType === 'debug' ? 'debug' : 'release',
        ),
      ).toEqual([
        `${ARTIFACTS}/react-native-artifacts-0.88.1-reactnative-core-${buildType}.tar.gz`,
        `${ARTIFACTS}/react-native-artifacts-0.88.1-reactnative-dependencies-headers-${buildType}.tar.gz`,
      ]);
    },
  );

  test.each([['debug'], ['release']])('names the Android %s AAR', buildType => {
    expect(
      publishedArtifactUrls(
        '0.88.1',
        'android',
        buildType === 'debug' ? 'debug' : 'release',
      ),
    ).toEqual([
      `${MAVEN}/com/facebook/react/react-android/0.88.1/react-android-0.88.1-${buildType}.aar`,
    ]);
  });
});

describe('fbjni version', () => {
  test('reads the fbjni dependency of the react-android POM', () => {
    const pom = `
      <dependency>
        <groupId>com.facebook.yoga</groupId>
        <artifactId>proguard-annotations</artifactId>
        <version>1.19.0</version>
      </dependency>
      <dependency>
        <groupId>com.facebook.fbjni</groupId>
        <artifactId>fbjni</artifactId>
        <version>0.7.0</version>
        <scope>compile</scope>
      </dependency>`;

    expect(fbjniVersionFromPom(pom)).toBe('0.7.0');
    expect(() => fbjniVersionFromPom('<project />')).toThrow(/fbjni/);
  });

  test('reads the fbjni version of the Gradle version catalog', () => {
    const catalog = fs.readFileSync(
      path.join(
        LAYOUTS_DIR,
        'source/packages/react-native/gradle/libs.versions.toml',
      ),
      'utf8',
    );

    expect(fbjniVersionFromCatalog(catalog)).toBe('0.7.0');
    expect(() => fbjniVersionFromCatalog('[versions]\n')).toThrow(/fbjni/);
  });
});

describe('publishedLayout', () => {
  let cacheDir = '';
  let sourceDir = '';

  beforeEach(() => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-cache-'));
    sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-archives-'));
  });

  afterEach(() => {
    fs.rmSync(cacheDir, {recursive: true});
    fs.rmSync(sourceDir, {recursive: true});
  });

  /** Packs the iOS fixture as the two published iOS archives. */
  function packIos(dir: string, version: string, buildType: string) {
    const prefix = `react-native-artifacts-${version}`;
    const react = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-core-'));
    const reactHeaders = path.join(
      react,
      'React.xcframework/ios-arm64/React.framework/Headers',
    );
    fs.mkdirSync(reactHeaders, {recursive: true});
    fs.writeFileSync(path.join(reactHeaders, 'RCTDefines.h'), '#pragma once\n');
    execFileSync('tar', [
      '-czf',
      path.join(dir, `${prefix}-reactnative-core-${buildType}.tar.gz`),
      '-C',
      path.join(LAYOUTS_DIR, 'maven-ios'),
      'ReactNativeHeaders.xcframework',
      '-C',
      react,
      'React.xcframework',
    ]);
    fs.rmSync(react, {recursive: true});
    const deps = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-deps-'));
    const depsHeaders = path.join(
      deps,
      'packages/react-native/third-party',
      'ReactNativeDependenciesHeaders.xcframework/ios-arm64/Headers/folly',
    );
    fs.mkdirSync(depsHeaders, {recursive: true});
    fs.writeFileSync(path.join(depsHeaders, 'Folly.h'), '#pragma once\n');
    execFileSync('tar', [
      '-czf',
      path.join(
        dir,
        `${prefix}-reactnative-dependencies-headers-${buildType}.tar.gz`,
      ),
      '-C',
      deps,
      'packages',
    ]);
    fs.rmSync(deps, {recursive: true});
  }

  const IOS_HEADERS = [
    'React/RCTDefines.h',
    'folly/Folly.h',
    'react/cxxstableapi/UmbrellaGuard.h',
    'react/featureflags/Flags.h',
    'react/renderer/core/Props.h',
    'react/renderer/view/HostProps.h',
  ];

  test('uses the archives in the cache without downloading them', async () => {
    packIos(cacheDir, '0.88.1', 'release');
    const download = jest.fn(() =>
      Promise.reject(new Error('downloaded a cached archive')),
    );

    const layout = await publishedLayout(
      {version: '0.88.1', platform: 'ios', buildType: 'release', cacheDir},
      download,
    );

    expect(download).not.toHaveBeenCalled();
    expect([...layout.headers.keys()].sort()).toEqual(IOS_HEADERS);
    expect(layout.frameworkDirs).toHaveLength(1);
    expect(layout.headers.get('React/RCTDefines.h')).toBe(
      path.join(
        layout.frameworkDirs[0],
        'React.framework/Headers/RCTDefines.h',
      ),
    );
    expect(layout.includeDirs).toHaveLength(2);
    for (const [includePath, file] of layout.headers) {
      if (!includePath.startsWith('React/')) {
        expect(file).toBe(
          path.join(
            layout.includeDirs[includePath.startsWith('folly/') ? 1 : 0],
            includePath,
          ),
        );
      }
    }
  });

  /** Writes the Maven `.sha1` file of each archive in `dir`. */
  function writeChecksums(dir: string) {
    for (const name of fs.readdirSync(dir)) {
      const sha1 = crypto
        .createHash('sha1')
        .update(fs.readFileSync(path.join(dir, name)))
        .digest('hex');
      fs.writeFileSync(path.join(dir, `${name}.sha1`), sha1);
    }
  }

  /** Downloads from `sourceDir`, by the file name of the URL. */
  const downloadFromSourceDir = () =>
    jest.fn((url: string, destination: string) => {
      fs.copyFileSync(path.join(sourceDir, path.basename(url)), destination);
      return Promise.resolve();
    });

  test('downloads the archives that are not in the cache', async () => {
    packIos(sourceDir, '0.88.1', 'debug');
    writeChecksums(sourceDir);
    const download = downloadFromSourceDir();

    const layout = await publishedLayout(
      {version: '0.88.1', platform: 'ios', buildType: 'debug', cacheDir},
      download,
    );
    await publishedLayout(
      {version: '0.88.1', platform: 'ios', buildType: 'debug', cacheDir},
      download,
    );

    const urls = publishedArtifactUrls('0.88.1', 'ios', 'debug');
    expect(download.mock.calls.map(([url]) => url).sort()).toEqual(
      [...urls, ...urls.map(url => `${url}.sha1`)].sort(),
    );
    expect(
      urls.every(url => fs.existsSync(path.join(cacheDir, path.basename(url)))),
    ).toBe(true);
    expect([...layout.headers.keys()].sort()).toEqual(IOS_HEADERS);
  });

  test('deletes a download whose SHA-1 does not match and fails', async () => {
    packIos(sourceDir, '0.88.1', 'debug');
    writeChecksums(sourceDir);
    const [core] = publishedArtifactUrls('0.88.1', 'ios', 'debug');
    fs.writeFileSync(
      path.join(sourceDir, `${path.basename(core)}.sha1`),
      '0000000000000000000000000000000000000000  core.tar.gz\n',
    );

    await expect(
      publishedLayout(
        {version: '0.88.1', platform: 'ios', buildType: 'debug', cacheDir},
        downloadFromSourceDir(),
      ),
    ).rejects.toThrow(/SHA-1/);
    expect(
      fs.readdirSync(cacheDir).filter(name => name.includes('-core-')),
    ).toEqual([]);
  });

  test.each([['../Escape.h'], ['Headers/../../Escape.h'], ['/etc/Escape.h']])(
    'rejects the archive path %s, which is outside the archive folder',
    entry => {
      expect(() =>
        checkArchiveEntries('core.tar.gz', ['Headers/Ok.h', entry]),
      ).toThrow(entry);
    },
  );

  test('accepts archive paths with dots in names', () => {
    expect(() =>
      checkArchiveEntries('core.tar.gz', ['Headers/a..b.h', './Headers/c.h']),
    ).not.toThrow();
  });

  test('keeps the case of include paths that the file system merges', async () => {
    // One folder per header, so that the AAR has both `React/` and `react/`
    // where the file system has one of them.
    for (const header of ['react/renderer/Props.h', 'React/RCTDefines.h']) {
      const aar = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-aar-'));
      const file = path.join(aar, 'prefab/modules/reactnative/include', header);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, '#pragma once\n');
      fs.writeFileSync(path.join(aar, 'classes.jar'), '');
      execFileSync(
        'zip',
        ['-qr', path.join(cacheDir, 'react-android-0.88.1-release.aar'), '.'],
        {cwd: aar},
      );
      fs.rmSync(aar, {recursive: true});
    }
    fs.writeFileSync(
      path.join(cacheDir, 'react-android-0.88.1.pom'),
      '<artifactId>fbjni</artifactId><version>0.7.0</version>',
    );
    const fbjni = fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-fbjni-'));
    const fbjniInclude = path.join(fbjni, 'prefab/modules/fbjni/include/fbjni');
    fs.mkdirSync(fbjniInclude, {recursive: true});
    fs.writeFileSync(path.join(fbjniInclude, 'fbjni.h'), '#pragma once\n');
    execFileSync('zip', ['-qr', path.join(cacheDir, 'fbjni-0.7.0.aar'), '.'], {
      cwd: fbjni,
    });
    fs.rmSync(fbjni, {recursive: true});

    const layout = await publishedLayout(
      {version: '0.88.1', platform: 'android', buildType: 'release', cacheDir},
      () => Promise.reject(new Error('downloaded a cached archive')),
    );

    expect([...layout.headers.keys()].sort()).toEqual([
      'React/RCTDefines.h',
      'fbjni/fbjni.h',
      'react/renderer/Props.h',
    ]);
    expect(
      layout.includeDirs.map(dir => path.basename(path.dirname(dir))),
    ).toEqual(['reactnative', 'fbjni']);
  });
});
