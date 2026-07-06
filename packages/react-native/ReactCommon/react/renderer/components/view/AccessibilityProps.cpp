/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AccessibilityProps.h"

#include <react/renderer/components/view/accessibilityPropsConversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

AccessibilityProps::AccessibilityProps(
    const PropsParserContext& context,
    const AccessibilityProps& sourceProps,
    const RawProps& rawProps)
    : accessible(convertRawProp(
          context,
          rawProps,
          "accessible",
          sourceProps.accessible,
          false)),
      accessibilityState(convertRawProp(
          context,
          rawProps,
          "accessibilityState",
          sourceProps.accessibilityState,
          {})),
      accessibilityLabel(convertRawProp(
          context,
          rawProps,
          "accessibilityLabel",
          sourceProps.accessibilityLabel,
          "")),
      accessibilityOrder(convertRawProp(
          context,
          rawProps,
          "experimental_accessibilityOrder",
          sourceProps.accessibilityOrder,
          {})),
      accessibilityLabelledBy(convertRawProp(
          context,
          rawProps,
          "accessibilityLabelledBy",
          sourceProps.accessibilityLabelledBy,
          {})),
      accessibilityLiveRegion(convertRawProp(
          context,
          rawProps,
          "accessibilityLiveRegion",
          sourceProps.accessibilityLiveRegion,
          AccessibilityLiveRegion::None)),
      accessibilityHint(convertRawProp(
          context,
          rawProps,
          "accessibilityHint",
          sourceProps.accessibilityHint,
          "")),
      accessibilityLanguage(convertRawProp(
          context,
          rawProps,
          "accessibilityLanguage",
          sourceProps.accessibilityLanguage,
          "")),
      accessibilityLargeContentTitle(convertRawProp(
          context,
          rawProps,
          "accessibilityLargeContentTitle",
          sourceProps.accessibilityLargeContentTitle,
          "")),
      accessibilityValue(convertRawProp(
          context,
          rawProps,
          "accessibilityValue",
          sourceProps.accessibilityValue,
          {})),
      accessibilityActions(convertRawProp(
          context,
          rawProps,
          "accessibilityActions",
          sourceProps.accessibilityActions,
          {})),
      accessibilityShowsLargeContentViewer(convertRawProp(
          context,
          rawProps,
          "accessibilityShowsLargeContentViewer",
          sourceProps.accessibilityShowsLargeContentViewer,
          false)),
      accessibilityViewIsModal(convertRawProp(
          context,
          rawProps,
          "accessibilityViewIsModal",
          sourceProps.accessibilityViewIsModal,
          false)),
      accessibilityElementsHidden(convertRawProp(
          context,
          rawProps,
          "accessibilityElementsHidden",
          sourceProps.accessibilityElementsHidden,
          false)),
      accessibilityIgnoresInvertColors(convertRawProp(
          context,
          rawProps,
          "accessibilityIgnoresInvertColors",
          sourceProps.accessibilityIgnoresInvertColors,
          false)),
      accessibilityRespondsToUserInteraction(convertRawProp(
          context,
          rawProps,
          "accessibilityRespondsToUserInteraction",
          sourceProps.accessibilityRespondsToUserInteraction,
          true)),
      onAccessibilityTap(convertRawProp(
          context,
          rawProps,
          "onAccessibilityTap",
          sourceProps.onAccessibilityTap,
          {})),
      onAccessibilityMagicTap(convertRawProp(
          context,
          rawProps,
          "onAccessibilityMagicTap",
          sourceProps.onAccessibilityMagicTap,
          {})),
      onAccessibilityEscape(convertRawProp(
          context,
          rawProps,
          "onAccessibilityEscape",
          sourceProps.onAccessibilityEscape,
          {})),
      onAccessibilityAction(convertRawProp(
          context,
          rawProps,
          "onAccessibilityAction",
          sourceProps.onAccessibilityAction,
          {})),
      importantForAccessibility(convertRawProp(
          context,
          rawProps,
          "importantForAccessibility",
          sourceProps.importantForAccessibility,
          ImportantForAccessibility::Auto)),
      testId(
          convertRawProp(context, rawProps, "testID", sourceProps.testId, "")) {
  // It is a (severe!) perf deoptimization to request props out-of-order.
  // Thus, since we need to request the same prop twice here
  // (accessibilityRole) we "must" do them subsequently here to prevent
  // a regression. It is reasonable to ask if the `at` function can be improved;
  // it probably can, but this is a fairly rare edge-case that (1) is easy-ish
  // to work around here, and (2) would require very careful work to address
  // this case and not regress the more common cases.
  auto* accessibilityRoleValue = rawProps.at("accessibilityRole");
  auto* roleValue = rawProps.at("role");

  auto* precedentRoleValue =
      roleValue != nullptr ? roleValue : accessibilityRoleValue;

  if (accessibilityRoleValue == nullptr ||
      !accessibilityRoleValue->hasValue()) {
    accessibilityRole = sourceProps.accessibilityRole;
  } else {
    fromRawValue(context, *accessibilityRoleValue, accessibilityRole);
  }

  if (roleValue == nullptr || !roleValue->hasValue()) {
    role = sourceProps.role;
  } else {
    fromRawValue(context, *roleValue, role);
  }

  if (precedentRoleValue == nullptr || !precedentRoleValue->hasValue()) {
    accessibilityTraits = sourceProps.accessibilityTraits;
  } else {
    fromRawValue(context, *precedentRoleValue, accessibilityTraits);
  }
}

void AccessibilityProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* /*propName*/,
    const RawValue& value) {
  static auto defaults = AccessibilityProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessible);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityState);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLabel);
    RAW_SET_PROP_SWITCH_CASE(
        accessibilityOrder, "experimental_accessibilityOrder");
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLabelledBy);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLiveRegion);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityHint);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLanguage);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityShowsLargeContentViewer);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLargeContentTitle);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityValue);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityActions);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityViewIsModal);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityElementsHidden);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityIgnoresInvertColors);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityRespondsToUserInteraction);
    RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityTap);
    RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityMagicTap);
    RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityEscape);
    RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityAction);
    RAW_SET_PROP_SWITCH_CASE_BASIC(importantForAccessibility);
    RAW_SET_PROP_SWITCH_CASE_BASIC(role);
    RAW_SET_PROP_SWITCH_CASE(testId, "testID");
    case CONSTEXPR_RAW_PROPS_KEY_HASH("accessibilityRole"): {
      AccessibilityTraits traits = AccessibilityTraits::None;
      std::string roleString;
      if (value.hasValue()) {
        fromRawValue(context, value, traits);
        fromRawValue(context, value, roleString);
      }

      accessibilityTraits = traits;
      accessibilityRole = roleString;
      return;
    }
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE

SharedDebugStringConvertibleList AccessibilityProps::getDebugProps() const {
  const auto& defaultProps = AccessibilityProps();
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem(
          "accessibilityRole",
          accessibilityRole,
          defaultProps.accessibilityRole),
      debugStringConvertibleItem(
          "accessible", accessible, defaultProps.accessible),
      debugStringConvertibleItem(
          "accessibilityActions",
          accessibilityActions,
          defaultProps.accessibilityActions),
      debugStringConvertibleItem(
          "accessibilityState",
          accessibilityState,
          defaultProps.accessibilityState),
      debugStringConvertibleItem(
          "accessibilityElementsHidden",
          accessibilityElementsHidden,
          defaultProps.accessibilityElementsHidden),
      debugStringConvertibleItem(
          "accessibilityHint",
          accessibilityHint,
          defaultProps.accessibilityHint),
      debugStringConvertibleItem(
          "accessibilityLabel",
          accessibilityLabel,
          defaultProps.accessibilityLabel),
      debugStringConvertibleItem(
          "accessibilityLiveRegion",
          accessibilityLiveRegion,
          defaultProps.accessibilityLiveRegion),
      debugStringConvertibleItem(
          "importantForAccessibility",
          importantForAccessibility,
          defaultProps.importantForAccessibility),
      debugStringConvertibleItem("testID", testId, defaultProps.testId),
  };
}
#endif // RN_DEBUG_STRING_CONVERTIBLE

} // namespace facebook::react
