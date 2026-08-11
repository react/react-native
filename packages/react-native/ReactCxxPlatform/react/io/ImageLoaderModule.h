/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/bridging/Promise.h>
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace facebook::react {

class IImageLoader;

using ImageSize = NativeImageLoaderAndroidImageSize<double, double>;

template <>
struct Bridging<ImageSize>
    : NativeImageLoaderAndroidImageSizeBridging<ImageSize> {};

class ImageLoaderModule
    : public NativeImageLoaderAndroidCxxSpec<ImageLoaderModule> {
 public:
  explicit ImageLoaderModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      std::weak_ptr<IImageLoader> imageLoader = std::weak_ptr<IImageLoader>())
      : NativeImageLoaderAndroidCxxSpec(jsInvoker),
        imageLoader_(std::move(imageLoader)) {}

  jsi::Object getConstants(jsi::Runtime& rt);
  void abortRequest(jsi::Runtime& rt, int32_t requestId);

  AsyncPromise<ImageSize> getSize(jsi::Runtime& rt, const std::string& uri);

  AsyncPromise<ImageSize> getSizeWithHeaders(
      jsi::Runtime& rt,
      const std::string& uri,
      jsi::Object headers);

  AsyncPromise<bool>
  prefetchImage(jsi::Runtime& rt, const std::string& uri, int32_t requestId);

  jsi::Object queryCache(
      jsi::Runtime& rt,
      const std::vector<std::string>& uris);

 private:
  std::weak_ptr<IImageLoader> imageLoader_;
};

} // namespace facebook::react
