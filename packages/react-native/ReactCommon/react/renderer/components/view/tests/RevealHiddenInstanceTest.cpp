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

namespace facebook::react {

namespace {

std::shared_ptr<const ViewProps> sizedProps(float width, float height) {
  auto props = std::make_shared<ViewProps>();
  props->yogaStyle.setDimension(
      yoga::Dimension::Width, yoga::StyleSizeLength::points(width));
  props->yogaStyle.setDimension(
      yoga::Dimension::Height, yoga::StyleSizeLength::points(height));
  return props;
}

std::shared_ptr<const ViewProps> displayNoneProps() {
  auto props = std::make_shared<ViewProps>();
  props->yogaStyle.setDisplay(yoga::Display::None);
  return props;
}

std::shared_ptr<ShadowNode> cloneWithChild(
    const ShadowNode& shadowNode,
    const std::shared_ptr<const ShadowNode>& child) {
  auto children =
      std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(
          std::vector<std::shared_ptr<const ShadowNode>>{child});
  return shadowNode.clone(
      ShadowNodeFragment{
          .props = ShadowNodeFragment::propsPlaceholder(),
          .children = children});
}

std::shared_ptr<ShadowNode> cloneHidden(const ShadowNode& shadowNode) {
  return shadowNode.clone(ShadowNodeFragment{.props = displayNoneProps()});
}

std::shared_ptr<RootShadowNode> commit(
    const std::shared_ptr<ShadowNode>& root) {
  auto rootShadowNode = std::static_pointer_cast<RootShadowNode>(root);
  rootShadowNode->layoutIfNeeded();
  rootShadowNode->sealRecursive();
  return rootShadowNode;
}

} // namespace

// React keeps the instance of a hidden subtree, commits a `display: none`
// clone of it that shares its children, and appends the instance itself again
// when the subtree is shown.
TEST(RevealHiddenInstanceTest, showingInstanceDoesNotLayOutCommittedNodes) {
  auto builder = simpleComponentBuilder();
  std::shared_ptr<RootShadowNode> rootShadowNode;
  std::shared_ptr<ViewShadowNode> instance;

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(rootShadowNode)
        .tag(1)
        .props([] {
          auto props = std::make_shared<RootProps>();
          props->layoutConstraints = LayoutConstraints{
              .minimumSize = {.width = 0, .height = 0},
              .maximumSize = {.width = 200, .height = 200}};
          return props;
        })
        .children({
          Element<ViewShadowNode>()
            .reference(instance)
            .tag(2)
            .props([] { return sizedProps(100, 100); })
            .children({
              Element<ViewShadowNode>()
                .tag(3)
                .props([] { return sizedProps(50, 50); })
                .children({
                  Element<ViewShadowNode>()
                    .tag(4)
                    .props([] { return sizedProps(10, 10); })
                })
            })
        });
  // clang-format on

  builder.build(element);
  rootShadowNode->layoutIfNeeded();
  rootShadowNode->sealRecursive();

  auto hiddenRoot =
      commit(cloneWithChild(*rootShadowNode, cloneHidden(*instance)));

  // An update while hidden starts from the child as laid out in the hidden
  // tree, so the new instance owns a child that is already zeroed out.
  const auto& zeroedOutChild =
      hiddenRoot->getChildren().front()->getChildren().front();
  std::shared_ptr<const ShadowNode> updatedChild =
      zeroedOutChild->clone(ShadowNodeFragment{});
  std::shared_ptr<const ShadowNode> updatedInstance =
      cloneWithChild(*instance, updatedChild);

  auto updatedHiddenRoot =
      commit(cloneWithChild(*hiddenRoot, cloneHidden(*updatedInstance)));
  ASSERT_EQ(
      updatedHiddenRoot->getChildren().front()->getChildren().front(),
      updatedChild);

  auto shownRoot = std::static_pointer_cast<RootShadowNode>(
      cloneWithChild(*updatedHiddenRoot, updatedInstance));
  shownRoot->layoutIfNeeded();

  const auto& shownInstance = shownRoot->getChildren().front();
  EXPECT_NE(shownInstance, updatedInstance);
  EXPECT_NE(shownInstance->getChildren().front(), updatedChild);
  EXPECT_EQ(
      static_cast<const ViewShadowNode&>(*shownInstance)
          .getLayoutMetrics()
          .frame.size,
      (Size{.width = 100, .height = 100}));
  EXPECT_EQ(
      static_cast<const ViewShadowNode&>(*shownInstance->getChildren().front())
          .getLayoutMetrics()
          .frame.size,
      (Size{.width = 50, .height = 50}));
}

} // namespace facebook::react
