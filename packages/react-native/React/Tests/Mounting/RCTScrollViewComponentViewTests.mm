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
#import <react/renderer/components/view/ViewProps.h>
#import <react/renderer/components/view/ViewShadowNode.h>

using facebook::react::Props;
using facebook::react::ScrollViewProps;
using facebook::react::ScrollViewShadowNode;
using facebook::react::ViewProps;
using facebook::react::ViewShadowNode;

#if TARGET_OS_IOS

static Props::Shared makeScrollViewProps(bool automaticallyAdjustKeyboardInsets)
{
  auto props = std::make_shared<ScrollViewProps>();
  props->automaticallyAdjustKeyboardInsets = automaticallyAdjustKeyboardInsets;
  return props;
}

// A content view with `removeClippedSubviews` on, taller than the ScrollViews in these tests.
static RCTViewComponentView *makeClippingContentView()
{
  RCTViewComponentView *contentView = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 2000)];
  auto props = std::make_shared<ViewProps>();
  props->removeClippedSubviews = true;
  [contentView updateProps:props oldProps:ViewShadowNode::defaultSharedProps()];
  return contentView;
}

@interface RCTScrollViewComponentView (Tests)
- (void)_keyboardWillChangeFrame:(NSNotification *)notification;
- (void)_remountChildren;
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

#pragma mark - Clipped subviews

- (void)testClippedSubviewsAreUpdatedInsideWindow
{
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  RCTScrollViewComponentView *scrollView = [[RCTScrollViewComponentView alloc] initWithFrame:window.bounds];
  [window addSubview:scrollView];

  RCTViewComponentView *contentView = makeClippingContentView();
  UIView *visibleRow = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  UIView *offscreenRow = [[UIView alloc] initWithFrame:CGRectMake(0, 1500, 100, 100)];
  [contentView mountChildComponentView:(id)visibleRow index:0];
  [contentView mountChildComponentView:(id)offscreenRow index:1];
  [scrollView mountChildComponentView:contentView index:0];

  [scrollView _remountChildren];
  XCTAssertEqual(visibleRow.superview, contentView);
  XCTAssertNil(offscreenRow.superview);
}

- (void)testClippedSubviewsAreUpdatedOnceScrollViewMovesToWindow
{
  RCTScrollViewComponentView *scrollView =
      [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  RCTViewComponentView *contentView = makeClippingContentView();
  UIView *visibleRow = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  UIView *offscreenRow = [[UIView alloc] initWithFrame:CGRectMake(0, 1500, 100, 100)];
  [contentView mountChildComponentView:(id)visibleRow index:0];
  [contentView mountChildComponentView:(id)offscreenRow index:1];
  [scrollView mountChildComponentView:contentView index:0];

  // Outside a window nothing is displayed, so the rows stay as they are.
  [scrollView _remountChildren];
  XCTAssertNil(visibleRow.superview);

  // The update happens when the ScrollView is laid out in a window.
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  [window addSubview:scrollView];
  [window layoutIfNeeded];
  XCTAssertEqual(visibleRow.superview, contentView);
  XCTAssertNil(offscreenRow.superview);
}

@end

#endif
