/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <react/renderer/imagemanager/ImageManager.h>

#import <React/RCTImageLoaderWithAttributionProtocol.h>
#import <React/RCTUtils.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "RCTImageManager.h"
#import "RCTSyncImageManager.h"

namespace facebook::react {

ImageManager::ImageManager(const std::shared_ptr<const ContextContainer> &contextContainer)
{
  id<RCTImageLoaderWithAttributionProtocol> imageLoader =
      (id<RCTImageLoaderWithAttributionProtocol>)unwrapManagedObject(
          contextContainer->at<std::shared_ptr<void>>("RCTImageLoader"));
  if (RCTRunningInTestEnvironment()) {
    self_ = (__bridge_retained void *)[[RCTSyncImageManager alloc] initWithImageLoader:imageLoader];
  } else {
    self_ = (__bridge_retained void *)[[RCTImageManager alloc] initWithImageLoader:imageLoader];
  }
}

ImageManager::~ImageManager()
{
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(
    const ImageSource &imageSource,
    SurfaceId surfaceId,
    const ImageRequestParams & /*imageRequestParams*/,
    Tag /*tag*/) const
{
  RCTImageManager *imageManager = (__bridge RCTImageManager *)self_;
  return [imageManager requestImage:imageSource surfaceId:surfaceId];
}

} // namespace facebook::react
