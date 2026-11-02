/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextKit2Layout.h"

#import <CoreText/CoreText.h>
#import <React/NSTextStorage+FontScaling.h>

#import <optional>
#import <vector>

/**
 * TextKit 1 clamps the size of text containers to 10,000,000 points. Without the clamp, TextKit 2 positions
 * centered and right aligned lines in a container of unbounded width at coordinates too large to measure them.
 */
static constexpr CGFloat RCTTextKit2MaximumContainerWidth = 10000000;

namespace {

/**
 * A laid out line, with TextKit 1 compatible geometry, in the text container's coordinate space.
 */
struct RCTTextKit2Line {
  NSTextLineFragment *lineFragment;
  // The location of the line fragment's paragraph in the text storage.
  NSUInteger paragraphLocation;
  NSRange characterRange;
  CGRect usedRect;
};

struct RCTTextKit2LayoutSnapshot {
  std::vector<RCTTextKit2Line> lines;
  CGRect extraLineFragmentUsedRect = CGRectZero;
  std::optional<NSRange> truncatedCharacterRange;
};

} // namespace

/**
 * TextKit 1 aligns `NSTextAlignmentNatural` paragraphs according to their base writing direction, falling back to the
 * default writing direction of the user's language. TextKit 2 resolves it from the paragraph's content instead (so
 * Arabic text in a left-to-right app is right aligned). Resolve it the TextKit 1 way up front. React Native sets an
 * explicit alignment for right-to-left layouts, so in practice this affects right-to-left text in left-to-right apps.
 */
static void RCTResolveNaturalTextAlignment(NSMutableAttributedString *attributedString)
{
  NSWritingDirection defaultWritingDirection = [NSParagraphStyle defaultWritingDirectionForLanguage:nil];
  [attributedString
      enumerateAttribute:NSParagraphStyleAttributeName
                 inRange:NSMakeRange(0, attributedString.length)
                 options:0
              usingBlock:^(NSParagraphStyle *_Nullable paragraphStyle, NSRange range, BOOL *stop) {
                if (paragraphStyle != nil && paragraphStyle.alignment != NSTextAlignmentNatural) {
                  return;
                }
                NSWritingDirection writingDirection =
                    paragraphStyle != nil ? paragraphStyle.baseWritingDirection : NSWritingDirectionNatural;
                if (writingDirection == NSWritingDirectionNatural) {
                  writingDirection = defaultWritingDirection;
                }
                NSMutableParagraphStyle *resolvedParagraphStyle =
                    [paragraphStyle ?: [NSParagraphStyle defaultParagraphStyle] mutableCopy];
                resolvedParagraphStyle.alignment =
                    writingDirection == NSWritingDirectionRightToLeft ? NSTextAlignmentRight : NSTextAlignmentLeft;
                [attributedString addAttribute:NSParagraphStyleAttributeName value:resolvedParagraphStyle range:range];
              }];
}

/**
 * With one line and `NSLineBreakByClipping`, TextKit 1 puts the whole paragraph on that line and clips it at the edge
 * of the container, while TextKit 2 wraps it and drops the following lines. A paragraph that clips instead of
 * wrapping gives the TextKit 1 behavior.
 */
static void RCTApplyClippingLineBreakMode(NSMutableAttributedString *attributedString)
{
  [attributedString enumerateAttribute:NSParagraphStyleAttributeName
                               inRange:NSMakeRange(0, attributedString.length)
                               options:0
                            usingBlock:^(NSParagraphStyle *_Nullable paragraphStyle, NSRange range, BOOL *stop) {
                              NSMutableParagraphStyle *clippingParagraphStyle =
                                  [paragraphStyle ?: [NSParagraphStyle defaultParagraphStyle] mutableCopy];
                              clippingParagraphStyle.lineBreakMode = NSLineBreakByClipping;
                              [attributedString addAttribute:NSParagraphStyleAttributeName
                                                       value:clippingParagraphStyle
                                                       range:range];
                            }];
}

static BOOL RCTIsLineSeparatorParagraph(NSTextLineFragment *lineFragment)
{
  NSString *paragraph = lineFragment.attributedString.string;
  return paragraph.length > 0 && lineFragment.characterRange.location == 0 &&
      lineFragment.characterRange.length == paragraph.length &&
      [paragraph stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]].length == 0;
}

@interface RCTTextKit2Layout () <NSTextStorageDelegate>
@end

