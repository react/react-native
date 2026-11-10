/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScreenshotResult} from '../../runtime/ScreenshotContext';
import type {TestResult} from '../ScreenshotReporter';

import createImageRow from '../imageRow';
import createScreenshotReporter, {
  reportScreenshotPreviews,
} from '../ScreenshotReporter';
import {encodeTerminalImage, getImageProtocol} from '../terminalImages';
import {
  DefaultReporter,
  SummaryReporter,
  VerboseReporter,
} from '@jest/reporters';
import {Buffer} from 'node:buffer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import tty from 'node:tty';
import {PNG} from 'pngjs/lib/png';

jest.mock('@jest/reporters', () => {
  class MockDefaultReporter {
    onRunStart() {}
    onTestResult() {}
    onRunComplete() {}
  }
  return {
    DefaultReporter: MockDefaultReporter,
    SummaryReporter: class MockSummaryReporter {
      onRunStart() {}
      onRunComplete() {}
    },
    VerboseReporter: class MockVerboseReporter extends MockDefaultReporter {},
  };
});

const fixture = path.join(__dirname, 'fixtures', 'preview.png');
const png = fs.readFileSync(fixture);
const output = jest.fn<[string], boolean>(() => true);
let directory: string;
let differencePath: string;
let env: {[string]: string | void};
let savedEnvironment: typeof process.env;
const terminal = {isTTY: true, columns: 80, rows: 30, write: output};

beforeEach(() => {
  savedEnvironment = process.env;
  terminal.columns = 80;
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fantom-preview-test-'));
  differencePath = path.join(directory, 'image.diff.png');
  fs.writeFileSync(
    differencePath,
    PNG.sync.write(new PNG({width: 64, height: 128})),
  );
  env = {TERM_PROGRAM: 'iTerm.app'};
});

afterEach(() => {
  output.mockClear();
  jest.restoreAllMocks();
  process.env = savedEnvironment;
  fs.rmSync(directory, {recursive: true, force: true});
});

function report(
  changes: Partial<ScreenshotResult> = {},
  status: string = 'failed',
  supportsVSCodeImages: boolean = false,
): TestResult {
  const result: TestResult = {
    failureMessage: 'Expected old-hash, received new-hash',
    screenshotFailureMessage: 'Expected to match screenshot snapshot.',
    testResults: [
      {
        fullName: 'Example renders',
        status,
        screenshotResults: [
          {
            fileName: 'image.png',
            expectedPath: fixture,
            receivedPath: fixture,
            differencePath: changes.isNew === true ? undefined : differencePath,
            pass: false,
            isNew: false,
            ...changes,
          },
        ],
      },
    ],
  };
  Object.freeze(result);
  const terminalResult = reportScreenshotPreviews(
    result,
    terminal,
    env,
    supportsVSCodeImages,
  );
  expect(result.failureMessage).toContain('old-hash');
  return terminalResult;
}

it('detects iTerm2, WezTerm and Kitty', () => {
  for (const TERM_PROGRAM of ['iTerm.app', 'WezTerm']) {
    expect(getImageProtocol(true, {TERM_PROGRAM})).toBe('iterm2');
  }
  expect(getImageProtocol(true, {LC_TERMINAL: 'iTerm2'})).toBe('iterm2');
  expect(getImageProtocol(true, {TERM: 'xterm-kitty'})).toBe('kitty');
  expect(getImageProtocol(true, {KITTY_WINDOW_ID: '1'})).toBe('kitty');
});

it('shows previews in VS Code only with confirmed image support', () => {
  env = {TERM_PROGRAM: 'vscode', LC_TERMINAL: 'iTerm2'};
  expect(getImageProtocol(true, env)).toBe(null);
  expect(getImageProtocol(true, env, true)).toBe('iterm2');
  report({}, 'failed', true);
  expect(output).toHaveBeenCalledTimes(1);
});

