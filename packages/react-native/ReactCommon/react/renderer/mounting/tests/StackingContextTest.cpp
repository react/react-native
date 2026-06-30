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
#include <react/renderer/graphics/ValueUnit.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/mounting/stubs/stubs.h>

namespace facebook::react {

class StackingContextTest : public ::testing::Test {
 protected:
  std::unique_ptr<ComponentBuilder> builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> nodeA_;
  std::shared_ptr<ViewShadowNode> nodeAA_;
  std::shared_ptr<ViewShadowNode> nodeB_;
  std::shared_ptr<ViewShadowNode> nodeBA_;
  std::shared_ptr<ViewShadowNode> nodeBB_;
  std::shared_ptr<ViewShadowNode> nodeBBA_;
  std::shared_ptr<ViewShadowNode> nodeBBB_;
  std::shared_ptr<ViewShadowNode> nodeBC_;
  std::shared_ptr<ViewShadowNode> nodeBD_;

  std::shared_ptr<RootShadowNode> currentRootShadowNode_;
  StubViewTree currentStubViewTree_;

  void SetUp() override {
    //  ┌────────────── (Root) ──────────────┐
    //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
    //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │
    //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
    //  └────────────────────────────────────┘

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
                  .reference(nodeAA_)
              }),
            Element<ViewShadowNode>()
              .tag(4)
              .reference(nodeB_)
              .children({
                Element<ViewShadowNode>()
                  .tag(5)
                  .reference(nodeBA_),
                Element<ViewShadowNode>()
                  .tag(6)
                  .reference(nodeBB_)
                  .children({
                    Element<ViewShadowNode>()
                      .tag(7)
                      .reference(nodeBBA_),
                    Element<ViewShadowNode>()
                      .tag(8)
                      .reference(nodeBBB_)
                  }),
                Element<ViewShadowNode>()
                  .tag(9)
                  .reference(nodeBC_),
                Element<ViewShadowNode>()
                  .tag(10)
                  .reference(nodeBD_)
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

  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
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
};

TEST_F(StackingContextTest, defaultPropsMakeEverythingFlattened) {
  testViewTree_([](const StubViewTree& viewTree) {
    // 1 view in total.
    EXPECT_EQ(viewTree.size(), 1);

    // The root view has no subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 0);
  });
}

TEST_F(StackingContextTest, mostPropsDoNotForceViewsToMaterialize) {
  //  ┌────────────── (Root) ──────────────┐    ┌────────── (Root) ───────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ padding: 10;               ┃ ┃ │    │                             │
  //  │ ┃ ┃ margin: 9001;              ┃ ┃ │    │                             │
  //  │ ┃ ┃ position: absolute;        ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowRadius: 10;          ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowOffset: [42, 42];    ┃ ┃ │    │                             │
  //  │ ┃ ┃ backgroundColor: clear;    ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ zIndex: 42;                ┃ ┃ │    │                             │
  //  │ ┃ ┃ margin: 42;                ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowColor: clear;        ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │ No observable side-effects. │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│   No views are generated.   │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ borderRadii: 42;       ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ borderColor: black;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ onLayout: true;            ┃ ┃ │    │                             │
  //  │ ┃ ┃ hitSlop: 42;               ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(nodeAA_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPadding(yoga::Edge::All, yoga::StyleLength::points(42));
    yogaStyle.setMargin(yoga::Edge::All, yoga::StyleLength::points(42));
    yogaStyle.setPositionType(yoga::PositionType::Absolute);
    props.shadowRadius = 42;
    props.shadowOffset = Size{.width = 42, .height = 42};
    props.backgroundColor = clearColor();
  });

  mutateViewShadowNodeProps_(nodeBA_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    props.zIndex = 42;
    yogaStyle.setPositionType(yoga::PositionType::Static);
    yogaStyle.setMargin(yoga::Edge::All, yoga::StyleLength::points(42));
    props.shadowColor = clearColor();
    props.shadowOpacity = 0.42;
  });

  mutateViewShadowNodeProps_(nodeBBA_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.borderRadii.all = ValueUnit{42, UnitType::Point};
    props.borderColors.all = blackColor();
  });

  mutateViewShadowNodeProps_(nodeBD_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    props.onLayout = true;
    props.hitSlop = EdgeInsets{42, 42, 42, 42};
    yogaStyle.setPositionType(yoga::PositionType::Static);
  });

  testViewTree_([](const StubViewTree& viewTree) {
    // 1 view in total.
    EXPECT_EQ(viewTree.size(), 1);

    // The root view has no subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 0);
  });
}

