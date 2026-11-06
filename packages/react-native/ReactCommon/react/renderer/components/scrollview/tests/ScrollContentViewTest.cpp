/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/scrollview/ScrollContentViewComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollContentViewShadowNode.h>

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>

namespace facebook::react {

namespace {

using yoga::Edge;
using yoga::StyleLength;

ScrollContentViewState stateWith(
    EdgeInsets safeAreaPadding,
    bool swapLeftAndRightInRTL = false) {
  ScrollContentViewState state;
  state.safeAreaPadding = safeAreaPadding;
  state.swapLeftAndRightInRTL = swapLeftAndRightInRTL;
  return state;
}

ScrollContentViewState stateWithContentInset(
    EdgeInsets contentInsetAdjustment) {
  ScrollContentViewState state;
  state.contentInsetAdjustment = contentInsetAdjustment;
  return state;
}

constexpr auto kLTR = LayoutDirection::LeftToRight;
constexpr auto kRTL = LayoutDirection::RightToLeft;

} // namespace

TEST(ScrollContentViewShadowNodeTest, leavesStyleWithoutInsets) {
  yoga::Style style;
  style.setPadding(Edge::Left, StyleLength::points(8));

  ScrollContentViewShadowNode::padForSafeArea(style, stateWith({}), kLTR);

  EXPECT_EQ(style.padding(Edge::Left), StyleLength::points(8));
  EXPECT_FALSE(style.padding(Edge::Start).isDefined());
}

TEST(ScrollContentViewShadowNodeTest, raisesRowPaddingToTheInset) {
  yoga::Style style;
  style.setPadding(Edge::Horizontal, StyleLength::points(16));

  ScrollContentViewShadowNode::padForSafeArea(
      style, stateWith({.left = 0, .top = 0, .right = 84, .bottom = 0}), kLTR);

  EXPECT_EQ(style.padding(Edge::Start), StyleLength::points(16));
  EXPECT_EQ(style.padding(Edge::End), StyleLength::points(84));
  EXPECT_FALSE(style.padding(Edge::Left).isDefined());
  EXPECT_FALSE(style.padding(Edge::Right).isDefined());
}

TEST(ScrollContentViewShadowNodeTest, keepsPaddingLargerThanTheInset) {
  yoga::Style style;
  style.setPadding(Edge::Horizontal, StyleLength::points(100));

  ScrollContentViewShadowNode::padForSafeArea(
      style, stateWith({.left = 0, .top = 0, .right = 84, .bottom = 0}), kLTR);

  EXPECT_EQ(style.padding(Edge::Start), StyleLength::points(100));
  EXPECT_EQ(style.padding(Edge::End), StyleLength::points(100));
}

TEST(ScrollContentViewShadowNodeTest, prefersLogicalOverPhysicalEdge) {
  yoga::Style style;
  style.setPadding(Edge::Left, StyleLength::points(4));
  style.setPadding(Edge::Start, StyleLength::points(40));

  ScrollContentViewShadowNode::padForSafeArea(
      style, stateWith({.left = 20, .top = 0, .right = 0, .bottom = 0}), kLTR);

  EXPECT_EQ(style.padding(Edge::Start), StyleLength::points(40));
}

TEST(ScrollContentViewShadowNodeTest, keepsPercentageAndSkipsInsetOnThatEdge) {
  yoga::Style style;
  style.setPadding(Edge::Horizontal, StyleLength::percent(10));

  ScrollContentViewShadowNode::padForSafeArea(
      style, stateWith({.left = 20, .top = 0, .right = 0, .bottom = 0}), kLTR);

  EXPECT_EQ(style.padding(Edge::Start), StyleLength::percent(10));
  EXPECT_EQ(style.padding(Edge::End), StyleLength::percent(10));
  EXPECT_FALSE(style.padding(Edge::Left).isDefined());
}

TEST(ScrollContentViewShadowNodeTest, padsPointsEdgeBesideAPercentageEdge) {
  yoga::Style style;
  style.setPadding(Edge::Left, StyleLength::percent(10));
  style.setPadding(Edge::Right, StyleLength::points(4));

  ScrollContentViewShadowNode::padForSafeArea(
      style, stateWith({.left = 20, .top = 0, .right = 84, .bottom = 0}), kLTR);

  EXPECT_EQ(style.padding(Edge::Start), StyleLength::percent(10));
  EXPECT_EQ(style.padding(Edge::End), StyleLength::points(84));
}

TEST(ScrollContentViewShadowNodeTest, padsPhysicalEdgesInRTL) {
  yoga::Style style;
  style.setPadding(Edge::Start, StyleLength::points(12));

  ScrollContentViewShadowNode::padForSafeArea(
      style, stateWith({.left = 0, .top = 0, .right = 84, .bottom = 0}), kRTL);

  // In RTL the start edge is on the right, where the inset is.
  EXPECT_EQ(style.padding(Edge::Start), StyleLength::points(84));
  EXPECT_FALSE(style.padding(Edge::End).isDefined());
}

TEST(ScrollContentViewShadowNodeTest, readsSwappedPhysicalEdgesInRTL) {
  yoga::Style style;
  style.setPadding(Edge::Left, StyleLength::points(8));
  style.setPadding(Edge::End, StyleLength::points(2));

  ScrollContentViewShadowNode::padForSafeArea(
      style,
      stateWith({.left = 84, .top = 0, .right = 0, .bottom = 0}, true),
      kRTL);

  // Left is copied over start at layout, so it lands on the right, and the
  // inset on the left raises the end edge.
  EXPECT_EQ(style.padding(Edge::Start), StyleLength::points(8));
  EXPECT_EQ(style.padding(Edge::End), StyleLength::points(84));
  EXPECT_FALSE(style.padding(Edge::Left).isDefined());
}

TEST(ScrollContentViewShadowNodeTest, readsSwappedPhysicalEdgesInLTRSubtree) {
  yoga::Style style;
  style.setPadding(Edge::Left, StyleLength::points(100));
  style.setPadding(Edge::Start, StyleLength::points(2));

  ScrollContentViewShadowNode::padForSafeArea(
      style,
      stateWith({.left = 84, .top = 0, .right = 0, .bottom = 0}, true),
      kLTR);

  // The swap applies to the whole tree, so left is still copied over start,
  // which a node laid out left to right keeps on the left.
  EXPECT_EQ(style.padding(Edge::Start), StyleLength::points(100));
  EXPECT_FALSE(style.padding(Edge::End).isDefined());
}

TEST(ScrollContentViewShadowNodeTest, padsColumnForHorizontalScrollView) {
  yoga::Style style;
  style.setPadding(Edge::Vertical, StyleLength::points(4));

  ScrollContentViewShadowNode::padForSafeArea(
      style, stateWith({.left = 0, .top = 20, .right = 0, .bottom = 34}), kLTR);

  EXPECT_EQ(style.padding(Edge::Top), StyleLength::points(20));
  EXPECT_EQ(style.padding(Edge::Bottom), StyleLength::points(34));
  EXPECT_EQ(style.padding(Edge::Vertical), StyleLength::points(4));
}

TEST(ScrollContentViewShadowNodeTest, reducesColumnPaddingByTheContentInset) {
  yoga::Style style;
  style.setPadding(Edge::Vertical, StyleLength::points(20));

  ScrollContentViewShadowNode::padForSafeArea(
      style,
      stateWithContentInset({.left = 0, .top = 59, .right = 0, .bottom = 34}),
      kLTR);

  // UIKit's content inset already keeps the content clear of the safe area
  // along the scrollable axis, so a smaller padding sits inside it.
  EXPECT_EQ(style.padding(Edge::Top), StyleLength::points(0));
  EXPECT_EQ(style.padding(Edge::Bottom), StyleLength::points(0));
}

TEST(ScrollContentViewShadowNodeTest, keepsColumnPaddingBeyondTheContentInset) {
  yoga::Style style;
  style.setPadding(Edge::Vertical, StyleLength::points(100));

  ScrollContentViewShadowNode::padForSafeArea(
      style,
      stateWithContentInset({.left = 0, .top = 59, .right = 0, .bottom = 34}),
      kLTR);

  EXPECT_EQ(style.padding(Edge::Top), StyleLength::points(41));
  EXPECT_EQ(style.padding(Edge::Bottom), StyleLength::points(66));
}

TEST(ScrollContentViewShadowNodeTest, reducesRowPaddingByTheContentInsetInRTL) {
  yoga::Style style;
  style.setPadding(Edge::Horizontal, StyleLength::points(100));

  ScrollContentViewShadowNode::padForSafeArea(
      style,
      stateWithContentInset({.left = 59, .top = 0, .right = 0, .bottom = 0}),
      kRTL);

  // In RTL the end edge is on the left, where the content inset is.
  EXPECT_EQ(style.padding(Edge::Start), StyleLength::points(100));
  EXPECT_EQ(style.padding(Edge::End), StyleLength::points(41));
}

TEST(ScrollContentViewShadowNodeTest, keepsPercentageBesideTheContentInset) {
  yoga::Style style;
  style.setPadding(Edge::Vertical, StyleLength::percent(10));

  ScrollContentViewShadowNode::padForSafeArea(
      style,
      stateWithContentInset({.left = 0, .top = 59, .right = 0, .bottom = 0}),
      kLTR);

  EXPECT_EQ(style.padding(Edge::Top), StyleLength::percent(10));
  EXPECT_EQ(style.padding(Edge::Bottom), StyleLength::percent(10));
}

TEST(ScrollContentViewShadowNodeTest, cloningForChildCommitMustNotDirty) {
  ComponentDescriptorProviderRegistry providerRegistry{};
  auto registry = providerRegistry.createComponentDescriptorRegistry(
      ComponentDescriptorParameters{});
  providerRegistry.add(
      concreteComponentDescriptorProvider<RootComponentDescriptor>());
  providerRegistry.add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());
  providerRegistry.add(
      concreteComponentDescriptorProvider<
          ScrollContentViewComponentDescriptor>());
  ComponentBuilder builder{registry};

  std::shared_ptr<RootShadowNode> rootShadowNode;
  std::shared_ptr<ViewShadowNode> childShadowNode;
  // clang-format off
  builder.build(
      Element<RootShadowNode>()
        .reference(rootShadowNode)
        .tag(1)
        .children({
          Element<ScrollContentViewShadowNode>()
            .tag(2)
            .stateData([](ScrollContentViewState &state) {
              state.safeAreaPadding = {.left = 0, .top = 0, .right = 84, .bottom = 0};
            })
            .children({
              Element<ViewShadowNode>()
                .tag(3)
                .reference(childShadowNode)
            })
        }));
  // clang-format on
  rootShadowNode->layoutIfNeeded();

  auto newRootShadowNode = rootShadowNode->cloneTree(
      childShadowNode->getFamily(), [](const ShadowNode& oldShadowNode) {
        auto viewProps = std::make_shared<ViewProps>();
        viewProps->backgroundColor = blackColor();
        return oldShadowNode.clone({.props = viewProps});
      });

  EXPECT_FALSE(
      static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded());
}

} // namespace facebook::react
