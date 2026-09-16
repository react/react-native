/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "TestLibraryCommon.h"

@implementation TestLibraryCommon

RCT_EXPORT_MODULE()

+ (NSString *)defaultPrefix
{
  return @"[common] ";
}

RCT_EXPORT_METHOD(version : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  resolve(@"common@0.87.0-main");
}

@end
