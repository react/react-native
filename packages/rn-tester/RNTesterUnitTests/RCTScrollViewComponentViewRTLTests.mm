/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTScrollViewComponentView.h>
#import <react/renderer/components/scrollview/ScrollViewEventEmitter.h>
#import <react/renderer/components/scrollview/ScrollViewProps.h>

using namespace facebook::react;

@interface RCTScrollViewComponentView (RCTScrollViewComponentViewRTLTests)
- (ScrollViewEventEmitter::Metrics)_scrollViewMetrics;
@end

static const CGSize kViewSize = {300, 60};
static const CGSize kContentSize = {900, 60};

static Props::Shared scrollViewProps(bool horizontal)
{
  auto props = std::make_shared<ScrollViewProps>();
  props->horizontal = horizontal;
  return props;
}

static LayoutMetrics layoutMetrics(LayoutDirection direction)
{
  LayoutMetrics metrics;
  metrics.frame = facebook::react::Rect{
      facebook::react::Point{0, 0}, facebook::react::Size{kViewSize.width, kViewSize.height}};
  metrics.layoutDirection = direction;
  return metrics;
}

@interface RCTScrollViewComponentViewRTLTests : XCTestCase
@end

@implementation RCTScrollViewComponentViewRTLTests

- (RCTScrollViewComponentView *)scrollViewWithHorizontal:(bool)horizontal direction:(LayoutDirection)direction
{
  RCTScrollViewComponentView *view =
      [[RCTScrollViewComponentView alloc] initWithFrame:CGRect{CGPointZero, kViewSize}];
  [view updateProps:scrollViewProps(horizontal) oldProps:view.props];
  [view updateLayoutMetrics:layoutMetrics(direction) oldLayoutMetrics:EmptyLayoutMetrics];
  [self setContentSize:kContentSize ofView:view];
  return view;
}

- (void)setContentSize:(CGSize)contentSize ofView:(RCTScrollViewComponentView *)view
{
  // The content size normally comes from the ScrollView state.
  [view setValue:[NSValue valueWithCGSize:contentSize] forKey:@"contentSize"];
  view.scrollView.contentSize = contentSize;
}

- (void)assertMirrored:(RCTScrollViewComponentView *)view
{
  XCTAssertTrue(CGAffineTransformEqualToTransform(view.scrollView.transform, CGAffineTransformMakeScale(-1, 1)));
  XCTAssertTrue(CGAffineTransformEqualToTransform(view.containerView.transform, CGAffineTransformMakeScale(-1, 1)));
  XCTAssertEqual(view.scrollView.semanticContentAttribute, UISemanticContentAttributeForceLeftToRight);
}

- (void)assertNotMirroredWithRTLSemantics:(RCTScrollViewComponentView *)view
{
  XCTAssertTrue(CGAffineTransformIsIdentity(view.scrollView.transform));
  XCTAssertTrue(CGAffineTransformIsIdentity(view.containerView.transform));
  XCTAssertEqual(view.scrollView.semanticContentAttribute, UISemanticContentAttributeForceRightToLeft);
}

- (void)testRTLHorizontalScrollViewIsMirrored
{
  [self assertMirrored:[self scrollViewWithHorizontal:true direction:LayoutDirection::RightToLeft]];
}

- (void)testRTLVerticalScrollViewIsNotMirroredAndHasRTLSemantics
{
  [self assertNotMirroredWithRTLSemantics:[self scrollViewWithHorizontal:false direction:LayoutDirection::RightToLeft]];
}

- (void)testLTRScrollViewsAreNotMirrored
{
  for (bool horizontal : {true, false}) {
    RCTScrollViewComponentView *view = [self scrollViewWithHorizontal:horizontal
                                                            direction:LayoutDirection::LeftToRight];
    XCTAssertTrue(CGAffineTransformIsIdentity(view.scrollView.transform));
    XCTAssertEqual(view.scrollView.semanticContentAttribute, UISemanticContentAttributeForceLeftToRight);
  }
}

- (void)testRTLHorizontalScrollToRoundTrips
{
  RCTScrollViewComponentView *view = [self scrollViewWithHorizontal:true direction:LayoutDirection::RightToLeft];

  [view scrollToOffset:CGPointMake(0, 0) animated:NO];
  // x = 0 is the right edge of the mirrored content.
  XCTAssertEqual(view.scrollView.contentOffset.x, kContentSize.width - kViewSize.width);
  XCTAssertEqual([view _scrollViewMetrics].contentOffset.x, 0);

  [view scrollToOffset:CGPointMake(200, 0) animated:NO];
  XCTAssertEqual(view.scrollView.contentOffset.x, kContentSize.width - kViewSize.width - 200);
  XCTAssertEqual([view _scrollViewMetrics].contentOffset.x, 200);
}

- (void)testRTLVerticalScrollToRoundTrips
{
  RCTScrollViewComponentView *view = [self scrollViewWithHorizontal:false direction:LayoutDirection::RightToLeft];

  [view scrollToOffset:CGPointMake(200, 0) animated:NO];
  XCTAssertEqual(view.scrollView.contentOffset.x, 200);
  XCTAssertEqual([view _scrollViewMetrics].contentOffset.x, 200);

  [view scrollToOffset:CGPointMake(0, 0) animated:NO];
  XCTAssertEqual(view.scrollView.contentOffset.x, 0);
  XCTAssertEqual([view _scrollViewMetrics].contentOffset.x, 0);
}

- (void)testRecycledScrollViewFollowsChangedHorizontal
{
  RCTScrollViewComponentView *view = [self scrollViewWithHorizontal:true direction:LayoutDirection::RightToLeft];
  [self assertMirrored:view];

  [view prepareForRecycle];
  [view updateProps:scrollViewProps(false) oldProps:view.props];
  [view updateLayoutMetrics:layoutMetrics(LayoutDirection::RightToLeft) oldLayoutMetrics:EmptyLayoutMetrics];
  [self setContentSize:kContentSize ofView:view];
  [self assertNotMirroredWithRTLSemantics:view];
  [view scrollToOffset:CGPointMake(200, 0) animated:NO];
  XCTAssertEqual([view _scrollViewMetrics].contentOffset.x, 200);

  [view prepareForRecycle];
  [view updateProps:scrollViewProps(false) oldProps:view.props];
  [view updateLayoutMetrics:layoutMetrics(LayoutDirection::LeftToRight) oldLayoutMetrics:EmptyLayoutMetrics];
  XCTAssertTrue(CGAffineTransformIsIdentity(view.scrollView.transform));
  XCTAssertEqual(view.scrollView.semanticContentAttribute, UISemanticContentAttributeForceLeftToRight);

  [view prepareForRecycle];
  [view updateProps:scrollViewProps(true) oldProps:view.props];
  [view updateLayoutMetrics:layoutMetrics(LayoutDirection::RightToLeft) oldLayoutMetrics:EmptyLayoutMetrics];
  [self setContentSize:kContentSize ofView:view];
  [self assertMirrored:view];
  [view scrollToOffset:CGPointMake(200, 0) animated:NO];
  XCTAssertEqual(view.scrollView.contentOffset.x, kContentSize.width - kViewSize.width - 200);
  XCTAssertEqual([view _scrollViewMetrics].contentOffset.x, 200);
}

@end
