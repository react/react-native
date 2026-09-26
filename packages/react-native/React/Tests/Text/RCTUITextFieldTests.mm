/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextField.h>
#import <XCTest/XCTest.h>

@interface RCTUITextFieldTests : XCTestCase
@end

@implementation RCTUITextFieldTests

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

- (void)testSelectionColorIsAppliedToANonEmptySelection
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"Hello"];
  textField.tintColor = UIColor.redColor;
  textField.caretHidden = YES;

  UITextPosition *start = textField.beginningOfDocument;
  UITextPosition *end = [textField positionFromPosition:start offset:textField.attributedText.length];
  [textField setSelectedTextRange:[textField textRangeFromPosition:start toPosition:end] notifyDelegate:NO];

  XCTAssertEqualObjects(textField.tintColor, UIColor.redColor);
}

@end
