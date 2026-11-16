/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountingCoordinator.h"

#include <cxxreact/TraceSection.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/utils/LowPriorityExecutor.h>
#include <condition_variable>
#include "updateMountedFlag.h"

#ifdef RN_SHADOW_TREE_INTROSPECTION
#include <glog/logging.h>
#include <sstream>
#endif

namespace facebook::react {

MountingCoordinator::MountingCoordinator(const ShadowTreeRevision& baseRevision)
    : surfaceId_(baseRevision.rootShadowNode->getSurfaceId()),
      baseRevision_(baseRevision),
      telemetryController_(*this) {
#ifdef RN_SHADOW_TREE_INTROSPECTION
  stubViewTree_ = buildStubViewTreeWithoutUsingDifferentiator(
      *baseRevision_.rootShadowNode);
#endif
}

SurfaceId MountingCoordinator::getSurfaceId() const {
  return surfaceId_;
}

void MountingCoordinator::push(ShadowTreeRevision revision) const {
  {
    std::scoped_lock lock(mutex_);

    // ShadowTree releases its commit lock before pushing. Another thread may
    // already have diffed a newer revision, even when lastRevision_ is empty.
    // Never recreate removed views by diffing backwards from that newer base.
    if (revision.number < baseRevision_.number) {
      return;
    }

    react_native_assert(
        !lastRevision_.has_value() || revision.number != lastRevision_->number);

    if (!lastRevision_.has_value() || lastRevision_->number < revision.number) {
      lastRevision_ = std::move(revision);
    }
  }

  signal_.notify_all();
}

void MountingCoordinator::revoke() const {
  std::scoped_lock lock(mutex_);
  // We have two goals here.
  // 1. We need to stop retaining `ShadowNode`s to not prolong their lifetime
  // to prevent them from overliving `ComponentDescriptor`s.
  // 2. A possible call to `pullTransaction()` should return empty optional.
  baseRevision_.rootShadowNode.reset();
  lastRevision_.reset();
}

bool MountingCoordinator::waitForTransaction(
    std::chrono::duration<double> timeout) const {
  std::unique_lock<std::mutex> lock(mutex_);
  return signal_.wait_for(
      lock, timeout, [this]() { return lastRevision_.has_value(); });
}

std::optional<MountingTransaction> MountingCoordinator::pullTransaction(
    bool willPerformAsynchronously) const {
  TraceSection section("MountingCoordinator::pullTransaction");

  std::scoped_lock lock(mutex_);

  auto transaction = std::optional<MountingTransaction>{};

  // Base case
  if (lastRevision_.has_value()) {
    number_++;

    auto telemetry = lastRevision_->telemetry;

    telemetry.willDiff();

    auto mutations = calculateShadowViewMutations(
        *baseRevision_.rootShadowNode, *lastRevision_->rootShadowNode);

    telemetry.didDiff();

    transaction = MountingTransaction{
        surfaceId_, number_, std::move(mutations), telemetry};
  }

  // Override case
#ifdef RN_SHADOW_TREE_INTROSPECTION
  bool didOverridePullTransaction = false;
#endif
  for (const auto& delegate : mountingOverrideDelegates_) {
    auto mountingOverrideDelegate = delegate.lock();
    auto shouldOverridePullTransaction = mountingOverrideDelegate &&
        mountingOverrideDelegate->shouldOverridePullTransaction();

    if (shouldOverridePullTransaction) {
      TraceSection section2("MountingCoordinator::overridePullTransaction");

      auto mutations = ShadowViewMutation::List{};
      auto telemetry = TransactionTelemetry{};

      if (transaction.has_value()) {
        mutations = transaction->getMutations();
        telemetry = transaction->getTelemetry();
      } else {
        number_++;
        telemetry.willLayout();
        telemetry.didLayout();
        telemetry.willCommit();
        telemetry.didCommit();
        telemetry.willDiff();
        telemetry.didDiff();
      }

      transaction = mountingOverrideDelegate->pullTransaction(
          surfaceId_, number_, telemetry, std::move(mutations));
#ifdef RN_SHADOW_TREE_INTROSPECTION
      didOverridePullTransaction = true;
#endif
    }
  }

#ifdef RN_SHADOW_TREE_INTROSPECTION
  if (transaction.has_value()) {
    TraceSection section2("MountingCoordinator::verifyMutationsForDebugging");

    // We have something to validate.
    auto mutations = transaction->getMutations();

    // No matter what the source of the transaction is, it must be able to
    // mutate the existing stub view tree.
    stubViewTree_.mutate(mutations);

    // If the transaction was overridden, we don't have a model of the shadow
    // tree therefore we cannot validate the validity of the mutation
    // instructions.
    if (!didOverridePullTransaction && lastRevision_.has_value()) {
      auto stubViewTree = buildStubViewTreeWithoutUsingDifferentiator(
          *lastRevision_->rootShadowNode);

      bool treesEqual = stubViewTree_ == stubViewTree;

      if (!treesEqual) {
        // Display debug info
        auto line = std::string{};
        std::stringstream ssOldTree(
            baseRevision_.rootShadowNode->getDebugDescription());
        while (std::getline(ssOldTree, line, '\n')) {
          LOG(ERROR) << "Old tree:" << line;
        }

        std::stringstream ssMutations(getDebugDescription(mutations, {}));
        while (std::getline(ssMutations, line, '\n')) {
          LOG(ERROR) << "Mutations:" << line;
        }

        std::stringstream ssNewTree(
            lastRevision_->rootShadowNode->getDebugDescription());
        while (std::getline(ssNewTree, line, '\n')) {
          LOG(ERROR) << "New tree:" << line;
        }
      }

      react_native_assert(
          (treesEqual) && "Incorrect set of mutations detected.");
    }
  }
#endif

  if (lastRevision_.has_value()) {
    if (ReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync()) {
      LowPriorityExecutor::execute([toDelete = std::move(baseRevision_)]() {});
    }
    baseRevision_ = std::move(*lastRevision_);
    lastRevision_.reset();

    hasPendingTransactionsOverride_ = willPerformAsynchronously;
  }
  return transaction;
}

bool MountingCoordinator::hasPendingTransactions() const {
  std::scoped_lock lock(mutex_);
  return lastRevision_.has_value() || hasPendingTransactionsOverride_;
}

void MountingCoordinator::didPerformAsyncTransactions() const {
  std::scoped_lock lock(mutex_);
  hasPendingTransactionsOverride_ = false;
}

const TelemetryController& MountingCoordinator::getTelemetryController() const {
  return telemetryController_;
}

ShadowTreeRevision MountingCoordinator::getBaseRevision() const {
  std::scoped_lock lock(mutex_);
  return baseRevision_;
}

void MountingCoordinator::setMountingOverrideDelegate(
    std::weak_ptr<const MountingOverrideDelegate> delegate) const {
  std::scoped_lock lock(mutex_);
  mountingOverrideDelegates_.insert(
      mountingOverrideDelegates_.end(), std::move(delegate));
}

} // namespace facebook::react
