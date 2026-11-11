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
#import <react/renderer/core/LayoutMetrics.h>
#import <react/renderer/core/PropsParserContext.h>
#import <react/renderer/core/RawProps.h>
#import <react/renderer/core/RawPropsParser.h>
#import <react/utils/ContextContainer.h>

using facebook::react::ContextContainer;
using facebook::react::EmptyLayoutMetrics;
using facebook::react::LayoutMetrics;
using facebook::react::Props;
using facebook::react::PropsParserContext;
using facebook::react::RawProps;
using facebook::react::RawPropsParser;
using facebook::react::ScrollViewProps;
using facebook::react::ScrollViewShadowNode;

#if TARGET_OS_IOS

static Props::Shared makeScrollViewProps(bool automaticallyAdjustKeyboardInsets)
{
  auto props = std::make_shared<ScrollViewProps>();
  props->automaticallyAdjustKeyboardInsets = automaticallyAdjustKeyboardInsets;
  return props;
}

static Props::Shared makeFadingEdgeProps(folly::dynamic fadingEdgeLength, bool horizontal = false)
{
  auto props = std::make_shared<ScrollViewProps>();
  props->fadingEdgeLength = std::move(fadingEdgeLength);
  props->horizontal = horizontal;
  return props;
}

static Props::Shared parseScrollViewProps(const folly::dynamic &rawValue, const ScrollViewProps &sourceProps)
{
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};
  auto rawProps = RawProps(rawValue);
  auto parser = RawPropsParser();
  parser.prepare<ScrollViewProps>();
  rawProps.parse(parser);
  return std::make_shared<const ScrollViewProps>(parserContext, sourceProps, rawProps);
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

  [view prepareForRecycle];
  UIEdgeInsets insetsAfterRecycle = view.scrollView.contentInset;
  [view _keyboardWillChangeFrame:notification];
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(view.scrollView.contentInset, insetsAfterRecycle));

  [view updateProps:props oldProps:nullptr];
  [view _keyboardWillChangeFrame:notification];
  XCTAssertEqual(view.scrollView.contentInset.bottom, 50);
}

- (CAGradientLayer *)fadingEdgeMaskOf:(RCTScrollViewComponentView *)view
{
  CALayer *mask = view.scrollView.layer.mask;
  XCTAssertTrue([mask isKindOfClass:[CAGradientLayer class]]);
  return (CAGradientLayer *)mask;
}

- (void)assertLocations:(NSArray<NSNumber *> *)locations equal:(NSArray<NSNumber *> *)expected
{
  XCTAssertEqual(locations.count, expected.count);
  for (NSUInteger index = 0; index < MIN(locations.count, expected.count); index++) {
    XCTAssertEqualWithAccuracy(locations[index].doubleValue, expected[index].doubleValue, 1e-6);
  }
}

- (void)testFadingEdgeLengthFadesEachEdgeOverItsOwnLength
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 200)];
  [view updateProps:makeFadingEdgeProps(folly::dynamic::object("start", 20)("end", 40))
           oldProps:ScrollViewShadowNode::defaultSharedProps()];

  CAGradientLayer *mask = [self fadingEdgeMaskOf:view];
  XCTAssertTrue(CGPointEqualToPoint(mask.startPoint, CGPointMake(0.5, 0)));
  XCTAssertTrue(CGPointEqualToPoint(mask.endPoint, CGPointMake(0.5, 1)));
  [self assertLocations:mask.locations equal:@[ @0, @0.1, @0.8, @1 ]];
  XCTAssertTrue(CGRectEqualToRect(mask.frame, view.scrollView.bounds));
}

- (void)testFadingEdgeLengthNumberFadesBothEdges
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 200)];
  [view updateProps:makeFadingEdgeProps(30) oldProps:ScrollViewShadowNode::defaultSharedProps()];

  [self assertLocations:[self fadingEdgeMaskOf:view].locations equal:@[ @0, @0.15, @0.85, @1 ]];
}

