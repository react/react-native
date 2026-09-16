/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreText/CoreText.h>
#import <XCTest/XCTest.h>

#import <React/RCTFont.h>

@interface RCTFontTests : XCTestCase

@end

@implementation RCTFontTests

// It can happen (particularly in tvOS simulator) that expected and result font objects
// will be different objects, but the same font, so this macro now explicitly
// checks that fontName (which includes the style) and pointSize are equal.
#define RCTAssertEqualFonts(font1, font2)                  \
  {                                                        \
    XCTAssertEqualObjects(font1.fontName, font2.fontName); \
    XCTAssertEqual(font1.pointSize, font2.pointSize);      \
  }

- (void)testWeight
{
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightBold];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight" : @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightMedium];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight" : @"500"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightUltraLight];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight" : @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightRegular];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight" : @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testWeightFromFontName
{
  // "ExtraLight" and "UltraLight" name the same weight (OpenType usWeightClass 200).
  {
    UIFont *font = [UIFont fontWithName:@"HelveticaNeue-UltraLight" size:14];
    XCTAssertEqual(RCTGetFontWeight(font), UIFontWeightUltraLight);
  }
#if !TARGET_OS_TV
  {
    UIFont *font = [UIFont fontWithName:@"Seravek-ExtraLight" size:14];
    XCTAssertEqual(RCTGetFontWeight(font), UIFontWeightUltraLight);
  }
  {
    UIFont *font = [UIFont fontWithName:@"Seravek-Light" size:14];
    XCTAssertEqual(RCTGetFontWeight(font), UIFontWeightLight);
  }
#endif
}

- (void)testSize
{
  {
    UIFont *expected = [UIFont systemFontOfSize:18.5];
    UIFont *result = [RCTConvert UIFont:@{@"fontSize" : @18.5}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamily
{
#if !TARGET_OS_TV
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"Cochin"}];
    RCTAssertEqualFonts(expected, result);
  }
#endif
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"Helvetica Neue"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Italic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"HelveticaNeue-Italic"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testStyle
{
  {
    UIFont *font = [UIFont systemFontOfSize:14];
    UIFontDescriptor *fontDescriptor = [font fontDescriptor];
    UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
    symbolicTraits |= UIFontDescriptorTraitItalic;
    fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
    UIFont *expected = [UIFont fontWithDescriptor:fontDescriptor size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle" : @"italic"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle" : @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testStyleAndWeight
{
  {
    UIFont *font = [UIFont systemFontOfSize:14 weight:UIFontWeightUltraLight];
    UIFontDescriptor *fontDescriptor = [font fontDescriptor];
    UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
    symbolicTraits |= UIFontDescriptorTraitItalic;
    fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
    UIFont *expected = [UIFont fontWithDescriptor:fontDescriptor size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle" : @"italic", @"fontWeight" : @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *font = [UIFont systemFontOfSize:14 weight:UIFontWeightBold];
    UIFontDescriptor *fontDescriptor = [font fontDescriptor];
    UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
    symbolicTraits |= UIFontDescriptorTraitItalic;
    fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
    UIFont *expected = [UIFont fontWithDescriptor:fontDescriptor size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle" : @"italic", @"fontWeight" : @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamilyAndWeight
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"Helvetica Neue", @"fontWeight" : @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"HelveticaNeue-Bold", @"fontWeight" : @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
#if !TARGET_OS_TV
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"Cochin", @"fontWeight" : @"700"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"Cochin", @"fontWeight" : @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
#endif
}

- (void)testFamilyAndStyle
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Italic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"Helvetica Neue", @"fontStyle" : @"italic"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"HelveticaNeue-Italic", @"fontStyle" : @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamilyStyleAndWeight
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-LightItalic" size:14];
    UIFont *result =
        [RCTConvert UIFont:@{@"fontFamily" : @"Helvetica Neue", @"fontStyle" : @"italic", @"fontWeight" : @"300"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Bold" size:14];
    UIFont *result = [RCTConvert
        UIFont:@{@"fontFamily" : @"HelveticaNeue-Italic", @"fontStyle" : @"normal", @"fontWeight" : @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert
        UIFont:@{@"fontFamily" : @"HelveticaNeue-Italic", @"fontStyle" : @"normal", @"fontWeight" : @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testVariant
{
  {
    UIFont *expected = [UIFont monospacedDigitSystemFontOfSize:14 weight:UIFontWeightRegular];
    UIFont *result = [RCTConvert UIFont:@{@"fontVariant" : @[ @"tabular-nums" ]}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *monospaceFont = [UIFont monospacedDigitSystemFontOfSize:14 weight:UIFontWeightRegular];
    UIFontDescriptor *fontDescriptor = [monospaceFont.fontDescriptor fontDescriptorByAddingAttributes:@{
      UIFontDescriptorFeatureSettingsAttribute : @[ @{
        UIFontFeatureTypeIdentifierKey : @(kLowerCaseType),
        UIFontFeatureSelectorIdentifierKey : @(kLowerCaseSmallCapsSelector),
      } ]
    }];
    UIFont *expected = [UIFont fontWithDescriptor:fontDescriptor size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontVariant" : @[ @"tabular-nums", @"small-caps" ]}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testInvalidFont
{
  {
    UIFont *expected = [UIFont systemFontOfSize:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"foobar"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightBold];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily" : @"foobar", @"fontWeight" : @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
}

@end
