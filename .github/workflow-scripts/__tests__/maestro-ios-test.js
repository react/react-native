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
  filterFlowsByTags,
  findAvailableSimulator,
  loadState,
  parseJUnitReport,
  runMaestroFlow,
} = require('../maestro-ios');

// Simulates a single Maestro run in which the flows matching `failing` fail.
function suiteResults(failing = () => false) {
  return jest.fn(async (appId, udid, flows) => {
    return new Map(
      flows.map(flow => [
        path.relative(process.cwd(), flow),
        failing(flow)
          ? {passed: false, error: 'failed assertion'}
          : {passed: true},
      ]),
    );
  });
}

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

  it('excludes flows with matching tags', () => {
    const androidOnlyFlow = path.join(temporaryDirectory, 'android-only.yml');
    const regularFlow = path.join(temporaryDirectory, 'regular.yml');
    fs.writeFileSync(
      androidOnlyFlow,
      'appId: x\ntags:\n  - android-only\n---\n- launchApp\n',
    );
    fs.writeFileSync(regularFlow, 'appId: x\n---\n- launchApp\n');

    expect(
      filterFlowsByTags([androidOnlyFlow, regularFlow], ['android-only']),
    ).toEqual([regularFlow]);
  });

  it('parses flow results from a Maestro JUnit report', () => {
    const report = `<?xml version='1.0' encoding='UTF-8'?>
<testsuites>
  <testsuite name="Test Suite" device="iPhone 17 Pro" tests="3" failures="1">
    <testcase id="first" name="first" classname="first" file="flows/first.yml" time="3.0" status="SUCCESS"/>
    <testcase id="second" name="second" classname="second" file="flows/second.yml" time="5.0" status="ERROR">
      <failure>Assertion is false: &quot;Cheesecake&quot; is visible</failure>
    </testcase>
    <testcase id="third" name="third" classname="third" file="flows/third.yml" status="WARNING">
    </testcase>
  </testsuite>
</testsuites>`;

    expect(parseJUnitReport(report)).toEqual(
      new Map([
        ['flows/first.yml', {passed: true, error: 'SUCCESS'}],
        [
          'flows/second.yml',
          {passed: false, error: 'Assertion is false: "Cheesecake" is visible'},
        ],
        ['flows/third.yml', {passed: true, error: 'WARNING'}],
      ]),
    );
  });

  it('runs all flows together, then retries each failure once on a rebooted simulator', async () => {
    const flows = ['first.yml', 'second.yml', 'third.yml'].map(file =>
      path.join(temporaryDirectory, file),
    );
    const statePath = path.join(temporaryDirectory, 'state', 'results.json');
    const executeSuite = suiteResults(flow => !flow.endsWith('first.yml'));
    const executeFlow = jest.fn(async (appId, udid, flow) => {
      if (flow.endsWith('second.yml')) {
        throw new Error('failed again');
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
        executeSuite,
        executeFlow,
        resetSimulator,
      }),
    ).rejects.toThrow('1 Maestro flow(s) failed');

    expect(executeSuite).toHaveBeenCalledTimes(1);
    expect(executeSuite.mock.calls[0][2]).toEqual(flows);
    expect(executeFlow.mock.calls.map(call => [call[2], call[3]])).toEqual([
      [flows[1], 2],
      [flows[2], 2],
    ]);
    expect(resetSimulator).toHaveBeenCalledTimes(2);
    expect(resetSimulator).toHaveBeenCalledWith('device-id');
    expect(Object.values(loadState(statePath).flows)).toEqual([
      {status: 'passed', attempts: 1},
      {status: 'failed', attempts: 2, error: 'failed again'},
      {status: 'passed', attempts: 2},
    ]);
  });

  it('does not retry when every flow passes', async () => {
    const flow = path.join(temporaryDirectory, 'first.yml');
    const statePath = path.join(temporaryDirectory, 'results.json');
    const executeFlow = jest.fn();
    const resetSimulator = jest.fn();

    await executeFlowSuite({
      flows: [flow],
      appId: 'com.example',
      udid: 'device-id',
      state: loadState(statePath),
      statePath,
      executeSuite: suiteResults(),
      executeFlow,
      resetSimulator,
    });

    expect(executeFlow).not.toHaveBeenCalled();
    expect(resetSimulator).not.toHaveBeenCalled();
    expect(Object.values(loadState(statePath).flows)).toEqual([
      {status: 'passed', attempts: 1},
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
        executeSuite: suiteResults(flow => flow.endsWith('second.yml')),
        executeFlow: jest.fn().mockRejectedValue(new Error('failed again')),
        resetSimulator: jest.fn(),
      }),
    ).rejects.toThrow();

    const executeSuite = suiteResults();
    await executeFlowSuite({
      flows,
      appId: 'com.example',
      udid: 'device-id',
      state: loadState(statePath),
      statePath,
      executeSuite,
      executeFlow: jest.fn(),
      resetSimulator: jest.fn(),
    });

    expect(executeSuite).toHaveBeenCalledTimes(1);
    expect(executeSuite.mock.calls[0][2]).toEqual([flows[1]]);
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
