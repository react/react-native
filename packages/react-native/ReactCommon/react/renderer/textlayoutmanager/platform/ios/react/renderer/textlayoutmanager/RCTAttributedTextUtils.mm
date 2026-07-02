/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAttributedTextUtils.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/accessibilityPropsConversions.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/textlayoutmanager/RCTFontProperties.h>
#include <react/renderer/textlayoutmanager/RCTFontUtils.h>
#include <react/renderer/textlayoutmanager/RCTTextPrimitivesConversions.h>
#include <react/utils/ManagedObjectWrapper.h>
#include <array>

using namespace facebook::react;

inline static TextAlignment RCTResolveTextAlignment(TextAlignment textAlignment, LayoutDirection layoutDirection)
{
  const bool isRTL = layoutDirection == LayoutDirection::RightToLeft;
  switch (textAlignment) {
    case TextAlignment::Start:
      return isRTL ? TextAlignment::Right : TextAlignment::Left;
    case TextAlignment::End:
      return isRTL ? TextAlignment::Left : TextAlignment::Right;
    case TextAlignment::Right:
      return isRTL ? TextAlignment::Left : TextAlignment::Right;
    case TextAlignment::Left:
      return isRTL ? TextAlignment::Right : TextAlignment::Left;
    default:
      return textAlignment;
  }
}

inline static UIFontWeight RCTUIFontWeightFromInteger(NSInteger fontWeight)
{
  assert(fontWeight > 50);
  assert(fontWeight < 950);

  static auto weights = std::to_array<UIFontWeight>({/* ~100 */ UIFontWeightUltraLight,
                                                     /* ~200 */ UIFontWeightThin,
                                                     /* ~300 */ UIFontWeightLight,
                                                     /* ~400 */ UIFontWeightRegular,
                                                     /* ~500 */ UIFontWeightMedium,
                                                     /* ~600 */ UIFontWeightSemibold,
                                                     /* ~700 */ UIFontWeightBold,
                                                     /* ~800 */ UIFontWeightHeavy,
                                                     /* ~900 */ UIFontWeightBlack});
  // The expression is designed to convert something like 760 or 830 to 7.
  return weights[(fontWeight + 50) / 100 - 1];
}

inline static UIFontTextStyle RCTUIFontTextStyleForDynamicTypeRamp(const DynamicTypeRamp &dynamicTypeRamp)
{
  switch (dynamicTypeRamp) {
    case DynamicTypeRamp::Caption2:
      return UIFontTextStyleCaption2;
    case DynamicTypeRamp::Caption1:
      return UIFontTextStyleCaption1;
    case DynamicTypeRamp::Footnote:
      return UIFontTextStyleFootnote;
    case DynamicTypeRamp::Subheadline:
      return UIFontTextStyleSubheadline;
    case DynamicTypeRamp::Callout:
      return UIFontTextStyleCallout;
    case DynamicTypeRamp::Body:
      return UIFontTextStyleBody;
    case DynamicTypeRamp::Headline:
      return UIFontTextStyleHeadline;
    case DynamicTypeRamp::Title3:
      return UIFontTextStyleTitle3;
    case DynamicTypeRamp::Title2:
      return UIFontTextStyleTitle2;
    case DynamicTypeRamp::Title1:
      return UIFontTextStyleTitle1;
    case DynamicTypeRamp::LargeTitle:
// UIFontTextStyleLargeTitle is not available on tvOS.
#if !TARGET_OS_TV
      return UIFontTextStyleLargeTitle;
#else
      return UIFontTextStyleTitle1;
#endif
  }
}