TEST_F(StackingContextTest, somePropsForceViewsToMaterialize1) {
  //  ┌────────────── (Root) ──────────────┐    ┌─────────── (Root) ──────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ AA (tag: 3) ━━━━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BA (tag: 5) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ backgroundColor: black;    ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ backgroundColor: white;    ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ shadowColor: black;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(
      nodeAA_, [](ViewProps& props) { props.backgroundColor = blackColor(); });

  mutateViewShadowNodeProps_(
      nodeBA_, [](ViewProps& props) { props.backgroundColor = whiteColor(); });

  mutateViewShadowNodeProps_(
      nodeBBA_, [](ViewProps& props) { props.shadowColor = blackColor(); });

  testViewTree_([](const StubViewTree& viewTree) {
    // 4 views in total.
    EXPECT_EQ(viewTree.size(), 4);

    // The root view has all 3 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 3);

    // The root view subviews are [3, 5, 7].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 3);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 5);
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 7);
  });
}

TEST_F(StackingContextTest, somePropsForceViewsToMaterialize2) {
  //  ┌────────────── (Root) ──────────────┐    ┌─────────── (Root) ──────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ A (tag: 2) ━━━━━━━━━━━━┓ │
  //  │ ┃ backgroundColor: black;        ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ AA (tag: 3) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ pointerEvents: none;       ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ B (tag: 4) ━━━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BA (tag: 5) ━━━━━━━━━━━┓ │
  //  │ ┃ testId: "42"                   ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BB (tag: 6) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ nativeId: "42"             ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ backgroundColor: black;    ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BBB (tag: 8) ━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┃ transform: scale(2);   ┃ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┏━ BC (tag: 9) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃ ┃ zIndex: 42;            ┃ ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┏━ BD (tag: 10) ━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ shadowColor: black;        ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ opacity: 0.42;             ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(
      nodeA_, [](ViewProps& props) { props.backgroundColor = blackColor(); });

  mutateViewShadowNodeProps_(nodeAA_, [](ViewProps& props) {
    props.pointerEvents = PointerEventsMode::None;
  });

  mutateViewShadowNodeProps_(
      nodeB_, [](ViewProps& props) { props.testId = "42"; });

  mutateViewShadowNodeProps_(
      nodeBA_, [](ViewProps& props) { props.nativeId = "42"; });

  mutateViewShadowNodeProps_(
      nodeBB_, [](ViewProps& props) { props.backgroundColor = blackColor(); });

  mutateViewShadowNodeProps_(nodeBBA_, [](ViewProps& props) {
    props.transform = Transform::Scale(2, 2, 2);
  });

  mutateViewShadowNodeProps_(nodeBBB_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.zIndex = 42;
  });

  mutateViewShadowNodeProps_(
      nodeBC_, [](ViewProps& props) { props.shadowColor = blackColor(); });

  mutateViewShadowNodeProps_(
      nodeBD_, [](ViewProps& props) { props.opacity = 0.42; });

  testViewTree_([](const StubViewTree& viewTree) {
    // 10 views in total.
    EXPECT_EQ(viewTree.size(), 10);

    // The root view has all 9 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 9);
  });
}

TEST_F(StackingContextTest, nonCollapsableChildren) {
  //  ┌────────────── (Root) ──────────────┐    ┌─────────── (Root) ──────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BBB (tag: 8) ━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │                             |
  //  │ ┃ ┃                            ┃ ┃ │    │                             |
  //  │ ┃ ┃                            ┃ ┃ │    │                             |
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             |
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             |
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ collapsableChildren: false ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(
      nodeBB_, [](ViewProps& props) { props.collapsableChildren = false; });

  testViewTree_([](const StubViewTree& viewTree) {
    // 3 views in total.
    EXPECT_EQ(viewTree.size(), 3);

    // The root view has all 2 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 2);

    // The root view subviews are [7,8].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 7);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 8);
  });
}

