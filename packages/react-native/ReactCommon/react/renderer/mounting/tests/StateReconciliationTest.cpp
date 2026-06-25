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
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>

#include <react/renderer/element/testUtils.h>

using namespace facebook::react;

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
      std::shared_ptr<const MountingCoordinator> mountingCoordinator,
      bool /*mountSynchronously*/) const override {}

  void shadowTreeDidFinishReactCommit(
      const ShadowTree& /*shadowTree*/) const override {}

  void shadowTreeDidPromoteReactRevision(
      const ShadowTree& /*shadowTree*/) const override {}
};

namespace {
const ShadowNode* findDescendantNode(
    const ShadowNode& shadowNode,
    const ShadowNodeFamily& family) {
  if (&shadowNode.getFamily() == &family) {
    return &shadowNode;
  }

  for (const auto& childNode : shadowNode.getChildren()) {
    auto descendant = findDescendantNode(*childNode, family);
    if (descendant != nullptr) {
      return descendant;
    }
  }

  return nullptr;
}

const ShadowNode* findDescendantNode(
    const ShadowTree& shadowTree,
    const ShadowNodeFamily& family) {
  return findDescendantNode(
      *shadowTree.getCurrentRevision().rootShadowNode, family);
}
} // namespace

class StateReconciliationTest : public ::testing::TestWithParam<bool> {
 public:
  StateReconciliationTest() : builder_(simpleComponentBuilder()) {}

  ComponentBuilder builder_;
};

TEST_F(StateReconciliationTest, testStateReconciliation) {
  // ==== SETUP ====

  /*
   <Root>
    <View>
      <ScrollView />
    </View>
   </Root>
  */

  auto parentShadowNode = std::shared_ptr<ViewShadowNode>{};
  auto scrollViewInitialShadowNode = std::shared_ptr<ScrollViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .children({
          Element<ViewShadowNode>()
            .reference(parentShadowNode).children({
              Element<ScrollViewShadowNode>()
                .reference(scrollViewInitialShadowNode)
            })
        });
  // clang-format on

  ContextContainer contextContainer{};

  auto initialRootShadowNode = builder_.build(element);

  auto rootShadowNodeState1 = initialRootShadowNode->ShadowNode::clone({});

  auto& scrollViewComponentDescriptor =
      scrollViewInitialShadowNode->getComponentDescriptor();
  auto& scrollViewFamily = scrollViewInitialShadowNode->getFamily();
  auto initialState = scrollViewInitialShadowNode->getState();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  // ==== INITIAL COMMIT ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState1);
      },
      {.enableStateReconciliation = true});

  EXPECT_EQ(initialState->getMostRecentState(), initialState);

  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState1, scrollViewFamily)->getState(),
      initialState);

  // ==== COMMIT with new State 2 ====

  auto state2 = scrollViewComponentDescriptor.createState(
      scrollViewFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeState2 = initialRootShadowNode->cloneTree(
      scrollViewFamily, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = state2});
      });

  EXPECT_EQ(
      findDescendantNode(*initialRootShadowNode, scrollViewFamily)->getState(),
      initialState);
  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState2, scrollViewFamily)->getState(),
      state2);

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState2);
      },
      {.enableStateReconciliation = false});

  EXPECT_EQ(initialState->getMostRecentState(), state2);
  EXPECT_EQ(state2->getMostRecentState(), state2);

  // ==== COMMIT with new State 3 ====

  auto state3 = scrollViewComponentDescriptor.createState(
      scrollViewFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeState3 = rootShadowNodeState2->cloneTree(
      scrollViewFamily, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = state3});
      });

  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState3, scrollViewFamily)->getState(),
      state3);

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState3);
      },
      {.enableStateReconciliation = false});

  EXPECT_EQ(
      findDescendantNode(shadowTree, scrollViewFamily)->getState(), state3);

  EXPECT_EQ(initialState->getMostRecentState(), state3);
  EXPECT_EQ(state2->getMostRecentState(), state3);
  EXPECT_EQ(state3->getMostRecentState(), state3);

  // ==== COMMIT from React ====

  auto rootShadowNode = rootShadowNodeState2->cloneTree(
      parentShadowNode->getFamily(),
      [&](const ShadowNode& oldShadowNode) { return oldShadowNode.clone({}); });

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNode);
      },
      {.enableStateReconciliation = true});

  EXPECT_EQ(
      findDescendantNode(shadowTree, scrollViewFamily)
          ->getState()
          ->getRevision(),
      state3->getRevision());
}

