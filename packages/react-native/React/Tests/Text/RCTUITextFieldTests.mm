/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConversions.h>
#import <React/RCTTextInputComponentView.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/iostextinput/TextInputProps.h>
#import <react/renderer/core/RawPropsParser.h>
#import <react/renderer/graphics/Color.h>

static NSParagraphStyle *RCTPlaceholderParagraphStyle(RCTUITextField *textField)
{
  return [textField.attributedPlaceholder attribute:NSParagraphStyleAttributeName atIndex:0 effectiveRange:NULL];
}

@interface RCTUITextFieldTests : XCTestCase
@end

@implementation RCTUITextFieldTests

- (void)testPlaceholderDropsLineHeightRemovedFromTextAttributes
{
  NSMutableParagraphStyle *lineHeightParagraphStyle = [NSMutableParagraphStyle new];
  lineHeightParagraphStyle.minimumLineHeight = 34;
  lineHeightParagraphStyle.maximumLineHeight = 34;
  RCTUITextField *textField = [RCTUITextField new];
  textField.placeholder = @"Search";
  textField.defaultTextAttributes = @{
    NSFontAttributeName : [UIFont systemFontOfSize:17],
    NSParagraphStyleAttributeName : lineHeightParagraphStyle,
  };

  textField.defaultTextAttributes = @{NSFontAttributeName : [UIFont systemFontOfSize:17]};

  NSParagraphStyle *paragraphStyle = RCTPlaceholderParagraphStyle(textField);
  XCTAssertNotNil(paragraphStyle);
  XCTAssertEqual(paragraphStyle.minimumLineHeight, 0);
  XCTAssertEqual(paragraphStyle.maximumLineHeight, 0);
  XCTAssertEqual(paragraphStyle.lineBreakMode, NSLineBreakByTruncatingTail);
}

- (void)testPlaceholderKeepsParagraphStyleFromTextAttributes
{
  NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
  paragraphStyle.alignment = NSTextAlignmentCenter;
  RCTUITextField *textField = [RCTUITextField new];
  textField.placeholder = @"Search";

  textField.defaultTextAttributes = @{
    NSFontAttributeName : [UIFont systemFontOfSize:17],
    NSParagraphStyleAttributeName : paragraphStyle,
  };

  XCTAssertEqual(RCTPlaceholderParagraphStyle(textField).alignment, NSTextAlignmentCenter);
}

- (void)testCaretHiddenMakesTheCaretTransparent
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.tintColor = UIColor.redColor;

  textField.caretHidden = YES;

  XCTAssertEqualObjects(textField.tintColor, UIColor.clearColor);
}

- (void)testClearingCaretHiddenRestoresTheSelectionColor
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.tintColor = UIColor.redColor;
  textField.caretHidden = YES;

  textField.caretHidden = NO;

  XCTAssertEqualObjects(textField.tintColor, UIColor.redColor);
}

- (void)testSelectionColorSetWhileCaretHiddenIsAppliedOnceTheCaretIsShown
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.caretHidden = YES;

  textField.tintColor = UIColor.redColor;

  XCTAssertEqualObjects(textField.tintColor, UIColor.clearColor);

  textField.caretHidden = NO;

  XCTAssertEqualObjects(textField.tintColor, UIColor.redColor);
}

- (void)testSelectionColorIsRestoredForSelectionsAndHiddenAgainWhenCollapsed
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"Hello"];
  textField.tintColor = UIColor.redColor;
  textField.caretHidden = YES;

  UITextPosition *start = textField.beginningOfDocument;
  UITextPosition *end = [textField positionFromPosition:start offset:textField.attributedText.length];
  for (NSNumber *notifyDelegate in @[ @YES, @NO ]) {
    [textField setSelectedTextRange:[textField textRangeFromPosition:start toPosition:end]
                     notifyDelegate:notifyDelegate.boolValue];
    XCTAssertEqualObjects(textField.tintColor, UIColor.redColor);

    [textField setSelectedTextRange:[textField textRangeFromPosition:end toPosition:end]
                     notifyDelegate:notifyDelegate.boolValue];
    XCTAssertEqualObjects(textField.tintColor, UIColor.clearColor);
  }
}