inline static CGFloat RCTBaseSizeForDynamicTypeRamp(const DynamicTypeRamp &dynamicTypeRamp)
{
  // Values taken from
  // https://developer.apple.com/design/human-interface-guidelines/foundations/typography/#specifications
  switch (dynamicTypeRamp) {
    case DynamicTypeRamp::Caption2:
      return 11.0;
    case DynamicTypeRamp::Caption1:
      return 12.0;
    case facebook::react::DynamicTypeRamp::Footnote:
      return 13.0;
    case facebook::react::DynamicTypeRamp::Subheadline:
      return 15.0;
    case facebook::react::DynamicTypeRamp::Callout:
      return 16.0;
    case facebook::react::DynamicTypeRamp::Body:
      return 17.0;
    case facebook::react::DynamicTypeRamp::Headline:
      return 17.0;
    case facebook::react::DynamicTypeRamp::Title3:
      return 20.0;
    case facebook::react::DynamicTypeRamp::Title2:
      return 22.0;
    case facebook::react::DynamicTypeRamp::Title1:
      return 28.0;
    case facebook::react::DynamicTypeRamp::LargeTitle:
      return 34.0;
  }
}

inline static CGFloat RCTEffectiveFontSizeMultiplierFromTextAttributes(const TextAttributes &textAttributes)
{
  if (textAttributes.allowFontScaling.value_or(true)) {
    CGFloat fontSizeMultiplier = !isnan(textAttributes.fontSizeMultiplier) ? textAttributes.fontSizeMultiplier : 1.0;
    if (textAttributes.dynamicTypeRamp.has_value()) {
      DynamicTypeRamp dynamicTypeRamp = textAttributes.dynamicTypeRamp.value();
      UIFontMetrics *fontMetrics =
          [UIFontMetrics metricsForTextStyle:RCTUIFontTextStyleForDynamicTypeRamp(dynamicTypeRamp)];
      // Using a specific font size reduces rounding errors from -scaledValueForValue:
      CGFloat requestedSize =
          isnan(textAttributes.fontSize) ? RCTBaseSizeForDynamicTypeRamp(dynamicTypeRamp) : textAttributes.fontSize;
      fontSizeMultiplier = [fontMetrics scaledValueForValue:requestedSize] / requestedSize;
    }
    CGFloat maxFontSizeMultiplier =
        !isnan(textAttributes.maxFontSizeMultiplier) ? textAttributes.maxFontSizeMultiplier : 0.0;
    return maxFontSizeMultiplier >= 1.0 ? fminf(maxFontSizeMultiplier, fontSizeMultiplier) : fontSizeMultiplier;
  } else {
    return 1.0;
  }
}

inline static UIFont *RCTEffectiveFontFromTextAttributes(const TextAttributes &textAttributes)
{
  NSString *fontFamily = [NSString stringWithUTF8String:textAttributes.fontFamily.c_str()];

  RCTFontProperties fontProperties;
  fontProperties.family = fontFamily;
  fontProperties.size = textAttributes.fontSize;
  fontProperties.style = textAttributes.fontStyle.has_value()
      ? RCTFontStyleFromFontStyle(textAttributes.fontStyle.value())
      : RCTFontStyleUndefined;
  fontProperties.variant = textAttributes.fontVariant.has_value()
      ? RCTFontVariantFromFontVariant(textAttributes.fontVariant.value())
      : RCTFontVariantUndefined;
  fontProperties.weight = textAttributes.fontWeight.has_value()
      ? RCTUIFontWeightFromInteger((NSInteger)textAttributes.fontWeight.value())
      : NAN;
  fontProperties.sizeMultiplier = RCTEffectiveFontSizeMultiplierFromTextAttributes(textAttributes);

  return RCTFontWithFontProperties(fontProperties);
}

inline static UIColor *RCTEffectiveForegroundColorFromTextAttributes(const TextAttributes &textAttributes)
{
  UIColor *effectiveForegroundColor = RCTUIColorFromSharedColor(textAttributes.foregroundColor) ?: [UIColor blackColor];

  if (!isnan(textAttributes.opacity)) {
    effectiveForegroundColor = [effectiveForegroundColor
        colorWithAlphaComponent:CGColorGetAlpha(effectiveForegroundColor.CGColor) * textAttributes.opacity];
  }

  return effectiveForegroundColor;
}

