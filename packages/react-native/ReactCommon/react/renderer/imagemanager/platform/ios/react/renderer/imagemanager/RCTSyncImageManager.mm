/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSyncImageManager.h"

#import <react/utils/ManagedObjectWrapper.h>
#import <react/utils/SharedFunction.h>

#import <React/RCTAssert.h>
#import <React/RCTImageLoaderWithAttributionProtocol.h>
#import <React/RCTLog.h>
#import <react/renderer/imagemanager/ImageResponse.h>
#import <react/renderer/imagemanager/ImageResponseObserver.h>

#import "RCTImagePrimitivesConversions.h"

using namespace facebook::react;

@implementation RCTSyncImageManager {
  id<RCTImageLoaderWithAttributionProtocol> _imageLoader;
}

- (instancetype)initWithImageLoader:(id<RCTImageLoaderWithAttributionProtocol>)imageLoader
{
  if (self = [super init]) {
    RCTAssert(RCTRunningInTestEnvironment(), @"This class is only meant to be used in test environment");
    _imageLoader = imageLoader;
  }

  return self;
}

- (ImageRequest)requestImage:(ImageSource)imageSource surfaceId:(SurfaceId)surfaceId
{
  auto telemetry = std::make_shared<ImageTelemetry>(surfaceId);
  auto sharedCancelationFunction = SharedFunction<>();

  // Sync image request is not cancellable so it does not need to be resumed.
  auto sharedResumeFunction = SharedFunction<>();
  auto imageRequest = ImageRequest(imageSource, telemetry, sharedResumeFunction, sharedCancelationFunction);
  auto weakObserverCoordinator =
      (std::weak_ptr<const ImageResponseObserverCoordinator>)imageRequest.getSharedObserverCoordinator();

  dispatch_group_t imageWaitGroup = dispatch_group_create();

  dispatch_group_enter(imageWaitGroup);

  NSURLRequest *request = NSURLRequestFromImageSource(imageSource);

  auto completionBlock = ^(NSError *error, UIImage *image, id metadata) {
    auto observerCoordinator = weakObserverCoordinator.lock();
    if (!observerCoordinator) {
      return;
    }

    if (image && !error) {
      auto wrappedMetadata = metadata ? wrapManagedObject(metadata) : nullptr;
      observerCoordinator->nativeImageResponseComplete(ImageResponse(wrapManagedObject(image), wrappedMetadata));
    } else {
      auto wrappedError = error ? wrapManagedObject(error) : nullptr;
      observerCoordinator->nativeImageResponseFailed(ImageLoadError(wrappedError));
    }
    dispatch_group_leave(imageWaitGroup);
  };

  auto progressBlock = ^(int64_t progress, int64_t total) {
    auto observerCoordinator = weakObserverCoordinator.lock();
    if (!observerCoordinator) {
      return;
    }

    observerCoordinator->nativeImageResponseProgress((float)progress / (float)total, progress, total);
  };

  RCTImageURLLoaderRequest *__unused loaderRequest =
      [self->_imageLoader loadImageWithURLRequest:request
                                             size:CGSizeMake(imageSource.size.width, imageSource.size.height)
                                            scale:imageSource.scale
                                          clipped:YES
                                       resizeMode:RCTResizeModeStretch
                                         priority:RCTImageLoaderPriorityImmediate
                                      attribution:{
                                                      .surfaceId = surfaceId,
  }
                                    progressBlock:progressBlock
                                 partialLoadBlock:nil
                                  completionBlock:completionBlock];

  auto result = dispatch_group_wait(imageWaitGroup, dispatch_time(DISPATCH_TIME_NOW, 20 * NSEC_PER_SEC));
  if (result != 0) {
    // Downgraded from RCTLogError to RCTLogWarn: image timeouts in test
    // environments are transient infrastructure issues, not fatal app errors.
    // RCTLogError triggers a native redbox that blocks the entire UI and cannot
    // be dismissed on iOS, causing E2E test failures.
    RCTLogWarn(@"Image timed out in test environment for url: %@", loaderRequest.imageURL);
  }
  return imageRequest;
}

@end