TEST_F(StateReconciliationTest, testCloneslessStateReconciliationDoesntClone) {
  // ==== SETUP ====
  /*
   <Root>
    <ScrollView />
   </Root>
  */

  auto initialScrollViewShadowNode = std::shared_ptr<ScrollViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .children({
          Element<ScrollViewShadowNode>()
            .reference(initialScrollViewShadowNode)
        });
  // clang-format on

  ContextContainer contextContainer{};

  auto rootShadowNode1 = builder_.build(element);

  auto& scrollViewComponentDescriptor =
      initialScrollViewShadowNode->getComponentDescriptor();
  auto& scrollViewFamily = initialScrollViewShadowNode->getFamily();
  auto initialState = initialScrollViewShadowNode->getState();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  // ==== Initial commit ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNode1);
      },
      {.enableStateReconciliation = true});

  EXPECT_EQ(initialState->getMostRecentState(), initialState);

  EXPECT_EQ(
      findDescendantNode(*rootShadowNode1, scrollViewFamily)->getState(),
      initialState);

  // ==== C++ state update commit ====

  auto state2 = scrollViewComponentDescriptor.createState(
      scrollViewFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNode2 = rootShadowNode1->cloneTree(
      scrollViewFamily, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = state2});
      });

  EXPECT_EQ(
      findDescendantNode(*rootShadowNode2, scrollViewFamily)->getState(),
      state2);
  EXPECT_EQ(initialState->getMostRecentState(), initialState);

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNode2);
      },
      {.enableStateReconciliation = false});

  EXPECT_EQ(initialState->getMostRecentState(), state2);
  EXPECT_EQ(state2->getMostRecentState(), state2);

  // ==== Creact clones tree ====

  std::shared_ptr<ShadowNode> newlyClonedShadowNode;

  auto rootShadowNodeClonedFromReact = rootShadowNode2->cloneTree(
      scrollViewFamily, [&](const ShadowNode& oldShadowNode) {
        newlyClonedShadowNode = oldShadowNode.clone({});
        return newlyClonedShadowNode;
      });

  auto state3 = scrollViewComponentDescriptor.createState(
      scrollViewFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeClonedFromStateUpdate = rootShadowNode2->cloneTree(
      scrollViewFamily, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = state3});
      });

  // ==== State update ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromStateUpdate);
      },
      {.enableStateReconciliation = false});

  // ==== React commit ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromReact);
      },
      {.enableStateReconciliation = true});

  auto scrollViewShadowNode = findDescendantNode(shadowTree, scrollViewFamily);

  EXPECT_EQ(scrollViewShadowNode->getState(), state3);
}

