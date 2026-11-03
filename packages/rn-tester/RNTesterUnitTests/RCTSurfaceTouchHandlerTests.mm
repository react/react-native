/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTIdentifierPool.h>
#import <React/RCTSurfaceTouchHandler.h>

using namespace facebook::react;

@interface RCTSurfaceTouchHandler (Testing)
- (void)_registerTouches:(NSSet<UITouch *> *)touches;
- (void)_unregisterTouches:(NSSet<UITouch *> *)touches;
@end

@interface RCTSurfaceTouchHandlerTests : XCTestCase
@end

@implementation RCTSurfaceTouchHandlerTests

// Runs `block` on a background queue and fails if it does not finish in time,
// so that a hang fails the test instead of blocking the test run.
- (void)runWithTimeout:(dispatch_block_t)block
{
  XCTestExpectation *finished = [self expectationWithDescription:@"finished"];
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    block();
    [finished fulfill];
  });
  [self waitForExpectations:@[ finished ] timeout:5];
}

- (void)testDequeueFromFullPoolDoesNotHang
{
  [self runWithTimeout:^{
    RCTIdentifierPool<2> pool;
    pool.dequeue();
    pool.dequeue();
    pool.dequeue();
  }];
}

// UIKit can deliver touchesBegan for a touch that is already registered.
// This must not leak an identifier: after enough taps the pool would be
// exhausted and the next touch would hang the main thread.
- (void)testRegisteringSameTouchTwiceDoesNotLeakIdentifiers
{
  RCTSurfaceTouchHandler *handler = [RCTSurfaceTouchHandler new];
  [self runWithTimeout:^{
    for (int i = 0; i < 100; i++) {
      NSSet<UITouch *> *touches = [NSSet setWithObject:[UITouch new]];
      [handler _registerTouches:touches];
      [handler _registerTouches:touches];
      [handler _unregisterTouches:touches];
    }
  }];
}

@end
