/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFontUtils.h"

#import <CoreText/CoreText.h>
#import <React/RCTFont+Private.h>
#import <React/RCTFont.h>

#import <algorithm>
#import <cmath>
#import <limits>
#import <map>
#import <mutex>

static RCTFontProperties RCTDefaultFontProperties()
{
  static RCTFontProperties defaultFontProperties;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    defaultFontProperties.family = [UIFont systemFontOfSize:defaultFontProperties.size].familyName;
    defaultFontProperties.size = 14;
    defaultFontProperties.weight = UIFontWeightRegular;
    defaultFontProperties.style = RCTFontStyleNormal;
    defaultFontProperties.variant = RCTFontVariantDefault;
    defaultFontProperties.sizeMultiplier = 1.0;
  });

  return defaultFontProperties;
}

static RCTFontProperties RCTResolveFontProperties(
    RCTFontProperties fontProperties,
    RCTFontProperties baseFontProperties)
{
  fontProperties.family = (fontProperties.family.length != 0u) ? fontProperties.family : baseFontProperties.family;
  fontProperties.size = !isnan(fontProperties.size) ? fontProperties.size : baseFontProperties.size;
  fontProperties.weight = !isnan(fontProperties.weight) ? fontProperties.weight : baseFontProperties.weight;
  fontProperties.style =
      fontProperties.style != RCTFontStyleUndefined ? fontProperties.style : baseFontProperties.style;
  fontProperties.variant =
      fontProperties.variant != RCTFontVariantUndefined ? fontProperties.variant : baseFontProperties.variant;
  return fontProperties;
}

static RCTFontStyle RCTGetFontStyle(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  if ((symbolicTraits & UIFontDescriptorTraitItalic) != 0u) {
    return RCTFontStyleItalic;
  }

  return RCTFontStyleNormal;
}

