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
  id<RCTFrameUpdateObserver> _frameUpdateObserver;
  NSRunLoop *_runLoop;
}

- (instancetype)initWithFrameUpdateObserver:(id<RCTFrameUpdateObserver>)observer
{
  if ((self = [super init])) {
    _frameUpdateObserver = observer;
    _jsDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_jsThreadUpdate:)];

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
  }

  return self;
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
  // ensure the observer callback does not hold a reference to weak self via pauseCallback
  [_frameUpdateObserver setPauseCallback:nil];
  _frameUpdateObserver = nil;

  [_jsDisplayLink invalidate];
}

- (void)_jsThreadUpdate:(CADisplayLink *)displayLink
{
  RCTAssertRunLoop();

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTDisplayLink _jsThreadUpdate:]", nil);

  // This always runs on the JS thread run loop, which is the queue the frame
  // update observer expects its callbacks on, so dispatch inline.
  RCTFrameUpdate *frameUpdate = [[RCTFrameUpdate alloc] initWithDisplayLink:displayLink];
  if (!_frameUpdateObserver.paused) {
    [_frameUpdateObserver didUpdateFrame:frameUpdate];
  }

  [self updateJSDisplayLinkState];

  RCTProfileImmediateEvent(RCTProfileTagAlways, @"JS Thread Tick", displayLink.timestamp, 'g');

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"objc_call");
}

- (void)updateJSDisplayLinkState
{
  RCTAssertRunLoop();

  _jsDisplayLink.paused = _frameUpdateObserver == nil || _frameUpdateObserver.paused;
}

@end
