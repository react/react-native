/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

const {
  configurationResults,
  prepareTestState,
  recordConfigurationResult,
  reportConfigurationResults,
} = require('../template-app-ci-state');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const bothFlavors = ['Debug', 'Release'];

function results(outputs, flavors = bothFlavors, previousResults = {}) {
  return configurationResults({outputs, flavors, previousResults});
}

describe('template app configuration retries', () => {
  it('does not retry when both configurations pass', () => {
    expect(
      results({'debug-result': 'passed', 'release-result': 'passed'}),
    ).toEqual({
      results: {Debug: 'passed', Release: 'passed'},
      failedFlavors: [],
      status: 'success',
    });
  });

  it.each(bothFlavors)('retries only the failed %s configuration', flavor => {
    const outputs = {'debug-result': 'passed', 'release-result': 'passed'};
    outputs[`${flavor.toLowerCase()}-result`] = 'failed';
    expect(results(outputs).failedFlavors).toEqual([flavor]);
  });

  it('retains a successful build while retrying the other configuration', () => {
    const first = results({
      'debug-result': 'passed',
      'release-result': 'failed',
    });
    const second = results(
      {'release-result': 'passed'},
      first.failedFlavors,
      first.results,
    );
    expect(second.status).toBe('success');
    expect(second.results).toEqual({Debug: 'passed', Release: 'passed'});
  });

  it('keeps a configuration retryable after its result step is lost', () => {
    const first = results({'debug-result': 'passed'});
    const second = results({}, first.failedFlavors, first.results);
    expect(second).toEqual({
      results: {Debug: 'passed', Release: 'failed'},
      failedFlavors: ['Release'],
      status: 'failure',
    });
  });

  it('does not reuse an old pass for a configuration attempted again', () => {
    expect(
      results({}, ['Debug'], {Debug: 'passed', Release: 'passed'}),
    ).toEqual({
      results: {Debug: 'failed', Release: 'passed'},
      failedFlavors: ['Debug'],
      status: 'failure',
    });
  });

  it('never treats an omitted configuration without an earlier pass as passed', () => {
    expect(
      results({'release-result': 'passed'}, ['Release']).failedFlavors,
    ).toEqual(['Debug']);
  });

  it.each([[], ['Debug', 'Debug'], ['Profile'], 'Debug'])(
    'rejects an invalid retry matrix %p',
    flavors => {
      expect(() => results({}, flavors)).toThrow('unique Debug/Release');
    },
  );

  it('writes independent outputs for both matrix legs', () => {
    const core = {setOutput: jest.fn()};
    recordConfigurationResult({core, flavor: 'Release', passed: false});
    recordConfigurationResult({core, flavor: 'Debug', passed: true});
    expect(core.setOutput.mock.calls).toEqual([
      ['release-result', 'failed'],
      ['debug-result', 'passed'],
    ]);
  });

  it('rejects an unknown configuration when recording results', () => {
    expect(() =>
      recordConfigurationResult({
        core: {setOutput: jest.fn()},
        flavor: 'Profile',
        passed: true,
      }),
    ).toThrow('Unknown template app configuration');
  });
});

