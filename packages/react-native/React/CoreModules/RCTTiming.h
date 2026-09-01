/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTFrameUpdate.h>
#import <React/RCTInitializing.h>
#import <React/RCTInvalidating.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTTimingDelegate

- (void)callTimers:(NSArray<NSNumber *> *)timers;
- (void)immediatelyCallTimer:(NSNumber *)callbackID;
- (void)callIdleCallbacks:(NSNumber *)absoluteFrameStartMS;

@end

@interface RCTTiming : NSObject <RCTInvalidating, RCTFrameUpdateObserver, RCTInitializing>

- (instancetype)initWithDelegate:(id<RCTTimingDelegate>)delegate;
- (void)createTimerForNextFrame:(NSNumber *)callbackID
                       duration:(NSTimeInterval)jsDuration
               jsSchedulingTime:(nullable NSDate *)jsSchedulingTime
                        repeats:(BOOL)repeats;
- (void)deleteTimer:(double)timerID;

@end

NS_ASSUME_NONNULL_END
