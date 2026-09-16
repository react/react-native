/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ResizeObserverManager.h"
#include <cxxreact/TraceSection.h>
#include <glog/logging.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/utils/OnScopeExit.h>
#include <algorithm>
#include <unordered_set>
#include <utility>

namespace facebook::react {

namespace {

constexpr size_t kMaxResizeObservationLoopIterations = 100;

} // namespace

ResizeObserverManager::ResizeObserverManager() = default;

void ResizeObserverManager::observe(
    ResizeObserverObserverId resizeObserverId,
    const ShadowNodeFamily::Shared& shadowNodeFamily,
    ResizeObserverBoxOptions boxOptions) {
  TraceSection s{"ResizeObserverManager::observe"};
  auto surfaceId = shadowNodeFamily->getSurfaceId();

  // Per spec, new targets are delivered on the next "update the rendering"
  // step (`runResizeObservations`), not here. That step runs at the end of
  // every task, so the first delivery is still prompt.
  {
    std::unique_lock lock(observersMutex_);
    auto& observers = observersBySurfaceId_[surfaceId];
    observers.emplace_back(
        std::make_unique<ResizeObserver>(
            resizeObserverId,
            shadowNodeFamily,
            boxOptions,
            nextObservationSequence_++));
  }

  surfaceIdsWithPendingInitialDelivery_.insert(surfaceId);
}

void ResizeObserverManager::unobserve(
    ResizeObserverObserverId resizeObserverId,
    const ShadowNodeFamily::Shared& shadowNodeFamily) {
  TraceSection s{"ResizeObserverManager::unobserve"};
  auto surfaceId = shadowNodeFamily->getSurfaceId();

  // If another observer still targets this family, keep its dirty state.
  auto familyStillObserved = false;
  {
    std::unique_lock lock(observersMutex_);
    auto observersIt = observersBySurfaceId_.find(surfaceId);
    if (observersIt == observersBySurfaceId_.end()) {
      return;
    }

    auto& observers = observersIt->second;
    observers.erase(
        std::remove_if(
            observers.begin(),
            observers.end(),
            [resizeObserverId, &shadowNodeFamily](const auto& observer) {
              return observer->getResizeObserverId() == resizeObserverId &&
                  observer->getTargetShadowNodeFamily() == shadowNodeFamily;
            }),
        observers.end());

    for (const auto& observer : observers) {
      if (observer->getTargetShadowNodeFamily() == shadowNodeFamily) {
        familyStillObserved = true;
        break;
      }
    }

    if (observers.empty()) {
      observersBySurfaceId_.erase(surfaceId);
      surfaceIdsWithPendingInitialDelivery_.erase(surfaceId);
    }
  }

  // Clean up the removed observation to avoid a wasted pass, a stale entry, or
  // a dangling family pointer. Only clear the dirty family if no other
  // observer targets it.
  if (!familyStillObserved) {
    std::unique_lock lock(dirtyFamiliesMutex_);
    auto dirtyFamiliesIt = dirtyFamiliesBySurfaceId_.find(surfaceId);
    if (dirtyFamiliesIt != dirtyFamiliesBySurfaceId_.end()) {
      dirtyFamiliesIt->second.erase(shadowNodeFamily.get());
      if (dirtyFamiliesIt->second.empty()) {
        dirtyFamiliesBySurfaceId_.erase(dirtyFamiliesIt);
      }
    }
  }

  {
    std::unique_lock lock(pendingEntriesMutex_);
    pendingEntries_.erase(
        std::remove_if(
            pendingEntries_.begin(),
            pendingEntries_.end(),
            [resizeObserverId, &shadowNodeFamily](const auto& entry) {
              return entry.resizeObserverId == resizeObserverId &&
                  entry.shadowNodeFamily == shadowNodeFamily;
            }),
        pendingEntries_.end());
  }
}

void ResizeObserverManager::connect(
    RuntimeScheduler& runtimeScheduler,
    UIManager& uiManager,
    std::function<void(jsi::Runtime&, bool)> notifyResizeObserversFunction) {
  TraceSection s{"ResizeObserverManager::connect"};

  // Fail-safe in case the caller doesn't guarantee consistency.
  if (commitHookRegistered_) {
    return;
  }

  notifyResizeObserversFunction_ = std::move(notifyResizeObserversFunction);

  runtimeScheduler.setResizeObserverDelegate(this);
  uiManager.registerCommitHook(*this);
  shadowTreeRegistry_ = &uiManager.getShadowTreeRegistry();
  commitHookRegistered_ = true;
}

void ResizeObserverManager::disconnect(
    RuntimeScheduler& runtimeScheduler,
    UIManager& uiManager) {
  TraceSection s{"ResizeObserverManager::disconnect"};

  // Fail-safe in case the caller doesn't guarantee consistency.
  if (!commitHookRegistered_) {
    return;
  }

  runtimeScheduler.setResizeObserverDelegate(nullptr);
  uiManager.unregisterCommitHook(*this);
  shadowTreeRegistry_ = nullptr;

  // May run from inside `broadcastActiveResizeObservations` (a callback can
  // disconnect the last observer), which copies the callable before invoking
  // it, so clearing it here can't destroy the function we're executing.
  notifyResizeObserversFunction_ = nullptr;
  commitHookRegistered_ = false;

  // Nothing can consume any of this anymore; don't leak it into a later
  // `connect`.
  {
    std::unique_lock lock(observersMutex_);
    observersBySurfaceId_.clear();
  }
  {
    std::unique_lock lock(dirtyFamiliesMutex_);
    dirtyFamiliesBySurfaceId_.clear();
    committedSurfaceIds_.clear();
  }
  surfaceIdsWithPendingInitialDelivery_.clear();

  {
    std::unique_lock lock(pendingEntriesMutex_);
    pendingEntries_.clear();
  }
}

std::vector<ResizeObserverEntry> ResizeObserverManager::takeRecords() {
  std::unique_lock lock(pendingEntriesMutex_);

  std::vector<ResizeObserverEntry> entries;
  pendingEntries_.swap(entries);
  return entries;
}

#pragma mark - UIManagerCommitHook

void ResizeObserverManager::commitHookWasRegistered(
    const UIManager& /*uiManager*/) noexcept {}
void ResizeObserverManager::commitHookWasUnregistered(
    const UIManager& /*uiManager*/) noexcept {}

void ResizeObserverManager::shadowTreeDidCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& /*rootShadowNode*/,
    const std::vector<const LayoutableShadowNode*>&
        affectedLayoutableNodes) noexcept {
  TraceSection s{"ResizeObserverManager::shadowTreeDidCommit"};

  // Runs on the commit hook (any thread), so it only collects which observed
  // targets went dirty; it must not compute observations or notify JS.
  // `runResizeObservations` (JS thread) does that against the latest tree.
  auto surfaceId = shadowTree.getSurfaceId();

  std::unordered_set<const ShadowNodeFamily*> observedFamilies;
  {
    std::unique_lock lock(observersMutex_);
    auto observersIt = observersBySurfaceId_.find(surfaceId);
    if (observersIt == observersBySurfaceId_.end()) {
      // No observers for this surface.
      return;
    }

    observedFamilies.reserve(observersIt->second.size());
    for (auto& observer : observersIt->second) {
      observedFamilies.insert(observer->getTargetShadowNodeFamily().get());
    }
  }

  std::unordered_set<const ShadowNodeFamily*> newlyDirtyFamilies;
  for (const auto* node : affectedLayoutableNodes) {
    const auto* family = &node->getFamily();
    if (observedFamilies.contains(family)) {
      newlyDirtyFamilies.insert(family);
    }
  }

  std::unique_lock lock(dirtyFamiliesMutex_);
  // Record the commit even with no dirty family, so `runResizeObservations`
  // re-checks for removed targets (they aren't in `affectedLayoutableNodes`).
  committedSurfaceIds_.insert(surfaceId);
  if (!newlyDirtyFamilies.empty()) {
    auto& dirtyFamilies = dirtyFamiliesBySurfaceId_[surfaceId];
    dirtyFamilies.insert(newlyDirtyFamilies.begin(), newlyDirtyFamilies.end());
  }
}

