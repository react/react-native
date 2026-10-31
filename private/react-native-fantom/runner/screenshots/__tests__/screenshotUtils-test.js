/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScreenshotResult} from '../../../runtime/ScreenshotContext';

import {
  createScreenshotDifferences,
  formatScreenshotFailure,
  getScreenshotConfig,
  processScreenshotResults,
} from '../screenshotUtils';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PNG} from 'pngjs/lib/png';

let directory: string;
const passedTests = [{status: 'passed' as const}];
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fantom-screenshot-test-'));
});
afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(directory, {recursive: true, force: true});
});

function createResult(
  isNew: boolean,
  pass: boolean,
): {...ScreenshotResult, receivedPath: string} {
  const config = getScreenshotConfig(
    path.join(directory, '__snapshots__', 'example-test.js.snap'),
    directory,
  );
  const expectedPath = path.join(config.snapshotDirectory, 'image.png');
  const receivedPath = path.join(directory, 'actual.png');
  fs.writeFileSync(receivedPath, 'new image');
  if (!isNew) {
    fs.mkdirSync(config.snapshotDirectory, {recursive: true});
    fs.writeFileSync(expectedPath, 'old image');
  }
  return {fileName: 'image.png', expectedPath, receivedPath, pass, isNew};
}

function getConfig() {
  return getScreenshotConfig(
    path.join(directory, '__snapshots__', 'example-test.js.snap'),
    directory,
  );
}

function createPngResult(): {...ScreenshotResult, receivedPath: string} {
  const result = createResult(false, false);
  const baseline = new PNG({width: 1, height: 1});
  baseline.data.set([0, 0, 255, 255]);
  const capture = new PNG({width: 1, height: 1});
  capture.data.set([0, 255, 0, 255]);
  fs.writeFileSync(result.expectedPath, PNG.sync.write(baseline));
  fs.writeFileSync(result.receivedPath, PNG.sync.write(capture));
  return result;
}

for (const mode of ['none', 'new'] as const) {
  it(`saves a difference beside the received PNG in ${mode} mode`, () => {
    const result = createPngResult();
    const baseline = fs.readFileSync(result.expectedPath);
    const received = fs.readFileSync(result.receivedPath);
    const [processed] = createScreenshotDifferences([result], mode);
    const differencePath = processed.differencePath;
    expect(differencePath).toBe(path.join(directory, 'actual.diff.png'));
    if (differencePath == null) {
      throw new Error('Missing difference PNG');
    }
    expect([...PNG.sync.read(fs.readFileSync(differencePath)).data]).toEqual([
      255, 0, 0, 255,
    ]);
    expect(fs.readFileSync(result.expectedPath).equals(baseline)).toBe(true);
    expect(fs.readFileSync(result.receivedPath).equals(received)).toBe(true);
    const message = `Expected screenshot: ${result.expectedPath}\nReceived screenshot: ${result.receivedPath}\nOpen these files.`;
    expect(formatScreenshotFailure(message, [processed])).toContain(
      `Received screenshot: ${result.receivedPath}\nDifference screenshot: ${differencePath}\nOpen these files.`,
    );
    expect(formatScreenshotFailure('unrelated error', [processed])).toBe(
      'unrelated error',
    );
  });
}

it('adds each difference to the matching diagnostic block without matching path prefixes', () => {
  const result = createResult(false, false);
  const first = {...result, differencePath: `${directory}/first.diff.png`};
  const second = {
    ...result,
    receivedPath: `${result.receivedPath}.other.png`,
    differencePath: `${directory}/second.$&.diff.png`,
  };
  const block = (item: Readonly<{...ScreenshotResult, receivedPath: string}>) =>
    `Expected screenshot: ${item.expectedPath}\nReceived screenshot: ${item.receivedPath}`;
  const message = `${block(second)}\nOther error\n${block(first)}`;
  const expected = `${block(second)}\nDifference screenshot: ${second.differencePath}\nOther error\n${block(first)}\nDifference screenshot: ${first.differencePath}`;
  expect(formatScreenshotFailure(message, [first, second])).toBe(expected);
  expect(formatScreenshotFailure(expected, [first, second])).toBe(expected);
});

it('formats repeated diagnostic blocks without changing unrelated path mentions', () => {
  const result = createResult(false, false);
  const processed = {...result, differencePath: `${directory}/actual.diff.png`};
  const block = `Expected screenshot: ${result.expectedPath}\nReceived screenshot: ${result.receivedPath}`;
  const unrelated = `Other error mentions Received screenshot: ${result.receivedPath}`;
  const formatted = `${block}\nDifference screenshot: ${processed.differencePath}`;
  expect(
    formatScreenshotFailure(`${unrelated}\n${block}\n${block}`, [processed]),
  ).toBe(`${unrelated}\n${formatted}\n${formatted}`);
  expect(
    formatScreenshotFailure(`Received screenshot: ${result.receivedPath}`, [
      processed,
    ]),
  ).toBe(`Received screenshot: ${result.receivedPath}`);
});

it('does not generate differences for passes, updates or missing baselines', () => {
  const result = createPngResult();
  for (const unchanged of [
    {...result, pass: true},
    {...result, isNew: true},
    {...result, receivedPath: null},
  ]) {
    expect(createScreenshotDifferences([unchanged], 'none')[0]).toBe(unchanged);
  }
  expect(createScreenshotDifferences([result], 'all')[0]).toBe(result);
  expect(fs.existsSync(path.join(directory, 'actual.diff.png'))).toBe(false);
});

