/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTScrollViewComponentView.h>
#import <React/RCTViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/scrollview/ScrollViewShadowNode.h>
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

// The ScrollView's clipping pass, which runs after each mounting transaction and while scrolling.
@interface RCTScrollViewComponentView (Testing)
- (void)_remountChildren;
@end

// Counts the clipping passes that reach it.
@interface RCTClippingPassSpyView : UIView
@property (nonatomic, assign) NSUInteger passCount;
@end

@implementation RCTClippingPassSpyView
- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  self.passCount++;
}
@end

// A ScrollView, 400 points tall, with `content` as its content view.
static RCTScrollViewComponentView *makeScrollView(UIView *content)
{
  RCTScrollViewComponentView *scrollView =
      [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  [scrollView mountChildComponentView:(id)content index:0];
  return scrollView;
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

- (void)testRemoveClippedSubviewsIsKeptOnRecycledView
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  [view updateProps:makeViewProps(true) oldProps:ViewShadowNode::defaultSharedProps()];
  [view prepareForRecycle];

  // Reused for another view with removeClippedSubviews. Like the mounting layer
  // does for an Insert, pass no old props: the view diffs against its own.
  [view updateProps:makeViewProps(true) oldProps:nullptr];

  UIView *child = [UIView new];
  child.frame = CGRectMake(0, 400, 50, 50);
  [view mountChildComponentView:(id)child index:0];

  // Clipping is on, so the child is tracked and left for the clipping pass to attach.
  XCTAssertNil(child.superview);
  NSMutableArray *reactSubviews = [view valueForKey:@"_reactSubviews"];
  XCTAssertEqual(reactSubviews.count, 1u);
}

#pragma mark - ScrollView clipping pass

- (void)testScrollViewSkipsClippingPassWithoutClippingViews
{
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  RCTClippingPassSpyView *spy = [RCTClippingPassSpyView new];
  RCTScrollViewComponentView *scrollView = makeScrollView(spy);
  [window addSubview:scrollView];

  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 0u);
}

- (void)testScrollViewOutsideWindowRunsClippingPass
{
  // Content can be mounted before its ScrollView is in a window, so the pass runs there as before.
  RCTClippingPassSpyView *spy = [RCTClippingPassSpyView new];
  RCTScrollViewComponentView *scrollView = makeScrollView(spy);

  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 1u);
}

- (void)testClippingViewInWindowGetsClippingPass
{
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  RCTViewComponentView *content = [RCTViewComponentView new];
  content.frame = CGRectMake(0, 0, 100, 2000);
  RCTClippingPassSpyView *spy = [RCTClippingPassSpyView new];
  [content mountChildComponentView:(id)spy index:0];

  // Mount the rows before turning clipping on, so that both start attached.
  RCTViewComponentView *list = [RCTViewComponentView new];
  list.frame = CGRectMake(0, 0, 100, 2000);
  UIView *visibleRow = [UIView new];
  visibleRow.frame = CGRectMake(0, 0, 100, 100);
  UIView *offscreenRow = [UIView new];
  offscreenRow.frame = CGRectMake(0, 1500, 100, 100);
  [list mountChildComponentView:(id)visibleRow index:0];
  [list mountChildComponentView:(id)offscreenRow index:1];
  [list updateProps:makeViewProps(true) oldProps:ViewShadowNode::defaultSharedProps()];
  [content mountChildComponentView:list index:1];
  XCTAssertEqual(offscreenRow.superview, list);

  RCTScrollViewComponentView *scrollView = makeScrollView(content);
  [window addSubview:scrollView];

  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 1u);
  XCTAssertEqual(visibleRow.superview, list);
  XCTAssertNil(offscreenRow.superview);
}

- (void)testClippingPassFollowsClippingViewProps
{
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  RCTViewComponentView *content = [RCTViewComponentView new];
  RCTClippingPassSpyView *spy = [RCTClippingPassSpyView new];
  [content mountChildComponentView:(id)spy index:0];
  RCTViewComponentView *list = [RCTViewComponentView new];
  [list updateProps:makeViewProps(true) oldProps:ViewShadowNode::defaultSharedProps()];
  [content mountChildComponentView:list index:1];
  RCTScrollViewComponentView *scrollView = makeScrollView(content);
  [window addSubview:scrollView];

  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 1u);

  [list updateProps:makeViewProps(false) oldProps:nullptr];
  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 1u);

  [list updateProps:makeViewProps(true) oldProps:nullptr];
  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 2u);

  // A clipping view outside the window doesn't need the pass.
  [content unmountChildComponentView:list index:1];
  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 2u);

  [content mountChildComponentView:list index:1];
  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 3u);

  // A recycled view starts without `removeClippedSubviews`.
  [content unmountChildComponentView:list index:1];
  [list prepareForRecycle];
  [content mountChildComponentView:list index:1];
  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 3u);

  // Turned on outside the window, the view registers once it is attached.
  [content unmountChildComponentView:list index:1];
  [list updateProps:makeViewProps(true) oldProps:nullptr];
  [content mountChildComponentView:list index:1];
  [scrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 4u);
}

