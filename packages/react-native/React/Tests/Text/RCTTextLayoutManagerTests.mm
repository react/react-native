/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/NSTextStorage+FontScaling.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>

#include <chrono>
#include <future>
#include <limits>
#include <memory>
#include <string>
#include <utility>
#include <vector>

using namespace facebook::react;

@interface RCTTextLayoutManagerTests : XCTestCase

@end

@implementation RCTTextLayoutManagerTests

struct NamedText {
  const char *name;
  AttributedString attributedString;
};

struct NamedParagraphAttributes {
  const char *name;
  ParagraphAttributes paragraphAttributes;
};

static AttributedString::Fragment
Fragment(std::string string, Float fontSize, std::string fontFamily = "", Float lineHeight = 0)
{
  AttributedString::Fragment fragment;
  fragment.string = std::move(string);
  fragment.textAttributes.fontSize = fontSize;
  fragment.textAttributes.fontFamily = std::move(fontFamily);
  if (lineHeight > 0) {
    fragment.textAttributes.lineHeight = lineHeight;
  }
  return fragment;
}

static AttributedString Text(std::vector<AttributedString::Fragment> fragments)
{
  AttributedString attributedString;
  for (auto &fragment : fragments) {
    attributedString.appendFragment(std::move(fragment));
  }
  return attributedString;
}

static std::vector<NamedText> Texts()
{
  return {
      {"one word", Text({Fragment("Hello", 14)})},
      {"wrapping", Text({Fragment("The quick brown fox jumps over the lazy dog, and then it jumps back again.", 14)})},
      {"mixed sizes", Text({Fragment("Small text, ", 12), Fragment("large text, ", 24), Fragment("small again.", 12)})},
      {"emoji",
       Text({Fragment(
           "Emoji 😀👨‍👩‍👧‍👦🏳️‍🌈 between words, and 🎉🎉🎉 further along.", 14)})},
      {"CJK", Text({Fragment("日本語のテキストと中文文本、그리고 한국어 텍스트 next to Latin text.", 14)})},
      {"Arabic", Text({Fragment("مرحبا بالعالم، هذا نص عربي ", 14), Fragment("followed by English.", 16)})},
      {"Thai and Devanagari", Text({Fragment("Thai ภาษาไทย, Devanagari हिन्दी, and symbols ∑∫√ ☃.", 14)})},
      {"newlines", Text({Fragment("First line\nSecond line\n\nFourth line, after an empty one\n", 14)})},
      {"line height", Text({Fragment("Text with a line height, 日本語 and 😀, that wraps around.", 14, "", 26)})},
      {"font family", Text({Fragment("Georgia with 日本語 and 😀 in it, long enough to wrap.", 15, "Georgia")})},
  };
}

static std::vector<NamedParagraphAttributes> ParagraphSettings()
{
  ParagraphAttributes twoLines;
  twoLines.maximumNumberOfLines = 2;
  twoLines.ellipsizeMode = EllipsizeMode::Tail;
  ParagraphAttributes shrinkToOneLine;
  shrinkToOneLine.maximumNumberOfLines = 1;
  shrinkToOneLine.ellipsizeMode = EllipsizeMode::Tail;
  shrinkToOneLine.adjustsFontSizeToFit = true;
  return {{"no line limit", ParagraphAttributes{}}, {"two lines", twoLines}, {"shrink to one line", shrinkToOneLine}};
}

static CGFloat MaximumFontSize(NSAttributedString *attributedString)
{
  __block CGFloat maximumFontSize = 0.0;
  [attributedString enumerateAttribute:NSFontAttributeName
                               inRange:NSMakeRange(0, attributedString.length)
                               options:0
                            usingBlock:^(UIFont *font, __unused NSRange range, __unused BOOL *stop) {
                              maximumFontSize = MAX(font.pointSize, maximumFontSize);
                            }];
  return maximumFontSize;
}

/*
 * A plain NSTextStorage with a layout manager, set up the way RCTTextLayoutManager sets up its text storage. Every
 * paragraph setting in these tests that limits the lines truncates the tail.
 */
static NSTextStorage *ReferenceTextStorage(
    const AttributedString &attributedString,
    const ParagraphAttributes &paragraphAttributes,
    CGSize size)
{
  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];
  textContainer.lineFragmentPadding = 0.0;
  textContainer.lineBreakMode =
      paragraphAttributes.maximumNumberOfLines > 0 ? NSLineBreakByTruncatingTail : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = paragraphAttributes.maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  layoutManager.usesFontLeading = NO;
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage =
      [[NSTextStorage alloc] initWithAttributedString:RCTNSAttributedStringFromAttributedString(attributedString)];
  RCTApplyBaselineOffset(textStorage);
  [textStorage addLayoutManager:layoutManager];

  if (paragraphAttributes.adjustsFontSizeToFit) {
    [textStorage scaleFontSizeToFitSize:size minimumFontSize:4.0 maximumFontSize:MaximumFontSize(textStorage)];
  }
  return textStorage;
}

/*
 * The text, the used rectangle and the baseline of every line that the layout manager of `textStorage` made.
 */
