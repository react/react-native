/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTJavaScriptLoader.h>

@class RCTBridge;
@protocol RCTBridgeModule;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTBridgeDelegate <NSObject>
#ifndef RCT_REMOVE_LEGACY_ARCH

/**
 * The location of the JavaScript source file. When running from the packager
 * this should be an absolute URL, e.g. `http://localhost:8081/index.ios.bundle`.
 * When running from a locally bundled JS file, this should be a `file://` url
 * pointing to a path inside the app resources, e.g. `file://.../main.jsbundle`.
 */
- (NSURL *__nullable)sourceURLForBridge:(RCTBridge *)bridge
    __deprecated_msg("This API will be removed along with the legacy architecture.");
#endif
@end

NS_ASSUME_NONNULL_END
