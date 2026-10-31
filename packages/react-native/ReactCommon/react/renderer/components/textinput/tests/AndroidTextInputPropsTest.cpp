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

} // namespace facebook::react

#endif
