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
#import <react/renderer/attributedstring/TextAttributes.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>

#include <limits>
#include <string>
#include <vector>

using namespace facebook::react;

namespace {

struct TextKit2TestCase {
  const char *name;
  AttributedString attributedString;
  ParagraphAttributes paragraphAttributes;
  Float width;
  // TextKit 1 reports the baseline of the first glyph of a line, which can be offset by shaping (e.g. in Arabic);
  // TextKit 2 reports the baseline of the line.
  bool comparesBaselines = true;
  // Color emoji are rasterized slightly differently.
  bool comparesPixels = true;
  // Before iOS 26, TextKit 2 puts the trailing whitespace of right-to-left lines on the other side of their bounds.
  bool comparesLineFramesBeforeIOS26 = true;
};

TextAttributes textAttributes(Float fontSize, Float lineHeight = NAN, std::optional<TextAlignment> alignment = {})
{
  TextAttributes attributes = TextAttributes::defaultTextAttributes();
  attributes.fontSize = fontSize;
  attributes.lineHeight = lineHeight;
  attributes.alignment = alignment;
  return attributes;
}

AttributedString::Fragment textFragment(std::string string, TextAttributes attributes)
{
  AttributedString::Fragment fragment;
  fragment.string = std::move(string);
  fragment.textAttributes = std::move(attributes);
  return fragment;
}

AttributedString::Fragment attachmentFragment(facebook::react::Size size, TextAttributes attributes)
{
  AttributedString::Fragment fragment;
  fragment.string = AttributedString::Fragment::AttachmentCharacter();
  fragment.textAttributes = std::move(attributes);
  fragment.parentShadowView.layoutMetrics.frame.size = size;
  return fragment;
}

AttributedString attributedString(std::vector<AttributedString::Fragment> fragments)
{
  AttributedString attributedString;
  for (auto &fragment : fragments) {
    attributedString.appendFragment(std::move(fragment));
  }
  return attributedString;
}

ParagraphAttributes paragraphAttributes(
    int maximumNumberOfLines = 0,
    EllipsizeMode ellipsizeMode = EllipsizeMode::Tail,
    bool adjustsFontSizeToFit = false)
{
  ParagraphAttributes paragraphAttributes;
  paragraphAttributes.maximumNumberOfLines = maximumNumberOfLines;
  paragraphAttributes.ellipsizeMode = ellipsizeMode;
  paragraphAttributes.adjustsFontSizeToFit = adjustsFontSizeToFit;
  return paragraphAttributes;
}

const std::string kLorem = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";

/**
 * Text that TextKit 1 and TextKit 2 lay out, measure and draw the same way.
 */
std::vector<TextKit2TestCase> equivalentTestCases()
{
  return {
      {"single line", attributedString({textFragment("Hello world", textAttributes(14))}), paragraphAttributes(), 300},
      {"wrapping", attributedString({textFragment(kLorem, textAttributes(16))}), paragraphAttributes(), 200},
      {"centered",
       attributedString({textFragment(kLorem, textAttributes(16, NAN, TextAlignment::Center))}),
       paragraphAttributes(),
       200},
      {"right aligned",
       attributedString({textFragment(kLorem, textAttributes(16, NAN, TextAlignment::Right))}),
       paragraphAttributes(),
       200},
      {"line height", attributedString({textFragment(kLorem, textAttributes(16, 30))}), paragraphAttributes(), 200},
      {"compressed line height",
       attributedString({textFragment(kLorem, textAttributes(16, 12))}),
       paragraphAttributes(),
       200},
      {"trailing line break",
       attributedString({textFragment("Line one\n", textAttributes(14))}),
       paragraphAttributes(),
       300},
      {"trailing empty paragraph",
       attributedString({textFragment("A\n\n", textAttributes(20))}),
       paragraphAttributes(),
       300},
      {"trailing empty paragraph with line height",
       attributedString({textFragment("A\n\n", textAttributes(20, 30))}),
       paragraphAttributes(),
       300},
      {"only a line break", attributedString({textFragment("\n", textAttributes(20))}), paragraphAttributes(), 300},
      {"paragraphs",
       attributedString({textFragment(kLorem + "\n" + kLorem, textAttributes(14))}),
       paragraphAttributes(),
       180},
      {"tail truncation", attributedString({textFragment(kLorem, textAttributes(16))}), paragraphAttributes(2), 200},
      {"tail truncation of a paragraph",
       attributedString({textFragment("Short\nSecond paragraph that is long enough\nThird", textAttributes(16))}),
       paragraphAttributes(2),
       200},
      {"line limit with a trailing empty line",
       attributedString({textFragment("one\ntwo\n", textAttributes(16))}),
       paragraphAttributes(2),
       200},
      {"clipped single line",
       attributedString({textFragment(kLorem, textAttributes(16))}),
       paragraphAttributes(1, EllipsizeMode::Clip),
       200},
      {"mixed font sizes",
       attributedString(
           {textFragment("Small ", textAttributes(12)),
            textFragment("BIG", textAttributes(36)),
            textFragment(" small again and wrapping onto the next line", textAttributes(12))}),
       paragraphAttributes(),
       160},
      {"attachments",
       attributedString(
           {textFragment("Before ", textAttributes(16)),
            attachmentFragment({.width = 40, .height = 30}, textAttributes(16)),
            textFragment(" after and more words that wrap ", textAttributes(16)),
            attachmentFragment({.width = 20, .height = 20}, textAttributes(16))}),
       paragraphAttributes(),
       200},
      {"attachment after the line limit",
       attributedString(
           {textFragment("First\nSecond ", textAttributes(16)),
            attachmentFragment({.width = 20, .height = 20}, textAttributes(16))}),
       paragraphAttributes(1),
       200},
      {"emoji",
       attributedString({textFragment(
           "Emoji 😀👨‍👩‍👧‍👦🇵🇱 mixed with text that wraps", textAttributes(16))}),
       paragraphAttributes(),
       150,
       true,
       false},
      {"CJK",
       attributedString({textFragment("日本語のテキストは単語の間にスペースがありません。", textAttributes(16))}),
       paragraphAttributes(),
       150},
      {"right-to-left text with natural alignment",
       attributedString({textFragment("مرحبا بالعالم هذا نص عربي طويل يلتف على عدة أسطر", textAttributes(16))}),
       paragraphAttributes(),
       150,
       false,
       true,
       false},
      {"Thai",
       attributedString({textFragment("ภาษาไทยไม่มีช่องว่างระหว่างคำซึ่งต้องตัดคำ", textAttributes(16))}),
       paragraphAttributes(),
       150},
      {"adjusts font size to fit",
       attributedString({textFragment(kLorem, textAttributes(16))}),
       paragraphAttributes(2, EllipsizeMode::Tail, true),
       200},
  };
}

UIImage *drawAttributedString(RCTTextLayoutManager *textLayoutManager, const TextKit2TestCase &testCase, CGSize size)
{
  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
  format.scale = 3;
  format.opaque = YES;
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size format:format];
  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
    [UIColor.whiteColor setFill];
    UIRectFill(CGRectMake(0, 0, size.width, size.height));
    [textLayoutManager drawAttributedString:testCase.attributedString
                        paragraphAttributes:testCase.paragraphAttributes
                                      frame:CGRectMake(0, 0, size.width, size.height)
                          drawHighlightPath:nil];
  }];
}

} // namespace

