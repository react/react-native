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

const {parseCliArgs} = require('../args');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REQUIRED = [
  '--platform',
  'android',
  '--build-type',
  'release',
  '--base',
  '0.87.1',
];

describe('parseCliArgs', () => {
  test('compares two published versions, with the default cache', () => {
    expect(parseCliArgs([...REQUIRED, '--current', '0.88.1'])).toEqual({
      kind: 'check',
      json: false,
      options: {
        platform: 'android',
        buildType: 'release',
        base: '0.87.1',
        current: {kind: 'version', version: '0.88.1'},
        cacheDir: path.join(os.tmpdir(), 'react-native-abi-check'),
      },
    });
  });

  test('reads a current folder as a checkout, and resolves paths', () => {
    const checkout = path.relative(process.cwd(), __dirname);

    expect(
      parseCliArgs([
        ...REQUIRED,
        '--current',
        checkout,
        '--cache-dir',
        'cache',
        '--json',
      ]),
    ).toEqual({
      kind: 'check',
      json: true,
      options: expect.objectContaining({
        current: {kind: 'checkout', root: __dirname},
        cacheDir: path.resolve('cache'),
      }),
    });
  });

  test('reads a folder named like a version as a checkout', () => {
    const parent = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'abi-check-args-')),
    );
    fs.mkdirSync(path.join(parent, '0.88.1'));
    const cwd = process.cwd();
    process.chdir(parent);
    try {
      expect(parseCliArgs([...REQUIRED, '--current', '0.88.1'])).toMatchObject({
        options: {
          current: {kind: 'checkout', root: path.join(parent, '0.88.1')},
        },
      });
    } finally {
      process.chdir(cwd);
      fs.rmSync(parent, {recursive: true});
    }
  });

  test('rejects a current that is neither a folder nor a version', () => {
    expect(() =>
      parseCliArgs([...REQUIRED, '--current', '../no-such-checkout']),
    ).toThrow(/--current/);
  });

  test('reads a prerelease version as a version', () => {
    expect(
      parseCliArgs([...REQUIRED, '--current', '0.89.0-rc.1']),
    ).toMatchObject({
      options: {current: {kind: 'version', version: '0.89.0-rc.1'}},
    });
  });

  test('asks for help', () => {
    expect(parseCliArgs(['--help'])).toEqual({kind: 'help'});
  });

  test.each([
    [['--platform', 'windows', '--build-type', 'release'], /--platform/],
    [['--platform', 'ios', '--build-type', 'profile'], /--build-type/],
    [
      ['--platform', 'ios', '--build-type', 'debug', '--base', '0.87.1'],
      /--current/,
    ],
    [
      ['--platform', 'ios', '--build-type', 'debug', '--current', '0.88.1'],
      /--base/,
    ],
    [
      [
        '--platform',
        'ios',
        '--build-type',
        'debug',
        '--base',
        '../react-native',
        '--current',
        '0.88.1',
      ],
      /--base/,
    ],
    [[...REQUIRED, '--current', '0.88.1', '--verbose'], /verbose/],
  ])('rejects %j', (argv, message) => {
    expect(() => parseCliArgs(argv)).toThrow(message);
  });
});
