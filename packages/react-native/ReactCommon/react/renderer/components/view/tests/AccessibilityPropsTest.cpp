/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/view/AccessibilityPrimitives.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsParser.h>

namespace facebook::react {

namespace {

// AccessibilityProps is a mixin rather than a Props descendant, so it is
// parsed through ViewProps, the concrete type that inherits it.
ViewProps parse(
    const folly::dynamic& rawPropsValue,
    const ViewProps& sourceProps = ViewProps()) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(rawPropsValue);
  auto parser = RawPropsParser();
  parser.prepare<ViewProps>();
  raw.parse(parser);

  return {parserContext, sourceProps, raw};
}

bool hasTrait(AccessibilityTraits traits, AccessibilityTraits expected) {
  return (traits & expected) == expected;
}

} // namespace

TEST(AccessibilityPropsTest, derives_traits_from_role) {
  auto props = parse(folly::dynamic::object("role", "button"));

  EXPECT_TRUE(hasTrait(props.accessibilityTraits, AccessibilityTraits::Button));
}

TEST(AccessibilityPropsTest, derives_traits_from_accessibility_role) {
  auto props = parse(folly::dynamic::object("accessibilityRole", "image"));

  EXPECT_TRUE(hasTrait(props.accessibilityTraits, AccessibilityTraits::Image));
}

TEST(AccessibilityPropsTest, role_takes_precedence_over_accessibility_role) {
  auto props = parse(
      folly::dynamic::object("role", "button")("accessibilityRole", "image"));

  EXPECT_TRUE(hasTrait(props.accessibilityTraits, AccessibilityTraits::Button));
  EXPECT_FALSE(hasTrait(props.accessibilityTraits, AccessibilityTraits::Image));
}

// The selected/disabled bits used to be applied by RCTViewComponentView on top
// of the role-derived bitmask, which meant they were lost whenever the traits
// were rewritten. They are now folded in at the props layer.
TEST(AccessibilityPropsTest, folds_selected_state_into_role_traits) {
  auto props = parse(
      folly::dynamic::object("role", "button")(
          "accessibilityState", folly::dynamic::object("selected", true)));

  EXPECT_TRUE(hasTrait(props.accessibilityTraits, AccessibilityTraits::Button));
  EXPECT_TRUE(
      hasTrait(props.accessibilityTraits, AccessibilityTraits::Selected));
}

TEST(AccessibilityPropsTest, folds_disabled_state_into_role_traits) {
  auto props = parse(
      folly::dynamic::object("role", "button")(
          "accessibilityState", folly::dynamic::object("disabled", true)));

  EXPECT_TRUE(hasTrait(props.accessibilityTraits, AccessibilityTraits::Button));
  EXPECT_TRUE(
      hasTrait(props.accessibilityTraits, AccessibilityTraits::NotEnabled));
}

TEST(AccessibilityPropsTest, omits_state_traits_when_state_is_absent) {
  auto props = parse(folly::dynamic::object("role", "button"));

  EXPECT_FALSE(
      hasTrait(props.accessibilityTraits, AccessibilityTraits::Selected));
  EXPECT_FALSE(
      hasTrait(props.accessibilityTraits, AccessibilityTraits::NotEnabled));
}

// A recycled view is re-parsed against the previous mount's props as source.
// Clearing selected must drop the trait rather than leave it latched on.
TEST(AccessibilityPropsTest, clearing_selected_state_drops_the_trait) {
  auto selected = parse(
      folly::dynamic::object("role", "button")(
          "accessibilityState", folly::dynamic::object("selected", true)));
  ASSERT_TRUE(
      hasTrait(selected.accessibilityTraits, AccessibilityTraits::Selected));

  auto cleared = parse(
      folly::dynamic::object("role", "button")(
          "accessibilityState", folly::dynamic::object("selected", false)),
      selected);

  EXPECT_TRUE(
      hasTrait(cleared.accessibilityTraits, AccessibilityTraits::Button));
  EXPECT_FALSE(
      hasTrait(cleared.accessibilityTraits, AccessibilityTraits::Selected));
}

TEST(AccessibilityPropsTest, inherits_role_traits_when_raw_props_are_absent) {
  auto source = parse(folly::dynamic::object("role", "button"));

  auto props = parse(folly::dynamic::object("nativeID", "abc"), source);

  EXPECT_TRUE(hasTrait(props.accessibilityTraits, AccessibilityTraits::Button));
}

} // namespace facebook::react
