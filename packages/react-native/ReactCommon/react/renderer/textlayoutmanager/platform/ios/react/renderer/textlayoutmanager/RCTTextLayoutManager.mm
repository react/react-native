/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextLayoutManager.h"

#import <array>

#import "RCTAttributedTextUtils.h"

#import <React/NSTextStorage+FontScaling.h>
#import <React/RCTUtils.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <react/utils/SimpleThreadSafeCache.h>

using namespace facebook::react;

@implementation RCTTextLayoutManager {
  SimpleThreadSafeCache<AttributedString, std::shared_ptr<void>, 256> _cache;
}

static NSLineBreakMode RCTNSLineBreakModeFromEllipsizeMode(EllipsizeMode ellipsizeMode)
{
  switch (ellipsizeMode) {
    case EllipsizeMode::Clip:
      return NSLineBreakByClipping;
    case EllipsizeMode::Head:
      return NSLineBreakByTruncatingHead;
    case EllipsizeMode::Tail:
      return NSLineBreakByTruncatingTail;
    case EllipsizeMode::Middle:
      return NSLineBreakByTruncatingMiddle;
  }
}

- (TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                         paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                               layoutContext:(TextLayoutContext)layoutContext
                           layoutConstraints:(LayoutConstraints)layoutConstraints
{
  if (attributedString.length == 0) {
    // This is not really an optimization because that should be checked much earlier on the call stack.
    // Sometimes, very irregularly, measuring an empty string crashes/freezes iOS internal text infrastructure.
    // This is our last line of defense.
    return {};
  }

  CGSize maximumSize = CGSize{layoutConstraints.maximumSize.width, CGFLOAT_MAX};
  NSTextStorage *textStorage = [self _textStorageAndLayoutManagerWithAttributesString:attributedString
                                                                  paragraphAttributes:paragraphAttributes
                                                                                 size:maximumSize];

  return [self _measureTextStorage:textStorage paragraphAttributes:paragraphAttributes layoutContext:layoutContext];
}

- (TextMeasurement)measureAttributedString:(AttributedString)attributedString
                       paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                             layoutContext:(TextLayoutContext)layoutContext
                         layoutConstraints:(LayoutConstraints)layoutConstraints
{
  return [self measureNSAttributedString:[self _nsAttributedStringFromAttributedString:attributedString]
                     paragraphAttributes:paragraphAttributes
                           layoutContext:layoutContext
                       layoutConstraints:layoutConstraints];
}

- (void)drawAttributedString:(AttributedString)attributedString
         paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame
           drawHighlightPath:(void (^_Nullable)(UIBezierPath *highlightPath))block
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:frame.size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

#if TARGET_OS_MACCATALYST
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSaveGState(context);
  CGContextSetShouldSmoothFonts(context, NO);
#endif

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];

  [self processTruncatedAttributedText:textStorage textContainer:textContainer layoutManager:layoutManager];

  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:frame.origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:frame.origin];

#if TARGET_OS_MACCATALYST
  CGContextRestoreGState(context);
