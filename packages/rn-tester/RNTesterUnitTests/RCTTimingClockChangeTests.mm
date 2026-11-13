/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>
#import <objc/runtime.h>

#import <React/RCTTiming.h>

static constexpr NSTimeInterval kClockJump = 60 * 60;
static constexpr NSTimeInterval kTimerDelay = 0.05;
static thread_local NSTimeInterval wallClockOffset;

static Method dateMethod()
{
  return class_getClassMethod(NSDate.class, @selector(date));
}

static auto originalDateImplementation()
{
  static const auto implementation = method_getImplementation(dateMethod());
  return implementation;
}

static NSDate *dateWithClockOffset(id receiver, SEL selector)
{
  auto originalDate = reinterpret_cast<NSDate *(*)(id, SEL)>(originalDateImplementation());
  NSDate *now = originalDate(receiver, selector);
  return wallClockOffset == 0 ? now : [now dateByAddingTimeInterval:wallClockOffset];
}

@interface RCTTimingClockChangeTests : XCTestCase <RCTTimingDelegate>
@end

@implementation RCTTimingClockChangeTests {
  RCTTiming *_timing;
  NSMutableArray<NSNumber *> *_callbacks;
}

- (void)setUp
{
  [super setUp];
  _callbacks = [NSMutableArray new];
  _timing = [[RCTTiming alloc] initWithDelegate:self];
}

- (void)tearDown
{
  [_timing invalidate];
  _timing = nil;
  [super tearDown];
}

- (void)callTimers:(NSArray<NSNumber *> *)timers
{
  [_callbacks addObjectsFromArray:timers];
}

- (void)immediatelyCallTimer:(NSNumber *)callbackID
{
  [_callbacks addObject:callbackID];
}

- (void)callIdleCallbacks:(NSNumber *)absoluteFrameStartMS
{
}

- (void)updateFrameWithClockOffset:(NSTimeInterval)offset
{
  // Simulate a clock change after scheduling. Only this thread sees the
  // shifted time, and only while checking which timers are due.
  IMP original = originalDateImplementation();
  wallClockOffset = offset;
  method_setImplementation(dateMethod(), reinterpret_cast<IMP>(dateWithClockOffset));
  @try {
    [_timing didUpdateFrame:nil];
  } @finally {
    method_setImplementation(dateMethod(), original);
    wallClockOffset = 0;
  }
}

- (void)testClockMovingForwardDoesNotFirePendingTimeoutEarly
{
  [_timing createTimerForNextFrame:@1 duration:60 jsSchedulingTime:nil repeats:NO];

  [self updateFrameWithClockOffset:kClockJump];

  XCTAssertEqual(_callbacks.count, 0u);
}

- (void)testClockMovingBackwardDoesNotDelayDueTimeout
{
  [_timing createTimerForNextFrame:@1 duration:kTimerDelay jsSchedulingTime:nil repeats:NO];
  [NSThread sleepForTimeInterval:2 * kTimerDelay];

  [self updateFrameWithClockOffset:-kClockJump];

  XCTAssertEqualObjects(_callbacks, (@[ @1 ]));
}

- (void)testClockMovingBackwardDoesNotDelayRescheduledInterval
{
  [_timing createTimerForNextFrame:@1 duration:kTimerDelay jsSchedulingTime:nil repeats:YES];
  [NSThread sleepForTimeInterval:2 * kTimerDelay];
  [_timing didUpdateFrame:nil];
  XCTAssertEqualObjects(_callbacks, (@[ @1 ]));

  [NSThread sleepForTimeInterval:2 * kTimerDelay];
  [self updateFrameWithClockOffset:-kClockJump];

  XCTAssertEqualObjects(_callbacks, (@[ @1, @1 ]));
}

@end
