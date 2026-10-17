/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Reads width and height from a PNG's IHDR chunk without decoding pixels, so
 * that untrusted files can be checked before any image library sees them.
 * Returns null if the buffer does not start with a well-formed PNG header.
 */
function readPngDimensions(buffer) {
  if (
    buffer.length < 24 ||
    !buffer.subarray(0, 8).equals(PNG_SIGNATURE) ||
    buffer.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    return null;
  }
  return {width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20)};
}

module.exports = {readPngDimensions};