@interface RCTTextLayoutManagerTextKit2Tests : XCTestCase
@end

@implementation RCTTextLayoutManagerTextKit2Tests {
  RCTTextLayoutManager *_textKit1LayoutManager;
  RCTTextLayoutManager *_textKit2LayoutManager;
}

- (void)setUp
{
  [super setUp];
  _textKit1LayoutManager = [[RCTTextLayoutManager alloc] initWithTextKit2Enabled:NO];
  _textKit2LayoutManager = [[RCTTextLayoutManager alloc] initWithTextKit2Enabled:YES];
}

- (BOOL)skipIfTextKit2IsUnavailable
{
  if (!_textKit2LayoutManager.usesTextKit2) {
    NSLog(@"TextKit 2 requires iOS 16 or later; skipping.");
    return YES;
  }
  return NO;
}

- (TextMeasurement)measure:(const TextKit2TestCase &)testCase with:(RCTTextLayoutManager *)textLayoutManager
{
  return [textLayoutManager
      measureAttributedString:testCase.attributedString
          paragraphAttributes:testCase.paragraphAttributes
                layoutContext:{.pointScaleFactor = 3}
            layoutConstraints:{.maximumSize = {
                                   .width = testCase.width, .height = std::numeric_limits<Float>::infinity()}}];
}

