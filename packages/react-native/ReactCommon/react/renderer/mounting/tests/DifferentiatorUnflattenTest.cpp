/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/stubs/stubs.h>

namespace facebook::react {
// Exercises the unflatten-unflatten branch in
// calculateShadowViewMutationsFlattener (Differentiator.cpp), where multiple
// levels of nested views simultaneously transition from flattened to concrete.
//
// The bug requires 3+ levels of nesting to manifest: at the second recursive
// unflatten-unflatten call, parentTag (set to the intermediate node's tag) and
// parentTagForUpdate (which should remain the original parent's tag) diverge.
//
// Tree:
//   Root (tag 1)
//     A (tag 2) -- transitions from flattened to concrete
//       B (tag 3) -- transitions from flattened to concrete
//         C (tag 4) -- transitions from flattened to concrete
//           D (tag 5) -- always concrete (leaf)
class DifferentiatorUnflattenTest : public ::testing::Test {
 protected:
  std::unique_ptr<ComponentBuilder> builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> nodeA_;
  std::shared_ptr<ViewShadowNode> nodeB_;
  std::shared_ptr<ViewShadowNode> nodeC_;
  std::shared_ptr<ViewShadowNode> nodeD_;

  std::shared_ptr<RootShadowNode> currentRootShadowNode_;
  StubViewTree currentStubViewTree_;

  void SetUp() override {
    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .children({
            Element<ViewShadowNode>()
              .tag(2)
              .reference(nodeA_)
              .children({
                Element<ViewShadowNode>()
                  .tag(3)
                  .reference(nodeB_)
                  .children({
                    Element<ViewShadowNode>()
                      .tag(4)
                      .reference(nodeC_)
                      .children({
                        Element<ViewShadowNode>()
                          .tag(5)
                          .reference(nodeD_)
                      })
                  })
              })
          });
    // clang-format on

    builder_ = std::make_unique<ComponentBuilder>(simpleComponentBuilder());
    builder_->build(element);

    currentRootShadowNode_ = rootShadowNode_;
    currentRootShadowNode_->layoutIfNeeded();
    currentStubViewTree_ =
        buildStubViewTreeWithoutUsingDifferentiator(*currentRootShadowNode_);
  }

  void mutateViewShadowNodeProps_(
      const std::shared_ptr<ViewShadowNode>& node,
      std::function<void(ViewProps& props)> callback) {
    rootShadowNode_ =
        std::static_pointer_cast<RootShadowNode>(rootShadowNode_->cloneTree(
            node->getFamily(), [&](const ShadowNode& oldShadowNode) {
              auto viewProps = std::make_shared<ViewProps>();
              callback(*viewProps);
              return oldShadowNode.clone(
                  ShadowNodeFragment{.props = viewProps});
            }));
  }

  void testViewTree_(
      const std::function<void(const StubViewTree& viewTree)>& callback) {
    rootShadowNode_->layoutIfNeeded();

    callback(buildStubViewTreeUsingDifferentiator(*rootShadowNode_));
    callback(buildStubViewTreeWithoutUsingDifferentiator(*rootShadowNode_));

    auto mutations =
        calculateShadowViewMutations(*currentRootShadowNode_, *rootShadowNode_);
    currentRootShadowNode_ = rootShadowNode_;
    currentStubViewTree_.mutate(mutations);
    callback(currentStubViewTree_);
  }

  void applyUnflattenSetup_() {
    mutateViewShadowNodeProps_(
        nodeD_, [](ViewProps& props) { props.backgroundColor = blackColor(); });

    testViewTree_([](const StubViewTree& viewTree) {
      EXPECT_EQ(viewTree.size(), 2);
      EXPECT_EQ(viewTree.getRootStubView().children.size(), 1);
      EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 5);
    });

    mutateViewShadowNodeProps_(
        nodeA_, [](ViewProps& props) { props.nativeId = "a"; });
    mutateViewShadowNodeProps_(
        nodeB_, [](ViewProps& props) { props.nativeId = "b"; });
    mutateViewShadowNodeProps_(
        nodeC_, [](ViewProps& props) { props.nativeId = "c"; });
    mutateViewShadowNodeProps_(
        nodeD_, [](ViewProps& props) { props.backgroundColor = whiteColor(); });
  }
};

// The UPDATE mutation for D correctly references Root's tag (1) as parentTag,
// and StubViewTree::mutate() succeeds without assertion failure.
TEST_F(DifferentiatorUnflattenTest, updateMutationHasCorrectParentTag) {
  applyUnflattenSetup_();

  testViewTree_([](const StubViewTree& viewTree) {
    EXPECT_EQ(viewTree.size(), 5);
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 1);
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 2);

    auto& viewA = *viewTree.getRootStubView().children.at(0);
    EXPECT_EQ(viewA.children.size(), 1);
    EXPECT_EQ(viewA.children.at(0)->tag, 3);

    auto& viewB = *viewA.children.at(0);
    EXPECT_EQ(viewB.children.size(), 1);
    EXPECT_EQ(viewB.children.at(0)->tag, 4);

    auto& viewC = *viewB.children.at(0);
    EXPECT_EQ(viewC.children.size(), 1);
    EXPECT_EQ(viewC.children.at(0)->tag, 5);
  });
}

} // namespace facebook::react