it('keeps the image row header out of VS Code without confirmed image support', () => {
  env = {TERM_PROGRAM: 'vscode'};
  const result = report();
  expect(output).not.toHaveBeenCalled();
  expect(result.failureMessage).toContain('old-hash');
});

it('keeps text diagnostics in terminal multiplexers', () => {
  for (const multiplexer of [{TMUX: '/tmp/tmux'}, {STY: 'screen-session'}]) {
    env = {TERM_PROGRAM: 'iTerm.app', ...multiplexer};
    expect(getImageProtocol(true, env)).toBe(null);
    report();
    expect(output).not.toHaveBeenCalled();
  }
});

it('uses the detected terminal identity over SSH', () => {
  expect(
    getImageProtocol(true, {SSH_TTY: '/dev/pts/0', TERM_PROGRAM: 'iTerm.app'}),
  ).toBe('iterm2');
  expect(
    getImageProtocol(true, {SSH_TTY: '/dev/pts/0', TERM: 'xterm-kitty'}),
  ).toBe('kitty');
});

it('keeps image sequences out of CI, pipes and unsupported terminals', () => {
  expect(getImageProtocol(false, {TERM_PROGRAM: 'vscode'})).toBe(null);
  expect(getImageProtocol(true, {TERM: 'xterm-256color'})).toBe(null);
  expect(getImageProtocol(true, {CI: '1', TERM_PROGRAM: 'iTerm.app'})).toBe(
    null,
  );
  env.CI = 'true';
  report();
  expect(output).not.toHaveBeenCalled();
});

it('shows saved expected, received and difference PNGs in one row', () => {
  report();
  const text = output.mock.calls[0][0];
  expect(text).toContain('Screenshot snapshot: Example renders');
  expect(text).toMatch(/Expected +\| Received +\| Difference/);
  expect(text).toContain(`Expected: ${fixture}`);
  expect(text).toContain(`Received: ${fixture}`);
  expect(text).toContain(`Difference: ${differencePath}`);
  const images = [...text.matchAll(/preserveAspectRatio=1:([A-Za-z0-9+/=]+)/g)];
  expect(images.length).toBe(1);
  const row = PNG.sync.read(Buffer.from(images[0][1], 'base64'));
  const baseline = PNG.sync.read(png);
  const difference = PNG.sync.read(fs.readFileSync(differencePath));
  expect(row.width).toBe(224);
  expect(row.height).toBe(128);
  for (const [panel, image] of [baseline, baseline, difference].entries()) {
    for (let y = 0; y < image.height; y++) {
      const offset = (y * row.width + panel * 80) * 4;
      expect(
        row.data
          .subarray(offset, offset + image.width * 4)
          .equals(
            image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4),
          ),
      ).toBe(true);
    }
  }
  expect(text).not.toContain('\x1b7');
});

it('removes terminal control characters from test names while preserving Unicode text', () => {
  const result = report();
  output.mockClear();
  reportScreenshotPreviews(
    {
      ...result,
      testResults: result.testResults.map(test => ({
        ...test,
        fullName: '\x00\x1b[31mPreview\n\x7f\u0085 😀',
      })),
    },
    terminal,
    env,
  );
  expect(output.mock.calls[0][0]).toContain(
    'Screenshot snapshot: [31mPreview 😀',
  );
  expect(output.mock.calls[0][0]).not.toContain('\x1b[31m');
});

it('chunks Kitty transfers and preserves the complete PNG', () => {
  const text =
    encodeTerminalImage(png, 'kitty', {columns: 78, rows: 25, tmux: false})
      ?.sequence ?? '';
  const chunks = text
    .split('\x1b_G')
    .slice(1)
    .map(packet => {
      expect(packet.endsWith('\x1b\\')).toBe(true);
      return packet.slice(0, -2).split(';');
    });
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks[0][0]).toContain('a=T,f=100,t=d,q=2,');
  expect(chunks[chunks.length - 1][0]).toBe('m=0');
  for (const [index, chunk] of chunks.entries()) {
    expect(chunk[1].length).toBeLessThanOrEqual(4096);
    if (index !== chunks.length - 1) {
      expect(chunk[0]).toContain('m=1');
    }
  }
  expect(
    Buffer.from(chunks.map(chunk => chunk[1]).join(''), 'base64').equals(png),
  ).toBe(true);
});