static NSArray<NSArray *> *Lines(NSTextStorage *textStorage)
{
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  NSMutableArray<NSArray *> *lines = [NSMutableArray new];
  [layoutManager enumerateLineFragmentsForGlyphRange:[layoutManager glyphRangeForTextContainer:textContainer]
                                          usingBlock:^(
                                              __unused CGRect rect,
                                              CGRect usedRect,
                                              __unused NSTextContainer *usedTextContainer,
                                              NSRange glyphRange,
                                              __unused BOOL *stop) {
                                            NSRange range = [layoutManager characterRangeForGlyphRange:glyphRange
                                                                                      actualGlyphRange:nil];
                                            CGFloat baseline = [layoutManager locationForGlyphAtIndex:range.location].y;
                                            [lines addObject:@[
                                              [textStorage.string substringWithRange:range],
                                              [NSValue valueWithCGRect:usedRect],
                                              @(baseline)
                                            ]];
                                          }];
  return lines;
}

- (void)testLinesMatchAPlainTextStorage
{
  RCTTextLayoutManager *textLayoutManager = [RCTTextLayoutManager new];

  NSUInteger comparedLines = 0;
  NSUInteger shrunkTexts = 0;
  for (const auto &text : Texts()) {
    for (const auto &setting : ParagraphSettings()) {
      for (CGFloat width : {60.0, 150.0, 320.0}) {
        NSString *where = [NSString stringWithFormat:@"%s, %s, width %.0f", text.name, setting.name, width];
        CGSize size = CGSizeMake(width, CGFLOAT_MAX);
        LinesMeasurements lines = [textLayoutManager getLinesForAttributedString:text.attributedString
                                                             paragraphAttributes:setting.paragraphAttributes
                                                                            size:size];

        NSTextStorage *textStorage = ReferenceTextStorage(text.attributedString, setting.paragraphAttributes, size);
        NSArray<NSArray *> *referenceLines = Lines(textStorage);
        if (MaximumFontSize(textStorage) <
            MaximumFontSize(RCTNSAttributedStringFromAttributedString(text.attributedString))) {
          shrunkTexts++;
        }

        XCTAssertEqual(lines.size(), referenceLines.count, @"%@", where);
        for (NSUInteger i = 0; i < MIN(lines.size(), referenceLines.count); i++) {
          const auto &frame = lines[i].frame;
          CGRect lineRect = CGRectMake(frame.origin.x, frame.origin.y, frame.size.width, frame.size.height);
          XCTAssertEqualObjects(@(lines[i].text.c_str()), referenceLines[i][0], @"%@, line %lu", where, i);
          XCTAssertTrue(CGRectEqualToRect(lineRect, [referenceLines[i][1] CGRectValue]), @"%@, line %lu", where, i);
          XCTAssertEqual(lines[i].ascender, [referenceLines[i][2] doubleValue], @"%@, line %lu", where, i);
          comparedLines++;
        }
      }
    }
  }
  XCTAssertGreaterThan(comparedLines, 200u);
  XCTAssertGreaterThan(shrunkTexts, 10u);
}

static NSData *Pixels(CGSize size, void (^draw)(void))
{
  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat new];
  format.scale = 2;
  format.opaque = YES;
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size format:format];
  UIImage *image = [renderer imageWithActions:^(__unused UIGraphicsImageRendererContext *context) {
    [UIColor.whiteColor setFill];
    UIRectFill(CGRectMake(0, 0, size.width, size.height));
    draw();
  }];
  return CFBridgingRelease(CGDataProviderCopyData(CGImageGetDataProvider(image.CGImage)));
}

- (void)testDrawingMatchesAPlainTextStorage
{
  RCTTextLayoutManager *textLayoutManager = [RCTTextLayoutManager new];
  CGRect frame = CGRectMake(0, 0, 150, 160);
  NSData *blank = Pixels(
      frame.size,
      ^{
      });

  for (const auto &text : Texts()) {
    for (const auto &setting : ParagraphSettings()) {
      NSString *where = [NSString stringWithFormat:@"%s, %s", text.name, setting.name];
      NSData *drawn = Pixels(frame.size, ^{
        [textLayoutManager drawAttributedString:text.attributedString
                            paragraphAttributes:setting.paragraphAttributes
                                          frame:frame
                              drawHighlightPath:nil];
      });

      NSData *reference = Pixels(frame.size, ^{
        CGSize size =
            setting.paragraphAttributes.adjustsFontSizeToFit ? frame.size : CGSizeMake(frame.size.width, CGFLOAT_MAX);
        NSTextStorage *textStorage = ReferenceTextStorage(text.attributedString, setting.paragraphAttributes, size);
        NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
        NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
        NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
        [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:frame.origin];
        [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:frame.origin];
      });

      XCTAssertNotEqualObjects(drawn, blank, @"%@", where);
      XCTAssertEqualObjects(drawn, reference, @"%@", where);
    }
  }
}

/*
 * Measures a plain text, a text with a line height, and a text that is shrunk to fit one line. RCTTextLayoutManager
 * edits its text storage for the last two after it has created it.
 */
