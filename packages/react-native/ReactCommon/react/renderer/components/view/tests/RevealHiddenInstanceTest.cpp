/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <vector>

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

Size frameSize(const std::shared_ptr<const ShadowNode>& shadowNode) {
  return static_cast<const LayoutableShadowNode&>(*shadowNode)
      .getLayoutMetrics()
      .frame.size;
}

std::vector<LayoutMetrics> subtreeLayoutMetrics(const ShadowNode& shadowNode) {
  std::vector<LayoutMetrics> metrics{
      static_cast<const LayoutableShadowNode&>(shadowNode).getLayoutMetrics()};
  for (const auto& child : shadowNode.getChildren()) {
    auto childMetrics = subtreeLayoutMetrics(*child);
    metrics.insert(metrics.end(), childMetrics.begin(), childMetrics.end());
  }
  return metrics;
}

} // namespace

// React keeps the instance of a hidden subtree, commits a `display: none`
// clone of it that shares its children, and appends the instance (or a clone
// of it) again when the subtree is shown. The parameter is the size of the
// instance's child: a zero-sized child keeps its frame when it is zeroed out.
class RevealHiddenInstanceTest : public ::testing::TestWithParam<float> {
 protected:
  RevealHiddenInstanceTest() {
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
                  .props([size = GetParam()] { return sizedProps(size, size); })
                  .children({
                    Element<ViewShadowNode>()
                      .tag(4)
                      .props([] { return sizedProps(10, 10); })
                  })
              })
          });
    // clang-format on

    builder_.build(element);
    commit(rootShadowNode);

    auto hiddenRoot =
        commit(cloneWithChild(*rootShadowNode, cloneHidden(*instance)));

    // An update while hidden starts from the child as laid out in the hidden
    // tree, so the new instance owns a child that is already zeroed out.
    const auto& zeroedOutChild =
        hiddenRoot->getChildren().front()->getChildren().front();
    hiddenChild_ = zeroedOutChild->clone(ShadowNodeFragment{});
    instance_ = cloneWithChild(*instance, hiddenChild_);

    hiddenRoot_ = commit(cloneWithChild(*hiddenRoot, cloneHidden(*instance_)));
  }

  void expectShownWithoutChangingHiddenTree(
      const std::shared_ptr<const ShadowNode>& shownInstance) {
    ASSERT_EQ(
        hiddenRoot_->getChildren().front()->getChildren().front(),
        hiddenChild_);
    const auto hiddenTreeLayoutMetrics = subtreeLayoutMetrics(*hiddenRoot_);

    auto shownRoot = std::static_pointer_cast<RootShadowNode>(
        cloneWithChild(*hiddenRoot_, shownInstance));
    shownRoot->layoutIfNeeded();

    const auto& instance = shownRoot->getChildren().front();
    const auto& child = instance->getChildren().front();
    EXPECT_NE(child, hiddenChild_);
    const std::vector<Size> expectedSizes{
        {.width = 100, .height = 100},
        {.width = GetParam(), .height = GetParam()},
        {.width = 10, .height = 10}};
    EXPECT_EQ(
        (std::vector<Size>{
            frameSize(instance),
            frameSize(child),
            frameSize(child->getChildren().front())}),
        expectedSizes);
    EXPECT_EQ(subtreeLayoutMetrics(*hiddenRoot_), hiddenTreeLayoutMetrics);
  }

  ComponentBuilder builder_{simpleComponentBuilder()};
  std::shared_ptr<RootShadowNode> hiddenRoot_;
  std::shared_ptr<const ShadowNode> instance_;
  std::shared_ptr<const ShadowNode> hiddenChild_;
};

TEST_P(RevealHiddenInstanceTest, showingInstance) {
  expectShownWithoutChangingHiddenTree(instance_);
}

TEST_P(RevealHiddenInstanceTest, showingCloneOfInstance) {
  expectShownWithoutChangingHiddenTree(instance_->clone(ShadowNodeFragment{}));
}

TEST_P(RevealHiddenInstanceTest, showingCloneOfInstanceWithNewNonLayoutProp) {
  auto props = std::make_shared<ViewProps>(
      static_cast<const ViewProps&>(*instance_->getProps()));
  props->backgroundColor = blackColor();
  expectShownWithoutChangingHiddenTree(
      instance_->clone(ShadowNodeFragment{.props = props}));
}

INSTANTIATE_TEST_SUITE_P(
    ChildSizes,
    RevealHiddenInstanceTest,
    ::testing::Values(50.0f, 0.0f));

} // namespace facebook::react
