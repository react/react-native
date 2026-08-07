/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTScrollViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/scrollview/ScrollViewProps.h>
#import <react/renderer/components/scrollview/ScrollViewShadowNode.h>

using namespace facebook::react;

#if TARGET_OS_IOS

static Props::Shared makeScrollViewProps(bool automaticallyAdjustKeyboardInsets)
{
  auto props = std::make_shared<ScrollViewProps>();
  props->automaticallyAdjustKeyboardInsets = automaticallyAdjustKeyboardInsets;
  return props;
}

@interface RCTScrollViewComponentView (Tests)
- (void)_keyboardWillChangeFrame:(NSNotification *)notification;
@end

@interface RCTScrollViewComponentViewTests : XCTestCase
@end

@implementation RCTScrollViewComponentViewTests

- (void)testAutomaticallyAdjustKeyboardInsetsAcrossRecycling
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  auto props = makeScrollViewProps(true);
  [view updateProps:props oldProps:ScrollViewShadowNode::defaultSharedProps()];

  NSNotification *notification = [NSNotification
      notificationWithName:UIKeyboardWillChangeFrameNotification
                    object:nil
                  userInfo:@{
                    UIKeyboardAnimationDurationUserInfoKey : @0,
                    UIKeyboardAnimationCurveUserInfoKey : @(UIViewAnimationCurveLinear),
                    UIKeyboardFrameBeginUserInfoKey : [NSValue valueWithCGRect:CGRectMake(0, 100, 100, 50)],
                    UIKeyboardFrameEndUserInfoKey : [NSValue valueWithCGRect:CGRectMake(0, 50, 100, 50)],
                  }];

  [view _keyboardWillChangeFrame:notification];
  XCTAssertEqual(view.scrollView.contentInset.bottom, 50);
  XCTAssertEqual(view.scrollView.verticalScrollIndicatorInsets.bottom, 50);

  [view.scrollView.layer addAnimation:[CABasicAnimation animationWithKeyPath:@"position"]
                               forKey:@"keyboardInsetAnimation"];
  [view prepareForRecycle];
  XCTAssertNil([view.scrollView.layer animationForKey:@"keyboardInsetAnimation"]);
  [view _keyboardWillChangeFrame:notification];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.scrollView.contentInset, UIEdgeInsetsZero));
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.scrollView.verticalScrollIndicatorInsets, UIEdgeInsetsZero));

  // `_props` still contains the previous owner's opt-in value. The assignment in `updateProps:` must therefore be
  // unconditional so a true-to-true reuse is re-armed after recycling.
  [view updateProps:props oldProps:ScrollViewShadowNode::defaultSharedProps()];
  [view _keyboardWillChangeFrame:notification];
  XCTAssertEqual(view.scrollView.contentInset.bottom, 50);
}

@end

#endif
