/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/io/ResourceLoader.h>

namespace facebook::react {

// Exercises the path-classification contract that ResourceLoader::isDirectory
// and isFile rely on for their "absolute path" fast path. This is pure lexical
// logic and performs no filesystem, JNI, or asset-manager access.
class ResourceLoaderTest : public ::testing::Test {};

TEST_F(ResourceLoaderTest, testIsAbsolutePathRejectsRelativePaths) {
  // Relative paths must never take the absolute fast path, regardless of the
  // separator or leading "./" or "../" components.
  EXPECT_FALSE(ResourceLoader::isAbsolutePath("assets/index.bundle"));
  EXPECT_FALSE(ResourceLoader::isAbsolutePath("./config.json"));
  EXPECT_FALSE(ResourceLoader::isAbsolutePath("../parent/file.txt"));
  EXPECT_FALSE(ResourceLoader::isAbsolutePath("bundle.js"));
}

TEST_F(ResourceLoaderTest, testIsAbsolutePathRejectsEmptyPath) {
  // An empty path has no root and must never be treated as absolute; otherwise
  // isDirectory/isFile would take the absolute fast path for an invalid input.
  EXPECT_FALSE(ResourceLoader::isAbsolutePath(""));
}

TEST_F(ResourceLoaderTest, testIsAbsolutePathAcceptsAbsolutePaths) {
  EXPECT_TRUE(ResourceLoader::isAbsolutePath("/data/data/com.app/bundle.js"));
  EXPECT_TRUE(ResourceLoader::isAbsolutePath("/"));
}

} // namespace facebook::react
