/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTEnhancedScrollView.h>
#import <React/RCTScrollViewComponentView.h>

@interface RCTScrollViewComponentView (Tests)

- (void)scrollToEnd:(BOOL)animated;

@end

@interface RCTAdjustedContentInsetScrollView : RCTEnhancedScrollView

@property (nonatomic, assign) UIEdgeInsets testAdjustedContentInset;

@end

@implementation RCTAdjustedContentInsetScrollView

- (UIEdgeInsets)adjustedContentInset
{
  return self.testAdjustedContentInset;
}

@end

@interface RCTScrollViewComponentViewTests : XCTestCase

@end

@implementation RCTScrollViewComponentViewTests

- (void)testScrollToEndIncludesAdjustedContentInset
{
  RCTScrollViewComponentView *componentView =
      [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  RCTAdjustedContentInsetScrollView *scrollView =
      [[RCTAdjustedContentInsetScrollView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  scrollView.contentSize = CGSizeMake(100, 200);
  scrollView.contentInset = UIEdgeInsetsZero;
  scrollView.testAdjustedContentInset = UIEdgeInsetsMake(0, 0, 20, 0);
  componentView.scrollView = scrollView;

  [componentView scrollToEnd:NO];

  XCTAssertEqualWithAccuracy(componentView.scrollView.contentOffset.y, 120, 0.01);
}

@end
