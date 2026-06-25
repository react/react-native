/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTUtils.h>
#import <ReactCommon/RuntimeExecutor.h>
#import <ReactCommon/RuntimeExecutorSyncUIThreadUtils.h>
#import <hermes/hermes.h>
#import <chrono>
#import <thread>

using namespace facebook::react;

@interface MainQueueCoordinatorTests : XCTestCase
@end

@implementation MainQueueCoordinatorTests

- (void)testRCTUnsafeExecuteOnMainQueueSync_runsBlockOnMainFromBG
{
  XCTestExpectation *done = [self expectationWithDescription:@"BG-thread call completed"];
  __block BOOL ranOnMain = NO;
  __block BOOL returnedToBG = NO;

  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    RCTUnsafeExecuteOnMainQueueSync(^{
      ranOnMain = RCTIsMainQueue();
    });
    returnedToBG = YES;
    [done fulfill];
  });

  [self waitForExpectations:@[ done ] timeout:5.0];
  XCTAssertTrue(ranOnMain, @"Block must execute on main queue");
  XCTAssertTrue(returnedToBG, @"BG thread must resume after sync call returns");
}

- (void)testExecuteSynchronouslyOnSameThread_pumpsUITasksWhileWaitingForJS
{
  // A real runtime — needed only for the reference type. We never call into it.
  auto runtime = facebook::hermes::makeHermesRuntime();

  // A "JS thread" that the executor posts to. Sleeps before invoking the callback
  // so that the main thread is forced to wait, giving us a window to post a UI task.
  constexpr auto kJSDelay = std::chrono::milliseconds(300);

  RuntimeExecutor slowJSExecutor = [&runtime, kJSDelay](std::function<void(facebook::jsi::Runtime &)> &&callback) {
    std::thread([cb = std::move(callback), &runtime, kJSDelay]() mutable {
      std::this_thread::sleep_for(kJSDelay);
      cb(*runtime);
    }).detach();
  };

  // Both writes happen on main, so plain ints are race-free. Held in a struct
  // so we can capture a pointer from an ObjC block and a reference from a C++
  // lambda without `__block` (which doesn't compose with lambdas).
  struct State {
    int sequence = 0;
    int uiTaskOrder = 0;
    int runtimeWorkOrder = 0;
    BOOL uiTaskRanOnMain = NO;
    BOOL runtimeWorkRanOnMain = NO;
  };
  State state;
  State *statePtr = &state;

  // Background thread posts a UI task ~100ms after the main thread enters the
  // wait loop — well before the JS thread wakes up at +300ms.
  XCTestExpectation *bgDone = [self expectationWithDescription:@"BG-thread sync call completed"];
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    RCTUnsafeExecuteOnMainQueueSync(^{
      statePtr->uiTaskOrder = ++statePtr->sequence;
      statePtr->uiTaskRanOnMain = RCTIsMainQueue();
    });
    [bgDone fulfill];
  });

  // This call blocks main inside the coordinator's wait loop. While it waits,
  // it should pump the UI task posted by the BG thread above.
  executeSynchronouslyOnSameThread_CAN_DEADLOCK(slowJSExecutor, [&state](facebook::jsi::Runtime & /*_*/) {
    state.runtimeWorkOrder = ++state.sequence;
    state.runtimeWorkRanOnMain = RCTIsMainQueue();
  });

  [self waitForExpectations:@[ bgDone ] timeout:5.0];

  XCTAssertTrue(state.uiTaskRanOnMain, @"UI task posted from BG should run on main");
  XCTAssertTrue(state.runtimeWorkRanOnMain, @"runtimeWork should run on main");
  XCTAssertEqual(state.uiTaskOrder, 1, @"UI task should be pumped before runtimeWork");
  XCTAssertEqual(state.runtimeWorkOrder, 2, @"runtimeWork should run after the pumped UI task");
}

@end
