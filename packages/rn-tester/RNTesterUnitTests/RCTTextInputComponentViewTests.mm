/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextInputComponentView.h>
#import <React/RCTUITextView.h>
#import <XCTest/XCTest.h>
#import <objc/runtime.h>

#import <react/renderer/components/iostextinput/TextInputShadowNode.h>
#import <react/renderer/graphics/Color.h>

using namespace facebook::react;

static TextInputShadowNode::ConcreteState::Shared textState(
    AttributedString text,
    const TextInputShadowNode::ConcreteState::Shared &previous = nullptr,
    int64_t eventCount = 0)
{
  auto data =
      std::make_shared<const TextInputState>(AttributedStringBox{text}, text, ParagraphAttributes{}, eventCount);
  if (previous) {
    return std::make_shared<const TextInputShadowNode::ConcreteState>(data, *previous);
  }
  return std::make_shared<const TextInputShadowNode::ConcreteState>(data, ShadowNodeFamily::Weak{});
}

static RCTTextInputComponentView *multilineInput()
{
  RCTTextInputComponentView *component = [[RCTTextInputComponentView alloc] initWithFrame:CGRectMake(0, 0, 300, 100)];
  auto props = std::make_shared<TextInputProps>();
  props->multiline = true;
  [component updateProps:props oldProps:nullptr];
  return component;
}

static AttributedString styledText(bool highlightFirst, bool split = true)
{
  TextAttributes first;
  first.foregroundColor = highlightFirst ? colorFromRGBA(255, 0, 0, 255) : blackColor();
  if (!highlightFirst) {
    first.textDecorationLineType = TextDecorationLineType::Underline;
  }
  AttributedString text;
  text.appendFragment({.string = "Hello", .textAttributes = first});
  if (split) {
    TextAttributes last;
    last.foregroundColor = colorFromRGBA(0, 0, 255, 255);
    text.appendFragment({.string = " ✅ world", .textAttributes = last});
  } else {
    text.appendFragment({.string = " ✅ world", .textAttributes = first});
  }
  return text;
}

@interface RCTTextInputFontFallbackView : RCTUITextView
@end

@implementation RCTTextInputFontFallbackView

- (NSAttributedString *)attributedText
{
  // Simulate the font attributes reported by UIKit without depending on the simulator's font fallback.
  NSMutableAttributedString *text = [[super attributedText] mutableCopy];
  NSRange emoji = [text.string rangeOfString:@"✅"];
  if (text.length == 0 || emoji.location == NSNotFound) {
    return text;
  }
  UIFont *font = [text attribute:NSFontAttributeName atIndex:emoji.location effectiveRange:NULL];
  UIFont *fallback = [UIFont fontWithName:@"AppleColorEmoji" size:font.pointSize];
  if (font && fallback) {
    [text addAttributes:@{@"NSOriginalFont" : font, NSFontAttributeName : fallback} range:emoji];
  }
  return text;
}

@end

@interface RCTTextInputComponentViewTests : XCTestCase
@end

@implementation RCTTextInputComponentViewTests

- (void)testMultilineStyleUpdatePreservesSelectionAndUIKitFontFallback
{
  RCTTextInputComponentView *component = multilineInput();
  RCTUITextView *textView = (RCTUITextView *)component.accessibilityElement;
  auto initial = textState(styledText(false));
  [component updateState:initial oldState:nullptr];

  BOOL usesTextKit2 = NO;
  if (@available(iOS 16.0, *)) {
    usesTextKit2 = textView.textLayoutManager != nil;
  }
  NSTextStorage *storage = textView.textStorage;
  NSString *string = [storage.string copy];
  NSRange emoji = [string rangeOfString:@"✅"];
  UIFont *originalFont = [storage attribute:NSFontAttributeName atIndex:emoji.location effectiveRange:NULL];
  [textView setSelectedRange:NSMakeRange(0, 5)];
  object_setClass(textView, [RCTTextInputFontFallbackView class]);
  XCTAssertEqualObjects(
      [textView.attributedText attribute:@"NSOriginalFont" atIndex:emoji.location effectiveRange:NULL], originalFont);

  auto updated = textState(styledText(true), initial);
  [component updateState:updated oldState:initial];

  XCTAssertEqual(storage, textView.textStorage);
  if (@available(iOS 16.0, *)) {
    XCTAssertEqual(usesTextKit2, textView.textLayoutManager != nil);
  }
  XCTAssertEqualObjects(textView.attributedText.string, string);
  XCTAssertTrue(NSEqualRanges(textView.selectedRange, NSMakeRange(0, 5)));
  XCTAssertEqualObjects(
      [storage attribute:NSForegroundColorAttributeName atIndex:0 effectiveRange:NULL], UIColor.redColor);
  XCTAssertNil([storage attribute:NSUnderlineStyleAttributeName atIndex:0 effectiveRange:NULL]);
  XCTAssertEqualObjects(
      [storage attribute:NSForegroundColorAttributeName atIndex:emoji.location effectiveRange:NULL], UIColor.blueColor);
  XCTAssertEqualObjects(
      [storage attribute:NSFontAttributeName atIndex:emoji.location effectiveRange:NULL], originalFont);
}

- (void)testEquivalentReactStylesLeaveNativeStorageUntouched
{
  RCTTextInputComponentView *component = multilineInput();
  RCTUITextView *textView = (RCTUITextView *)component.accessibilityElement;
  auto text = styledText(false, false);
  auto initial = textState(text);
  [component updateState:initial oldState:nullptr];

  NSTextStorage *storage = textView.textStorage;
  [storage addAttribute:@"EventEmitter" value:@1 range:NSMakeRange(0, 5)];
  NSAttributedString *snapshot = [storage copy];
  [textView setSelectedRange:NSMakeRange(2, 3)];

  // The second native range has the same rendered style but a different React event target.
  text.getFragments().back().parentShadowView.componentHandle = 1;
  auto updated = textState(text, initial);
  [component updateState:updated oldState:initial];

  XCTAssertEqualObjects(storage, snapshot);
  XCTAssertTrue(NSEqualRanges(textView.selectedRange, NSMakeRange(2, 3)));
}

- (void)testMultilineStyleUpdateIgnoresStaleState
{
  RCTTextInputComponentView *component = multilineInput();
  RCTUITextView *textView = (RCTUITextView *)component.accessibilityElement;
  auto initial = textState(styledText(false), nullptr, 1);
  [component updateState:initial oldState:nullptr];

  NSAttributedString *snapshot = [textView.attributedText copy];
  auto stale = textState(styledText(true), initial);
  [component updateState:stale oldState:initial];

  XCTAssertEqualObjects(textView.attributedText, snapshot);
}

@end
