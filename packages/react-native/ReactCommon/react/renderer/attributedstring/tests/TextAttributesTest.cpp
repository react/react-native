/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/attributedstring/TextAttributes.h>

namespace facebook::react {

// A fragment that sets accessibilityRole=link while inheriting role=heading
// must not carry the inherited role forward (they are aliases).
TEST(TextAttributesTest, explicitAccessibilityRoleReplacesInheritedRole) {
  class Flag : public ReactNativeFeatureFlagsDefaults {
    bool enableAliasedTextRoleInheritance() override {
      return true;
    }
  };
  ReactNativeFeatureFlags::override(std::make_unique<Flag>());

  auto attributes = TextAttributes{};
  attributes.role = Role::Heading;
  auto fragment = TextAttributes{};
  fragment.accessibilityRole = AccessibilityRole::Link;
  attributes.apply(fragment);

  EXPECT_FALSE(attributes.role.has_value());
  EXPECT_EQ(attributes.accessibilityRole, AccessibilityRole::Link);

  ReactNativeFeatureFlags::dangerouslyReset();
}

} // namespace facebook::react
