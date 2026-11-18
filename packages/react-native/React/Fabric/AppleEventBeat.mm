/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AppleEventBeat.h"

#import <QuartzCore/QuartzCore.h>
#import <React/RCTUtils.h>
#import <dispatch/dispatch.h>

#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <algorithm>
#include <utility>

/*
 * A zero-sized layer whose only purpose is to run a callback during the
 * display phase of a Core Animation commit. Core Animation processes a commit
 * as layout → display → (repeat until stable) → commit, so a layer marked as
 * needing display during the layout phase has its `display` called after the
 * whole layout pass but before the transaction is committed.
 */
@interface RCTEventBeatFlusherLayer : CALayer
- (instancetype)initWithOnDisplay:(void (^)(void))onDisplay;
@end

@implementation RCTEventBeatFlusherLayer {
  void (^_onDisplay)(void);
}

- (instancetype)initWithOnDisplay:(void (^)(void))onDisplay
{
  if (self = [super init]) {
    _onDisplay = [onDisplay copy];
    self.frame = CGRectZero;
  }
  return self;
}

- (void)display
{
  _onDisplay();
}

// The layer is not a visual element; never participate in animations.
- (id<CAAction>)actionForKey:(NSString *)event
{
  return nil;
}

@end

namespace facebook::react {

namespace {
// After this many consecutive timeouts, discrete events skip the wait for
// `kBackOffInterval` seconds and use the asynchronous mount.
constexpr int kMaxConsecutiveTimeouts = 3;
constexpr CFTimeInterval kBackOffInterval = 1.0;
} // namespace

AppleEventBeat::AppleEventBeat(
    std::shared_ptr<OwnerBox> ownerBox,
    std::unique_ptr<const RunLoopObserver> uiRunLoopObserver,
    RuntimeScheduler &runtimeScheduler,
    WindowLayerResolver windowLayerResolver,
    PendingMountPerformer pendingMountPerformer)
    : EventBeat(std::move(ownerBox), runtimeScheduler),
      uiRunLoopObserver_(std::move(uiRunLoopObserver)),
      windowLayerResolver_(std::move(windowLayerResolver)),
      pendingMountPerformer_(std::move(pendingMountPerformer)),
      layers_([NSMapTable weakToStrongObjectsMapTable])
{
  std::weak_ptr<const void> weakOwner = ownerBox_->owner;
  onDisplay_ = ^{
    // The owner (indirectly) retains the event beat; if it is gone, so is
    // the beat this induces.
    auto owner = weakOwner.lock();
    if (!owner) {
      return;
    }
    auto discreteEventTurn = std::exchange(this->discreteEventTurn_, std::nullopt);
    bool isDiscreteEventPending = discreteEventTurn.has_value() &&
        (*discreteEventTurn == this->currentTurn_ || *discreteEventTurn + 1 == this->currentTurn_);
    if (this->didInduceInCurrentTurn_) {
      return;
    }
    this->didInduceInCurrentTurn_ = true;
    // A synchronous request runs the beat, and mounts its transactions, on
    // this thread inside `induce`; there is nothing left to wait for.
    bool inducesSynchronously = this->isSynchronousRequestPending();
    this->induce();
    if (isDiscreteEventPending && !inducesSynchronously) {
      this->waitForBeatAndMount();
    }
  };

  uiRunLoopObserver_->setDelegate(this);
  uiRunLoopObserver_->enable();
}

AppleEventBeat::~AppleEventBeat()
{
  // The beat can be destroyed on any thread; layer mutations belong on the
  // main thread. The block only retains the layers, and a display happening
  // before it executes is made safe by the owner check above.
  NSMapTable<CALayer *, RCTEventBeatFlusherLayer *> *layers = layers_;
  RCTExecuteOnMainQueue(^{
    for (RCTEventBeatFlusherLayer *layer in layers.objectEnumerator) {
      [layer removeFromSuperlayer];
    }
  });
}

void AppleEventBeat::requestSynchronous(Tag tag) const
{
  EventBeat::requestSynchronous(tag);
  scheduleDisplayPhaseInduce(tag);
}

void AppleEventBeat::requestForDiscreteEvent(Tag tag) const
{
  EventBeat::requestForDiscreteEvent(tag);

  if (pendingMountPerformer_ && scheduleDisplayPhaseInduce(tag)) {
    // Consumed by the display phase this schedules, whether or not the run
    // loop observer induces the beat first.
    discreteEventTurn_ = currentTurn_;
  }
}

bool AppleEventBeat::scheduleDisplayPhaseInduce(Tag tag) const
{
  if (tag == kNoTag || !RCTIsMainQueue()) {
    return false;
  }
  CALayer *hostLayer = windowLayerResolver_ ? windowLayerResolver_(tag) : nil;
  if (hostLayer == nil) {
    return false;
  }
  RCTEventBeatFlusherLayer *layer = [layers_ objectForKey:hostLayer];
  if (layer == nil) {
    layer = [[RCTEventBeatFlusherLayer alloc] initWithOnDisplay:onDisplay_];
    [layers_ setObject:layer forKey:hostLayer];
  }
  if (layer.superlayer != hostLayer) {
    [layer removeFromSuperlayer];
    [hostLayer addSublayer:layer];
  }
  [layer setNeedsDisplay];
  return true;
}

void AppleEventBeat::waitForBeatAndMount() const
{
  // Never wait longer than half a frame at the display's maximum refresh rate:
  // past that point waiting delays the commit of the input's frame itself.
  NSInteger maximumFramesPerSecond = RCTKeyWindow().screen.maximumFramesPerSecond;
  double halfFrameMs = 500.0 / (maximumFramesPerSecond > 0 ? maximumFramesPerSecond : 60);
  double timeoutMs = std::min(ReactNativeFeatureFlags::sameFrameMountForDiscreteEventsTimeoutMs(), halfFrameMs);
  CFTimeInterval now = CACurrentMediaTime();
  if (timeoutMs <= 0 || now < skipWaitsUntil_) {
    return;
  }

  // The runtime scheduler runs tasks by expiration time, and a task scheduled
  // later at the same (immediate) priority expires later (should two
  // timestamps ever be equal, the marker may run first: the wait then ends
  // early and the frame behaves as without this change), so this task runs after the beat
  // task scheduled by `induce` (or by the run loop observer, if it already ran
  // this turn), after that task's microtasks and its "update the rendering"
  // step, where React Native hands committed transactions to the mounting
  // layer. It also runs after the task the JavaScript thread is executing
  // and any task that expired earlier, which the timeout bounds.
  // The JavaScript work stays on the JavaScript thread; the main thread only
  // waits, and never longer than the timeout, so a JavaScript thread that is
  // blocked (for example on a synchronous call to the main thread) cannot
  // deadlock it.
  dispatch_semaphore_t beatDidRun = dispatch_semaphore_create(0);
  getRuntimeScheduler().scheduleWork(
      [beatDidRun](jsi::Runtime & /*runtime*/) { dispatch_semaphore_signal(beatDidRun); });
  auto timeout = dispatch_time(DISPATCH_TIME_NOW, static_cast<int64_t>(timeoutMs * NSEC_PER_MSEC));
  if (dispatch_semaphore_wait(beatDidRun, timeout) != 0) {
    if (++consecutiveTimeouts_ >= kMaxConsecutiveTimeouts) {
      consecutiveTimeouts_ = 0;
      skipWaitsUntil_ = CACurrentMediaTime() + kBackOffInterval;
    }
    return;
  }
  consecutiveTimeouts_ = 0;
  pendingMountPerformer_();
}

void AppleEventBeat::activityDidChange(
    const RunLoopObserver::Delegate *delegate,
    RunLoopObserver::Activity /*activity*/) const noexcept
{
  react_native_assert(delegate == this);
  // This observer runs before Core Animation's commit observer, so it is the
  // start of the turn whose display phase `didInduceInCurrentTurn_` bounds.
  didInduceInCurrentTurn_ = false;
  currentTurn_++;
  induce();
}

} // namespace facebook::react
