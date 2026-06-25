/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>

using namespace facebook::react;

@interface RCTAttributedTextUtilsTest : XCTestCase

@end

@implementation RCTAttributedTextUtilsTest

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

@end
