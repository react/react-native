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

const {executeFlows} = require('../maestro-ios');

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
});
