/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreText/CoreText.h>
#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import <React/RCTConversions.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/RCTFontUtils.h>

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/RawValue.h>

#include <array>
#include <utility>

using namespace facebook::react;

@interface RCTAttributedTextUtilsTest : XCTestCase

@end

@implementation RCTAttributedTextUtilsTest

static NSTextAlignment NSTextAlignmentFromTextAlign(NSString *textAlign, LayoutDirection layoutDirection)
{
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};
  TextAlignment textAlignment = TextAlignment::Natural;
  fromRawValue(parserContext, RawValue{folly::dynamic{textAlign.UTF8String}}, textAlignment);

  TextAttributes textAttributes;
  textAttributes.alignment = textAlignment;
  textAttributes.layoutDirection = layoutDirection;

  NSDictionary<NSAttributedStringKey, id> *attributes = RCTNSTextAttributesFromTextAttributes(textAttributes);
  NSParagraphStyle *paragraphStyle = attributes[NSParagraphStyleAttributeName];
  return paragraphStyle.alignment;
}

static UIFont *FontFromSettings(std::optional<std::string> settings, std::optional<FontWeight> weight = std::nullopt)
{
  TextAttributes textAttributes;
  textAttributes.fontVariationSettings = std::move(settings);
  textAttributes.fontWeight = weight;

  NSDictionary<NSAttributedStringKey, id> *attributes = RCTNSTextAttributesFromTextAttributes(textAttributes);
  return attributes[NSFontAttributeName];
}

static NSDictionary<NSNumber *, NSNumber *> *FontVariationsFromSettings(std::optional<std::string> settings)
{
  UIFont *font = FontFromSettings(std::move(settings));
  return [font.fontDescriptor objectForKey:(UIFontDescriptorAttributeName)kCTFontVariationAttribute];
}

- (void)testFontVariationSettings
{
  NSDictionary<NSNumber *, NSNumber *> *variations = FontVariationsFromSettings("'wght' 550, \"opsz\" 18.5");

  XCTAssertEqualObjects(variations[@(0x77676874)], @550);
  XCTAssertEqualObjects(variations[@(0x6F70737A)], @18.5);
}

- (void)testFontVariationSettingsParser
{
  NSDictionary<NSNumber *, NSNumber *> *variations =
      RCTParseFontVariationSettings(@"'a,bc' 1, \"wght\" -2.5e1, 'wght' 550");

  XCTAssertEqualObjects(variations[@(0x612C6263)], @1);
  XCTAssertEqualObjects(variations[@(0x77676874)], @550);
}

- (void)testFontVariationSettingsOverrideFontWeight
{
  UIFont *font = FontFromSettings("'wght' 450", FontWeight::Weight700);
  NSDictionary<NSNumber *, NSNumber *> *variations =
      [font.fontDescriptor objectForKey:(UIFontDescriptorAttributeName)kCTFontVariationAttribute];

  XCTAssertEqualObjects(variations[@(0x77676874)], @450);
}

- (void)testInvalidFontVariationSettingsParserValues
{
  NSArray<NSString *> *invalidSettings = @[
    @"'weight' 550",
    @"'wght' 1e999",
    @"'wght' NaN",
    @"'wght' 550,",
    @", 'wght' 550",
    @"'wght' 550,, 'opsz' 18",
  ];

  for (NSString *settings in invalidSettings) {
    XCTAssertEqual(RCTParseFontVariationSettings(settings).count, 0, @"%@ should be invalid", settings);
  }
}

- (void)testInvalidFontVariationSettingsClearVariations
{
  NSDictionary<NSNumber *, NSNumber *> *variations = FontVariationsFromSettings("'weight' 550");
  NSDictionary<NSNumber *, NSNumber *> *defaultVariations = FontVariationsFromSettings(std::nullopt);

  XCTAssertEqualObjects(variations, defaultVariations);
}

- (void)testEmptyFontVariationSettingsClearVariations
{
  NSDictionary<NSNumber *, NSNumber *> *variations = FontVariationsFromSettings("");
  NSDictionary<NSNumber *, NSNumber *> *defaultVariations = FontVariationsFromSettings(std::nullopt);

  XCTAssertEqualObjects(variations, defaultVariations);
}

- (void)testNormalFontVariationSettingsClearVariations
{
  NSDictionary<NSNumber *, NSNumber *> *variations = FontVariationsFromSettings("normal");
  NSDictionary<NSNumber *, NSNumber *> *defaultVariations = FontVariationsFromSettings(std::nullopt);

  XCTAssertEqualObjects(variations, defaultVariations);
}