#pragma mark - RuntimeSchedulerResizeObserverDelegate

void ResizeObserverManager::runResizeObservations(jsi::Runtime& runtime) {
  TraceSection s{"ResizeObserverManager::runResizeObservations"};

  // The broadcast below runs JS, which may commit synchronously and re-enter
  // this step. Never start a nested pass: the families it dirties stay queued
  // for the next gather iteration below, not a nested `runResizeObservations`.
  if (isRunningResizeObservations_) {
    return;
  }
  isRunningResizeObservations_ = true;
  OnScopeExit resetIsRunningResizeObservations{
      [&]() { isRunningResizeObservations_ = false; }};

  size_t depth{0};
  size_t iteration{0};
  auto hasSkippedObservations = false;

  // Bounded by construction: `depth` strictly increases each round, so this
  // runs at most as many times as the tree is deep. The hard cap turns a
  // future bug into a log line instead of a frozen app.
  while (true) {
    if (++iteration > kMaxResizeObservationLoopIterations) {
      LOG(WARNING)
          << "ResizeObserverManager: resize observation loop hit iteration cap";
      // Treat as undelivered notifications so JS reports the spec loop error.
      hasSkippedObservations = true;
      break;
    }

    auto gathered = gatherActiveResizeObservations(depth);
    hasSkippedObservations =
        hasSkippedObservations || gathered.hasSkippedObservations;

    if (gathered.activeObservations.empty()) {
      break;
    }

    auto shallowest =
        broadcastActiveResizeObservations(runtime, gathered.activeObservations);
    if (!shallowest.has_value()) {
      break;
    }

    depth = shallowest.value();
  }

  // https://w3c.github.io/csswg-drafts/resize-observer/#deliver-resize-loop-error
  if (hasSkippedObservations) {
    notifyResizeObservers(runtime, true);
  }
}

