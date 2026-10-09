/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/view/ViewProps.h>

using namespace facebook::react;

@interface RCTViewComponentViewChildMountingTests : XCTestCase
@end

@implementation RCTViewComponentViewChildMountingTests

- (void)testUnmountIgnoresNativeSiblings
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  RCTViewComponentView *first = [RCTViewComponentView new];
  RCTViewComponentView *second = [RCTViewComponentView new];
  [parent mountChildComponentView:first index:0];
  [parent mountChildComponentView:second index:1];

  // UIKit's pointer effects insert native siblings before and between Fabric children.
  UIView *leadingEffect = [UIView new];
  UIView *middleEffect = [UIView new];
  [parent insertSubview:leadingEffect atIndex:0];
  [parent insertSubview:middleEffect aboveSubview:first];

  XCTAssertNoThrow([parent unmountChildComponentView:second index:1]);
  XCTAssertNil(second.superview);
  XCTAssertNoThrow([parent unmountChildComponentView:first index:0]);
  XCTAssertNil(first.superview);
  XCTAssertEqualObjects(parent.subviews, (@[ leadingEffect, middleEffect ]));
}

- (void)testMountPreservesFabricOrderWithNativeSiblings
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  RCTViewComponentView *first = [RCTViewComponentView new];
  RCTViewComponentView *last = [RCTViewComponentView new];
  [parent mountChildComponentView:first index:0];
  [parent mountChildComponentView:last index:1];

  UIView *leadingEffect = [UIView new];
  UIView *middleEffect = [UIView new];
  [parent insertSubview:leadingEffect atIndex:0];
  [parent insertSubview:middleEffect aboveSubview:first];

  RCTViewComponentView *middle = [RCTViewComponentView new];
  RCTViewComponentView *newFirst = [RCTViewComponentView new];
  RCTViewComponentView *newLast = [RCTViewComponentView new];
  [parent mountChildComponentView:middle index:1];
  [parent mountChildComponentView:newFirst index:0];
  [parent mountChildComponentView:newLast index:4];

  NSArray<UIView *> *children = @[ newFirst, first, middle, last, newLast ];
  NSArray<UIView *> *mountedChildren = [parent.subviews
      filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(UIView *view, NSDictionary *bindings) {
        return [children containsObject:view];
      }]];
  XCTAssertEqualObjects(mountedChildren, children);
  XCTAssertEqual(leadingEffect.superview, parent);
  XCTAssertEqual(middleEffect.superview, parent);

  // Effect views may also disappear between mounting transactions.
  [leadingEffect removeFromSuperview];
  [middleEffect removeFromSuperview];
  XCTAssertNoThrow([parent unmountChildComponentView:middle index:2]);
  XCTAssertEqualObjects(parent.subviews, (@[ newFirst, first, last, newLast ]));
}

- (void)testClippingDoesNotRemoveNativeSubviews
{
  RCTViewComponentView *parent = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  RCTViewComponentView *visible = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 50, 50)];
  RCTViewComponentView *clipped = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 200, 50, 50)];
  [parent mountChildComponentView:visible index:0];
  [parent mountChildComponentView:clipped index:1];

  UIView *effect = [[UIView alloc] initWithFrame:CGRectMake(0, 200, 50, 50)];
  [parent insertSubview:effect atIndex:0];
  auto props = std::make_shared<ViewProps>();
  props->removeClippedSubviews = true;
  [parent updateProps:props oldProps:parent.props];
  [parent updateClippedSubviewsWithClipRect:parent.bounds relativeToView:parent];

  XCTAssertEqual(visible.superview, parent);
  XCTAssertNil(clipped.superview);
  XCTAssertEqual(effect.superview, parent);
  XCTAssertNoThrow([parent unmountChildComponentView:clipped index:1]);

  [parent updateProps:std::make_shared<ViewProps>() oldProps:props];
  XCTAssertNil(clipped.superview);
  XCTAssertNoThrow([parent unmountChildComponentView:visible index:0]);
  XCTAssertEqualObjects(parent.subviews, (@[ effect ]));
}

- (void)testDisablingClippingDoesNotRestoreRemovedNativeSubviews
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  RCTViewComponentView *child = [RCTViewComponentView new];
  [parent mountChildComponentView:child index:0];
  UIView *effect = [UIView new];
  [parent insertSubview:effect atIndex:0];

  auto props = std::make_shared<ViewProps>();
  props->removeClippedSubviews = true;
  [parent updateProps:props oldProps:parent.props];
  [effect removeFromSuperview];
  [child removeFromSuperview];

  [parent updateProps:std::make_shared<ViewProps>() oldProps:props];
  XCTAssertEqualObjects(parent.subviews, (@[ child ]));
  XCTAssertNil(effect.superview);
  XCTAssertNoThrow([parent unmountChildComponentView:child index:0]);
}

