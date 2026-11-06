/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTEventDispatcher.h"

#import <React/RCTAssert.h>
#import <React/RCTComponentEvent.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>

#import "CoreModulesPlugins.h"

static NSNumber *RCTGetEventID(NSNumber *viewTag, NSString *eventName, uint16_t coalescingKey)
{
  return @(viewTag.intValue | (((uint64_t)eventName.hash & 0xFFFF) << 32) | (((uint64_t)coalescingKey) << 48));
}

static uint16_t RCTUniqueCoalescingKeyGenerator = 0;

@interface RCTEventDispatcher () <RCTTurboModule>
@end

@implementation RCTEventDispatcher {
  // We need this lock to protect access to _events, _eventQueue and _eventsDispatchScheduled. It's filled in on main
  // thread and consumed on js thread.
  NSLock *_eventQueueLock;
  // We have this id -> event mapping so we coalesce effectively.
  NSMutableDictionary<NSNumber *, id<RCTEvent>> *_events;
  // This array contains ids of events in order they come in, so we can emit them to JS in the exact same order.
  NSMutableArray<NSNumber *> *_eventQueue;
  BOOL _eventsDispatchScheduled;
  NSHashTable<id<RCTEventDispatcherObserver>> *_observers;
  NSRecursiveLock *_observersLock;
}

@synthesize dispatchToJSThread = _dispatchToJSThread;
@synthesize callableJSModules = _callableJSModules;

RCT_EXPORT_MODULE()

- (void)initialize
{
  _events = [NSMutableDictionary new];
  _eventQueue = [NSMutableArray new];
  _eventQueueLock = [NSLock new];
  _eventsDispatchScheduled = NO;
  _observers = [NSHashTable weakObjectsHashTable];
  _observersLock = [NSRecursiveLock new];

  NSNotificationCenter *defaultCenter = [NSNotificationCenter defaultCenter];
  [defaultCenter addObserver:self
                    selector:@selector(_notifyEventDispatcherObserversOfEvent_DEPRECATED:)
                        name:RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED
                      object:nil];
}

- (void)sendViewEventWithName:(NSString *)name reactTag:(NSNumber *)reactTag
{
  [_callableJSModules invokeModule:@"RCTViewEventEmitter" method:@"emit" withArgs:@[ name, RCTNullIfNil(reactTag) ]];
}

- (void)sendAppEventWithName:(NSString *)name body:(id)body
{
  [_callableJSModules invokeModule:@"RCTNativeAppEventEmitter"
                            method:@"emit"
                          withArgs:(body != nullptr) ? @[ name, body ] : @[ name ]];
}

- (void)sendDeviceEventWithName:(NSString *)name body:(id)body
{
  [_callableJSModules invokeModule:@"RCTDeviceEventEmitter"
                            method:@"emit"
                          withArgs:(body != nullptr) ? @[ name, body ] : @[ name ]];
}

- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text
                          key:(NSString *)key
                   eventCount:(NSInteger)eventCount
{
  static NSString *events[] = {@"focus", @"blur", @"change", @"submitEditing", @"endEditing", @"keyPress"};

  NSMutableDictionary *body = [[NSMutableDictionary alloc] initWithDictionary:@{
    @"eventCount" : @(eventCount),
  }];

  if (text != nullptr) {
    // We copy the string here because if it's a mutable string it may get released before we dispatch the event on a
    // different thread, causing a crash.
    body[@"text"] = [text copy];
  }

  if (key != nullptr) {
    if (key.length == 0) {
      key = @"Backspace"; // backspace
    } else {
      switch ([key characterAtIndex:0]) {
        case '\t':
          key = @"Tab";
          break;
        case '\n':
          key = @"Enter";
          break;
        default:
          break;
      }
    }
    // We copy the string here because if it's a mutable string it may get released before we dispatch the event on a
    // different thread, causing a crash.
    body[@"key"] = [key copy];
  }

  RCTComponentEvent *event = [[RCTComponentEvent alloc] initWithName:events[type] viewTag:reactTag body:body];
  [self sendEvent:event];
}