#endif

  // Custom decoration pass: enumerate `RCTCustomDecorationAttributeName`
  // ranges and paint each one ourselves. Covers wavy (no UIKit equivalent),
  // dotted, and dashed (UIKit's pattern bits don't match browser geometry).
  {
    CGContextRef ctx = UIGraphicsGetCurrentContext();
    if (ctx != nullptr) {
      NSRange charRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:nullptr];
      [textStorage
          enumerateAttribute:RCTCustomDecorationAttributeName
                     inRange:charRange
                     options:0
                  usingBlock:^(NSDictionary *_Nullable attrs, NSRange attrRange, __unused BOOL *stop) {
                    if (attrs == nil) {
                      return;
                    }
                    NSArray<NSString *> *lines = attrs[@"lines"];
                    UIColor *strokeColor = attrs[@"color"];
                    NSString *style = attrs[@"style"];
                    UIFont *font = [textStorage attribute:NSFontAttributeName
                                                  atIndex:attrRange.location
                                           effectiveRange:nullptr];
                    if (font == nil || strokeColor == nil || style == nil) {
                      return;
                    }

                    CGFloat fontSize = font.pointSize;
                    // Thickness scales with the type size so the decoration
                    // remains visible at small sizes and proportionate at
                    // large ones. ~`fontSize / 12` plus a 1.5pt floor.
                    CGFloat thickness = MAX(fontSize / 12.0f, 1.5f);
                    CGFloat wavyWavelength = 1.0f + 2.0f * round(2.0f * thickness + 0.5f);
                    CGFloat wavyCpDistance = 0.5f + round(3.0f * thickness + 0.5f);

                    NSRange targetGlyphRange = [layoutManager glyphRangeForCharacterRange:attrRange
                                                                     actualCharacterRange:nullptr];

                    CGContextSaveGState(ctx);
                    CGContextSetStrokeColorWithColor(ctx, strokeColor.CGColor);
                    CGContextSetLineWidth(ctx, thickness);
                    CGContextSetShouldAntialias(ctx, YES);

                    if ([style isEqualToString:@"dotted"]) {
                      const std::array<CGFloat, 2> dotIntervals = {0.0f, thickness * 2.0f};
                      CGContextSetLineDash(ctx, 0, dotIntervals.data(), dotIntervals.size());
                      CGContextSetLineCap(ctx, kCGLineCapRound);
                    } else if ([style isEqualToString:@"dashed"]) {
                      const std::array<CGFloat, 2> dashIntervals = {thickness * 2.0f, thickness};
                      CGContextSetLineDash(ctx, 0, dashIntervals.data(), dashIntervals.size());
                      CGContextSetLineCap(ctx, kCGLineCapButt);
                    } else {
                      CGContextSetLineCap(ctx, kCGLineCapRound);
                    }

                    [layoutManager
                        enumerateLineFragmentsForGlyphRange:targetGlyphRange
                                                 usingBlock:^(
                                                     CGRect lineRect,
                                                     __unused CGRect usedRect,
                                                     NSTextContainer *_Nonnull container,
                                                     NSRange lineGlyphRange,
                                                     __unused BOOL *_Nonnull innerStop) {
                                                   NSRange intersection =
                                                       NSIntersectionRange(targetGlyphRange, lineGlyphRange);
                                                   if (intersection.length == 0) {
                                                     return;
                                                   }
                                                   CGRect firstGlyphRect = [layoutManager
                                                       boundingRectForGlyphRange:NSMakeRange(intersection.location, 1)
                                                                 inTextContainer:container];
                                                   CGRect lastGlyphRect = [layoutManager
                                                       boundingRectForGlyphRange:NSMakeRange(
                                                                                     NSMaxRange(intersection) - 1, 1)
                                                                 inTextContainer:container];
                                                   CGFloat x1 = firstGlyphRect.origin.x + frame.origin.x;
                                                   CGFloat x2 = CGRectGetMaxX(lastGlyphRect) + frame.origin.x;
                                                   CGFloat baseline =
                                                       lineRect.origin.y + font.ascender + frame.origin.y;

                                                   // NOLINTNEXTLINE(cppcoreguidelines-init-variables)
                                                   for (NSString *line in lines) {
                                                     CGFloat y = 0.0f;
                                                     if ([line isEqualToString:@"underline"]) {
                                                       if ([style isEqualToString:@"wavy"]) {
                                                         y = baseline + 1.0f;
                                                       } else {
                                                         y = baseline + thickness + 1.0f;
                                                       }
                                                     } else {
                                                       y = baseline - (font.ascender + font.descender) / 2.0f + 1.0f;
                                                     }
                                                     if ([style isEqualToString:@"wavy"]) {
                                                       CGContextSaveGState(ctx);
                                                       CGContextClipToRect(
                                                           ctx,
                                                           CGRectMake(
                                                               x1,
                                                               y - wavyCpDistance - thickness,
                                                               x2 - x1,
                                                               2 * wavyCpDistance + 2 * thickness));
                                                       CGContextBeginPath(ctx);
                                                       CGContextMoveToPoint(ctx, x1, y);
                                                       CGFloat step = wavyWavelength / 2.0f;
                                                       CGFloat wx = x1;
                                                       while (wx < x2) {
                                                         CGFloat midX = wx + step;
                                                         CGContextAddCurveToPoint(
                                                             ctx,
                                                             midX,
                                                             y + wavyCpDistance,
                                                             midX,
                                                             y - wavyCpDistance,
                                                             wx + wavyWavelength,
                                                             y);
                                                         wx += wavyWavelength;
                                                       }
                                                       CGContextStrokePath(ctx);
                                                       CGContextRestoreGState(ctx);
                                                     } else {
                                                       CGContextBeginPath(ctx);
                                                       CGContextMoveToPoint(ctx, x1, y);
                                                       CGContextAddLineToPoint(ctx, x2, y);
                                                       CGContextStrokePath(ctx);
                                                     }
                                                   }
                                                 }];

                    CGContextRestoreGState(ctx);
                  }];
    }
  }

  if (block != nil) {
    __block UIBezierPath *highlightPath = nil;
    NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];

    [textStorage
        enumerateAttribute:RCTAttributedStringIsHighlightedAttributeName
                   inRange:characterRange
                   options:0
                usingBlock:^(NSNumber *value, NSRange range, __unused BOOL *stop) {
                  if (!value.boolValue) {
                    return;
                  }

                  [layoutManager
                      enumerateEnclosingRectsForGlyphRange:range
                                  withinSelectedGlyphRange:range
                                           inTextContainer:textContainer
                                                usingBlock:^(CGRect enclosingRect, __unused BOOL *anotherStop) {
                                                  UIBezierPath *path = [UIBezierPath
                                                      bezierPathWithRoundedRect:CGRectInset(enclosingRect, -2, -2)
                                                                   cornerRadius:2];
                                                  if (highlightPath != nullptr) {
                                                    [highlightPath appendPath:path];
                                                  } else {
                                                    highlightPath = path;
                                                  }
                                                }];
                }];

    block(highlightPath);
  }
}