describe('template app final reporting', () => {
  function core() {
    const result = {
      setOutput: jest.fn(),
      setFailed: jest.fn(),
      warning: jest.fn(),
      summary: {addRaw: jest.fn(), write: jest.fn().mockResolvedValue()},
    };
    result.summary.addRaw.mockReturnValue(result.summary);
    return result;
  }

  async function report(jobResult, outputs, failOnError = false) {
    const result = core();
    await reportConfigurationResults({
      context: {
        serverUrl: 'https://github.com',
        repo: {owner: 'react', repo: 'react-native'},
        runId: 1,
      },
      core: result,
      needs: {test: {result: jobResult, outputs}},
      job: 'test',
      flavors: ['Release'],
      previousResults: {Debug: 'passed', Release: 'failed'},
      failOnError,
      attempt: 1,
    });
    return result;
  }

  it('reports success after the previously unsuccessful lane passes', async () => {
    const result = await report('success', {'release-result': 'passed'}, true);
    expect(result.setOutput).toHaveBeenCalledWith('status', 'success');
    expect(result.setOutput).toHaveBeenCalledWith('failed-flavors', '[]');
    expect(result.setFailed).not.toHaveBeenCalled();
  });

  it('reports intermediate failures without failing the report job', async () => {
    const result = await report('success', {'release-result': 'failed'});
    expect(result.setOutput).toHaveBeenCalledWith('status', 'failure');
    expect(result.setOutput).toHaveBeenCalledWith(
      'failed-flavors',
      '["Release"]',
    );
    expect(result.setFailed).not.toHaveBeenCalled();
    expect(result.warning).toHaveBeenCalled();
  });

  it('fails the final attempt when a configuration still has not passed', async () => {
    const result = await report('success', {'release-result': 'failed'}, true);
    expect(result.setFailed).toHaveBeenCalled();
  });

  it.each(['failure', 'cancelled', 'skipped'])(
    'does not hide a %s matrix job behind a passed result output',
    async jobResult => {
      const result = await report(
        jobResult,
        {'release-result': 'passed'},
        true,
      );
      expect(result.setOutput).toHaveBeenCalledWith('status', 'failure');
      expect(result.setOutput).toHaveBeenCalledWith(
        'failed-flavors',
        '["Release"]',
      );
      expect(result.setFailed).toHaveBeenCalled();
    },
  );

  it('treats missing app/setup results as failure on the final attempt', async () => {
    const result = await report('failure', {}, true);
    expect(result.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('job failure'),
    );
  });
});

describe('template app per-flow state', () => {
  let directory;
  let flowsDirectory;
  let statePath;
  let first;
  let second;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'template-app-ci-test-'));
    flowsDirectory = path.join(directory, 'flows');
    fs.mkdirSync(flowsDirectory);
    first = path.join(flowsDirectory, 'first.yml');
    second = path.join(flowsDirectory, 'second.yaml');
    fs.writeFileSync(first, 'appId: x\n---\n- launchApp\n');
    fs.writeFileSync(second, 'appId: x\n---\n- launchApp\n');
    statePath = path.join(directory, 'results.json');
  });

  afterEach(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  function writeState(states) {
    const flows = Object.fromEntries(
      states.map(([flow, status]) => [
        path.relative(process.cwd(), flow).split(path.sep).join('/'),
        {status, attempts: 1},
      ]),
    );
    fs.writeFileSync(statePath, JSON.stringify({version: 1, flows}));
  }

  it('runs the flows when the state artifact is missing', () => {
    expect(prepareTestState(statePath, flowsDirectory)).toBe(true);
  });

  it('skips execution only when every expected flow has passed', () => {
    writeState([
      [first, 'passed'],
      [second, 'passed'],
    ]);
    expect(prepareTestState(statePath, flowsDirectory)).toBe(false);
  });

  it.each(['failed', 'pending'])(
    'runs unfinished flows with status %s',
    status => {
      writeState([
        [first, 'passed'],
        [second, status],
      ]);
      expect(prepareTestState(statePath, flowsDirectory)).toBe(true);
    },
  );

  it('does not skip a flow missing from an otherwise successful state', () => {
    writeState([[first, 'passed']]);
    expect(prepareTestState(statePath, flowsDirectory)).toBe(true);
  });

  it('ignores helper flows, which are not independently executed', () => {
    const helpers = path.join(flowsDirectory, 'helpers');
    fs.mkdirSync(helpers);
    fs.writeFileSync(path.join(helpers, 'fragment.yml'), '- tapOn: x');
    writeState([
      [first, 'passed'],
      [second, 'passed'],
    ]);
    expect(prepareTestState(statePath, flowsDirectory)).toBe(false);
  });

  it.each(['{invalid', 'null', '{"version":2,"flows":{}}'])(
    'discards invalid downloaded state %s before executing Maestro',
    state => {
      fs.writeFileSync(statePath, state);
      expect(prepareTestState(statePath, flowsDirectory)).toBe(true);
      expect(fs.existsSync(statePath)).toBe(false);
    },
  );

  it('does not interpret an empty flow directory as successful coverage', () => {
    fs.unlinkSync(first);
    fs.unlinkSync(second);
    writeState([]);
    expect(prepareTestState(statePath, flowsDirectory)).toBe(true);
  });
});