- (void)testHorizontalFadingEdgeLengthFadesAlongTheWidth
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 200)];
  [view updateProps:makeFadingEdgeProps(folly::dynamic::object("start", 20)("end", 0), true)
           oldProps:ScrollViewShadowNode::defaultSharedProps()];

  CAGradientLayer *mask = [self fadingEdgeMaskOf:view];
  XCTAssertTrue(CGPointEqualToPoint(mask.startPoint, CGPointMake(0, 0.5)));
  XCTAssertTrue(CGPointEqualToPoint(mask.endPoint, CGPointMake(1, 0.5)));
  [self assertLocations:mask.locations equal:@[ @0, @0.2, @1, @1 ]];
}

- (void)testParsedFadingEdgeFollowsTheAxisWhenHorizontalIsRemoved
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 200)];
  auto horizontalProps =
      parseScrollViewProps(folly::dynamic::object("fadingEdgeLength", 20)("horizontal", true), ScrollViewProps{});
  [view updateProps:horizontalProps oldProps:ScrollViewShadowNode::defaultSharedProps()];
  XCTAssertTrue(CGPointEqualToPoint([self fadingEdgeMaskOf:view].startPoint, CGPointMake(0, 0.5)));

  auto verticalProps = parseScrollViewProps(
      folly::dynamic::object("horizontal", nullptr), static_cast<const ScrollViewProps &>(*horizontalProps));
  [view updateProps:verticalProps oldProps:horizontalProps];

  CAGradientLayer *mask = [self fadingEdgeMaskOf:view];
  XCTAssertTrue(CGPointEqualToPoint(mask.startPoint, CGPointMake(0.5, 0)));
  XCTAssertTrue(CGPointEqualToPoint(mask.endPoint, CGPointMake(0.5, 1)));
  [self assertLocations:mask.locations equal:@[ @0, @0.1, @0.9, @1 ]];
}

- (void)testFadingEdgesNeverOverlap
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 200)];
  [view updateProps:makeFadingEdgeProps(folly::dynamic::object("start", 300)("end", 150))
           oldProps:ScrollViewShadowNode::defaultSharedProps()];

  [self assertLocations:[self fadingEdgeMaskOf:view].locations equal:@[ @0, @0.5, @0.75, @1 ]];
}

- (void)testZeroFadingEdgeLengthRemovesTheMask
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 200)];
  [view updateProps:makeFadingEdgeProps(40) oldProps:ScrollViewShadowNode::defaultSharedProps()];
  XCTAssertNotNil(view.scrollView.layer.mask);

  [view updateProps:makeFadingEdgeProps(0) oldProps:nullptr];
  XCTAssertNil(view.scrollView.layer.mask);
}

- (void)testFadingEdgeMaskFollowsTheContentOffset
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 200)];
  [view updateProps:makeFadingEdgeProps(40) oldProps:ScrollViewShadowNode::defaultSharedProps()];

  view.scrollView.contentSize = CGSizeMake(100, 1000);
  view.scrollView.contentOffset = CGPointMake(0, 300);

  XCTAssertTrue(CGRectEqualToRect([self fadingEdgeMaskOf:view].frame, CGRectMake(0, 300, 100, 200)));
}

- (void)testFadingEdgeMaskFollowsTheScrollViewSize
{
  RCTScrollViewComponentView *view = [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 200)];
  [view updateProps:makeFadingEdgeProps(40) oldProps:ScrollViewShadowNode::defaultSharedProps()];
  [self assertLocations:[self fadingEdgeMaskOf:view].locations equal:@[ @0, @0.2, @0.8, @1 ]];

  LayoutMetrics layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.size = {100, 400};
  [view updateLayoutMetrics:layoutMetrics oldLayoutMetrics:EmptyLayoutMetrics];

  [self assertLocations:[self fadingEdgeMaskOf:view].locations equal:@[ @0, @0.1, @0.9, @1 ]];
}

@end

#endif
