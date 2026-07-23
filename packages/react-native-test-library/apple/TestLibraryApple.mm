/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "TestLibraryApple.h"

// Synth library products are emitted as .library(type: .dynamic, ...), so SPM
// wraps each autolinked dep as a Foo.framework under PackageFrameworks/. That
// gives angle-bracket imports the standard <Module/Header.h> resolution path,
// matching how most React Native libraries already organize their headers.
#import <ReactNativeTestLibraryCommon/TestLibraryCommon.h>

@implementation TestLibraryApple

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(
    echo : (NSString *)message resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  NSString *prefix = [TestLibraryCommon defaultPrefix];
  resolve([NSString stringWithFormat:@"%@apple: %@", prefix, message]);
}

@end
