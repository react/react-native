/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {isTaggedLatest} = require('../scm-utils');

let execResult = null;

jest
  .mock('shelljs', () => ({
    exec: () => {
      return {
        stdout: execResult,
      };
    },
    echo: message => {
      console.log(message);
    },
    exit: exitCode => {
      process.exit(exitCode);
    },
  }))
  .mock('fs', () => ({
    existsSync: jest.fn().mockImplementation(_ => true),
  }))
  .mock('path', () => ({
    dirname: jest
      .fn()
      .mockImplementation(filePath =>
        filePath.includes('/') ? filePath.split('/')[0] : '.',
      ),
  }));

describe('scm-utils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('isTaggedLatest', () => {
    it('it should identify commit as tagged `latest`', () => {
      execResult = '6c19dc3266b84f47a076b647a1c93b3c3b69d2c5\n';
      expect(isTaggedLatest('6c19dc3266b84f47a076b647a1c93b3c3b69d2c5')).toBe(
        true,
      );
    });
    it('it should not identify commit as tagged `latest`', () => {
      execResult = '6c19dc3266b84f47a076b647a1c93b3c3b69d2c5\n';
      expect(isTaggedLatest('6c19dc3266b8')).toBe(false);
    });
  });
});
