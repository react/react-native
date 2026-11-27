/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBundleAssetImageLoader.h>

#import <atomic>
#import <memory>

#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>

#import "RCTImagePlugins.h"

@interface RCTBundleAssetImageLoader () <RCTTurboModule>
@end

static void RCTCompleteLocalAssetLoad(
    UIImage *image,
    NSURL *imageURL,
    RCTImageLoaderProgressBlock progressHandler,
    RCTImageLoaderCompletionBlock completionHandler)
{
  if (image != nullptr) {
    if (progressHandler != nullptr) {
      progressHandler(1, 1);
    }
    completionHandler(nil, image);
  } else {
    NSString *message = [NSString stringWithFormat:@"Could not find image %@", imageURL];
    RCTLogWarn(@"%@", message);
    completionHandler(RCTErrorWithMessage(message), nil);
  }
}

@implementation RCTBundleAssetImageLoader

RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return RCTIsBundleAssetURL(requestURL);
}

- (BOOL)requiresScheduling
{
  // Don't schedule this loader on the URL queue so we can load the
  // local assets synchronously to avoid flickers.
  return NO;
}

- (BOOL)shouldCacheLoadedImages
{
  // UIImage imageNamed handles the caching automatically so we don't want
  // to add it to the image cache.
  return NO;
}

- (nullable RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(RCTResizeMode)resizeMode
                                            progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                         partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                          completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  RCTCompleteLocalAssetLoad(RCTImageFromLocalAssetURL(imageURL), imageURL, progressHandler, completionHandler);
  return nil;
}

- (nullable RCTImageLoaderCancellationBlock)
     loadImageIgnoringCacheForURL:(NSURL *)imageURL
                             size:(CGSize)size
                            scale:(CGFloat)scale
                       resizeMode:(RCTResizeMode)resizeMode
                  progressHandler:(RCTImageLoaderProgressBlock)progressHandler
               partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
    completionHandlerWithMetadata:(RCTImageLoaderCompletionBlockWithMetadata)completionHandler
{
  RCTCompleteLocalAssetLoad(
      RCTImageFromLocalAssetURLIgnoringSystemCache(imageURL),
      imageURL,
      progressHandler,
      ^(NSError *error, UIImage *image) {
        completionHandler(error, image, nil);
      });
  return nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (float)loaderPriority
{
  return 1;
}

@end

Class RCTBundleAssetImageLoaderCls(void)
{
  return RCTBundleAssetImageLoader.class;
}