- (void)testUsesTextKit2OnlyWhenEnabled
{
  XCTAssertFalse(_textKit1LayoutManager.usesTextKit2);
  if (@available(iOS 16.0, *)) {
    XCTAssertTrue(_textKit2LayoutManager.usesTextKit2);
  }
}

- (void)testMeasurementMatchesTextKit1
{
  if ([self skipIfTextKit2IsUnavailable]) {
    return;
  }
  for (const auto &testCase : equivalentTestCases()) {
    TextMeasurement textKit1 = [self measure:testCase with:_textKit1LayoutManager];
    TextMeasurement textKit2 = [self measure:testCase with:_textKit2LayoutManager];

    XCTAssertEqualWithAccuracy(textKit1.size.width, textKit2.size.width, 0.01, @"%s", testCase.name);
    XCTAssertEqualWithAccuracy(textKit1.size.height, textKit2.size.height, 0.01, @"%s", testCase.name);

    XCTAssertEqual(textKit1.attachments.size(), textKit2.attachments.size(), @"%s", testCase.name);
    for (size_t index = 0; index < MIN(textKit1.attachments.size(), textKit2.attachments.size()); index++) {
      const auto &attachment1 = textKit1.attachments[index];
      const auto &attachment2 = textKit2.attachments[index];
      XCTAssertEqual(attachment1.isClipped, attachment2.isClipped, @"%s, attachment %zu", testCase.name, index);
      if (!attachment1.isClipped && !attachment2.isClipped) {
        XCTAssertEqualWithAccuracy(attachment1.frame.origin.x, attachment2.frame.origin.x, 0.01, @"%s", testCase.name);
        XCTAssertEqualWithAccuracy(attachment1.frame.origin.y, attachment2.frame.origin.y, 0.01, @"%s", testCase.name);
        XCTAssertEqualWithAccuracy(
            attachment1.frame.size.width, attachment2.frame.size.width, 0.01, @"%s", testCase.name);
        XCTAssertEqualWithAccuracy(
            attachment1.frame.size.height, attachment2.frame.size.height, 0.01, @"%s", testCase.name);
      }
    }
  }
}

- (void)testLinesMatchTextKit1
{
  if ([self skipIfTextKit2IsUnavailable]) {
    return;
  }
  BOOL isIOS26OrLater = NO;
  if (@available(iOS 26.0, *)) {
    isIOS26OrLater = YES;
  }
  for (const auto &testCase : equivalentTestCases()) {
    BOOL comparesLineFrames = isIOS26OrLater || testCase.comparesLineFramesBeforeIOS26;
    CGSize size = CGSizeMake(testCase.width, CGFLOAT_MAX);
    LinesMeasurements textKit1 = [_textKit1LayoutManager getLinesForAttributedString:testCase.attributedString
                                                                 paragraphAttributes:testCase.paragraphAttributes
                                                                                size:size];
    LinesMeasurements textKit2 = [_textKit2LayoutManager getLinesForAttributedString:testCase.attributedString
                                                                 paragraphAttributes:testCase.paragraphAttributes
                                                                                size:size];

    XCTAssertEqual(textKit1.size(), textKit2.size(), @"%s", testCase.name);
    for (size_t index = 0; index < MIN(textKit1.size(), textKit2.size()); index++) {
      const auto &line1 = textKit1[index];
      const auto &line2 = textKit2[index];
      XCTAssertEqual(line1.text, line2.text, @"%s, line %zu", testCase.name, index);
      if (!comparesLineFrames) {
        continue;
      }
      XCTAssertEqualWithAccuracy(
          line1.frame.origin.x, line2.frame.origin.x, 0.01, @"%s, line %zu", testCase.name, index);
      XCTAssertEqualWithAccuracy(
          line1.frame.origin.y, line2.frame.origin.y, 0.01, @"%s, line %zu", testCase.name, index);
      XCTAssertEqualWithAccuracy(
          line1.frame.size.width, line2.frame.size.width, 0.01, @"%s, line %zu", testCase.name, index);
      XCTAssertEqualWithAccuracy(
          line1.frame.size.height, line2.frame.size.height, 0.01, @"%s, line %zu", testCase.name, index);
      // TextKit 1 reports a baseline at the bottom of lines that only contain a line break.
      if (testCase.comparesBaselines && line1.text != "\n") {
        XCTAssertEqualWithAccuracy(line1.ascender, line2.ascender, 0.01, @"%s, line %zu", testCase.name, index);
        XCTAssertEqualWithAccuracy(line1.descender, line2.descender, 0.01, @"%s, line %zu", testCase.name, index);
      }
    }
  }
}

