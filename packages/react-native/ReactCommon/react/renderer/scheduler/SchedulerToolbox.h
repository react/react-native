/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/animationbackend/AnimationChoreographer.h>
#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/leakchecker/LeakChecker.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/RunLoopObserver.h>

namespace facebook::react {

/*
 * Contains all external dependencies of Scheduler.
 * Copyable.
 */
struct SchedulerToolbox final {
  /*
   * Represents general purpose DI container for product components/needs.
   * Must not be `nullptr`.
   */
  std::shared_ptr<const ContextContainer> contextContainer;

  /*
   * Represents externally managed, lazily available collection of components.
   */
  ComponentRegistryFactory componentRegistryFactory;

  /*
   * Represents running JavaScript VM and associated execution queue.
   * Can execute lambdas before main bundle has loaded.
   */
  std::optional<RuntimeExecutor> bridgelessBindingsExecutor;

  /*
   * Represents running JavaScript VM and associated execution queue.
   * Executes lambdas after main bundle has loaded.
   */
  RuntimeExecutor runtimeExecutor;

  /*
   * Represent connections with the platform-specific run loops and general
   * purpose background queue.
   */
  EventBeat::Factory eventBeatFactory;

  /*
   * A list of `UIManagerCommitHook`s that should be registered in `UIManager`.
   */
  std::vector<std::shared_ptr<UIManagerCommitHook>> commitHooks;

  /*
   * Platform-specific choreographer for scheduling animation frame
   * callbacks. Required when useSharedAnimatedBackend() is enabled.
   */
  std::shared_ptr<AnimationChoreographer> animationChoreographer;
};

} // namespace facebook::react