it('continues generating differences after missing, corrupt or unwritable files', () => {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  const result = createPngResult();
  const missing = path.join(directory, 'missing.png');
  const corrupt = path.join(directory, 'corrupt.png');
  fs.writeFileSync(corrupt, 'not a PNG');
  const writeFileSync = fs.writeFileSync;
  jest.spyOn(fs, 'writeFileSync').mockImplementation((file, data, options) => {
    if (file === path.join(directory, 'unwritable.diff.png')) {
      throw new Error('Cannot write difference');
    }
    return writeFileSync(file, data, options);
  });
  const unwritable = path.join(directory, 'unwritable.png');
  fs.copyFileSync(result.receivedPath, unwritable);
  const results = createScreenshotDifferences(
    [
      {...result, expectedPath: missing},
      {...result, receivedPath: corrupt},
      {...result, receivedPath: unwritable},
      result,
    ],
    'none',
  );
  for (const failed of results.slice(0, 3)) {
    expect(failed.differencePath).toBe(undefined);
  }
  expect(results[3].differencePath).toBe(
    path.join(directory, 'actual.diff.png'),
  );
  expect(consoleError).toHaveBeenCalledTimes(2);
  expect(consoleError).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining(missing),
  );
  expect(consoleError).toHaveBeenNthCalledWith(
    2,
    `Failed to create Fantom screenshot difference between ${result.expectedPath} and ${unwritable}: Error: Cannot write difference`,
  );
});

it('creates new images next to Jest snapshots', () => {
  const result = createResult(true, false);
  processScreenshotResults(getConfig(), [result], 'new', passedTests);
  expect(result.expectedPath).toContain(
    '__snapshots__/example-test.js.screenshots/',
  );
  expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('new image');
  expect(
    result.receivedPath == null || !fs.existsSync(result.receivedPath),
  ).toBe(true);
});

it('preserves both images for a mismatch without -u', () => {
  const result = createResult(false, false);
  processScreenshotResults(getConfig(), [result], 'new', [{status: 'failed'}]);
  expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('old image');
  expect(fs.readFileSync(result.receivedPath, 'utf8')).toBe('new image');
});

it('updates existing baselines with -u', () => {
  const result = createResult(false, false);
  processScreenshotResults(getConfig(), [result], 'all', passedTests);
  expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('new image');
});

it('tolerates a received image disappearing after it is copied', () => {
  const result = createResult(false, false);
  const copyFileSync = fs.copyFileSync;
  jest.spyOn(fs, 'copyFileSync').mockImplementation((source, destination) => {
    copyFileSync(source, destination);
    fs.unlinkSync(source);
  });
  processScreenshotResults(getConfig(), [result], 'all', passedTests);
  expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('new image');
});

it('fails when a received image is missing before it can be copied', () => {
  const result = createResult(false, false);
  fs.unlinkSync(result.receivedPath);
  expect(() =>
    processScreenshotResults(getConfig(), [result], 'all', passedTests),
  ).toThrow();
  expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('old image');
});

it('continues saving other captures after a copy error and retains the failed capture', () => {
  const result = createResult(false, false);
  const config = getConfig();
  const otherReceivedPath = path.join(directory, 'other.png');
  const otherExpectedPath = path.join(config.snapshotDirectory, 'other.png');
  fs.writeFileSync(otherReceivedPath, 'other image');
  const other = {
    ...result,
    fileName: 'other.png',
    expectedPath: otherExpectedPath,
    receivedPath: otherReceivedPath,
  };
  expect(() =>
    processScreenshotResults(
      config,
      [{...result, expectedPath: config.snapshotDirectory}, other],
      'all',
      passedTests,
    ),
  ).toThrow(config.snapshotDirectory);
  expect(fs.readFileSync(result.receivedPath, 'utf8')).toBe('new image');
  expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('old image');
  expect(fs.readFileSync(otherExpectedPath, 'utf8')).toBe('other image');
  expect(fs.existsSync(otherReceivedPath)).toBe(false);
});

it('does not create missing baselines in CI', () => {
  const result = createResult(true, false);
  processScreenshotResults(getConfig(), [result], 'none', [{status: 'failed'}]);
  expect(fs.existsSync(result.expectedPath)).toBe(false);
  expect(fs.existsSync(result.receivedPath)).toBe(true);
});

it('keeps existing images for successful hash matches', () => {
  const result = createResult(false, true);
  fs.unlinkSync(result.receivedPath);
  const matchingResult = {...result, receivedPath: null};
  processScreenshotResults(getConfig(), [matchingResult], 'none', passedTests);
  expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('old image');
  expect(
    result.receivedPath == null || !fs.existsSync(result.receivedPath),
  ).toBe(true);
});

for (const mode of ['new', 'none', 'all'] as const) {
  it(`recreates a missing image with a matching hash in ${mode} mode`, () => {
    const result = createResult(false, true);
    fs.unlinkSync(result.expectedPath);
    processScreenshotResults(getConfig(), [result], mode, passedTests);
    expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('new image');
    expect(fs.existsSync(result.receivedPath)).toBe(false);
  });
}

it('preserves unchecked baselines when no tests ran', () => {
  const result = createResult(false, true);
  processScreenshotResults(getConfig(), [], 'all', []);
  expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('old image');
});

for (const status of ['failed', 'pending'] as const) {
  it(`preserves unchecked baselines after a ${status} test`, () => {
    const result = createResult(false, true);
    processScreenshotResults(getConfig(), [], 'all', [
      ...passedTests,
      {status},
    ]);
    expect(fs.readFileSync(result.expectedPath, 'utf8')).toBe('old image');
  });
}

it('removes unchecked baselines with -u after a successful suite', () => {
  const result = createResult(false, true);
  processScreenshotResults(getConfig(), [], 'all', passedTests);
  expect(fs.existsSync(result.expectedPath)).toBe(false);
});