it('bounds previews to the terminal and does not enlarge small images', () => {
  const small =
    encodeTerminalImage(png, 'kitty', {columns: 78, rows: 25, tmux: false})
      ?.sequence ?? '';
  expect(small).toContain('c=8,m=');
  const narrow =
    encodeTerminalImage(png, 'kitty', {columns: 4, rows: 25, tmux: false})
      ?.sequence ?? '';
  expect(narrow).toContain('c=4,m=');
  const short =
    encodeTerminalImage(png, 'kitty', {columns: 78, rows: 3, tmux: false})
      ?.sequence ?? '';
  expect(short).toContain('c=3,m=');
  const tiny =
    encodeTerminalImage(png, 'kitty', {columns: 1, rows: 1, tmux: false})
      ?.sequence ?? '';
  expect(tiny).toContain('c=1,m=');
});

it('wraps graphics for tmux passthrough', () => {
  for (const protocol of ['iterm2', 'kitty'] as const) {
    const direct =
      encodeTerminalImage(png, protocol, {columns: 78, rows: 25, tmux: false})
        ?.sequence ?? '';
    const wrapped =
      encodeTerminalImage(png, protocol, {columns: 78, rows: 25, tmux: true})
        ?.sequence ?? '';
    const packets = wrapped.split('\x1bPtmux;').slice(1);
    expect(
      packets
        .map(packet => {
          expect(packet.endsWith('\x1b\\')).toBe(true);
          return packet.slice(0, -2).replaceAll('\x1b\x1b', '\x1b');
        })
        .join(''),
    ).toBe(direct);
  }
});

it('shows a received preview when no baseline exists', () => {
  const result = report({
    isNew: true,
    expectedPath: '/nonexistent/baseline.png',
  });
  const text = output.mock.calls[0][0];
  expect(text).toContain('no baseline');
  expect(text).toContain(`Expected: /nonexistent/baseline.png`);
  expect(text).toContain(`Received: ${fixture}`);
  expect(text).toContain('Difference: no baseline');
  expect(text.split('\x1b]1337;').length - 1).toBe(1);
  expect(result.failureMessage).toBe(result.screenshotFailureMessage);
});

it('isolates missing previews and continues with other images', () => {
  report({expectedPath: '/nonexistent/baseline.png'});
  expect(output.mock.calls[0][0]).toContain('preview unavailable');
  expect(output.mock.calls[0][0]).toContain(
    'Expected: /nonexistent/baseline.png',
  );
  expect(output.mock.calls[0][0]).toContain(`Received: ${fixture}\n\x1b]1337;`);
  expect(output.mock.calls[0][0]).toContain(`Difference: ${differencePath}`);
  output.mockClear();
  report({receivedPath: '/nonexistent/received.png'});
  expect(output.mock.calls[0][0]).toContain(`Expected: ${fixture}\n\x1b]1337;`);
  expect(output.mock.calls[0][0]).toContain(
    'Received: /nonexistent/received.png',
  );
});

it('reports file read errors while continuing with readable previews', () => {
  report({expectedPath: directory});
  const text = output.mock.calls[0][0];
  expect(text).toContain(`Expected: ${directory}`);
  expect(text).toContain('EISDIR');
  expect(text).toContain(`Received: ${fixture}\n\x1b]1337;`);
  expect(text).toContain(`Difference: ${differencePath}`);
});

