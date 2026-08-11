/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/imagemanager/ImageResponse.h>

namespace facebook::react {

/*
 * Represents any observer of ImageResponse progression, completion, or failure.
 * All methods must be thread-safe.
 */
class ImageResponseObserver {
 public:
  virtual ~ImageResponseObserver() noexcept = default;

  virtual void didReceiveProgress(float progress, int64_t loaded, int64_t total)
      const = 0;
  virtual void didReceiveImage(const ImageResponse& imageResponse) const = 0;
  virtual void didReceiveFailure(const ImageLoadError& error) const = 0;
};

} // namespace facebook::react
