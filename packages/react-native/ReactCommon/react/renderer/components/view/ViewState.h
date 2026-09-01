/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/BackgroundImage.h>
#include <react/renderer/imagemanager/ImageRequest.h>
#include <react/renderer/imagemanager/primitives.h>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

struct BackgroundImageURLRequest {
  ImageSource imageSource{};
  std::shared_ptr<ImageRequest> imageRequest{};

  bool operator==(const BackgroundImageURLRequest& rhs) const {
    return imageSource == rhs.imageSource && imageRequest == rhs.imageRequest;
  }
};

class ViewState final {
 public:
  ViewState() = default;

  explicit ViewState(std::vector<BackgroundImageURLRequest> backgroundImageRequests)
      : backgroundImageRequests_(std::move(backgroundImageRequests)) {}

  const std::vector<BackgroundImageURLRequest>& getBackgroundImageRequests() const;

#ifdef RN_SERIALIZABLE_STATE
  ViewState(const ViewState& previousState, folly::dynamic data) {}

  folly::dynamic getDynamic() const {
    return {};
  }
#endif

 private:
  std::vector<BackgroundImageURLRequest> backgroundImageRequests_;
};

} // namespace facebook::react
