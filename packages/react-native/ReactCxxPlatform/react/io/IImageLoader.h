/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>

namespace facebook::react {

using IImageLoaderOnLoadCallback = std::function<
    void(double imageWidth, double imageHeight, const char* errorMessage)>;

class IImageLoader {
 public:
  enum class CacheStatus {
    None = 0,
    Disk = 0x1,
    Memory = 0x1 << 1,
  };

  virtual ~IImageLoader() = default;

  virtual void loadImage(
      const std::string& uri,
      const IImageLoaderOnLoadCallback&& onLoad) = 0;

  virtual CacheStatus getCacheStatus(const std::string& uri) = 0;
};

} // namespace facebook::react
