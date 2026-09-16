/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>

namespace facebook::react {

/*
 * Represent a particular committed state of a shadow tree. The object contains
 * a pointer to a root shadow node, a sequential number of commit and telemetry.
 */
class ShadowTreeRevision final {
 public:
  /*
   * Sequential number of the commit that created this revision of a shadow
   * tree.
   */
  using Number = int64_t;

  friend class ShadowTree;
  friend class MountingCoordinator;

  RootShadowNode::Shared rootShadowNode;
  Number number;
  TransactionTelemetry telemetry;
};

} // namespace facebook::react