inline static UIColor *RCTEffectiveBackgroundColorFromTextAttributes(const TextAttributes &textAttributes)
{
  UIColor *effectiveBackgroundColor = RCTUIColorFromSharedColor(textAttributes.backgroundColor);

  if (effectiveBackgroundColor && !isnan(textAttributes.opacity)) {
    effectiveBackgroundColor = [effectiveBackgroundColor
        colorWithAlphaComponent:CGColorGetAlpha(effectiveBackgroundColor.CGColor) * textAttributes.opacity];
  }

  return effectiveBackgroundColor ?: [UIColor clearColor];
}

NSMutableDictionary<NSAttributedStringKey, id> *RCTNSTextAttributesFromTextAttributes(
    const TextAttributes &textAttributes)
{
  NSMutableDictionary<NSAttributedStringKey, id> *attributes = [NSMutableDictionary dictionaryWithCapacity:10];

  // Font
  UIFont *font = RCTEffectiveFontFromTextAttributes(textAttributes);
  if (font) {
    attributes[NSFontAttributeName] = font;
  }

  // Colors
  UIColor *effectiveForegroundColor = RCTEffectiveForegroundColorFromTextAttributes(textAttributes);

  if (textAttributes.foregroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSForegroundColorAttributeName] = effectiveForegroundColor;
  }

  if (textAttributes.backgroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSBackgroundColorAttributeName] = RCTEffectiveBackgroundColorFromTextAttributes(textAttributes);
  }

  // Kerning
  if (!isnan(textAttributes.letterSpacing)) {
    attributes[NSKernAttributeName] = @(textAttributes.letterSpacing);
  }

  // Paragraph Style
  NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
  BOOL isParagraphStyleUsed = NO;
  if (textAttributes.alignment.has_value()) {
    TextAlignment textAlignment = RCTResolveTextAlignment(
        textAttributes.alignment.value_or(TextAlignment::Natural),
        textAttributes.layoutDirection.value_or(LayoutDirection::LeftToRight));

    paragraphStyle.alignment = RCTNSTextAlignmentFromTextAlignment(textAlignment);
    isParagraphStyleUsed = YES;
  }

  if (textAttributes.baseWritingDirection.has_value()) {
    paragraphStyle.baseWritingDirection =
        RCTNSWritingDirectionFromWritingDirection(textAttributes.baseWritingDirection.value());
    isParagraphStyleUsed = YES;
  }

  if (textAttributes.lineBreakStrategy.has_value()) {
    paragraphStyle.lineBreakStrategy =
        RCTNSLineBreakStrategyFromLineBreakStrategy(textAttributes.lineBreakStrategy.value());
    isParagraphStyleUsed = YES;
  }

  if (textAttributes.lineBreakMode.has_value()) {
    paragraphStyle.lineBreakMode = RCTNSLineBreakModeFromLineBreakMode(textAttributes.lineBreakMode.value());
    isParagraphStyleUsed = YES;
  }

  if (!isnan(textAttributes.lineHeight)) {
    CGFloat lineHeight = textAttributes.lineHeight * RCTEffectiveFontSizeMultiplierFromTextAttributes(textAttributes);
    paragraphStyle.minimumLineHeight = lineHeight;
    paragraphStyle.maximumLineHeight = lineHeight;
    isParagraphStyleUsed = YES;
  }

  if (isParagraphStyleUsed) {
    attributes[NSParagraphStyleAttributeName] = paragraphStyle;
  }

  // Decoration
  if (textAttributes.textDecorationLineType.value_or(TextDecorationLineType::None) != TextDecorationLineType::None) {
    auto textDecorationLineType = textAttributes.textDecorationLineType.value();
    auto textDecorationStyleValue = textAttributes.textDecorationStyle.value_or(TextDecorationStyle::Solid);
    UIColor *textDecorationColor = RCTUIColorFromSharedColor(textAttributes.textDecorationColor);

    // Custom drawing for styles UIKit can't render faithfully: wavy (no
    // native value), and dotted/dashed (UIKit's pattern bits don't match
    // browser geometry). The other styles continue to use NSUnderlineStyle.
    bool needsCustomDrawing = textDecorationStyleValue == TextDecorationStyle::Wavy ||
        textDecorationStyleValue == TextDecorationStyle::Dotted ||
        textDecorationStyleValue == TextDecorationStyle::Dashed;
    if (needsCustomDrawing) {
      UIColor *strokeColor = (textDecorationColor != nil) ? textDecorationColor
                                                          : RCTUIColorFromSharedColor(textAttributes.foregroundColor);
      NSMutableArray<NSString *> *lines = [NSMutableArray array];
      if (textDecorationLineType == TextDecorationLineType::Underline ||
          textDecorationLineType == TextDecorationLineType::UnderlineStrikethrough) {
        [lines addObject:@"underline"];
      }
      if (textDecorationLineType == TextDecorationLineType::Strikethrough ||
          textDecorationLineType == TextDecorationLineType::UnderlineStrikethrough) {
        [lines addObject:@"line-through"];
      }
      NSString *styleKey = textDecorationStyleValue == TextDecorationStyle::Wavy
          ? @"wavy"
          : (textDecorationStyleValue == TextDecorationStyle::Dotted ? @"dotted" : @"dashed");
      attributes[RCTCustomDecorationAttributeName] = @{
        @"lines" : lines,
        @"color" : (strokeColor != nil) ? strokeColor : [UIColor labelColor],
        @"style" : styleKey
      };
    } else {
      NSUnderlineStyle style = RCTNSUnderlineStyleFromTextDecorationStyle(textDecorationStyleValue);

      // Underline
      if (textDecorationLineType == TextDecorationLineType::Underline ||
          textDecorationLineType == TextDecorationLineType::UnderlineStrikethrough) {
        attributes[NSUnderlineStyleAttributeName] = @(style);

        if (textDecorationColor != nil) {
          attributes[NSUnderlineColorAttributeName] = textDecorationColor;
        }
      }

      // Strikethrough
      if (textDecorationLineType == TextDecorationLineType::Strikethrough ||
          textDecorationLineType == TextDecorationLineType::UnderlineStrikethrough) {
        attributes[NSStrikethroughStyleAttributeName] = @(style);

        if (textDecorationColor != nil) {
          attributes[NSStrikethroughColorAttributeName] = textDecorationColor;
        }
      }
    }
  }

  // Shadow
  if (textAttributes.textShadowOffset.has_value()) {
    auto textShadowOffset = textAttributes.textShadowOffset.value();
    NSShadow *shadow = [NSShadow new];
    shadow.shadowOffset = CGSize{textShadowOffset.width, textShadowOffset.height};
    if (!isnan(textAttributes.textShadowRadius)) {
      shadow.shadowBlurRadius = textAttributes.textShadowRadius;
    }
    if (textAttributes.textShadowColor) {
      shadow.shadowColor = RCTUIColorFromSharedColor(textAttributes.textShadowColor);
    }
    attributes[NSShadowAttributeName] = shadow;
  }

  // Special
  if (textAttributes.isHighlighted.value_or(false)) {
    attributes[RCTAttributedStringIsHighlightedAttributeName] = @YES;
  }

  if (textAttributes.role.has_value()) {
    std::string roleStr = toString(textAttributes.role.value());
    attributes[RCTTextAttributesAccessibilityRoleAttributeName] = [NSString stringWithUTF8String:roleStr.c_str()];
  } else if (textAttributes.accessibilityRole.has_value()) {
    std::string roleStr = toString(textAttributes.accessibilityRole.value());
    attributes[RCTTextAttributesAccessibilityRoleAttributeName] = [NSString stringWithUTF8String:roleStr.c_str()];
  }

  return attributes;
}

