/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

jest.mock('child_process', () => ({
  execSync: jest.fn(),
  spawn: jest.fn(),
}));
const childProcess = require('child_process');

const {findAvailableSimulator} = require('../maestro-ios');

describe('Maestro iOS runner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects an iPhone Pro simulator from the latest runtime', () => {
    childProcess.execSync.mockReturnValue(
      JSON.stringify({
        devices: {
          'iOS 18.5': [{name: 'iPhone 16 Pro', udid: 'old-pro'}],
          'iOS 26.5': [
            {name: 'iPhone 17 Pro Max', udid: 'new-pro-max'},
            {name: 'iPhone 17 Pro', udid: 'new-pro'},
          ],
        },
      }),
    );

    expect(findAvailableSimulator()).toEqual({
      name: 'iPhone 17 Pro',
      udid: 'new-pro',
    });
  });
});
