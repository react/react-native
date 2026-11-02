/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTSurfacePresenter.h>
#import <ReactCommon/RCTInstance.h>

@interface RCTSchedulerLifetimeProbe : NSObject
@property (nonatomic, weak) id delegate;
@end

@implementation RCTSchedulerLifetimeProbe
@end

@interface RCTJSThreadManagerStub : NSObject
@property (nonatomic, copy) dispatch_block_t pendingWork;
@end

@implementation RCTJSThreadManagerStub
- (void)dispatchToJSThread:(dispatch_block_t)work
{
  self.pendingWork = work;
}
@end

@interface RCTInstanceInvalidationTests : XCTestCase
@end

@implementation RCTInstanceInvalidationTests

- (void)testInvalidateRetainsSchedulerUntilJSThreadCleanup
{
  RCTSurfacePresenter *presenter = [RCTSurfacePresenter new];
  RCTJSThreadManagerStub *jsThreadManager = [RCTJSThreadManagerStub new];
  RCTInstance *instance = [RCTInstance new];
  [instance setValue:presenter forKey:@"surfacePresenter"];
  [instance setValue:jsThreadManager forKey:@"jsThreadManager"];

  __weak RCTSchedulerLifetimeProbe *weakScheduler;
  @autoreleasepool {
    RCTSchedulerLifetimeProbe *scheduler = [RCTSchedulerLifetimeProbe new];
    scheduler.delegate = presenter;
    weakScheduler = scheduler;
    // Exercise real instance invalidation and presenter suspension without a JS VM.
    [presenter setValue:scheduler forKey:@"scheduler"];
  }

  @autoreleasepool {
    [instance invalidate];
    XCTAssertNil(presenter.scheduler);
    XCTAssertNotNil(weakScheduler);
    XCTAssertNil(weakScheduler.delegate);
    XCTAssertNotNil(jsThreadManager.pendingWork);
  }

  jsThreadManager.pendingWork();
  // The scheduler must be released by cleanup, not by releasing the queued block.
  XCTAssertNil(weakScheduler);
  jsThreadManager.pendingWork = nil;
}

- (void)testInvalidateWithoutSchedulerCompletesJSThreadCleanup
{
  RCTSurfacePresenter *presenter = [RCTSurfacePresenter new];
  RCTJSThreadManagerStub *jsThreadManager = [RCTJSThreadManagerStub new];
  RCTInstance *instance = [RCTInstance new];
  [instance setValue:presenter forKey:@"surfacePresenter"];
  [instance setValue:jsThreadManager forKey:@"jsThreadManager"];

  [instance invalidate];
  XCTAssertNotNil(jsThreadManager.pendingWork);
  jsThreadManager.pendingWork();
  XCTAssertNil(presenter.scheduler);
  jsThreadManager.pendingWork = nil;
}

@end
