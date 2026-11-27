/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextView.h>
#import <XCTest/XCTest.h>

static UILabel *RCTPlaceholderLabel(RCTUITextView *textView)
{
  for (UIView *subview in textView.subviews) {
    if ([subview isKindOfClass:[UILabel class]]) {
      return (UILabel *)subview;
    }
  }
  return nil;
}

@interface RCTUITextViewTests : XCTestCase
@end

@implementation RCTUITextViewTests

- (void)testPlaceholderIsLaidOutWhenSetOnALaidOutView
{
  RCTUITextView *textView = [[RCTUITextView alloc] initWithFrame:CGRectMake(0, 0, 340, 122)];
  [textView layoutIfNeeded];

  textView.placeholder = @"Type 5 characters to show length helper";
  [textView layoutIfNeeded];

  XCTAssertNotNil(RCTPlaceholderLabel(textView));
  XCTAssertGreaterThan(CGRectGetHeight(RCTPlaceholderLabel(textView).frame), 0);
}

- (void)testPlaceholderIsLaidOutWhenItGetsLongerOnALaidOutView
{
  RCTUITextView *textView = [[RCTUITextView alloc] initWithFrame:CGRectMake(0, 0, 340, 122)];
  textView.placeholder = @"Short placeholder";
  [textView layoutIfNeeded];
  CGFloat oneLineHeight = CGRectGetHeight(RCTPlaceholderLabel(textView).frame);

  textView.placeholder = @"Tell us why you're interested in this position and what you would bring to the team";
  [textView layoutIfNeeded];

  XCTAssertGreaterThan(CGRectGetHeight(RCTPlaceholderLabel(textView).frame), oneLineHeight);
}

@end