it('retains full failure diagnostics when none of the previews render', () => {
  const missing = path.join(directory, 'missing.png');
  const result: TestResult = {
    failureMessage: 'Expected old-hash, received new-hash',
    screenshotFailureMessage: 'Expected to match screenshot snapshot.',
    testResults: [
      {
        fullName: 'Example renders',
        status: 'failed',
        screenshotResults: [
          {
            fileName: 'image.png',
            expectedPath: missing,
            receivedPath: missing,
            differencePath: missing,
            pass: false,
            isNew: false,
          },
        ],
      },
    ],
  };
  const terminalResult = reportScreenshotPreviews(result, terminal, env);
  expect(terminalResult).toBe(result);
  expect(output.mock.calls[0][0]).not.toContain('\x1b]1337;');
  expect(result.failureMessage).toContain('old-hash');
});

it('retains full failure diagnostics when a required preview is unavailable', () => {
  const missing = path.join(directory, 'missing.png');
  for (const changes of [
    {expectedPath: missing},
    {receivedPath: missing},
    {differencePath: missing},
    {differencePath: undefined},
  ]) {
    const result = report(changes);
    const text = output.mock.calls[output.mock.calls.length - 1][0];
    expect(text.split('\x1b]1337;').length - 1).toBe(2);
    expect(result.failureMessage).toContain('old-hash');
  }
});

it('retains diagnostics for all failures when another screenshot has a partial preview', () => {
  const screenshot: ScreenshotResult = {
    fileName: 'image.png',
    expectedPath: fixture,
    receivedPath: fixture,
    differencePath,
    pass: false,
    isNew: false,
  };
  const result: TestResult = {
    failureMessage: 'Expected old-hash, received new-hash',
    screenshotFailureMessage: 'Expected to match screenshot snapshot.',
    testResults: [
      {
        fullName: 'Complete preview',
        status: 'failed',
        screenshotResults: [screenshot],
      },
      {
        fullName: 'Partial preview',
        status: 'failed',
        screenshotResults: [
          {...screenshot, expectedPath: path.join(directory, 'missing.png')},
        ],
      },
    ],
  };
  reportScreenshotPreviews(result, terminal, env);
  const text = output.mock.calls[0][0];
  expect(text).toContain('Complete preview');
  expect(text).toContain('Partial preview');
  expect(result.failureMessage).toContain('old-hash');
});

it('ignores passing, skipped, accepted and non-screenshot assertions', () => {
  report({pass: true});
  report({}, 'pending');
  report({}, 'passed');
  report({receivedPath: null});
  reportScreenshotPreviews(
    {
      testResults: [{fullName: 'Ordinary test', status: 'failed'}],
    },
    terminal,
    env,
  );
  expect(output).not.toHaveBeenCalled();
});

it('ignores unavailable or invalid PNG previews without changing failures', () => {
  report({
    expectedPath: '/nonexistent/baseline.png',
    receivedPath: '/nonexistent/received.png',
    differencePath: '/nonexistent/difference.png',
  });
  expect(output.mock.calls[0][0]).toContain(
    'Expected: /nonexistent/baseline.png',
  );
  expect(output.mock.calls[0][0]).toContain(
    'Received: /nonexistent/received.png',
  );
  expect(output.mock.calls[0][0]).not.toContain('\x1b]1337;');
  expect(
    encodeTerminalImage(Buffer.from('not a PNG'), 'iterm2', {
      columns: 78,
      rows: 25,
      tmux: false,
    }),
  ).toBe(null);
});

