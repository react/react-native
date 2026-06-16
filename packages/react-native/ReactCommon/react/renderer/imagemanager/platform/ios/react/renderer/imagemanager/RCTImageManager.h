/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "RCTImageManagerProtocol.h"

NS_ASSUME_NONNULL_BEGIN

@protocol RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface RCTImageManager : NSObject <RCTImageManagerProtocol>

- (instancetype)initWithImageLoader:(id<RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (facebook::react::ImageRequest)requestImage:(facebook::react::ImageSource)imageSource
                                    surfaceId:(facebook::react::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