- (void)testTextAlignmentStartAndEndResolveWithLayoutDirection
{
  XCTAssertEqual(NSTextAlignmentFromTextAlign(@"start", LayoutDirection::LeftToRight), NSTextAlignmentLeft);
  XCTAssertEqual(NSTextAlignmentFromTextAlign(@"start", LayoutDirection::RightToLeft), NSTextAlignmentRight);
  XCTAssertEqual(NSTextAlignmentFromTextAlign(@"end", LayoutDirection::LeftToRight), NSTextAlignmentRight);
  XCTAssertEqual(NSTextAlignmentFromTextAlign(@"end", LayoutDirection::RightToLeft), NSTextAlignmentLeft);
}

- (void)testSamenessOfEmptyAttributedStrings
{
  NSAttributedString *attributedString1 = [[NSAttributedString alloc] initWithString:@""];
  NSAttributedString *attributedString2 = [[NSAttributedString alloc] initWithString:@""];
  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, TextAttributes{}));
  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, TextAttributes{}));
}

- (void)testSamenessOfExactAttributedStrings
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, TextAttributes{}));
  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, TextAttributes{}));
}

- (void)testDifferenceOfDifferentString
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"hello World!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, TextAttributes{}));
  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, TextAttributes{}));
}

- (void)testDifferenceOfDifferentFragmentRanges
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 6)];

  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, TextAttributes{}));
  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, TextAttributes{}));
}

- (void)testDifferenceOfDifferentAttributes
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor blueColor] range:NSMakeRange(0, 5)];

  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, TextAttributes{}));
  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, TextAttributes{}));
}

- (void)testDifferenceOfExtraAttributes
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];
  [attributedString1 addAttribute:NSBackgroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, TextAttributes{}));
  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, TextAttributes{}));
}

- (void)testSamenessOfMissingInsensitiveAttributes
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];
  [attributedString1 addAttribute:NSShadowAttributeName value:[NSShadow new] range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{
    NSShadowAttributeName : [NSShadow new],
  };

  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, TextAttributes{}));
  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, TextAttributes{}));
}

- (void)testSamenessOfResolvedParagraphStyleLtr
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];
  [attributedString1 addAttribute:NSParagraphStyleAttributeName
                            value:NSParagraphStyle.defaultParagraphStyle
                            range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableParagraphStyle *str2ParagraphStyle = [NSMutableParagraphStyle new];
  str2ParagraphStyle.alignment = NSTextAlignmentLeft;

  // Base writing direction unless overridden by prop is determined by locale, and we assume this test runs in an LTR
  // locale.
  str2ParagraphStyle.baseWritingDirection = NSWritingDirectionLeftToRight;
  [attributedString2 addAttribute:NSParagraphStyleAttributeName value:str2ParagraphStyle range:NSMakeRange(0, 5)];

  TextAttributes textAttributes;
  textAttributes.layoutDirection = LayoutDirection::LeftToRight;
  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, textAttributes));
  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, textAttributes));
}

- (void)testSamenessOfResolvedParagraphStyleRtl
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];
  [attributedString1 addAttribute:NSParagraphStyleAttributeName
                            value:NSParagraphStyle.defaultParagraphStyle
                            range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableParagraphStyle *str2ParagraphStyle = [NSMutableParagraphStyle new];
  str2ParagraphStyle.alignment = NSTextAlignmentRight;

  // Base writing direction unless overridden by prop is determined by locale, and we assume this test runs in an LTR
  // locale.
  str2ParagraphStyle.baseWritingDirection = NSWritingDirectionLeftToRight;
  [attributedString2 addAttribute:NSParagraphStyleAttributeName value:str2ParagraphStyle range:NSMakeRange(0, 5)];

  TextAttributes textAttributes;
  textAttributes.layoutDirection = LayoutDirection::RightToLeft;
  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, textAttributes));
  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, textAttributes));
}

- (void)testSamenessOfResolvedInsensitiveParagraphStyle
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableParagraphStyle *str2ParagraphStyle = [NSMutableParagraphStyle new];
  str2ParagraphStyle.alignment = NSTextAlignmentLeft;

  // Base writing direction unless overridden by prop is determined by locale, and we assume this test runs in an LTR
  // locale.
  str2ParagraphStyle.baseWritingDirection = NSWritingDirectionLeftToRight;
  [attributedString2 addAttribute:NSParagraphStyleAttributeName value:str2ParagraphStyle range:NSMakeRange(0, 5)];

  TextAttributes textAttributes;
  textAttributes.layoutDirection = LayoutDirection::LeftToRight;
  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{
    NSParagraphStyleAttributeName : NSParagraphStyle.defaultParagraphStyle,
  };

  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, textAttributes));
  XCTAssertTrue(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, textAttributes));
}

