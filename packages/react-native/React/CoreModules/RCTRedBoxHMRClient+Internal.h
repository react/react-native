/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

#if RCT_DEV_MENU

/**
 * Minimal native HMR client that connects to Metro's /hot WebSocket endpoint
 * while RedBox 2.0 is displayed. When Metro detects a file change
 * (update-start), this client triggers a reload so the user's fix is picked up
 * automatically — even when the JS runtime has no active HMR connection.
 */
@interface RCTRedBoxHMRClient : NSObject <NSURLSessionWebSocketDelegate>
- (instancetype)initWithBundleURL:(NSURL *)bundleURL onFileChange:(void (^)(void))onFileChange;
- (void)start;
- (void)stop;
@end

#endif
