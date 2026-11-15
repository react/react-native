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
import {
  ScreenshotSnapshotError,
  setupSnapshotConfig,
  snapshotContext,
} from '../snapshotContext';

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

it('retains text diagnostics and a preview alternative for screenshot failures', () => {
  const {screenshot} = createScreenshot();
  const config = {
    updateSnapshot: 'none' as const,
    screenshots: {
      snapshotDirectory: '/snapshots',
      receivedDirectory: '/received',
      files: [],
    },
  };
  for (const data of [{}, {'Example renders 1': 'old-hash'}]) {
    setupSnapshotConfig({...config, data});
    snapshotContext.setTargetTest('Example renders');
    screenshotContext.setTargetTest('Example renders');
    let failure;
    try {
      snapshotContext.toMatchSnapshot(
        'Screenshot {hash: pixel-hash}',
        null,
        screenshot,
      );
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(ScreenshotSnapshotError);
    if (!(failure instanceof ScreenshotSnapshotError)) {
      return;
    }
    expect(failure.message).toContain('/snapshots');
    const preview = failure.getPreviewMessage();
    expect(preview).toContain('screenshot snapshot');
    expect(preview).not.toContain('old-hash');
    expect(preview).not.toContain('pixel-hash');
    expect(preview).not.toContain('Screenshot {');
    expect(preview).not.toContain('/snapshots');
    expect(snapshotContext.getSnapshotResults()['Example renders 1'].pass).toBe(
      false,
    );
  }
});

it('preserves text diagnostics for unsupported terminals and ordinary snapshots', () => {
  const {screenshot} = createScreenshot();
  for (const isScreenshot of [false, true]) {
    setupSnapshotConfig({
      updateSnapshot: 'none',
      data: {'Example renders 1': 'old-hash'},
      screenshots: {
        snapshotDirectory: '/snapshots',
        receivedDirectory: '/received',
        files: [],
      },
    });
    snapshotContext.setTargetTest('Example renders');
    screenshotContext.setTargetTest('Example renders');
    expect(() =>
      snapshotContext.toMatchSnapshot(
        'pixel-hash',
        null,
        isScreenshot ? screenshot : undefined,
      ),
    ).toThrow('old-hash');
  }
});

it('keeps preview diagnostics independent of a rewritten error stack', () => {
  const message =
    'Expected old-hash, received new-hash\nReceived: /received/image.png';
  const failure = new ScreenshotSnapshotError(
    message,
    'Expected to match screenshot snapshot.',
  );
  for (const stack of [
    'Error: Expected old-hash, received new-hash\n    at assertion (test.js:10:2)',
    '    at assertion (test.js:10:2)',
  ]) {
    failure.stack = stack;
    const preview = failure.getPreviewMessage();
    expect(preview).toContain('Expected to match screenshot snapshot.');
    expect(preview).not.toContain('old-hash');
    expect(preview).not.toContain('new-hash');
    expect(preview).not.toContain('/received/image.png');
    expect(failure.message).toBe(message);
    expect(failure.stack).toBe(stack);
  }
});