it('keeps the original result after successful previews and on output failures', () => {
  const result: TestResult = {
    failureMessage: 'Expected old-hash, received new-hash',
    screenshotFailureMessage: 'Expected to match screenshot snapshot.',
    testResults: [
      {
        fullName: 'Example renders',
        status: 'failed',
        screenshotResults: [
          {
            fileName: 'image.png',
            expectedPath: fixture,
            receivedPath: fixture,
            differencePath,
            pass: false,
            isNew: false,
          },
        ],
      },
    ],
  };
  reportScreenshotPreviews(result, {...terminal, isTTY: false}, env);
  expect(output).not.toHaveBeenCalled();
  expect(result.failureMessage).toContain('old-hash');
  reportScreenshotPreviews(result, terminal, {
    TERM: 'xterm-256color',
  });
  expect(output).not.toHaveBeenCalled();
  expect(result.failureMessage).toContain('old-hash');
  reportScreenshotPreviews(
    result,
    {
      ...terminal,
      write: () => {
        throw new Error('closed output');
      },
    },
    env,
  );
  expect(result.failureMessage).toContain('old-hash');
  Object.freeze(result);
  const terminalResult = reportScreenshotPreviews(result, terminal, env);
  expect(output).toHaveBeenCalledTimes(1);
  expect(output.mock.calls[0][0]).toContain(`Difference: ${differencePath}`);
  expect(terminalResult).not.toBe(result);
  expect(terminalResult.failureMessage).toBe(result.screenshotFailureMessage);
  expect(terminalResult.testResults).toBe(result.testResults);
  expect(result.failureMessage).toContain('old-hash');
});

it('stacks previews in a narrow terminal and prints all paths', () => {
  terminal.columns = 40;
  report();
  const text = output.mock.calls[0][0];
  expect(text).not.toContain(' | ');
  expect(text).toContain(`Expected: ${fixture}\n\x1b]1337;`);
  expect(text).toContain(`Received: ${fixture}\n\x1b]1337;`);
  expect(text).toContain(`Difference: ${differencePath}\n\x1b]1337;`);
});

it('falls back when a preview row cannot be decoded or is too large', () => {
  expect(createImageRow([png, Buffer.from('invalid')])).toBe(null);
  const corrupt = Buffer.from(png);
  corrupt[corrupt.length - 5] = (corrupt[corrupt.length - 5] + 1) % 256;
  expect(createImageRow([png, corrupt])).toBe(null);
  const oversized = Buffer.from(png);
  oversized.writeUInt32BE(4096, 16);
  oversized.writeUInt32BE(4096, 20);
  expect(createImageRow([oversized, oversized, oversized])).toBe(null);
});

it('preserves different image dimensions and pads the preview panels', () => {
  const images = [
    new PNG({width: 2, height: 3}),
    new PNG({width: 1, height: 4}),
    new PNG({width: 3, height: 1}),
  ];
  images[0].data.fill(255);
  images[1].data.fill(127);
  images[2].data.fill(63);
  const row = PNG.sync.read(
    createImageRow(images.map(image => PNG.sync.write(image))) ??
      Buffer.alloc(0),
  );
  const pixel = (x: number, y: number) => [
    ...row.data.subarray((y * row.width + x) * 4, (y * row.width + x + 1) * 4),
  ];
  expect(row.width).toBe(41);
  expect(row.height).toBe(4);
  expect(pixel(0, 0)).toEqual([255, 255, 255, 255]);
  expect(pixel(1, 2)).toEqual([255, 255, 255, 255]);
  expect(pixel(2, 0)).toEqual([0, 0, 0, 0]);
  expect(pixel(0, 3)).toEqual([0, 0, 0, 0]);
  expect(pixel(3, 0)).toEqual([0, 0, 0, 0]);
  expect(pixel(19, 3)).toEqual([127, 127, 127, 127]);
  expect(pixel(20, 0)).toEqual([0, 0, 0, 0]);
  expect(pixel(38, 0)).toEqual([63, 63, 63, 63]);
  expect(pixel(40, 0)).toEqual([63, 63, 63, 63]);
  expect(pixel(38, 1)).toEqual([0, 0, 0, 0]);
});

it('rejects PNGs with conflicting dimension headers', () => {
  const small = PNG.sync.write(new PNG({width: 1, height: 1}));
  const wide = PNG.sync.write(new PNG({width: 10, height: 1}));
  const conflicting = Buffer.concat([small.subarray(0, 33), wide.subarray(8)]);
  expect(createImageRow([conflicting, small])).toBe(null);
});

