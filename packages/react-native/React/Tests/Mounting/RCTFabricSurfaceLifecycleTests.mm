/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTFabricSurface.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/utils/ContextContainer.h>

using facebook::react::ContextContainer;
using facebook::react::RuntimeExecutor;
using facebook::react::RuntimeScheduler;
using facebook::react::RuntimeSchedulerKey;
using facebook::react::SurfaceHandler;

@interface RCTSurfacePresenter (TerminationTesting)
- (void)_applicationWillTerminate;
@end

@interface RCTSchedulerTerminationProbe : NSObject
@property (nonatomic, weak) id delegate;
@property (nonatomic, copy) dispatch_block_t onStopObserving;
@property (nonatomic, copy) void (^onDealloc)(BOOL onMainThread);
- (void)stopObservingLayoutAnimations;
@end

@implementation RCTSchedulerTerminationProbe
- (void)stopObservingLayoutAnimations
{
  self.onStopObserving();
}

- (void)dealloc
{
  self.onDealloc([NSThread isMainThread]);
}
@end

@interface RCTFabricSurfaceLifecycleTests : XCTestCase
@end

@implementation RCTFabricSurfaceLifecycleTests {
  std::shared_ptr<RuntimeScheduler> _runtimeScheduler;
  RCTSurfacePresenter *_surfacePresenter;
}

- (void)setUp
{
  [super setUp];

  RuntimeExecutor runtimeExecutor = [](std::function<void(facebook::jsi::Runtime &)> &&) {};
  _runtimeScheduler = std::make_shared<RuntimeScheduler>(runtimeExecutor);

  auto contextContainer = std::make_shared<ContextContainer>();
  contextContainer->insert(RuntimeSchedulerKey, std::weak_ptr<RuntimeScheduler>(_runtimeScheduler));

  _surfacePresenter = [[RCTSurfacePresenter alloc] initWithContextContainer:contextContainer
                                                            runtimeExecutor:runtimeExecutor
                                                 bridgelessBindingsExecutor:std::nullopt];
}

- (void)tearDown
{
  [_surfacePresenter suspend];
  _surfacePresenter = nil;
  _runtimeScheduler.reset();

  [super tearDown];
}

- (void)testStopCancelsPendingStart
{
  RCTFabricSurface *surface = [[RCTFabricSurface alloc] initWithSurfacePresenter:_surfacePresenter
                                                                      moduleName:@""
                                                               initialProperties:@{}];
  XCTestExpectation *lifecycleSettled = [self expectationWithDescription:@"Deferred surface start settled"];
  dispatch_queue_t lifecycleQueue = dispatch_queue_create("RCTFabricSurfaceLifecycleTests", DISPATCH_QUEUE_SERIAL);

  XCTAssertTrue([NSThread isMainThread]);
  dispatch_sync(lifecycleQueue, ^{
    [surface start];
    [surface stop];
  });
  dispatch_async(dispatch_get_main_queue(), ^{
    [lifecycleSettled fulfill];
  });

  [self waitForExpectations:@[ lifecycleSettled ] timeout:2];

  XCTAssertEqual(surface.surfaceHandler.getStatus(), SurfaceHandler::Status::Registered);
  XCTAssertEqual(surface.view.subviews.count, 0u);

  [surface start];
  XCTAssertEqual(surface.surfaceHandler.getStatus(), SurfaceHandler::Status::Running);

  [surface stop];
  XCTAssertEqual(surface.surfaceHandler.getStatus(), SurfaceHandler::Status::Registered);
}

- (void)testTerminationStopsObserverBeforeBackgroundSchedulerRelease
{
  XCTAssertTrue([NSThread isMainThread]);
  RCTSurfacePresenter *presenter = [RCTSurfacePresenter new];
  XCTestExpectation *released = [self expectationWithDescription:@"Scheduler released by in-flight callback"];
  __block BOOL stoppedOnMain = NO;
  __block BOOL releasedOnMain = YES;
  __block RCTSchedulerTerminationProbe *inFlightScheduler;
  __weak RCTSchedulerTerminationProbe *weakScheduler;
  @autoreleasepool {
    RCTSchedulerTerminationProbe *scheduler = [RCTSchedulerTerminationProbe new];
    scheduler.delegate = presenter;
    scheduler.onStopObserving = ^{
      stoppedOnMain = [NSThread isMainThread];
    };
    scheduler.onDealloc = ^(BOOL onMainThread) {
      releasedOnMain = onMainThread;
      [released fulfill];
    };
    weakScheduler = scheduler;
    inFlightScheduler = scheduler;
    [presenter setValue:scheduler forKey:@"scheduler"];
  }

  @autoreleasepool {
    [presenter _applicationWillTerminate];
  }

  XCTAssertNil(presenter.scheduler);
  XCTAssertNotNil(weakScheduler);
  XCTAssertNil(weakScheduler.delegate);
  XCTAssertTrue(stoppedOnMain);

  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    @autoreleasepool {
      inFlightScheduler = nil;
    }
  });
  [self waitForExpectations:@[ released ] timeout:2];
  XCTAssertNil(weakScheduler);
  XCTAssertFalse(releasedOnMain);
}

@end
