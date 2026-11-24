/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const SLICES = [
  'ios-arm64',
  'ios-arm64_x86_64-simulator',
  'ios-arm64_x86_64-maccatalyst',
];

const mockCalls /*: Array<string> */ = [];
const mockSignedSlices = new Set(['ios-arm64_x86_64-simulator']);
const mockSliceOf = (p /*: string */) /*: ?string */ =>
  SLICES.find(slice => p.split('/').includes(slice));

jest.mock(
  '../../codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS',
  () => ({generateFBReactNativeSpecIOS: jest.fn()}),
);
jest.mock('../headers-compose', () => ({
  computeSpecPlan: jest.fn(),
  emitReactFrameworkHeaders: jest.fn(() => {
    mockCalls.push('emitReactFrameworkHeaders');
  }),
  buildReactNativeHeadersXcframework: jest.fn(
    (dir /*: string */) => `${dir}/ReactNativeHeaders.xcframework`,
  ),
}));
jest.mock('node:child_process', () => {
  const mockFs = require('node:fs');
  const mockPath = require('node:path');
  return {
    execSync: jest.fn((command /*: string */) => {
      mockCalls.push(command);
      const createMatch = command.match(/-output (\S+)/);
      if (command.startsWith('xcodebuild -create-xcframework') && createMatch) {
        for (const slice of SLICES) {
          const framework = mockPath.join(
            createMatch[1],
            slice,
            'React.framework',
          );
          if (slice.endsWith('maccatalyst')) {
            const versionDir = mockPath.join(framework, 'Versions', 'A');
            mockFs.mkdirSync(versionDir, {recursive: true});
            mockFs.writeFileSync(mockPath.join(versionDir, 'React'), '');
            mockFs.symlinkSync(
              'A',
              mockPath.join(framework, 'Versions', 'Current'),
            );
            mockFs.symlinkSync(
              'Versions/Current/React',
              mockPath.join(framework, 'React'),
            );
          } else {
            mockFs.mkdirSync(framework, {recursive: true});
            mockFs.writeFileSync(mockPath.join(framework, 'React'), '');
          }
        }
      }
      if (command.startsWith('vtool')) {
        return Buffer.from(`platform ${mockSliceOf(command) ?? ''}\n`);
      }
      return Buffer.from('');
    }),
    execFileSync: jest.fn((file /*: string */, args /*: Array<string> */) => {
      mockCalls.push([file, ...args].join(' '));
      if (
        file === 'codesign' &&
        args[0] === '-d' &&
        !mockSignedSlices.has(mockSliceOf(args[1]) ?? '')
      ) {
        throw new Error('code object is not signed at all');
      }
    }),
  };
});

const {buildXCFrameworks, resolveHermesHeaders} = require('../xcframework');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('resolveHermesHeaders', () => {
  let tmp /*: string */ = '';
  let buildFolder /*: string */ = '';

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xcframework-test-'));
    buildFolder = path.join(tmp, '.build');
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  test('returns the base include directory when hermes/hermes.h exists', () => {
    const includeDir = path.join(
      buildFolder,
      'artifacts',
      'hermes',
      'destroot',
      'include',
    );
    fs.mkdirSync(path.join(includeDir, 'hermes'), {recursive: true});
    fs.writeFileSync(path.join(includeDir, 'hermes', 'hermes.h'), '');

    expect(resolveHermesHeaders(buildFolder, true)).toBe(includeDir);
  });

  test('finds a non-standard nested include directory', () => {
    const includeDir = path.join(
      buildFolder,
      'artifacts',
      'hermes',
      'nested',
      'archive',
      'destroot',
      'include',
    );
    fs.mkdirSync(path.join(includeDir, 'hermes'), {recursive: true});
    fs.writeFileSync(path.join(includeDir, 'hermes', 'hermes.h'), '');

    expect(resolveHermesHeaders(buildFolder, true)).toBe(includeDir);
  });

  test('returns null when Hermes headers are absent and not required', () => {
    expect(resolveHermesHeaders(buildFolder, false)).toBeNull();
  });

  test('throws when Hermes headers are absent and required', () => {
    expect(() => resolveHermesHeaders(buildFolder, true)).toThrow(
      /ReactNativeHeaders[\s\S]*<hermes\/\.\.\.>[\s\S]*destroot\/include/,
    );
  });
});

