/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTResizeMode.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^RCTImageLoaderProgressBlock)(int64_t progress, int64_t total);
typedef void (^RCTImageLoaderPartialLoadBlock)(UIImage *image);
typedef void (^RCTImageLoaderCompletionBlock)(NSError *_Nullable error, UIImage *_Nullable image);
// Metadata is passed as a id in an additional parameter because there are forks of RN without this parameter,
// and the complexity of RCTImageLoader would make using protocols here difficult to typecheck.
typedef void (^RCTImageLoaderCompletionBlockWithMetadata)(
    NSError *_Nullable error,
    UIImage *_Nullable image,
    id _Nullable metadata);
typedef dispatch_block_t RCTImageLoaderCancellationBlock;

/**
 * Provides the interface needed to register an image loader. Image data
 * loaders are also bridge modules, so should be registered using
 * RCT_EXPORT_MODULE().
 */
@protocol RCTImageURLLoader <RCTBridgeModule>

/**
 * Indicates whether this data loader is capable of processing the specified
 * request URL. Typically the handler would examine the scheme/protocol of the
 * URL to determine this.
 */
- (BOOL)canLoadImageURL:(NSURL *)requestURL;

/**
 * DEPRECATED: Please use updated signature for loadImageForURL which uses
 * completionHandlerWithMetadata instead.
 * Send a network request to load the request URL. The method should call the
 * progressHandler (if applicable) and the completionHandler when the request
 * has finished. The method should also return a cancellation block, if
 * applicable.
 */
- (nullable RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(RCTResizeMode)resizeMode
                                            progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                         partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                          completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
    RCT_DEPRECATED;

@optional

/*
 * Send a network request to load the request URL. The method should call the
 * progressHandler (if applicable) and the completionHandler when the request
 * has finished. The method should also return a cancellation block, if
 * applicable.
 */
- (nullable RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(RCTResizeMode)resizeMode
                                            progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                         partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                              completionHandlerWithMetadata:
                                  (RCTImageLoaderCompletionBlockWithMetadata)completionHandlerWithMetadata;

/**
 * If more than one RCTImageURLLoader responds YES to `-canLoadImageURL:`
 * then `loaderPriority` is used to determine which one to use. The loader
 * with the highest priority will be selected. Default priority is zero. If
 * two or more valid loaders have the same priority, the selection order is
 * undefined.
 */
- (float)loaderPriority;

/**
 * If the loader must be called on the serial url cache queue, and whether the completion
 * block should be dispatched off the main thread. If this is NO, the loader will be
 * called from the main queue. Defaults to YES.
 *
 * Use with care: disabling scheduling will reduce RCTImageLoader's ability to throttle
 * network requests.
 */
- (BOOL)requiresScheduling;

/**
 * If images loaded by the loader should be cached in the decoded image cache.
 * Defaults to YES.
 */
- (BOOL)shouldCacheLoadedImages;

@end

NS_ASSUME_NONNULL_END
