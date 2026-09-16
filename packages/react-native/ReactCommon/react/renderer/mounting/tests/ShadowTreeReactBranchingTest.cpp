/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>

using namespace facebook::react;

namespace {

class BranchingEnabledFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableFabricCommitBranching() override {
    return true;
  }
};

class DummyShadowTreeDelegate : public ShadowTreeDelegate {
 public:
  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& /*shadowTree*/,
      const RootShadowNode::Shared& /*oldRootShadowNode*/,
      const RootShadowNode::Unshared& newRootShadowNode,
      const ShadowTree::CommitOptions& /*commitOptions*/) const override {
    return newRootShadowNode;
  }

  void shadowTreeDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> /*mountingCoordinator*/,
      bool /*mountSynchronously*/) const override {}

  void shadowTreeDidFinishReactCommit(
      const ShadowTree& /*shadowTree*/) const override {}

  void shadowTreeDidPromoteReactRevision(
      const ShadowTree& /*shadowTree*/) const override {}
};

} // namespace

class ShadowTreeReactBranchingTest : public ::testing::Test {
 protected:
  void SetUp() override {
    // Must override before any component construction reads a flag.
    ReactNativeFeatureFlags::dangerouslyReset();
    ReactNativeFeatureFlags::override(
        std::make_unique<BranchingEnabledFlags>());
  }

  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }
};

// Two React revisions committed before a merge share a revision number.
// Merging the first must not clear the second: the old number-based comparison
// cleared it (dropping a pending update); the fix compares root node identity.
TEST_F(ShadowTreeReactBranchingTest, mergeDoesNotDropNewerReactRevision) {
  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .children({
          Element<ViewShadowNode>()
        });
  // clang-format on

  ContextContainer contextContainer{};
  auto builder = simpleComponentBuilder();
  auto initialRootShadowNode = builder.build(element);
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};

  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  // Initial (non-React) commit establishes `currentRevision_`.
  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(initialRootShadowNode);
      },
      {.enableStateReconciliation = false});

  // First React revision (R1).
  auto rootR1 = std::static_pointer_cast<RootShadowNode>(
      initialRootShadowNode->ShadowNode::clone({}));
  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) { return rootR1; },
      {.enableStateReconciliation = false,
       .mountSynchronously = false,
       .source = ShadowTreeCommitSource::React});

  auto revisionAfterR1 = shadowTree.getCurrentReactRevision();
  ASSERT_TRUE(revisionAfterR1.has_value());

  // Promote R1 (end-of-tick), but do not merge it yet.
  shadowTree.promoteReactRevision();

  // Second React revision (R2) lands before the merge. The main revision has
  // not advanced, so R2 gets R1's revision number but is a distinct tree.
  auto rootR2 = std::static_pointer_cast<RootShadowNode>(
      initialRootShadowNode->ShadowNode::clone({}));
  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) { return rootR2; },
      {.enableStateReconciliation = false,
       .mountSynchronously = false,
       .source = ShadowTreeCommitSource::React});

  auto revisionAfterR2 = shadowTree.getCurrentReactRevision();
  ASSERT_TRUE(revisionAfterR2.has_value());

  // Precondition for the bug: same number, different revisions.
  EXPECT_EQ(revisionAfterR1->number, revisionAfterR2->number);
  EXPECT_NE(revisionAfterR2->rootShadowNode, revisionAfterR1->rootShadowNode);

  // Merging R1 must not clear R2.
  shadowTree.mergeReactRevision();

  auto revisionAfterMerge = shadowTree.getCurrentReactRevision();
  ASSERT_TRUE(revisionAfterMerge.has_value())
      << "Newer React revision (R2) was incorrectly dropped while merging R1";
  EXPECT_EQ(
      revisionAfterMerge->rootShadowNode, revisionAfterR2->rootShadowNode);
}
