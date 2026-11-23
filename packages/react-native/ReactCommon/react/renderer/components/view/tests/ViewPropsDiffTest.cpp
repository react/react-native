/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/view/ViewProps.h>
#include <react/test_utils/PropsPayloads.h>

#ifdef RN_SERIALIZABLE_STATE

namespace facebook::react {

namespace {

using folly::dynamic;

void expectPayloads(const std::vector<PropsCommit>& commits) {
  expectPayloadsMatchRawProps<ViewProps>(commits);
}

const auto kRed = static_cast<int32_t>(0xFFFF0000);

} // namespace

// ReactViewManager has setters for all three; with
// enableExclusivePropsUpdateAndroid there is no rawProps fallback.
TEST(ViewPropsDiffTest, emitsBackgroundSizePositionAndRepeat) {
  expectPayloads({{dynamic::object(
      "backgroundSize",
      dynamic::array(
          dynamic::object("x", "50%")("y", "auto"),
          dynamic::object("x", 20)("y", "25%")))(
      "backgroundPosition",
      dynamic::array(
          dynamic::object("top", "10%")("left", 5),
          dynamic::object("bottom", 0)("right", "20%")))(
      "backgroundRepeat",
      dynamic::array(dynamic::object("x", "no-repeat")("y", "space")))}});
}

// The Android transform parser knows `perspective`, not `perspectiveX`.
TEST(ViewPropsDiffTest, emitsPerspectiveUnderItsOwnName) {
  expectPayloads({{dynamic::object(
      "transform", dynamic::array(dynamic::object("perspective", 850)))}});
}

// ReactViewManager resets a side to `borderWidth` only for null (NaN); 0 keeps
// the side at width 0.
TEST(ViewPropsDiffTest, removingASideBorderWidthEmitsNull) {
  expectPayloads({
      {dynamic::object("borderWidth", 4)("borderLeftWidth", 12)},
      {dynamic::object("borderLeftWidth", nullptr)},
  });
}

// BoxShadow.parse defaults an absent color to black; 0 is transparent.
TEST(ViewPropsDiffTest, boxShadowWithoutColorOmitsColor) {
  expectPayloads({{dynamic::object(
      "boxShadow",
      dynamic::array(
          dynamic::object("offsetX", 0)("offsetY", 4)("blurRadius", 8)(
              "spreadDistance", 0)("inset", false)))}});
}

// FilterHelper defaults an absent drop shadow color to black; 0 is
// transparent.
TEST(ViewPropsDiffTest, dropShadowWithoutColorOmitsColor) {
  expectPayloads({{dynamic::object(
      "filter",
      dynamic::array(
          dynamic::object(
              "dropShadow",
              dynamic::object("offsetX", 0)("offsetY", 4)(
                  "standardDeviation", 4))))}});
}

// BaseViewManager.setShadowColor resets to black for null; 0 makes the
// elevation shadow transparent.
TEST(ViewPropsDiffTest, removingShadowColorEmitsNull) {
  expectPayloads({
      {dynamic::object("elevation", 8)("shadowColor", kRed)},
      {dynamic::object("shadowColor", nullptr)},
  });
}

// The Android gradients treat a stop with a null color as a transition hint;
// 0 is a transparent stop.
TEST(ViewPropsDiffTest, gradientColorHintEmitsNullColor) {
  expectPayloads({{dynamic::object(
      "backgroundImage",
      dynamic::array(
          dynamic::object("type", "linear-gradient")(
              "direction", dynamic::object("type", "angle")("value", 180))(
              "colorStops",
              dynamic::array(
                  dynamic::object("color", kRed)("position", nullptr),
                  dynamic::object("color", nullptr)("position", "20%"),
                  dynamic::object("color", static_cast<int32_t>(0xFF0000FF))(
                      "position", nullptr)))))}});
}

// BaseViewManager.setViewState replaces the whole state: an absent `selected`
// deselects the view and an absent `disabled` re-enables it. Props 2.0 sends an
// unset `checked` as "none", which Java ignores.
TEST(ViewPropsDiffTest, emitsTheWholeAccessibilityStateWhenOneMemberChanges) {
  auto state = [](bool busy) {
    return dynamic::object("selected", true)("disabled", true)("busy", busy);
  };
  auto sentState = [&](bool busy) {
    return dynamic::object(
        "accessibilityState", state(busy)("checked", "none"));
  };
  expectPayloads({
      {dynamic::object("accessibilityState", state(false)), sentState(false)},
      {dynamic::object("accessibilityState", state(true)), sentState(true)},
  });
}

// React sends a removed prop as null on top of the previous props.
// BaseViewManager clears the role only for null, and
// AccessibilityRole.fromValue("") throws.
TEST(ViewPropsDiffTest, removingAccessibilityRoleEmitsNull) {
  expectPayloads({
      {dynamic::object("accessibilityRole", "button")},
      {dynamic::object("accessibilityRole", nullptr)},
  });
}

// BaseViewManager falls back to accessibilityRole only for a null role.
TEST(ViewPropsDiffTest, removingRoleEmitsNull) {
  expectPayloads({
      {dynamic::object("role", "button")},
      {dynamic::object("role", nullptr)},
  });
}

// An explicit role="none" overrides accessibilityRole.
TEST(ViewPropsDiffTest, emitsAnExplicitRoleNone) {
  expectPayloads(
      {{dynamic::object("role", "none")("accessibilityRole", "button")}});
}

// BaseViewManager clears the value and the content description only for null.
TEST(ViewPropsDiffTest, removingAccessibilityValueEmitsNull) {
  expectPayloads({
      {dynamic::object("accessibilityValue", dynamic::object("text", "50%"))},
      {dynamic::object("accessibilityValue", nullptr)},
  });
}

} // namespace facebook::react

#endif