static void RCTApplyBaselineOffsetForRange(NSMutableAttributedString *attributedText, NSRange attributedTextRange)
{
  __block CGFloat maximumLineHeight = 0;

  [attributedText enumerateAttribute:NSParagraphStyleAttributeName
                             inRange:attributedTextRange
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(NSParagraphStyle *paragraphStyle, __unused NSRange range, __unused BOOL *stop) {
                            if (!paragraphStyle) {
                              return;
                            }

                            maximumLineHeight = MAX(paragraphStyle.maximumLineHeight, maximumLineHeight);
                          }];

  if (maximumLineHeight == 0) {
    // `lineHeight` was not specified, nothing to do.
    return;
  }

  __block CGFloat maximumFontLineHeight = 0;

  [attributedText enumerateAttribute:NSFontAttributeName
                             inRange:attributedTextRange
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(UIFont *font, NSRange range, __unused BOOL *stop) {
                            if (!font) {
                              return;
                            }

                            maximumFontLineHeight = MAX(font.lineHeight, maximumFontLineHeight);
                          }];

  if (maximumLineHeight < maximumFontLineHeight && !ReactNativeFeatureFlags::enableIOSCompressedTextFrameAdjustment()) {
    return;
  }

  CGFloat baseLineOffset = (maximumLineHeight - maximumFontLineHeight) / 2.0;

  [attributedText addAttribute:NSBaselineOffsetAttributeName value:@(baseLineOffset) range:attributedTextRange];
}