- (void)processTruncatedAttributedText:(NSTextStorage *)textStorage
                         textContainer:(NSTextContainer *)textContainer
                         layoutManager:(NSLayoutManager *)layoutManager
{
  if (textContainer.maximumNumberOfLines > 0) {
    [layoutManager ensureLayoutForTextContainer:textContainer];
    NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
    __block int line = 0;
    [layoutManager
        enumerateLineFragmentsForGlyphRange:glyphRange
                                 usingBlock:^(
                                     CGRect rect,
                                     CGRect usedRect,
                                     NSTextContainer *_Nonnull _,
                                     NSRange lineGlyphRange,
                                     BOOL *_Nonnull stop) {
                                   if (line == textContainer.maximumNumberOfLines - 1) {
                                     NSRange truncatedRange = [layoutManager
                                         truncatedGlyphRangeInLineFragmentForGlyphAtIndex:lineGlyphRange.location];
                                     if (truncatedRange.location != NSNotFound) {
                                       NSRange characterRange =
                                           [layoutManager characterRangeForGlyphRange:truncatedRange
                                                                     actualGlyphRange:nil];
                                       if (characterRange.location > 0 && characterRange.length > 0) {
                                         // Remove color attributes for truncated range
                                         for (NSAttributedStringKey key in
                                              @[ NSForegroundColorAttributeName, NSBackgroundColorAttributeName ]) {
                                           [textStorage removeAttribute:key range:characterRange];
                                           id attribute = [textStorage attribute:key
                                                                         atIndex:characterRange.location - 1
                                                                  effectiveRange:nil];
                                           if (attribute != nullptr) {
                                             [textStorage addAttribute:key value:attribute range:characterRange];
                                           }
                                         }
                                       }
                                     }
                                   }
                                   line++;
                                 }];
  }
}

- (LinesMeasurements)getLinesForAttributedString:(facebook::react::AttributedString)attributedString
                             paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                            size:(CGSize)size
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];

  std::vector<LineMeasurement> paragraphLines{};
  auto blockParagraphLines = &paragraphLines;

  [layoutManager
      enumerateLineFragmentsForGlyphRange:glyphRange
                               usingBlock:^(
                                   CGRect overallRect,
                                   CGRect usedRect,
                                   NSTextContainer *_Nonnull usedTextContainer,
                                   NSRange lineGlyphRange,
                                   BOOL *_Nonnull stop) {
                                 NSRange range = [layoutManager characterRangeForGlyphRange:lineGlyphRange
                                                                           actualGlyphRange:nil];
                                 NSString *renderedString = [textStorage.string substringWithRange:range];
                                 UIFont *font =
                                     [[textStorage attributedSubstringFromRange:range] attribute:NSFontAttributeName
                                                                                         atIndex:0
                                                                                  effectiveRange:nil];
                                 auto rect = facebook::react::Rect{
                                     .origin = facebook::react::Point{.x = usedRect.origin.x, .y = usedRect.origin.y},
                                     .size = facebook::react::Size{
                                         .width = usedRect.size.width, .height = usedRect.size.height}};

                                 CGFloat baseline = [layoutManager locationForGlyphAtIndex:range.location].y;
                                 const char *renderedUTF8 = [renderedString UTF8String];
                                 auto line = LineMeasurement{
                                     std::string(renderedUTF8 != nullptr ? renderedUTF8 : ""),
                                     rect,
                                     overallRect.size.height - baseline,
                                     font.capHeight,
                                     baseline,
                                     font.xHeight};
                                 blockParagraphLines->push_back(line);
                               }];
  return paragraphLines;
}

