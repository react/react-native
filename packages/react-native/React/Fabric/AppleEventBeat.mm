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
@property (nonatomic, copy, nullable) void (^onDisplay)(void);
@end

@implementation RCTEventBeatFlusherLayer

- (void)display
{
  if (self.onDisplay != nil) {
    self.onDisplay();
  }
}

// The layer is not a visual element; never participate in animations.
- (id<CAAction>)actionForKey:(NSString *)event
{
  return nil;
}

@end

/*
 * The windows that can commit a Core Animation transaction: the visible ones
 * of every foreground scene.
 */
static NSArray<UIWindow *> *RCTFlushableWindows(void)
{
  NSMutableArray<UIWindow *> *windows = [NSMutableArray new];
  for (UIScene *scene in RCTSharedApplication().connectedScenes) {
    if (![scene isKindOfClass:[UIWindowScene class]]) {
      continue;
    }
    if (scene.activationState != UISceneActivationStateForegroundActive &&
        scene.activationState != UISceneActivationStateForegroundInactive) {
      continue;
    }
    for (UIWindow *window in ((UIWindowScene *)scene).windows) {
      if (!window.hidden) {
        [windows addObject:window];
      }
    }
  }
  if (windows.count == 0) {
    // Apps on the legacy UIApplicationDelegate lifecycle own their window
    // outside of any scene, so the enumeration above finds nothing.
    UIWindow *keyWindow = RCTKeyWindow();
    if (keyWindow != nil) {
      [windows addObject:keyWindow];
    }
  }
  return windows;
}

namespace facebook::react {

/*
 * Owns the flusher layers and keeps one attached to every window's layer so
 * that whichever layer tree is being committed contains one of them.
 */
class AppleEventBeat::DisplayPhaseFlusher {
 public:
  DisplayPhaseFlusher(std::function<void()> callback, std::weak_ptr<const void> weakOwner)
  {
    // Weak keys: a window that goes away takes its own layer with it.
    layers_ = [NSMapTable weakToStrongObjectsMapTable];
    auto sharedCallback = std::make_shared<std::function<void()>>(std::move(callback));
    onDisplay_ = ^{
      // The owner (indirectly) retains the event beat; if it is gone, so is
      // the beat the callback points into.
      auto owner = weakOwner.lock();
      if (!owner) {
        return;
      }
      (*sharedCallback)();
    };
  }

  ~DisplayPhaseFlusher()
  {
    // The beat can be destroyed on any thread; layer mutations belong on the
    // main thread. The block only retains the layers, and a display happening
    // before this executes is made safe by the owner check above.
    NSMapTable<UIWindow *, RCTEventBeatFlusherLayer *> *layers = layers_;
    RCTExecuteOnMainQueue(^{
      for (RCTEventBeatFlusherLayer *layer in layers.objectEnumerator) {
        layer.onDisplay = nil;
        [layer removeFromSuperlayer];
      }
      [layers removeAllObjects];
    });
  }

  /*
   * Schedules the callback to run in the display phase of the current (or
   * next) Core Animation commit cycle. Main thread only.
   *
   * Every window gets a layer rather than only the key window: the request can
   * come from any of them — a modal and the LogBox are windows of their own —
   * and only a layer in a tree that is committed is displayed in this cycle.
   * The induce the display triggers is coalescing, so the extra layers cost a
   * dirty zero-sized layer each, not extra beats.
   */
  void schedule() const
  {
    for (UIWindow *window in RCTFlushableWindows()) {
      RCTEventBeatFlusherLayer *layer = [layers_ objectForKey:window];
      if (layer == nil) {
        layer = [RCTEventBeatFlusherLayer new];
        layer.frame = CGRectZero;
        layer.onDisplay = onDisplay_;
        [layers_ setObject:layer forKey:window];
      }
      if (layer.superlayer != window.layer) {
        [window.layer addSublayer:layer];
      }
      [layer setNeedsDisplay];
    }
  }

 private:
  NSMapTable<UIWindow *, RCTEventBeatFlusherLayer *> *layers_;
  void (^onDisplay_)(void);
};

AppleEventBeat::AppleEventBeat(std::shared_ptr<OwnerBox> ownerBox,
                               std::unique_ptr<const RunLoopObserver> uiRunLoopObserver,
                               RuntimeScheduler &runtimeScheduler)
    : EventBeat(std::move(ownerBox), runtimeScheduler),
      uiRunLoopObserver_(std::move(uiRunLoopObserver)),
      displayPhaseFlusher_(std::make_unique<DisplayPhaseFlusher>([this]() { induce(); }, ownerBox_->owner))
{
  uiRunLoopObserver_->setDelegate(this);
  uiRunLoopObserver_->enable();
}

AppleEventBeat::~AppleEventBeat() = default;

void AppleEventBeat::requestSynchronous() const
{
  EventBeat::requestSynchronous();

  // The run loop observer that ordinarily induces the beat runs before Core
  // Animation commits the frame. A synchronous request made while Core
  // Animation is already laying out (e.g. an event emitted from
  // `layoutSubviews`) would therefore only be processed on the next frame.
  // Scheduling an induce in the display phase of the current commit cycle
  // processes it before this frame is presented. Multiple requests within one
  // cycle coalesce into a single induce.
  if (RCTIsMainQueue()) {
    displayPhaseFlusher_->schedule();
  }
}

void AppleEventBeat::activityDidChange(const RunLoopObserver::Delegate *delegate,
                                       RunLoopObserver::Activity /*activity*/) const noexcept
{
  react_native_assert(delegate == this);
  induce();
}

} // namespace facebook::react
