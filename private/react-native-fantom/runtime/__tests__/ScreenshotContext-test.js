/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScreenshotConfig} from '../ScreenshotContext';

import Screenshot from '../../src/Screenshot';
import runtimeExpect from '../expect';
import {ScreenshotContext, screenshotContext} from '../ScreenshotContext';
import {setupSnapshotConfig, snapshotContext} from '../snapshotContext';

function createScreenshot() {
  const saveToFile = jest.fn<[string], void>();
  const screenshot = new Screenshot({
    saveToFile,
    getHash: () => 'pixel-hash',
    isEqual: () => true,
  });
  return {screenshot, saveToFile};
}

function createContext(files: Array<string> = []): ScreenshotContext {
  const context = new ScreenshotContext();
  context.configure({
    snapshotDirectory: '/snapshots',
    receivedDirectory: '/received',
    files,
  });
  context.setTargetTest('Example renders');
  return context;
}

it('reports a missing failure without an incidental property access error', () => {
  expect(() => createContext().getFailureMessage()).toThrow(
    'No failing screenshot to report.',
  );
});

for (const mode of ['new', 'none', 'all'] as const) {
  it(`compares inline screenshot hashes without saving images in ${mode} mode`, () => {
    const {screenshot, saveToFile} = createScreenshot();
    const serialized =
      '\nObject {\n  "hash": "pixel-hash",\n  "type": "Screenshot",\n}\n';
    setupSnapshotConfig({updateSnapshot: mode, data: {}});
    snapshotContext.setTargetTest('inline screenshot');
    runtimeExpect(screenshot).toMatchInlineSnapshot(serialized);
    expect(snapshotContext.getInlineSnapshotResults()).toEqual([{pass: true}]);

    const mismatch = () =>
      runtimeExpect(screenshot).toMatchInlineSnapshot(
        serialized.replace('pixel-hash', 'old-hash'),
      );
    if (mode === 'all') {
      mismatch();
    } else {
      let message;
      try {
        mismatch();
      } catch (error) {
        message = error.message;
      }
      expect(message).toContain('Expected to match inline snapshot.');
    }
    expect(snapshotContext.getInlineSnapshotResults()[1].value).toBe(
      serialized,
    );
    expect(snapshotContext.getSnapshotResults()).toEqual({});
    expect(screenshotContext.getResults()).toEqual([]);
    expect(saveToFile).not.toHaveBeenCalled();
  });
}

it('creates an inline screenshot hash without saving an image', () => {
  const {screenshot, saveToFile} = createScreenshot();
  setupSnapshotConfig({updateSnapshot: 'new', data: {}});
  snapshotContext.setTargetTest('inline screenshot');
  runtimeExpect(screenshot).toMatchInlineSnapshot();
  expect(snapshotContext.getInlineSnapshotResults()[0].isNew).toBe(true);
  expect(snapshotContext.getInlineSnapshotResults()[0].value).toContain(
    '"hash": "pixel-hash"',
  );
  expect(screenshotContext.getResults()).toEqual([]);
  expect(saveToFile).not.toHaveBeenCalled();
});

it('writes an inspectable image for a new snapshot and exposes failure paths', () => {
  const context = createContext();
  const {screenshot, saveToFile} = createScreenshot();
  expect(context.record(screenshot, 'Example renders 1', false, true)).toBe(
    false,
  );
  const result = context.getResults()[0];
  expect(result.isNew).toBe(true);
  expect(saveToFile).toHaveBeenCalledWith(result.receivedPath);
  expect(context.getFailureMessage()).toContain(result.expectedPath);
  expect(context.getFailureMessage()).toContain('--updateSnapshot');
});

it('does not encode or save a passing screenshot', () => {
  const {screenshot, saveToFile} = createScreenshot();
  const initial = createContext();
  initial.record(screenshot, 'Example renders 1', false, true);
  const context = createContext([initial.getResults()[0].fileName]);
  saveToFile.mockClear();
  expect(context.record(screenshot, 'Example renders 1', true, false)).toBe(
    true,
  );
  expect(saveToFile).not.toHaveBeenCalled();
  expect(context.getResults()[0].receivedPath).toBe(null);
});

