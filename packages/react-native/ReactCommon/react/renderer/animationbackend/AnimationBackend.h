/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerAnimationBackend.h>
#include <functional>
#include <memory>
#include <set>
#include <vector>
#include "AnimatedProps.h"
#include "AnimatedPropsRegistry.h"
#include "AnimationBackendCommitHook.h"
#include "AnimationChoreographer.h"

namespace facebook::react {

class AnimationBackend;

struct AnimationMutation {
  Tag tag;
  std::shared_ptr<const ShadowNodeFamily> family;
  AnimatedProps props;
  bool hasLayoutUpdates{false};
};

struct AnimationMutations {
  std::vector<AnimationMutation> batch;
  std::set<SurfaceId> asyncFlushSurfaces;
};

using Callback = std::function<AnimationMutations(AnimationTimestamp)>;

struct CallbackWithId {
  CallbackId callbackId;
  Callback callback;
};

class AnimationBackend : public UIManagerAnimationBackend {
 public:
  using ResumeCallback = std::function<void()>;
  using PauseCallback = std::function<void()>;

  AnimationBackend(
      std::shared_ptr<AnimationChoreographer> animationChoreographer,
      std::shared_ptr<UIManager> uiManager);
  void commitUpdates(SurfaceId surfaceId, SurfaceUpdates &surfaceUpdates);
  void synchronouslyUpdateProps(const std::unordered_map<Tag, AnimatedProps> &updates);
  void requestAsyncFlushForSurfaces(const std::set<SurfaceId> &surfaces);
  void clearRegistry(SurfaceId surfaceId) override;
  void clearRegistryOnSurfaceStop(SurfaceId surfaceId) override;
  void registerJSInvoker(std::shared_ptr<CallInvoker> jsInvoker) override;

  void onAnimationFrame(AnimationTimestamp timestamp) override;
  void trigger() override;
  void pushAnimationMutations(const Callback &callback) override;
  CallbackId start(const Callback &callback) override;
  void stop(CallbackId callbackId) override;

 private:
  void unpackMutations(
      AnimationMutations &mutations,
      std::unordered_map<SurfaceId, SurfaceUpdates> &surfaceUpdates,
      std::set<SurfaceId> &asyncFlushSurfaces);
  void applySurfaceUpdates(
      std::unordered_map<SurfaceId, SurfaceUpdates> &surfaceUpdates,
      const std::set<SurfaceId> &asyncFlushSurfaces);
  void applyMutations(AnimationMutations mutations);
  std::vector<CallbackWithId> callbacks;
  std::shared_ptr<AnimatedPropsRegistry> animatedPropsRegistry_;
  std::shared_ptr<AnimationChoreographer> animationChoreographer_;
  AnimationBackendCommitHook commitHook_;
  std::weak_ptr<UIManager> uiManager_;
  std::shared_ptr<CallInvoker> jsInvoker_;
  bool isRenderCallbackStarted_{false};
  CallbackId nextCallbackId_{0};
  std::mutex mutex_;
};
} // namespace facebook::react
