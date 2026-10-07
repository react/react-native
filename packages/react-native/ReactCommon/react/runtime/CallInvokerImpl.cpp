/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CallInvokerImpl.h"

#include <utility>

namespace facebook::react {

CallInvokerImpl::CallInvokerImpl(
    std::shared_ptr<BufferedRuntimeExecutor> bufferedRuntimeExecutor,
    std::weak_ptr<RuntimeScheduler> runtimeScheduler)
    : bufferedRuntimeExecutor_(std::move(bufferedRuntimeExecutor)),
      runtimeScheduler_(std::move(runtimeScheduler)) {}

void CallInvokerImpl::invokeAsync(CallFunc&& func) noexcept {
  // Held for the duration of the call: `BufferedRuntimeExecutor` reaches the
  // scheduler through a raw pointer, which is only safe while the instance that
  // owns it is alive. A CallInvoker outlives its instance routinely — a caller
  // can hold one across a reload — so guard dispatch with the weak scheduler.
  // If it has expired, there is no runtime left to receive the work.
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    // No priority was given, so use the executor's default.
    bufferedRuntimeExecutor_->execute(std::move(func));
  }
}

void CallInvokerImpl::invokeAsync(
    SchedulerPriority priority,
    CallFunc&& func) noexcept {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    bufferedRuntimeExecutor_->execute(priority, std::move(func));
  }
}

void CallInvokerImpl::invokeSync(CallFunc&& func) {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    runtimeScheduler->executeNowOnTheSameThread(std::move(func));
  }
}

} // namespace facebook::react
