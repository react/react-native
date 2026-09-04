/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/cxxstableapi/FrameworksGuard.h>

#import <Foundation/Foundation.h>

#import <React/RCTMessageThread.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTJSThreadManager : NSObject

- (void)dispatchToJSThread:(dispatch_block_t)block;
- (std::shared_ptr<facebook::react::RCTMessageThread>)jsMessageThread;

@end

NS_ASSUME_NONNULL_END
