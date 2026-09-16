/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  collectFlows,
  executeFlowSuite,
  filterFlowsByTags,
  loadState,
} = require('../maestro-android');

describe('Maestro Android runner', () => {
  let temporaryDirectory;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'maestro-android-test-'),
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(temporaryDirectory, {recursive: true, force: true});
  });

  it('collects flows recursively in a stable order', () => {
    const nestedDirectory = path.join(temporaryDirectory, 'nested');
    fs.mkdirSync(nestedDirectory);
    fs.writeFileSync(path.join(temporaryDirectory, 'second.yaml'), 'appId: x');
    fs.writeFileSync(path.join(temporaryDirectory, 'image.png'), 'not a flow');
    fs.writeFileSync(path.join(nestedDirectory, 'first.yml'), 'appId: x');

    expect(collectFlows(temporaryDirectory)).toEqual([
      path.join(nestedDirectory, 'first.yml'),
      path.join(temporaryDirectory, 'second.yaml'),
    ]);
  });

  it('excludes flows with matching tags', () => {
    const releaseOnlyFlow = path.join(
      temporaryDirectory,
      'android-release-only.yml',
    );
    const regularFlow = path.join(temporaryDirectory, 'regular.yml');
    fs.writeFileSync(
      releaseOnlyFlow,
      'appId: x\ntags:\n  - android-release-only\n---\n- launchApp\n',
    );
    fs.writeFileSync(regularFlow, 'appId: x\n---\n- launchApp\n');

    expect(
      filterFlowsByTags(
        [releaseOnlyFlow, regularFlow],
        ['android-release-only'],
      ),
    ).toEqual([regularFlow]);
  });

  it('runs every flow and retries only flows that have not passed', () => {
    const flows = ['first.yml', 'second.yml', 'third.yml'].map(file =>
      path.join(temporaryDirectory, file),
    );
    const statePath = path.join(temporaryDirectory, 'state', 'results.json');
    const firstAttempt = jest.fn(flow => {
      if (flow.endsWith('second.yml')) {
        throw new Error('failed assertion');
      }
    });

    expect(() =>
      executeFlowSuite({
        flows,
        appId: 'com.example',
        state: loadState(statePath),
        statePath,
        executeFlow: firstAttempt,
      }),
    ).toThrow('1 Maestro flow(s) failed');
    expect(firstAttempt).toHaveBeenCalledTimes(3);

    const retry = jest.fn();
    executeFlowSuite({
      flows,
      appId: 'com.example',
      state: loadState(statePath),
      statePath,
      executeFlow: retry,
    });

    expect(retry).toHaveBeenCalledTimes(1);
    expect(retry.mock.calls[0][0]).toBe(flows[1]);

    const finalState = loadState(statePath);
    expect(Object.values(finalState.flows)).toEqual([
      {status: 'passed', attempts: 1},
      {status: 'passed', attempts: 2},
      {status: 'passed', attempts: 1},
    ]);
  });
});
