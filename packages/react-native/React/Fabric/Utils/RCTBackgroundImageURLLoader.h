/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/Graphics.h>
#import <React/RendererCore.h>
#import <UIKit/UIKit.h>

#include <memory>
#include <string>
#include <vector>

namespace facebook::react {
class ImageManager;
} // namespace facebook::react

NS_ASSUME_NONNULL_BEGIN

/*
 * Loads the `url()` entries of a view's `backgroundImage`.
 * Releasing the loader cancels its requests.
 */
@interface RCTBackgroundImageURLLoader : NSObject

/*
 * `onLoad` is called on the main queue each time an image finishes loading.
 */
- (instancetype)initWithImageManager:(std::shared_ptr<facebook::react::ImageManager>)imageManager
                              onLoad:(void (^)(void))onLoad;

/*
 * Requests every `url()` entry in `backgroundImages`. Does nothing if the
 * urls did not change since the last call.
 */
- (void)loadBackgroundImages:(const std::vector<facebook::react::BackgroundImage> &)backgroundImages
                   surfaceId:(facebook::react::SurfaceId)surfaceId;

/*
 * Returns nil until the image for `uri` has loaded.
 */
- (nullable UIImage *)imageForURI:(const std::string &)uri;

@end

NS_ASSUME_NONNULL_END
