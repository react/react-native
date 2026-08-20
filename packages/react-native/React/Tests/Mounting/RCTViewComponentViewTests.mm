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
#import <react/renderer/graphics/Color.h>

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

#pragma mark - hitTest against non-invertible transforms (#50797)

- (void)testHitTestReturnsNilForZeroScaleYView
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  view.frame = CGRectMake(0, 0, 100, 100);
  view.layer.transform = CATransform3DMakeScale(1, 0, 1);

  XCTAssertNil([view hitTest:CGPointMake(50, 50) withEvent:nil]);
}

- (void)testHitTestReturnsNilForZeroScaleXView
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  view.frame = CGRectMake(0, 0, 100, 100);
  view.layer.transform = CATransform3DMakeScale(0, 1, 1);

  XCTAssertNil([view hitTest:CGPointMake(50, 50) withEvent:nil]);
}

- (void)testHitTestReturnsSelfForIdentityTransform
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  view.frame = CGRectMake(0, 0, 100, 100);

  XCTAssertEqual([view hitTest:CGPointMake(50, 50) withEvent:nil], view);
}

- (void)testHitTestAfterScaleTransitionedToZeroReturnsNil
{
  // #50797 variant: a view scaled to 0.9 first and then to 0.0 should stop receiving hits.
  RCTViewComponentView *view = [RCTViewComponentView new];
  view.frame = CGRectMake(0, 0, 100, 100);

  view.layer.transform = CATransform3DMakeScale(1, 0.9, 1);
  XCTAssertEqual([view hitTest:CGPointMake(50, 50) withEvent:nil], view);

  view.layer.transform = CATransform3DMakeScale(1, 0, 1);
  XCTAssertNil([view hitTest:CGPointMake(50, 50) withEvent:nil]);
}

#pragma mark - Full Keyboard Access focusability

static RCTViewComponentView *makeViewWithRole(bool accessible, const std::string &accessibilityRole)
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  auto props = std::make_shared<ViewProps>();
  props->accessible = accessible;
  props->accessibilityRole = accessibilityRole;
  [view updateProps:props oldProps:ViewShadowNode::defaultSharedProps()];
  return view;
}

- (void)testInteractiveRolesWithoutUIKitTraitsAreKeyboardFocusable
{
  // These roles intentionally map to no interactive UIKit trait, because
  // VoiceOver conveys them through accessibilityValue. They must still be
  // reachable under Full Keyboard Access.
  for (const std::string &role : {"checkbox", "radio", "combobox", "dropdownlist", "menuitem", "spinbutton", "tab"}) {
    RCTViewComponentView *view = makeViewWithRole(true, role);
    XCTAssertTrue(view.canBecomeFocused, @"role '%s' should be keyboard focusable", role.c_str());
  }
}

- (void)testTraitBackedInteractiveRolesRemainKeyboardFocusable
{
  for (const std::string &role :
       {"button", "togglebutton", "link", "search", "keyboardkey", "adjustable", "imagebutton", "switch"}) {
    RCTViewComponentView *view = makeViewWithRole(true, role);
    XCTAssertTrue(view.canBecomeFocused, @"role '%s' should be keyboard focusable", role.c_str());
  }
}

- (void)testNonInteractiveRolesAreNotKeyboardFocusable
{
  for (const std::string &role : {"none", "text", "header", "image", "progressbar", "timer"}) {
    RCTViewComponentView *view = makeViewWithRole(true, role);
    XCTAssertFalse(view.canBecomeFocused, @"role '%s' should not be keyboard focusable", role.c_str());
  }
}

- (void)testNonAccessibleViewIsNotKeyboardFocusable
{
  // An interactive role on a view opted out of accessibility must stay
  // unreachable, otherwise the focus ring lands on an invisible element.
  RCTViewComponentView *view = makeViewWithRole(false, "button");
  XCTAssertFalse(view.canBecomeFocused);
}

- (void)testViewWithoutRoleIsNotKeyboardFocusable
{
  RCTViewComponentView *view = makeViewWithRole(true, "");
  XCTAssertFalse(view.canBecomeFocused);
}

#pragma mark - outline style on square corners (#57841)

static RCTViewComponentView *makeViewWithOutlineStyle(OutlineStyle outlineStyle)
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  view.frame = CGRectMake(0, 0, 100, 100);

  auto props = std::make_shared<ViewProps>();
  props->outlineWidth = 8;
  props->outlineColor = colorFromRGBA(255, 165, 0, 255);
  props->outlineStyle = outlineStyle;

  [view updateProps:props oldProps:ViewShadowNode::defaultSharedProps()];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];

  return view;
}

- (void)testSquareSolidOutlineUsesCoreAnimationBorder
{
  // Solid outlines keep the cheaper Core Animation path.
  RCTViewComponentView *view = makeViewWithOutlineStyle(OutlineStyle::Solid);
  CALayer *outlineLayer = [view valueForKey:@"_outlineLayer"];

  XCTAssertNotNil(outlineLayer);
  XCTAssertEqualWithAccuracy(outlineLayer.borderWidth, 8.0, 0.001);
  XCTAssertNil(outlineLayer.contents);
}

- (void)testSquareDottedAndDashedOutlinesAreDrawnWithCoreGraphics
{
  // A view without border radii used to take the Core Animation path, which can
  // only render solid contours, so `outlineStyle` was silently dropped.
  for (OutlineStyle outlineStyle : {OutlineStyle::Dotted, OutlineStyle::Dashed}) {
    RCTViewComponentView *view = makeViewWithOutlineStyle(outlineStyle);
    CALayer *outlineLayer = [view valueForKey:@"_outlineLayer"];

    XCTAssertNotNil(outlineLayer);
    XCTAssertEqualWithAccuracy(outlineLayer.borderWidth, 0.0, 0.001);
    XCTAssertNotNil(outlineLayer.contents);
  }
}

@end