void RCTApplyBaselineOffset(NSMutableAttributedString *attributedText)
{
  if (ReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine()) {
    [attributedText.string
        enumerateSubstringsInRange:NSMakeRange(0, attributedText.length)
                           options:NSStringEnumerationByLines | NSStringEnumerationSubstringNotRequired
                        usingBlock:^(
                            NSString *_Nullable substring,
                            NSRange substringRange,
                            NSRange enclosingRange,
                            BOOL *_Nonnull stop) {
                          RCTApplyBaselineOffsetForRange(attributedText, enclosingRange);
                        }];
  } else {
    RCTApplyBaselineOffsetForRange(attributedText, NSMakeRange(0, attributedText.length));
  }
}

static NSMutableAttributedString *RCTNSAttributedStringFragmentFromFragment(
    const AttributedString::Fragment &fragment,
    UIImage *placeholderImage)
{
  if (fragment.isAttachment()) {
    auto layoutMetrics = fragment.parentShadowView.layoutMetrics;
    CGRect bounds = {
        .origin = {.x = layoutMetrics.frame.origin.x, .y = layoutMetrics.frame.origin.y},
        .size = {.width = layoutMetrics.frame.size.width, .height = layoutMetrics.frame.size.height}};

    NSTextAttachment *attachment = [NSTextAttachment new];
    attachment.image = placeholderImage;
    attachment.bounds = bounds;

    return [[NSMutableAttributedString attributedStringWithAttachment:attachment] mutableCopy];
  } else {
    NSString *string = [NSString stringWithUTF8String:fragment.string.c_str()];

    if (fragment.textAttributes.textTransform.has_value()) {
      auto textTransform = fragment.textAttributes.textTransform.value();
      string = RCTNSStringFromStringApplyingTextTransform(string, textTransform);
    }

    return [[NSMutableAttributedString alloc]
        initWithString:string
            attributes:RCTNSTextAttributesFromTextAttributes(fragment.textAttributes)];
  }
}

static NSMutableAttributedString *RCTNSAttributedStringFragmentWithAttributesFromFragment(
    const AttributedString::Fragment &fragment,
    UIImage *placeholderImage)
{
  auto nsAttributedStringFragment = RCTNSAttributedStringFragmentFromFragment(fragment, placeholderImage);

  if (fragment.parentShadowView.componentHandle) {
    auto eventEmitterWrapper = RCTWrapEventEmitter(fragment.parentShadowView.eventEmitter);

    NSDictionary<NSAttributedStringKey, id> *additionalTextAttributes =
        @{RCTAttributedStringEventEmitterKey : eventEmitterWrapper};

    [nsAttributedStringFragment addAttributes:additionalTextAttributes
                                        range:NSMakeRange(0, nsAttributedStringFragment.length)];
  }

  return nsAttributedStringFragment;
}