- (void)notifyObserversOfEvent:(id<RCTEvent>)event
{
  [_observersLock lock];

  for (id<RCTEventDispatcherObserver> observer in _observers) {
    [observer eventDispatcherWillDispatchEvent:event];
  }

  [_observersLock unlock];
}

- (void)sendEvent:(id<RCTEvent>)event
{
  [self notifyObserversOfEvent:event];

  [_eventQueueLock lock];

  NSNumber *eventID;
  if (event.canCoalesce) {
    eventID = RCTGetEventID(event.viewTag, event.eventName, event.coalescingKey);
    id<RCTEvent> previousEvent = _events[eventID];
    if (previousEvent != nullptr) {
      event = [previousEvent coalesceWithEvent:event];
    } else {
      [_eventQueue addObject:eventID];
    }
  } else {
    id<RCTEvent> previousEvent = _events[eventID];
    eventID = RCTGetEventID(event.viewTag, event.eventName, RCTUniqueCoalescingKeyGenerator++);
    RCTAssert(
        previousEvent == nil,
        @"Got event %@ which cannot be coalesced, but has the same eventID %@ as the previous event %@",
        event,
        eventID,
        previousEvent);
    [_eventQueue addObject:eventID];
  }

  _events[eventID] = event;

  BOOL scheduleEventsDispatch = NO;
  if (!_eventsDispatchScheduled) {
    _eventsDispatchScheduled = YES;
    scheduleEventsDispatch = YES;
  }

  // We have to release the lock before dispatching block with events,
  // since dispatchBlock: can be executed synchronously on the same queue.
  // (This is happening when chrome debugging is turned on.)
  [_eventQueueLock unlock];

  if (scheduleEventsDispatch) {
    if (_dispatchToJSThread != nullptr) {
      _dispatchToJSThread(^{
        [self flushEventsQueue];
      });
    }
  }
}

- (void)addDispatchObserver:(id<RCTEventDispatcherObserver>)observer
{
  [_observersLock lock];
  [_observers addObject:observer];
  [_observersLock unlock];
}

- (void)removeDispatchObserver:(id<RCTEventDispatcherObserver>)observer
{
  [_observersLock lock];
  [_observers removeObject:observer];
  [_observersLock unlock];
}

- (void)dispatchEvent:(id<RCTEvent>)event
{
  NSString *moduleDotMethod = [[event class] moduleDotMethod];
  NSArray<NSString *> *const components = [moduleDotMethod componentsSeparatedByString:@"."];
  NSString *const moduleName = components[0];
  NSString *const methodName = components[1];

  [_callableJSModules invokeModule:moduleName method:methodName withArgs:[event arguments]];
}

- (dispatch_queue_t)methodQueue
{
  return RCTJSThread;
}

// js thread only (which surprisingly can be the main thread, depends on used JS executor)
- (void)flushEventsQueue
{
  [_eventQueueLock lock];
  NSDictionary *events = _events;
  _events = [NSMutableDictionary new];
  NSMutableArray *eventQueue = _eventQueue;
  _eventQueue = [NSMutableArray new];
  _eventsDispatchScheduled = NO;
  [_eventQueueLock unlock];

  for (NSNumber *eventId in eventQueue) {
    [self dispatchEvent:events[eventId]];
  }
}

- (void)_notifyEventDispatcherObserversOfEvent_DEPRECATED:(NSNotification *)notification
{
  NSDictionary *userInfo = notification.userInfo;
  id<RCTEvent> event = [userInfo objectForKey:@"event"];
  if (event != nullptr) {
    [self notifyObserversOfEvent:event];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class RCTEventDispatcherCls(void)
{
  return RCTEventDispatcher.class;
}
