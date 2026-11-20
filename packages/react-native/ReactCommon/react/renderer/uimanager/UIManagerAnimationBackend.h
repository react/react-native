/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/CallInvoker.h>
#include <React/RendererCore.h>

#include <chrono>
#include <cstdint>
#include <functional>
#include <memory>

namespace facebook::react {

struct AnimationMutations;

using AnimationTimestamp = std::chrono::duration<double, std::milli>;
using CallbackId = uint64_t;
using AnimationFrontendId = uint32_t;

// A producer of animation mutations, such as C++ Animated or Reanimated.
struct AnimationFrontend {
  // Runs every frame while the frontend is started, after the callbacks passed
  // to `start(callback)` and those of frontends registered earlier.
  std::function<AnimationMutations(AnimationTimestamp)> onAnimationFrame;
};

class UIManagerAnimationBackend {
 public:
  using Callback = std::function<AnimationMutations(AnimationTimestamp)>;

  virtual ~UIManagerAnimationBackend() = default;

  virtual void onAnimationFrame(AnimationTimestamp timestamp) = 0;
  virtual AnimationFrontendId registerFrontend(AnimationFrontend frontend) = 0;
  // Starting a started frontend or stopping a stopped one does nothing.
  virtual void startFrontend(AnimationFrontendId frontendId) = 0;
  virtual void stopFrontend(AnimationFrontendId frontendId) = 0;
  virtual CallbackId start(const Callback &callback) = 0;
  virtual void stop(CallbackId callbackId) = 0;
  virtual void clearRegistry(SurfaceId surfaceId) = 0;
  virtual void clearRegistryOnSurfaceStop(SurfaceId surfaceId) = 0;
  virtual void trigger() = 0;
  virtual void pushAnimationMutations(const Callback &callback) = 0;
  virtual void registerJSInvoker(std::shared_ptr<CallInvoker> jsInvoker) = 0;
};

} // namespace facebook::react