NSAttributedString *RCTNSAttributedStringFromAttributedString(const AttributedString &attributedString)
{
  static UIImage *placeholderImage;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    placeholderImage = [UIImage new];
  });

  NSMutableAttributedString *nsAttributedString = [NSMutableAttributedString new];

  [nsAttributedString beginEditing];

  for (auto fragment : attributedString.getFragments()) {
    NSMutableAttributedString *nsAttributedStringFragment =
        RCTNSAttributedStringFragmentWithAttributesFromFragment(fragment, placeholderImage);

    [nsAttributedString appendAttributedString:nsAttributedStringFragment];
  }
  [nsAttributedString endEditing];

  return nsAttributedString;
}

NSAttributedString *RCTNSAttributedStringFromAttributedStringBox(const AttributedStringBox &attributedStringBox)
{
  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value:
      return RCTNSAttributedStringFromAttributedString(attributedStringBox.getValue());
    case AttributedStringBox::Mode::OpaquePointer:
      return (NSAttributedString *)unwrapManagedObject(attributedStringBox.getOpaquePointer());
  }
}

AttributedStringBox RCTAttributedStringBoxFromNSAttributedString(NSAttributedString *nsAttributedString)
{
  return nsAttributedString.length ? AttributedStringBox{wrapManagedObject(nsAttributedString)} : AttributedStringBox{};
}

static NSString *capitalizeText(NSString *text)
{
  NSArray *words = [text componentsSeparatedByString:@" "];
  NSMutableArray *newWords = [NSMutableArray new];
  NSNumberFormatter *num = [NSNumberFormatter new];
  for (NSString *item in words) {
    NSString *word;
    if ([item length] > 0 && [num numberFromString:[item substringWithRange:NSMakeRange(0, 1)]] == nil) {
      word = [item capitalizedString];
    } else {
      word = [item lowercaseString];
    }
    [newWords addObject:word];
  }
  return [newWords componentsJoinedByString:@" "];
}

NSString *RCTNSStringFromStringApplyingTextTransform(NSString *string, TextTransform textTransform)
{
  switch (textTransform) {
    case TextTransform::Uppercase:
      return [string uppercaseString];
    case TextTransform::Lowercase:
      return [string lowercaseString];
    case TextTransform::Capitalize:
      return capitalizeText(string);
    default:
      return string;
  }
}

static BOOL RCTIsParagraphStyleEffectivelySame(
    NSParagraphStyle *style1,
    NSParagraphStyle *style2,
    const TextAttributes &baseTextAttributes)
{
  if (style1 == nil || style2 == nil) {
    return style1 == nil && style2 == nil;
  }

  // The NSParagraphStyle included as part of typingAttributes may eventually resolve "natural" directions to
  // physical direction, so we should compare resolved directions
  auto naturalAlignment =
      baseTextAttributes.layoutDirection.value_or(LayoutDirection::LeftToRight) == LayoutDirection::LeftToRight
      ? NSTextAlignmentLeft
      : NSTextAlignmentRight;

  NSWritingDirection naturalBaseWritingDirection = baseTextAttributes.baseWritingDirection.has_value()
      ? RCTNSWritingDirectionFromWritingDirection(baseTextAttributes.baseWritingDirection.value())
      : [NSParagraphStyle defaultWritingDirectionForLanguage:nil];

  if (style1.alignment == NSTextAlignmentNatural || style1.baseWritingDirection == NSWritingDirectionNatural) {
    NSMutableParagraphStyle *mutableStyle1 = [style1 mutableCopy];
    style1 = mutableStyle1;

    if (mutableStyle1.alignment == NSTextAlignmentNatural) {
      mutableStyle1.alignment = naturalAlignment;
    }

    if (mutableStyle1.baseWritingDirection == NSWritingDirectionNatural) {
      mutableStyle1.baseWritingDirection = naturalBaseWritingDirection;
    }
  }

  if (style2.alignment == NSTextAlignmentNatural || style2.baseWritingDirection == NSWritingDirectionNatural) {
    NSMutableParagraphStyle *mutableStyle2 = [style2 mutableCopy];
    style2 = mutableStyle2;

    if (mutableStyle2.alignment == NSTextAlignmentNatural) {
      mutableStyle2.alignment = naturalAlignment;
    }

    if (mutableStyle2.baseWritingDirection == NSWritingDirectionNatural) {
      mutableStyle2.baseWritingDirection = naturalBaseWritingDirection;
    }
  }

  return [style1 isEqual:style2];
}

