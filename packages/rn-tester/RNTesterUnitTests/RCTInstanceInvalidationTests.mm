/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreFoundation/CoreFoundation.h>
#import <XCTest/XCTest.h>

#import <React/RCTSurfacePresenter.h>
#import <ReactCommon/RCTInstance.h>

@interface RCTSchedulerLifetimeProbe : NSObject
@property (nonatomic, weak) id delegate;
@property (nonatomic, copy) void (^onDealloc)(BOOL onMainThread);
@property (nonatomic, copy) void (^onStopObserving)(BOOL onMainThread);
@property (nonatomic, copy) dispatch_block_t onTick;
- (void)startObserving;
- (void)stopObservingLayoutAnimations;
@end

@implementation RCTSchedulerLifetimeProbe {
  CFRunLoopObserverRef _observer;
}

- (void)startObserving
{
  void *unretainedSelf = (__bridge void *)self;
  _observer = CFRunLoopObserverCreateWithHandler(
      kCFAllocatorDefault, kCFRunLoopBeforeWaiting, true, 0, ^(CFRunLoopObserverRef, CFRunLoopActivity) {
        __unsafe_unretained RCTSchedulerLifetimeProbe *probe = (__bridge RCTSchedulerLifetimeProbe *)unretainedSelf;
        dispatch_block_t tick = probe.onTick;
        if (tick) {
          tick();
        }
      });
  CFRunLoopAddObserver(CFRunLoopGetMain(), _observer, kCFRunLoopCommonModes);
}

- (void)stopObservingLayoutAnimations
{
  if (_observer) {
    CFRunLoopRemoveObserver(CFRunLoopGetMain(), _observer, kCFRunLoopCommonModes);
    CFRelease(_observer);
    _observer = nullptr;
  }
  if (_onStopObserving) {
    _onStopObserving([NSThread isMainThread]);
  }
}

- (void)dealloc
{
  if (_observer) {
    CFRunLoopRemoveObserver(CFRunLoopGetMain(), _observer, kCFRunLoopCommonModes);
    CFRelease(_observer);
  }
  if (_onDealloc) {
    _onDealloc([NSThread isMainThread]);
  }
}
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

- (void)runJSWork:(dispatch_block_t)work
{
  dispatch_semaphore_t finished = dispatch_semaphore_create(0);
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    @autoreleasepool {
      work();
    }
    dispatch_semaphore_signal(finished);
  });
  XCTAssertEqual(dispatch_semaphore_wait(finished, dispatch_time(DISPATCH_TIME_NOW, 3 * NSEC_PER_SEC)), 0);
}

- (void)testInvalidateStopsObserverOnMainAndReleasesSchedulerDuringJSCleanup
{
  XCTAssertTrue([NSThread isMainThread]);
  RCTSurfacePresenter *presenter = [RCTSurfacePresenter new];
  RCTJSThreadManagerStub *jsThreadManager = [RCTJSThreadManagerStub new];
  RCTInstance *instance = [RCTInstance new];
  [instance setValue:presenter forKey:@"surfacePresenter"];
  [instance setValue:jsThreadManager forKey:@"jsThreadManager"];

  XCTestExpectation *released = [self expectationWithDescription:@"Scheduler released during JS cleanup"];
  __block BOOL observerStoppedOnMain = NO;
  __block BOOL releasedBeforeJSThreadCleanup = NO;
  __weak RCTInstance *weakInstance = instance;
  __weak RCTSchedulerLifetimeProbe *weakScheduler;
  @autoreleasepool {
    RCTSchedulerLifetimeProbe *scheduler = [RCTSchedulerLifetimeProbe new];
    scheduler.delegate = presenter;
    scheduler.onStopObserving = ^(BOOL onMainThread) {
      observerStoppedOnMain = onMainThread;
    };
    scheduler.onDealloc = ^(BOOL) {
      releasedBeforeJSThreadCleanup = [weakInstance valueForKey:@"jsThreadManager"] != nil;
      [released fulfill];
    };
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
    XCTAssertTrue(observerStoppedOnMain);
  }

  dispatch_block_t drainWork = jsThreadManager.pendingWork;
  [self runJSWork:drainWork];

  [self waitForExpectations:@[ released ] timeout:3];
  XCTAssertTrue(releasedBeforeJSThreadCleanup);
  // Keeping the cleanup block itself must not keep the scheduler alive.
  XCTAssertNil(weakScheduler);
  XCTAssertNil([instance valueForKey:@"jsThreadManager"]);
  jsThreadManager.pendingWork = nil;
}

- (void)testStoppedObserverDoesNotRunWhileWaitingForJSCleanup
{
  XCTAssertTrue([NSThread isMainThread]);
  RCTSurfacePresenter *presenter = [RCTSurfacePresenter new];
  RCTJSThreadManagerStub *jsThreadManager = [RCTJSThreadManagerStub new];
  RCTInstance *instance = [RCTInstance new];
  [instance setValue:presenter forKey:@"surfacePresenter"];
  [instance setValue:jsThreadManager forKey:@"jsThreadManager"];

  XCTestExpectation *noTick = [self expectationWithDescription:@"Stopped observer must not run"];
  noTick.inverted = YES;
  XCTestExpectation *released = [self expectationWithDescription:@"Scheduler released during JS cleanup"];
  __weak RCTSchedulerLifetimeProbe *weakScheduler;
  @autoreleasepool {
    RCTSchedulerLifetimeProbe *scheduler = [RCTSchedulerLifetimeProbe new];
    weakScheduler = scheduler;
    scheduler.onDealloc = ^(BOOL) {
      [released fulfill];
    };
    scheduler.onTick = ^{
      [noTick fulfill];
    };
    [presenter setValue:scheduler forKey:@"scheduler"];
    [scheduler startObserving];
  }

  @autoreleasepool {
    [instance invalidate];
  }
  [self waitForExpectations:@[ noTick ] timeout:0.05];
  XCTAssertNotNil(weakScheduler);
  [self runJSWork:jsThreadManager.pendingWork];
  [self waitForExpectations:@[ released ] timeout:3];
  XCTAssertNil(weakScheduler);
  XCTAssertNil([instance valueForKey:@"jsThreadManager"]);
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
  XCTAssertNil([instance valueForKey:@"jsThreadManager"]);
  jsThreadManager.pendingWork = nil;
}

@end
