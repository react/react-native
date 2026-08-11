/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import "RCTImageResponseDelegate.h"

#include <react/renderer/imagemanager/ImageResponseObserver.h>

NS_ASSUME_NONNULL_BEGIN

namespace facebook::react {

class RCTImageResponseObserverProxy final : public ImageResponseObserver {
 public:
  RCTImageResponseObserverProxy(id<RCTImageResponseDelegate> delegate = nil);

  void didReceiveImage(const ImageResponse& imageResponse) const override;
  void didReceiveProgress(float progress, int64_t loaded, int64_t total)
      const override;
  void didReceiveFailure(const ImageLoadError& error) const override;

 private:
  __weak id<RCTImageResponseDelegate> delegate_;
};

} // namespace facebook::react

NS_ASSUME_NONNULL_END