#pragma mark - Private methods

ResizeObserverManager::GatherResult
ResizeObserverManager::gatherActiveResizeObservations(size_t depth) {
  TraceSection s{"ResizeObserverManager::gatherActiveResizeObservations"};

  // Drain what the commit hook collected since the last gather. This must run
  // every loop iteration so a callback's synchronous commit is visible to the
  // next round.
  std::unordered_map<SurfaceId, std::unordered_set<const ShadowNodeFamily*>>
      dirtyFamiliesBySurfaceId;
  std::unordered_set<SurfaceId> committedSurfaceIds;
  {
    std::unique_lock lock(dirtyFamiliesMutex_);
    dirtyFamiliesBySurfaceId.swap(dirtyFamiliesBySurfaceId_);
    committedSurfaceIds.swap(committedSurfaceIds_);
  }

  // A surface is relevant if it committed (layout changes or removals) or has
  // an observer awaiting first delivery. Sourcing the latter from the pending
  // set lets a quiet tick skip scanning all observers.
  std::unordered_set<SurfaceId> candidateSurfaceIds(committedSurfaceIds);
  candidateSurfaceIds.insert(
      surfaceIdsWithPendingInitialDelivery_.begin(),
      surfaceIdsWithPendingInitialDelivery_.end());

  GatherResult gatherResult;

  // Null once `disconnect` ran; nothing left to observe against.
  if (candidateSurfaceIds.empty() || shadowTreeRegistry_ == nullptr) {
    return gatherResult;
  }

  for (auto surfaceId : candidateSurfaceIds) {
    auto rootShadowNode = std::shared_ptr<const RootShadowNode>();
    shadowTreeRegistry_->visit(surfaceId, [&](const auto& shadowTree) {
      rootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
    });

    if (rootShadowNode == nullptr) {
      // The surface was stopped, so its families are dead and can never report
      // again. Drop the bookkeeping instead of rescanning it on every tick.
      std::unique_lock lock(observersMutex_);
      observersBySurfaceId_.erase(surfaceId);
      surfaceIdsWithPendingInitialDelivery_.erase(surfaceId);
      continue;
    }

    auto dirtyFamiliesIt = dirtyFamiliesBySurfaceId.find(surfaceId);
    const auto* dirtyFamilies =
        dirtyFamiliesIt != dirtyFamiliesBySurfaceId.end()
        ? &dirtyFamiliesIt->second
        : nullptr;

    auto surfaceCommitted = committedSurfaceIds.contains(surfaceId);

    std::unique_lock lock(observersMutex_);
    auto observersIt = observersBySurfaceId_.find(surfaceId);
    if (observersIt == observersBySurfaceId_.end()) {
      continue;
    }

    // Whether an observer here still awaits first delivery after this pass
    // (e.g. reset because it has no reportable size), so the surface stays
    // pending.
    auto stillNeedsInitialDelivery = false;

    for (auto& observer : observersIt->second) {
      // Identity comparison only; see `dirtyFamiliesBySurfaceId_`.
      auto wasAffected = dirtyFamilies != nullptr &&
          dirtyFamilies->contains(observer->getTargetShadowNodeFamily().get());

      // Re-check delivered observations on any commit to catch targets that
      // left the tree (removals aren't dirty families) and send their final
      // 0x0. Skip ones already settled as detached - reinsertion comes via the
      // dirty path.
      auto maybeDetached = surfaceCommitted &&
          !observer->needsInitialDeliveryCheck() &&
          !observer->hasDeliveredDetachedState();

      // Recompute only observers that were affected, still need first
      // delivery, or may have just detached.
      if (!wasAffected && !observer->needsInitialDeliveryCheck() &&
          !maybeDetached) {
        continue;
      }

      auto result = observer->computeActiveObservation(*rootShadowNode);
      if (!result.entry.has_value()) {
        // Nothing to deliver, so record whether the target is in the tree now.
        // Otherwise a detached target whose final 0x0 was suppressed as a
        // duplicate keeps `maybeDetached` true and is recomputed forever.
        observer->updateDetachedState(result.detached);
        stillNeedsInitialDelivery =
            stillNeedsInitialDelivery || observer->needsInitialDeliveryCheck();
        continue;
      }

      if (result.targetDepth > depth) {
        gatherResult.activeObservations.push_back(
            ActiveObservation{
                .observer = observer.get(), .result = std::move(result)});
      } else {
        // Too shallow for this round. It keeps its state, so it stays active
        // and is delivered the next time this surface is gathered.
        gatherResult.hasSkippedObservations = true;
      }

      stillNeedsInitialDelivery =
          stillNeedsInitialDelivery || observer->needsInitialDeliveryCheck();
    }

    if (stillNeedsInitialDelivery) {
      surfaceIdsWithPendingInitialDelivery_.insert(surfaceId);
    } else {
      surfaceIdsWithPendingInitialDelivery_.erase(surfaceId);
    }
  }

  return gatherResult;
}

