/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, RCTFontStyle) {
  RCTFontStyleUndefined = -1,
  RCTFontStyleNormal,
  RCTFontStyleItalic,
  RCTFontStyleOblique,
};

typedef NS_OPTIONS(NSInteger, RCTFontVariant) {
  RCTFontVariantUndefined = -1,
  RCTFontVariantDefault = 0,
  RCTFontVariantSmallCaps = 1 << 1,
  RCTFontVariantOldstyleNums = 1 << 2,
  RCTFontVariantLiningNums = 1 << 3,
  RCTFontVariantTabularNums = 1 << 4,
  RCTFontVariantProportionalNums = 1 << 5,
  RCTFontVariantStylisticOne = 1 << 6,
  RCTFontVariantStylisticTwo = 1 << 7,
  RCTFontVariantStylisticThree = 1 << 8,
  RCTFontVariantStylisticFour = 1 << 9,
  RCTFontVariantStylisticFive = 1 << 10,
  RCTFontVariantStylisticSix = 1 << 11,
  RCTFontVariantStylisticSeven = 1 << 12,
  RCTFontVariantStylisticEight = 1 << 13,
  RCTFontVariantStylisticNine = 1 << 14,
  RCTFontVariantStylisticTen = 1 << 15,
  RCTFontVariantStylisticEleven = 1 << 16,
  RCTFontVariantStylisticTwelve = 1 << 17,
  RCTFontVariantStylisticThirteen = 1 << 18,
  RCTFontVariantStylisticFourteen = 1 << 19,
  RCTFontVariantStylisticFifteen = 1 << 20,
  RCTFontVariantStylisticSixteen = 1 << 21,
  RCTFontVariantStylisticSeventeen = 1 << 22,
  RCTFontVariantStylisticEighteen = 1 << 23,
  RCTFontVariantStylisticNineteen = 1 << 24,
  RCTFontVariantStylisticTwenty = 1 << 25,
};

struct RCTFontProperties {
  NSString *family = nil;
  CGFloat size = NAN;
  UIFontWeight weight = NAN;
  RCTFontStyle style = RCTFontStyleUndefined;
  RCTFontVariant variant = RCTFontVariantUndefined;
  NSDictionary<NSNumber *, NSNumber *> *_Nullable variations = nil;
  CGFloat sizeMultiplier = NAN;
};

NS_ASSUME_NONNULL_END
