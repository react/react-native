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

using namespace facebook::react;

@interface RCTViewComponentViewUnmountTests : XCTestCase
@end

@implementation RCTViewComponentViewUnmountTests

// RCTPerformBlockWithAssertFunction pops its handler after calling the block,
// without @finally, so an exception escaping the block would leave the handler
// installed for every later test in this process. RCT_NSASSERT is on in debug,
// which means a failing assert always raises once it has been reported, so the
// raise has to be caught inside the block rather than around the call.
static NSString *RCTUnmountAndReportAssert(
    RCTViewComponentView *parent,
    UIView<RCTComponentViewProtocol> *child,
    NSInteger index,
    NSString **outMessage)
{
  __block NSString *thrownName = nil;
  __block NSString *message = nil;

  RCTPerformBlockWithAssertFunction(
      ^{
        @try {
          [parent unmountChildComponentView:child index:index];
        } @catch (NSException *exception) {
          thrownName = exception.name;
        }
      },
      ^(NSString *condition, NSString *fileName, NSNumber *lineNumber, NSString *function, NSString *assertMessage) {
        message = assertMessage;
      });

  *outMessage = message;
  return thrownName;
}

// The index is read only inside RCTAssert here, so a mismatch is harmless once
// assertions are compiled out. While they are compiled in, the arguments that
// build the failure message are evaluated at the call site, and an out-of-range
// index used to reach objectAtIndex: there. The assert that exists to report the
// mismatch raised NSRangeException instead of reporting it.
- (void)testUnmountWithOutOfBoundsIndexReportsRatherThanRaisingRangeException
{
  RCTViewComponentView *parent = [[RCTViewComponentView alloc] initWithFrame:CGRectZero];
  RCTViewComponentView *child = [[RCTViewComponentView alloc] initWithFrame:CGRectZero];
  [parent mountChildComponentView:child index:0];

  NSString *message = nil;
  // Only one child is mounted, so index 1 is past the end.
  NSString *thrownName = RCTUnmountAndReportAssert(parent, child, 1, &message);

  XCTAssertNotNil(message, @"the assert must report the mismatch");
  XCTAssertTrue([message containsString:@"different index"]);
  XCTAssertNotEqualObjects(thrownName, NSRangeException, @"reporting must not raise out of bounds");
}

// The in-bounds mismatch path must keep reporting the tag at that index rather
// than the out-of-range placeholder.
- (void)testUnmountWithInBoundsMismatchStillReportsTagAtIndex
{
  RCTViewComponentView *parent = [[RCTViewComponentView alloc] initWithFrame:CGRectZero];
  RCTViewComponentView *first = [[RCTViewComponentView alloc] initWithFrame:CGRectZero];
  RCTViewComponentView *second = [[RCTViewComponentView alloc] initWithFrame:CGRectZero];
  [parent mountChildComponentView:first index:0];
  [parent mountChildComponentView:second index:1];

  NSString *message = nil;
  // `second` is really at index 1, so index 0 is in bounds but wrong.
  NSString *thrownName = RCTUnmountAndReportAssert(parent, second, 0, &message);

  XCTAssertNotNil(message);
  XCTAssertFalse([message containsString:@"out of bounds"]);
  XCTAssertNotEqualObjects(thrownName, NSRangeException);
}

// A recycled view can receive children before its own props are updated. If
// the new owner is zero-sized, layer invalidation does not reconcile the old
// clipping container. Unmount must do so before checking the child's parent.
- (void)testUnmountReconcilesRecycledContainerAtZeroSize
{
  RCTViewComponentView *parent = [[RCTViewComponentView alloc] initWithFrame:CGRectZero];
  auto clippingProps = std::make_shared<ViewProps>();
  clippingProps->yogaStyle.setOverflow(facebook::yoga::Overflow::Hidden);
  clippingProps->outlineWidth = 1;
  [parent updateProps:clippingProps oldProps:parent.props];
  [parent finalizeUpdates:RNComponentViewUpdateMaskAll];

  RCTViewComponentView *previousChild = [RCTViewComponentView new];
  [parent mountChildComponentView:previousChild index:0];
  UIView *previousContainer = previousChild.superview;
  XCTAssertNotEqual(previousContainer, parent);
  XCTAssertNotNil(previousContainer);
  [parent unmountChildComponentView:previousChild index:0];
  [parent prepareForRecycle];

  // Fabric mounts descendants before applying the recycled parent's new props.
  RCTViewComponentView *child = [RCTViewComponentView new];
  [parent mountChildComponentView:child index:0];
  [parent updateProps:std::make_shared<ViewProps>() oldProps:parent.props];
  [parent finalizeUpdates:RNComponentViewUpdateMaskAll];
  XCTAssertTrue(CGSizeEqualToSize(parent.bounds.size, CGSizeZero));
  XCTAssertEqual(child.superview, previousContainer);

  NSString *message = nil;
  NSString *thrownName = RCTUnmountAndReportAssert(parent, child, 0, &message);

  XCTAssertNil(message, @"Container migration must precede the ownership check");
  XCTAssertNil(thrownName);
  XCTAssertNil(child.superview);
  XCTAssertNil(previousContainer.superview, @"The stale container must be removed");
}

- (void)testUnmountStillReportsChildMountedUnderAnotherParent
{
  RCTViewComponentView *parent = [RCTViewComponentView new];
  RCTViewComponentView *otherParent = [RCTViewComponentView new];
  RCTViewComponentView *child = [RCTViewComponentView new];
  [otherParent mountChildComponentView:child index:0];

  NSString *message = nil;
  RCTUnmountAndReportAssert(parent, child, 0, &message);

  XCTAssertTrue([message containsString:@"mounted inside a different view"]);
}

@end
