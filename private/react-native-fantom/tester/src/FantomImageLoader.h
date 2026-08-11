/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/io/IImageLoader.h>
#include <optional>

namespace facebook::react {
class TesterAppDelegate;

class FantomImageLoader : public IImageLoader {
 public:
  struct ImageResponse {
    double width{};
    double height{};
    std::optional<std::string> cacheStatus;
    std::optional<std::string> errorMessage;
  };

  void setImageResponse(const std::string& uri, ImageResponse imageResponse);
  void clearImage(const std::string& uri);
  void clearAllImages();

  // IImageLoader implementation
  void loadImage(
      const std::string& uri,
      const IImageLoaderOnLoadCallback&& onLoad) override;

  IImageLoader::CacheStatus getCacheStatus(const std::string& uri) override;

 private:
  std::unordered_map<std::string, ImageResponse> images_;
};

} // namespace facebook::react
