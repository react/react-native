/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTEventEmitter.h"
#import <React/RCTConstants.h>
#import "RCTAssert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTEventEmitter {
  NSInteger _listenerCount;
  BOOL _observationDisabled;
  // Set to YES when -setCallableJSModules: is called with a non-nil value.
  // _callableJSModules is weak and can return to nil after wiring (e.g. on
  // host teardown) while this instance lives on, so the current value of
  // _callableJSModules can't tell us whether we were ever set up correctly.
  // This flag can.
  BOOL _callableJSModulesWasInitialized;
}

@synthesize callableJSModules = _callableJSModules;

+ (NSString *)moduleName
{
  return @"";
}

- (instancetype)initWithDisabledObservation
{
  self = [super init];
  _observationDisabled = YES;
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  NSString *message =
      [NSString stringWithFormat:@"%@ must implement the supportedEvents method", NSStringFromClass(self.class)];
  [self _log:message];
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  RCTAssert(
      _callableJSModulesWasInitialized,
      @"Error when sending event: %@ (listenerCount: %lld) with body: %@. "
       "RCTCallableJSModules is not set. This is probably because you've "
       "explicitly synthesized the RCTCallableJSModules in %@, even though it's inherited "
       "from RCTEventEmitter.",
      eventName,
      (long long)_listenerCount,
      body,
      [self class]);

  if (RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }

  // _callableJSModules is weak, so read it exactly once into a strong local.
  RCTCallableJSModules *callableJSModules = _callableJSModules;
  if (!callableJSModules) {
    RCTLogWarn(@"Sending `%@` but callableJSModules is nil, bridge was probably torn down", eventName);
    return;
  }

  BOOL shouldEmitEvent = (_observationDisabled || _listenerCount > 0);
  if (!shouldEmitEvent) {
    RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
    return;
  }

  [callableJSModules invokeModule:@"RCTDeviceEventEmitter"
                           method:@"emit"
                         withArgs:body ? @[ eventName, body ] : @[ eventName ]];
}

- (void)setCallableJSModules:(RCTCallableJSModules *)callableJSModules
{
  _callableJSModules = callableJSModules;
  if (callableJSModules != nil) {
    _callableJSModulesWasInitialized = YES;
  }
}

- (void)startObserving
{
  // Does nothing
}

- (void)stopObserving
{
  // Does nothing
}

- (void)invalidate
{
  if (_observationDisabled) {
    return;
  }

  if (_listenerCount > 0) {
    [self stopObserving];
    _listenerCount = 0;
  }
}

RCT_EXPORT_METHOD(addListener : (NSString *)eventName)
{
  if (_observationDisabled) {
    return;
  }

  if (RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  _listenerCount++;
  if (_listenerCount == 1) {
    [self startObserving];
  }
}

RCT_EXPORT_METHOD(removeListeners : (double)count)
{
  if (_observationDisabled) {
    return;
  }

  int currentCount = (int)count;
  if (RCT_DEBUG && currentCount > _listenerCount) {
    RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - currentCount, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

#pragma mark - Test utilities

// For testing purposes only.
// This is supposed to be overridden by a subclass in the Tests
// to verified that the error message is actually emitted.
// This is the less intrusive way found to mock the RCTLogError function in unit tests.
- (void)_log:(NSString *)message
{
  RCTLogError(@"%@", message);
}

@end
