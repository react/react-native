/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {getPngDimensions} from '../runner/screenshots/pngUtils';
import {Buffer} from 'node:buffer';
import {PNG} from 'pngjs/lib/png';

export default function createImageRow(images: ReadonlyArray<Buffer>): ?Buffer {
  const sizes = images.map(getPngDimensions);
  if (sizes.length === 0 || sizes.some(size => size == null)) {
    return null;
  }
  const panelWidth = Math.max(...sizes.map(size => size?.width ?? 0));
  const height = Math.max(...sizes.map(size => size?.height ?? 0));
  const gap = 16;
  const width = panelWidth * images.length + gap * (images.length - 1);
  if (width * height > 16 * 1024 * 1024) {
    return null;
  }
  try {
    const row = new PNG({width, height});
    for (const [index, image] of images.entries()) {
      const png = PNG.sync.read(image);
      for (let y = 0; y < png.height; y++) {
        row.data.set(
          png.data.subarray(y * png.width * 4, (y + 1) * png.width * 4),
          (y * width + index * (panelWidth + gap)) * 4,
        );
      }
    }
    return PNG.sync.write(row);
  } catch {
    return null;
  }
}
