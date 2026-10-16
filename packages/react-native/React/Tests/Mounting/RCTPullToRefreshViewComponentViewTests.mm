/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTPullToRefreshViewComponentView.h>
#import <React/RCTScrollViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>
#import <react/renderer/graphics/Color.h>

using namespace facebook::react;

#if TARGET_OS_IOS

@interface RCTPullToRefreshViewComponentViewTests : XCTestCase
@end

@implementation RCTPullToRefreshViewComponentViewTests

- (void)testBackgroundColorIsForwardedUpdatedAndRemoved
{
  RCTScrollViewComponentView *scrollView = [RCTScrollViewComponentView new];
  RCTPullToRefreshViewComponentView *component = [RCTPullToRefreshViewComponentView new];
  [scrollView addSubview:component];

  auto props = std::make_shared<PullToRefreshViewProps>();
  props->backgroundColor = colorFromRGBA(255, 0, 0, 255);
  [component updateProps:props oldProps:nullptr];
  XCTAssertEqualObjects(scrollView.scrollView.refreshControl.backgroundColor, UIColor.redColor);

  auto updatedProps = std::make_shared<PullToRefreshViewProps>(*props);
  updatedProps->backgroundColor = colorFromRGBA(0, 0, 255, 255);
  [component updateProps:updatedProps oldProps:props];
  XCTAssertEqualObjects(scrollView.scrollView.refreshControl.backgroundColor, UIColor.blueColor);

  auto defaultProps = std::make_shared<PullToRefreshViewProps>();
  [component updateProps:defaultProps oldProps:updatedProps];
  XCTAssertNil(scrollView.scrollView.refreshControl.backgroundColor);
}

- (void)testExplicitAppearanceIsRestoredWhenReturningToWindow
{
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  RCTScrollViewComponentView *scrollView = [RCTScrollViewComponentView new];
  RCTPullToRefreshViewComponentView *component = [RCTPullToRefreshViewComponentView new];
  auto props = std::make_shared<PullToRefreshViewProps>();
  props->backgroundColor = colorFromRGBA(255, 0, 0, 255);
  props->tintColor = colorFromRGBA(0, 0, 255, 255);
  props->title = "React title";
  props->titleColor = colorFromRGBA(0, 255, 0, 255);
  [component updateProps:props oldProps:nullptr];
  [scrollView addSubview:component];
  [window addSubview:scrollView];
  UIRefreshControl *control = scrollView.scrollView.refreshControl;

  [scrollView removeFromSuperview];
  // Simulate native appearance changes without leaking a global UIAppearance
  // proxy into other tests. Reattaching must restore the unchanged React props.
  control.backgroundColor = UIColor.blackColor;
  control.tintColor = UIColor.blackColor;
  control.attributedTitle =
      [[NSAttributedString alloc] initWithString:@"Native title"
                                      attributes:@{NSForegroundColorAttributeName : UIColor.blackColor}];
  [window addSubview:scrollView];

  XCTAssertEqual(control, scrollView.scrollView.refreshControl);
  XCTAssertEqualObjects(control.backgroundColor, UIColor.redColor);
  XCTAssertEqualObjects(control.tintColor, UIColor.blueColor);
  XCTAssertEqualObjects(control.attributedTitle.string, @"React title");
  XCTAssertEqualObjects(
      [control.attributedTitle attribute:NSForegroundColorAttributeName atIndex:0 effectiveRange:nil],
      UIColor.greenColor);
}

- (void)testUnspecifiedAppearanceIsNotOverriddenWhenReturningToWindow
{
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  RCTScrollViewComponentView *scrollView = [RCTScrollViewComponentView new];
  RCTPullToRefreshViewComponentView *component = [RCTPullToRefreshViewComponentView new];
  [scrollView addSubview:component];
  UIRefreshControl *control = scrollView.scrollView.refreshControl;
  control.backgroundColor = UIColor.redColor;
  control.tintColor = UIColor.blueColor;
  control.attributedTitle = [[NSAttributedString alloc] initWithString:@"Native default"];
  [window addSubview:scrollView];

  XCTAssertEqualObjects(control.backgroundColor, UIColor.redColor);
  XCTAssertEqualObjects(control.tintColor, UIColor.blueColor);
  XCTAssertEqualObjects(control.attributedTitle.string, @"Native default");
}

- (void)testBackgroundColorIsReappliedAfterRecycling
{
  RCTScrollViewComponentView *scrollView = [RCTScrollViewComponentView new];
  RCTPullToRefreshViewComponentView *component = [RCTPullToRefreshViewComponentView new];
  auto props = std::make_shared<PullToRefreshViewProps>();
  props->backgroundColor = colorFromRGBA(255, 0, 0, 255);
  [component updateProps:props oldProps:nullptr];
  [scrollView addSubview:component];
  UIRefreshControl *original = scrollView.scrollView.refreshControl;
  [component removeFromSuperview];
  [component prepareForRecycle];
  [component updateProps:props oldProps:nullptr];
  [scrollView addSubview:component];

  XCTAssertNotEqual(original, scrollView.scrollView.refreshControl);
  XCTAssertEqualObjects(scrollView.scrollView.refreshControl.backgroundColor, UIColor.redColor);
}

@end

#endif
