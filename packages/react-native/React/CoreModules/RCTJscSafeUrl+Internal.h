/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

/**
 * Converts between standard URLs and JSC-safe URLs.
 *
 * JSC (JavaScriptCore) strips query strings from source URLs in stack traces
 * as of iOS 16.4. Metro works around this by encoding the query string into
 * the URL path. These methods convert between the two formats.
 */
@interface RCTJscSafeUrl : NSObject

+ (nonnull NSString *)normalUrlFromJscSafeUrl:(nonnull NSString *)url;
+ (nonnull NSString *)jscSafeUrlFromNormalUrl:(nonnull NSString *)url;
+ (BOOL)isJscSafeUrl:(nonnull NSString *)url;

@end
