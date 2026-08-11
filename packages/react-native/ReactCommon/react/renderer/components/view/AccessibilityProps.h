/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/AccessibilityPrimitives.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook::react {

class AccessibilityProps {
 public:
  AccessibilityProps() = default;
  AccessibilityProps(
      const PropsParserContext& context,
      const AccessibilityProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#pragma mark - Props

  bool accessible{false};
  std::optional<AccessibilityState> accessibilityState{std::nullopt};
  std::string accessibilityLabel;
  std::vector<std::string> accessibilityOrder{};
  AccessibilityLabelledBy accessibilityLabelledBy{};
  AccessibilityLiveRegion accessibilityLiveRegion{
      AccessibilityLiveRegion::None};
  AccessibilityTraits accessibilityTraits{AccessibilityTraits::None};
  std::string accessibilityRole;
  std::string accessibilityHint;
  std::string accessibilityLanguage;
  std::string accessibilityLargeContentTitle;
  AccessibilityValue accessibilityValue;
  std::vector<AccessibilityAction> accessibilityActions{};
  bool accessibilityShowsLargeContentViewer{false};
  bool accessibilityViewIsModal{false};
  bool accessibilityElementsHidden{false};
  bool accessibilityIgnoresInvertColors{false};
  // This prop is enabled by default on iOS, we need to match this on
  // C++ because if not, it will default to false before render which prevents
  // the view from being updated with the correct value.
  bool accessibilityRespondsToUserInteraction{true};
  bool onAccessibilityTap{};
  bool onAccessibilityMagicTap{};
  bool onAccessibilityEscape{};
  bool onAccessibilityAction{};
  ImportantForAccessibility importantForAccessibility{
      ImportantForAccessibility::Auto};
  Role role{Role::None};
  std::string testId;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace facebook::react
