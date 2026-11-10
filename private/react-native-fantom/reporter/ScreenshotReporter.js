/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScreenshotResult} from '../runtime/ScreenshotContext';
import type {TerminalEnvironment} from './terminalImages';

import createImageRow from './imageRow';
import saveScreenshotArtifacts from './screenshotArtifacts';
import queryImageSupport from './terminalCapabilities';
import {encodeTerminalImage, getImageProtocol} from './terminalImages';
import {
  DefaultReporter,
  SummaryReporter,
  VerboseReporter,
} from '@jest/reporters';
import fs from 'node:fs';
import path from 'node:path';
import tty from 'node:tty';

export type TestResult = {
  readonly failureMessage?: ?string,
  readonly screenshotFailureMessage?: ?string,
  readonly testResults: ReadonlyArray<
    Readonly<{
      fullName: string,
      status: string,
      screenshotResults?: ReadonlyArray<ScreenshotResult>,
    }>,
  >,
};

type AggregatedResult = {
  readonly testResults: ReadonlyArray<TestResult>,
  ...
};

interface TerminalOutput {
  readonly isTTY?: boolean;
  readonly columns?: number;
  readonly rows?: number;
  write(string): unknown;
}

export default function createScreenshotReporter(globalConfig: {
  readonly verbose?: boolean,
  ...
}): DefaultReporter<TestResult, AggregatedResult> {
  const Reporter: Class<DefaultReporter<TestResult, AggregatedResult>> =
    globalConfig.verbose === true ? VerboseReporter : DefaultReporter;
  const summaryReporter = new SummaryReporter<AggregatedResult>(globalConfig);
  let terminalResults = new WeakMap<TestResult, TestResult>();
  return new (class ScreenshotReporter extends Reporter {
    #vsCodeImages: ?Promise<boolean> = null;

    onRunStart(aggregatedResults: unknown, options: unknown): void {
      this.#vsCodeImages = null;
      terminalResults = new WeakMap();
      super.onRunStart(aggregatedResults, options);
      summaryReporter.onRunStart(aggregatedResults, options);
    }

    async onTestResult(
      test: unknown,
      result: TestResult,
      aggregatedResults: AggregatedResult,
    ): Promise<void> {
      if (process.env.GITHUB_ACTIONS === 'true') {
        const errors = saveScreenshotArtifacts(
          result.testResults
            .filter(testResult => testResult.status === 'failed')
            .flatMap(testResult => testResult.screenshotResults ?? []),
          path.resolve(__dirname, '../build/screenshot-failures'),
        );
        for (const error of errors) {
          console.warn(error);
        }
      }
      const input = process.stdin;
      const output = process.stderr;
      let terminalResult = result;
      if (output instanceof tty.WriteStream) {
        let supportsVSCodeImages = false;
        if (
          process.env.TERM_PROGRAM === 'vscode' &&
          input instanceof tty.ReadStream &&
          getImageProtocol(output.isTTY, process.env, true) != null &&
          result.testResults.some(
            testResult =>
              testResult.status === 'failed' &&
              testResult.screenshotResults?.some(
                screenshot =>
                  !screenshot.pass && screenshot.receivedPath != null,
              ),
          )
        ) {
          this.#vsCodeImages ??= queryImageSupport(input, output);
          supportsVSCodeImages = await this.#vsCodeImages;
        }
        terminalResult = reportScreenshotPreviews(
          result,
          output,
          process.env,
          supportsVSCodeImages,
        );
      }
      terminalResults.set(result, terminalResult);
      await super.onTestResult(test, terminalResult, aggregatedResults);
    }

    onRunComplete(
      testContexts: unknown,
      aggregatedResults: AggregatedResult,
    ): void {
      super.onRunComplete(testContexts, aggregatedResults);
      summaryReporter.onRunComplete(testContexts, {
        ...aggregatedResults,
        testResults: aggregatedResults.testResults.map(
          result => terminalResults.get(result) ?? result,
        ),
      });
    }
  })(globalConfig);
}

export function reportScreenshotPreviews(
  result: TestResult,
  output: TerminalOutput,
  env: TerminalEnvironment,
  supportsVSCodeImages: boolean = false,
): TestResult {
  const protocol = getImageProtocol(output.isTTY, env, supportsVSCodeImages);
  if (protocol == null) {
    return result;
  }
  const readErrors = new Map<string, string>();
  const readImage = (file: string): ?Buffer => {
    try {
      return fs.readFileSync(file);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      readErrors.set(file, message.replace(/\p{Cc}/gu, ''));
      return null;
    }
  };
  const columns =
    output.columns != null && output.columns > 0 ? output.columns : 80;
  const rows = output.rows != null && output.rows > 0 ? output.rows : 30;
  const horizontal = columns >= 60;
  const preview = (png: Buffer) =>
    encodeTerminalImage(png, protocol, {
      columns: columns - 2,
      rows: rows - 9,
      tmux: env.TMUX != null,
    });
  let previews = '';
  let hasPreview = false;
  let allPreviewsRendered = true;
  for (const test of result.testResults) {
    if (test.status !== 'failed') {
      continue;
    }
    for (const screenshot of test.screenshotResults ?? []) {
      const receivedPath = screenshot.receivedPath;
      if (screenshot.pass || receivedPath == null) {
        continue;
      }
      const panels = [
        {
          label: 'Expected',
          path: screenshot.expectedPath,
          image: screenshot.isNew ? null : readImage(screenshot.expectedPath),
          unavailable: screenshot.isNew ? 'no baseline' : 'preview unavailable',
          required: !screenshot.isNew,
        },
        {
          label: 'Received',
          path: receivedPath,
          image: readImage(receivedPath),
          unavailable: 'preview unavailable',
          required: true,
        },
        {
          label: 'Difference',
          path: screenshot.differencePath,
          image:
            screenshot.differencePath == null
              ? null
              : readImage(screenshot.differencePath),
          unavailable: screenshot.isNew ? 'no baseline' : 'preview unavailable',
          required: !screenshot.isNew,
        },
      ];
      const title = test.fullName.replace(/\p{Cc}/gu, '');
      previews += `\nScreenshot snapshot: ${title}\n`;
      const images = panels
        .map(panel => panel.image)
        .filter(image => image != null);
      const row =
        horizontal && images.length === panels.length
          ? createImageRow(images)
          : null;
      const rowPreview = row == null ? null : preview(row);
      if (rowPreview != null) {
        hasPreview = true;
        const labelWidth = Math.max(
          8,
          Math.floor((rowPreview.columns - 6) / 3),
        );
        previews +=
          panels.map(panel => panel.label.padEnd(labelWidth)).join(' | ') +
          '\n';
        previews += rowPreview.sequence + '\n';
        for (const panel of panels) {
          previews += `${panel.label}: ${panel.path ?? panel.unavailable}\n`;
        }
      } else {
        for (const panel of panels) {
          previews += `${panel.label}: ${panel.path ?? panel.unavailable}\n`;
          const image = panel.image == null ? null : preview(panel.image);
          hasPreview ||= image != null;
          allPreviewsRendered &&= image != null || !panel.required;
          const readError = readErrors.get(panel.path ?? '');
          previews +=
            (image?.sequence ??
              (readError == null
                ? panel.unavailable
                : `preview unavailable: ${readError}`)) + '\n';
        }
      }
    }
  }
  if (previews === '') {
    return result;
  }
  try {
    output.write(previews);
  } catch {
    return result;
  }
  if (
    hasPreview &&
    allPreviewsRendered &&
    result.screenshotFailureMessage != null
  ) {
    return {...result, failureMessage: result.screenshotFailureMessage};
  }
  return result;
}
