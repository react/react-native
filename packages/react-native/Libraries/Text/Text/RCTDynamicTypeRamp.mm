/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDynamicTypeRamp.h>

@implementation RCTConvert (DynamicTypeRamp)

RCT_ENUM_CONVERTER(
    RCTDynamicTypeRamp,
    (@{
      @"caption2" : @(RCTDynamicTypeRampCaption2),
      @"caption1" : @(RCTDynamicTypeRampCaption1),
      @"footnote" : @(RCTDynamicTypeRampFootnote),
      @"subheadline" : @(RCTDynamicTypeRampSubheadline),
      @"callout" : @(RCTDynamicTypeRampCallout),
      @"body" : @(RCTDynamicTypeRampBody),
      @"headline" : @(RCTDynamicTypeRampHeadline),
      @"title3" : @(RCTDynamicTypeRampTitle3),
      @"title2" : @(RCTDynamicTypeRampTitle2),
      @"title1" : @(RCTDynamicTypeRampTitle1),
      @"largeTitle" : @(RCTDynamicTypeRampLargeTitle),
    }),
    RCTDynamicTypeRampUndefined,
    integerValue)

@end

UIFontMetrics *RCTUIFontMetricsForDynamicTypeRamp(RCTDynamicTypeRamp dynamicTypeRamp)
{
  static NSDictionary<NSNumber *, UIFontTextStyle> *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableDictionary<NSNumber *, UIFontTextStyle> *mutableMapping = [@{
      @(RCTDynamicTypeRampCaption2) : UIFontTextStyleCaption2,
      @(RCTDynamicTypeRampCaption1) : UIFontTextStyleCaption1,
      @(RCTDynamicTypeRampFootnote) : UIFontTextStyleFootnote,
      @(RCTDynamicTypeRampSubheadline) : UIFontTextStyleSubheadline,
      @(RCTDynamicTypeRampCallout) : UIFontTextStyleCallout,
      @(RCTDynamicTypeRampBody) : UIFontTextStyleBody,
      @(RCTDynamicTypeRampHeadline) : UIFontTextStyleHeadline,
      @(RCTDynamicTypeRampTitle3) : UIFontTextStyleTitle3,
      @(RCTDynamicTypeRampTitle2) : UIFontTextStyleTitle2,
      @(RCTDynamicTypeRampTitle1) : UIFontTextStyleTitle1,
    } mutableCopy];
#if !TARGET_OS_TV
    mutableMapping[@(RCTDynamicTypeRampLargeTitle)] = UIFontTextStyleLargeTitle;
#endif
    mapping = [mutableMapping copy];
  });

  id textStyle =
      mapping[@(dynamicTypeRamp)] ?: UIFontTextStyleBody; // Default to body if we don't recognize the specified ramp
  return [UIFontMetrics metricsForTextStyle:textStyle];
}

CGFloat RCTBaseSizeForDynamicTypeRamp(RCTDynamicTypeRamp dynamicTypeRamp)
{
  static NSDictionary<NSNumber *, NSNumber *> *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // Values taken from
    // https://developer.apple.com/design/human-interface-guidelines/foundations/typography/#specifications
    mapping = @{
      @(RCTDynamicTypeRampCaption2) : @11,
      @(RCTDynamicTypeRampCaption1) : @12,
      @(RCTDynamicTypeRampFootnote) : @13,
      @(RCTDynamicTypeRampSubheadline) : @15,
      @(RCTDynamicTypeRampCallout) : @16,
      @(RCTDynamicTypeRampBody) : @17,
      @(RCTDynamicTypeRampHeadline) : @17,
      @(RCTDynamicTypeRampTitle3) : @20,
      @(RCTDynamicTypeRampTitle2) : @22,
      @(RCTDynamicTypeRampTitle1) : @28,
      @(RCTDynamicTypeRampLargeTitle) : @34,
    };
  });

  NSNumber *baseSize =
      mapping[@(dynamicTypeRamp)] ?: @17; // Default to body size if we don't recognize the specified ramp
  return [baseSize doubleValue];
}