TEST_F(StackingContextTest, nonCollapsableChildrenMixed) {
  //  ┌────────────── (Root) ──────────────┐    ┌─────────── (Root) ──────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BA (tag: 5) ━━ ━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BB (tag: 6)  ━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ ┏━ BBA (tag: 7) ━━━-━━┓ ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ ┃FormsView            ┃ ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ ┃FormsStackingContext ┃ ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ ┃                     ┃ ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ ┗━━━━━━━━━━━━━━━━━━━━-┛ ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BC (tag: 9)  ━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BD (tag: 10) ━━━━━━━━━━┓ │
  //  │ ┃ collapsableChildren: false     ┃ │    │ ┃FormsView                ┃ │
  //  │ ┃                                ┃ │    │ ┃FormsStackingContext     ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ testId: "42"           ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ collapsable: true          ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ testId: "123"              ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(
      nodeB_, [](ViewProps& props) { props.collapsableChildren = false; });
  mutateViewShadowNodeProps_(
      nodeBBA_, [](ViewProps& props) { props.testId = "42"; });
  mutateViewShadowNodeProps_(
      nodeBC_, [](ViewProps& props) { props.collapsable = true; });
  mutateViewShadowNodeProps_(
      nodeBD_, [](ViewProps& props) { props.testId = "43"; });

  testViewTree_([](const StubViewTree& viewTree) {
    // 6 views in total.
    EXPECT_EQ(viewTree.size(), 6);

    // The root view has four of the subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    // The root view subviews are [5, 6, 9, 10].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 5);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 6);
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 9);
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 10);

    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->children.size(), 1);
    EXPECT_EQ(
        viewTree.getRootStubView().children.at(1)->children.at(0)->tag, 7);
  });
}

