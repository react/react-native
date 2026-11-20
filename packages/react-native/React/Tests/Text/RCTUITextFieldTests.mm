/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextField.h>
#import <XCTest/XCTest.h>

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

@end
