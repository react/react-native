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
#include <react/renderer/core/ConcreteShadowNode.h>
#include <react/renderer/core/ShadowNode.h>

#include "TestComponent.h"

using namespace facebook::react;

class ShadowNodeTest : public testing::Test {
 protected:
  ShadowNodeTest()
      : eventDispatcher_(std::shared_ptr<const EventDispatcher>()),
        componentDescriptor_(
            TestComponentDescriptor({.eventDispatcher = eventDispatcher_})) {
    /*
     * The structure:
     * <A>
     *  <AA/>
     *  <AB>
     *    <ABA/>
     *    <ABB/>
     *  </AB>
     *  <AC/>
     * </A>
     * <Z/>
     */

    auto props = std::make_shared<const TestProps>();

    auto traits = TestShadowNode::BaseTraits();

    auto familyAA = componentDescriptor_.createFamily(
        ShadowNodeFamilyFragment{
            /* .tag = */ .tag = 11,
            /* .surfaceId = */ .surfaceId = surfaceId_,
            /* .instanceHandle = */ .instanceHandle = nullptr,
        });
    nodeAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ .props = props,
            /* .children = */ .children =
                ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAA,
        traits);

    auto familyABA = componentDescriptor_.createFamily(
        ShadowNodeFamilyFragment{
            /* .tag = */ .tag = 12,
            /* .surfaceId = */ .surfaceId = surfaceId_,
            /* .instanceHandle = */ .instanceHandle = nullptr,
        });
    nodeABA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ .props = props,
            /* .children = */ .children =
                ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyABA,
        traits);

    auto familyABB = componentDescriptor_.createFamily(
        ShadowNodeFamilyFragment{
            /* .tag = */ .tag = 13,
            /* .surfaceId = */ .surfaceId = surfaceId_,
            /* .instanceHandle = */ .instanceHandle = nullptr,
        });
    nodeABB_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ .props = props,
            /* .children = */ .children =
                ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyABB,
        traits);

    auto nodeABChildren =
        std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
            std::vector<std::shared_ptr<const ShadowNode>>{nodeABA_, nodeABB_});

    auto familyAB = componentDescriptor_.createFamily(
        ShadowNodeFamilyFragment{
            /* .tag = */ .tag = 15,
            /* .surfaceId = */ .surfaceId = surfaceId_,
            /* .instanceHandle = */ .instanceHandle = nullptr,
        });
    nodeAB_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ .props = props,
            /* .children = */ .children = nodeABChildren,
        },
        familyAB,
        traits);

    auto familyAC = componentDescriptor_.createFamily(
        ShadowNodeFamilyFragment{
            /* .tag = */ .tag = 16,
            /* .surfaceId = */ .surfaceId = surfaceId_,
            /* .instanceHandle = */ .instanceHandle = nullptr,
        });
    nodeAC_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ .props = props,
            /* .children = */ .children =
                ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAC,
        traits);

    auto nodeAChildren =
        std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
            std::vector<std::shared_ptr<const ShadowNode>>{
                nodeAA_, nodeAB_, nodeAC_});

    auto familyA = componentDescriptor_.createFamily(
        ShadowNodeFamilyFragment{
            /* .tag = */ .tag = 17,
            /* .surfaceId = */ .surfaceId = surfaceId_,
            /* .instanceHandle = */ .instanceHandle = nullptr,
        });
    nodeA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ .props = props,
            /* .children = */ .children = nodeAChildren,
        },
        familyA,
        traits);

    auto familyZ = componentDescriptor_.createFamily(
        ShadowNodeFamilyFragment{
            /* .tag = */ .tag = 18,
            /* .surfaceId = */ .surfaceId = surfaceId_,
            /* .instanceHandle = */ .instanceHandle = nullptr,
        });
    nodeZ_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ .props = props,
            /* .children = */ .children =
                ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyZ,
        traits);

    ReactNativeFeatureFlags::dangerouslyReset();
  }

  void SetUp() override {
    ShadowNode::setUseRuntimeShadowNodeReferenceUpdateOnThread(true);
  }

  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  std::shared_ptr<const EventDispatcher> eventDispatcher_;
  std::shared_ptr<TestShadowNode> nodeA_;
  std::shared_ptr<TestShadowNode> nodeAA_;
  std::shared_ptr<TestShadowNode> nodeABA_;
  std::shared_ptr<TestShadowNode> nodeABB_;
  std::shared_ptr<TestShadowNode> nodeAB_;
  std::shared_ptr<TestShadowNode> nodeAC_;
  std::shared_ptr<TestShadowNode> nodeZ_;
  TestComponentDescriptor componentDescriptor_;

  SurfaceId surfaceId_ = 1;
};