@implementation RCTTextKit2Layout {
  NSTextContentStorage *_textContentStorage;
  // The layout of the current contents of the text storage; reset when they change.
  std::optional<RCTTextKit2LayoutSnapshot> _snapshot;
}

- (instancetype)initWithTextStorage:(NSTextStorage *)textStorage
                               size:(CGSize)size
               maximumNumberOfLines:(NSUInteger)maximumNumberOfLines
                      lineBreakMode:(NSLineBreakMode)lineBreakMode
{
  if (self = [super init]) {
    _textStorage = textStorage;

    [textStorage beginEditing];
    RCTResolveNaturalTextAlignment(textStorage);
    if (maximumNumberOfLines == 1 && lineBreakMode == NSLineBreakByClipping) {
      RCTApplyClippingLineBreakMode(textStorage);
    }
    [textStorage endEditing];

    _textContainer = [[NSTextContainer alloc]
        initWithSize:CGSizeMake(MIN(size.width, RCTTextKit2MaximumContainerWidth), size.height)];
    _textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
    _textContainer.lineBreakMode = lineBreakMode;
    _textContainer.maximumNumberOfLines = maximumNumberOfLines;

    _textLayoutManager = [NSTextLayoutManager new];
    _textLayoutManager.usesFontLeading = NO;
    _textLayoutManager.textContainer = _textContainer;

    _textContentStorage = [NSTextContentStorage new];
    [_textContentStorage addTextLayoutManager:_textLayoutManager];
    _textContentStorage.textStorage = textStorage;

    textStorage.delegate = self;
  }
  return self;
}

#pragma mark - NSTextStorageDelegate

- (void)textStorage:(NSTextStorage *)textStorage
    didProcessEditing:(NSTextStorageEditActions)editedMask
                range:(NSRange)editedRange
       changeInLength:(NSInteger)delta
{
  _snapshot.reset();
}

- (void)ensureLayout
{
  [_textLayoutManager ensureLayoutForRange:_textContentStorage.documentRange];
}

#pragma mark - Private

- (NSUInteger)_characterIndexForLocation:(id<NSTextLocation>)location
{
  return [_textContentStorage offsetFromLocation:_textContentStorage.documentRange.location toLocation:location];
}

- (nullable NSTextRange *)_textRangeForCharacterRange:(NSRange)characterRange
{
  id<NSTextLocation> documentLocation = _textContentStorage.documentRange.location;
  id<NSTextLocation> location = [_textContentStorage locationFromLocation:documentLocation
                                                               withOffset:characterRange.location];
  id<NSTextLocation> endLocation = [_textContentStorage locationFromLocation:documentLocation
                                                                  withOffset:NSMaxRange(characterRange)];
  if (location == nil || endLocation == nil) {
    return nil;
  }
  return [[NSTextRange alloc] initWithLocation:location endLocation:endLocation];
}

/**
 * Lays out the text and collects its lines with TextKit 1 compatible geometry.
 */
- (const RCTTextKit2LayoutSnapshot &)_layoutSnapshot
{
  if (!_snapshot) {
    _snapshot = [self _makeLayoutSnapshot];
  }
  return *_snapshot;
}