TEST_F(StackingContextTest, zIndexAndFlattenedNodes) {
  //  ┌────────────── (Root) ──────────────┐    ┌────────── (Root) ───────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BD (tag: 10) ━━━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BC (tag: 9) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ position: relative;        ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ zIndex: 9001;              ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BBB (tag: 8) ━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BA (tag: 5) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ position: relative;        ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ zIndex: 9000;              ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┏━ AA (tag: 3) ━━━━━━━━━━━┓ │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ zIndex: 8999;          ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ zIndex: 8998;          ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ position: relative;        ┃ ┃ │    │                             │
  //  │ ┃ ┃ zIndex: 8997;              ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ position: relative;        ┃ ┃ │    │                             │
  //  │ ┃ ┃ zIndex: 8996;              ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(nodeAA_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.zIndex = 9001;
  });

  mutateViewShadowNodeProps_(nodeBA_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.zIndex = 9000;
  });

  mutateViewShadowNodeProps_(nodeBBA_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.zIndex = 8999;
  });

  mutateViewShadowNodeProps_(nodeBBB_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.zIndex = 8998;
  });

  mutateViewShadowNodeProps_(nodeBC_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.zIndex = 8997;
  });

  mutateViewShadowNodeProps_(nodeBD_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.zIndex = 8996;
  });

  testViewTree_([](const StubViewTree& viewTree) {
    // 7 views in total.
    EXPECT_EQ(viewTree.size(), 7);

    // The root view has all 6 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 6);

    // The root view subviews are [10, 9, 8, 7, 5, 3].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 10);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 9);
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 8);
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 7);
    EXPECT_EQ(viewTree.getRootStubView().children.at(4)->tag, 5);
    EXPECT_EQ(viewTree.getRootStubView().children.at(5)->tag, 3);
  });

  // And now let's make BB to form a Stacking Context with small order-index.

  //  ┌────────────── (Root) ──────────────┐     ┌────────── (Root) ──────────┐
  //  │ ┌─ A (tag: 2) ───────────────────┐ │     │ ┏━ BB (tag: 6) ━━━━━━━━━━┓ │
  //  │ │                                │ │     │ ┃ #View                  ┃ │
  //  │ │                                │ │     │ ┃ #StackingContext       ┃ │
  //  │ │                                │ │     │ ┃                        ┃ │
  //  │ │                                │ │     │ ┃ ┏━ BBB (tag: 8) ━━━━━┓ ┃ │
  //  │ │ ┌─ AA (tag: 3) ──────────────┐ │ │     │ ┃ ┃ #View              ┃ ┃ │
  //  │ │ │ position: relative;        │ │ │     │ ┃ ┃ #StackingContext   ┃ ┃ │
  //  │ │ │ zIndex: 9001;              │ │ │     │ ┃ ┃                    ┃ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┗━━━━━━━━━━━━━━━━━━━━┛ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┏━ BBA (tag: 7) ━━━━━┓ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┃ #View              ┃ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┃ #StackingContext   ┃ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┃                    ┃ ┃ │
  //  │ │ └────────────────────────────┘ │ │     │ ┃ ┗━━━━━━━━━━━━━━━━━━━━┛ ┃ │
  //  │ └────────────────────────────────┘ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┌─ B (tag: 4) ───────────────────┐ │     │ ┏━ BD (tag: 10) ━━━━━━━━━┓ │
  //  │ │                                │ │     │ ┃ #View                  ┃ │
  //  │ │                                │ │     │ ┃ #StackingContext       ┃ │
  //  │ │                                │ │     │ ┃                        ┃ │
  //  │ │                                │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ┌─ BA (tag: 5) ──────────────┐ │ │     │ ┏━ BC (tag: 9) ━━━━━━━━━━┓ │
  //  │ │ │ position: relative;        │ │ │     │ ┃ #View                  ┃ │
  //  │ │ │ zIndex: 9000;              │ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ │                            │ │ │     │ ┃                        ┃ │
  //  │ │ │                            │ │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ └────────────────────────────┘ │ │     │ ┏━ BA (tag: 5) ━━━━━━━━━━┓ │
  //  │ │ ╔═ BB (tag: 6) ══════════════╗ │ │     │ ┃ #View                  ┃ │
  //  │ │ ║ *** position: relative;    ║ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ ║ *** zIndex: 42;            ║ │ │━━━━▶│ ┃                        ┃ │
  //  │ │ ║                            ║ │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ║                            ║ │ │     │ ┏━ AA (tag: 3) ━━━━━━━━━━┓ │
  //  │ │ ║ ┌─ BBA (tag: 7) ─────────┐ ║ │ │     │ ┃ #View                  ┃ │
  //  │ │ ║ │ position: relative;    │ ║ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ ║ │ zIndex: 8999;          │ ║ │ │     │ ┃                        ┃ │
  //  │ │ ║ │                        │ ║ │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ └────────────────────────┘ ║ │ │     │                            │
  //  │ │ ║ ┌─ BBB (tag: 8) ─────────┐ ║ │ │     │                            │
  //  │ │ ║ │ position: relative;    │ ║ │ │     │                            │
  //  │ │ ║ │ zIndex: 8998;          │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ └────────────────────────┘ ║ │ │     │                            │
  //  │ │ ╚════════════════════════════╝ │ │     │                            │
  //  │ │ ┌─ BC (tag: 9) ──────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 8997;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ │ ┌─ BD (tag: 10) ─────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 8996;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ └────────────────────────────────┘ │     │                            │
  //  └────────────────────────────────────┘     └────────────────────────────┘

  mutateViewShadowNodeProps_(nodeBB_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Relative);
    props.zIndex = 42;
  });

  testViewTree_([](const StubViewTree& viewTree) {
    // 8 views in total.
    EXPECT_EQ(viewTree.size(), 8);

    // The root view has 5 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 5);

    // The root view subviews are [6, 10, 9, 5, 3].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 6);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 10);
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 9);
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 5);
    EXPECT_EQ(viewTree.getRootStubView().children.at(4)->tag, 3);

    auto& view6 = viewTree.getStubView(6);
    EXPECT_EQ(view6.children.size(), 2);
    EXPECT_EQ(view6.children.at(0)->tag, 8);
    EXPECT_EQ(view6.children.at(1)->tag, 7);
  });

  // And now, let's revert it back.

  mutateViewShadowNodeProps_(nodeBB_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setPositionType(yoga::PositionType::Static);
    props.zIndex = {};
  });

  testViewTree_([](const StubViewTree& viewTree) {
    // 7 views in total.
    EXPECT_EQ(viewTree.size(), 7);

    // The root view has all 6 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 6);

    // The root view subviews are [10, 9, 8, 7, 5, 3].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 10);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 9);
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 8);
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 7);
    EXPECT_EQ(viewTree.getRootStubView().children.at(4)->tag, 5);
    EXPECT_EQ(viewTree.getRootStubView().children.at(5)->tag, 3);
  });

  // And now, let's hide BB completety.

  //  ┌────────────── (Root) ──────────────┐     ┌────────── (Root) ──────────┐
  //  │ ┌─ A (tag: 2) ───────────────────┐ │     │ ┏━ BD (tag: 10) ━━━━━━━━━┓ │
  //  │ │                                │ │     │ ┃ #View                  ┃ │
  //  │ │                                │ │     │ ┃ #StackingContext       ┃ │
  //  │ │                                │ │     │ ┃                        ┃ │
  //  │ │                                │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ┌─ AA (tag: 3) ──────────────┐ │ │     │ ┏━ BC (tag: 9) ━━━━━━━━━━┓ │
  //  │ │ │ position: relative;        │ │ │     │ ┃ #View                  ┃ │
  //  │ │ │ zIndex: 9001;              │ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ │                            │ │ │     │ ┃                        ┃ │
  //  │ │ │                            │ │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ │                            │ │ │     │ ┏━ BA (tag: 5) ━━━━━━━━━━┓ │
  //  │ │ │                            │ │ │     │ ┃ #View                  ┃ │
  //  │ │ │                            │ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ └────────────────────────────┘ │ │     │ ┃                        ┃ │
  //  │ └────────────────────────────────┘ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┌─ B (tag: 4) ───────────────────┐ │     │ ┏━ AA (tag: 3) ━━━━━━━━━━┓ │
  //  │ │                                │ │     │ ┃ #View                  ┃ │
  //  │ │                                │ │     │ ┃ #StackingContext       ┃ │
  //  │ │                                │ │     │ ┃                        ┃ │
  //  │ │                                │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ┌─ BA (tag: 5) ──────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 9000;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ │ ╔═ BB (tag: 6) ══════════════╗ │ │     │                            │
  //  │ │ ║ *** display: none;         ║ │ │     │                            │
  //  │ │ ║                            ║ │ │━━━━▶│                            │
  //  │ │ ║                            ║ │ │     │                            │
  //  │ │ ║                            ║ │ │     │                            │
  //  │ │ ║ ┌─ BBA (tag: 7) ─────────┐ ║ │ │     │                            │
  //  │ │ ║ │ position: relative;    │ ║ │ │     │                            │
  //  │ │ ║ │ zIndex: 8999;          │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ └────────────────────────┘ ║ │ │     │                            │
  //  │ │ ║ ┌─ BBB (tag: 8) ─────────┐ ║ │ │     │                            │
  //  │ │ ║ │ position: relative;    │ ║ │ │     │                            │
  //  │ │ ║ │ zIndex: 8998;          │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ └────────────────────────┘ ║ │ │     │                            │
  //  │ │ ╚════════════════════════════╝ │ │     │                            │
  //  │ │ ┌─ BC (tag: 9) ──────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 8997;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ │ ┌─ BD (tag: 10) ─────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 8996;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ └────────────────────────────────┘ │     │                            │
  //  └────────────────────────────────────┘     └────────────────────────────┘

  mutateViewShadowNodeProps_(nodeBB_, [](ViewProps& props) {
    auto& yogaStyle = props.yogaStyle;
    yogaStyle.setDisplay(yoga::Display::None);
  });

  testViewTree_([](const StubViewTree& viewTree) {
#ifdef ANDROID
    // T153547836: Android still mounts views with
    // ShadowNodeTraits::Trait::Hidden

    EXPECT_EQ(viewTree.size(), 8);

    // nodeBB_ forms a stacking context
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 5);

    // The root view subviews are [6, 10, 9, 5].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 6);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 10);
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 9);
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 5);
    EXPECT_EQ(viewTree.getRootStubView().children.at(4)->tag, 3);
#else
    EXPECT_EQ(viewTree.size(), 5);

    // The root view has all 4 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 4);

    // The root view subviews are [6, 10, 9, 5].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 10);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 9);
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 5);
    EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 3);
#endif
  });
}
} // namespace facebook::react
