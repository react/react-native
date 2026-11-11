/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTiming.h"

#include <math.h>
#include <chrono>

#import <React/RCTAssert.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

static const NSTimeInterval kMinimumSleepInterval = 1;
static const NSTimeInterval kNoTimerTarget = INFINITY;

// These timing contants should be kept in sync with the ones in `JSTimers.js`.
// The duration of a frame. This assumes that we want to run at 60 fps.
static const NSTimeInterval kFrameDuration = 1.0 / 60.0;
// The minimum time left in a frame to trigger the idle callback.
static const NSTimeInterval kIdleCallbackFrameDeadline = 0.001;

static NSTimeInterval RCTMonotonicTime()
{
  // Apple libc++ uses CLOCK_MONOTONIC_RAW, which includes time spent asleep.
  return std::chrono::duration<NSTimeInterval>(std::chrono::steady_clock::now().time_since_epoch()).count();
}

@interface _RCTTimer : NSObject

@property (nonatomic, assign, readonly) NSTimeInterval target;
@property (nonatomic, assign, readonly) BOOL repeats;
@property (nonatomic, copy, readonly) NSNumber *callbackID;
@property (nonatomic, assign, readonly) NSTimeInterval interval;

@end

@implementation _RCTTimer

- (instancetype)initWithCallbackID:(NSNumber *)callbackID
                          interval:(NSTimeInterval)interval
                        targetTime:(NSTimeInterval)targetTime
                           repeats:(BOOL)repeats
{
  if ((self = [super init])) {
    _interval = interval;
    _repeats = repeats;
    _callbackID = callbackID;
    _target = RCTMonotonicTime() + targetTime;
  }
  return self;
}

/**
 * Returns `YES` if we should invoke the JS callback.
 */
- (BOOL)shouldFire:(NSTimeInterval)now
{
  return _target <= now;
}

- (void)reschedule
{
  // The JS Timers will do fine grained calculating of expired timeouts.
  _target = RCTMonotonicTime() + _interval;
}

@end

@interface _RCTTimingProxy : NSObject

@end

// NSTimer retains its target, insert this class to break potential retain cycles
@implementation _RCTTimingProxy {
  __weak id _target;
}

+ (instancetype)proxyWithTarget:(id)target
{
  _RCTTimingProxy *proxy = [self new];
  if (proxy != nil) {
    proxy->_target = target;
  }
  return proxy;
}

- (void)timerDidFire
{
  [_target timerDidFire];
}

@end

@implementation RCTTiming {
  NSMutableDictionary<NSNumber *, _RCTTimer *> *_timers;
  NSTimer *_sleepTimer;
  NSTimeInterval _sleepTimerTarget;
  BOOL _sendIdleEvents;
  BOOL _inBackground;
  id<RCTTimingDelegate> _timingDelegate;
}

@synthesize paused = _paused;
@synthesize pauseCallback = _pauseCallback;

- (instancetype)initWithDelegate:(id<RCTTimingDelegate>)delegate
{
  if (self = [super init]) {
    [self setup];
    _timingDelegate = delegate;
  }
  return self;
}

- (void)initialize
{
  [self setup];
}

- (void)setup
{
  _paused = YES;
  _timers = [NSMutableDictionary new];
  _inBackground = NO;
  RCTExecuteOnMainQueue(^{
    if (!self->_inBackground &&
        ([RCTSharedApplication() applicationState] == UIApplicationStateBackground ||
         [UIDevice currentDevice].proximityState)) {
      [self appDidMoveToBackground];
    }
  });

  for (NSString *name in @[
         UIApplicationWillResignActiveNotification,
         UIApplicationDidEnterBackgroundNotification,
         UIApplicationWillTerminateNotification
       ]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appDidMoveToBackground)
                                                 name:name
                                               object:nil];
  }

  for (NSString *name in @[ UIApplicationDidBecomeActiveNotification, UIApplicationWillEnterForegroundNotification ]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appDidMoveToForeground)
                                                 name:name
                                               object:nil];
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(proximityChanged)
                                               name:UIDeviceProximityStateDidChangeNotification
                                             object:nil];
}

- (void)dealloc
{
  [_sleepTimer invalidate];
}

- (void)invalidate
{
  [self stopTimers];
  _timingDelegate = nil;
}

- (void)appDidMoveToBackground
{
  // Deactivate the CADisplayLink while in the background.
  [self stopTimers];
  _inBackground = YES;

  // Issue one final timer callback, which will schedule a
  // background NSTimer, if needed.
  [self didUpdateFrame:nil];
}

- (void)appDidMoveToForeground
{
  _inBackground = NO;
  [self startTimers];
}

- (void)proximityChanged
{
  BOOL isClose = [UIDevice currentDevice].proximityState;
  if (isClose) {
    [self appDidMoveToBackground];
  } else {
    [self appDidMoveToForeground];
  }
}

- (void)stopTimers
{
  if (_inBackground) {
    return;
  }

  if (!_paused) {
    _paused = YES;
    if (_pauseCallback) {
      _pauseCallback();
    }
  }
}

- (void)startTimers
{
  if ((!_timingDelegate) || _inBackground || ![self hasPendingTimers]) {
    return;
  }

  if (_paused) {
    _paused = NO;
    if (_pauseCallback) {
      _pauseCallback();
    }
  }
}

- (BOOL)hasPendingTimers
{
  @synchronized(_timers) {
    return _sendIdleEvents || _timers.count > 0;
  }
}

