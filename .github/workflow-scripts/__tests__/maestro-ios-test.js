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
  execFileSync: jest.fn(),
  spawn: jest.fn(),
}));
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  lstatSync: jest.fn(),
  readdirSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

const childProcess = require('child_process');
const {EventEmitter} = require('events');
const fs = require('fs');
const path = require('path');

const {executeFlows, findAvailableSimulator, main} = require('../maestro-ios');

describe('Maestro iOS runner', () => {
  function flowCalls() {
    return childProcess.execFileSync.mock.calls.filter(
      ([file]) => file !== 'xcrun',
    );
  }

  function mockFlows(files) {
    fs.existsSync.mockReturnValue(true);
    fs.lstatSync.mockImplementation(file => ({
      isDirectory: () => file === 'flows/',
    }));
    fs.readdirSync.mockReturnValue(files);
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
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
  });

  it('waits for cold boot before installing, launching, and running flows', async () => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      MAESTRO_RESET_APP: 'true',
      MAESTRO_SHARD_INDEX: '0',
      MAESTRO_SHARD_COUNT: '1',
    });
    childProcess.execSync.mockReturnValueOnce(
      JSON.stringify({
        devices: {
          'com.apple.CoreSimulator.SimRuntime.iOS-26-2': [
            {name: 'iPhone 17 Pro', udid: 'device-id'},
          ],
        },
      }),
    );
    childProcess.execFileSync.mockImplementation((file, args, options) => {
      if (args[1] === 'bootstatus' && options.timeout < 3 * 60 * 1000) {
        throw new Error('Cold simulator data migration exceeded the deadline');
      }
    });

    await main([
      '/tmp/RNTester.app',
      'com.example',
      'flow.yml',
      'Hermes',
      'Release',
      '/tmp/workspace',
      'iPhone-17-Pro',
      'iOS-26-2',
    ]);

    const calls = childProcess.execFileSync.mock.calls;
    expect(calls[0]).toEqual([
      'xcrun',
      ['simctl', 'bootstatus', 'device-id', '-b'],
      {stdio: 'inherit', timeout: 10 * 60 * 1000, killSignal: 'SIGKILL'},
    ]);
    expect(calls.slice(1, -1).map(([, args]) => args)).toEqual([
      ['simctl', 'install', 'device-id', '/tmp/RNTester.app'],
      ['simctl', 'launch', 'device-id', 'com.example'],
      ['simctl', 'uninstall', 'device-id', 'com.example'],
      ['simctl', 'keychain', 'device-id', 'reset'],
      ['simctl', 'install', 'device-id', '/tmp/RNTester.app'],
      ['simctl', 'privacy', 'device-id', 'reset', 'all', 'com.example'],
      ['simctl', 'ui', 'device-id', 'appearance', 'light'],
    ]);
    expect(childProcess.execSync).toHaveBeenLastCalledWith('open -a simulator');
    expect(flowCalls()).toHaveLength(1);
    expect(flowCalls()[0][1]).toContain('APP_ID=com.example');
    expect(console.log).toHaveBeenLastCalledWith('Test finished');
  });

  it('hard-kills a hung boot without installing the app or running flows', async () => {
    const actualChildProcess = jest.requireActual('child_process');
    childProcess.execSync.mockReturnValueOnce(
      JSON.stringify({
        devices: {
          'iOS 26.2': [{name: 'iPhone 17 Pro', udid: 'device-id'}],
        },
      }),
    );
    let timeoutError;
    childProcess.execFileSync.mockImplementationOnce((file, args, options) => {
      expect(args).toEqual(['simctl', 'bootstatus', 'device-id', '-b']);
      expect(options.timeout).toBe(10 * 60 * 1000);
      expect(options.killSignal).toBe('SIGKILL');
      try {
        actualChildProcess.execFileSync(
          process.execPath,
          [
            '-e',
            'process.on("SIGTERM", () => {}); process.stderr.write("ready"); setInterval(() => {}, 1000);',
          ],
          {...options, timeout: 500, stdio: 'pipe'},
        );
      } catch (error) {
        timeoutError = error;
        throw error;
      }
    });

    await expect(
      main([
        '/tmp/RNTester.app',
        'com.example',
        'flow.yml',
        'Hermes',
        'Release',
        '/tmp/workspace',
      ]),
    ).rejects.toMatchObject({code: 'ETIMEDOUT', signal: 'SIGKILL'});

    expect(String(timeoutError.stderr)).toContain('ready');
    expect(childProcess.execFileSync).toHaveBeenCalledTimes(1);
    expect(childProcess.execSync).toHaveBeenCalledTimes(1);
    expect(childProcess.spawn).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('executes each YAML flow separately and skips other files', async () => {
    mockFlows(['second.yaml', 'image.png', 'first.yml']);

    await executeFlows('com.example', 'device-id', 'flows/', 'Hermes');

    expect(flowCalls().map(([, args]) => args[3])).toEqual([
      'flows/first.yml',
      'flows/second.yaml',
    ]);
  });

  it('retries only the failing flow', async () => {
    mockFlows(['first.yml', 'second.yml']);
    childProcess.execFileSync.mockImplementationOnce(() => {
      throw new Error('Maestro driver failed');
    });

    await executeFlows('com.example', 'device-id', 'flows/', 'Hermes');

    expect(flowCalls().map(([, args]) => args[3])).toEqual([
      'flows/first.yml',
      'flows/first.yml',
      'flows/second.yml',
    ]);
  });

  it('waits for the recorder to exit before starting the next flow', async () => {
    mockFlows(['first.yml', 'second.yml']);
    const recordingProcess = new EventEmitter();
    recordingProcess.pid = 1;
    recordingProcess.kill = jest.fn(() => true);
    childProcess.spawn.mockReturnValueOnce(recordingProcess);

    const execution = executeFlows(
      'com.example',
      'device-id',
      'flows/',
      'Hermes',
    );
    await new Promise(resolve =>
      jest.requireActual('timers').setImmediate(resolve),
    );

    expect(recordingProcess.kill).toHaveBeenCalledWith('SIGINT');
    expect(flowCalls()).toHaveLength(1);
    expect(childProcess.spawn).toHaveBeenCalledTimes(1);

    recordingProcess.emit('exit', 0, null);
    await execution;

    expect(flowCalls()).toHaveLength(2);
    expect(childProcess.spawn).toHaveBeenCalledTimes(2);
  });

  it('skips helper directories while recursing into flow directories', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.lstatSync.mockImplementation(file => ({
      isDirectory: () => !file.endsWith('.yml'),
    }));
    fs.readdirSync.mockImplementation(directory =>
      directory === 'flows/' ? ['helpers', 'nested'] : ['flow.yml'],
    );

    await executeFlows('com.example', 'device-id', 'flows/', 'Hermes');

    expect(fs.readdirSync).not.toHaveBeenCalledWith('flows/helpers');
    expect(flowCalls()).toHaveLength(1);
    expect(flowCalls()[0][1][3]).toBe('flows/nested/flow.yml');
  });

  it('partitions the sorted flow list without omissions or duplicates', async () => {
    const files = ['e.yml', 'd.yaml', 'c.yml', 'b.yml', 'a.yml'];
    const partitions = [];
    for (let shardIndex = 0; shardIndex < 4; shardIndex++) {
      mockFlows(files);
      childProcess.execFileSync.mockClear();
      await executeFlows('com.example', 'device-id', 'flows/', 'Hermes', {
        shardIndex,
        shardCount: 4,
      });
      partitions.push(flowCalls().map(([, args]) => args[3]));
    }

    expect(partitions).toEqual([
      ['flows/a.yml', 'flows/e.yml'],
      ['flows/b.yml'],
      ['flows/c.yml'],
      ['flows/d.yaml'],
    ]);
    expect(new Set(partitions.flat()).size).toBe(files.length);
  });

  it.each([
    {shardIndex: -1, shardCount: 4},
    {shardIndex: 4, shardCount: 4},
    {shardIndex: 0, shardCount: 0},
    {shardIndex: 0.5, shardCount: 4},
    {shardIndex: 0, shardCount: NaN},
  ])('rejects invalid sharding options: %p', async options => {
    await expect(
      executeFlows('com.example', 'device-id', 'flows/', 'Hermes', options),
    ).rejects.toThrow('Invalid shard');
    expect(childProcess.execFileSync).not.toHaveBeenCalled();
  });

  it('fails an empty suite instead of passing without coverage', async () => {
    mockFlows(['readme.txt']);
    await expect(
      executeFlows('com.example', 'device-id', 'flows/', 'Hermes'),
    ).rejects.toThrow('No Maestro flows');
    expect(childProcess.spawn).not.toHaveBeenCalled();
  });

  it('allows empty shards when there are fewer flows than shards', async () => {
    mockFlows(['first.yml']);
    await executeFlows('com.example', 'device-id', 'flows/', 'Hermes', {
      shardIndex: 3,
      shardCount: 4,
    });
    expect(childProcess.spawn).not.toHaveBeenCalled();
    expect(JSON.parse(fs.writeFileSync.mock.calls[0][1])).toEqual({
      shardIndex: 3,
      shardCount: 4,
      flows: [],
    });
  });

  it('resets before every retry and every subsequent flow', async () => {
    mockFlows(['first.yml', 'second.yml']);
    let attempts = 0;
    childProcess.execFileSync.mockImplementation(file => {
      if (file !== 'xcrun' && attempts++ === 0) {
        throw new Error('Flow left the app dirty');
      }
    });

    await executeFlows('com.example', 'device-id', 'flows/', 'Hermes', {
      resetApp: true,
      appPath: '/tmp/RNTester.app',
    });

    const resetCommands = [
      ['simctl', 'uninstall', 'device-id', 'com.example'],
      ['simctl', 'keychain', 'device-id', 'reset'],
      ['simctl', 'install', 'device-id', '/tmp/RNTester.app'],
      ['simctl', 'privacy', 'device-id', 'reset', 'all', 'com.example'],
      ['simctl', 'ui', 'device-id', 'appearance', 'light'],
    ];
    const calls = childProcess.execFileSync.mock.calls;
    expect(calls).toHaveLength(18);
    for (let attempt = 0; attempt < 3; attempt++) {
      expect(
        calls.slice(attempt * 6, attempt * 6 + 5).map(([, args]) => args),
      ).toEqual(resetCommands);
      expect(calls[attempt * 6 + 5][0]).not.toBe('xcrun');
    }
    const wrappers = fs.writeFileSync.mock.calls.filter(([file]) =>
      file.endsWith('/flow.yml'),
    );
    expect(wrappers).toHaveLength(3);
    for (const [, content] of wrappers) {
      expect(content).toContain(
        '- setOrientation: portrait\n- launchApp\n- runFlow:',
      );
      expect(content).not.toContain('clearState');
    }
    expect(wrappers[0][1]).toContain(
      JSON.stringify(path.resolve('flows/first.yml')),
    );
    expect(wrappers[2][1]).toContain(
      JSON.stringify(path.resolve('flows/second.yml')),
    );
  });

  it('does not execute a flow when reset fails', async () => {
    fs.existsSync.mockReturnValue(false);
    const error = new Error('Unable to uninstall app');
    childProcess.execFileSync.mockImplementation(() => {
      throw error;
    });

    await expect(
      executeFlows('com.example', 'device-id', 'flow.yml', 'Hermes', {
        resetApp: true,
        appPath: '/tmp/RNTester.app',
      }),
    ).rejects.toMatchObject({errors: [error]});

    expect(childProcess.execFileSync).toHaveBeenCalledTimes(5);
    expect(flowCalls()).toHaveLength(0);
    expect(childProcess.spawn).not.toHaveBeenCalled();
  });

  it('requires the original app artifact for reset', async () => {
    await expect(
      executeFlows('com.example', 'device-id', 'flow.yml', 'Hermes', {
        resetApp: true,
      }),
    ).rejects.toThrow('requires an app path');
    expect(childProcess.execFileSync).not.toHaveBeenCalled();
  });

  it('keeps reports, logs, screenshots, and videos unique for every attempt', async () => {
    mockFlows(['first.yml', 'second.yml']);
    childProcess.execFileSync.mockImplementationOnce(() => {
      throw new Error('Retry');
    });
    await executeFlows('com.example', 'device-id', 'flows/', 'Hermes');

    for (const flag of ['--output', '--debug-output', '--test-output-dir']) {
      const outputs = flowCalls().map(
        ([, args]) => args[args.indexOf(flag) + 1],
      );
      expect(new Set(outputs).size).toBe(3);
      expect(outputs.every(output => output.includes('maestro-reports'))).toBe(
        true,
      );
    }
    const videos = childProcess.spawn.mock.calls.map(([, args]) => args.at(-1));
    expect(new Set(videos).size).toBe(3);
    expect(videos[0]).toContain('0-first.yml/attempt-1/video.mov');
    expect(videos[1]).toContain('0-first.yml/attempt-2/video.mov');
    expect(videos[2]).toContain('1-second.yml/attempt-1/video.mov');
    for (const [, args] of flowCalls()) {
      expect(args).toContain('APP_ID=com.example');
    }
  });

  it('hard-kills a hung flow and retries after stopping its recorder', async () => {
    const actualChildProcess = jest.requireActual('child_process');
    let timeoutError;
    childProcess.execFileSync.mockImplementationOnce((file, args, options) => {
      expect(options.killSignal).toBe('SIGKILL');
      try {
        actualChildProcess.execFileSync(
          process.execPath,
          [
            '-e',
            'process.on("SIGTERM", () => {}); process.stderr.write("ready"); setInterval(() => {}, 1000);',
          ],
          {...options, timeout: 500, stdio: 'pipe'},
        );
      } catch (error) {
        timeoutError = error;
        throw error;
      }
    });

    await executeFlows('com.example', 'device-id', 'flow.yml', 'Hermes');

    expect(timeoutError).toMatchObject({code: 'ETIMEDOUT', signal: 'SIGKILL'});
    expect(String(timeoutError.stderr)).toContain('ready');
    expect(flowCalls()).toHaveLength(2);
    expect(childProcess.spawn).toHaveBeenCalledTimes(2);
    for (const {value: recordingProcess} of childProcess.spawn.mock.results) {
      expect(recordingProcess.kill).toHaveBeenCalledWith('SIGINT');
    }
  });

  it('continues after an exhausted flow and reports the failure at the end', async () => {
    mockFlows(['first.yml', 'second.yml']);
    const error = new Error('Maestro driver failed');
    childProcess.execFileSync.mockImplementation((file, args) => {
      if (args[3] === 'flows/first.yml') {
        throw error;
      }
    });

    await expect(
      executeFlows('com.example', 'device-id', 'flows/', 'Hermes'),
    ).rejects.toMatchObject({errors: [error]});

    expect(flowCalls().map(([, args]) => args[3])).toEqual([
      ...Array(5).fill('flows/first.yml'),
      'flows/second.yml',
    ]);
    expect(childProcess.spawn).toHaveBeenCalledTimes(6);
    for (const {value: recordingProcess} of childProcess.spawn.mock.results) {
      expect(recordingProcess.kill).toHaveBeenCalledWith('SIGINT');
    }
    expect(console.error).toHaveBeenCalledWith(
      'Failed to execute flow flows/first.yml after 5 attempts.',
    );
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
