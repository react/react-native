/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextInputUtils.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>
#import <XCTest/XCTest.h>

@interface RCTTextInputUtilsTest : XCTestCase
@end

@implementation RCTTextInputUtilsTest

- (void)testCopyBackedTextInputPreservesTintColor
{
  RCTUITextField *source = [RCTUITextField new];
  RCTUITextView *destination = [RCTUITextView new];
  source.tintColor = UIColor.redColor;

  RCTCopyBackedTextInput(source, destination);

  XCTAssertEqualObjects(destination.tintColor, UIColor.redColor);
}

@end