- (RCTTextKit2LayoutSnapshot)_makeLayoutSnapshot
{
  [self ensureLayout];

  __block RCTTextKit2LayoutSnapshot snapshot;
  __block NSUInteger lastParagraphEnd = 0;
  [_textLayoutManager
      enumerateTextLayoutFragmentsFromLocation:nil
                                       options:NSTextLayoutFragmentEnumerationOptionsEnsuresLayout |
                                       NSTextLayoutFragmentEnumerationOptionsEnsuresExtraLineFragment
                                    usingBlock:^BOOL(NSTextLayoutFragment *layoutFragment) {
                                      NSTextRange *paragraphRange = layoutFragment.rangeInElement;
                                      NSUInteger paragraphLocation =
                                          [self _characterIndexForLocation:paragraphRange.location];
                                      CGPoint origin = layoutFragment.layoutFragmentFrame.origin;
                                      NSArray<NSTextLineFragment *> *lineFragments = layoutFragment.textLineFragments;
                                      for (NSUInteger index = 0; index < lineFragments.count; index++) {
                                        NSTextLineFragment *lineFragment = lineFragments[index];
                                        CGRect lineRect =
                                            CGRectOffset(lineFragment.typographicBounds, origin.x, origin.y);

                                        if (lineFragment.characterRange.length == 0) {
                                          // The extra line fragment that follows a trailing line break.
                                          NSTextLineFragment *previousLineFragment =
                                              index > 0 ? lineFragments[index - 1] : nil;
                                          if (previousLineFragment != nil &&
                                              RCTIsLineSeparatorParagraph(previousLineFragment)) {
                                            // When the last paragraph is just a line break, TextKit 2 lays out the
                                            // extra line fragment with the metrics of the default font (Helvetica
                                            // 12), overlapping the line break's line. TextKit 1 lays it out below,
                                            // with the attributes of the line break, so it matches that line.
                                            CGRect previousLineRect = snapshot.lines.back().usedRect;
                                            snapshot.extraLineFragmentUsedRect = CGRectMake(
                                                previousLineRect.origin.x,
                                                CGRectGetMaxY(previousLineRect),
                                                0,
                                                previousLineRect.size.height);
                                          } else {
                                            snapshot.extraLineFragmentUsedRect = CGRectMake(
                                                lineRect.origin.x, lineRect.origin.y, 0, lineRect.size.height);
                                          }
                                          continue;
                                        }

                                        // TextKit 2 adds the extra space glyphs with tall marks (e.g. Thai) need
                                        // between lines, while TextKit 1 makes the line itself taller.
                                        if (index + 1 < lineFragments.count &&
                                            lineFragments[index + 1].characterRange.length > 0) {
                                          CGFloat nextLineOriginY =
                                              origin.y + lineFragments[index + 1].typographicBounds.origin.y;
                                          lineRect.size.height =
                                              MAX(lineRect.size.height, nextLineOriginY - lineRect.origin.y);
                                        }

                                        // Before iOS 26, the bounds of centered and right aligned lines include the
                                        // trailing whitespace that hangs past the end of the container; TextKit 1
                                        // leaves it out.
                                        CGFloat containerWidth = self->_textContainer.size.width;
                                        if (CGRectGetMaxX(lineRect) > containerWidth) {
                                          lineRect.size.width = MAX(containerWidth - lineRect.origin.x, 0);
                                        }

                                        NSRange characterRange = lineFragment.characterRange;
                                        snapshot.lines.push_back(
                                            RCTTextKit2Line{
                                                .lineFragment = lineFragment,
                                                .paragraphLocation = paragraphLocation,
                                                .characterRange = NSMakeRange(
                                                    paragraphLocation + characterRange.location, characterRange.length),
                                                .usedRect = lineRect,
                                            });
                                      }
                                      // The range of a truncated layout fragment can end before its paragraph.
                                      lastParagraphEnd =
                                          [self _characterIndexForLocation:layoutFragment.textElement.elementRange
                                                                               .endLocation];
                                      return YES;
                                    }];

  // When the layout stops before the end of a paragraph (because of the line limit or the height of the container),
  // TextKit 1 assigns the rest of the paragraph to the last line; TextKit 2 sometimes leaves out its last characters.
  if (!snapshot.lines.empty()) {
    RCTTextKit2Line &lastLine = snapshot.lines.back();
    if (NSMaxRange(lastLine.characterRange) < lastParagraphEnd) {
      lastLine.characterRange.length = lastParagraphEnd - lastLine.characterRange.location;
    }
  }

  return snapshot;
}

#pragma mark - Lines

- (void)enumerateLineFragmentsUsingBlock:(NS_NOESCAPE RCTTextKit2LineFragmentBlock)block
{
  // A copy, because the block may change the text storage, which discards the snapshot.
  std::vector<RCTTextKit2Line> lines = [self _layoutSnapshot].lines;
  CGFloat containerWidth = _textContainer.size.width;
  BOOL stop = NO;
  for (const auto &line : lines) {
    NSTextLineFragment *lineFragment = line.lineFragment;
    // TextKit 2 reports the baseline of the line, while TextKit 1 reports where the first glyph is drawn, which
    // includes its baseline offset.
    NSNumber *baselineOffset = [lineFragment.attributedString attribute:NSBaselineOffsetAttributeName
                                                                atIndex:lineFragment.characterRange.location
                                                         effectiveRange:nil];
    CGFloat baseline = lineFragment.glyphOrigin.y - baselineOffset.doubleValue;
    block(
        line.characterRange,
        CGRectMake(0, line.usedRect.origin.y, containerWidth, line.usedRect.size.height),
        line.usedRect,
        baseline,
        &stop);
    if (stop) {
      break;
    }
  }
}

