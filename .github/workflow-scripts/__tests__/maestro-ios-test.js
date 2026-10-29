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
const {EventEmitter} = require('events');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  collectFlows,
  executeFlowSuite,
  findAvailableSimulator,
  loadState,
  runMaestroFlow,
} = require('../maestro-ios');

describe('Maestro iOS runner', () => {
  let temporaryDirectory;

  beforeEach(() => {
    jest.resetAllMocks();
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'maestro-ios-test-'),
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    childProcess.spawn.mockImplementation(() => {
      const recordingProcess = new EventEmitter();
      recordingProcess.pid = 1;
      recordingProcess.kill = jest.fn(() => {
        recordingProcess.emit('exit', 0, null);
        return true;
      });
      return recordingProcess;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(temporaryDirectory, {recursive: true, force: true});
  });

  it('collects YAML flows in a stable order and skips helpers and other files', () => {
    const helpersDirectory = path.join(temporaryDirectory, 'helpers');
    const nestedDirectory = path.join(temporaryDirectory, 'nested');
    fs.mkdirSync(helpersDirectory);
    fs.mkdirSync(nestedDirectory);
    fs.writeFileSync(path.join(temporaryDirectory, 'second.yaml'), 'appId: x');
    fs.writeFileSync(path.join(temporaryDirectory, 'image.png'), 'not a flow');
    fs.writeFileSync(path.join(temporaryDirectory, 'first.yml'), 'appId: x');
    fs.writeFileSync(path.join(helpersDirectory, 'search.yml'), 'appId: x');
    fs.writeFileSync(path.join(nestedDirectory, 'third.yml'), 'appId: x');

    expect(collectFlows(temporaryDirectory)).toEqual([
      path.join(temporaryDirectory, 'first.yml'),
      path.join(nestedDirectory, 'third.yml'),
      path.join(temporaryDirectory, 'second.yaml'),
    ]);
  });

  it('retries a failing flow once on a rebooted simulator and keeps going', async () => {
    const flows = ['first.yml', 'second.yml', 'third.yml'].map(file =>
      path.join(temporaryDirectory, file),
    );
    const statePath = path.join(temporaryDirectory, 'state', 'results.json');
    const executeFlow = jest.fn(async (appId, udid, flow) => {
      if (flow.endsWith('second.yml')) {
        throw new Error('failed assertion');
      }
    });
    const resetSimulator = jest.fn();

    await expect(
      executeFlowSuite({
        flows,
        appId: 'com.example',
        udid: 'device-id',
        state: loadState(statePath),
        statePath,
        executeFlow,
        resetSimulator,
      }),
    ).rejects.toThrow('1 Maestro flow(s) failed');

    expect(executeFlow.mock.calls.map(call => [call[2], call[3]])).toEqual([
      [flows[0], 1],
      [flows[1], 1],
      [flows[1], 2],
      [flows[2], 1],
    ]);
    expect(resetSimulator).toHaveBeenCalledTimes(1);
    expect(resetSimulator).toHaveBeenCalledWith('device-id');
    expect(Object.values(loadState(statePath).flows)).toEqual([
      {status: 'passed', attempts: 1},
      {status: 'failed', attempts: 2, error: 'failed assertion'},
      {status: 'passed', attempts: 1},
    ]);
  });

  it('passes a flow that succeeds on its retry', async () => {
    const flow = path.join(temporaryDirectory, 'flaky.yml');
    const statePath = path.join(temporaryDirectory, 'results.json');
    const executeFlow = jest
      .fn()
      .mockRejectedValueOnce(new Error('flaky'))
      .mockResolvedValueOnce();

    await executeFlowSuite({
      flows: [flow],
      appId: 'com.example',
      udid: 'device-id',
      state: loadState(statePath),
      statePath,
      executeFlow,
      resetSimulator: jest.fn(),
    });

    expect(Object.values(loadState(statePath).flows)).toEqual([
      {status: 'passed', attempts: 2},
    ]);
  });

  it('only runs flows that have not passed in a previous CI attempt', async () => {
    const flows = ['first.yml', 'second.yml'].map(file =>
      path.join(temporaryDirectory, file),
    );
    const statePath = path.join(temporaryDirectory, 'results.json');
    await expect(
      executeFlowSuite({
        flows,
        appId: 'com.example',
        udid: 'device-id',
        state: loadState(statePath),
        statePath,
        executeFlow: jest.fn(async (appId, udid, flow) => {
          if (flow.endsWith('second.yml')) {
            throw new Error('failed assertion');
          }
        }),
        resetSimulator: jest.fn(),
      }),
    ).rejects.toThrow();

    const retry = jest.fn();
    await executeFlowSuite({
      flows,
      appId: 'com.example',
      udid: 'device-id',
      state: loadState(statePath),
      statePath,
      executeFlow: retry,
      resetSimulator: jest.fn(),
    });

    expect(retry).toHaveBeenCalledTimes(1);
    expect(retry.mock.calls[0][2]).toBe(flows[1]);
  });

  it('waits for the recorder to exit before returning', async () => {
    const recordingProcess = new EventEmitter();
    recordingProcess.pid = 1;
    recordingProcess.kill = jest.fn(() => true);
    childProcess.spawn.mockReturnValueOnce(recordingProcess);

    let finished = false;
    const execution = runMaestroFlow(
      'com.example',
      'device-id',
      'flows/first.yml',
      1,
    ).then(() => {
      finished = true;
    });

    await new Promise(resolve =>
      jest.requireActual('timers').setImmediate(resolve),
    );

    expect(recordingProcess.kill).toHaveBeenCalledWith('SIGINT');
    expect(childProcess.execSync.mock.calls[0][0]).toContain(
      'test "flows/first.yml"',
    );
    expect(finished).toBe(false);

    recordingProcess.emit('exit', 0, null);
    await execution;
    expect(finished).toBe(true);
  });

  it('stops the recorder when Maestro fails', async () => {
    const error = new Error('Maestro driver failed');
    childProcess.execSync.mockImplementation(() => {
      throw error;
    });

    await expect(
      runMaestroFlow('com.example', 'device-id', 'flow.yml', 2),
    ).rejects.toBe(error);

    const {value: recordingProcess} = childProcess.spawn.mock.results[0];
    expect(recordingProcess.kill).toHaveBeenCalledWith('SIGINT');
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
