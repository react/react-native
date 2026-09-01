/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDisplayLink.h"

#import <Foundation/Foundation.h>
#import <QuartzCore/CADisplayLink.h>

#import "RCTAssert.h"
#import "RCTFrameUpdate.h"
#import "RCTProfile.h"

#define RCTAssertRunLoop() \
  RCTAssert(_runLoop == [NSRunLoop currentRunLoop], @"This method must be called on the CADisplayLink run loop")

@implementation RCTDisplayLink {
  CADisplayLink *_jsDisplayLink;
  NSMutableSet<id<RCTFrameUpdateObserver>> *_frameUpdateObservers;
  NSRunLoop *_runLoop;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _frameUpdateObservers = [NSMutableSet new];
    _jsDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_jsThreadUpdate:)];
  }

  return self;
}

- (void)registerTimingForFrameUpdates:(id<RCTFrameUpdateObserver>)timing
{
  [_frameUpdateObservers addObject:timing];

  id<RCTFrameUpdateObserver> observer = timing;
  __weak typeof(self) weakSelf = self;
  observer.pauseCallback = ^{
    typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    CFRunLoopRef cfRunLoop = [strongSelf->_runLoop getCFRunLoop];
    if (!cfRunLoop) {
      return;
    }

    if ([NSRunLoop currentRunLoop] == strongSelf->_runLoop) {
      [weakSelf updateJSDisplayLinkState];
    } else {
      CFRunLoopPerformBlock(cfRunLoop, kCFRunLoopDefaultMode, ^{
        @autoreleasepool {
          [weakSelf updateJSDisplayLinkState];
        }
      });
      CFRunLoopWakeUp(cfRunLoop);
    }
  };

  // Assuming we're paused right now, we only need to update the display link's state
  // when the new observer is not paused. If it not paused, the observer will immediately
  // start receiving updates anyway.
  if (![observer isPaused] && _runLoop) {
    CFRunLoopPerformBlock([_runLoop getCFRunLoop], kCFRunLoopDefaultMode, ^{
      @autoreleasepool {
        [self updateJSDisplayLinkState];
      }
    });
  }
}

- (void)addToRunLoop:(NSRunLoop *)runLoop
{
  _runLoop = runLoop;
  [_jsDisplayLink addToRunLoop:runLoop forMode:NSRunLoopCommonModes];
}

- (void)dealloc
{
  [self invalidate];
}

- (void)invalidate
{
  // ensure observer callbacks do not hold a reference to weak self via pauseCallback
  for (id<RCTFrameUpdateObserver> observer in _frameUpdateObservers) {
    [observer setPauseCallback:nil];
  }
  [_frameUpdateObservers removeAllObjects]; // just to be explicit

  [_jsDisplayLink invalidate];
}

- (void)_jsThreadUpdate:(CADisplayLink *)displayLink
{
  RCTAssertRunLoop();

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTDisplayLink _jsThreadUpdate:]", nil);

  // This always runs on the JS thread run loop, which is the queue the frame
  // update observers expect their callbacks on, so dispatch inline.
  RCTFrameUpdate *frameUpdate = [[RCTFrameUpdate alloc] initWithDisplayLink:displayLink];
  for (id<RCTFrameUpdateObserver> observer in _frameUpdateObservers) {
    if (!observer.paused) {
      [observer didUpdateFrame:frameUpdate];
    }
  }

  [self updateJSDisplayLinkState];

  RCTProfileImmediateEvent(RCTProfileTagAlways, @"JS Thread Tick", displayLink.timestamp, 'g');

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"objc_call");
}

- (void)updateJSDisplayLinkState
{
  RCTAssertRunLoop();

  BOOL pauseDisplayLink = YES;
  for (id<RCTFrameUpdateObserver> observer in _frameUpdateObservers) {
    if (!observer.paused) {
      pauseDisplayLink = NO;
      break;
    }
  }

  _jsDisplayLink.paused = pauseDisplayLink;
}

@end
