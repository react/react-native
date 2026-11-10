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

import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export default function saveScreenshotArtifacts(
  results: ReadonlyArray<ScreenshotResult>,
  directory: string,
): Array<string> {
  const errors = [];
  for (const result of results) {
    const receivedPath = result.receivedPath;
    if (result.pass || receivedPath == null) {
      continue;
    }
    const identity = createHash('sha256')
      .update(path.resolve(receivedPath))
      .digest('hex');
    const destination = path.join(
      directory,
      path.basename(path.dirname(receivedPath)),
      `${path.basename(receivedPath, '.png')}-${identity}`,
    );
    const images = [
      ['expected', result.isNew ? null : result.expectedPath],
      ['received', receivedPath],
      ['difference', result.differencePath],
    ];
    for (const [label, file] of images) {
      if (file == null) {
        continue;
      }
      try {
        fs.mkdirSync(destination, {recursive: true});
        fs.copyFileSync(file, path.join(destination, `${label}.png`));
      } catch (error: unknown) {
        errors.push(
          `Failed to save screenshot artifact ${file}: ${String(error)}`,
        );
      }
    }
  }
  return errors;
}