- (CGRect)extraLineFragmentUsedRect
{
  return [self _layoutSnapshot].extraLineFragmentUsedRect;
}

- (CGRect)usedRect
{
  const RCTTextKit2LayoutSnapshot &snapshot = [self _layoutSnapshot];
  CGRect usedRect = CGRectNull;
  for (const auto &line : snapshot.lines) {
    usedRect = CGRectUnion(usedRect, line.usedRect);
  }
  // Like TextKit 1, only count the extra line fragment if it fits into the container.
  CGRect extraLineFragmentUsedRect = snapshot.extraLineFragmentUsedRect;
  if (!CGRectEqualToRect(extraLineFragmentUsedRect, CGRectZero) &&
      CGRectGetMaxY(extraLineFragmentUsedRect) <= _textContainer.size.height) {
    usedRect = CGRectUnion(usedRect, extraLineFragmentUsedRect);
  }
  return CGRectIsNull(usedRect) ? CGRectZero : usedRect;
}

- (NSRange)characterRangeOfLaidOutText
{
  const RCTTextKit2LayoutSnapshot &snapshot = [self _layoutSnapshot];
  return NSMakeRange(0, snapshot.lines.empty() ? 0 : NSMaxRange(snapshot.lines.back().characterRange));
}

- (NSRange)truncatedCharacterRange
{
  return [self _truncatedCharacterRange];
}

- (NSRange)_truncatedCharacterRange
{
  const RCTTextKit2LayoutSnapshot &snapshot = [self _layoutSnapshot];
  if (!snapshot.truncatedCharacterRange) {
    _snapshot->truncatedCharacterRange = [self _truncatedCharacterRangeInSnapshot:snapshot];
  }
  return *snapshot.truncatedCharacterRange;
}

- (NSRange)_truncatedCharacterRangeInSnapshot:(const RCTTextKit2LayoutSnapshot &)snapshot
{
  NSRange notFound = NSMakeRange(NSNotFound, 0);
  // TextKit 1 reports truncation only for tail truncation, on the last line that fits.
  if (_textContainer.maximumNumberOfLines == 0 || _textContainer.lineBreakMode != NSLineBreakByTruncatingTail ||
      snapshot.lines.empty()) {
    return notFound;
  }

  // TextKit 2 does not expose the truncated range. The line fragment of a truncated line spans the characters that
  // are elided, but they report location zero, except the first one, whose place the ellipsis takes. Only the starts
  // of composed character sequences are checked: the first one of the line legitimately starts at zero, and the
  // combining marks of the last one of a paragraph report zero too.
  const RCTTextKit2Line &lastLine = snapshot.lines.back();
  NSTextLineFragment *lineFragment = lastLine.lineFragment;
  NSString *paragraph = lineFragment.attributedString.string;
  NSRange lineRange = lineFragment.characterRange;
  NSUInteger firstElidedIndex = NSNotFound;
  for (NSUInteger index = NSMaxRange([paragraph rangeOfComposedCharacterSequenceAtIndex:lineRange.location]);
       index < NSMaxRange(lineRange);
       index = NSMaxRange([paragraph rangeOfComposedCharacterSequenceAtIndex:index])) {
    if ([lineFragment locationForCharacterAtIndex:index].x == 0) {
      firstElidedIndex = index;
      break;
    }
  }
  if (firstElidedIndex == NSNotFound) {
    return notFound;
  }

  NSUInteger truncatedIndex =
      lastLine.paragraphLocation + [paragraph rangeOfComposedCharacterSequenceAtIndex:firstElidedIndex - 1].location;
  return NSMakeRange(truncatedIndex, NSMaxRange(lastLine.characterRange) - truncatedIndex);
}

#pragma mark - Geometry