- (void)testClippingViewOnlyRegistersWithNearestScrollView
{
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  RCTViewComponentView *innerContent = [RCTViewComponentView new];
  RCTClippingPassSpyView *innerSpy = [RCTClippingPassSpyView new];
  [innerContent mountChildComponentView:(id)innerSpy index:0];
  RCTViewComponentView *list = [RCTViewComponentView new];
  [list updateProps:makeViewProps(true) oldProps:ViewShadowNode::defaultSharedProps()];
  [innerContent mountChildComponentView:list index:1];
  RCTScrollViewComponentView *innerScrollView = makeScrollView(innerContent);

  RCTViewComponentView *content = [RCTViewComponentView new];
  RCTClippingPassSpyView *spy = [RCTClippingPassSpyView new];
  [content mountChildComponentView:(id)spy index:0];
  [content mountChildComponentView:innerScrollView index:1];
  RCTScrollViewComponentView *outerScrollView = makeScrollView(content);
  [window addSubview:outerScrollView];

  // The outer pass stops at the inner ScrollView, which handles `list` itself.
  [outerScrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 0u);
  [innerScrollView _remountChildren];
  XCTAssertEqual(innerSpy.passCount, 1u);
}

- (void)testScrollViewWithRemoveClippedSubviewsDoesNotRegisterWithOuterScrollView
{
  // For example a horizontal list inside a vertical one: ScrollView forwards the prop to the
  // native ScrollView too, but the inner ScrollView clips its own content.
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 400)];
  RCTScrollViewComponentView *innerScrollView = makeScrollView([RCTViewComponentView new]);
  auto innerProps = std::make_shared<ScrollViewProps>();
  innerProps->removeClippedSubviews = true;
  [innerScrollView updateProps:innerProps oldProps:ScrollViewShadowNode::defaultSharedProps()];

  RCTViewComponentView *content = [RCTViewComponentView new];
  RCTClippingPassSpyView *spy = [RCTClippingPassSpyView new];
  [content mountChildComponentView:(id)spy index:0];
  [content mountChildComponentView:innerScrollView index:1];
  RCTScrollViewComponentView *outerScrollView = makeScrollView(content);
  [window addSubview:outerScrollView];

  [outerScrollView _remountChildren];
  XCTAssertEqual(spy.passCount, 0u);
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

#pragma mark - non-finite transforms

static RCTViewComponentView *makeViewWithTransform(const Transform &transform)
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  auto props = std::make_shared<ViewProps>();
  props->transform = transform;
  [view updateProps:props oldProps:ViewShadowNode::defaultSharedProps()];
  return view;
}

- (void)testFiniteTransformIsApplied
{
  RCTViewComponentView *view = makeViewWithTransform(Transform::Translate(5, 10, 0));

  XCTAssertEqual(view.layer.transform.m41, 5.0);
  XCTAssertEqual(view.layer.transform.m42, 10.0);
}

- (void)testTransformWithNaNIsNotApplied
{
  RCTViewComponentView *view = makeViewWithTransform(Transform::Translate(NAN, 10, 0));

  XCTAssertTrue(CATransform3DIsIdentity(view.layer.transform));
}

- (void)testTransformWithInfinityIsNotApplied
{
  RCTViewComponentView *view = makeViewWithTransform(Transform::Scale(INFINITY, 1, 1));

  XCTAssertTrue(CATransform3DIsIdentity(view.layer.transform));
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

#pragma mark - accessibilityValue for expanded state

static RCTViewComponentView *makeViewWithExpandedState(std::optional<bool> expanded)
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  auto props = std::make_shared<ViewProps>();
  props->accessible = true;
  props->accessibilityRole = "button";
  AccessibilityState accessibilityState;
  accessibilityState.expanded = expanded;
  props->accessibilityState = accessibilityState;
  [view updateProps:props oldProps:ViewShadowNode::defaultSharedProps()];
  return view;
}

- (void)testAccessibilityValueAnnouncesExpanded
{
  RCTViewComponentView *view = makeViewWithExpandedState(true);
  XCTAssertEqualObjects(view.accessibilityValue, @"expanded");
}

- (void)testAccessibilityValueAnnouncesCollapsed
{
  RCTViewComponentView *view = makeViewWithExpandedState(false);
  XCTAssertEqualObjects(view.accessibilityValue, @"collapsed");
}

- (void)testAccessibilityValueIsNilWithoutExpandedState
{
  RCTViewComponentView *view = makeViewWithExpandedState(std::nullopt);
  XCTAssertNil(view.accessibilityValue);
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
