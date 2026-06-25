/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <chrono>
#include <functional>
#include <memory>

namespace facebook::react {

struct AnimationMutations;

using AnimationTimestamp = std::chrono::duration<double, std::milli>;
using CallbackId = uint64_t;

class UIManagerAnimationBackend {
 public:
  using Callback = std::function<AnimationMutations(AnimationTimestamp)>;

  virtual ~UIManagerAnimationBackend() = default;

  virtual void onAnimationFrame(AnimationTimestamp timestamp) = 0;
  virtual CallbackId start(const Callback &callback) = 0;
  virtual void stop(CallbackId callbackId) = 0;
  virtual void clearRegistry(SurfaceId surfaceId) = 0;
  virtual void clearRegistryOnSurfaceStop(SurfaceId surfaceId) = 0;
  virtual void trigger() = 0;
  virtual void pushAnimationMutations(const Callback &callback) = 0;
  virtual void registerJSInvoker(std::shared_ptr<CallInvoker> jsInvoker) = 0;
};

} // namespace facebook::react