- (void)didUpdateFrame:(RCTFrameUpdate *)update
{
  NSTimeInterval nextScheduledTarget = kNoTimerTarget;
  NSMutableArray<_RCTTimer *> *timersToCall = [NSMutableArray new];
  NSTimeInterval now = RCTMonotonicTime();
  @synchronized(_timers) {
    for (_RCTTimer *timer in _timers.allValues) {
      if ([timer shouldFire:now]) {
        [timersToCall addObject:timer];
      } else if (timer.target < nextScheduledTarget) {
        nextScheduledTarget = timer.target;
      }
    }
  }

  // Call timers that need to be called
  if (timersToCall.count > 0) {
    NSArray<NSNumber *> *sortedTimers = [[timersToCall sortedArrayUsingComparator:^(_RCTTimer *a, _RCTTimer *b) {
      if (a.target < b.target) {
        return NSOrderedAscending;
      }
      if (a.target > b.target) {
        return NSOrderedDescending;
      }
      return NSOrderedSame;
    }] valueForKey:@"callbackID"];
    [_timingDelegate callTimers:sortedTimers];
  }

  for (_RCTTimer *timer in timersToCall) {
    if (timer.repeats) {
      [timer reschedule];
      if (timer.target < nextScheduledTarget) {
        nextScheduledTarget = timer.target;
      }
    } else {
      @synchronized(_timers) {
        [_timers removeObjectForKey:timer.callbackID];
      }
    }
  }

  if (_sendIdleEvents) {
    NSTimeInterval frameElapsed = (CACurrentMediaTime() - update.timestamp);
    if (kFrameDuration - frameElapsed >= kIdleCallbackFrameDeadline) {
      NSTimeInterval currentTimestamp = [[NSDate date] timeIntervalSince1970];
      NSNumber *absoluteFrameStartMS = @((currentTimestamp - frameElapsed) * 1000);
      [_timingDelegate callIdleCallbacks:absoluteFrameStartMS];
    }
  }

  // Switch to a paused state only if we didn't call any timer this frame, so if
  // in response to this timer another timer is scheduled, we don't pause and unpause
  // the displaylink frivolously.
  NSUInteger timerCount = 0;
  @synchronized(_timers) {
    timerCount = _timers.count;
  }
  if (_inBackground) {
    if (nextScheduledTarget != kNoTimerTarget) {
      [self scheduleSleepTimer:nextScheduledTarget];
    }
  } else if (!_sendIdleEvents && timersToCall.count == 0) {
    // No need to call the pauseCallback as RCTDisplayLink will ask us about our paused
    // status immediately after completing this call
    if (timerCount == 0) {
      _paused = YES;
    }
    // If the next timer is more than 1 second out, pause and schedule an NSTimer;
    else if (
        nextScheduledTarget != kNoTimerTarget && nextScheduledTarget - RCTMonotonicTime() > kMinimumSleepInterval) {
      [self scheduleSleepTimer:nextScheduledTarget];
      _paused = YES;
    }
  }
}

- (void)scheduleSleepTimer:(NSTimeInterval)sleepTarget
{
  @synchronized(self) {
    NSTimeInterval delay = MAX(sleepTarget - RCTMonotonicTime(), 0);
    if ((_sleepTimer == nil) || !_sleepTimer.valid) {
      _sleepTimer = [NSTimer timerWithTimeInterval:delay
                                            target:[_RCTTimingProxy proxyWithTarget:self]
                                          selector:@selector(timerDidFire)
                                          userInfo:nil
                                           repeats:NO];
      _sleepTimerTarget = sleepTarget;
      [[NSRunLoop currentRunLoop] addTimer:_sleepTimer forMode:NSDefaultRunLoopMode];
    } else if (sleepTarget < _sleepTimerTarget) {
      // Convert to a date only when setting the run loop's wakeup.
      _sleepTimer.fireDate = [NSDate dateWithTimeIntervalSinceNow:delay];
      _sleepTimerTarget = sleepTarget;
    }
  }
}

- (void)timerDidFire
{
  _sleepTimer = nil;
  if (_paused) {
    [self startTimers];

    // Immediately dispatch frame, so we don't have to wait on the displaylink.
    [self didUpdateFrame:nil];
  }
}

/**
 * A method used for synchronously creating a timer. The timer will not be invoked until the
 * next frame, regardless of whether it has already expired (i.e. jsSchedulingTime is 0).
 */
- (void)createTimerForNextFrame:(nonnull NSNumber *)callbackID
                       duration:(NSTimeInterval)jsDuration
               jsSchedulingTime:(NSDate *)jsSchedulingTime
                        repeats:(BOOL)repeats
{
  NSTimeInterval jsSchedulingOverhead = MAX(-jsSchedulingTime.timeIntervalSinceNow, 0);

  NSTimeInterval targetTime = jsDuration - jsSchedulingOverhead;
  if (jsDuration < 0.018) { // Make sure short intervals run each frame
    jsDuration = 0;
  }

  _RCTTimer *timer = [[_RCTTimer alloc] initWithCallbackID:callbackID
                                                  interval:jsDuration
                                                targetTime:targetTime
                                                   repeats:repeats];
  @synchronized(_timers) {
    _timers[callbackID] = timer;
  }

  if (_inBackground) {
    [self scheduleSleepTimer:timer.target];
  } else if (_paused) {
    if (timer.target - RCTMonotonicTime() > kMinimumSleepInterval) {
      [self scheduleSleepTimer:timer.target];
    } else {
      [self startTimers];
    }
  }
}

- (void)deleteTimer:(double)timerID
{
  @synchronized(_timers) {
    [_timers removeObjectForKey:@(timerID)];
  }
  if (![self hasPendingTimers]) {
    [self stopTimers];
  }
}

@end
