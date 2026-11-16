/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEnhancedScrollView.h>
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
@end

@interface RCTInsetTestScrollView : RCTEnhancedScrollView
@property (nonatomic, assign) UIEdgeInsets simulatedSafeAreaInsets;
@property (nonatomic, assign) BOOL notifiesInsetChangesSynchronously;
@property (nonatomic, assign) BOOL keepsContentOffsetOnInsetChange;
@end

@implementation RCTInsetTestScrollView

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  CGPoint offset = self.contentOffset;
  [super setContentInset:contentInset];
  if (_keepsContentOffsetOnInsetChange) {
    self.contentOffset = offset;
  }
  if (_notifiesInsetChangesSynchronously) {
    [self adjustedContentInsetDidChange];
  }
}

- (UIEdgeInsets)adjustedContentInset
{
  UIEdgeInsets inset = self.contentInset;
  inset.top += _simulatedSafeAreaInsets.top;
  inset.left += _simulatedSafeAreaInsets.left;
  inset.bottom += _simulatedSafeAreaInsets.bottom;
  inset.right += _simulatedSafeAreaInsets.right;
  return inset;
}

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

// XCTest assertion macros use variadic reporting and catch framework exceptions by value.
// NOLINTBEGIN(cppcoreguidelines-pro-type-vararg, misc-throw-by-value-catch-by-reference)
- (void)testSafeAreaCorrectionPreservesPullToRefreshInset
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.padsContentForSafeArea = YES;
  view.contentInset = UIEdgeInsetsMake(60, 0, 0, 0);

  [view adjustedContentInsetDidChange];
  view.horizontal = NO;
  [view adjustedContentInsetDidChange];
  XCTAssertEqual(view.contentInset.top, 60);

  UIEdgeInsets inset = view.contentInset;
  inset.top -= 60;
  view.contentInset = inset;
  [view adjustedContentInsetDidChange];
  XCTAssertEqual(view.contentInset.top, 0);
}

- (void)testSafeAreaCorrectionPreservesKeyboardInset
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15, 0, 25);
  view.padsContentForSafeArea = YES;
  UIEdgeInsets inset = view.contentInset;
  inset.bottom += 300;
  view.contentInset = inset;

  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(10, 5, 330, 15)));
  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(10, 5, 330, 15)));
}

- (void)testSafeAreaChangesPreserveExternalInsets
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15, 0, 25);
  view.padsContentForSafeArea = YES;
  UIEdgeInsets inset = view.contentInset;
  inset.top += 60;
  inset.left += 7;
  view.contentInset = inset;

  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 25, 0, 35);
  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(70, 2, 30, 5)));

  view.padsContentForSafeArea = NO;
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(70, 27, 30, 40)));
}

- (void)testHorizontalSafeAreaCorrectionPreservesExternalInsets
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.horizontal = YES;
  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(5, 0, 15, 0);
  view.padsContentForSafeArea = YES;
  UIEdgeInsets inset = view.contentInset;
  inset.left += 60;
  view.contentInset = inset;

  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(5, 80, 15, 40)));

  view.horizontal = NO;
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(10, 80, 30, 40)));
}

- (void)testBaseInsetReplacementKeepsContentPinnedAcrossTheScrollAxis
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.keepsContentOffsetOnInsetChange = YES;
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15, 0, 25);
  view.padsContentForSafeArea = YES;
  view.contentOffset = CGPointZero;

  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  XCTAssertEqual(view.contentOffset.x, -20);

  view.contentOffset = CGPointMake(100, 0);
  view.baseContentInset = UIEdgeInsetsMake(20, 30, 40, 50);
  XCTAssertEqual(view.contentOffset.x, 100);
}

- (void)testSynchronousInsetCallbacksPreserveFractionalInsets
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.notifiesInsetChangesSynchronously = YES;
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15.5, 0, 25.25);
  view.padsContentForSafeArea = YES;
  view.contentInset = UIEdgeInsetsMake(60.5, -15.5, 0, -25.25);

  [view adjustedContentInsetDidChange];
  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(60.5, -15.5, 0, -25.25)));

  view.baseContentInset = UIEdgeInsetsZero;
  view.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  view.padsContentForSafeArea = NO;
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsZero));

  view.baseContentInset = UIEdgeInsetsMake(1.25, 2.5, 3.75, 4.5);
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(1.25, 2.5, 3.75, 4.5)));
}

- (void)testBaseContentInsetReplacesPreviousInsetWithoutAccumulatingSafeAreaCorrection
{
  RCTInsetTestScrollView *view = [RCTInsetTestScrollView new];
  view.simulatedSafeAreaInsets = UIEdgeInsetsMake(0, 15, 0, 25);
  view.padsContentForSafeArea = YES;
  view.baseContentInset = UIEdgeInsetsMake(10, 20, 30, 40);
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(10, 5, 30, 15)));

  view.baseContentInset = UIEdgeInsetsMake(20, 30, 40, 50);
  [view adjustedContentInsetDidChange];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.contentInset, UIEdgeInsetsMake(20, 15, 40, 25)));
}
// NOLINTEND(cppcoreguidelines-pro-type-vararg, misc-throw-by-value-catch-by-reference)

@end

#endif
