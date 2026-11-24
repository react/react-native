/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "IntersectionObserverManager.h"
#include <cxxreact/JSExecutor.h>
#include <cxxreact/TraceSection.h>
#include <react/debug/react_native_assert.h>
#include <utility>
#include "IntersectionObserver.h"

namespace facebook::react {

namespace {
RootShadowNode::Shared getRootShadowNode(
    SurfaceId surfaceId,
    const ShadowTreeRegistry& shadowTreeRegistry,
    std::unordered_map<SurfaceId, RootShadowNode::Shared>& cache) {
  auto it = cache.find(surfaceId);
  if (it == cache.end()) {
    RootShadowNode::Shared rootShadowNode = nullptr;

    shadowTreeRegistry.visit(surfaceId, [&](const ShadowTree& shadowTree) {
      rootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
    });

    cache.insert({surfaceId, rootShadowNode});
    return rootShadowNode;
  } else {
    return it->second;
  }
}
} // namespace

IntersectionObserverManager::IntersectionObserverManager() = default;

void IntersectionObserverManager::observe(
    IntersectionObserverObserverId intersectionObserverId,
    const std::optional<ShadowNodeFamily::Shared>&
        observationRootShadowNodeFamily,
    const ShadowNodeFamily::Shared& shadowNodeFamily,
    std::vector<Float> thresholds,
    std::optional<std::vector<Float>> rootThresholds,
    std::optional<std::string> rootMargin,
    const std::optional<std::string>& scrollMargin,
    const UIManager& /*uiManager*/) {
  TraceSection s("IntersectionObserverManager::observe");

  auto surfaceId = shadowNodeFamily->getSurfaceId();

  // Register observer
  std::unique_lock lock(observersMutex_);

  auto& observers = observersBySurfaceId_[surfaceId];

  // Parse the margin strings into EdgeMargins
  // Default to "0px 0px 0px 0px" if not provided
  auto parsedRootMargin =
      parseNormalizedMargin(rootMargin.value_or("0px 0px 0px 0px"));
  auto parsedScrollMargin =
      parseNormalizedMargin(scrollMargin.value_or("0px 0px 0px 0px"));

  observers.emplace_back(
      std::make_unique<IntersectionObserver>(
          intersectionObserverId,
          observationRootShadowNodeFamily,
          shadowNodeFamily,
          std::move(thresholds),
          std::move(rootThresholds),
          parsedRootMargin,
          parsedScrollMargin));

  observersPendingInitialization_.emplace_back(observers.back().get());
}

void IntersectionObserverManager::unobserve(
    IntersectionObserverObserverId intersectionObserverId,
    const ShadowNodeFamily::Shared& shadowNodeFamily) {
  TraceSection s("IntersectionObserverManager::unobserve");

  // This doesn't need to be protected by the mutex because it is only
  // accessed and modified from the JS thread.
  observersPendingInitialization_.erase(
      std::remove_if(
          observersPendingInitialization_.begin(),
          observersPendingInitialization_.end(),
          [intersectionObserverId, &shadowNodeFamily](const auto& observer) {
            return (
                observer->getIntersectionObserverId() ==
                    intersectionObserverId &&
                observer->getTargetShadowNodeFamily() == shadowNodeFamily);
          }),
      observersPendingInitialization_.end());

  {
    std::unique_lock lock(observersMutex_);

    auto surfaceId = shadowNodeFamily->getSurfaceId();

    auto observersIt = observersBySurfaceId_.find(surfaceId);
    if (observersIt == observersBySurfaceId_.end()) {
      return;
    }

    auto& observers = observersIt->second;

    observers.erase(
        std::remove_if(
            observers.begin(),
            observers.end(),
            [intersectionObserverId, &shadowNodeFamily](const auto& observer) {
              return observer->getIntersectionObserverId() ==
                  intersectionObserverId &&
                  observer->getTargetShadowNodeFamily() == shadowNodeFamily;
            }),
        observers.end());

    if (observers.empty()) {
      observersBySurfaceId_.erase(surfaceId);
    }
  }

  {
    std::unique_lock lock(pendingEntriesMutex_);

    pendingEntries_.erase(
        std::remove_if(
            pendingEntries_.begin(),
            pendingEntries_.end(),
            [intersectionObserverId, &shadowNodeFamily](const auto& entry) {
              return entry.intersectionObserverId == intersectionObserverId &&
                  entry.sameShadowNodeFamily(*shadowNodeFamily);
            }),
        pendingEntries_.end());
  }
}

void IntersectionObserverManager::connect(
    RuntimeScheduler& runtimeScheduler,
    UIManager& uiManager,
    std::function<void()> notifyIntersectionObserversCallback) {
  TraceSection s("IntersectionObserverManager::connect");
  notifyIntersectionObserversCallback_ =
      std::move(notifyIntersectionObserversCallback);

  // Fail-safe in case the caller doesn't guarantee consistency.
  if (mountHookRegistered_) {
    return;
  }

  runtimeScheduler.setIntersectionObserverDelegate(this);
  uiManager.registerMountHook(*this);
  shadowTreeRegistry_ = &uiManager.getShadowTreeRegistry();
  mountHookRegistered_ = true;
}

void IntersectionObserverManager::disconnect(
    RuntimeScheduler& runtimeScheduler,
    UIManager& uiManager) {
  TraceSection s("IntersectionObserverManager::disconnect");

  // Fail-safe in case the caller doesn't guarantee consistency.
  if (!mountHookRegistered_) {
    return;
  }

  runtimeScheduler.setIntersectionObserverDelegate(nullptr);
  uiManager.unregisterMountHook(*this);
  shadowTreeRegistry_ = nullptr;
  mountHookRegistered_ = false;
  notifyIntersectionObserversCallback_ = nullptr;
}

std::vector<IntersectionObserverEntry>
IntersectionObserverManager::takeRecords() {
  std::unique_lock lock(pendingEntriesMutex_);

  notifiedIntersectionObservers_ = false;

  std::vector<IntersectionObserverEntry> entries;
  pendingEntries_.swap(entries);
  return entries;
}

#pragma mark - RuntimeSchedulerIntersectionObserverDelegate

void IntersectionObserverManager::updateIntersectionObservations(
    const std::unordered_set<SurfaceId>&
        surfaceIdsWithPendingRenderingUpdates) {
  // On Web, this step invoked from the Event Loop computes the intersections
  // and schedules the notifications.
  // Doing exactly the same in React Native would exclude the time it takes
  // to process these transactions and mount the operations in the host
  // platform, which would provide inaccurate timings for measuring paint time.
  // Instead, we use mount hooks to compute this.

  // What we can use this step for is to dispatch initial notifications for
  // observers that were just set up, but for which we do not have any pending
  // transactions that would trigger the mount hooks.
  // In those cases it is ok to dispatch the notifications now, because the
  // current state is already accurate.

  if (observersPendingInitialization_.empty()) {
    return;
  }

  TraceSection s(
      "IntersectionObserverManager::updateIntersectionObservations",
      "pendingObserverCount",
      observersPendingInitialization_.size());

  std::unordered_map<SurfaceId, RootShadowNode::Shared> rootShadowNodeCache;

  for (auto observer : observersPendingInitialization_) {
    auto surfaceId = observer->getTargetShadowNodeFamily()->getSurfaceId();

    // If there are pending updates, we just wait for the mount hook.
    if (surfaceIdsWithPendingRenderingUpdates.contains(surfaceId)) {
      continue;
    }

    RootShadowNode::Shared rootShadowNode =
        getRootShadowNode(surfaceId, *shadowTreeRegistry_, rootShadowNodeCache);

    // If the surface doesn't exist for some reason, we skip initial
    // notification.
    if (!rootShadowNode) {
      continue;
    }

    auto entry = observer->updateIntersectionObservation(
        *rootShadowNode, HighResTimeStamp::now());
    if (entry) {
      {
        std::unique_lock lock(pendingEntriesMutex_);
        pendingEntries_.push_back(std::move(entry).value());
      }
      notifyObserversIfNecessary();
    }
  }

  observersPendingInitialization_.clear();
}

#pragma mark - UIManagerMountHook

void IntersectionObserverManager::shadowTreeDidMount(
    const RootShadowNode::Shared& rootShadowNode,
    HighResTimeStamp time) noexcept {
  TraceSection s("IntersectionObserverManager::shadowTreeDidMount");
  updateIntersectionObservations(
      rootShadowNode->getSurfaceId(), rootShadowNode.get(), time);
}

void IntersectionObserverManager::shadowTreeDidUnmount(
    SurfaceId surfaceId,
    HighResTimeStamp time) noexcept {
  TraceSection s("IntersectionObserverManager::shadowTreeDidUnmount");
  updateIntersectionObservations(surfaceId, nullptr, time);
}

#pragma mark - Private methods

void IntersectionObserverManager::updateIntersectionObservations(
    SurfaceId surfaceId,
    const RootShadowNode* rootShadowNode,
    HighResTimeStamp time) {
  std::vector<IntersectionObserverEntry> entries;

  // Run intersection observations
  {
    std::shared_lock lock(observersMutex_);

    auto observersIt = observersBySurfaceId_.find(surfaceId);
    if (observersIt == observersBySurfaceId_.end()) {
      return;
    }

    TraceSection s(
        "IntersectionObserverManager::updateIntersectionObservations(mount)",
        "observerCount",
        observersIt->second.size());

    auto& observers = observersIt->second;
    for (auto& observer : observers) {
      std::optional<IntersectionObserverEntry> entry;

      if (rootShadowNode != nullptr) {
        entry = observer->updateIntersectionObservation(*rootShadowNode, time);
      } else {
        entry = observer->updateIntersectionObservationForSurfaceUnmount(time);
      }

      if (entry) {
        entries.push_back(std::move(entry).value());
      }
    }
  }

  {
    std::unique_lock lock(pendingEntriesMutex_);
    pendingEntries_.insert(
        pendingEntries_.end(), entries.begin(), entries.end());
  }

  notifyObserversIfNecessary();
}

/**
 * This method allows us to avoid scheduling multiple calls to notify observers
 * in the JS thread. We schedule one and skip subsequent ones (we just append
 * the entries to the pending list and wait for the scheduled task to consume
 * all of them).
 */
void IntersectionObserverManager::notifyObserversIfNecessary() {
  bool dispatchNotification = false;

  {
    std::unique_lock lock(pendingEntriesMutex_);

    if (!pendingEntries_.empty() && !notifiedIntersectionObservers_) {
      notifiedIntersectionObservers_ = true;
      dispatchNotification = true;
    }
  }

  if (dispatchNotification) {
    notifyObservers();
  }
}

void IntersectionObserverManager::notifyObservers() {
  TraceSection s("IntersectionObserverManager::notifyObservers");
  notifyIntersectionObserversCallback_();
}

} // namespace facebook::react
