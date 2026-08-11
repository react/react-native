/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerIntersectionObserverDelegate.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>
#include <memory>
#include <vector>
#include "IntersectionObserver.h"

namespace facebook::react {

class IntersectionObserverManager final
    : public UIManagerMountHook,
      public RuntimeSchedulerIntersectionObserverDelegate {
 public:
  IntersectionObserverManager();

  void observe(
      IntersectionObserverObserverId intersectionObserverId,
      const std::optional<ShadowNodeFamily::Shared>& observationRootShadowNode,
      const ShadowNodeFamily::Shared& shadowNode,
      std::vector<Float> thresholds,
      std::optional<std::vector<Float>> rootThresholds,
      std::optional<std::string> rootMargin,
      const UIManager& uiManager);

  void unobserve(
      IntersectionObserverObserverId intersectionObserverId,
      const ShadowNodeFamily::Shared& shadowNode);

  void connect(
      RuntimeScheduler& runtimeScheduler,
      UIManager& uiManager,
      std::function<void()> notifyIntersectionObserversCallback);

  void disconnect(RuntimeScheduler& runtimeScheduler, UIManager& uiManager);

  std::vector<IntersectionObserverEntry> takeRecords();

#pragma mark - RuntimeSchedulerIntersectionObserverDelegate

  void updateIntersectionObservations(
      const std::unordered_set<SurfaceId>&
          surfaceIdsWithPendingRenderingUpdates) override;

#pragma mark - UIManagerMountHook

  void shadowTreeDidMount(
      const RootShadowNode::Shared& rootShadowNode,
      HighResTimeStamp time) noexcept override;

  void shadowTreeDidUnmount(SurfaceId surfaceId, HighResTimeStamp time) noexcept
      override;

 private:
  mutable std::unordered_map<
      SurfaceId,
      std::vector<std::unique_ptr<IntersectionObserver>>>
      observersBySurfaceId_;
  mutable std::shared_mutex observersMutex_;

  // This is defined as a list of pointers to keep the ownership of the
  // observers in the map.
  std::vector<IntersectionObserver*> observersPendingInitialization_;

  // This is only accessed from the JS thread at the end of the event loop tick,
  // so it is safe to retain it as a raw pointer.
  // We need to retain it here because the RuntimeScheduler does not provide
  // it when calling `updateIntersectionObservations`.
  const ShadowTreeRegistry* shadowTreeRegistry_{nullptr};

  mutable std::function<void()> notifyIntersectionObserversCallback_;

  mutable std::vector<IntersectionObserverEntry> pendingEntries_;
  mutable std::mutex pendingEntriesMutex_;

  mutable bool notifiedIntersectionObservers_{};
  mutable bool mountHookRegistered_{};

  void notifyObserversIfNecessary();
  void notifyObservers();

  // Equivalent to
  // https://w3c.github.io/IntersectionObserver/#update-intersection-observations-algo
  void updateIntersectionObservations(
      SurfaceId surfaceId,
      const RootShadowNode* rootShadowNode,
      HighResTimeStamp time);

  const IntersectionObserver& getRegisteredIntersectionObserver(
      SurfaceId surfaceId,
      IntersectionObserverObserverId observerId) const;
};

} // namespace facebook::react