TEST_F(ShadowNodeTest, handleShadowNodeCreation) {
  EXPECT_FALSE(nodeZ_->getSealed());
  EXPECT_STREQ(nodeZ_->getComponentName(), "Test");
  EXPECT_EQ(nodeZ_->getTag(), 18);
  EXPECT_EQ(nodeZ_->getSurfaceId(), surfaceId_);
  EXPECT_NE(nodeZ_->getEventEmitter(), nullptr);
  EXPECT_EQ(nodeZ_->getChildren().size(), 0);
}

TEST_F(ShadowNodeTest, handleSealRecusive) {
  nodeZ_->sealRecursive();
  EXPECT_TRUE(nodeZ_->getSealed());
  EXPECT_TRUE(nodeZ_->getProps()->getSealed());
}

TEST_F(ShadowNodeTest, handleShadowNodeSimpleCloning) {
  auto nodeARevision2 =
      std::make_shared<TestShadowNode>(*nodeA_, ShadowNodeFragment{});

  EXPECT_STREQ(nodeA_->getComponentName(), nodeARevision2->getComponentName());
  EXPECT_EQ(nodeA_->getTag(), nodeARevision2->getTag());
  EXPECT_EQ(nodeA_->getSurfaceId(), nodeARevision2->getSurfaceId());
  EXPECT_EQ(nodeA_->getEventEmitter(), nodeARevision2->getEventEmitter());
}

TEST_F(ShadowNodeTest, handleShadowNodeMutation) {
  auto nodeABChildren = nodeAB_->getChildren();
  EXPECT_EQ(nodeABChildren.size(), 2);
  EXPECT_EQ(nodeABChildren.at(0), nodeABA_);
  EXPECT_EQ(nodeABChildren.at(1), nodeABB_);

  auto nodeABArevision2 =
      std::make_shared<TestShadowNode>(*nodeABA_, ShadowNodeFragment{});
  nodeAB_->replaceChild(*nodeABA_, nodeABArevision2);
  nodeABChildren = nodeAB_->getChildren();
  EXPECT_EQ(nodeABChildren.size(), 2);
  EXPECT_EQ(nodeABChildren.at(0), nodeABArevision2);
  EXPECT_EQ(nodeABChildren.at(1), nodeABB_);

  // Seal the entire tree.
  nodeAB_->sealRecursive();
  EXPECT_TRUE(nodeAB_->getSealed());
  EXPECT_TRUE(nodeABArevision2->getSealed());
  EXPECT_TRUE(nodeABB_->getSealed());
}

TEST_F(ShadowNodeTest, handleCloneFunction) {
  auto nodeABClone = nodeAB_->clone({});

  // Those two nodes are *not* same.
  EXPECT_NE(nodeAB_, nodeABClone);

#ifndef ANDROID
  // `secondNodeClone` is an instance of `TestShadowNode`.
  EXPECT_NE(
      std::dynamic_pointer_cast<const TestShadowNode>(nodeABClone), nullptr);
#endif

  // Both nodes have same content.
  EXPECT_EQ(nodeAB_->getTag(), nodeABClone->getTag());
  EXPECT_EQ(nodeAB_->getSurfaceId(), nodeABClone->getSurfaceId());
  EXPECT_EQ(nodeAB_->getProps(), nodeABClone->getProps());
}