- (void)testDrawingMatchesTextKit1
{
  if ([self skipIfTextKit2IsUnavailable]) {
    return;
  }
  for (const auto &testCase : equivalentTestCases()) {
    if (!testCase.comparesPixels) {
      continue;
    }
    TextMeasurement measurement = [self measure:testCase with:_textKit1LayoutManager];
    CGSize size = CGSizeMake(testCase.width, MAX(measurement.size.height, 1));
    NSData *textKit1 = UIImagePNGRepresentation(drawAttributedString(_textKit1LayoutManager, testCase, size));
    NSData *textKit2 = UIImagePNGRepresentation(drawAttributedString(_textKit2LayoutManager, testCase, size));
    XCTAssertEqualObjects(textKit1, textKit2, @"%s draws differently", testCase.name);
  }
}

#pragma mark - Intentional differences

- (void)testTruncatedAttachmentDoesNotGrowItsLine
{
  if ([self skipIfTextKit2IsUnavailable]) {
    return;
  }
  // TextKit 1 makes the last line tall enough for an attachment it truncates; TextKit 2 does not lay it out.
  TextKit2TestCase testCase = {
      "truncated attachment",
      attributedString(
          {textFragment(kLorem, textAttributes(16)),
           attachmentFragment({.width = 20, .height = 40}, textAttributes(16))}),
      paragraphAttributes(2),
      200};
  TextKit2TestCase withoutAttachment = {
      "without attachment", attributedString({textFragment(kLorem, textAttributes(16))}), paragraphAttributes(2), 200};

  TextMeasurement measurement = [self measure:testCase with:_textKit2LayoutManager];
  XCTAssertEqual(measurement.attachments.size(), 1);
  XCTAssertTrue(measurement.attachments[0].isClipped);
  XCTAssertEqualWithAccuracy(
      measurement.size.height, [self measure:withoutAttachment with:_textKit2LayoutManager].size.height, 0.01);
}

- (void)testClippingWithMultipleLinesDropsWhatDoesNotFit
{
  if ([self skipIfTextKit2IsUnavailable]) {
    return;
  }
  // TextKit 1 puts the rest of the text on the last line and clips it at the edge of the container; TextKit 2 wraps
  // it like any other line and drops what does not fit.
  TextKit2TestCase testCase = {
      "clipped lines",
      attributedString({textFragment(kLorem, textAttributes(16))}),
      paragraphAttributes(2, EllipsizeMode::Clip),
      200};
  LinesMeasurements lines =
      [_textKit2LayoutManager getLinesForAttributedString:testCase.attributedString
                                      paragraphAttributes:testCase.paragraphAttributes
                                                     size:CGSizeMake(testCase.width, CGFLOAT_MAX)];
  XCTAssertEqual(lines.size(), 2);
  XCTAssertLessThanOrEqual(lines[1].frame.size.width, testCase.width);
}

@end
