/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

jest.mock('../format-utils', () => ({
  IS_META_CHECKOUT: false,
  commandVersion: jest.fn(),
  findMetaTool: jest.fn(() => null),
}));
jest.mock('tinyglobby', () => ({globSync: jest.fn(() => [])}));

const originalSwiftFormat = process.env.SWIFT_FORMAT;

beforeEach(() => {
  delete process.env.SWIFT_FORMAT;
});

afterEach(() => {
  if (originalSwiftFormat === undefined) {
    delete process.env.SWIFT_FORMAT;
  } else {
    process.env.SWIFT_FORMAT = originalSwiftFormat;
  }
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test.each([
  ['6.4', true],
  ['6.2', false],
])(
  'checks the Swift toolchain version when the formatter reports main (%s)',
  (version, accepted) => {
    const {commandVersion} = require('../format-utils');
    const {globSync} = require('tinyglobby');
    commandVersion.mockImplementation((command, args) => {
      if (command === 'swift' && args?.[0] === 'format') {
        return {status: 0, output: 'main'};
      }
      if (command === 'swift') {
        return {
          status: 0,
          output: `Apple Swift version ${version} (swiftlang)`,
        };
      }
      return {status: 1, output: ''};
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    require('../format-swift');

    expect(globSync).toHaveBeenCalledTimes(accepted ? 1 : 0);
  },
);
