/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTJscSafeUrl+Internal.h"

#import <React/RCTDefines.h>
#import <react/debug/redbox/JscSafeUrl.h>

#if RCT_DEV_MENU

using facebook::react::unstable_redbox::isJscSafeUrl;
using facebook::react::unstable_redbox::toJscSafeUrl;
using facebook::react::unstable_redbox::toNormalUrl;

@implementation RCTJscSafeUrl

+ (NSString *)normalUrlFromJscSafeUrl:(NSString *)url
{
  return [NSString stringWithUTF8String:toNormalUrl(url.UTF8String).c_str()];
}

+ (NSString *)jscSafeUrlFromNormalUrl:(NSString *)url
{
  return [NSString stringWithUTF8String:toJscSafeUrl(url.UTF8String).c_str()];
}

+ (BOOL)isJscSafeUrl:(NSString *)url
{
  return isJscSafeUrl(url.UTF8String);
}

@end

#endif
