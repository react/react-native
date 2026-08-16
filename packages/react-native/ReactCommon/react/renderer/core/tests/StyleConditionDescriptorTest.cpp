/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <folly/dynamic.h>
#include <gtest/gtest.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/StyleConditionData.h>
#include <react/renderer/core/StyleConditionPrimitives.h>
#include <react/utils/ContextContainer.h>

#include "TestComponent.h"

using namespace facebook::react;

namespace {

// A conditional value expressed on `opacity` because it round-trips as a plain
// public `Float` we can read straight back off the props (unlike a Yoga
// dimension): default 1.0, becoming 0.5 while `orientation: landscape` matches.
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

class StyleConditionDescriptorTest : public ::testing::Test {
 protected:
  SharedComponentDescriptor descriptor_ =
      std::make_shared<TestComponentDescriptor>(ComponentDescriptorParameters{
          .eventDispatcher = std::shared_ptr<const EventDispatcher>(),
          .contextContainer = nullptr,
          .flavor = nullptr});
  ContextContainer contextContainer_{};
  PropsParserContext parserContext_{-1, contextContainer_};

  Props::Shared makeConditionalProps() {
    return descriptor_->cloneProps(
        parserContext_, nullptr, RawProps(conditionalOpacityRawProps()));
  }

  static float opacityOf(const Props::Shared& props) {
    return static_cast<const TestProps&>(*props).opacity;
  }
};

#pragma mark - applyStyleConditionResolution (base -> patched)

TEST_F(StyleConditionDescriptorTest, matchedResolutionPatchesAndRecordsBase) {
  auto base = makeConditionalProps();
  ASSERT_NE(base->styleConditionData, nullptr);
  EXPECT_FLOAT_EQ(opacityOf(base), 1.0f); // inline default
  // A freshly parsed conditional node is its own base.
  EXPECT_EQ(base->styleConditionData->unpatchedProps, nullptr);

  auto patched = descriptor_->applyStyleConditionResolution(
      parserContext_, base, StyleConditionResolution{0});

  EXPECT_NE(patched, base); // a distinct props object
  EXPECT_FLOAT_EQ(opacityOf(patched), 0.5f); // matched value applied
  ASSERT_NE(patched->styleConditionData, nullptr);
  // Back-pointer to the clean base, and the new resolution recorded.
  EXPECT_EQ(patched->styleConditionData->unpatchedProps, base);
  EXPECT_EQ(
      patched->styleConditionData->resolution, (StyleConditionResolution{0}));
}

TEST_F(StyleConditionDescriptorTest, alreadyAppliedResolutionIsANoOp) {
  auto base = makeConditionalProps();
  auto patched = descriptor_->applyStyleConditionResolution(
      parserContext_, base, StyleConditionResolution{0});

  // Re-applying the identical resolution must return the same pointer, so the
  // commit hook's `resolvedProps != props` check skips a needless clone.
  auto again = descriptor_->applyStyleConditionResolution(
      parserContext_, patched, StyleConditionResolution{0});
  EXPECT_EQ(again, patched);
}

TEST_F(StyleConditionDescriptorTest, revertingReturnsTheOriginalUnpatchedBase) {
  auto base = makeConditionalProps();
  auto patched = descriptor_->applyStyleConditionResolution(
      parserContext_, base, StyleConditionResolution{0});
  ASSERT_FLOAT_EQ(opacityOf(patched), 0.5f);

  // Nothing matches now: should hand back the *original* base (single hop),
  // not a freshly built all-default props.
  auto reverted = descriptor_->applyStyleConditionResolution(
      parserContext_, patched, StyleConditionResolution{kNoMatchingCondition});
  EXPECT_EQ(reverted, base);
  EXPECT_FLOAT_EQ(opacityOf(reverted), 1.0f);
}

TEST_F(StyleConditionDescriptorTest, nonConditionalPropsAreUntouched) {
  auto props = descriptor_->cloneProps(
      parserContext_, nullptr, RawProps(folly::dynamic::object("opacity", 1.0)));
  ASSERT_EQ(props->styleConditionData, nullptr);

  auto result = descriptor_->applyStyleConditionResolution(
      parserContext_, props, StyleConditionResolution{0});
  EXPECT_EQ(result, props); // no styleConditionData -> returned as-is
}

#pragma mark - cloneProps (patched -> re-based on partial updates)

TEST_F(StyleConditionDescriptorTest, partialUpdateRebasesOntoUnpatchedBase) {
  auto base = makeConditionalProps();
  auto patched = descriptor_->applyStyleConditionResolution(
      parserContext_, base, StyleConditionResolution{0});
  ASSERT_FLOAT_EQ(opacityOf(patched), 0.5f);

  // A React update that doesn't mention opacity. Parsing it over the *patched*
  // props would bake in 0.5; re-basing onto unpatchedProps keeps the default.
  auto updated = descriptor_->cloneProps(
      parserContext_,
      patched,
      RawProps(folly::dynamic::object("nativeID", "x")));

  EXPECT_FLOAT_EQ(opacityOf(updated), 1.0f); // no leak of the patched value
  EXPECT_STREQ(updated->nativeId.c_str(), "x");
}

TEST_F(StyleConditionDescriptorTest, removingConditionsClearsDataAndReverts) {
  auto base = makeConditionalProps();
  auto patched = descriptor_->applyStyleConditionResolution(
      parserContext_, base, StyleConditionResolution{0});
  ASSERT_FLOAT_EQ(opacityOf(patched), 0.5f);

  // JS removes the conditional value entirely -> the diff emits
  // `styleConditions: null`.
  auto removed = descriptor_->cloneProps(
      parserContext_,
      patched,
      RawProps(folly::dynamic::object("styleConditions", nullptr)));

  EXPECT_EQ(removed->styleConditionData, nullptr); // conditions cleared
  EXPECT_FLOAT_EQ(opacityOf(removed), 1.0f); // reverted to the base default
}