- (CGRect)boundingRectForAttachmentAtCharacterIndex:(NSUInteger)characterIndex
{
  const RCTTextKit2LayoutSnapshot &snapshot = [self _layoutSnapshot];

  id<NSTextLocation> location = [_textContentStorage locationFromLocation:_textContentStorage.documentRange.location
                                                               withOffset:characterIndex];
  if (location == nil) {
    return CGRectNull;
  }
  NSTextLayoutFragment *layoutFragment = [_textLayoutManager textLayoutFragmentForLocation:location];
  if (layoutFragment == nil || layoutFragment.state != NSTextLayoutFragmentStateLayoutAvailable) {
    return CGRectNull;
  }

  // TextKit 2 does not lay out attachments that are elided by truncation, and reports a zero frame for them.
  CGRect attachmentFrame = [layoutFragment frameForTextAttachmentAtLocation:location];
  NSTextAttachment *attachment = [_textStorage attribute:NSAttachmentAttributeName
                                                 atIndex:characterIndex
                                          effectiveRange:nil];
  if (CGRectEqualToRect(attachmentFrame, CGRectZero) && !CGSizeEqualToSize(attachment.bounds.size, CGSizeZero)) {
    return CGRectNull;
  }

  for (const auto &line : snapshot.lines) {
    if (NSLocationInRange(characterIndex, line.characterRange)) {
      return CGRectMake(
          layoutFragment.layoutFragmentFrame.origin.x + attachmentFrame.origin.x,
          line.usedRect.origin.y,
          attachmentFrame.size.width,
          line.usedRect.size.height);
    }
  }
  return CGRectNull;
}

- (CGRect)glyphBoundingRect
{
  // TextKit 1 extends the line fragment rects by the font bounding boxes of the glyphs drawn on them, positioned at
  // the line's baseline.
  const RCTTextKit2LayoutSnapshot &snapshot = [self _layoutSnapshot];
  CGFloat containerWidth = _textContainer.size.width;
  __block CGRect boundingRect = CGRectNull;
  for (const auto &line : snapshot.lines) {
    CGRect lineFragmentRect = CGRectMake(0, line.usedRect.origin.y, containerWidth, line.usedRect.size.height);
    boundingRect = CGRectUnion(boundingRect, lineFragmentRect);
    NSTextLineFragment *lineFragment = line.lineFragment;
    CGFloat baselineY = line.usedRect.origin.y + lineFragment.glyphOrigin.y;
    [lineFragment.attributedString
        enumerateAttributesInRange:lineFragment.characterRange
                           options:0
                        usingBlock:^(NSDictionary<NSAttributedStringKey, id> *attributes, NSRange range, BOOL *stop) {
                          UIFont *font = attributes[NSFontAttributeName];
                          if (font == nil) {
                            return;
                          }
                          CGRect fontBoundingBox = CTFontGetBoundingBox((__bridge CTFontRef)font);
                          CGFloat baselineOffset = [attributes[NSBaselineOffsetAttributeName] doubleValue];
                          CGFloat top = baselineY - baselineOffset - CGRectGetMaxY(fontBoundingBox);
                          CGFloat bottom = baselineY - baselineOffset - CGRectGetMinY(fontBoundingBox);
                          boundingRect = CGRectUnion(
                              boundingRect,
                              CGRectMake(lineFragmentRect.origin.x, top, lineFragmentRect.size.width, bottom - top));
                        }];
  }
  return CGRectIsNull(boundingRect) ? CGRectZero : boundingRect;
}

