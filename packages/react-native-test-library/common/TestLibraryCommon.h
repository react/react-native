/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>

@interface TestLibraryCommon : NSObject <RCTBridgeModule>

/** Shared prefix used by other test-library packages that depend on common. */
+ (NSString *)defaultPrefix;

@end