- (void)testReplacingASelectionHidesTheCaretAgain
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.delegate = nil;
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"Hello"];
  textField.tintColor = UIColor.redColor;
  textField.caretHidden = YES;
  [textField setSelectedTextRange:[textField textRangeFromPosition:textField.beginningOfDocument
                                                        toPosition:textField.endOfDocument]
                   notifyDelegate:NO];
  XCTAssertEqualObjects(textField.tintColor, UIColor.redColor);

  [textField insertText:@"X"];

  XCTAssertEqualObjects(textField.attributedText.string, @"X");
  XCTAssertTrue(textField.selectedTextRange.isEmpty);
  XCTAssertEqualObjects(textField.tintColor, UIColor.clearColor);
}

- (void)testHidingCaretPreservesItsGeometry
{
  RCTUITextField *textField = [[RCTUITextField alloc] initWithFrame:CGRectMake(0, 0, 200, 40)];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"Hello"];
  [textField layoutIfNeeded];
  CGRect visibleCaret = [textField caretRectForPosition:textField.endOfDocument];
  XCTAssertGreaterThan(visibleCaret.size.width, 0);
  XCTAssertGreaterThan(visibleCaret.size.height, 0);

  textField.caretHidden = YES;

  XCTAssertTrue(CGRectEqualToRect([textField caretRectForPosition:textField.endOfDocument], visibleCaret));
}

- (void)testClearingSelectionColorRestoresInheritedTint
{
  UIView *parent = [UIView new];
  parent.tintColor = UIColor.blueColor;
  RCTUITextField *textField = [RCTUITextField new];
  [parent addSubview:textField];
  textField.tintColor = UIColor.redColor;
  textField.caretHidden = YES;

  textField.tintColor = nil;
  XCTAssertEqualObjects(textField.tintColor, UIColor.clearColor);
  textField.caretHidden = NO;
  XCTAssertEqualObjects(textField.tintColor, UIColor.blueColor);
}

- (void)testSwitchingBackingViewsPreservesSelectionColor
{
  using namespace facebook::react;

  RCTTextInputComponentView *componentView = [RCTTextInputComponentView new];
  ContextContainer contextContainer{};
  PropsParserContext context{-1, contextContainer};
  RawProps rawProps(folly::dynamic::object("caretHidden", true));
  RawPropsParser parser;
  parser.prepare<TextInputProps>();
  rawProps.parse(parser);
  auto singleline = std::make_shared<TextInputProps>(context, TextInputProps{}, rawProps);
  singleline->selectionColor = colorFromRGBA(255, 0, 0, 255);
  UIColor *selectionColor = RCTUIColorFromSharedColor(singleline->selectionColor);
  [componentView updateProps:singleline oldProps:nullptr];
  XCTAssertEqualObjects(componentView.subviews.firstObject.tintColor, UIColor.clearColor);

  auto multiline = std::make_shared<TextInputProps>(*singleline);
  multiline->multiline = true;
  [componentView updateProps:multiline oldProps:singleline];
  XCTAssertTrue([componentView.subviews.firstObject isKindOfClass:RCTUITextView.class]);
  XCTAssertEqualObjects(componentView.subviews.firstObject.tintColor, selectionColor);

  [componentView updateProps:singleline oldProps:multiline];
  RCTUITextField *textField = (RCTUITextField *)componentView.subviews.firstObject;
  XCTAssertTrue([textField isKindOfClass:RCTUITextField.class]);
  XCTAssertEqualObjects(textField.tintColor, UIColor.clearColor);
  textField.caretHidden = NO;
  XCTAssertEqualObjects(textField.tintColor, selectionColor);
}

@end