TEST_F(ShadowNodeTest, handleState) {
  auto family = componentDescriptor_.createFamily(
      ShadowNodeFamilyFragment{
          /* .tag = */ .tag = 9,
          /* .surfaceId = */ .surfaceId = surfaceId_,
          /* .instanceHandle = */ .instanceHandle = nullptr,
      });

  auto traits = TestShadowNode::BaseTraits();

  auto props = std::make_shared<const TestProps>();

  const auto initialState =
      componentDescriptor_.createInitialState(props, family);

  auto firstNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{/* .props = */ .props = props,
                         /* .children = */ .children =
                             ShadowNode::emptySharedShadowNodeSharedList(),
                         /* .state = */ .state = initialState},
      family,
      traits);
  auto secondNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{/* .props = */ .props = props,
                         /* .children = */ .children =
                             ShadowNode::emptySharedShadowNodeSharedList(),
                         /* .state = */ .state = initialState},
      family,
      traits);
  auto thirdNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{/* .props = */ .props = props,
                         /* .children = */ .children =
                             ShadowNode::emptySharedShadowNodeSharedList(),
                         /* .state = */ .state = initialState},
      family,
      traits);

  TestShadowNode::ConcreteState::Shared _state =
      std::static_pointer_cast<const TestShadowNode::ConcreteState>(
          initialState);
  _state->updateState(TestState());

  thirdNode->setStateData(TestState());
  // State object are compared by pointer, not by value.
  EXPECT_EQ(firstNode->getState(), secondNode->getState());
  EXPECT_NE(firstNode->getState(), thirdNode->getState());
  secondNode->setStateData(TestState());
  EXPECT_NE(firstNode->getState(), secondNode->getState());

  // State cannot be changed for sealed shadow node.
  secondNode->sealRecursive();
  EXPECT_DEATH_IF_SUPPORTED(
      { secondNode->setStateData(TestState()); },
      "Attempt to mutate a sealed object.");
}

TEST_F(ShadowNodeTest, handleRuntimeReferenceTransferOnClone) {
  auto nodeABRev1 = nodeAB_->clone({});
  auto wrappedShadowNode = std::make_shared<ShadowNodeWrapper>(nodeABRev1);
  nodeABRev1->setRuntimeShadowNodeReference(wrappedShadowNode);

  auto nodeABRev2 = nodeABRev1->clone({});

  // The wrappedShadowNode should reference the new latest clone
  EXPECT_EQ(wrappedShadowNode->shadowNode, nodeABRev2);

  auto nodeABRev3 = componentDescriptor_.cloneShadowNode(
      *nodeABRev2, {.runtimeShadowNodeReference = false});

  // The wrappedShadowNode should still reference nodeABRev2
  EXPECT_EQ(wrappedShadowNode->shadowNode, nodeABRev2);
}

TEST_F(ShadowNodeTest, cloneMultiple) {
  auto newProps = std::make_shared<const TestProps>();
  auto newRoot = nodeA_->cloneMultiple(
      {nodeA_->getFamilyShared(), nodeAB_->getFamilyShared()},
      [&](const ShadowNode& oldShadowNode, const ShadowNodeFragment& fragment) {
        return oldShadowNode.clone({
            .props = newProps,
            .children = fragment.children,
            .state = fragment.state,
        });
      });

  EXPECT_EQ(newRoot->getTag(), nodeA_->getTag());
  EXPECT_EQ(newRoot->getProps(), newProps);

  auto newNodeAA = newRoot->getChildren()[0];
  EXPECT_EQ(newNodeAA->getTag(), nodeAA_->getTag());
  EXPECT_EQ(newNodeAA->getProps(), nodeAA_->getProps());
  // AA was cloned when its parent was cloned as it was shared
  EXPECT_NE(newNodeAA.get(), nodeAA_.get());

  auto newNodeAB = newRoot->getChildren()[1];
  EXPECT_EQ(newNodeAB->getTag(), nodeAB_->getTag());
  EXPECT_EQ(newNodeAB->getProps(), newProps);

  auto newNodeABA = newNodeAB->getChildren()[0];
  EXPECT_EQ(newNodeABA->getTag(), nodeABA_->getTag());
  EXPECT_EQ(newNodeABA.get(), nodeABA_.get());
}

