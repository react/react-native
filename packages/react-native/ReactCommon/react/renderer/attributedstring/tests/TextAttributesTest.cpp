/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <memory>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/attributedstring/TextAttributes.h>

namespace facebook::react {

class TextAttributesTest : public ::testing::TestWithParam<bool> {
 protected:
  void SetUp() override {
    ReactNativeFeatureFlags::dangerouslyReset();
    ReactNativeFeatureFlags::override(std::make_unique<Flags>(GetParam()));
  }

  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }

 private:
  class Flags : public ReactNativeFeatureFlagsDefaults {
   public:
    explicit Flags(bool enabled) : enabled_(enabled) {}

    bool enableAliasedTextRoleInheritance() override {
      return enabled_;
    }

   private:
    bool enabled_;
  };
};

TEST_P(TextAttributesTest, explicitAccessibilityRoleReplacesInheritedRole) {
  auto attributes = TextAttributes{};
  attributes.role = Role::Heading;
  auto fragment = TextAttributes{};
  fragment.accessibilityRole = AccessibilityRole::Link;
  attributes.apply(fragment);

  if (GetParam()) {
    EXPECT_FALSE(attributes.role.has_value());
  } else {
    EXPECT_EQ(attributes.role, Role::Heading);
  }
  EXPECT_EQ(attributes.accessibilityRole, AccessibilityRole::Link);
}

TEST_P(TextAttributesTest, explicitRoleReplacesInheritedAccessibilityRole) {
  auto attributes = TextAttributes{};
  attributes.accessibilityRole = AccessibilityRole::Link;
  auto fragment = TextAttributes{};
  fragment.role = Role::Heading;
  attributes.apply(fragment);

  EXPECT_EQ(attributes.role, Role::Heading);
  if (GetParam()) {
    EXPECT_FALSE(attributes.accessibilityRole.has_value());
  } else {
    EXPECT_EQ(attributes.accessibilityRole, AccessibilityRole::Link);
  }
}

TEST_P(TextAttributesTest, unspecifiedRolesInheritBothAliases) {
  auto attributes = TextAttributes{};
  attributes.role = Role::Heading;
  attributes.accessibilityRole = AccessibilityRole::Link;
  auto fragment = TextAttributes{};
  fragment.fontSize = 18;
  attributes.apply(fragment);

  EXPECT_EQ(attributes.role, Role::Heading);
  EXPECT_EQ(attributes.accessibilityRole, AccessibilityRole::Link);
  EXPECT_EQ(attributes.fontSize, 18);
}

TEST_P(TextAttributesTest, explicitAliasesReplaceBothInheritedValues) {
  auto attributes = TextAttributes{};
  attributes.role = Role::Heading;
  attributes.accessibilityRole = AccessibilityRole::Link;
  auto fragment = TextAttributes{};
  fragment.role = Role::Button;
  fragment.accessibilityRole = AccessibilityRole::Button;
  attributes.apply(fragment);

  EXPECT_EQ(attributes.role, Role::Button);
  EXPECT_EQ(attributes.accessibilityRole, AccessibilityRole::Button);
}

INSTANTIATE_TEST_SUITE_P(
    AliasedRoleInheritance,
    TextAttributesTest,
    ::testing::Bool());

} // namespace facebook::react
