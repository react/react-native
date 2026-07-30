/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/view/ViewProps.h>
#import <react/renderer/components/view/ViewShadowNode.h>

using namespace facebook::react;

static Props::Shared makeViewProps(bool removeClippedSubviews)
{
  auto props = std::make_shared<ViewProps>();
  props->removeClippedSubviews = removeClippedSubviews;
  return props;
}

@interface RCTViewComponentViewTests : XCTestCase
@end

@implementation RCTViewComponentViewTests

#pragma mark - removeClippedSubviews toggle

- (void)testToggleRemoveClippedSubviewsOffRemountsClippedChildren
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  UIView *child1 = [UIView new];
  child1.frame = CGRectMake(0, 0, 50, 50);
  UIView *child2 = [UIView new];
  child2.frame = CGRectMake(0, 200, 50, 50);
  UIView *child3 = [UIView new];
  child3.frame = CGRectMake(0, 400, 50, 50);

  // Mount children normally
  [parent mountChildComponentView:(id)child1 index:0];
  [parent mountChildComponentView:(id)child2 index:1];
  [parent mountChildComponentView:(id)child3 index:2];

  XCTAssertEqual(parent.subviews.count, 3u);

  // Toggle removeClippedSubviews ON via props
  auto propsOn = makeViewProps(true);
  [parent updateProps:propsOn oldProps:ViewShadowNode::defaultSharedProps()];

  // Simulate clipping: remove child2 and child3 from superview (as updateClippedSubviewsWithClipRect would)
  [child2 removeFromSuperview];
  [child3 removeFromSuperview];
  XCTAssertEqual(parent.subviews.count, 1u);
  XCTAssertNil(child2.superview);
  XCTAssertNil(child3.superview);

  // Toggle removeClippedSubviews OFF via props
  auto propsOff = makeViewProps(false);
  [parent updateProps:propsOff oldProps:propsOn];

  // All children should be re-mounted
  XCTAssertEqual(parent.subviews.count, 3u);
  XCTAssertEqual(child1.superview, parent);
  XCTAssertEqual(child2.superview, parent);
  XCTAssertEqual(child3.superview, parent);
}

- (void)testToggleRemoveClippedSubviewsOffPreservesOrder
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  UIView *child1 = [UIView new];
  child1.frame = CGRectMake(0, 0, 50, 50);
  UIView *child2 = [UIView new];
  child2.frame = CGRectMake(0, 100, 50, 50);
  UIView *child3 = [UIView new];
  child3.frame = CGRectMake(0, 200, 50, 50);

  [parent mountChildComponentView:(id)child1 index:0];
  [parent mountChildComponentView:(id)child2 index:1];
  [parent mountChildComponentView:(id)child3 index:2];

  // Toggle ON and clip child1 (first child)
  auto propsOn = makeViewProps(true);
  [parent updateProps:propsOn oldProps:ViewShadowNode::defaultSharedProps()];
  [child1 removeFromSuperview];
  XCTAssertEqual(parent.subviews.count, 2u);

  // Toggle OFF — all children re-mounted in correct order
  auto propsOff = makeViewProps(false);
  [parent updateProps:propsOff oldProps:propsOn];

  XCTAssertEqual(parent.subviews.count, 3u);
  XCTAssertEqual(parent.subviews[0], child1);
  XCTAssertEqual(parent.subviews[1], child2);
  XCTAssertEqual(parent.subviews[2], child3);
}

- (void)testToggleRemoveClippedSubviewsOffClearsReactSubviews
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  UIView *child1 = [UIView new];
  child1.frame = CGRectMake(0, 0, 50, 50);

  [parent mountChildComponentView:(id)child1 index:0];

  // Toggle ON
  auto propsOn = makeViewProps(true);
  [parent updateProps:propsOn oldProps:ViewShadowNode::defaultSharedProps()];

  // Toggle OFF
  auto propsOff = makeViewProps(false);
  [parent updateProps:propsOff oldProps:propsOn];

  // _reactSubviews should be cleared
  NSMutableArray *reactSubviews = [parent valueForKey:@"_reactSubviews"];
  XCTAssertEqual(reactSubviews.count, 0u);
}

- (void)testUnmountAfterToggleOffCleansUpReactSubviews
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  UIView *child1 = [UIView new];
  child1.frame = CGRectMake(0, 0, 50, 50);
  UIView *child2 = [UIView new];
  child2.frame = CGRectMake(0, 100, 50, 50);

  // Toggle ON first, then mount children
  auto propsOn = makeViewProps(true);
  [parent updateProps:propsOn oldProps:ViewShadowNode::defaultSharedProps()];
  [parent mountChildComponentView:(id)child1 index:0];
  [parent mountChildComponentView:(id)child2 index:1];

  // Toggle OFF — re-mounts children
  auto propsOff = makeViewProps(false);
  [parent updateProps:propsOff oldProps:propsOn];

  XCTAssertEqual(parent.subviews.count, 2u);

  // Unmount child2 — should succeed without assert failures
  [parent unmountChildComponentView:(id)child2 index:1];
  XCTAssertEqual(parent.subviews.count, 1u);
  XCTAssertNil(child2.superview);
}

@end
