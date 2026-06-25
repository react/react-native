/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeRegistry.h>
#include <react/renderer/uimanager/consistency/LazyShadowTreeRevisionConsistencyManager.h>

namespace facebook::react {

class FakeShadowTreeDelegate : public ShadowTreeDelegate {
 public:
  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& /*shadowTree*/,
      const std::shared_ptr<const RootShadowNode>& /*oldRootShadowNode*/,
      const RootShadowNode::Unshared& newRootShadowNode,
      const ShadowTree::CommitOptions& /*commitOptions*/) const override {
    return newRootShadowNode;
  }

  void shadowTreeDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> mountingCoordinator,
      bool /*mountSynchronously*/) const override {}

  void shadowTreeDidFinishReactCommit(
      const ShadowTree& /*shadowTree*/) const override {}

  void shadowTreeDidPromoteReactRevision(
      const ShadowTree& /*shadowTree*/) const override {}
};

class LazyShadowTreeRevisionConsistencyManagerTest : public ::testing::Test {
 public:
  LazyShadowTreeRevisionConsistencyManagerTest()
      : consistencyManager_(shadowTreeRegistry_) {}

  void TearDown() override {
    // this is necessary because otherwise the test will crash with an assertion
    // preventing the deallocation of the registry with registered shadow trees.
    auto ids = std::vector<SurfaceId>();

    shadowTreeRegistry_.enumerate(
        [&ids](const ShadowTree& shadowTree, bool& /*stop*/) {
          ids.push_back(shadowTree.getSurfaceId());
        });

    for (auto id : ids) {
      shadowTreeRegistry_.remove(id);
    }
  }

  std::unique_ptr<ShadowTree> createShadowTree(SurfaceId surfaceId) {
    return std::make_unique<ShadowTree>(
        surfaceId,
        layoutConstraints_,
        layoutContext_,
        shadowTreeDelegate_,
        contextContainer_);
  }

  ShadowTreeRegistry shadowTreeRegistry_{};
  LazyShadowTreeRevisionConsistencyManager consistencyManager_;

  LayoutConstraints layoutConstraints_{};
  LayoutContext layoutContext_{};
  FakeShadowTreeDelegate shadowTreeDelegate_{};
  ContextContainer contextContainer_{};
};

TEST_F(LazyShadowTreeRevisionConsistencyManagerTest, testLockedOnNoRevision) {
  consistencyManager_.lockRevisions();

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  shadowTreeRegistry_.add(createShadowTree(0));

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  consistencyManager_.unlockRevisions();
}

TEST_F(LazyShadowTreeRevisionConsistencyManagerTest, testNotLocked) {
  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  shadowTreeRegistry_.add(createShadowTree(0));

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), newRootShadowNode);
}

TEST_F(
    LazyShadowTreeRevisionConsistencyManagerTest,
    testLockedOnNoRevisionWithUpdate) {
  consistencyManager_.lockRevisions();

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  shadowTreeRegistry_.add(createShadowTree(0));

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  consistencyManager_.updateCurrentRevision(0);

  EXPECT_NE(consistencyManager_.getCurrentRevision(0), nullptr);
  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());

  consistencyManager_.unlockRevisions();
}

TEST_F(
    LazyShadowTreeRevisionConsistencyManagerTest,
    testLockedOnNoRevisionWithMultipleUpdates) {
  consistencyManager_.lockRevisions();

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  shadowTreeRegistry_.add(createShadowTree(0));

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  consistencyManager_.updateCurrentRevision(0);

  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());

  auto newRootShadowNode2 = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode2](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode2;
            },
            {});
      });

  consistencyManager_.updateCurrentRevision(0);

  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(),
      newRootShadowNode2.get());

  consistencyManager_.unlockRevisions();
}

TEST_F(
    LazyShadowTreeRevisionConsistencyManagerTest,
    testLockedOnExistingRevision) {
  shadowTreeRegistry_.add(createShadowTree(0));

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  consistencyManager_.lockRevisions();

  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());

  consistencyManager_.unlockRevisions();
}

TEST_F(
    LazyShadowTreeRevisionConsistencyManagerTest,
    testLockedOnExistingRevisionWithUpdates) {
  shadowTreeRegistry_.add(createShadowTree(0));

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  consistencyManager_.lockRevisions();

  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());

  auto newRootShadowNode2 = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode2](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode2;
            },
            {});
      });

  // Not updated
  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());

  consistencyManager_.updateCurrentRevision(0);

  // Updated
  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(),
      newRootShadowNode2.get());

  consistencyManager_.unlockRevisions();
}

TEST_F(LazyShadowTreeRevisionConsistencyManagerTest, testLockAfterUnlock) {
  shadowTreeRegistry_.add(createShadowTree(0));

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  consistencyManager_.lockRevisions();

  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());

  auto newRootShadowNode2 = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode2](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode2;
            },
            {});
      });

  // Not updated
  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());

  consistencyManager_.unlockRevisions();

  consistencyManager_.lockRevisions();

  // Updated
  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(),
      newRootShadowNode2.get());

  consistencyManager_.unlockRevisions();
}

TEST_F(LazyShadowTreeRevisionConsistencyManagerTest, testUpdateToUnmounted) {
  shadowTreeRegistry_.add(createShadowTree(0));

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  consistencyManager_.lockRevisions();

  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());

  shadowTreeRegistry_.remove(0);

  consistencyManager_.updateCurrentRevision(0);

  // Updated
  EXPECT_EQ(consistencyManager_.getCurrentRevision(0).get(), nullptr);

  consistencyManager_.unlockRevisions();
}

TEST_F(LazyShadowTreeRevisionConsistencyManagerTest, testReentrance) {
  consistencyManager_.lockRevisions();

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  shadowTreeRegistry_.add(createShadowTree(0));

  auto element = Element<RootShadowNode>();
  auto builder = simpleComponentBuilder();
  auto newRootShadowNode = builder.build(element);

  shadowTreeRegistry_.visit(
      0, [newRootShadowNode](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& /*oldRootShadowNode*/) {
              return newRootShadowNode;
            },
            {});
      });

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  // Re-entrance
  consistencyManager_.lockRevisions();

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  // Exit second lock
  consistencyManager_.unlockRevisions();

  EXPECT_EQ(consistencyManager_.getCurrentRevision(0), nullptr);

  // Exit first lock

  consistencyManager_.unlockRevisions();

  // Updated!
  EXPECT_EQ(
      consistencyManager_.getCurrentRevision(0).get(), newRootShadowNode.get());
}

} // namespace facebook::react
