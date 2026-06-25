/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

/**
 * Thread-safe singleton that holds custom HTTP headers to be applied
 * to all devsupport network requests (bundle fetches, packager status
 * checks, inspector and HMR WebSocket connections).
 */
@interface RCTDevSupportHttpHeaders : NSObject

+ (instancetype)sharedInstance;

- (void)addRequestHeader:(NSString *)name value:(NSString *)value;
- (void)removeRequestHeader:(NSString *)name;
- (NSDictionary<NSString *, NSString *> *)allHeaders;
- (void)applyHeadersToRequest:(NSMutableURLRequest *)request;

@end
