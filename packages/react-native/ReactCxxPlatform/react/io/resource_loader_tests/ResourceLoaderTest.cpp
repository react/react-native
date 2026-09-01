/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cxxreact/JSBigString.h>
#include <gtest/gtest.h>
#include <react/io/ResourceLoader.h>

#include <filesystem>
#include <stdexcept>
#include <string>

namespace facebook::react {

class ResourceLoaderTests : public testing::Test {};

// isAbsolutePath must distinguish absolute paths from relative ones and treat
// the empty string as non-absolute. temp_directory_path() is guaranteed
// absolute on every platform, avoiding platform-specific literal assumptions.
TEST_F(ResourceLoaderTests, isAbsolutePathDistinguishesAbsoluteFromRelative) {
  const auto absolute = std::filesystem::temp_directory_path().string();
  EXPECT_TRUE(ResourceLoader::isAbsolutePath(absolute));
  EXPECT_FALSE(ResourceLoader::isAbsolutePath("some/relative/path"));
  EXPECT_FALSE(ResourceLoader::isAbsolutePath(""));
}

// An empty path must resolve to the cache root itself, created directly under
// the platform temp directory.
TEST_F(ResourceLoaderTests, getCacheDirectoryEmptyPathReturnsCacheRoot) {
  const auto root = ResourceLoader::getCacheDirectory("");

  ASSERT_TRUE(std::filesystem::is_directory(root));
  EXPECT_TRUE(
      std::filesystem::equivalent(
          root.parent_path(), std::filesystem::temp_directory_path()));
}

// A non-empty, multi-segment path must be created recursively underneath the
// cache root and returned as root / path.
TEST_F(ResourceLoaderTests, getCacheDirectoryCreatesNestedSubdirectory) {
  const auto root = ResourceLoader::getCacheDirectory("");
  const auto created =
      ResourceLoader::getCacheDirectory("rl_test_dir/nested_child");

  EXPECT_TRUE(std::filesystem::is_directory(created));
  EXPECT_EQ(created, root / "rl_test_dir" / "nested_child");

  std::filesystem::remove_all(root / "rl_test_dir");
}

// A directory that exists on disk must be reported as a directory but never as
// a file. This guards the "!is_directory" exclusion in isFile.
TEST_F(ResourceLoaderTests, isDirectoryTrueAndIsFileFalseForDirectory) {
  const auto dir = ResourceLoader::getCacheDirectory("").string();

  EXPECT_TRUE(ResourceLoader::isDirectory(dir));
  EXPECT_FALSE(ResourceLoader::isFile(dir));
}

// Requesting the contents of a file that does not exist must surface the
// underlying open failure as an exception rather than returning a bad handle.
TEST_F(ResourceLoaderTests, getFileContentsThrowsForMissingFile) {
  const auto missing =
      (std::filesystem::temp_directory_path() / "rl_missing_file_xyz.bundle")
          .string();
  ASSERT_FALSE(std::filesystem::exists(missing));

  EXPECT_THROW(ResourceLoader::getFileContents(missing), std::runtime_error);
}

} // namespace facebook::react