static BOOL RCTIsAttributeEffectivelySame(
    NSAttributedStringKey attributeKey,
    NSDictionary<NSAttributedStringKey, id> *attributes1,
    NSDictionary<NSAttributedStringKey, id> *attributes2,
    NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes,
    const TextAttributes &baseTextAttributes)
{
  id attribute1 = attributes1[attributeKey] ?: insensitiveAttributes[attributeKey];
  id attribute2 = attributes2[attributeKey] ?: insensitiveAttributes[attributeKey];

  // Normalize attributes which can inexact but still effectively the same
  if ([attributeKey isEqualToString:NSParagraphStyleAttributeName]) {
    return RCTIsParagraphStyleEffectivelySame(attribute1, attribute2, baseTextAttributes);
  }

  // Otherwise rely on built-in comparison
  return [attribute1 isEqual:attribute2];
}

BOOL RCTIsAttributedStringEffectivelySame(
    NSAttributedString *text1,
    NSAttributedString *text2,
    NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes,
    const TextAttributes &baseTextAttributes)
{
  if (![text1.string isEqualToString:text2.string]) {
    return NO;
  }

  // We check that for every fragment in the old string
  // 1. The new string's fragment overlapping the first spans the same characters
  // 2. The attributes of each matching fragment are the same, ignoring those which match insensitive attibutes
  __block BOOL areAttributesSame = YES;
  [text1 enumerateAttributesInRange:NSMakeRange(0, text1.length)
                            options:0
                         usingBlock:^(
                             NSDictionary<NSAttributedStringKey, id> *text1Attributes,
                             NSRange text1Range,
                             BOOL *text1Stop) {
                           [text2 enumerateAttributesInRange:text1Range
                                                     options:0
                                                  usingBlock:^(
                                                      NSDictionary<NSAttributedStringKey, id> *text2Attributes,
                                                      NSRange text2Range,
                                                      BOOL *text2Stop) {
                                                    if (!NSEqualRanges(text1Range, text2Range)) {
                                                      areAttributesSame = NO;
                                                      *text1Stop = YES;
                                                      *text2Stop = YES;
                                                      return;
                                                    }

                                                    // Compare every attribute in text1 to the corresponding attribute
                                                    // in text2, or the set of insensitive attributes if not present
                                                    for (NSAttributedStringKey key in text1Attributes) {
                                                      if (!RCTIsAttributeEffectivelySame(
                                                              key,
                                                              text1Attributes,
                                                              text2Attributes,
                                                              insensitiveAttributes,
                                                              baseTextAttributes)) {
                                                        areAttributesSame = NO;
                                                        *text1Stop = YES;
                                                        *text2Stop = YES;
                                                        return;
                                                      }
                                                    }

                                                    for (NSAttributedStringKey key in text2Attributes) {
                                                      // We have already compared this attribute if it is present in
                                                      // both
                                                      if (text1Attributes[key] != nil) {
                                                        continue;
                                                      }

                                                      // But we still need to compare attributes if it is only present
                                                      // in text 2, to compare against insensitive attributes
                                                      if (!RCTIsAttributeEffectivelySame(
                                                              key,
                                                              text1Attributes,
                                                              text2Attributes,
                                                              insensitiveAttributes,
                                                              baseTextAttributes)) {
                                                        areAttributesSame = NO;
                                                        *text1Stop = YES;
                                                        *text2Stop = YES;
                                                        return;
                                                      }
                                                    }
                                                  }];
                         }];

  return areAttributesSame;
}
