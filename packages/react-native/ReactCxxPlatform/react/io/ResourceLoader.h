/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <filesystem>
#include <string>

namespace facebook::react {

class JSBigString;

class ResourceLoader {
 public:
  static bool isDirectory(const std::string& path);
  static bool isFile(const std::string& path);
  static bool isAbsolutePath(const std::string& path);
  static std::unique_ptr<const JSBigString> getFileContents(
      const std::string& path);
  static std::filesystem::path getCacheDirectory(
      const std::string& path = std::string());

 protected:
  static bool isResourceDirectory(const std::string& path);
  static bool isResourceFile(const std::string& path);
  static std::unique_ptr<const JSBigString> getResourceFileContents(
      const std::string& path);

 private:
  static constexpr const auto CACHE_DIR = ".react-native-cxx-cache";
  static std::filesystem::path getCacheRootPath();
};
} // namespace facebook::react
