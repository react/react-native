/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {getPngDimensions} from './pngUtils';
import {Buffer} from 'node:buffer';
import {PNG} from 'pngjs/lib/png';

export default function createImageDiff(
  expected: Buffer,
  received: Buffer,
): ?Buffer {
  const expectedSize = getPngDimensions(expected);
  const receivedSize = getPngDimensions(received);
  if (expectedSize == null || receivedSize == null) {
    return null;
  }
  const width = Math.max(expectedSize.width, receivedSize.width);
  const height = Math.max(expectedSize.height, receivedSize.height);
  if (width * height > 16 * 1024 * 1024) {
    return null;
  }
  try {
    const baseline = PNG.sync.read(expected);
    const capture = PNG.sync.read(received);
    const diff = new PNG({width, height});
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const a = (y * baseline.width + x) * 4;
        const b = (y * capture.width + x) * 4;
        const offset = (y * width + x) * 4;
        const inBaseline = x < baseline.width && y < baseline.height;
        const inCapture = x < capture.width && y < capture.height;
        const changed =
          inBaseline !== inCapture ||
          (inBaseline &&
            inCapture &&
            (baseline.data[a] !== capture.data[b] ||
              baseline.data[a + 1] !== capture.data[b + 1] ||
              baseline.data[a + 2] !== capture.data[b + 2] ||
              baseline.data[a + 3] !== capture.data[b + 3]));
        const shade = inBaseline
          ? Math.round(
              255 -
                (255 -
                  (baseline.data[a] * 0.2126 +
                    baseline.data[a + 1] * 0.7152 +
                    baseline.data[a + 2] * 0.0722)) *
                  (baseline.data[a + 3] / 255) *
                  0.15,
            )
          : 255;
        diff.data[offset] = changed ? 255 : shade;
        diff.data[offset + 1] = changed ? 0 : shade;
        diff.data[offset + 2] = changed ? 0 : shade;
        diff.data[offset + 3] = 255;
      }
    }
    return PNG.sync.write(diff);
  } catch {
    return null;
  }
}