std::optional<size_t> ResizeObserverManager::broadcastActiveResizeObservations(
    jsi::Runtime& runtime,
    std::vector<ActiveObservation>& active) {
  TraceSection s{"ResizeObserverManager::broadcastActiveResizeObservations"};

  if (active.empty() || notifyResizeObserversFunction_ == nullptr) {
    return std::nullopt;
  }

  // Deliver in spec order: observers by registration, then targets by
  // `observe()` order.
  std::sort(active.begin(), active.end(), [](const auto& a, const auto& b) {
    if (a.observer->getResizeObserverId() !=
        b.observer->getResizeObserverId()) {
      return a.observer->getResizeObserverId() <
          b.observer->getResizeObserverId();
    }
    return a.observer->getObservationSequence() <
        b.observer->getObservationSequence();
  });

  std::optional<size_t> shallowestDepth;
  {
    std::unique_lock lock(pendingEntriesMutex_);
    pendingEntries_.reserve(pendingEntries_.size() + active.size());
    for (auto& observation : active) {
      observation.observer->markAsReported(observation.result);
      shallowestDepth = shallowestDepth.has_value()
          ? std::min(shallowestDepth.value(), observation.result.targetDepth)
          : observation.result.targetDepth;
      pendingEntries_.push_back(std::move(*observation.result.entry));
    }
  }

  if (!notifyResizeObservers(runtime, false)) {
    return std::nullopt;
  }

  return shallowestDepth;
}

bool ResizeObserverManager::notifyResizeObservers(
    jsi::Runtime& runtime,
    bool hasResizeLoopError) {
  // Copy the callable: the notification runs JS, and a callback may
  // `disconnect()` the last observer, which clears the member while we are
  // still executing it.
  auto notifyResizeObserversFunction = notifyResizeObserversFunction_;
  if (notifyResizeObserversFunction == nullptr) {
    return false;
  }

  // No lock may be held here. JS pulls the entries with `takeRecords` and the
  // callbacks it then invokes can re-enter `observe`/`unobserve`/`disconnect`,
  // or commit synchronously (which re-enters the commit hook on this thread).
  notifyResizeObserversFunction(runtime, hasResizeLoopError);
  return true;
}

} // namespace facebook::react