- (NSTextStorage *)_textStorageAndLayoutManagerWithAttributesString:(NSAttributedString *)attributedString
                                                paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                               size:(CGSize)size
{
  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];

  textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
  textContainer.lineBreakMode = paragraphAttributes.maximumNumberOfLines > 0
      ? RCTNSLineBreakModeFromEllipsizeMode(paragraphAttributes.ellipsizeMode)
      : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = paragraphAttributes.maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  layoutManager.usesFontLeading = NO;
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:attributedString];

  RCTApplyBaselineOffset(textStorage);

  [textStorage addLayoutManager:layoutManager];

  if (paragraphAttributes.adjustsFontSizeToFit) {
    CGFloat minimumFontSize = !isnan(paragraphAttributes.minimumFontSize) ? paragraphAttributes.minimumFontSize : 4.0;
    CGFloat maximumFontSize = !isnan(paragraphAttributes.maximumFontSize) ? paragraphAttributes.maximumFontSize : 96.0;
    [textStorage scaleFontSizeToFitSize:size minimumFontSize:minimumFontSize maximumFontSize:maximumFontSize];
  }

  return textStorage;
}

- (std::shared_ptr<const EventEmitter>)getEventEmitterWithAttributeString:(AttributedString)attributedString
                                                      paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                                    frame:(CGRect)frame
                                                                  atPoint:(CGPoint)point
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:frame.size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  CGFloat fraction;
  NSUInteger characterIndex = [layoutManager characterIndexForPoint:point
                                                    inTextContainer:textContainer
                           fractionOfDistanceBetweenInsertionPoints:&fraction];

  // If the point is not before (fraction == 0.0) the first character and not
  // after (fraction == 1.0) the last character, then the attribute is valid.
  if (textStorage.length > 0 && (fraction > 0 || characterIndex > 0) &&
      (fraction < 1 || characterIndex < textStorage.length - 1)) {
    NSData *eventEmitterWrapper = (NSData *)[textStorage attribute:RCTAttributedStringEventEmitterKey
                                                           atIndex:characterIndex
                                                    effectiveRange:NULL];
    return RCTUnwrapEventEmitter(eventEmitterWrapper);
  }

  return nil;
}

- (void)getRectWithAttributedString:(AttributedString)attributedString
                paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(RCTTextLayoutFragmentEnumerationBlock)block
{
  NSTextStorage *textStorage = [self
      _textStorageAndLayoutManagerWithAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                                   paragraphAttributes:paragraphAttributes
                                                  size:frame.size];

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];

  [textStorage enumerateAttribute:enumerateAttribute
                          inRange:characterRange
                          options:0
                       usingBlock:^(NSString *value, NSRange range, BOOL *pause) {
                         if (value == nullptr) {
                           return;
                         }

                         [layoutManager
                             enumerateEnclosingRectsForGlyphRange:range
                                         withinSelectedGlyphRange:range
                                                  inTextContainer:textContainer
                                                       usingBlock:^(CGRect enclosingRect, BOOL *_Nonnull stop) {
                                                         block(
                                                             enclosingRect,
                                                             [textStorage attributedSubstringFromRange:range].string,
                                                             value);
                                                         *stop = YES;
                                                       }];
                       }];
}

#pragma mark - Private

- (NSAttributedString *)_nsAttributedStringFromAttributedString:(AttributedString)attributedString
{
  auto sharedNSAttributedString = _cache.get(attributedString, [&]() {
    return wrapManagedObject(RCTNSAttributedStringFromAttributedString(attributedString));
  });

  return unwrapManagedObject(sharedNSAttributedString);
}

