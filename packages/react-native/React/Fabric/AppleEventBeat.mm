/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AppleEventBeat.h"

#import <QuartzCore/QuartzCore.h>
#import <React/RCTUtils.h>

#include <react/debug/react_native_assert.h>

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

AppleEventBeat::AppleEventBeat(std::shared_ptr<OwnerBox> ownerBox,
                               std::unique_ptr<const RunLoopObserver> uiRunLoopObserver,
                               RuntimeScheduler &runtimeScheduler,
                               WindowLayerResolver windowLayerResolver)
    : EventBeat(std::move(ownerBox), runtimeScheduler),
      uiRunLoopObserver_(std::move(uiRunLoopObserver)),
      windowLayerResolver_(std::move(windowLayerResolver)),
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
    this->induce();
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
    [layers removeAllObjects];
  });
}

void AppleEventBeat::requestSynchronous(Tag tag) const
{
  EventBeat::requestSynchronous(tag);

  if (tag == kNoTag || !RCTIsMainQueue()) {
    return;
  }
  CALayer *hostLayer = windowLayerResolver_ ? windowLayerResolver_(tag) : nil;
  if (hostLayer == nil) {
    return;
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
}

void AppleEventBeat::activityDidChange(const RunLoopObserver::Delegate *delegate,
                                       RunLoopObserver::Activity /*activity*/) const noexcept
{
  react_native_assert(delegate == this);
  induce();
}

} // namespace facebook::react
