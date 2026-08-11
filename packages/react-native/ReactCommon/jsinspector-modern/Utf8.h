/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stdexcept>
#include <vector>

namespace facebook::react::jsinspector_modern {

/**
 * Takes a vector of bytes representing a fragment of a UTF-8 string, and
 * removes the minimum number (0-3) of trailing bytes so that the remainder is
 * valid UTF-8. Useful for slicing binary data into UTF-8 strings.
 *
 * \param buffer Buffer to operate on - will be resized if necessary.
 */
inline void truncateToValidUTF8(std::vector<char>& buffer) {
  const auto length = buffer.size();
  // Ensure we don't cut a UTF-8 code point in the middle by removing any
  // trailing bytes representing an incomplete UTF-8 code point.

  // If the last byte is a UTF-8 first byte or continuation byte (topmost bit
  // is 1) (otherwise the last char is ASCII and we don't need to do
  // anything).
  if (length > 0 && (buffer[length - 1] & 0b10000000) == 0b10000000) {
    int continuationBytes = 0;
    // Find the first byte of the UTF-8 code point (topmost bits 11) and count
    // the number of continuation bytes following it.
    while ((buffer[length - continuationBytes - 1] & 0b11000000) !=
           0b11000000) {
      continuationBytes++;
      if (continuationBytes > 3 || continuationBytes >= length - 1) {
        throw std::runtime_error("Invalid UTF-8 sequence");
      }
    }
    char firstByteOfSequence = buffer[length - continuationBytes - 1];
    // Check for the special case that our original cut point was at the end
    // of a UTF-8 code-point, and therefore already valid. This will be the
    // case if the first byte indicates continuationBytes continuation bytes
    // should follow, i.e. its top bits are (1+continuationBytes) 1's followed
    // by a 0.
    char mask = static_cast<char>(0b11111000 << (3 - continuationBytes));
    char expectedBitsAfterMask = static_cast<char>(mask << 1);
    if (continuationBytes == 0 ||
        (firstByteOfSequence & mask) != expectedBitsAfterMask) {
      // Remove the trailing continuation bytes, if any, and the first byte.
      buffer.resize(length - (continuationBytes + 1));
    }
  }
}

} // namespace facebook::react::jsinspector_modern
