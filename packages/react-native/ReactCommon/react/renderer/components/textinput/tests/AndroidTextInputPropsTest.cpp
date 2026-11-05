/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#if defined(ANDROID) && defined(RN_SERIALIZABLE_STATE)

#include <react/renderer/components/androidtextinput/AndroidTextInputShadowNode.h>

namespace facebook::react {

// Props diffing is only used when the props target matches the component name.
TEST(AndroidTextInputPropsTest, diffPropsTargetMatchesComponentName) {
  EXPECT_STREQ(
      AndroidTextInputProps().getDiffPropsImplementationTarget(),
      AndroidTextInputShadowNode::Name());
}

// Values equal to the C++ default are not sent on creation, so the C++ default
// has to match the state of a newly created native view.
TEST(AndroidTextInputPropsTest, diffSendsValuesThatDifferFromNativeDefaults) {
  AndroidTextInputProps props;
  props.showSoftInputOnFocus = false;
  props.allowFontScaling = false;
  props.autoCorrect = false;

  auto diff = props.getDiffProps(nullptr);

  EXPECT_EQ(diff["showSoftInputOnFocus"], false);
  EXPECT_EQ(diff["allowFontScaling"], false);
  EXPECT_EQ(diff["autoCorrect"], false);
}

TEST(AndroidTextInputPropsTest, diffOfDefaultPropsIsEmpty) {
  EXPECT_TRUE(AndroidTextInputProps().getDiffProps(nullptr).empty());
}

TEST(AndroidTextInputPropsTest, removedAutoCorrectIsSentAsNull) {
  AndroidTextInputProps oldProps;
  oldProps.autoCorrect = false;

  auto diff = AndroidTextInputProps().getDiffProps(&oldProps);

  ASSERT_EQ(diff.count("autoCorrect"), 1);
  EXPECT_TRUE(diff["autoCorrect"].isNull());
}

// `includeFontPadding` is sent from the paragraph attributes only, whose
// default matches the native default.
TEST(AndroidTextInputPropsTest, removedIncludeFontPaddingIsNotSentAsFalse) {
  AndroidTextInputProps oldProps;
  oldProps.includeFontPadding = true;

  auto diff = AndroidTextInputProps().getDiffProps(&oldProps);

  EXPECT_EQ(diff.count("includeFontPadding"), 0);
}

} // namespace facebook::react

#endif
