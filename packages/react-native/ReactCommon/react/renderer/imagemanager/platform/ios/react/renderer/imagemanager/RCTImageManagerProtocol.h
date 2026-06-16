/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <react/renderer/core/ReactPrimitives.h>
#import <react/renderer/imagemanager/ImageRequest.h>

@protocol RCTImageManagerProtocol <NSObject>

- (facebook::react::ImageRequest)requestImage:(facebook::react::ImageSource)imageSource
                                    surfaceId:(facebook::react::SurfaceId)surfaceId;
@end
