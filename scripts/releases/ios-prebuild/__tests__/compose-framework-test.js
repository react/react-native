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

const SCHEME = 'ReactNativeDependencies';
const SLICES = [
  'ios-arm64',
  'ios-arm64_x86_64-simulator',
  'ios-arm64_x86_64-maccatalyst',
  'macos-arm64_x86_64',
];
const VERSIONED_SLICES = new Set([
  'ios-arm64_x86_64-maccatalyst',
  'macos-arm64_x86_64',
]);

const mockCalls = [];
const mockSignedSlices = new Set(['ios-arm64_x86_64-simulator']);

jest.mock(
  '../../../../packages/react-native/scripts/ios-prebuild/headers-xcframework',
  () => ({
    buildDepsHeadersXcframework: jest.fn(
      root => `${root}/ReactNativeDependenciesHeaders.xcframework`,
    ),
    stubSlicesFromXcframework: jest.fn(() => []),
  }),
);
jest.mock('node:child_process', () => {
  const mockFs = jest.requireActual('node:fs');
  const mockPath = jest.requireActual('node:path');
  const sliceOf = p => SLICES.find(slice => p.split('/').includes(slice));
  return {
    execSync: jest.fn(command => {
      mockCalls.push(command);
      const createMatch = command.match(/-output (\S+)/);
      if (command.startsWith('xcodebuild -create-xcframework') && createMatch) {
        for (const slice of SLICES) {
          const framework = mockPath.join(
            createMatch[1],
            slice,
            `${SCHEME}.framework`,
          );
          if (VERSIONED_SLICES.has(slice)) {
            const versionDir = mockPath.join(framework, 'Versions', 'A');
            mockFs.mkdirSync(versionDir, {recursive: true});
            mockFs.writeFileSync(mockPath.join(versionDir, SCHEME), '');
            mockFs.symlinkSync(
              'A',
              mockPath.join(framework, 'Versions', 'Current'),
            );
            mockFs.symlinkSync(
              `Versions/Current/${SCHEME}`,
              mockPath.join(framework, SCHEME),
            );
          } else {
            mockFs.mkdirSync(framework, {recursive: true});
            mockFs.writeFileSync(mockPath.join(framework, SCHEME), '');
          }
        }
      }
      if (command.startsWith('vtool')) {
        return Buffer.from(`platform ${sliceOf(command) ?? ''}\n`);
      }
      return Buffer.from('');
    }),
    execFileSync: jest.fn((file, args) => {
      mockCalls.push([file, ...args].join(' '));
      if (
        file === 'codesign' &&
        args[0] === '-d' &&
        !mockSignedSlices.has(sliceOf(args[1]))
      ) {
        throw new Error('code object is not signed at all');
      }
    }),
  };
});

const {createFramework} = require('../compose-framework');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('createFramework symbol stripping', () => {
  let tmp = '';
  let buildFolder = '';

  const sliceBinary = slice =>
    VERSIONED_SLICES.has(slice)
      ? path.join(
          tmp,
          `${SCHEME}.xcframework`,
          slice,
          `${SCHEME}.framework`,
          'Versions',
          'A',
          SCHEME,
        )
      : path.join(
          tmp,
          `${SCHEME}.xcframework`,
          slice,
          `${SCHEME}.framework`,
          SCHEME,
        );

  const dSYMPath = slice =>
    path.join(
      buildFolder,
      'Build',
      'Products',
      slice,
      `${SCHEME}.framework.dSYM`,
    );

  const stripCalls = () => mockCalls.filter(c => c.startsWith('xcrun strip'));

  const compose = configuration =>
    createFramework(SCHEME, configuration, [], tmp, buildFolder, null);

  beforeEach(() => {
    mockCalls.length = 0;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    tmp = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'compose-framework-test-')),
    );
    buildFolder = path.join(tmp, '.build');
    SLICES.forEach(slice => fs.mkdirSync(dSYMPath(slice), {recursive: true}));
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
    jest.restoreAllMocks();
  });

  it('strips local symbols from every Release slice after its dSYM is copied', async () => {
    await compose('Release');

    expect(stripCalls().sort()).toEqual(
      SLICES.map(slice => `xcrun strip -x ${sliceBinary(slice)}`).sort(),
    );
    for (const slice of SLICES) {
      const copyIndex = mockCalls.findIndex(
        c => c.startsWith('cp -r') && c.includes(dSYMPath(slice)),
      );
      const stripIndex = mockCalls.indexOf(
        `xcrun strip -x ${sliceBinary(slice)}`,
      );
      expect(copyIndex).toBeGreaterThanOrEqual(0);
      expect(stripIndex).toBeGreaterThan(copyIndex);
    }
  });

  it('re-signs a signed slice ad hoc after stripping it', async () => {
    const slice = 'ios-arm64_x86_64-simulator';
    const framework = path.join(
      tmp,
      `${SCHEME}.xcframework`,
      slice,
      `${SCHEME}.framework`,
    );

    await compose('Release');

    const stripIndex = mockCalls.indexOf(
      `xcrun strip -x ${sliceBinary(slice)}`,
    );
    const signIndex = mockCalls.indexOf(
      `codesign --force --sign - ${framework}`,
    );
    expect(stripIndex).toBeGreaterThanOrEqual(0);
    expect(signIndex).toBeGreaterThan(stripIndex);
  });

  it('leaves an unsigned slice unsigned after stripping it', async () => {
    const slice = 'ios-arm64';

    await compose('Release');

    expect(stripCalls()).toContain(`xcrun strip -x ${sliceBinary(slice)}`);
    expect(
      mockCalls.filter(
        c => c.startsWith('codesign --force') && c.includes(`/${slice}/`),
      ),
    ).toEqual([]);
  });

  it('does not strip Debug slices', async () => {
    await compose('Debug');

    expect(mockCalls.some(c => c.startsWith('cp -r'))).toBe(true);
    expect(stripCalls()).toEqual([]);
  });

  it('throws and does not strip when a Release slice has no dSYM', async () => {
    fs.rmSync(dSYMPath(SLICES[1]), {recursive: true});

    await expect(compose('Release')).rejects.toThrow(/dSYM/);
    expect(stripCalls()).not.toContain(
      `xcrun strip -x ${sliceBinary(SLICES[1])}`,
    );
  });
});
