/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTAssert.h>
#import <React/RCTViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/view/ViewProps.h>
#import <react/renderer/core/LayoutMetrics.h>
#import <react/renderer/graphics/Color.h>

using namespace facebook::react;

// A view that clips and has a box shadow draws the shadow outside its bounds,
// so RCTViewComponentView moves its children into a separate clipping
// container view.
static Props::Shared makeProps(bool clips, bool hasBoxShadow)
{
  auto props = std::make_shared<ViewProps>();
  if (clips) {
    props->yogaStyle.setOverflow(facebook::yoga::Overflow::Hidden);
  }
  if (hasBoxShadow) {
    BoxShadow shadow;
    shadow.offsetY = 2;
    shadow.blurRadius = 6;
    shadow.color = colorFromRGBA(0, 0, 0, 102);
    props->boxShadow = {shadow};
  }
  return props;
}

static void applyProps(RCTViewComponentView *view, const Props::Shared &props)
{
  // Like the mounting layer does for an Insert, pass no old props: the view
  // diffs against its own.
  [view updateProps:props oldProps:nullptr];
  LayoutMetrics layoutMetrics;
  layoutMetrics.frame.size = {100, 40};
  [view updateLayoutMetrics:layoutMetrics oldLayoutMetrics:EmptyLayoutMetrics];
  [view finalizeUpdates:RNComponentViewUpdateMaskAll];
}

// Unmounts `child` and returns the message of any RCTAssert it raised, or nil.
static NSString *
unmountAndReturnAssertMessage(RCTViewComponentView *parent, UIView<RCTComponentViewProtocol> *child, NSInteger index)
{
  __block NSString *message = nil;
  RCTPerformBlockWithAssertFunction(
      ^{
        @try {
          [parent unmountChildComponentView:child index:index];
        } @catch (NSException *exception) {
          message = message ?: exception.reason;
        }
      },
      ^(NSString *condition, NSString *fileName, NSNumber *lineNumber, NSString *function, NSString *assertMessage) {
        message = assertMessage;
      });
  return message;
}

@interface RCTViewComponentViewContainerTests : XCTestCase
@end

@implementation RCTViewComponentViewContainerTests

// When a view stops clipping, its children move from the container back into
// the view. The box shadow layer was already re-added by then, and
// `insertSubview:atIndex:` counts sublayers, so children appended after it were
// mounted one index too low from then on.
- (void)testChildrenMovedOutOfContainerStayBelowSelfDrawnLayers
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  applyProps(parent, makeProps(/*clips=*/true, /*hasBoxShadow=*/true));

  RCTViewComponentView *first = [RCTViewComponentView new];
  RCTViewComponentView *second = [RCTViewComponentView new];
  [parent mountChildComponentView:first index:0];
  [parent mountChildComponentView:second index:1];
  XCTAssertNotEqual(first.superview, parent, @"children of a clipping view with a box shadow go into a container");

  applyProps(parent, makeProps(/*clips=*/false, /*hasBoxShadow=*/true));
  XCTAssertEqual(first.superview, parent);
  XCTAssertEqual(parent.layer.sublayers.firstObject, first.layer, @"children must precede the box shadow layer");

  RCTViewComponentView *third = [RCTViewComponentView new];
  [parent mountChildComponentView:third index:2];
  NSArray *expected = @[ first, second, third ];
  XCTAssertEqualObjects(parent.subviews, expected);

  XCTAssertNil(unmountAndReturnAssertMessage(parent, third, 2));
}

// A recycled view must not keep the container of its previous owner. Fabric
// mounts a view's children before it applies that view's props, so those
// children used to go into the stale container and were later moved above the
// next owner's box shadow layer.
- (void)testRecycledViewDropsContainerBeforeNextOwnerMountsChildren
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  applyProps(view, makeProps(/*clips=*/true, /*hasBoxShadow=*/true));
  RCTViewComponentView *previousChild = [RCTViewComponentView new];
  [view mountChildComponentView:previousChild index:0];
  UIView *previousContainer = previousChild.superview;
  XCTAssertNotEqual(previousContainer, view);
  [view unmountChildComponentView:previousChild index:0];

  [view prepareForRecycle];
  XCTAssertNil(previousContainer.superview, @"the container is removed on recycle");
  XCTAssertEqual(view.subviews.count, 0u);

  // The next owner has a box shadow but doesn't clip.
  RCTViewComponentView *first = [RCTViewComponentView new];
  [view mountChildComponentView:first index:0];
  XCTAssertEqual(first.superview, view);
  applyProps(view, makeProps(/*clips=*/false, /*hasBoxShadow=*/true));
  XCTAssertFalse(view.clipsToBounds);

  RCTViewComponentView *second = [RCTViewComponentView new];
  [view mountChildComponentView:second index:1];
  NSArray *expected = @[ first, second ];
  XCTAssertEqualObjects(view.subviews, expected);

  XCTAssertNil(unmountAndReturnAssertMessage(view, second, 1));
}

// `updateProps` compares against the props kept from the previous owner, so a
// next owner that also clips gets no `overflow` update. The clipping that the
// container held must move back to the view when the container is dropped.
- (void)testRecycledViewKeepsClippingForNextOwnerThatClips
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  applyProps(view, makeProps(/*clips=*/true, /*hasBoxShadow=*/true));
  [view prepareForRecycle];

  RCTViewComponentView *child = [RCTViewComponentView new];
  [view mountChildComponentView:child index:0];
  applyProps(view, makeProps(/*clips=*/true, /*hasBoxShadow=*/false));

  XCTAssertEqual(child.superview, view);
  XCTAssertTrue(view.clipsToBounds);
}

// Subclasses such as image and text views put their own content view into the
// container. It has to come back with the children.
- (void)testRecycledViewMovesContentViewOutOfContainer
{
  RCTViewComponentView *view = [RCTViewComponentView new];
  applyProps(view, makeProps(/*clips=*/true, /*hasBoxShadow=*/true));
  UIView *contentView = [UIView new];
  view.contentView = contentView;
  XCTAssertNotEqual(contentView.superview, view);

  [view prepareForRecycle];

  XCTAssertEqual(contentView.superview, view);
}

@end
