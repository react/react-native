/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/text/ParagraphProps.h>
#include <react/test_utils/PropsPayloads.h>

#ifdef RN_SERIALIZABLE_STATE

namespace facebook::react {

using folly::dynamic;

// ReactTextViewManager resets letterSpacing to 0 for null;
// ReactTextView.setLetterSpacing ignores NaN.
TEST(ParagraphPropsDiffTest, removingLetterSpacingEmitsNull) {
  expectPayloadsMatchRawProps<ParagraphProps>({
      {dynamic::object("letterSpacing", 4.0)},
      {dynamic::object("letterSpacing", nullptr)},
  });
}

} // namespace facebook::react

#endif