static NSArray *RCTFontFeatures(RCTFontVariant fontVariant)
{
  NSMutableArray *fontFeatures = [NSMutableArray array];
  static std::map<RCTFontVariant, NSDictionary *> mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    mapping = {
        {RCTFontVariantSmallCaps, @{
           UIFontFeatureTypeIdentifierKey : @(kLowerCaseType),
           UIFontFeatureSelectorIdentifierKey : @(kLowerCaseSmallCapsSelector),
         }},
        {RCTFontVariantOldstyleNums, @{
           UIFontFeatureTypeIdentifierKey : @(kNumberCaseType),
           UIFontFeatureSelectorIdentifierKey : @(kLowerCaseNumbersSelector),
         }},
        {RCTFontVariantLiningNums, @{
           UIFontFeatureTypeIdentifierKey : @(kNumberCaseType),
           UIFontFeatureSelectorIdentifierKey : @(kUpperCaseNumbersSelector),
         }},
        {RCTFontVariantTabularNums, @{
           UIFontFeatureTypeIdentifierKey : @(kNumberSpacingType),
           UIFontFeatureSelectorIdentifierKey : @(kMonospacedNumbersSelector),
         }},
        {RCTFontVariantProportionalNums, @{
           UIFontFeatureTypeIdentifierKey : @(kNumberSpacingType),
           UIFontFeatureSelectorIdentifierKey : @(kProportionalNumbersSelector),
         }},
        {RCTFontVariantStylisticOne, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltOneOnSelector),
         }},
        {RCTFontVariantStylisticTwo, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltTwoOnSelector),
         }},
        {RCTFontVariantStylisticThree, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltThreeOnSelector),
         }},
        {RCTFontVariantStylisticFour, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltFourOnSelector),
         }},
        {RCTFontVariantStylisticFive, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltFiveOnSelector),
         }},
        {RCTFontVariantStylisticSix, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltSixOnSelector),
         }},
        {RCTFontVariantStylisticSeven, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltSevenOnSelector),
         }},
        {RCTFontVariantStylisticEight, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltEightOnSelector),
         }},
        {RCTFontVariantStylisticNine, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltNineOnSelector),
         }},
        {RCTFontVariantStylisticTen, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltTenOnSelector),
         }},
        {RCTFontVariantStylisticEleven, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltElevenOnSelector),
         }},
        {RCTFontVariantStylisticTwelve, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltTwelveOnSelector),
         }},
        {RCTFontVariantStylisticThirteen, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltThirteenOnSelector),
         }},
        {RCTFontVariantStylisticFourteen, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltFourteenOnSelector),
         }},
        {RCTFontVariantStylisticFifteen, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltFifteenOnSelector),
         }},
        {RCTFontVariantStylisticSixteen, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltSixteenOnSelector),
         }},
        {RCTFontVariantStylisticSeventeen, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltSeventeenOnSelector),
         }},
        {RCTFontVariantStylisticEighteen, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltEighteenOnSelector),
         }},
        {RCTFontVariantStylisticNineteen, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltNineteenOnSelector),
         }},
        {RCTFontVariantStylisticTwenty, @{
           UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
           UIFontFeatureSelectorIdentifierKey : @(kStylisticAltTwentyOnSelector),
         }},
    };
  });

  if ((fontVariant & RCTFontVariantSmallCaps) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantSmallCaps]];
  }
  if ((fontVariant & RCTFontVariantOldstyleNums) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantOldstyleNums]];
  }
  if ((fontVariant & RCTFontVariantLiningNums) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantLiningNums]];
  }
  if ((fontVariant & RCTFontVariantTabularNums) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantTabularNums]];
  }
  if ((fontVariant & RCTFontVariantProportionalNums) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantProportionalNums]];
  }
  if ((fontVariant & RCTFontVariantStylisticOne) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticOne]];
  }
  if ((fontVariant & RCTFontVariantStylisticTwo) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticTwo]];
  }
  if ((fontVariant & RCTFontVariantStylisticThree) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticThree]];
  }
  if ((fontVariant & RCTFontVariantStylisticFour) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticFour]];
  }
  if ((fontVariant & RCTFontVariantStylisticFive) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticFive]];
  }
  if ((fontVariant & RCTFontVariantStylisticSix) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticSix]];
  }
  if ((fontVariant & RCTFontVariantStylisticSeven) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticSeven]];
  }
  if ((fontVariant & RCTFontVariantStylisticEight) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticEight]];
  }
  if ((fontVariant & RCTFontVariantStylisticNine) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticNine]];
  }
  if ((fontVariant & RCTFontVariantStylisticTen) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticTen]];
  }
  if ((fontVariant & RCTFontVariantStylisticEleven) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticEleven]];
  }
  if ((fontVariant & RCTFontVariantStylisticTwelve) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticTwelve]];
  }
  if ((fontVariant & RCTFontVariantStylisticThirteen) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticThirteen]];
  }
  if ((fontVariant & RCTFontVariantStylisticFourteen) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticFourteen]];
  }
  if ((fontVariant & RCTFontVariantStylisticFifteen) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticFifteen]];
  }
  if ((fontVariant & RCTFontVariantStylisticSixteen) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticSixteen]];
  }
  if ((fontVariant & RCTFontVariantStylisticSeventeen) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticSeventeen]];
  }
  if ((fontVariant & RCTFontVariantStylisticEighteen) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticEighteen]];
  }
  if ((fontVariant & RCTFontVariantStylisticNineteen) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticNineteen]];
  }
  if ((fontVariant & RCTFontVariantStylisticTwenty) != 0) {
    [fontFeatures addObject:mapping[RCTFontVariantStylisticTwenty]];
  }

  return fontFeatures;
}

static RCTDefaultFontResolver defaultFontResolver;

void RCTSetDefaultFontResolver(RCTDefaultFontResolver handler)
{
  defaultFontResolver = handler;
}

static UIFont *RCTDefaultFontWithFontProperties(const RCTFontProperties &fontProperties)
{
  static NSCache *fontCache;
  static std::mutex fontCacheMutex;

  CGFloat effectiveFontSize = fontProperties.sizeMultiplier * fontProperties.size;
  NSString *cacheKey = [NSString stringWithFormat:@"%@/%.1f/%.2f/%ld",
                                                  fontProperties.family,
                                                  effectiveFontSize,
                                                  fontProperties.weight,
                                                  (long)fontProperties.style];
  UIFont *font;

  {
    std::lock_guard<std::mutex> lock(fontCacheMutex);
    if (fontCache == nil) {
      fontCache = [NSCache new];
    }
    font = [fontCache objectForKey:cacheKey];
  }

  if (font == nil) {
    if (defaultFontResolver != nil) {
      font = defaultFontResolver(fontProperties);
    }

    if (font == nil) {
      font = RCTGetLegacyDefaultFont(effectiveFontSize, fontProperties.weight);
    }

    if (font == nil) {
      font = [UIFont systemFontOfSize:effectiveFontSize weight:fontProperties.weight];
    }

    BOOL isItalicFont = fontProperties.style == RCTFontStyleItalic;
    BOOL isCondensedFont = [fontProperties.family isEqualToString:@"SystemCondensed"];

    if (isItalicFont || isCondensedFont) {
      UIFontDescriptor *fontDescriptor = [font fontDescriptor];
      UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;

      if (isItalicFont) {
        symbolicTraits |= UIFontDescriptorTraitItalic;
      }

      if (isCondensedFont) {
        symbolicTraits |= UIFontDescriptorTraitCondensed;
      }

      fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
      font = [UIFont fontWithDescriptor:fontDescriptor size:effectiveFontSize];
    }

    {
      std::lock_guard<std::mutex> lock(fontCacheMutex);
      [fontCache setObject:font forKey:cacheKey];
    }
  }

  return font;
}

