/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/utils/Base64.h>
#include <string>

namespace facebook::react {

TEST(Base64Tests, encodesAsciiString) {
  EXPECT_EQ(base64Encode("hello"), "aGVsbG8=");
}

TEST(Base64Tests, encodesEmptyString) {
  EXPECT_EQ(base64Encode(""), "");
}

// Padding depends on input length modulo 3.
TEST(Base64Tests, encodesWithCorrectPadding) {
  EXPECT_EQ(base64Encode("a"), "YQ==");
  EXPECT_EQ(base64Encode("ab"), "YWI=");
  EXPECT_EQ(base64Encode("abc"), "YWJj");
}

// Binary safety: bytes that are invalid UTF-8 / contain NULs must round-trip.
// This is the case that matters for binary ('base64'/arraybuffer) response
// bodies in the NetworkingModule -- sending such bytes verbatim corrupts them.
TEST(Base64Tests, encodesBinaryBytes) {
  EXPECT_EQ(base64Encode(std::string("\x00\xff", 2)), "AP8=");
}

} // namespace facebook::react
