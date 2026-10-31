/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type Screenshot from '../src/Screenshot';

export type ScreenshotConfig = Readonly<{
  snapshotDirectory: string,
  receivedDirectory: string,
  files: ReadonlyArray<string>,
}>;

export type ScreenshotResult = Readonly<{
  fileName: string,
  expectedPath: string,
  receivedPath: ?string,
  differencePath?: string,
  pass: boolean,
  isNew: boolean,
}>;

export type UpdateSnapshot = 'all' | 'new' | 'none';

function getFileName(key: string): string {
  let hash = 0;
  let secondHash = 0;
  for (let index = 0; index < key.length; index++) {
    const character = key.charCodeAt(index);
    hash = (hash * 31 + character) % 4294967291;
    secondHash = (secondHash * 37 + character) % 4294967279;
  }
  const name = key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  return `${name}-${hash.toString(16)}-${secondHash.toString(16)}.png`;
}

export class ScreenshotContext {
  #config: ?ScreenshotConfig;
  #results: Array<ScreenshotResult> = [];

  configure(config: ?ScreenshotConfig): void {
    this.#config = config;
  }

  setTargetTest(_testFullName: string): void {
    this.#results = [];
  }

  record(
    screenshot: Screenshot,
    key: string,
    matchesHash: boolean,
    isNew: boolean,
  ): boolean {
    const config = this.#config;
    if (config == null) {
      throw new Error(
        'Screenshot snapshots must run inside a Fantom Jest test.',
      );
    }
    const fileName = getFileName(key);
    const expectedPath = `${config.snapshotDirectory}/${fileName}`;
    const receivedPath =
      matchesHash && config.files.includes(fileName)
        ? null
        : `${config.receivedDirectory}/${fileName}`;
    if (receivedPath != null) {
      screenshot.saveToFile(receivedPath);
    }
    this.#results.push({
      fileName,
      expectedPath,
      receivedPath,
      pass: matchesHash,
      isNew,
    });
    return matchesHash;
  }

  getFailureMessage(): string {
    const result = this.#results[this.#results.length - 1];
    const receivedPath = result?.receivedPath;
    if (receivedPath == null) {
      throw new Error('No failing screenshot to report.');
    }
    return `Expected screenshot: ${result.expectedPath}\nReceived screenshot: ${receivedPath}\nOpen these files to compare the images. Rerun the test with --updateSnapshot (-u) to accept the new screenshot.`;
  }

  getResults(): Array<ScreenshotResult> {
    return [...this.#results];
  }
}

export const screenshotContext: ScreenshotContext = new ScreenshotContext();
