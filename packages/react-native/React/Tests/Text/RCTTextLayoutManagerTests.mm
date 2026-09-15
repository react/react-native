/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <react/renderer/attributedstring/AttributedString.h>
#import <react/renderer/attributedstring/ParagraphAttributes.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>

#include <utility>

using namespace facebook::react;

@interface RCTTextLayoutManager (Tests)

- (void)processTruncatedAttributedText:(NSTextStorage *)textStorage
                         textContainer:(NSTextContainer *)textContainer
                         layoutManager:(NSLayoutManager *)layoutManager;

@end

@interface RCTTruncatingLayoutManager : NSLayoutManager

@property (nonatomic, assign) BOOL isEnumeratingLineFragments;

@end

@implementation RCTTruncatingLayoutManager

- (void)ensureLayoutForTextContainer:(__unused NSTextContainer *)textContainer
{
}

- (NSRange)glyphRangeForTextContainer:(__unused NSTextContainer *)textContainer
{
  return NSMakeRange(0, 4);
}

- (void)enumerateLineFragmentsForGlyphRange:(NSRange)glyphRange
                                 usingBlock:(void (^)(
                                                CGRect rect,
                                                CGRect usedRect,
                                                NSTextContainer *textContainer,
                                                NSRange glyphRange,
                                                BOOL *stop))block
{
  self.isEnumeratingLineFragments = YES;
  BOOL stop = NO;
  block(CGRectZero, CGRectZero, self.textContainers.firstObject, glyphRange, &stop);
  self.isEnumeratingLineFragments = NO;
}

- (NSRange)truncatedGlyphRangeInLineFragmentForGlyphAtIndex:(__unused NSUInteger)glyphIndex
{
  return NSMakeRange(2, 1);
}

- (NSRange)characterRangeForGlyphRange:(NSRange)glyphRange actualGlyphRange:(__unused NSRangePointer)actualGlyphRange
{
  return glyphRange;
}

@end

@interface RCTTextStorageMutationObserver : NSObject <NSTextStorageDelegate>

@property (nonatomic, weak) RCTTruncatingLayoutManager *layoutManager;
@property (nonatomic, assign) BOOL mutatedWhileEnumeratingLineFragments;
@property (nonatomic, assign) NSRange firstEditedRange;

@end

@implementation RCTTextStorageMutationObserver

- (void)textStorage:(__unused NSTextStorage *)textStorage
    willProcessEditing:(__unused NSTextStorageEditActions)editedMask
                 range:(NSRange)editedRange
        changeInLength:(__unused NSInteger)delta
{
  if (self.firstEditedRange.location == NSNotFound) {
    self.firstEditedRange = editedRange;
  }
  if (self.layoutManager.isEnumeratingLineFragments) {
    self.mutatedWhileEnumeratingLineFragments = YES;
  }
}

@end

@interface RCTTextLayoutManagerTests : XCTestCase
@end

@implementation RCTTextLayoutManagerTests

- (void)testProcessingTruncatedTextMutatesAfterEnumeratingCompleteCharacterSequences
{
  // The combining acute accent at index 2 belongs to the composed sequence that starts at index 1.
  NSTextStorage *textStorage =
      [[NSTextStorage alloc] initWithString:@"ae\u0301b"
                                 attributes:@{NSForegroundColorAttributeName : UIColor.blackColor}];
  RCTTruncatingLayoutManager *layoutManager = [RCTTruncatingLayoutManager new];
  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:CGSizeMake(20, 40)];
  textContainer.maximumNumberOfLines = 1;
  [layoutManager addTextContainer:textContainer];
  RCTTextStorageMutationObserver *mutationObserver = [RCTTextStorageMutationObserver new];
  mutationObserver.layoutManager = layoutManager;
  mutationObserver.firstEditedRange = NSMakeRange(NSNotFound, 0);
  textStorage.delegate = mutationObserver;

  RCTTextLayoutManager *textLayoutManager = [RCTTextLayoutManager new];
  [textLayoutManager processTruncatedAttributedText:textStorage
                                      textContainer:textContainer
                                      layoutManager:layoutManager];

  XCTAssertFalse(mutationObserver.mutatedWhileEnumeratingLineFragments);
  XCTAssertTrue(NSEqualRanges(mutationObserver.firstEditedRange, NSMakeRange(1, 2)));
}

- (void)testDrawingTruncatedComposedCharactersDoesNotThrow
{
  AttributedString attributedString;
  AttributedString::Fragment fragment;
  fragment.string = "◍🥝۪〬.࠭⤿𝓚𝔀𝓜◍🥭۪〬";
  fragment.textAttributes.fontSize = 17;
  fragment.textAttributes.foregroundColor = blackColor();
  fragment.textAttributes.backgroundColor = clearColor();
  fragment.textAttributes.isHighlighted = true;
  attributedString.appendFragment(std::move(fragment));

  ParagraphAttributes paragraphAttributes;
  paragraphAttributes.maximumNumberOfLines = 1;
  paragraphAttributes.ellipsizeMode = EllipsizeMode::Tail;

  RCTTextLayoutManager *textLayoutManager = [RCTTextLayoutManager new];

  for (CGFloat width = 20; width <= 200; width += 0.5) {
    NSException *caughtException = nil;
    UIGraphicsBeginImageContextWithOptions(CGSizeMake(width, 40), NO, 1);
    @try {
      [textLayoutManager drawAttributedString:attributedString
                          paragraphAttributes:paragraphAttributes
                                        frame:CGRectMake(0, 0, width, 40)
                            drawHighlightPath:^(__unused UIBezierPath *highlightPath){
                            }];
    } @catch (NSException *exception) {
      caughtException = exception;
    } @finally {
      UIGraphicsEndImageContext();
    }

    XCTAssertNil(caughtException, @"Drawing truncated text threw at width %.1f: %@", width, caughtException);
    if (caughtException != nil) {
      break;
    }
  }
}

@end
