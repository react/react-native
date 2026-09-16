/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <memory>

namespace facebook::react {

/*
 * Represents retrieved image bitmap and any associated platform-specific info.
 */
class ImageResponse final {
 public:
  enum class Status {
    Loading,
    Completed,
    Failed,
    Cancelled,
    Consumed,
  };

  ImageResponse(std::shared_ptr<void> image, std::shared_ptr<void> metadata);

  std::shared_ptr<void> getImage() const;

  std::shared_ptr<void> getMetadata() const;

 private:
  std::shared_ptr<void> image_{};

  std::shared_ptr<void> metadata_{};
};

class ImageLoadError {
 public:
  explicit ImageLoadError(std::shared_ptr<void> error);
  std::shared_ptr<void> getError() const;

 private:
  std::shared_ptr<void> error_{};
};

} // namespace facebook::react