- (void)testDifferenceOfResolvedParagraphStyle
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];
  [attributedString1 addAttribute:NSParagraphStyleAttributeName
                            value:NSParagraphStyle.defaultParagraphStyle
                            range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableParagraphStyle *str2ParagraphStyle = [NSMutableParagraphStyle new];
  str2ParagraphStyle.alignment = NSTextAlignmentCenter;

  // Base writing direction unless overridden by prop is determined by locale, and we assume this test runs in an LTR
  // locale.
  str2ParagraphStyle.baseWritingDirection = NSWritingDirectionLeftToRight;
  [attributedString2 addAttribute:NSParagraphStyleAttributeName value:str2ParagraphStyle range:NSMakeRange(0, 5)];

  TextAttributes textAttributes;
  textAttributes.layoutDirection = LayoutDirection::LeftToRight;
  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, textAttributes));
  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, textAttributes));
}

- (void)testDifferenceOfMissingParagraphStyle
{
  NSMutableAttributedString *attributedString1 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString1 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableAttributedString *attributedString2 = [[NSMutableAttributedString alloc] initWithString:@"Hello world!"];
  [attributedString2 addAttribute:NSForegroundColorAttributeName value:[UIColor redColor] range:NSMakeRange(0, 5)];

  NSMutableParagraphStyle *str2ParagraphStyle = [NSMutableParagraphStyle new];
  str2ParagraphStyle.alignment = NSTextAlignmentLeft;

  // Base writing direction unless overridden by prop is determined by locale, and we assume this test runs in an LTR
  // locale.
  str2ParagraphStyle.baseWritingDirection = NSWritingDirectionLeftToRight;
  [attributedString2 addAttribute:NSParagraphStyleAttributeName value:str2ParagraphStyle range:NSMakeRange(0, 5)];

  TextAttributes textAttributes;
  textAttributes.layoutDirection = LayoutDirection::LeftToRight;
  NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes = @{};

  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString1, attributedString2, insensitiveAttributes, textAttributes));
  XCTAssertFalse(RCTIsAttributedStringEffectivelySame(
      attributedString2, attributedString1, insensitiveAttributes, textAttributes));
}

// A std::string may legitimately contain an embedded NUL. The C-string APIs
// these converters used to call stop at it, silently truncating user text.

- (void)testNSStringFromStringPreservesEmbeddedNull
{
  std::string withNull("Hello\0World", 11);
  XCTAssertEqual(withNull.size(), 11u);

  NSString *converted = RCTNSStringFromString(withNull);

  XCTAssertEqual(converted.length, 11u);
  XCTAssertTrue([converted hasPrefix:@"Hello"]);
  XCTAssertTrue([converted hasSuffix:@"World"]);
}

- (void)testStringFromNSStringPreservesEmbeddedNull
{
  std::array<unichar, 3> chars{'a', 0, 'b'};
  NSString *withNull = [NSString stringWithCharacters:chars.data() length:chars.size()];
  XCTAssertEqual(withNull.length, 3u);

  std::string converted = RCTStringFromNSString(withNull);

  XCTAssertEqual(converted.size(), 3u);
  XCTAssertEqual(converted[0], 'a');
  XCTAssertEqual(converted[1], '\0');
  XCTAssertEqual(converted[2], 'b');
}

- (void)testStringConversionRoundTripsEmbeddedNull
{
  std::string original("A\0B\0C", 5);

  std::string roundTripped = RCTStringFromNSString(RCTNSStringFromString(original));

  XCTAssertEqual(roundTripped.size(), original.size());
  XCTAssertTrue(roundTripped == original);
}

- (void)testAttributedStringFromFragmentPreservesEmbeddedNull
{
  AttributedString attributedString;
  AttributedString::Fragment fragment;
  fragment.string = std::string("Hello\0World", 11);
  attributedString.appendFragment(std::move(fragment));

  NSAttributedString *result = RCTNSAttributedStringFromAttributedString(attributedString);

  XCTAssertEqual(result.string.length, 11u);
  XCTAssertTrue([result.string hasSuffix:@"World"]);
}

@end