TEST_F(StateReconciliationTest, testStateReconciliationScrollViewChildUpdate) {
  // ==== SETUP ====
  /*
   <Root>
    <ScrollView>
      <View />
    </ScrollView>
   </Root>
  */

  auto initialScrollViewShadowNode = std::shared_ptr<ScrollViewShadowNode>{};
  auto initialChildViewShadowNode = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .children({
          Element<ScrollViewShadowNode>()
            .reference(initialScrollViewShadowNode)
            .children({
              Element<ViewShadowNode>()
                .reference(initialChildViewShadowNode)
            })

        });
  // clang-format on

  ContextContainer contextContainer{};

  auto initialRootShadowNode = builder_.build(element);

  auto& scrollViewComponentDescriptor =
      initialScrollViewShadowNode->getComponentDescriptor();
  auto& scrollViewFamily = initialScrollViewShadowNode->getFamily();
  auto initialState = initialScrollViewShadowNode->getState();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  // ==== Initial commit ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(initialRootShadowNode);
      },
      {.enableStateReconciliation = true});

  // ==== React starts cloning but does not commit ====

  std::shared_ptr<ShadowNode> newlyClonedViewShadowNode;

  auto rootShadowNodeClonedFromReact = initialRootShadowNode->cloneTree(
      initialChildViewShadowNode->getFamily(),
      [&](const ShadowNode& oldShadowNode) {
        auto& viewComponentDescriptor =
            initialChildViewShadowNode->getComponentDescriptor();
        PropsParserContext parserContext{-1, contextContainer};
        auto props =
            viewComponentDescriptor.cloneProps(parserContext, nullptr, {});
        newlyClonedViewShadowNode = oldShadowNode.clone({});
        return newlyClonedViewShadowNode;
      });

  // ==== State update ====

  auto state2 = scrollViewComponentDescriptor.createState(
      scrollViewFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNode2 = initialRootShadowNode->cloneTree(
      scrollViewFamily, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = state2});
      });

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNode2);
      },
      {.enableStateReconciliation = false});

  // ==== React commits its tree ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromReact);
      },
      {.enableStateReconciliation = true});

  auto scrollViewShadowNode = findDescendantNode(shadowTree, scrollViewFamily);

  EXPECT_EQ(scrollViewShadowNode->getState(), state2);
  EXPECT_EQ(
      findDescendantNode(shadowTree, initialChildViewShadowNode->getFamily()),
      newlyClonedViewShadowNode.get());
}

TEST_F(StateReconciliationTest, testScrollViewWithChildrenDeletion) {
  // ==== SETUP ====

  /*
   <Root>
      <View> - parent
        <ScrollView /> - child A - will be deleted.
        <ScrollView /> - child B - will remain and its props are updated.
      </View>
   </Root>
  */

  auto parentView = std::shared_ptr<ViewShadowNode>{};
  auto childA = std::shared_ptr<ScrollViewShadowNode>{};
  auto childB = std::shared_ptr<ScrollViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .children({
          Element<ViewShadowNode>()
            .reference(parentView)
            .children({
              Element<ScrollViewShadowNode>()
                .reference(childA),
              Element<ScrollViewShadowNode>()
                .reference(childB),
            })
        });
  // clang-format on

  ContextContainer contextContainer{};

  auto rootNode = builder_.build(element);

  auto& scrollViewComponentDescriptor = childB->getComponentDescriptor();
  auto& childBFamily = childB->getFamily();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  // ==== INITIAL COMMIT ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootNode);
      },
      {.enableStateReconciliation = true});

  // ==== Tree without childA and childB has new props ====

  auto rootShadowNodeClonedFromReact = rootNode->cloneTree(
      parentView->getFamily(),
      [&childB, &scrollViewComponentDescriptor, &contextContainer](
          const ShadowNode& oldShadowNode) {
        PropsParserContext parserContext{-1, contextContainer};
        auto clonedChildB = childB->clone({
            .props = scrollViewComponentDescriptor.cloneProps(
                parserContext, nullptr, {}),
        });
        std::shared_ptr<const ShadowNode> shadowNode = clonedChildB;
        std::vector<std::shared_ptr<const ShadowNode>> children =
            std::vector({shadowNode});
        const auto childrenShared =
            std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
                children);
        return oldShadowNode.clone({.children = childrenShared});
      });

  // ==== State update ====

  auto newState = scrollViewComponentDescriptor.createState(
      childBFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeClonedFromStateUpdate = rootNode->cloneTree(
      childBFamily, [&newState](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = newState});
      });

  shadowTree.commit(
      [&rootShadowNodeClonedFromStateUpdate](
          const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromStateUpdate);
      },
      {.enableStateReconciliation = false});

  EXPECT_NE(findDescendantNode(shadowTree, childA->getFamily()), nullptr);

  // ==== Now the react commit happens.  ====

  shadowTree.commit(
      [&rootShadowNodeClonedFromReact](
          const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromReact);
      },
      {.enableStateReconciliation = true});

  EXPECT_EQ(findDescendantNode(shadowTree, childA->getFamily()), nullptr);
  EXPECT_EQ(
      findDescendantNode(shadowTree, childB->getFamily())->getState(),
      newState);
}