TEST_F(ShadowNodeTest, cloneMultipleWithSingleFamily) {
  auto newProps = std::make_shared<const TestProps>();
  auto newRoot = nodeA_->cloneMultiple(
      {nodeAB_->getFamilyShared()},
      [&](const ShadowNode& oldShadowNode, const ShadowNodeFragment& fragment) {
        return oldShadowNode.clone({
            .props = newProps,
            .children = fragment.children,
            .state = fragment.state,
        });
      });

  EXPECT_EQ(newRoot->getTag(), nodeA_->getTag());
  // The callback is called for each cloned node, so the root props are also
  // updated
  EXPECT_EQ(newRoot->getProps(), newProps);

  auto newNodeAA = newRoot->getChildren()[0];
  EXPECT_EQ(newNodeAA->getTag(), nodeAA_->getTag());
  EXPECT_EQ(newNodeAA->getProps(), nodeAA_->getProps());
  // AA was cloned when its parent was cloned as it was shared
  EXPECT_NE(newNodeAA.get(), nodeAA_.get());

  auto newNodeAB = newRoot->getChildren()[1];
  EXPECT_EQ(newNodeAB->getTag(), nodeAB_->getTag());
  EXPECT_EQ(newNodeAB->getProps(), newProps);

  auto newNodeABA = newNodeAB->getChildren()[0];
  EXPECT_EQ(newNodeABA->getTag(), nodeABA_->getTag());
  EXPECT_EQ(newNodeABA.get(), nodeABA_.get());
}

TEST_F(ShadowNodeTest, cloneMultipleReturnsNullptrWhenFamilyHasNoPathToRoot) {
  auto newProps = std::make_shared<const TestProps>();
  // nodeZ_ is not part of nodeA_'s tree
  auto result = nodeA_->cloneMultiple(
      {nodeZ_->getFamilyShared()},
      [&](const ShadowNode& oldShadowNode, const ShadowNodeFragment& fragment) {
        return oldShadowNode.clone({
            .props = newProps,
            .children = fragment.children,
            .state = fragment.state,
        });
      });

  // cloneMultiple should return nullptr when the family has no path to the root
  EXPECT_EQ(result, nullptr);
}

TEST_F(ShadowNodeTest, cloneMultipleWithMixOfValidAndInvalidFamilies) {
  auto newProps = std::make_shared<const TestProps>();
  // nodeAB_ is in the tree, nodeZ_ is not
  auto result = nodeA_->cloneMultiple(
      {nodeAB_->getFamilyShared(), nodeZ_->getFamilyShared()},
      [&](const ShadowNode& oldShadowNode, const ShadowNodeFragment& fragment) {
        return oldShadowNode.clone({
            .props = newProps,
            .children = fragment.children,
            .state = fragment.state,
        });
      });

  // Should still succeed and clone the valid family (nodeAB_)
  EXPECT_NE(result, nullptr);
  EXPECT_EQ(result->getTag(), nodeA_->getTag());
  EXPECT_EQ(result->getProps(), newProps);

  auto newNodeAB = result->getChildren()[1];
  EXPECT_EQ(newNodeAB->getTag(), nodeAB_->getTag());
  EXPECT_EQ(newNodeAB->getProps(), newProps);
}

TEST_F(ShadowNodeTest, cloneMultipleWithEmptyFamilySet) {
  auto newProps = std::make_shared<const TestProps>();
  auto result = nodeA_->cloneMultiple(
      {},
      [&](const ShadowNode& oldShadowNode, const ShadowNodeFragment& fragment) {
        return oldShadowNode.clone({
            .props = newProps,
            .children = fragment.children,
            .state = fragment.state,
        });
      });

  EXPECT_EQ(result, nullptr);
}
