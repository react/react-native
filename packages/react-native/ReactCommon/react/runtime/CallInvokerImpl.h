/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/SchedulerPriority.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/runtime/BufferedRuntimeExecutor.h>

#include <memory>

namespace facebook::react {

/**
 * The bridgeless CallInvoker. Shares the instance's BufferedRuntimeExecutor, so async
 * calls from native are ordered against `callFunctionOnModule` and the rest of
 * the work that executor carries, and none of it runs before the main bundle
 * has finished evaluating.
 *
 * Without this, the two channels reach the same RuntimeScheduler queue by
 * different routes — the CallInvoker straight to `scheduleTask`, module calls
 * through the buffer — so native code that issues both cannot rely on the order
 * it issued them in.
 *
 * `invokeSync` is deliberately not buffered: a synchronous call cannot wait for
 * a flush that only happens once the bundle has run, so it goes directly to the
 * scheduler as before.
 */
class CallInvokerImpl : public CallInvoker {
 public:
  CallInvokerImpl(
      std::shared_ptr<BufferedRuntimeExecutor> bufferedRuntimeExecutor,
      std::weak_ptr<RuntimeScheduler> runtimeScheduler);

  void invokeAsync(CallFunc &&func) noexcept override;

  void invokeAsync(SchedulerPriority priority, CallFunc &&func) noexcept override;

  void invokeSync(CallFunc &&func) override;

 private:
  std::shared_ptr<BufferedRuntimeExecutor> bufferedRuntimeExecutor_;
  std::weak_ptr<RuntimeScheduler> runtimeScheduler_;
};

} // namespace facebook::react
