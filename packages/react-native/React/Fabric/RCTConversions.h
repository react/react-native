/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <react/renderer/components/view/AccessibilityPrimitives.h>
#import <react/renderer/components/view/primitives.h>
#import <react/renderer/core/LayoutPrimitives.h>
#import <react/renderer/graphics/Color.h>
#import <react/renderer/graphics/RCTPlatformColorUtils.h>
#import <react/renderer/graphics/Transform.h>
#import <react/timing/primitives.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Converts an iOS timestamp (seconds since boot, NOT including sleep time, from
 * NSProcessInfo.processInfo.systemUptime or UITouch.timestamp) to a HighResTimeStamp.
 *
 * iOS timestamps and HighResTimeStamp both use mach_absolute_time() which doesn't
 * account for sleep time. We convert the timestamp directly since they share the
 * same time domain.
 */
inline facebook::react::HighResTimeStamp RCTHighResTimeStampFromSeconds(NSTimeInterval seconds)
{
  return facebook::react::HighResTimeStamp::fromDOMHighResTimeStamp(seconds * 1e3);
}

inline NSString *RCTNSStringFromString(
    const std::string &string,
    const NSStringEncoding &encoding = NSUTF8StringEncoding)
{
  return [NSString stringWithCString:string.c_str() encoding:encoding] ?: @"";
}

inline NSString *_Nullable RCTNSStringFromStringNilIfEmpty(
    const std::string &string,
    const NSStringEncoding &encoding = NSUTF8StringEncoding)
{
  return string.empty() ? nil : RCTNSStringFromString(string, encoding);
}

inline std::string RCTStringFromNSString(NSString *string)
{
  return std::string{string.UTF8String ?: ""};
}

inline UIColor *_Nullable RCTUIColorFromSharedColor(const facebook::react::SharedColor &sharedColor)
{
  return RCTPlatformColorFromColor(*sharedColor);
}

inline CF_RETURNS_RETAINED CGColorRef _Nullable RCTCreateCGColorRefFromSharedColor(
    const facebook::react::SharedColor &sharedColor)
{
  return CGColorRetain(RCTUIColorFromSharedColor(sharedColor).CGColor);
}

inline CGPoint RCTCGPointFromPoint(const facebook::react::Point &point)
{
  return {point.x, point.y};
}

inline CGSize RCTCGSizeFromSize(const facebook::react::Size &size)
{
  return {size.width, size.height};
}

inline CGRect RCTCGRectFromRect(const facebook::react::Rect &rect)
{
  return {RCTCGPointFromPoint(rect.origin), RCTCGSizeFromSize(rect.size)};
}

inline UIEdgeInsets RCTUIEdgeInsetsFromEdgeInsets(const facebook::react::EdgeInsets &edgeInsets)
{
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}

const UIAccessibilityTraits AccessibilityTraitSwitch = 0x20000000000001;

inline UIAccessibilityTraits RCTUIAccessibilityTraitsFromAccessibilityTraits(
    facebook::react::AccessibilityTraits accessibilityTraits)
{
  using AccessibilityTraits = facebook::react::AccessibilityTraits;
  UIAccessibilityTraits result = UIAccessibilityTraitNone;
  if ((accessibilityTraits & AccessibilityTraits::Button) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitButton;
  }
  if ((accessibilityTraits & AccessibilityTraits::Link) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitLink;
  }
  if ((accessibilityTraits & AccessibilityTraits::Image) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitImage;
  }
  if ((accessibilityTraits & AccessibilityTraits::Selected) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitSelected;
  }
  if ((accessibilityTraits & AccessibilityTraits::PlaysSound) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitPlaysSound;
  }
  if ((accessibilityTraits & AccessibilityTraits::KeyboardKey) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitKeyboardKey;
  }
  if ((accessibilityTraits & AccessibilityTraits::StaticText) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitStaticText;
  }
  if ((accessibilityTraits & AccessibilityTraits::SummaryElement) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitSummaryElement;
  }
  if ((accessibilityTraits & AccessibilityTraits::NotEnabled) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitNotEnabled;
  }
  if ((accessibilityTraits & AccessibilityTraits::UpdatesFrequently) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitUpdatesFrequently;
  }
  if ((accessibilityTraits & AccessibilityTraits::SearchField) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitSearchField;
  }
  if ((accessibilityTraits & AccessibilityTraits::StartsMediaSession) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitStartsMediaSession;
  }
  if ((accessibilityTraits & AccessibilityTraits::Adjustable) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitAdjustable;
  }
  if ((accessibilityTraits & AccessibilityTraits::AllowsDirectInteraction) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitAllowsDirectInteraction;
  }
  if ((accessibilityTraits & AccessibilityTraits::CausesPageTurn) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitCausesPageTurn;
  }
  if ((accessibilityTraits & AccessibilityTraits::Header) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitHeader;
  }
  if ((accessibilityTraits & AccessibilityTraits::Switch) != AccessibilityTraits::None) {
    result |= AccessibilityTraitSwitch;
  }
  if ((accessibilityTraits & AccessibilityTraits::TabBar) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitTabBar;
  }
  return result;
};

inline CATransform3D RCTCATransform3DFromTransformMatrix(const facebook::react::Transform &transformMatrix)
{
  return {
      (CGFloat)transformMatrix.matrix[0],
      (CGFloat)transformMatrix.matrix[1],
      (CGFloat)transformMatrix.matrix[2],
      (CGFloat)transformMatrix.matrix[3],
      (CGFloat)transformMatrix.matrix[4],
      (CGFloat)transformMatrix.matrix[5],
      (CGFloat)transformMatrix.matrix[6],
      (CGFloat)transformMatrix.matrix[7],
      (CGFloat)transformMatrix.matrix[8],
      (CGFloat)transformMatrix.matrix[9],
      (CGFloat)transformMatrix.matrix[10],
      (CGFloat)transformMatrix.matrix[11],
      (CGFloat)transformMatrix.matrix[12],
      (CGFloat)transformMatrix.matrix[13],
      (CGFloat)transformMatrix.matrix[14],
      (CGFloat)transformMatrix.matrix[15]};
}

inline facebook::react::Point RCTPointFromCGPoint(const CGPoint &point)
{
  return {.x = point.x, .y = point.y};
}

inline facebook::react::Float RCTFloatFromCGFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX) {
    return std::numeric_limits<facebook::react::Float>::infinity();
  }
  return value;
}

inline facebook::react::Size RCTSizeFromCGSize(const CGSize &size)
{
  return {.width = RCTFloatFromCGFloat(size.width), .height = RCTFloatFromCGFloat(size.height)};
}

inline facebook::react::Rect RCTRectFromCGRect(const CGRect &rect)
{
  return {.origin = RCTPointFromCGPoint(rect.origin), .size = RCTSizeFromCGSize(rect.size)};
}

inline facebook::react::EdgeInsets RCTEdgeInsetsFromUIEdgeInsets(const UIEdgeInsets &edgeInsets)
{
  return {edgeInsets.left, edgeInsets.top, edgeInsets.right, edgeInsets.bottom};
}

inline facebook::react::LayoutDirection RCTLayoutDirection(BOOL isRTL)
{
  return isRTL ? facebook::react::LayoutDirection::RightToLeft : facebook::react::LayoutDirection::LeftToRight;
}

NS_ASSUME_NONNULL_END
