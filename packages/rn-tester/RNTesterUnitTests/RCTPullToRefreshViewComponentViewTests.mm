/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTPullToRefreshViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>
#import <react/renderer/components/FBReactNativeSpec/ShadowNodes.h>
#import <react/renderer/graphics/Color.h>

using namespace facebook::react;

#if !TARGET_OS_TV

static Props::Shared makePullToRefreshViewProps()
{
  auto props = std::make_shared<PullToRefreshViewProps>();
  props->tintColor = colorFromRGBA(255, 255, 255, 255);
  props->title = "Refreshing";
  props->titleColor = colorFromRGBA(0, 255, 0, 255);
  return props;
}

static void assertColorEquals(UIColor *color, CGFloat red, CGFloat green, CGFloat blue, CGFloat alpha)
{
  CGFloat actualRed;
  CGFloat actualGreen;
  CGFloat actualBlue;
  CGFloat actualAlpha;

  XCTAssertTrue([color getRed:&actualRed green:&actualGreen blue:&actualBlue alpha:&actualAlpha]);
  XCTAssertEqualWithAccuracy(actualRed, red, 0.001);
  XCTAssertEqualWithAccuracy(actualGreen, green, 0.001);
  XCTAssertEqualWithAccuracy(actualBlue, blue, 0.001);
  XCTAssertEqualWithAccuracy(actualAlpha, alpha, 0.001);
}

@interface RCTPullToRefreshViewComponentViewTests : XCTestCase
@end

@implementation RCTPullToRefreshViewComponentViewTests

- (void)testUpdatePropsUsesOldPropsWhenReapplyingStoredProps
{
  RCTPullToRefreshViewComponentView *view = [RCTPullToRefreshViewComponentView new];
  UIRefreshControl *refreshControl = [view valueForKey:@"_refreshControl"];
  auto props = makePullToRefreshViewProps();

  [view updateProps:props oldProps:nullptr];

  refreshControl.tintColor = nil;
  refreshControl.attributedTitle = nil;

  [view updateProps:props oldProps:PullToRefreshViewShadowNode::defaultSharedProps()];

  assertColorEquals(refreshControl.tintColor, 1, 1, 1, 1);
  XCTAssertEqualObjects(refreshControl.attributedTitle.string, @"Refreshing");
  UIColor *titleColor = [refreshControl.attributedTitle attribute:NSForegroundColorAttributeName
                                                         atIndex:0
                                                  effectiveRange:nil];
  assertColorEquals(titleColor, 0, 1, 0, 1);
}

@end

#endif
