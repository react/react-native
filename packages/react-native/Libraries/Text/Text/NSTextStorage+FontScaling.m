/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "NSTextStorage+FontScaling.h"

#import <React/RCTUtils.h>

typedef NS_OPTIONS(NSInteger, RCTTextSizeComparisonOptions) {
  RCTTextSizeComparisonSmaller = 1 << 0,
  RCTTextSizeComparisonLarger = 1 << 1,
  RCTTextSizeComparisonWithinRange = 1 << 2,
};

@implementation NSTextStorage (FontScaling)

- (void)scaleFontSizeToFitSize:(CGSize)size
               minimumFontSize:(CGFloat)minimumFontSize
               maximumFontSize:(CGFloat)maximumFontSize
{
  // Don't scale the font if it already fits
  if ([self compareToSize:size thresholdRatio:0.01] & RCTTextSizeComparisonSmaller) {
    return;
  }

  CGFloat bottomRatio = 1.0 / 128.0;
  CGFloat topRatio = 128.0;
  CGFloat ratio = 1.0;

  NSAttributedString *originalAttributedString = [self copy];

  CGFloat lastRatioWhichFits = 0.02;

  while (true) {
    [self scaleFontSizeWithRatio:ratio minimumFontSize:minimumFontSize maximumFontSize:maximumFontSize];

    RCTTextSizeComparisonOptions comparison = [self compareToSize:size thresholdRatio:0.01];

    if ((comparison & RCTTextSizeComparisonWithinRange) && (comparison & RCTTextSizeComparisonSmaller)) {
      return;
    } else if (comparison & RCTTextSizeComparisonSmaller) {
      bottomRatio = ratio;
      lastRatioWhichFits = ratio;
    } else {
      topRatio = ratio;
    }

    ratio = (topRatio + bottomRatio) / 2.0;

    CGFloat kRatioThreshold = 0.005;
    if (ABS(topRatio - bottomRatio) < kRatioThreshold || ABS(topRatio - ratio) < kRatioThreshold ||
        ABS(bottomRatio - ratio) < kRatioThreshold) {
      [self replaceCharactersInRange:(NSRange){0, self.length} withAttributedString:originalAttributedString];

      [self scaleFontSizeWithRatio:lastRatioWhichFits minimumFontSize:minimumFontSize maximumFontSize:maximumFontSize];
      return;
    }

    [self replaceCharactersInRange:(NSRange){0, self.length} withAttributedString:originalAttributedString];
  }
}

- (RCTTextSizeComparisonOptions)compareToSize:(CGSize)size thresholdRatio:(CGFloat)thresholdRatio
{
  NSLayoutManager *layoutManager = self.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  // A workaround for truncatedGlyphRangeInLineFragmentForGlyphAtIndex returning NSNotFound when text has only
  // one character and it gets truncated
  if ([self length] == 1) {
    CGSize characterSize = [[self string] sizeWithAttributes:[self attributesAtIndex:0 effectiveRange:nil]];
    if (characterSize.width > size.width) {
      return RCTTextSizeComparisonLarger;
    }
  }

  [layoutManager ensureLayoutForTextContainer:textContainer];

  // Does it fit the text container?
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange truncatedGlyphRange = [layoutManager truncatedGlyphRangeInLineFragmentForGlyphAtIndex:glyphRange.length - 1];

  if (truncatedGlyphRange.location != NSNotFound) {
    return RCTTextSizeComparisonLarger;
  }

  CGSize measuredSize = [layoutManager usedRectForTextContainer:textContainer].size;

  // Does it fit the size? Yoga's pixel-grid rounding can leave the height a float ULP short of
  // the line height (#52642), so a shortfall smaller than one physical pixel still counts as fitting.
  CGFloat heightTolerance = 1.0 / RCTScreenScale();
  BOOL fitsSize = size.width >= measuredSize.width && size.height + heightTolerance > measuredSize.height;

  CGSize thresholdSize = (CGSize){
      size.width * thresholdRatio,
      size.height * thresholdRatio,
  };

  RCTTextSizeComparisonOptions result = 0;

  result |= (fitsSize) ? RCTTextSizeComparisonSmaller : RCTTextSizeComparisonLarger;

  if (ABS(measuredSize.width - size.width) < thresholdSize.width) {
    result = result | RCTTextSizeComparisonWithinRange;
  }

  return result;
}

- (void)scaleFontSizeWithRatio:(CGFloat)ratio
               minimumFontSize:(CGFloat)minimumFontSize
               maximumFontSize:(CGFloat)maximumFontSize
{
  [self beginEditing];

  [self enumerateAttribute:NSFontAttributeName
                   inRange:(NSRange){0, self.length}
                   options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                usingBlock:^(UIFont *_Nullable font, NSRange range, BOOL *_Nonnull stop) {
                  if (!font) {
                    return;
                  }

                  CGFloat fontSize = MAX(MIN(font.pointSize * ratio, maximumFontSize), minimumFontSize);

                  [self addAttribute:NSFontAttributeName value:[font fontWithSize:fontSize] range:range];
                }];

  [self endEditing];
}

@end
