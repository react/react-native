/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/fabric/FocusOrderingHelper.h>

#include <gtest/gtest.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

#include <memory>
#include <vector>

namespace facebook::react {

class FocusOrderingHelperTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<ViewShadowNode> contentContainer_;
  std::shared_ptr<ViewShadowNode> directChild_;
  std::shared_ptr<ViewShadowNode> nestedChild_;
  std::shared_ptr<ViewShadowNode> detachedNode_;

  FocusOrderingHelperTest() : builder_(simpleComponentBuilder()) {
    // clang-format off
    auto element =
        Element<ViewShadowNode>()
          .reference(contentContainer_)
          .tag(1)
          .children({
            Element<ViewShadowNode>()
              .reference(directChild_)
              .tag(2),
            Element<ViewShadowNode>()
              .tag(3)
              .children({
                Element<ViewShadowNode>()
                  .tag(4)
                  .children({
                    Element<ViewShadowNode>()
                      .reference(nestedChild_)
                      .tag(5)
                  })
              })
          });
    // clang-format on

    builder_.build(element);
    builder_.build(Element<ViewShadowNode>().reference(detachedNode_).tag(6));
  }
};

TEST_F(FocusOrderingHelperTest, testDirectChildHasNoAncestorsBelowTheRoot) {
  auto ancestorTags = FocusOrderingHelper::getRelativeAncestorTags(
      *contentContainer_, *directChild_);

  ASSERT_TRUE(ancestorTags.has_value());
  EXPECT_TRUE(ancestorTags->empty());
}

TEST_F(
    FocusOrderingHelperTest,
    testNestedChildListsItsAncestorsBelowTheRootOutermostFirst) {
  auto ancestorTags = FocusOrderingHelper::getRelativeAncestorTags(
      *contentContainer_, *nestedChild_);

  ASSERT_TRUE(ancestorTags.has_value());
  EXPECT_EQ(std::vector<Tag>({3, 4}), *ancestorTags);
}

TEST_F(FocusOrderingHelperTest, testNodeOutsideTheRootHasNoAncestorList) {
  auto ancestorTags = FocusOrderingHelper::getRelativeAncestorTags(
      *contentContainer_, *detachedNode_);

  EXPECT_FALSE(ancestorTags.has_value());
}

TEST_F(FocusOrderingHelperTest, testRootHasNoAncestorListRelativeToItself) {
  auto ancestorTags = FocusOrderingHelper::getRelativeAncestorTags(
      *contentContainer_, *contentContainer_);

  EXPECT_FALSE(ancestorTags.has_value());
}

} // namespace facebook::react
