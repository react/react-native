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

} // namespace facebook::react

#endif