static UIFontDescriptorSystemDesign RCTGetFontDescriptorSystemDesign(NSString *family)
{
  static NSDictionary<NSString *, NSString *> *systemDesigns = @{
    @"system-ui" : UIFontDescriptorSystemDesignDefault,
    @"ui-sans-serif" : UIFontDescriptorSystemDesignDefault,
    @"ui-serif" : UIFontDescriptorSystemDesignSerif,
    @"ui-rounded" : UIFontDescriptorSystemDesignRounded,
    @"ui-monospace" : UIFontDescriptorSystemDesignMonospaced
  };

  return systemDesigns[family];
}

UIFont *RCTFontWithFontProperties(RCTFontProperties fontProperties)
{
  RCTFontProperties defaultFontProperties = RCTDefaultFontProperties();
  fontProperties = RCTResolveFontProperties(fontProperties, defaultFontProperties);

  assert(!isnan(fontProperties.sizeMultiplier));
  CGFloat effectiveFontSize = fontProperties.sizeMultiplier * fontProperties.size;
  UIFont *font;
  UIFontDescriptorSystemDesign design = RCTGetFontDescriptorSystemDesign([fontProperties.family lowercaseString]);
  if (design != nullptr) {
    // Create a system font which `-fontDescriptorWithDesign:` asks for
    // (see:
    // https://developer.apple.com/documentation/uikit/uifontdescriptor/3151797-fontdescriptorwithdesign?language=objc)
    // It's OK to use `RCTDefaultFontWithFontProperties` which creates a system font
    font = RCTDefaultFontWithFontProperties(fontProperties);
    UIFontDescriptor *descriptor = [font.fontDescriptor fontDescriptorWithDesign:design];
    font = [UIFont fontWithDescriptor:descriptor size:effectiveFontSize];
  } else if ([fontProperties.family isEqualToString:defaultFontProperties.family]) {
    // Handle system font as special case. This ensures that we preserve
    // the specific metrics of the standard system font as closely as possible.
    font = RCTDefaultFontWithFontProperties(fontProperties);
  } else {
    NSArray<NSString *> *fontNames = [UIFont fontNamesForFamilyName:fontProperties.family];
    UIFontWeight fontWeight = fontProperties.weight;

    if (fontNames.count == 0) {
      // Gracefully handle being given a font name rather than font family, for
      // example: "Helvetica Light Oblique" rather than just "Helvetica".
      font = [UIFont fontWithName:fontProperties.family size:effectiveFontSize];

      if (!font) {
        // Failback to system font.
        font = RCTDefaultFontWithFontProperties(fontProperties);
      }
    } else {
      // Get the closest font that matches the given weight for the fontFamily
      CGFloat closestWeight = INFINITY;
      for (NSString *name in fontNames) {
        UIFont *fontMatch = [UIFont fontWithName:name size:effectiveFontSize];

        if (RCTGetFontStyle(fontMatch) != fontProperties.style) {
          continue;
        }

        CGFloat testWeight = RCTGetFontWeight(fontMatch);
        if (ABS(testWeight - fontWeight) < ABS(closestWeight - fontWeight)) {
          font = fontMatch;
          closestWeight = testWeight;
        }
      }

      if (font == nil) {
        // If we still don't have a match at least return the first font in the
        // fontFamily This is to support built-in font Zapfino and other custom
        // single font families like Impact
        font = [UIFont fontWithName:fontNames[0] size:effectiveFontSize];
      }
    }
  }

  // Apply font variants to font object.
  if (fontProperties.variant != RCTFontVariantDefault) {
    NSArray *fontFeatures = RCTFontFeatures(fontProperties.variant);
    UIFontDescriptor *fontDescriptor = [font.fontDescriptor
        fontDescriptorByAddingAttributes:@{UIFontDescriptorFeatureSettingsAttribute : fontFeatures}];
    font = [UIFont fontWithDescriptor:fontDescriptor size:effectiveFontSize];
  }

  return font;
}
