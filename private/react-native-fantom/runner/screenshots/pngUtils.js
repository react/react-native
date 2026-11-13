/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {Buffer} from 'node:buffer';

export function getPngDimensions(
  png: Buffer,
): ?Readonly<{width: number, height: number}> {
  if (
    png.length < 33 ||
    png.length > 32 * 1024 * 1024 ||
    !png
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    png.toString('ascii', 12, 16) !== 'IHDR' ||
    png.readUInt32BE(8) !== 13
  ) {
    return null;
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width === 0 || height === 0 || width * height > 16 * 1024 * 1024) {
    return null;
  }
  let offset = 33;
  while (offset + 12 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const end = offset + length + 12;
    if (end > png.length || type === 'IHDR') {
      return null;
    }
    if (type === 'IEND') {
      return length === 0 ? {width, height} : null;
    }
    offset = end;
  }
  return null;
}