describe('buildXCFrameworks symbol stripping', () => {
  let tmp /*: string */ = '';
  let buildFolder /*: string */ = '';
  let frameworkFolders /*: Array<string> */ = [];

  const xcframeworkPath = (buildType /*: string */) =>
    path.join(
      buildFolder,
      'output',
      'xcframeworks',
      buildType,
      'React.xcframework',
    );

  const sliceBinary = (buildType /*: string */, slice /*: string */) =>
    slice.endsWith('maccatalyst')
      ? path.join(
          xcframeworkPath(buildType),
          slice,
          'React.framework',
          'Versions',
          'A',
          'React',
        )
      : path.join(
          xcframeworkPath(buildType),
          slice,
          'React.framework',
          'React',
        );

  const dSYMPath = (slice /*: string */) =>
    path.join(tmp, 'products', slice, 'Products', 'React.framework.dSYM');

  const stripCalls = () => mockCalls.filter(c => c.startsWith('xcrun strip'));

  beforeEach(() => {
    mockCalls.length = 0;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    tmp = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'xcframework-strip-test-')),
    );
    buildFolder = path.join(tmp, '.build');
    frameworkFolders = SLICES.map(slice =>
      path.join(
        tmp,
        'products',
        slice,
        'Products',
        'PackageFrameworks',
        'React.framework',
      ),
    );
    SLICES.forEach(slice => fs.mkdirSync(dSYMPath(slice), {recursive: true}));
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
    jest.restoreAllMocks();
  });

  test('strips local symbols from every Release slice after its dSYM is copied', () => {
    buildXCFrameworks(tmp, buildFolder, frameworkFolders, 'Release', null);

    expect(stripCalls()).toEqual(
      SLICES.map(slice => `xcrun strip -x ${sliceBinary('Release', slice)}`),
    );
    for (const slice of SLICES) {
      const copyIndex = mockCalls.findIndex(
        c => c.startsWith('cp -r') && c.includes(dSYMPath(slice)),
      );
      const stripIndex = mockCalls.indexOf(
        `xcrun strip -x ${sliceBinary('Release', slice)}`,
      );
      expect(copyIndex).toBeGreaterThanOrEqual(0);
      expect(stripIndex).toBeGreaterThan(copyIndex);
    }
  });

  test('strips and re-signs after the framework headers are emitted and before signing', () => {
    const slice = 'ios-arm64_x86_64-simulator';
    const framework = path.join(
      xcframeworkPath('Release'),
      slice,
      'React.framework',
    );

    buildXCFrameworks(
      tmp,
      buildFolder,
      frameworkFolders,
      'Release',
      'Test Identity',
    );

    const emitIndex = mockCalls.indexOf('emitReactFrameworkHeaders');
    const firstStrip = mockCalls.findIndex(c => c.startsWith('xcrun strip'));
    const resignIndex = mockCalls.indexOf(
      `codesign --force --sign - ${framework}`,
    );
    const firstSign = mockCalls.findIndex(c =>
      c.startsWith('codesign --timestamp'),
    );
    expect(emitIndex).toBeGreaterThanOrEqual(0);
    expect(firstStrip).toBeGreaterThan(emitIndex);
    expect(resignIndex).toBeGreaterThan(firstStrip);
    expect(firstSign).toBeGreaterThan(resignIndex);
  });

  test('strips before the tarball is created', () => {
    buildXCFrameworks(tmp, buildFolder, frameworkFolders, 'Release', null);

    const lastStrip = mockCalls.findLastIndex(c => c.startsWith('xcrun strip'));
    expect(lastStrip).toBeGreaterThanOrEqual(0);
    const firstTar = mockCalls.findIndex(c => c.startsWith('tar'));
    expect(firstTar).toBeGreaterThan(lastStrip);
  });

  test('re-signs a signed slice ad hoc after stripping it', () => {
    const slice = 'ios-arm64_x86_64-simulator';
    const framework = path.join(
      xcframeworkPath('Release'),
      slice,
      'React.framework',
    );

    buildXCFrameworks(tmp, buildFolder, frameworkFolders, 'Release', null);

    const stripIndex = mockCalls.indexOf(
      `xcrun strip -x ${sliceBinary('Release', slice)}`,
    );
    const signIndex = mockCalls.indexOf(
      `codesign --force --sign - ${framework}`,
    );
    expect(stripIndex).toBeGreaterThanOrEqual(0);
    expect(signIndex).toBeGreaterThan(stripIndex);
  });

  test('leaves an unsigned slice unsigned after stripping it', () => {
    const slice = 'ios-arm64';

    buildXCFrameworks(tmp, buildFolder, frameworkFolders, 'Release', null);

    expect(stripCalls()).toContain(
      `xcrun strip -x ${sliceBinary('Release', slice)}`,
    );
    expect(
      mockCalls.filter(
        c => c.startsWith('codesign --force') && c.includes(`/${slice}/`),
      ),
    ).toEqual([]);
  });

  test('does not strip Debug slices', () => {
    buildXCFrameworks(tmp, buildFolder, frameworkFolders, 'Debug', null);

    expect(mockCalls.some(c => c.startsWith('cp -r'))).toBe(true);
    expect(stripCalls()).toEqual([]);
  });

  test('throws and does not strip when a Release slice has no dSYM', () => {
    fs.rmSync(dSYMPath(SLICES[1]), {recursive: true});

    expect(() =>
      buildXCFrameworks(tmp, buildFolder, frameworkFolders, 'Release', null),
    ).toThrow(/dSYM/);
    expect(stripCalls()).not.toContain(
      `xcrun strip -x ${sliceBinary('Release', SLICES[1])}`,
    );
  });
});
