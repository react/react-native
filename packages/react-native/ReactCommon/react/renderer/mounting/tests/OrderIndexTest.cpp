/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/mounting/stubs/stubs.h>

namespace facebook::react {

class OrderIndexTest : public ::testing::Test {
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
    builder_ = std::make_unique<ComponentBuilder>(simpleComponentBuilder());

    auto element = Element<RootShadowNode>()
                       .reference(rootShadowNode_)
                       .tag(1)
                       .children({
                           Element<ViewShadowNode>().tag(2).reference(nodeA_),
                           Element<ViewShadowNode>().tag(3).reference(nodeB_),
                           Element<ViewShadowNode>().tag(4).reference(nodeC_),
                           Element<ViewShadowNode>().tag(5).reference(nodeD_),
                       });

    builder_->build(element);

    mutateViewShadowNodeProps_(nodeA_, [](ViewProps& props) {
      auto& yogaStyle = props.yogaStyle;
      yogaStyle.setPositionType(yoga::PositionType::Relative);
      props.backgroundColor = blackColor(); // to ensure it won't get flattened
    });
    mutateViewShadowNodeProps_(nodeB_, [](ViewProps& props) {
      auto& yogaStyle = props.yogaStyle;
      yogaStyle.setPositionType(yoga::PositionType::Relative);
      props.backgroundColor = blackColor(); // to ensure it won't get flattened
    });
    mutateViewShadowNodeProps_(nodeC_, [](ViewProps& props) {
      auto& yogaStyle = props.yogaStyle;
      yogaStyle.setPositionType(yoga::PositionType::Relative);
      props.backgroundColor = blackColor(); // to ensure it won't get flattened
    });
    mutateViewShadowNodeProps_(nodeD_, [](ViewProps& props) {
      auto& yogaStyle = props.yogaStyle;
      yogaStyle.setPositionType(yoga::PositionType::Relative);
      props.backgroundColor = blackColor(); // to ensure it won't get flattened
    });

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

    auto mutations =
        calculateShadowViewMutations(*currentRootShadowNode_, *rootShadowNode_);
    currentRootShadowNode_ = rootShadowNode_;
    currentStubViewTree_.mutate(mutations);
    callback(currentStubViewTree_);
  }
};

TEST_F(OrderIndexTest, defaultOrderIsDocumentOrder) {
  testViewTree_([this](const StubViewTree& viewTree) {
    EXPECT_EQ(viewTree.size(), 5);
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, nodeA_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, nodeB_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, nodeC_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, nodeD_->getTag());
  });
}

TEST_F(OrderIndexTest, basicZIndex) {
  mutateViewShadowNodeProps_(
      nodeA_, [](ViewProps& props) { props.zIndex = 5; });
  mutateViewShadowNodeProps_(
      nodeB_, [](ViewProps& props) { props.zIndex = 10; });
  mutateViewShadowNodeProps_(
      nodeC_, [](ViewProps& props) { props.zIndex = 1; });
  mutateViewShadowNodeProps_(
      nodeD_, [](ViewProps& props) { props.zIndex = 2; });

  testViewTree_([this](const StubViewTree& viewTree) {
    EXPECT_EQ(viewTree.size(), 5);
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, nodeC_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, nodeD_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, nodeA_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, nodeB_->getTag());
  });
}

TEST_F(OrderIndexTest, negativeZIndex) {
  mutateViewShadowNodeProps_(
      nodeA_, [](ViewProps& props) { props.zIndex = 5; });
  mutateViewShadowNodeProps_(
      nodeB_, [](ViewProps& props) { props.zIndex = -10; });
  mutateViewShadowNodeProps_(
      nodeC_, [](ViewProps& props) { props.zIndex = -1; });
  mutateViewShadowNodeProps_(
      nodeD_, [](ViewProps& props) { props.zIndex = 2; });

  testViewTree_([this](const StubViewTree& viewTree) {
    EXPECT_EQ(viewTree.size(), 5);
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, nodeB_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, nodeC_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, nodeD_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, nodeA_->getTag());
  });
}

TEST_F(OrderIndexTest, zeroZIndex) {
  mutateViewShadowNodeProps_(
      nodeC_, [](ViewProps& props) { props.zIndex = 0; });
  mutateViewShadowNodeProps_(
      nodeD_, [](ViewProps& props) { props.zIndex = 0; });

  testViewTree_([this](const StubViewTree& viewTree) {
    EXPECT_EQ(viewTree.size(), 5);
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, nodeA_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, nodeB_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, nodeC_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, nodeD_->getTag());
  });
}

TEST_F(OrderIndexTest, staticBehindNonStatic) {
  mutateViewShadowNodeProps_(nodeB_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Static);
    props.backgroundColor = blackColor();
  });
  mutateViewShadowNodeProps_(nodeD_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Static);
    props.backgroundColor = blackColor();
  });

  testViewTree_([this](const StubViewTree& viewTree) {
    EXPECT_EQ(viewTree.size(), 5);
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, nodeB_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, nodeD_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, nodeA_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, nodeC_->getTag());
  });
}

TEST_F(OrderIndexTest, zIndexStaticBehindNonStatic) {
  mutateViewShadowNodeProps_(
      nodeB_, [](ViewProps& props) { props.zIndex = 5; });
  mutateViewShadowNodeProps_(
      nodeC_, [](ViewProps& props) { props.zIndex = -1; });
  mutateViewShadowNodeProps_(nodeD_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Static);
    props.backgroundColor = blackColor();
  });

  testViewTree_([this](const StubViewTree& viewTree) {
    EXPECT_EQ(viewTree.size(), 5);
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, nodeC_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, nodeD_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, nodeA_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, nodeB_->getTag());
  });
}

TEST_F(OrderIndexTest, staticDoesNotGetZIndex) {
  mutateViewShadowNodeProps_(nodeB_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Static);
    props.backgroundColor = blackColor();
    props.zIndex = 5;
  });
  mutateViewShadowNodeProps_(nodeD_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Static);
    props.backgroundColor = blackColor();
    props.zIndex = -5;
  });

  testViewTree_([this](const StubViewTree& viewTree) {
    EXPECT_EQ(viewTree.size(), 5);
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, nodeB_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, nodeD_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, nodeA_->getTag());
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, nodeC_->getTag());
  });
}

} // namespace facebook::react
