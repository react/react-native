/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@interface RCTPausedInDebuggerOverlayController : NSObject

- (void)showWithMessage:(NSString *)message onResume:(void (^)(void))onResume;
- (void)hide;

@end
