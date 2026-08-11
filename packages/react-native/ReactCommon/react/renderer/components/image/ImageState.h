/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/imagemanager/ImageRequest.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>
#include <react/renderer/imagemanager/primitives.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <Image> component.
 */
class ImageState final {
 public:
  ImageState(
      const ImageSource& imageSource,
      ImageRequest imageRequest,
      const ImageRequestParams& imageRequestParams)
      : imageSource_(imageSource),
        imageRequest_(std::make_shared<ImageRequest>(std::move(imageRequest))),
        imageRequestParams_(imageRequestParams) {}

  /*
   * Returns stored ImageSource object.
   */
  ImageSource getImageSource() const;

  /*
   * Exposes for reading stored `ImageRequest` object.
   * `ImageRequest` object cannot be copied or moved from `ImageLocalData`.
   */
  const ImageRequest& getImageRequest() const;

  /*
   * Returns stored ImageRequestParams object.
   */
  const ImageRequestParams& getImageRequestParams() const;
#ifdef ANDROID
  ImageState(const ImageState& previousState, folly::dynamic data)
      : imageRequestParams_{} {};

  /*
   * Empty implementation for Android because it doesn't use this class.
   */
  folly::dynamic getDynamic() const {
    return {};
  };
#endif

 private:
  ImageSource imageSource_;
  std::shared_ptr<ImageRequest> imageRequest_;
  ImageRequestParams imageRequestParams_;
};

} // namespace facebook::react