- (NSUInteger)characterIndexForPoint:(CGPoint)point fractionOfDistanceBetweenInsertionPoints:(CGFloat *)fraction
{
  const RCTTextKit2LayoutSnapshot &snapshot = [self _layoutSnapshot];
  *fraction = 0;

  // Like TextKit 1, points above the text hit the start of it, and points below it hit the end of it.
  if (snapshot.lines.empty() || point.y < CGRectGetMinY(snapshot.lines.front().usedRect)) {
    return 0;
  }
  const RCTTextKit2Line *hitLine = nullptr;
  for (const auto &line : snapshot.lines) {
    if (point.y < CGRectGetMaxY(line.usedRect)) {
      hitLine = &line;
      break;
    }
  }
  if (hitLine == nullptr) {
    *fraction = 1;
    return NSMaxRange(snapshot.lines.back().characterRange) - 1;
  }

  NSString *string = _textStorage.string;

  if (hitLine == &snapshot.lines.back()) {
    // TextKit 1 spreads the characters elided by truncation evenly over the ellipsis that replaces them.
    NSRange truncatedCharacterRange = [self _truncatedCharacterRange];
    if (truncatedCharacterRange.location != NSNotFound) {
      CGRect ellipsisRect = [self _ellipsisRectForTruncatedCharacterRange:truncatedCharacterRange inSnapshot:snapshot];
      if (point.x >= CGRectGetMaxX(ellipsisRect)) {
        // After the end of the line. If it ends with a line break, TextKit 1 maps the point to the ellipsis.
        NSUInteger lastCharacterIndex = NSMaxRange(hitLine->characterRange) - 1;
        *fraction = 1;
        return [[NSCharacterSet newlineCharacterSet] characterIsMember:[string characterAtIndex:lastCharacterIndex]]
            ? truncatedCharacterRange.location
            : [string rangeOfComposedCharacterSequenceAtIndex:lastCharacterIndex].location;
      }
      if (point.x >= CGRectGetMinX(ellipsisRect) && point.x < CGRectGetMaxX(ellipsisRect)) {
        CGFloat position =
            (point.x - CGRectGetMinX(ellipsisRect)) / ellipsisRect.size.width * truncatedCharacterRange.length;
        NSUInteger offset = MIN((NSUInteger)position, truncatedCharacterRange.length - 1);
        *fraction = position - offset;
        return truncatedCharacterRange.location + offset;
      }
    }
  }

  NSTextLineFragment *lineFragment = hitLine->lineFragment;
  CGPoint linePoint = CGPointMake(point.x - hitLine->usedRect.origin.x, point.y - hitLine->usedRect.origin.y);
  NSRange lineRange = lineFragment.characterRange;
  NSInteger index = [lineFragment characterIndexForPoint:linePoint];
  if (index >= (NSInteger)NSMaxRange(lineRange)) {
    // TextKit 2 returns the insertion point after the line, TextKit 1 the last composed character sequence with a
    // fraction of 1.
    *fraction = 1;
    return [string rangeOfComposedCharacterSequenceAtIndex:hitLine->paragraphLocation + NSMaxRange(lineRange) - 1]
        .location;
  }
  index = MAX(index, (NSInteger)lineRange.location);
  NSUInteger characterIndex = hitLine->paragraphLocation + index;
  if ([[NSCharacterSet newlineCharacterSet] characterIsMember:[string characterAtIndex:characterIndex]]) {
    // Line breaks have no width, so TextKit 1 considers points on them to be after them, unless they are before the
    // start of the line.
    *fraction = linePoint.x < [lineFragment locationForCharacterAtIndex:index].x ? 0 : 1;
  } else {
    *fraction = [lineFragment fractionOfDistanceThroughGlyphForPoint:linePoint];
  }
  return characterIndex;
}

/**
 * The rect of the ellipsis that replaces the characters elided by tail truncation on the last line, or `CGRectNull` if
 * the line is laid out right to left.
 */
- (CGRect)_ellipsisRectForTruncatedCharacterRange:(NSRange)truncatedCharacterRange
                                       inSnapshot:(const RCTTextKit2LayoutSnapshot &)snapshot
{
  const RCTTextKit2Line &lastLine = snapshot.lines.back();
  NSTextLineFragment *lineFragment = lastLine.lineFragment;
  CGFloat ellipsisLocation =
      [lineFragment locationForCharacterAtIndex:truncatedCharacterRange.location - lastLine.paragraphLocation].x;
  if ([lineFragment locationForCharacterAtIndex:lineFragment.characterRange.location].x > ellipsisLocation) {
    return CGRectNull;
  }
  CGFloat ellipsisMinX = lastLine.usedRect.origin.x + ellipsisLocation;
  return CGRectMake(
      ellipsisMinX,
      lastLine.usedRect.origin.y,
      MAX(CGRectGetMaxX(lastLine.usedRect) - ellipsisMinX, 0),
      lastLine.usedRect.size.height);
}

- (void)enumerateEnclosingRectsForCharacterRange:(NSRange)characterRange
                                      usingBlock:(NS_NOESCAPE void (^)(CGRect rect, BOOL *stop))block
{
  [self _enumerateTextSegmentsForCharacterRange:characterRange
                                           type:NSTextLayoutManagerSegmentTypeHighlight
                                     usingBlock:block];
}

- (void)enumerateTextSegmentsForCharacterRange:(NSRange)characterRange
                                    usingBlock:(NS_NOESCAPE void (^)(CGRect rect, BOOL *stop))block
{
  [self _enumerateTextSegmentsForCharacterRange:characterRange
                                           type:NSTextLayoutManagerSegmentTypeStandard
                                     usingBlock:block];
}

