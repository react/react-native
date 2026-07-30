/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeIdleCallbacks.h"
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <react/timing/primitives.h>
#include <utility>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule> NativeIdleCallbacksModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeIdleCallbacks>(
      std::move(jsInvoker));
}

namespace facebook::react {

namespace {

class IdleTaskRef : public jsi::NativeState {
 public:
  explicit IdleTaskRef(std::shared_ptr<Task> task) : task(std::move(task)) {}

  std::shared_ptr<Task> task;
};

jsi::Function makeTimeRemainingFunction(
    jsi::Runtime& runtime,
    std::shared_ptr<RuntimeScheduler> runtimeScheduler,
    HighResTimeStamp deadline) {
  return jsi::Function::createFromHostFunction(
      runtime,
      jsi::PropNameID::forAscii(runtime, "timeRemaining"),
      0,
      [runtimeScheduler, deadline, expired = false](
          jsi::Runtime& runtime,
          const jsi::Value& /* unused */,
          const jsi::Value* /* unused */,
          size_t /* unused */) mutable {
        double remainingTime = 0;

        // No need to access the runtime scheduler if this idle callback expired
        // already.
        if (!expired) {
          if (runtimeScheduler->getShouldYield()) {
            expired = true;
          } else {
            auto now = runtimeScheduler->now();
            auto diff = deadline - now;
            remainingTime = std::max(diff.toDOMHighResTimeStamp(), 0.0);

            if (remainingTime == 0) {
              expired = true;
            }
          }
        }

        return jsi::Value(runtime, remainingTime);
      });
}

} // namespace

NativeIdleCallbacks::NativeIdleCallbacks(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeIdleCallbacksCxxSpec(std::move(jsInvoker)) {}

CallbackHandle NativeIdleCallbacks::requestIdleCallback(
    jsi::Runtime& runtime,
    SyncCallback<void(jsi::Object)>&& userCallback,
    std::optional<NativeRequestIdleCallbackOptions> options) {
  auto binding = RuntimeSchedulerBinding::getBinding(runtime);
  auto runtimeScheduler = binding->getRuntimeScheduler();

  // handle timeout parameter
  std::optional<HighResDuration> timeout;
  std::optional<HighResTimeStamp> expirationTime;

  if (options.has_value() && options.value().timeout.has_value()) {
    HighResDuration userTimeout = options.value().timeout.value();
    if (userTimeout > HighResDuration::zero()) {
      timeout = userTimeout;
      expirationTime = runtimeScheduler->now() + userTimeout;
    }
  }

  auto userCallbackShared = std::make_shared<SyncCallback<void(jsi::Object)>>(
      std::move(userCallback));

  auto wrappedCallback = [runtimeScheduler, expirationTime, userCallbackShared](
                             jsi::Runtime& runtime) -> void {
    // This implementation gives each idle callback a 50ms deadline, instead of
    // being shared by all idle callbacks. This is ok because we don't really
    // have idle periods, and if a higher priority task comes in while we're
    // executing an idle callback, we don't execute any more idle callbacks and
    // we interrupt the current one. The general outcome should be the same.

    auto executionStartTime = runtimeScheduler->now();
    auto deadline = executionStartTime + HighResDuration::fromMilliseconds(50);
    auto didTimeout = expirationTime.has_value()
        ? executionStartTime > expirationTime
        : false;

    jsi::Object idleDeadline{runtime};
    idleDeadline.setProperty(runtime, "didTimeout", didTimeout);
    idleDeadline.setProperty(
        runtime,
        "timeRemaining",
        makeTimeRemainingFunction(runtime, runtimeScheduler, deadline));

    userCallbackShared->call(std::move(idleDeadline));
  };

  std::shared_ptr<Task> task;
  if (timeout.has_value()) {
    task = runtimeScheduler->scheduleIdleTask(
        std::move(wrappedCallback), timeout.value());
  } else {
    task = runtimeScheduler->scheduleIdleTask(std::move(wrappedCallback));
  }

  if (task == nullptr) {
    throw jsi::JSError(
        runtime,
        "requestIdleCallback is not supported in legacy runtime scheduler");
  }

  jsi::Object taskHandle{runtime};
  auto taskNativeState = std::make_shared<IdleTaskRef>(task);
  taskHandle.setNativeState(runtime, std::move(taskNativeState));

  return taskHandle;
}

void NativeIdleCallbacks::cancelIdleCallback(
    jsi::Runtime& runtime,
    jsi::Object handle) {
  auto binding = RuntimeSchedulerBinding::getBinding(runtime);
  auto runtimeScheduler = binding->getRuntimeScheduler();

  if (!handle.hasNativeState(runtime)) {
    return;
  }

  auto taskHandle =
      std::dynamic_pointer_cast<IdleTaskRef>(handle.getNativeState(runtime));
  if (!taskHandle) {
    return;
  }

  runtimeScheduler->cancelTask(*taskHandle->task);
}

} // namespace facebook::react
