/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <optional>

namespace facebook::react {

class Scheduler;
class NativeAnimatedNodesManager;

class AnimatedMountingOverrideDelegate : public MountingOverrideDelegate {
 public:
  AnimatedMountingOverrideDelegate(NativeAnimatedNodesManager &animatedManager, const Scheduler &scheduler);

  bool shouldOverridePullTransaction() const override;

  std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number transactionNumber,
      const TransactionTelemetry &telemetry,
      ShadowViewMutationList mutations) const override;

 private:
  mutable NativeAnimatedNodesManager *animatedManager_;

  const Scheduler *scheduler_;
};

} // namespace facebook::react