- (void)_enumerateTextSegmentsForCharacterRange:(NSRange)characterRange
                                           type:(NSTextLayoutManagerSegmentType)type
                                     usingBlock:(NS_NOESCAPE void (^)(CGRect rect, BOOL *stop))block
{
  const RCTTextKit2LayoutSnapshot &snapshot = [self _layoutSnapshot];
  NSRange truncatedCharacterRange = [self _truncatedCharacterRange];
  if (truncatedCharacterRange.location == NSNotFound ||
      NSMaxRange(characterRange) <= truncatedCharacterRange.location) {
    [self _enumerateLaidOutTextSegmentsForCharacterRange:characterRange type:type snapshot:snapshot usingBlock:block];
    return;
  }

  // TextKit 2 reports empty segments for ranges that reach into the characters elided by truncation, while TextKit 1
  // maps the elided characters to the ellipsis that replaces them. Measure the visible part of the range and extend it
  // with the ellipsis.
  CGRect ellipsisRect = [self _ellipsisRectForTruncatedCharacterRange:truncatedCharacterRange inSnapshot:snapshot];
  if (CGRectIsNull(ellipsisRect)) {
    [self _enumerateLaidOutTextSegmentsForCharacterRange:characterRange type:type snapshot:snapshot usingBlock:block];
    return;
  }
  const RCTTextKit2Line &lastLine = snapshot.lines.back();
  NSUInteger lastLineEnd = NSMaxRange(lastLine.characterRange);
  if (type == NSTextLayoutManagerSegmentTypeHighlight && NSMaxRange(characterRange) >= lastLineEnd &&
      [[NSCharacterSet newlineCharacterSet] characterIsMember:[_textStorage.string characterAtIndex:lastLineEnd - 1]]) {
    // Like any range that includes a line break, it extends to the end of the line.
    ellipsisRect.size.width = _textContainer.size.width - ellipsisRect.origin.x;
  }

  NSMutableArray<NSValue *> *rects = [NSMutableArray new];
  if (characterRange.location < truncatedCharacterRange.location) {
    [self _enumerateLaidOutTextSegmentsForCharacterRange:NSMakeRange(
                                                             characterRange.location,
                                                             truncatedCharacterRange.location - characterRange.location)
                                                    type:type
                                                snapshot:snapshot
                                              usingBlock:^(CGRect rect, BOOL *stop) {
                                                [rects addObject:[NSValue valueWithCGRect:rect]];
                                              }];
  }
  CGRect lastRect = rects.lastObject.CGRectValue;
  if (rects.count > 0 && CGRectGetMidY(lastRect) >= CGRectGetMinY(ellipsisRect) &&
      CGRectGetMidY(lastRect) < CGRectGetMaxY(ellipsisRect)) {
    rects[rects.count - 1] = [NSValue valueWithCGRect:CGRectUnion(lastRect, ellipsisRect)];
  } else {
    [rects addObject:[NSValue valueWithCGRect:ellipsisRect]];
  }

  BOOL stop = NO;
  for (NSValue *rect in rects) {
    block(rect.CGRectValue, &stop);
    if (stop) {
      return;
    }
  }
}

- (void)_enumerateLaidOutTextSegmentsForCharacterRange:(NSRange)characterRange
                                                  type:(NSTextLayoutManagerSegmentType)type
                                              snapshot:(const RCTTextKit2LayoutSnapshot &)snapshot
                                            usingBlock:(NS_NOESCAPE void (^)(CGRect rect, BOOL *stop))block
{
  NSTextRange *textRange = [self _textRangeForCharacterRange:characterRange];
  if (textRange == nil) {
    return;
  }

  NSMutableArray<NSValue *> *rects = [NSMutableArray new];
  [_textLayoutManager
      enumerateTextSegmentsInRange:textRange
                              type:type
                           options:NSTextLayoutManagerSegmentOptionsRangeNotRequired
                        usingBlock:^BOOL(
                            NSTextRange *_Nullable segmentRange,
                            CGRect segmentFrame,
                            CGFloat baselinePosition,
                            NSTextContainer *textContainer) {
                          // Segments span the typographic bounds of their lines; use the TextKit 1 compatible line
                          // geometry instead.
                          for (const auto &line : snapshot.lines) {
                            if (CGRectGetMidY(segmentFrame) < CGRectGetMaxY(line.usedRect)) {
                              segmentFrame.origin.y = line.usedRect.origin.y;
                              segmentFrame.size.height = line.usedRect.size.height;
                              break;
                            }
                          }
                          CGRect previousRect = rects.lastObject.CGRectValue;
                          if (type == NSTextLayoutManagerSegmentTypeHighlight && rects.count > 0 &&
                              fabs(CGRectGetMinX(previousRect) - CGRectGetMinX(segmentFrame)) < 0.01 &&
                              fabs(CGRectGetWidth(previousRect) - CGRectGetWidth(segmentFrame)) < 0.01 &&
                              fabs(CGRectGetMaxY(previousRect) - CGRectGetMinY(segmentFrame)) < 0.01) {
                            // Like TextKit 1, merge the rects of consecutive lines the range spans entirely.
                            rects[rects.count - 1] = [NSValue valueWithCGRect:CGRectUnion(previousRect, segmentFrame)];
                          } else {
                            [rects addObject:[NSValue valueWithCGRect:segmentFrame]];
                          }
                          return YES;
                        }];

  BOOL stop = NO;
  for (NSValue *rect in rects) {
    block(rect.CGRectValue, &stop);
    if (stop) {
      return;
    }
  }
}

