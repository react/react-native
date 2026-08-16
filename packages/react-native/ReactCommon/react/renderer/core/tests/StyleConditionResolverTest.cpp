/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <vector>

#include <folly/dynamic.h>
#include <gtest/gtest.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/StyleConditionPrimitives.h>
#include <react/renderer/core/StyleConditionResolver.h>
#include <react/utils/ContextContainer.h>

#include "TestComponent.h"

using namespace facebook::react;

namespace {

// opacity resolves to 0.5 while `orientation: landscape` matches, else its
// default 1.0.
folly::dynamic conditionalOpacityRawProps() {
  return folly::dynamic::object("opacity", 1.0)(
      "styleConditions",
      folly::dynamic::object(
          "opacity",
          folly::dynamic::array(folly::dynamic::object(
              "query",
              folly::dynamic::object("orientation", "landscape"))(
              "value", 0.5))));
}

} // namespace

class StyleConditionResolverTest : public ::testing::Test {
 protected:
  SharedComponentDescriptor descriptor_ =
      std::make_shared<TestComponentDescriptor>(ComponentDescriptorParameters{
          .eventDispatcher = std::shared_ptr<const EventDispatcher>(),
          .contextContainer = nullptr,
          .flavor = nullptr});
  ContextContainer contextContainer_{};
  PropsParserContext parserContext_{-1, contextContainer_};
  int nextTag_ = 1;

  std::shared_ptr<const ShadowNode> makeNode(
      folly::dynamic rawProps,
      const std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>>&
          children = nullptr) {
    auto props =
        descriptor_->cloneProps(parserContext_, nullptr, RawProps(rawProps));
    auto family = descriptor_->createFamily(
        ShadowNodeFamilyFragment{
            .tag = nextTag_++, .surfaceId = 1, .instanceHandle = nullptr});
    return descriptor_->createShadowNode(
        ShadowNodeFragment{
            .props = props,
            .children = children != nullptr
                ? children
                : ShadowNodeFragment::childrenPlaceholder()},
        family);
  }

  std::shared_ptr<const ShadowNode> makeConditionalNode() {
    return makeNode(conditionalOpacityRawProps());
  }

  static float opacityOf(const ShadowNode& node) {
    return static_cast<const TestProps&>(*node.getProps()).opacity;
  }

  std::shared_ptr<const ShadowNode> resolve(
      const std::shared_ptr<const ShadowNode>& node,
      Orientation orientation) {
    return resolveStyleConditionsInSubtree(
        node, ColorScheme::Light, orientation, parserContext_);
  }
};

TEST_F(StyleConditionResolverTest, resolvesAMatchingConditionAgainstOrientation) {
  auto node = makeConditionalNode();
  ASSERT_FLOAT_EQ(opacityOf(*node), 1.0f); // unresolved default

  auto resolved = resolve(node, Orientation::Landscape);
  EXPECT_NE(resolved, node);
  EXPECT_FLOAT_EQ(opacityOf(*resolved), 0.5f); // landscape -> matches
}

TEST_F(StyleConditionResolverTest, leavesTheNodeUntouchedWhenNothingMatches) {
  auto node = makeConditionalNode();

  auto resolved = resolve(node, Orientation::Portrait);
  EXPECT_EQ(resolved, node); // no change -> same pointer
  EXPECT_FLOAT_EQ(opacityOf(*resolved), 1.0f); // portrait -> default
}

TEST_F(StyleConditionResolverTest, reResolvesWhenTheEnvironmentChanges) {
  auto node = makeConditionalNode();
  auto landscape = resolve(node, Orientation::Landscape);
  ASSERT_FLOAT_EQ(opacityOf(*landscape), 0.5f);

  // Rotating back to portrait: re-resolving the *patched* node must revert it
  // to the default. This is the environment-change path that the Fantom E2E
  // cannot drive.
  auto portrait = resolve(landscape, Orientation::Portrait);
  EXPECT_NE(portrait, landscape);
  EXPECT_FLOAT_EQ(opacityOf(*portrait), 1.0f);
}

TEST_F(StyleConditionResolverTest, prunesSubtreesWithoutConditions) {
  auto node = makeNode(folly::dynamic::object("opacity", 1.0));

  auto resolved = resolve(node, Orientation::Landscape);
  EXPECT_EQ(resolved, node); // no trait -> returned as-is, no walk
}

TEST_F(StyleConditionResolverTest, resolvesAConditionalChildThroughAPlainParent) {
  auto child = makeConditionalNode();
  auto children =
      std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(
          std::vector<std::shared_ptr<const ShadowNode>>{child});
  auto parent = makeNode(folly::dynamic::object("opacity", 1.0), children);

  // The parent is plain but inherited `HasStyleConditionsInSubtree` from the
  // child, so the walk descends and the child resolves.
  auto resolved = resolve(parent, Orientation::Landscape);
  EXPECT_NE(resolved, parent);
  ASSERT_EQ(resolved->getChildren().size(), 1u);
  EXPECT_FLOAT_EQ(opacityOf(*resolved->getChildren()[0]), 0.5f);
}