- (void)testClippingDoesNotTrackContentView
{
  RCTViewComponentView *parent = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  UIView *content = [UIView new];
  parent.contentView = content;
  content.frame = CGRectMake(0, 200, 50, 50);
  RCTViewComponentView *child = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 50, 50)];
  [parent mountChildComponentView:child index:0];

  auto props = std::make_shared<ViewProps>();
  props->removeClippedSubviews = true;
  [parent updateProps:props oldProps:parent.props];
  [parent updateClippedSubviewsWithClipRect:parent.bounds relativeToView:parent];

  XCTAssertEqual(content.superview, parent);
  XCTAssertEqual(child.superview, parent);
  XCTAssertNoThrow([parent unmountChildComponentView:child index:0]);
  XCTAssertEqualObjects(parent.subviews, (@[ content ]));
}

- (void)testUnmountReleasesTrackedChild
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  __weak RCTViewComponentView *weakChild;
  @autoreleasepool {
    RCTViewComponentView *child = [RCTViewComponentView new];
    weakChild = child;
    [parent mountChildComponentView:child index:0];
    [parent unmountChildComponentView:child index:0];
  }
  XCTAssertNil(weakChild);
  // Keep the parent alive so its deallocation cannot hide a retained child.
  XCTAssertEqual(parent.subviews.count, 0u);
}

- (void)testUnmountReleasesClippedChild
{
  RCTViewComponentView *parent = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  __weak RCTViewComponentView *weakChild;
  @autoreleasepool {
    RCTViewComponentView *child = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 200, 50, 50)];
    weakChild = child;
    [parent mountChildComponentView:child index:0];

    auto props = std::make_shared<ViewProps>();
    props->removeClippedSubviews = true;
    [parent updateProps:props oldProps:parent.props];
    [parent updateClippedSubviewsWithClipRect:parent.bounds relativeToView:parent];
    XCTAssertNil(child.superview);
  }

  @autoreleasepool {
    // Clipping keeps the logical child alive until Fabric unmounts it.
    XCTAssertNotNil(weakChild);
    [parent unmountChildComponentView:weakChild index:0];
  }
  XCTAssertNil(weakChild);
  XCTAssertEqual(parent.subviews.count, 0u);
}

- (void)testUnmountReleasesChildrenAfterRepeatedClippingToggles
{
  RCTViewComponentView *parent = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  auto clippingProps = std::make_shared<ViewProps>();
  clippingProps->removeClippedSubviews = true;
  auto defaultProps = std::make_shared<ViewProps>();

  for (NSInteger iteration = 0; iteration < 3; iteration++) {
    __weak RCTViewComponentView *weakChild;
    @autoreleasepool {
      RCTViewComponentView *child = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 200, 50, 50)];
      weakChild = child;
      [parent mountChildComponentView:child index:0];
      [parent updateProps:clippingProps oldProps:parent.props];
      [parent updateClippedSubviewsWithClipRect:parent.bounds relativeToView:parent];
      XCTAssertNil(child.superview);
    }

    @autoreleasepool {
      XCTAssertNotNil(weakChild);
      [parent updateProps:defaultProps oldProps:parent.props];
      XCTAssertEqual(weakChild.superview, parent);
      [parent unmountChildComponentView:weakChild index:0];
    }
    XCTAssertNil(weakChild, @"Child retained after clipping toggle %ld", (long)iteration);
    XCTAssertEqual(parent.subviews.count, 0u);
  }
}

- (void)testClippingDoesNotRetainRemovedNativeSubview
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  RCTViewComponentView *child = [RCTViewComponentView new];
  [parent mountChildComponentView:child index:0];

  __weak UIView *weakEffect;
  @autoreleasepool {
    UIView *effect = [UIView new];
    weakEffect = effect;
    [parent insertSubview:effect atIndex:0];

    auto props = std::make_shared<ViewProps>();
    props->removeClippedSubviews = true;
    [parent updateProps:props oldProps:parent.props];
    [effect removeFromSuperview];
  }

  XCTAssertNil(weakEffect);
  [parent updateProps:std::make_shared<ViewProps>() oldProps:parent.props];
  XCTAssertEqualObjects(parent.subviews, (@[ child ]));
}

- (void)testPrepareForRecycleReleasesClippedChildren
{
  RCTViewComponentView *parent = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  __weak RCTViewComponentView *weakChild;
  @autoreleasepool {
    RCTViewComponentView *child = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 200, 50, 50)];
    weakChild = child;
    [parent mountChildComponentView:child index:0];

    auto props = std::make_shared<ViewProps>();
    props->removeClippedSubviews = true;
    [parent updateProps:props oldProps:parent.props];
    [parent updateClippedSubviewsWithClipRect:parent.bounds relativeToView:parent];
    XCTAssertNil(child.superview);
  }

  @autoreleasepool {
    XCTAssertNotNil(weakChild);
    [parent prepareForRecycle];
  }
  XCTAssertNil(weakChild);

  // Reusing the parent must not retain children from its previous lifecycle.
  __weak RCTViewComponentView *weakNewChild;
  @autoreleasepool {
    RCTViewComponentView *child = [RCTViewComponentView new];
    weakNewChild = child;
    [parent mountChildComponentView:child index:0];
    XCTAssertEqualObjects(parent.subviews, (@[ child ]));
    [parent unmountChildComponentView:child index:0];
  }
  XCTAssertNil(weakNewChild);
  XCTAssertEqual(parent.subviews.count, 0u);
}

@end
