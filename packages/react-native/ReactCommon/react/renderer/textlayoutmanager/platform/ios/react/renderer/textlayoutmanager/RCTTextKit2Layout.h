/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Called for every laid out line, in order. Mirrors the arguments of
 * `-[NSLayoutManager enumerateLineFragmentsForGlyphRange:usingBlock:]`, with character ranges instead of glyph ranges.
 * `rect` spans the whole width of the text container. `baseline` is the distance from the top of the line to the
 * baseline of its first character, including that character's `NSBaselineOffsetAttributeName` (as returned by
 * `-[NSLayoutManager locationForGlyphAtIndex:]`).
 */
typedef void (
    ^RCTTextKit2LineFragmentBlock)(NSRange characterRange, CGRect rect, CGRect usedRect, CGFloat baseline, BOOL *stop);

/**
 * A TextKit 2 (`NSTextLayoutManager`) text stack that answers the layout queries `RCTTextLayoutManager` used to ask
 * TextKit 1 (`NSLayoutManager`), with TextKit 1 compatible semantics where the two engines differ.
 *
 * Like the TextKit 1 stack it replaces, an instance must only be used from one thread at a time.
 */
API_AVAILABLE(ios(16.0), tvos(16.0))
@interface RCTTextKit2Layout : NSObject

/**
 * Takes ownership of `textStorage` (`NSTextStorage` cannot be shared between text stacks) and prepares it for
 * TextKit 2 layout in a container of `size`. `lineBreakMode` describes the last line, as
 * `-[NSTextContainer lineBreakMode]` does.
 */
- (instancetype)initWithTextStorage:(NSTextStorage *)textStorage
                               size:(CGSize)size
               maximumNumberOfLines:(NSUInteger)maximumNumberOfLines
                      lineBreakMode:(NSLineBreakMode)lineBreakMode NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

@property (nonatomic, readonly) NSTextStorage *textStorage;
@property (nonatomic, readonly) NSTextLayoutManager *textLayoutManager;
@property (nonatomic, readonly) NSTextContainer *textContainer;

/**
 * Lays out all the text that fits into the container. Every query below does it first, so calling it directly is only
 * needed to control when the work happens.
 */
- (void)ensureLayout;

/**
 * Enumerates laid out lines. Like its TextKit 1 counterpart, it does not report the extra line fragment that follows
 * a trailing line break; see `extraLineFragmentUsedRect`.
 */
- (void)enumerateLineFragmentsUsingBlock:(NS_NOESCAPE RCTTextKit2LineFragmentBlock)block;

/**
 * The equivalent of `-[NSLayoutManager usedRectForTextContainer:]`: the union of the used rects of all lines,
 * including the extra line fragment.
 */
@property (nonatomic, readonly) CGRect usedRect;

/**
 * The equivalent of `-[NSLayoutManager extraLineFragmentUsedRect]`: the empty line that follows a trailing line
 * break, or `CGRectZero` if the text does not end with one.
 */
@property (nonatomic, readonly) CGRect extraLineFragmentUsedRect;

/**
 * The characters that belong to laid out lines; the equivalent of mapping
 * `-[NSLayoutManager glyphRangeForTextContainer:]` to characters.
 */
@property (nonatomic, readonly) NSRange characterRangeOfLaidOutText;

/**
 * Characters elided by tail truncation on the last line, including the one whose place the ellipsis takes, or
 * `{NSNotFound, 0}`. The equivalent of `-[NSLayoutManager truncatedGlyphRangeInLineFragmentForGlyphAtIndex:]`.
 */
@property (nonatomic, readonly) NSRange truncatedCharacterRange;

/**
 * The rect `-[NSLayoutManager boundingRectForGlyphRange:inTextContainer:]` returns for an attachment character: the
 * attachment's horizontal extent and the vertical extent of its line. `CGRectNull` if the attachment is not displayed
 * (it is on a line that does not fit or was elided by truncation).
 */
- (CGRect)boundingRectForAttachmentAtCharacterIndex:(NSUInteger)characterIndex;

/**
 * The bounding rect of all laid out glyphs, including the parts that draw outside of their lines. The equivalent of
 * `-[NSLayoutManager boundingRectForGlyphRange:inTextContainer:]` for all laid out glyphs.
 */
@property (nonatomic, readonly) CGRect glyphBoundingRect;

/**
 * The equivalent of `-[NSLayoutManager
 * characterIndexForPoint:inTextContainer:fractionOfDistanceBetweenInsertionPoints:]`. Points above the text map to the
 * first character and points after the end of a line map to its last character with a fraction of 1.
 */
- (NSUInteger)characterIndexForPoint:(CGPoint)point fractionOfDistanceBetweenInsertionPoints:(CGFloat *)fraction;

/**
 * The equivalent of `-[NSLayoutManager enumerateEnclosingRectsForGlyphRange:withinSelectedGlyphRange:inTextContainer:
 * usingBlock:]` for a character range: one rect per line, extended to the end of the line when the range continues on
 * the next one.
 */
- (void)enumerateEnclosingRectsForCharacterRange:(NSRange)characterRange
                                      usingBlock:(NS_NOESCAPE void (^)(CGRect rect, BOOL *stop))block;

/**
 * Enumerates the rects the characters of `characterRange` occupy, at least one per line they are laid out on. Each
 * rect spans the line vertically and the characters (including trailing whitespace) horizontally.
 */
- (void)enumerateTextSegmentsForCharacterRange:(NSRange)characterRange
                                    usingBlock:(NS_NOESCAPE void (^)(CGRect rect, BOOL *stop))block;

/**
 * Draws the backgrounds and glyphs of all laid out lines, with the container's origin at `point`.
 */
- (void)drawAtPoint:(CGPoint)point inContext:(CGContextRef)context;

/**
 * Scales the fonts of the text storage so that the text fits the container without truncation; see
 * `-[NSTextStorage scaleFontSizeToFitSize:minimumFontSize:maximumFontSize:]`.
 */
- (void)scaleFontSizeToFitWithMinimumFontSize:(CGFloat)minimumFontSize maximumFontSize:(CGFloat)maximumFontSize;

@end

NS_ASSUME_NONNULL_END