- (TextMeasurement)_measureTextStorage:(NSTextStorage *)textStorage
                   paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                         layoutContext:(TextLayoutContext)layoutContext
{
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  __block BOOL textDidWrap = NO;
  __block NSUInteger linesEnumerated = 0;
  __block CGFloat enumeratedLinesHeight = 0;
  [layoutManager
      enumerateLineFragmentsForGlyphRange:glyphRange
                               usingBlock:^(
                                   CGRect overallRect,
                                   CGRect usedRect,
                                   NSTextContainer *_Nonnull usedTextContainer,
                                   NSRange lineGlyphRange,
                                   BOOL *_Nonnull stop) {
                                 NSRange range = [layoutManager characterRangeForGlyphRange:lineGlyphRange
                                                                           actualGlyphRange:nil];
                                 NSUInteger lastCharacterIndex = range.location + range.length - 1;
                                 BOOL endsWithNewLine =
                                     [textStorage.string characterAtIndex:lastCharacterIndex] == '\n';
                                 if (!endsWithNewLine && textStorage.string.length > lastCharacterIndex + 1) {
                                   textDidWrap = YES;
                                 }
                                 if (linesEnumerated++ < paragraphAttributes.maximumNumberOfLines) {
                                   enumeratedLinesHeight = usedRect.origin.y + usedRect.size.height;
                                 }
                                 if (textDidWrap &&
                                     (paragraphAttributes.maximumNumberOfLines == 0 ||
                                      linesEnumerated >= paragraphAttributes.maximumNumberOfLines)) {
                                   *stop = YES;
                                 }
                               }];

  CGSize size = [layoutManager usedRectForTextContainer:textContainer].size;

  if (textDidWrap) {
    size.width = textContainer.size.width;
  }

  if (paragraphAttributes.maximumNumberOfLines != 0) {
    // If maximumNumberOfLines is set, we cannot rely on setting it on the NSTextContainer
    // due to an edge case where it returns wrong height:
    // When maximumNumberOfLines is set to N and the N+1 line is empty, the measured height
    // is N+1 lines (incorrect). Adding any characted to the N+1 line, making it non-empty
    // casuses the measured height to be N lines (correct).
    if (linesEnumerated < paragraphAttributes.maximumNumberOfLines) {
      enumeratedLinesHeight += layoutManager.extraLineFragmentUsedRect.size.height;
    }
    size.height = enumeratedLinesHeight;
  }

  size = (CGSize){ceil(size.width * layoutContext.pointScaleFactor) / layoutContext.pointScaleFactor,
                  ceil(size.height * layoutContext.pointScaleFactor) / layoutContext.pointScaleFactor};

  NSRange visibleGlyphRange = [layoutManager glyphRangeForTextContainer:textContainer];

  __block auto attachments = TextMeasurement::Attachments{};

  [textStorage
      enumerateAttribute:NSAttachmentAttributeName
                 inRange:NSMakeRange(0, textStorage.length)
                 options:0
              usingBlock:^(NSTextAttachment *attachment, NSRange range, BOOL *stop) {
                if (attachment == nullptr) {
                  return;
                }

                NSRange attachmentGlyphRange = [layoutManager glyphRangeForCharacterRange:range
                                                                     actualCharacterRange:NULL];
                NSRange truncatedRange =
                    [layoutManager truncatedGlyphRangeInLineFragmentForGlyphAtIndex:attachmentGlyphRange.location];

                // Attachment on a line that did not fit (e.g. on the 4th line when the container is limited to 3 lines)
                BOOL isOutsideVisibleRange = !NSLocationInRange(attachmentGlyphRange.location, visibleGlyphRange);
                // Attachment in the ellipsis range of the last visible line (line truncated with "..." and the
                // attachment falls in that portion)
                BOOL isInTruncatedRange =
                    truncatedRange.location != NSNotFound && attachmentGlyphRange.location >= truncatedRange.location;

                if (isOutsideVisibleRange || isInTruncatedRange) {
                  attachments.push_back(TextMeasurement::Attachment{.isClipped = true});
                } else {
                  CGSize attachmentSize = attachment.bounds.size;
                  CGRect glyphRect = [layoutManager boundingRectForGlyphRange:range inTextContainer:textContainer];

                  CGRect frame;
                  UIFont *font = [[textStorage attributedSubstringFromRange:range] attribute:NSFontAttributeName
                                                                                     atIndex:0
                                                                              effectiveRange:nil];
                  frame = {
                      .origin =
                          {glyphRect.origin.x,
                           glyphRect.origin.y + glyphRect.size.height - attachmentSize.height + font.descender},
                      .size = attachmentSize};

                  auto rect = facebook::react::Rect{
                      .origin = facebook::react::Point{.x = frame.origin.x, .y = frame.origin.y},
                      .size = facebook::react::Size{.width = frame.size.width, .height = frame.size.height}};

                  attachments.push_back(TextMeasurement::Attachment{.frame = rect, .isClipped = false});
                }
              }];

  return TextMeasurement{.size = {.width = size.width, .height = size.height}, .attachments = attachments};
}

@end
