/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTScrollViewComponentView.h>
#import <React/RCTViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/scrollview/ScrollViewProps.h>
#import <react/renderer/components/scrollview/ScrollViewShadowNode.h>

using facebook::react::Props;
using facebook::react::ScrollViewMaintainVisibleContentPosition;
using facebook::react::ScrollViewProps;
using facebook::react::ScrollViewShadowNode;

#if TARGET_OS_IOS

static Props::Shared makeScrollViewProps(bool automaticallyAdjustKeyboardInsets)
{
  auto props = std::make_shared<ScrollViewProps>();
  props->automaticallyAdjustKeyboardInsets = automaticallyAdjustKeyboardInsets;
  return props;
}

static UIView *makeContentSubview(NSInteger tag, CGFloat y, CGFloat height)
{
  UIView *subview = [[UIView alloc] initWithFrame:CGRectMake(0, y, 100, height)];
  subview.tag = tag;
  return subview;
}

// A 100pt tall scroll view with maintainVisibleContentPosition, scrolled to y=450, whose first subview (0-500)
// straddles the top edge and whose second subview (500-600) starts inside the viewport.
static RCTScrollViewComponentView *makeScrollViewWithStraddlingAnchor(UIView *straddling, UIView *next)
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  auto props = std::make_shared<ScrollViewProps>();
  props->maintainVisibleContentPosition = ScrollViewMaintainVisibleContentPosition{};
  [view updateProps:props oldProps:ScrollViewShadowNode::defaultSharedProps()];

  RCTViewComponentView *contentView = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 1000)];
  [view mountChildComponentView:contentView index:0];
  [contentView addSubview:straddling];
  [contentView addSubview:next];
  view.scrollView.contentSize = CGSizeMake(100, 1000);
  view.scrollView.contentOffset = CGPointMake(0, 450);
  return view;
}

@interface RCTScrollViewComponentView (Tests)
- (void)_keyboardWillChangeFrame:(NSNotification *)notification;
- (void)_prepareForMaintainVisibleScrollPosition;
- (void)_adjustForMaintainVisibleContentPosition;
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

  [view prepareForRecycle];
  UIEdgeInsets insetsAfterRecycle = view.scrollView.contentInset;
  [view _keyboardWillChangeFrame:notification];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.scrollView.contentInset, insetsAfterRecycle));

  [view updateProps:props oldProps:nullptr];
  [view _keyboardWillChangeFrame:notification];
  XCTAssertEqual(view.scrollView.contentInset.bottom, 50);
}

- (void)testMaintainVisibleContentPositionWhenStraddlingAnchorIsResized
{
  // Like a VirtualizedList spacer re-estimated after a prepend: it keeps its origin while the row after it moves.
  UIView *spacer = makeContentSubview(1, 0, 500);
  UIView *row = makeContentSubview(2, 500, 100);
  RCTScrollViewComponentView *view = makeScrollViewWithStraddlingAnchor(spacer, row);

  [view _prepareForMaintainVisibleScrollPosition];
  spacer.frame = CGRectMake(0, 0, 100, 200);
  row.frame = CGRectMake(0, 200, 100, 100);
  [view _adjustForMaintainVisibleContentPosition];

  XCTAssertEqual(view.scrollView.contentOffset.y, 150);
}

- (void)testMaintainVisibleContentPositionWhenStraddlingAnchorIsRemoved
{
  UIView *straddling = makeContentSubview(1, 0, 500);
  UIView *row = makeContentSubview(2, 500, 100);
  RCTScrollViewComponentView *view = makeScrollViewWithStraddlingAnchor(straddling, row);

  [view _prepareForMaintainVisibleScrollPosition];
  // Unmounting enqueues the view for recycling, which resets its tag.
  [straddling removeFromSuperview];
  straddling.tag = 0;
  row.frame = CGRectMake(0, 200, 100, 100);
  [view _adjustForMaintainVisibleContentPosition];

  XCTAssertEqual(view.scrollView.contentOffset.y, 150);
}

- (void)testMaintainVisibleContentPositionWhenContentIsInsertedBelowStraddlingAnchor
{
  // Rows inserted below a view that straddles the top edge. It keeps its size, so it stays the anchor (#43203).
  UIView *straddling = makeContentSubview(1, 0, 500);
  UIView *row = makeContentSubview(2, 500, 100);
  RCTScrollViewComponentView *view = makeScrollViewWithStraddlingAnchor(straddling, row);

  [view _prepareForMaintainVisibleScrollPosition];
  row.frame = CGRectMake(0, 600, 100, 100);
  [view _adjustForMaintainVisibleContentPosition];

  XCTAssertEqual(view.scrollView.contentOffset.y, 450);
}

@end

#endif