#pragma mark - Drawing

- (void)drawAtPoint:(CGPoint)point inContext:(CGContextRef)context
{
  // TextKit 1 paints backgrounds over the enclosing rects of their ranges, which extend to the end of the line when a
  // range continues on the next one, while TextKit 2 only paints behind the glyphs. Paint them the TextKit 1 way and
  // keep TextKit 2 from painting them again.
  __block BOOL hasBackgroundColor = NO;
  [_textStorage
      enumerateAttribute:NSBackgroundColorAttributeName
                 inRange:self.characterRangeOfLaidOutText
                 options:0
              usingBlock:^(UIColor *_Nullable backgroundColor, NSRange range, BOOL *stop) {
                if (backgroundColor == nil) {
                  return;
                }
                hasBackgroundColor = YES;
                CGContextSaveGState(context);
                CGContextSetFillColorWithColor(context, backgroundColor.CGColor);
                [self
                    enumerateEnclosingRectsForCharacterRange:range
                                                  usingBlock:^(CGRect rect, BOOL *innerStop) {
                                                    // Like TextKit 1, align the rects to device
                                                    // pixels so that adjacent ones do not leave seams.
                                                    CGRect deviceRect = CGContextConvertRectToDeviceSpace(
                                                        context, CGRectOffset(rect, point.x, point.y));
                                                    deviceRect = CGRectMake(
                                                        round(CGRectGetMinX(deviceRect)),
                                                        round(CGRectGetMinY(deviceRect)),
                                                        round(CGRectGetMaxX(deviceRect)) -
                                                            round(CGRectGetMinX(deviceRect)),
                                                        round(CGRectGetMaxY(deviceRect)) -
                                                            round(CGRectGetMinY(deviceRect)));
                                                    CGContextFillRect(
                                                        context, CGContextConvertRectToUserSpace(context, deviceRect));
                                                  }];
                CGContextRestoreGState(context);
              }];
  if (hasBackgroundColor) {
    [_textStorage removeAttribute:NSBackgroundColorAttributeName range:NSMakeRange(0, _textStorage.length)];
  }

  [self ensureLayout];
  [_textLayoutManager
      enumerateTextLayoutFragmentsFromLocation:nil
                                       options:NSTextLayoutFragmentEnumerationOptionsEnsuresLayout
                                    usingBlock:^BOOL(NSTextLayoutFragment *layoutFragment) {
                                      CGPoint origin = layoutFragment.layoutFragmentFrame.origin;
                                      [layoutFragment drawAtPoint:CGPointMake(point.x + origin.x, point.y + origin.y)
                                                        inContext:context];
                                      return YES;
                                    }];
}

#pragma mark - Font scaling

- (void)scaleFontSizeToFitWithMinimumFontSize:(CGFloat)minimumFontSize maximumFontSize:(CGFloat)maximumFontSize
{
  [_textStorage scaleFontSizeToFitSize:_textContainer.size
                       minimumFontSize:minimumFontSize
                       maximumFontSize:maximumFontSize
                     measureUsingBlock:^CGSize(BOOL *isTruncated) {
                       *isTruncated = self.truncatedCharacterRange.location != NSNotFound;
                       return self.usedRect.size;
                     }];
}

@end
