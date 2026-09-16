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
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  lstatSync: jest.fn(),
  readdirSync: jest.fn(),
}));

const childProcess = require('child_process');
const fs = require('fs');

const {executeFlows, findAvailableSimulator} = require('../maestro-ios');

describe('Maestro iOS runner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    childProcess.spawn.mockReturnValue({pid: 1, kill: jest.fn()});
  });

  it('executes each YAML flow separately and skips other files', () => {
    fs.existsSync.mockReturnValue(true);
    fs.lstatSync.mockImplementation(path => ({
      isDirectory: () => path === 'flows/',
    }));
    fs.readdirSync.mockReturnValue(['second.yaml', 'image.png', 'first.yml']);

    executeFlows('com.example', 'device-id', 'flows/', 'Hermes');

    expect(childProcess.execSync).toHaveBeenCalledTimes(2);
    expect(childProcess.execSync.mock.calls[0][0]).toContain(
      'test "flows/first.yml"',
    );
    expect(childProcess.execSync.mock.calls[1][0]).toContain(
      'test "flows/second.yaml"',
    );
  });

  it('retries only the failing flow', () => {
    fs.existsSync.mockReturnValue(false);
    childProcess.execSync.mockImplementationOnce(() => {
      throw new Error('Maestro driver failed');
    });

    executeFlows('com.example', 'device-id', 'flow.yml', 'Hermes');

    expect(childProcess.execSync).toHaveBeenCalledTimes(2);
    for (const call of childProcess.execSync.mock.calls) {
      expect(call[0]).toContain('test "flow.yml"');
    }
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

  it('selects the configured device model and OS', () => {
    childProcess.execSync.mockReturnValue(
      JSON.stringify({
        devices: {
          'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
            {name: 'iPhone 17 Pro', udid: 'wrong-runtime'},
          ],
          'com.apple.CoreSimulator.SimRuntime.iOS-26-2': [
            {name: 'iPhone 17 Pro Max', udid: 'wrong-model'},
            {name: 'iPhone 17 Pro', udid: 'expected'},
          ],
        },
      }),
    );

    expect(findAvailableSimulator('iPhone-17-Pro', 'iOS-26-2')).toEqual({
      name: 'iPhone 17 Pro',
      udid: 'expected',
    });
  });

  it('fails when the configured simulator is unavailable', () => {
    childProcess.execSync.mockReturnValue(JSON.stringify({devices: {}}));

    expect(() => findAvailableSimulator('iPhone-17-Pro', 'iOS-26-2')).toThrow(
      'Unable to find iPhone 17 Pro simulator on iOS-26-2',
    );
  });
});
