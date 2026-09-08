/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/core/EventBeat.h>
#include <react/utils/RunLoopObserver.h>

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
 * cycle, so that its effects are mounted before the frame is presented.
 */
class AppleEventBeat : public EventBeat, public RunLoopObserver::Delegate {
 public:
  AppleEventBeat(
      std::shared_ptr<OwnerBox> ownerBox,
      std::unique_ptr<const RunLoopObserver> uiRunLoopObserver,
      RuntimeScheduler &RuntimeScheduler);

  ~AppleEventBeat() override;

  void requestSynchronous() const override;

#pragma mark - RunLoopObserver::Delegate

  void activityDidChange(const RunLoopObserver::Delegate *delegate, RunLoopObserver::Activity activity)
      const noexcept override;

 private:
  class DisplayPhaseFlusher;

  std::unique_ptr<const RunLoopObserver> uiRunLoopObserver_;
  std::unique_ptr<DisplayPhaseFlusher> displayPhaseFlusher_;
};

} // namespace facebook::react