TEST_F(StateReconciliationTest, testScrollViewWithComplexChildrenReorder) {
  // ==== SETUP ====

  /*
   <Root>
      <View> - grandparent
        <View>  - parent A
          <ScrollView /> - child A
        </View>
        <View>  - parent B
          <ScrollView /> - child B
        </View>
      </View>
   </Root>
  */
  auto grandParent = std::shared_ptr<ViewShadowNode>{};
  auto childA = std::shared_ptr<ScrollViewShadowNode>{};
  auto childB = std::shared_ptr<ScrollViewShadowNode>{};
  auto parentA = std::shared_ptr<ViewShadowNode>{};
  auto parentB = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .children({
          Element<ViewShadowNode>()
            .reference(grandParent)
            .children({
              Element<ViewShadowNode>()
                .reference(parentA)
                .children({
                  Element<ScrollViewShadowNode>()
                    .reference(childA)
                }),
              Element<ViewShadowNode>()
                .reference(parentB)
                .children({
                  Element<ScrollViewShadowNode>()
                    .reference(childB)
                }),
            })
        });
  // clang-format on

  ContextContainer contextContainer{};

  auto rootNode = builder_.build(element);

  auto& scrollViewComponentDescriptor = childB->getComponentDescriptor();
  auto& childAFamily = childA->getFamily();
  auto initialState = childA->getState();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  // ==== INITIAL COMMIT ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootNode);
      },
      {.enableStateReconciliation = true});

  // ==== Tree swapping childA and childB. ChildB has new props ====

  auto rootShadowNodeClonedFromReact = rootNode->cloneTree(
      grandParent->getFamily(),
      [&parentA, &parentB](const ShadowNode& oldShadowNode) {
        auto children =
            std::vector<std::shared_ptr<const ShadowNode>>({parentB, parentA});
        const auto childrenShared =
            std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
                children);
        return oldShadowNode.clone({.children = childrenShared});
      });

  // ==== State update ====

  auto newState = scrollViewComponentDescriptor.createState(
      childAFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeClonedFromStateUpdate = rootNode->cloneTree(
      childAFamily, [&newState](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = newState});
      });

  shadowTree.commit(
      [&rootShadowNodeClonedFromStateUpdate](
          const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromStateUpdate);
      },
      {.enableStateReconciliation = false});

  // ==== Now the react commit happens.  ====

  shadowTree.commit(
      [&rootShadowNodeClonedFromReact](
          const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromReact);
      },
      {.enableStateReconciliation = true});

  EXPECT_NE(findDescendantNode(shadowTree, childA->getFamily()), nullptr);
  EXPECT_NE(findDescendantNode(shadowTree, childB->getFamily()), nullptr);

  EXPECT_EQ(findDescendantNode(shadowTree, childAFamily)->getState(), newState);
}

TEST_F(StateReconciliationTest, testScrollViewWithChildrenReorder) {
  // ==== SETUP ====

  /*
   <Root>
      <View> - parent
        <ScrollView /> - child A - will be moved to 2nd position.
        <ScrollView /> - child B - will will be moved to 1st position.
      </View>
   </Root>
  */

  auto parentView = std::shared_ptr<ViewShadowNode>{};
  auto childA = std::shared_ptr<ScrollViewShadowNode>{};
  auto childB = std::shared_ptr<ScrollViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .children({
          Element<ViewShadowNode>()
            .reference(parentView)
            .children({
              Element<ScrollViewShadowNode>()
                .reference(childA),
              Element<ScrollViewShadowNode>()
                .reference(childB),
            })
        });
  // clang-format on

  ContextContainer contextContainer{};

  auto rootNode = builder_.build(element);

  auto& scrollViewComponentDescriptor = childB->getComponentDescriptor();
  auto& childAFamily = childA->getFamily();
  auto initialState = childA->getState();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  // ==== INITIAL COMMIT ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootNode);
      },
      {.enableStateReconciliation = true});

  // ==== Tree swapping childA and childB. ChildB has new props ====

  auto rootShadowNodeClonedFromReact = rootNode->cloneTree(
      parentView->getFamily(),
      [&childB, &childA](const ShadowNode& oldShadowNode) {
        auto children =
            std::vector<std::shared_ptr<const ShadowNode>>({childB, childA});
        const auto childrenShared =
            std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
                children);
        return oldShadowNode.clone({.children = childrenShared});
      });

  // ==== State update ====

  auto newState = scrollViewComponentDescriptor.createState(
      childAFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeClonedFromStateUpdate = rootNode->cloneTree(
      childAFamily, [&newState](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = newState});
      });

  shadowTree.commit(
      [&rootShadowNodeClonedFromStateUpdate](
          const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromStateUpdate);
      },
      {.enableStateReconciliation = false});

  // ==== Now the react commit happens.  ====

  shadowTree.commit(
      [&rootShadowNodeClonedFromReact](
          const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromReact);
      },
      {.enableStateReconciliation = true});

  EXPECT_NE(findDescendantNode(shadowTree, childA->getFamily()), nullptr);
  EXPECT_NE(findDescendantNode(shadowTree, childB->getFamily()), nullptr);

  EXPECT_EQ(findDescendantNode(shadowTree, childAFamily)->getState(), newState);
}