static void MeasureTexts(RCTTextLayoutManager *textLayoutManager)
{
  NSMutableParagraphStyle *lineHeight = [NSMutableParagraphStyle new];
  lineHeight.minimumLineHeight = 26;
  lineHeight.maximumLineHeight = 26;
  UIFont *font = [UIFont systemFontOfSize:14];
  NSString *string = @"Text that is measured, and is too long for one line of the width it is given.";
  NSAttributedString *plainText = [[NSAttributedString alloc] initWithString:string
                                                                  attributes:@{NSFontAttributeName : font}];
  NSAttributedString *lineHeightText = [[NSAttributedString alloc]
      initWithString:string
          attributes:@{NSFontAttributeName : font, NSParagraphStyleAttributeName : lineHeight}];
  ParagraphAttributes shrinkToOneLine;
  shrinkToOneLine.maximumNumberOfLines = 1;
  shrinkToOneLine.ellipsizeMode = EllipsizeMode::Tail;
  shrinkToOneLine.adjustsFontSizeToFit = true;
  LayoutConstraints layoutConstraints;
  layoutConstraints.maximumSize = {.width = 200, .height = std::numeric_limits<Float>::infinity()};

  [textLayoutManager measureNSAttributedString:plainText
      paragraphAttributes:ParagraphAttributes {}
      layoutContext:TextLayoutContext {}
      layoutConstraints:layoutConstraints];
  [textLayoutManager measureNSAttributedString:lineHeightText
      paragraphAttributes:ParagraphAttributes {}
      layoutContext:TextLayoutContext {}
      layoutConstraints:layoutConstraints];
  [textLayoutManager measureNSAttributedString:plainText
                           paragraphAttributes:shrinkToOneLine
                                 layoutContext:TextLayoutContext {}
                             layoutConstraints:layoutConstraints];
}

/*
 * NSTextStorage posts a notification to the default notification center before and after it processes an edit, which
 * makes a measurement depend on every observer of them. This pins that defect: a measurement posts them.
 */
- (void)testMeasuringPostsTextStorageNotifications
{
  XCTAssertTrue(NSThread.isMainThread);

  // Only this thread's notifications are counted: another thread can edit a text storage of its own meanwhile.
  __block NSUInteger notificationCount = 0;
  NSMutableArray<id<NSObject>> *observers = [NSMutableArray new];
  for (NSNotificationName name in
       @[ NSTextStorageWillProcessEditingNotification, NSTextStorageDidProcessEditingNotification ]) {
    [observers addObject:[NSNotificationCenter.defaultCenter addObserverForName:name
                                                                         object:nil
                                                                          queue:nil
                                                                     usingBlock:^(__unused NSNotification *note) {
                                                                       if (NSThread.isMainThread) {
                                                                         notificationCount++;
                                                                       }
                                                                     }]];
  }

  MeasureTexts([RCTTextLayoutManager new]);

  for (id<NSObject> observer in observers) {
    [NSNotificationCenter.defaultCenter removeObserver:observer];
  }
  XCTAssertGreaterThan(notificationCount, 0u);
}

/*
 * The thread that posts a notification waits for an observer that asked for delivery on the main queue, until the main
 * thread has run the observer. UIKit registers such an observer for the notifications of every text storage while a
 * search field is on screen. Text is measured on the JavaScript thread, and the main thread blocks on the JavaScript
 * thread when it flushes an event synchronously, so a measurement that waits for the main thread never finishes. This
 * pins that a measurement waits.
 */
- (void)testMeasuringOffTheMainThreadWaitsForAMainQueueObserver
{
  XCTAssertTrue(NSThread.isMainThread);

  __block NSUInteger observerCallCount = 0;
  id<NSObject> observer =
      [NSNotificationCenter.defaultCenter addObserverForName:NSTextStorageDidProcessEditingNotification
                                                      object:nil
                                                       queue:NSOperationQueue.mainQueue
                                                  usingBlock:^(__unused NSNotification *note) {
                                                    observerCallCount++;
                                                  }];

  RCTTextLayoutManager *textLayoutManager = [RCTTextLayoutManager new];
  auto measured = std::make_shared<std::promise<void>>();
  std::future<void> isMeasured = measured->get_future();
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    MeasureTexts(textLayoutManager);
    measured->set_value();
  });

  // The main thread blocks here without running its queue, as it does while it waits for the JavaScript thread.
  BOOL measuredWhileMainThreadWasBlocked = isMeasured.wait_for(std::chrono::seconds(1)) == std::future_status::ready;
  XCTAssertFalse(measuredWhileMainThreadWasBlocked);

  // Running the main queue delivers the notifications and lets the measurement finish.
  NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:10];
  while (isMeasured.wait_for(std::chrono::seconds(0)) != std::future_status::ready &&
         deadline.timeIntervalSinceNow > 0) {
    [NSRunLoop.currentRunLoop runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.01]];
  }
  [NSNotificationCenter.defaultCenter removeObserver:observer];
  XCTAssertTrue(isMeasured.wait_for(std::chrono::seconds(0)) == std::future_status::ready);
  XCTAssertGreaterThan(observerCallCount, 0u);
}

@end