for (const verbose of [false, true]) {
  it(`preserves Jest reporter hooks with verbose=${String(verbose)}`, async () => {
    const start = jest.spyOn(DefaultReporter.prototype, 'onRunStart');
    const finish = jest.spyOn(DefaultReporter.prototype, 'onTestResult');
    const summaryStart = jest.spyOn(SummaryReporter.prototype, 'onRunStart');
    const reporter = createScreenshotReporter({verbose});
    expect(reporter).toBeInstanceOf(
      verbose ? VerboseReporter : DefaultReporter,
    );
    const aggregatedResults = {testResults: [] as Array<TestResult>};
    const options = {};
    reporter.onRunStart(aggregatedResults, options);
    expect(start).toHaveBeenCalledWith(aggregatedResults, options);
    expect(summaryStart).toHaveBeenCalledWith(aggregatedResults, options);
    const test = {};
    const result = Object.freeze({testResults: []});
    await reporter.onTestResult(test, result, aggregatedResults);
    expect(finish).toHaveBeenCalledWith(test, result, aggregatedResults);
  });
}

it('uses separate terminal results for the default reporter and final summary', async () => {
  process.env = {...process.env, TERM_PROGRAM: 'iTerm.app'};
  delete process.env.CI;
  delete process.env.TMUX;
  delete process.env.STY;
  jest.spyOn(process, 'stderr', 'get').mockReturnValue(
    Object.create(tty.WriteStream.prototype, {
      isTTY: {value: true},
      columns: {value: terminal.columns},
      rows: {value: terminal.rows},
      write: {value: output},
    }),
  );
  const finish = jest.spyOn(DefaultReporter.prototype, 'onTestResult');
  const complete = jest.spyOn(DefaultReporter.prototype, 'onRunComplete');
  const summary = jest.spyOn(SummaryReporter.prototype, 'onRunComplete');
  const reporter = createScreenshotReporter({});
  const result = Object.freeze({
    ...report(),
    failureMessage: 'Expected old-hash, received new-hash',
  });
  const testResults = Object.freeze([result]);
  const aggregatedResults = Object.freeze({testResults, numFailedTests: 1});
  const test = {};
  await reporter.onTestResult(test, result, aggregatedResults);
  const terminalResult = finish.mock.calls[0][1];
  expect(terminalResult).not.toBe(result);
  expect(terminalResult).toEqual({
    ...result,
    failureMessage: result.screenshotFailureMessage,
  });
  const testContexts = new Set<unknown>();
  reporter.onRunComplete(testContexts, aggregatedResults);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(summary).toHaveBeenCalledWith(testContexts, {
    ...aggregatedResults,
    testResults: [terminalResult],
  });
  expect(result.failureMessage).toContain('old-hash');
  expect(aggregatedResults.testResults).toBe(testResults);
});

it('collects failed screenshots in GitHub jobs without changing their results', async () => {
  process.env = {...process.env, GITHUB_ACTIONS: 'true', CI: 'true'};
  const save = jest
    .spyOn(require('../screenshotArtifacts'), 'default')
    .mockReturnValue([]);
  const screenshot: ScreenshotResult = {
    fileName: 'image.png',
    expectedPath: fixture,
    receivedPath: fixture,
    differencePath,
    pass: false,
    isNew: false,
  };
  const result = Object.freeze({
    failureMessage: 'Expected old-hash, received new-hash',
    testResults: [
      {fullName: 'fails', status: 'failed', screenshotResults: [screenshot]},
      {fullName: 'passes', status: 'passed', screenshotResults: [screenshot]},
    ],
  });
  const finish = jest.spyOn(DefaultReporter.prototype, 'onTestResult');
  const reporter = createScreenshotReporter({});
  await reporter.onTestResult({}, result, {testResults: [result]});
  expect(save).toHaveBeenCalledWith(
    [screenshot],
    path.resolve(__dirname, '../../build/screenshot-failures'),
  );
  expect(finish.mock.calls[0][1]).toBe(result);
  expect(result.failureMessage).toContain('old-hash');
});