TEST_F(StateReconciliationTest, testScrollViewWithChildrenAddition) {
  // ==== SETUP ====

  /*
   <Root>
      <View> - parent
        <ScrollView /> - child A - will be added.
        <ScrollView /> - child B - will stay
      </View>
   </Root>
  */

  auto parentView = std::shared_ptr<ViewShadowNode>{};
  auto childA = std::shared_ptr<const ShadowNode>{};
  auto childB = std::shared_ptr<ScrollViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .children({
          Element<ViewShadowNode>()
            .reference(parentView)
            .children({
              Element<ScrollViewShadowNode>()
                .reference(childB),
            })
        });
  // clang-format on

  ContextContainer contextContainer{};

  auto rootNode = builder_.build(element);

  auto& scrollViewComponentDescriptor = childB->getComponentDescriptor();
  auto& scrollViewFamily = childB->getFamily();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{1},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  // ==== INITIAL COMMIT ====

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootNode);
      },
      {.enableStateReconciliation = true});

  // ==== State update ====

  auto newState = scrollViewComponentDescriptor.createState(
      scrollViewFamily, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeClonedFromStateUpdate = rootNode->cloneTree(
      scrollViewFamily, [&newState](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone({.state = newState});
      });

  // ==== Tree with new child ====

  auto rootShadowNodeClonedFromReact = rootNode->cloneTree(
      parentView->getFamily(),
      [&childA, &childB, &contextContainer](const ShadowNode& oldShadowNode) {
        auto& viewComponentDescriptor = childB->getComponentDescriptor();
        auto childAFamily = viewComponentDescriptor.createFamily(
            {.tag = 13, .surfaceId = 1, .instanceHandle = nullptr});

        PropsParserContext parserContext{-1, contextContainer};
        auto props =
            viewComponentDescriptor.cloneProps(parserContext, nullptr, {});
        childA = viewComponentDescriptor.createShadowNode(
            {.props =
                 viewComponentDescriptor.cloneProps(parserContext, nullptr, {}),
             .state = viewComponentDescriptor.createInitialState(
                 props, childAFamily)},
            childAFamily);

        std::shared_ptr<const ShadowNode> shadowNode = childA;
        auto children = std::vector<std::shared_ptr<const ShadowNode>>(
            {shadowNode, childB});
        const auto childrenShared =
            std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
                children);
        return oldShadowNode.clone({.children = childrenShared});
      });

  // ==== State update happens ====

  shadowTree.commit(
      [&rootShadowNodeClonedFromStateUpdate](
          const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromStateUpdate);
      },
      {.enableStateReconciliation = false});

  // ==== React commits tree ====

  shadowTree.commit(
      [&rootShadowNodeClonedFromReact](
          const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromReact);
      },
      {.enableStateReconciliation = true});

  EXPECT_NE(findDescendantNode(shadowTree, childA->getFamily()), nullptr);
  EXPECT_EQ(
      findDescendantNode(shadowTree, childB->getFamily())->getState(),
      newState);
}
