/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorNetworkEmulationGate.h"

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import <jsinspector-modern/network/NetworkThrottler.h>

#import <deque>
#import <mutex>

using facebook::react::jsinspector_modern::NetworkThrottler;

namespace {

/**
 * One queued delivery event. Events are processed strictly in order, with at
 * most one outstanding throttler record per gate at a time.
 */
struct PendingEvent {
  dispatch_block_t deliver;
  int64_t bytes;
  BOOL isStart;
  BOOL isThrottled;
};

} // namespace
#endif

@implementation RCTInspectorNetworkEmulationGate {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  dispatch_queue_t _deliveryQueue;
  dispatch_block_t _onDisconnected;

  std::mutex _mutex;
  std::deque<PendingEvent> _pendingEvents;
  bool _awaitingRelease;
  bool _failed;
  bool _cancelled;
  int64_t _byteDebt;
  uint64_t _token;
  NetworkThrottler::TimePoint _sendEnd;
#endif
}

+ (BOOL)isActive
{
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  if (!facebook::react::ReactNativeFeatureFlags::fuseboxNetworkThrottlingEnabled()) {
    return NO;
  }
  auto &throttler = NetworkThrottler::getInstance();
  return throttler.isThrottling() || throttler.isOffline();
#else
  return NO;
#endif
}

+ (BOOL)isOffline
{
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  return facebook::react::ReactNativeFeatureFlags::fuseboxNetworkThrottlingEnabled() &&
      NetworkThrottler::getInstance().isOffline();
#else
  return NO;
#endif
}

- (instancetype)initWithDeliveryQueue:(dispatch_queue_t)deliveryQueue onDisconnected:(dispatch_block_t)onDisconnected
{
  if (self = [super init]) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
    _deliveryQueue = deliveryQueue;
    _onDisconnected = onDisconnected;
    _token = NetworkThrottler::getInstance().createRecordToken();
    _sendEnd = NetworkThrottler::Clock::now();
#endif
  }
  return self;
}

#ifdef REACT_NATIVE_DEBUGGER_ENABLED

- (void)noteRequestSent
{
  std::lock_guard<std::mutex> lock(_mutex);
  _sendEnd = NetworkThrottler::Clock::now();
}

- (void)throttleResponseDelivery:(dispatch_block_t)deliver
{
  std::lock_guard<std::mutex> lock(_mutex);
  _pendingEvents.push_back(PendingEvent{deliver, 0, YES, YES});
  [self pumpLocked];
}

- (void)throttleDataDelivery:(NSData *)data deliver:(void (^)(NSData *chunk))deliver
{
  // Re-chunk into packet-sized increments while download throttling is
  // active, so progress feels like a slow network rather than one long stall.
  auto &throttler = NetworkThrottler::getInstance();
  std::lock_guard<std::mutex> lock(_mutex);
  NSUInteger offset = 0;
  while (offset < data.length) {
    auto chunkLength = (NSUInteger)throttler.getReadBufLen((int64_t)(data.length - offset));
    NSData *chunk = [data subdataWithRange:NSMakeRange(offset, chunkLength)];
    _pendingEvents.push_back(PendingEvent{
        ^{
          deliver(chunk);
  }
  , (int64_t)chunk.length, NO, YES
});
offset += chunkLength;
}
[self pumpLocked];
}

- (void)throttleCompletionDelivery:(dispatch_block_t)deliver
{
  std::lock_guard<std::mutex> lock(_mutex);
  _pendingEvents.push_back(PendingEvent{deliver, 0, NO, NO});
  [self pumpLocked];
}

- (void)cancel
{
  std::lock_guard<std::mutex> lock(_mutex);
  _cancelled = true;
  _pendingEvents.clear();
  NetworkThrottler::getInstance().stopThrottle(_token);
}

/**
 * Process queued events until one is left pending in the throttling engine.
 * Must be called with `_mutex` held. Deliveries are dispatched asynchronously
 * onto the delivery queue, preserving order.
 */
- (void)pumpLocked
{
  while (!_awaitingRelease && !_failed && !_cancelled && !_pendingEvents.empty()) {
    PendingEvent event = _pendingEvents.front();
    _pendingEvents.pop_front();

    if (!event.isThrottled) {
      dispatch_async(_deliveryQueue, event.deliver);
      continue;
    }

    _byteDebt += event.bytes;

    dispatch_block_t deliver = event.deliver;
    auto result = NetworkThrottler::getInstance().startThrottle(
        _token,
        _byteDebt,
        _sendEnd,
        event.isStart == YES,
        /* isUpload */ false,
        [self, deliver](bool disconnected, int64_t newDebt) {
          // NOTE: `self` is captured strongly: the throttling engine owns the
          // gate until the record fires or is removed via `stopThrottle`. The
          // real request may complete (and the request handler release its
          // reference) before the gated events are delivered.
          //
          // Invoked from an arbitrary thread. Bounce to the delivery queue
          // before taking the gate lock, so the throttling engine never
          // blocks on gate mutexes.
          dispatch_async(self->_deliveryQueue, ^{
            [self handleRelease:deliver disconnected:disconnected newDebt:newDebt];
          });
        });

    switch (result) {
      case NetworkThrottler::StartResult::PassThrough:
        dispatch_async(_deliveryQueue, deliver);
        break;
      case NetworkThrottler::StartResult::Disconnected:
        [self failLocked];
        return;
      case NetworkThrottler::StartResult::Pending:
        _awaitingRelease = true;
        return;
    }
  }
}

- (void)handleRelease:(dispatch_block_t)deliver disconnected:(bool)disconnected newDebt:(int64_t)newDebt
{
  BOOL shouldDeliver = NO;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    _awaitingRelease = false;
    if (_cancelled || _failed) {
      return;
    }
    _byteDebt = newDebt;
    if (disconnected) {
      [self failLocked];
    } else {
      shouldDeliver = YES;
    }
  }
  if (shouldDeliver) {
    // Already on the delivery queue; deliver in-line to stay ordered ahead
    // of any events enqueued by this delivery.
    deliver();
    std::lock_guard<std::mutex> lock(_mutex);
    [self pumpLocked];
  }
}

/** Must be called with `_mutex` held. */
- (void)failLocked
{
  if (_failed) {
    return;
  }
  _failed = true;
  _pendingEvents.clear();
  if (_onDisconnected != nil) {
    dispatch_async(_deliveryQueue, _onDisconnected);
    _onDisconnected = nil;
  }
}

#else

- (void)noteRequestSent
{
}

- (void)throttleResponseDelivery:(dispatch_block_t)deliver
{
  deliver();
}

- (void)throttleDataDelivery:(NSData *)data deliver:(void (^)(NSData *chunk))deliver
{
  deliver(data);
}

- (void)throttleCompletionDelivery:(dispatch_block_t)deliver
{
  deliver();
}

- (void)cancel
{
}

#endif

@end
