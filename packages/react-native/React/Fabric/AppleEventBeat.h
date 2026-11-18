/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <optional>

#import <QuartzCore/QuartzCore.h>

#include <React/RendererCore.h>
#include <React/RuntimeExecutor.h>
#include <react/utils/RunLoopObserver.h>

@class RCTEventBeatFlusherLayer;

namespace facebook::react {

class RuntimeScheduler;

/*
 * Event beat associated with JavaScript runtime.
 * The beat is called on `RuntimeExecutor`'s thread induced by the UI thread
 * event loop.
 *
 * A synchronous request made while Core Animation is laying out the current
 * frame (the run loop observer that induces the beat has already run at that
 * point) is additionally induced from the display phase of the same commit
 * cycle, so that its effects are mounted before the frame is presented. The
 * induce is scheduled on the layer of the requesting view's window — the root
 * of the tree Core Animation is laying out when the request is made from
 * layout.
 *
 * A discrete user input (see `EventBeat::requestForDiscreteEvent`) enqueued
 * on the main thread while the JavaScript thread is idle schedules the same
 * display-phase hook. There, the beat is induced as usual (its callback runs on
 * the JavaScript thread) and the main thread waits, for at most
 * `sameFrameMountForDiscreteEventsTimeoutMs` and never more than half a frame
 * of the input's screen, until the JavaScript thread has processed it, then
 * runs the main thread work that resulted (transactions and commands, in
 * order), so the effects of the input are part of the Core Animation commit of
 * the frame that delivered it. An input that arrives while the JavaScript
 * thread is busy does not wait. On timeout nothing runs early and the work
 * takes the asynchronous main queue path.
 */
class AppleEventBeat : public EventBeat, public RunLoopObserver::Delegate {
 public:
  /*
   * Resolves the layer of the window containing the view with the given tag.
   * Called on the main thread; returns nil when the view is not mounted or
   * not attached to a window.
   */
  using WindowLayerResolver = std::function<CALayer *(Tag)>;

  /*
   * Runs, in order, the main thread work (transactions, commands) that was
   * handed to the mounting layer and has not run yet. Called on the main
   * thread.
   */
  using PendingMountPerformer = std::function<void()>;

  AppleEventBeat(
      std::shared_ptr<OwnerBox> ownerBox,
      std::unique_ptr<const RunLoopObserver> uiRunLoopObserver,
      RuntimeScheduler &RuntimeScheduler,
      WindowLayerResolver windowLayerResolver,
      PendingMountPerformer pendingMountPerformer = nullptr);
  AppleEventBeat(const AppleEventBeat &) = delete;
  AppleEventBeat &operator=(const AppleEventBeat &) = delete;
  AppleEventBeat(AppleEventBeat &&) = delete;
  AppleEventBeat &operator=(AppleEventBeat &&) = delete;

  ~AppleEventBeat() override;

  using EventBeat::requestSynchronous;
  void requestSynchronous(Tag tag) const override;
  void requestForDiscreteEvent(Tag tag) const override;

#pragma mark - RunLoopObserver::Delegate

  void activityDidChange(const RunLoopObserver::Delegate *delegate, RunLoopObserver::Activity activity)
      const noexcept override;

 private:
  bool scheduleDisplayPhaseInduce(Tag tag) const;
  void waitForBeatAndMount() const;

  RuntimeScheduler &runtimeScheduler_;
  std::unique_ptr<const RunLoopObserver> uiRunLoopObserver_;
  WindowLayerResolver windowLayerResolver_;
  PendingMountPerformer pendingMountPerformer_;
  NSMapTable<CALayer *, RCTEventBeatFlusherLayer *> *layers_;
  void (^onDisplay_)(void);

  /*
   * Whether a display phase has already induced in the current run loop turn.
   *
   * The beat a display phase induces runs the whole event loop tick on the
   * main thread, mounting included, so a `VirtualView` whose layout metrics
   * change during that mount emits another synchronous request from inside the
   * display it is servicing. Core Animation honours `setNeedsDisplay` made
   * during a display by running the commit's layout and display phases again,
   * with no bound, so without this flag one commit can perform an unbounded
   * number of blocking JavaScript round trips. Requests that arrive after the
   * first induce keep the ordinary run loop observer timing.
   */
  mutable bool didInduceInCurrentTurn_{false};

  /*
   * Run loop turns, counted by the run loop observer. A discrete event records
   * the turn it was requested in; its display-phase wait is honoured only in
   * that turn or the next one (the display can run before or after the
   * observer, depending on where Core Animation commits), so a flusher whose
   * display never ran cannot make an unrelated later display wait.
   * Main thread only.
   */
  mutable uint64_t currentTurn_{0};
  mutable std::optional<uint64_t> discreteEventTurn_;

  /*
   * The maximum refresh rate of the screen showing the view that received the
   * pending discrete input. Main thread only.
   */
  mutable NSInteger discreteEventMaximumFramesPerSecond_{0};
};

} // namespace facebook::react
