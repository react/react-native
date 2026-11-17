/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSurfacePointerHandler.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/view/TouchEventEmitter.h>
#import <react/renderer/core/EventDispatcher.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>

using namespace facebook::react;

@interface PointerTouch : UITouch
@property (nonatomic, weak) UIView *targetView;
@end

@implementation PointerTouch
- (UIView *)view
{
  return self.targetView;
}
- (UITouchType)type
{
  return UITouchTypeDirect;
}
- (UITouchPhase)phase
{
  return UITouchPhaseBegan;
}
- (CGPoint)locationInView:(UIView *)view
{
  return CGPointMake(20, 20);
}
- (NSTimeInterval)timestamp
{
  return 1;
}
- (CGFloat)force
{
  return 1;
}
- (CGFloat)maximumPossibleForce
{
  return 1;
}
- (CGFloat)majorRadius
{
  return 1;
}
- (CGFloat)altitudeAngle
{
  return M_PI_2;
}
- (CGFloat)azimuthAngleInView:(UIView *)view
{
  return 0;
}
@end

@interface PointerTargetView : UIView
@property (nonatomic) SharedTouchEventEmitter emitter;
@end

@implementation PointerTargetView
- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  return _emitter;
}
@end

struct PointerReceipt {
  std::string type;
  int pointerId;
  bool isPrimary;
};

@interface RCTSurfacePointerHandlerTests : XCTestCase
@end

@implementation RCTSurfacePointerHandlerTests

- (void)testLoneTouchAfterActiveResetIsPrimary
{
  std::vector<PointerReceipt> receipts;
  RuntimeScheduler scheduler([](auto &&) {});
  EventQueueProcessor processor([](auto &, auto *, auto &, auto, auto &, auto) {}, [](auto &) {}, [](auto &) {}, {});
  auto dispatcher = std::make_shared<EventDispatcher>(
      processor,
      std::make_unique<EventBeat>(std::make_shared<EventBeat::OwnerBox>(), scheduler),
      [](auto &) {},
      std::weak_ptr<EventLogger>{});
  auto listener = std::make_shared<EventListener>([&receipts](const RawEvent &event) {
    const auto &pointer = static_cast<const PointerEvent &>(*event.eventPayload);
    receipts.push_back({event.type, pointer.pointerId, pointer.isPrimary});
    return true;
  });
  dispatcher->addListener(listener);

  PointerTargetView *target = [[PointerTargetView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  target.emitter = std::make_shared<TouchEventEmitter>(nullptr, dispatcher);
  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  UIViewController *controller = [UIViewController new];
  controller.view = target;
  window.rootViewController = controller;
  window.hidden = NO;
  RCTSurfacePointerHandler *handler = [RCTSurfacePointerHandler new];
  [handler attachToView:target];

  @autoreleasepool {
    PointerTouch *touch = [PointerTouch new];
    touch.targetView = target;
    [handler touchesBegan:[NSSet setWithObject:touch] withEvent:nil];
    [handler reset];
  }

  PointerTouch *next = [PointerTouch new];
  next.targetView = target;
  [handler touchesBegan:[NSSet setWithObject:next] withEvent:nil];

  XCTAssertEqual(receipts.size(), 3u);
  if (receipts.size() == 3) {
    XCTAssertTrue(receipts[2].isPrimary);
    XCTAssertEqual(receipts[0].type, "topPointerDown");
    XCTAssertTrue(receipts[0].isPrimary);
    XCTAssertEqual(receipts[1].type, "topPointerCancel");
    XCTAssertTrue(receipts[1].isPrimary);
    XCTAssertEqual(receipts[1].pointerId, receipts[0].pointerId);
    XCTAssertEqual(receipts[2].type, "topPointerDown");
  }

  [handler reset];
  [handler detachFromView:target];
  dispatcher->removeListener(listener);
  window.hidden = YES;
}

@end
