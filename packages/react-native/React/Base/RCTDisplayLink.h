/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol RCTFrameUpdateObserver;

@interface RCTDisplayLink : NSObject

- (instancetype)init;
- (void)invalidate;
- (void)registerTimingForFrameUpdates:(id<RCTFrameUpdateObserver>)module;
- (void)addToRunLoop:(NSRunLoop *)runLoop;

@end
