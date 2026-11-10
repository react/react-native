/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  ScreenshotConfig,
  ScreenshotResult,
  UpdateSnapshot,
} from '../../runtime/ScreenshotContext';
import type {TestCaseResult} from '../../runtime/setup';

import createImageDiff from './imageDiff';
import fs from 'node:fs';
import path from 'node:path';

export function getScreenshotConfig(
  snapshotPath: string,
  receivedDirectory: string,
): ScreenshotConfig {
  const snapshotDirectory = path.join(
    path.dirname(snapshotPath),
    `${path.basename(snapshotPath, '.snap')}.screenshots`,
  );
  return {
    snapshotDirectory,
    receivedDirectory,
    files: fs.existsSync(snapshotDirectory)
      ? fs.readdirSync(snapshotDirectory).filter(file => file.endsWith('.png'))
      : [],
  };
}

export function createScreenshotDifferences(
  results: ReadonlyArray<ScreenshotResult>,
  updateSnapshot: UpdateSnapshot,
): Array<ScreenshotResult> {
  return results.map(result => {
    const receivedPath = result.receivedPath;
    if (
      result.pass ||
      result.isNew ||
      receivedPath == null ||
      updateSnapshot === 'all'
    ) {
      return result;
    }
    try {
      const difference = createImageDiff(
        fs.readFileSync(result.expectedPath),
        fs.readFileSync(receivedPath),
      );
      if (difference == null) {
        return result;
      }
      const differencePath = path.join(
        path.dirname(receivedPath),
        `${path.basename(receivedPath, '.png')}.diff.png`,
      );
      fs.writeFileSync(differencePath, difference);
      return {...result, differencePath};
    } catch (error: unknown) {
      console.error(
        `Failed to create Fantom screenshot difference between ${result.expectedPath} and ${receivedPath}: ${String(error)}`,
      );
      return result;
    }
  });
}

export function formatScreenshotFailure(
  message: string,
  results: ReadonlyArray<ScreenshotResult>,
): string {
  const differences = new Map<string, string>();
  for (const result of results) {
    if (result.differencePath != null && result.receivedPath != null) {
      differences.set(
        `Expected screenshot: ${result.expectedPath}\nReceived screenshot: ${result.receivedPath}`,
        `Difference screenshot: ${result.differencePath}`,
      );
    }
  }
  const lines = message.split('\n');
  return lines
    .flatMap((line, index) => {
      const difference = differences.get(`${lines[index - 1]}\n${line}`);
      return difference == null || lines[index + 1] === difference
        ? [line]
        : [line, difference];
    })
    .join('\n');
}

export function processScreenshotResults(
  config: ScreenshotConfig,
  results: ReadonlyArray<ScreenshotResult>,
  updateSnapshot: UpdateSnapshot,
  testResults: ReadonlyArray<Readonly<{status: TestCaseResult['status'], ...}>>,
): void {
  const used = new Set<string>();
  const errors: Array<string> = [];
  for (const result of results) {
    used.add(result.fileName);
    const receivedPath = result.receivedPath;
    if (receivedPath == null) {
      continue;
    }
    if (
      !result.pass &&
      updateSnapshot !== 'all' &&
      !(result.isNew && updateSnapshot === 'new')
    ) {
      continue;
    }
    try {
      fs.mkdirSync(config.snapshotDirectory, {recursive: true});
      fs.copyFileSync(receivedPath, result.expectedPath);
      fs.rmSync(receivedPath, {force: true});
    } catch (error: unknown) {
      errors.push(`${result.expectedPath}: ${String(error)}`);
    }
  }
  if (
    errors.length === 0 &&
    updateSnapshot === 'all' &&
    testResults.length > 0 &&
    testResults.every(result => result.status === 'passed')
  ) {
    for (const file of config.files) {
      if (!used.has(file)) {
        const imagePath = path.join(config.snapshotDirectory, file);
        try {
          fs.rmSync(imagePath, {force: true});
        } catch (error: unknown) {
          errors.push(`${imagePath}: ${String(error)}`);
        }
      }
    }
  }
  if (errors.length > 0) {
    throw new Error(
      `Failed to process Fantom screenshot snapshots:\n${errors.join('\n')}`,
    );
  }
}
