/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#if defined(ANDROID) && defined(RN_SERIALIZABLE_STATE)

#include <react/renderer/components/androidtextinput/AndroidTextInputProps.h>
#include <react/test_utils/PropsPayloads.h>

namespace facebook::react {

// ReactTextInputManager only sets up the event watchers when these props are
// sent. JS sends a handler as `true`, and false resets it like null does.
TEST(AndroidTextInputPropsDiffTest, eventHandlerPropsAreSent) {
  using folly::dynamic;
  expectPayloadsMatchRawProps<AndroidTextInputProps>({
      {dynamic::object("onKeyPress", true)("onSelectionChange", true)(
          "onContentSizeChange", true)("onScroll", true)},
      {dynamic::object("onKeyPress", nullptr)("onSelectionChange", nullptr)(
           "onContentSizeChange", nullptr)("onScroll", nullptr),
       dynamic::object("onKeyPress", false)("onSelectionChange", false)(
           "onContentSizeChange", false)("onScroll", false)},
  });
}

// Text typed into an empty input uses the color of the native view, not the
// color in the attributed string of the state.
TEST(AndroidTextInputPropsDiffTest, colorIsSent) {
  using folly::dynamic;
  expectPayloadsMatchRawProps<AndroidTextInputProps>({
      {dynamic::object("color", static_cast<int32_t>(0xFFFF0000))},
      {dynamic::object("color", 0)},
      {dynamic::object("color", nullptr)},
  });
}

TEST(AndroidTextInputPropsDiffTest, removedColorsAreSentAsNull) {
  using folly::dynamic;
  for (const auto* prop :
       {"placeholderTextColor",
        "selectionColor",
        "selectionHandleColor",
        "cursorColor",
        "underlineColorAndroid",
        "textShadowColor"}) {
    expectPayloadsMatchRawProps<AndroidTextInputProps>({
        {dynamic::object(prop, static_cast<int32_t>(0xFFFF0000))},
        {dynamic::object(prop, nullptr)},
    });
  }
}

// 0 is the default of the flat field, and a font size of 0 hides the
// placeholder and new text.
TEST(AndroidTextInputPropsDiffTest, removedFontSizeIsSentAsNull) {
  using folly::dynamic;
  expectPayloadsMatchRawProps<AndroidTextInputProps>({
      {dynamic::object("fontSize", 20)},
      {dynamic::object("fontSize", 0)},
      {dynamic::object("fontSize", 20)},
      {dynamic::object("fontSize", nullptr)},
  });
}

// ReactTextInputManager reads an array, and supports values that the
// FontVariant enum in the text attributes can't represent.
TEST(AndroidTextInputPropsDiffTest, fontVariantIsSentAsAnArray) {
  using folly::dynamic;
  expectPayloadsMatchRawProps<AndroidTextInputProps>({
      {dynamic::object(
          "fontVariant", dynamic::array("small-caps", "common-ligatures"))},
      {dynamic::object("fontVariant", dynamic::array())},
      {dynamic::object("fontVariant", nullptr)},
  });
}

// ReactTextInputManager treats an empty string differently from null for these:
// a blank IME action label, or a warning about an invalid value.
TEST(AndroidTextInputPropsDiffTest, removedStringsAreSentAsNull) {
  using folly::dynamic;
  expectPayloadsMatchRawProps<AndroidTextInputProps>({
      {dynamic::object("returnKeyLabel", "Go")("autoComplete", "email")(
          "textAlign", "center")},
      {dynamic::object("returnKeyLabel", nullptr)("autoComplete", nullptr)(
          "textAlign", nullptr)},
  });
}

} // namespace facebook::react

#endif