it('saves a matching screenshot when its standalone image is missing', () => {
  const context = createContext();
  const {screenshot, saveToFile} = createScreenshot();
  expect(context.record(screenshot, 'Example renders 1', true, false)).toBe(
    true,
  );
  expect(saveToFile).toHaveBeenCalledTimes(1);
  expect(context.getResults()[0].pass).toBe(true);
});

for (const mode of ['new', 'none', 'all'] as const) {
  it(`matches the stored hash without an image in ${mode} mode`, () => {
    const {screenshot, saveToFile} = createScreenshot();
    setupSnapshotConfig({
      updateSnapshot: mode,
      data: {'Example renders 1': 'pixel-hash'},
      screenshots: {
        snapshotDirectory: '/snapshots',
        receivedDirectory: '/received',
        files: [],
      },
    });
    snapshotContext.setTargetTest('Example renders');
    screenshotContext.setTargetTest('Example renders');
    snapshotContext.toMatchSnapshot('pixel-hash', null, screenshot);
    expect(snapshotContext.getSnapshotResults()['Example renders 1'].pass).toBe(
      true,
    );
    expect(saveToFile).toHaveBeenCalledTimes(1);
  });
}

it('keeps names bounded and distinguishes sanitized snapshot keys', () => {
  const context = createContext();
  const {screenshot} = createScreenshot();
  context.record(screenshot, `${'a'.repeat(400)}: ../first 1`, false, true);
  context.record(screenshot, `${'a'.repeat(400)}: ..\\first 1`, false, true);
  const [first, second] = context.getResults();
  expect(first.fileName.length).toBeLessThan(255);
  expect(first.fileName).not.toContain('/');
  expect(first.fileName).not.toBe(second.fileName);
});

it('uses normal snapshot keys and honors new, update, and CI modes', () => {
  const {screenshot} = createScreenshot();
  const config: ScreenshotConfig = {
    snapshotDirectory: '/snapshots',
    receivedDirectory: '/received',
    files: [],
  };
  const key = 'Example renders: image 2';
  setupSnapshotConfig({updateSnapshot: 'new', data: {}, screenshots: config});
  snapshotContext.setTargetTest('Example renders');
  screenshotContext.setTargetTest('Example renders');
  snapshotContext.toMatchSnapshot('text', null);
  snapshotContext.toMatchSnapshot('pixel-hash', 'image', screenshot);
  expect(Object.keys(snapshotContext.getSnapshotResults())).toEqual([
    'Example renders 1',
    key,
  ]);
  const fileName = screenshotContext.getResults()[0].fileName;
  for (const mode of ['new', 'none', 'all'] as const) {
    setupSnapshotConfig({
      updateSnapshot: mode,
      data: {'Example renders 1': 'text', [key]: 'old-hash'},
      screenshots: {...config, files: [fileName]},
    });
    snapshotContext.setTargetTest('Example renders');
    snapshotContext.toMatchSnapshot('text', null);
    const match = () =>
      snapshotContext.toMatchSnapshot('pixel-hash', 'image', screenshot);
    if (mode === 'all') {
      match();
    } else {
      expect(match).toThrow('Expected to match snapshot.');
    }
    expect(snapshotContext.getSnapshotResults()[key]).toEqual({
      pass: false,
      value: 'pixel-hash',
    });
  }
});

it('requires configuration and propagates save errors', () => {
  const {screenshot} = createScreenshot();
  expect(() =>
    new ScreenshotContext().record(screenshot, 'test 1', false, true),
  ).toThrow('inside a Fantom Jest test');
  const failure = new Screenshot({
    saveToFile: () => {
      throw new Error('Cannot save PNG');
    },
    getHash: () => 'hash',
    isEqual: () => false,
  });
  expect(() => createContext().record(failure, 'test 1', false, true)).toThrow(
    'Cannot save PNG',
  );
});
