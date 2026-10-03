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

using facebook::react::Props;
using facebook::react::ScrollViewProps;
using facebook::react::ScrollViewShadowNode;

#if TARGET_OS_IOS

static Props::Shared makeScrollViewProps(bool automaticallyAdjustKeyboardInsets)
{
  auto props = std::make_shared<ScrollViewProps>();
  props->automaticallyAdjustKeyboardInsets = automaticallyAdjustKeyboardInsets;
  return props;
}

@interface RCTScrollViewComponentView (Tests)
- (void)_keyboardWillChangeFrame:(NSNotification *)notification;
- (void)_prepareForMaintainVisibleScrollPosition;
- (void)_adjustForMaintainVisibleContentPosition;
@end

@interface RCTScrollViewComponentViewTests : XCTestCase
@end

@implementation RCTScrollViewComponentViewTests

- (void)testMaintainVisibleContentPositionAfterVerticalShrink
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  auto props = std::make_shared<ScrollViewProps>();
  props->maintainVisibleContentPosition = facebook::react::ScrollViewMaintainVisibleContentPosition{};
  [view updateProps:props oldProps:ScrollViewShadowNode::defaultSharedProps()];

  RCTViewComponentView *contentView = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 1000)];
  [view mountChildComponentView:contentView index:0];
  UIView *anchor = [[UIView alloc] initWithFrame:CGRectMake(0, 800, 100, 40)];
  anchor.tag = 42;
  [contentView addSubview:anchor];

  view.scrollView.contentSize = CGSizeMake(100, 1000);
  view.scrollView.contentOffset = CGPointMake(0, 800);
  [view _prepareForMaintainVisibleScrollPosition];

  anchor.frame = CGRectMake(0, 300, 100, 40);
  view.scrollView.contentSize = CGSizeMake(100, 400);
  view.scrollView.contentOffset = CGPointZero;
  [view _adjustForMaintainVisibleContentPosition];

  XCTAssertEqualWithAccuracy(view.scrollView.contentOffset.y, 300, 0.5);
}

- (void)testMaintainVisibleContentPositionAfterHorizontalShrink
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  auto props = std::make_shared<ScrollViewProps>();
  props->maintainVisibleContentPosition = facebook::react::ScrollViewMaintainVisibleContentPosition{};
  [view updateProps:props oldProps:ScrollViewShadowNode::defaultSharedProps()];

  RCTViewComponentView *contentView = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 1000, 100)];
  [view mountChildComponentView:contentView index:0];
  UIView *anchor = [[UIView alloc] initWithFrame:CGRectMake(800, 0, 40, 100)];
  anchor.tag = 42;
  [contentView addSubview:anchor];

  view.scrollView.contentSize = CGSizeMake(1000, 100);
  view.scrollView.contentOffset = CGPointMake(800, 0);
  [view _prepareForMaintainVisibleScrollPosition];

  anchor.frame = CGRectMake(300, 0, 40, 100);
  view.scrollView.contentSize = CGSizeMake(400, 100);
  view.scrollView.contentOffset = CGPointZero;
  [view _adjustForMaintainVisibleContentPosition];

  XCTAssertEqualWithAccuracy(view.scrollView.contentOffset.x, 300, 0.5);
}

- (void)testMaintainVisibleContentPositionClampsVerticalOffsetAfterShrink
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  auto props = std::make_shared<ScrollViewProps>();
  props->maintainVisibleContentPosition = facebook::react::ScrollViewMaintainVisibleContentPosition{};
  [view updateProps:props oldProps:ScrollViewShadowNode::defaultSharedProps()];

  RCTViewComponentView *contentView = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 1000)];
  [view mountChildComponentView:contentView index:0];
  UIView *anchor = [[UIView alloc] initWithFrame:CGRectMake(0, 800, 100, 40)];
  anchor.tag = 42;
  [contentView addSubview:anchor];

  view.scrollView.contentSize = CGSizeMake(100, 1000);
  view.scrollView.contentOffset = CGPointMake(0, 800);
  [view _prepareForMaintainVisibleScrollPosition];

  // The unclamped target (350) is past the max offset of 400 - 100 = 300.
  anchor.frame = CGRectMake(0, 350, 100, 40);
  view.scrollView.contentSize = CGSizeMake(100, 400);
  view.scrollView.contentOffset = CGPointZero;
  [view _adjustForMaintainVisibleContentPosition];

  XCTAssertEqualWithAccuracy(view.scrollView.contentOffset.y, 300, 0.5);
}

- (void)testMaintainVisibleContentPositionClampsHorizontalOffsetAfterShrink
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  auto props = std::make_shared<ScrollViewProps>();
  props->maintainVisibleContentPosition = facebook::react::ScrollViewMaintainVisibleContentPosition{};
  [view updateProps:props oldProps:ScrollViewShadowNode::defaultSharedProps()];

  RCTViewComponentView *contentView = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 1000, 100)];
  [view mountChildComponentView:contentView index:0];
  UIView *anchor = [[UIView alloc] initWithFrame:CGRectMake(800, 0, 40, 100)];
  anchor.tag = 42;
  [contentView addSubview:anchor];

  view.scrollView.contentSize = CGSizeMake(1000, 100);
  view.scrollView.contentOffset = CGPointMake(800, 0);
  [view _prepareForMaintainVisibleScrollPosition];

  // The unclamped target (350) is past the max offset of 400 - 100 = 300.
  anchor.frame = CGRectMake(350, 0, 40, 100);
  view.scrollView.contentSize = CGSizeMake(400, 100);
  view.scrollView.contentOffset = CGPointZero;
  [view _adjustForMaintainVisibleContentPosition];

  XCTAssertEqualWithAccuracy(view.scrollView.contentOffset.x, 300, 0.5);
}

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

  [view prepareForRecycle];
  UIEdgeInsets insetsAfterRecycle = view.scrollView.contentInset;
  [view _keyboardWillChangeFrame:notification];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.scrollView.contentInset, insetsAfterRecycle));

  [view updateProps:props oldProps:nullptr];
  [view _keyboardWillChangeFrame:notification];
  XCTAssertEqual(view.scrollView.contentInset.bottom, 50);
}

@end

#endif
