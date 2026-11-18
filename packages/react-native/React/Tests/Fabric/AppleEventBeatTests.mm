/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <XCTest/XCTest.h>

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>

#import <hermes/hermes.h>

#import <condition_variable>
#import <deque>
#import <memory>
#import <mutex>
#import <thread>

// `AppleEventBeat.h` is private to `RCTFabric` and is not reachable from a
// dependent target, so the test target declares it as its own header rather
// than the library exporting it for one test's sake.
#import "AppleEventBeat.h"

using facebook::react::AppleEventBeat;
using facebook::react::EventBeat;
using facebook::react::kNoTag;
using facebook::react::ReactNativeFeatureFlags;
using facebook::react::ReactNativeFeatureFlagsDefaults;
using facebook::react::RunLoopObserver;
using facebook::react::RuntimeExecutor;
using facebook::react::RuntimeScheduler;
using facebook::react::Tag;

namespace {

/*
 * The beat only needs an observer it can own; the tests drive the turn
 * boundary through `activityDidChange` directly, which is what the real
 * observer does.
 */
class StubRunLoopObserver : public RunLoopObserver {
 public:
  using RunLoopObserver::RunLoopObserver;

  bool isOnRunLoopThread() const noexcept override
  {
    return true;
  }

 private:
  void startObserving() const noexcept override {}
  void stopObserving() const noexcept override {}
};

class BridgelessFeatureFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableBridgelessArchitecture() override
  {
    return true;
  }
};

class SameFrameMountFeatureFlags : public BridgelessFeatureFlags {
 public:
  explicit SameFrameMountFeatureFlags(double timeoutMs) : timeoutMs_(timeoutMs) {}

  bool enableSameFrameMountForDiscreteEvents() override
  {
    return true;
  }

  double sameFrameMountForDiscreteEventsTimeoutMs() override
  {
    return timeoutMs_;
  }

 private:
  double timeoutMs_;
};

/*
 * A real JavaScript-thread stand-in: `induce` blocks the calling thread until
 * another thread hands it the runtime, so the executor cannot run inline.
 */
class RuntimeThread {
 public:
  RuntimeThread()
      : runtime_(facebook::hermes::makeHermesRuntime(::hermes::vm::RuntimeConfig::Builder().build())),
        thread_([this] { loop(); })
  {
  }

  ~RuntimeThread()
  {
    {
      std::lock_guard<std::mutex> lock(mutex_);
      stopped_ = true;
    }
    condition_.notify_all();
    thread_.join();
  }

  RuntimeExecutor executor()
  {
    return [this](std::function<void(facebook::jsi::Runtime &)> &&callback) {
      {
        std::lock_guard<std::mutex> lock(mutex_);
        queue_.push_back(std::move(callback));
      }
      condition_.notify_all();
    };
  }

 private:
  void loop()
  {
    std::unique_lock<std::mutex> lock(mutex_);
    while (true) {
      condition_.wait(lock, [this] { return stopped_ || !queue_.empty(); });
      if (queue_.empty()) {
        return;
      }
      auto callback = std::move(queue_.front());
      queue_.pop_front();
      lock.unlock();
      callback(*runtime_);
      lock.lock();
    }
  }

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::deque<std::function<void(facebook::jsi::Runtime &)>> queue_;
  std::mutex mutex_;
  std::condition_variable condition_;
  bool stopped_{false};
  std::thread thread_;
};

} // namespace

@interface AppleEventBeatTests : XCTestCase
@end

@implementation AppleEventBeatTests {
  std::unique_ptr<RuntimeThread> _runtimeThread;
  std::unique_ptr<RuntimeScheduler> _runtimeScheduler;
  std::shared_ptr<EventBeat::OwnerBox> _ownerBox;
  std::shared_ptr<int> _owner;
  std::shared_ptr<int> _beatCount;
  std::unique_ptr<AppleEventBeat> _eventBeat;
  CALayer *_hostLayer;
}

- (void)setUp
{
  [super setUp];

  ReactNativeFeatureFlags::dangerouslyReset();
  ReactNativeFeatureFlags::override(std::make_unique<BridgelessFeatureFlags>());

  _runtimeThread = std::make_unique<RuntimeThread>();
  _runtimeScheduler = std::make_unique<RuntimeScheduler>(_runtimeThread->executor());

  _owner = std::make_shared<int>(0);
  _ownerBox = std::make_shared<EventBeat::OwnerBox>();
  _ownerBox->owner = _owner;

  _hostLayer = [CALayer layer];
  CALayer *hostLayer = _hostLayer;

  auto runLoopObserver =
      std::make_unique<const StubRunLoopObserver>(RunLoopObserver::Activity::BeforeWaiting, _ownerBox->owner);
  _eventBeat = std::make_unique<AppleEventBeat>(
      _ownerBox, std::move(runLoopObserver), *_runtimeScheduler, [hostLayer](Tag) -> CALayer * { return hostLayer; });

  _beatCount = std::make_shared<int>(0);
  auto beatCount = _beatCount;
  _eventBeat->setBeatCallback([beatCount](facebook::jsi::Runtime &) { (*beatCount)++; });
}

- (void)tearDown
{
  _eventBeat.reset();
  _runtimeScheduler.reset();
  _runtimeThread.reset();
  ReactNativeFeatureFlags::dangerouslyReset();
  [super tearDown];
}

- (CALayer *)flusherLayer
{
  XCTAssertEqual(_hostLayer.sublayers.count, 1u, @"the request should have attached a flusher to the window layer");
  return _hostLayer.sublayers.firstObject;
}

- (void)testRequestAttachesAFlusherToTheResolvedWindowLayer
{
  XCTAssertEqual(_hostLayer.sublayers.count, 0u);
  _eventBeat->requestSynchronous(42);
  XCTAssertEqual(_hostLayer.sublayers.count, 1u);

  // A second request reuses the same flusher rather than stacking layers.
  _eventBeat->requestSynchronous(43);
  XCTAssertEqual(_hostLayer.sublayers.count, 1u);
}

- (void)testDisplayInducesTheBeat
{
  _eventBeat->requestSynchronous(42);
  [self.flusherLayer display];
  XCTAssertEqual(*_beatCount, 1);
}

- (void)testAtMostOneDisplayInducePerRunLoopTurn
{
  _eventBeat->requestSynchronous(42);
  CALayer *flusher = self.flusherLayer;

  [flusher display];
  XCTAssertEqual(*_beatCount, 1);

  // What the beat does during the first induce — mount, which re-runs layout,
  // which lets a layout-driven emitter request again — re-enters the display
  // phase of the same commit. Core Animation puts no bound on that, so the
  // beat must: the second display does not induce.
  _eventBeat->requestSynchronous(42);
  [flusher display];
  XCTAssertEqual(*_beatCount, 1, @"a second display in the same run loop turn must not induce again");
}

- (void)testInducesAgainInTheNextRunLoopTurn
{
  _eventBeat->requestSynchronous(42);
  CALayer *flusher = self.flusherLayer;
  [flusher display];
  XCTAssertEqual(*_beatCount, 1);

  // The run loop observer runs before Core Animation's commit observer, so it
  // opens the next turn. The previous request was already consumed, so the
  // observer's own induce is a no-op.
  _eventBeat->activityDidChange(_eventBeat.get(), RunLoopObserver::Activity::BeforeWaiting);
  XCTAssertEqual(*_beatCount, 1);

  _eventBeat->requestSynchronous(42);
  [flusher display];
  XCTAssertEqual(*_beatCount, 2, @"the bound is per turn, not for the lifetime of the beat");
}

- (void)testRequestWithoutATagDoesNotAttachAFlusher
{
  _eventBeat->requestSynchronous(kNoTag);
  XCTAssertEqual(_hostLayer.sublayers.count, 0u);
}

#pragma mark - Discrete events

- (std::unique_ptr<AppleEventBeat>)makeDiscreteEventBeatWithTimeoutMs:(double)timeoutMs mountCount:(std::shared_ptr<int>)mountCount
{
  ReactNativeFeatureFlags::dangerouslyReset();
  ReactNativeFeatureFlags::override(std::make_unique<SameFrameMountFeatureFlags>(timeoutMs));
  _eventBeat.reset();
  CALayer *hostLayer = _hostLayer;
  auto runLoopObserver =
      std::make_unique<const StubRunLoopObserver>(RunLoopObserver::Activity::BeforeWaiting, _ownerBox->owner);
  auto eventBeat = std::make_unique<AppleEventBeat>(
      _ownerBox,
      std::move(runLoopObserver),
      *_runtimeScheduler,
      [hostLayer](Tag) -> CALayer * { return hostLayer; },
      [mountCount]() { (*mountCount)++; });
  auto beatCount = _beatCount;
  eventBeat->setBeatCallback([beatCount](facebook::jsi::Runtime &) { (*beatCount)++; });
  return eventBeat;
}

- (void)testDiscreteEventIsProcessedOnTheJavaScriptThreadAndMountedFromTheDisplayPhase
{
  auto mountCount = std::make_shared<int>(0);
  _eventBeat = [self makeDiscreteEventBeatWithTimeoutMs:1000 mountCount:mountCount];

  _eventBeat->requestForDiscreteEvent(42);
  XCTAssertEqual(*_beatCount, 0, @"nothing runs before the display phase");

  [self.flusherLayer display];
  // The display phase waited for the beat (run by the runtime thread, not this
  // one), then mounted.
  XCTAssertEqual(*_beatCount, 1);
  XCTAssertEqual(*mountCount, 1);

  // Consumed: a later display in a new turn neither waits nor mounts.
  _eventBeat->activityDidChange(_eventBeat.get(), RunLoopObserver::Activity::BeforeWaiting);
  [self.flusherLayer display];
  XCTAssertEqual(*mountCount, 1);
}

- (void)testDiscreteEventWaitsForABeatTheRunLoopObserverAlreadyInduced
{
  auto mountCount = std::make_shared<int>(0);
  _eventBeat = [self makeDiscreteEventBeatWithTimeoutMs:1000 mountCount:mountCount];

  _eventBeat->requestForDiscreteEvent(42);
  // Where the run loop observer runs before Core Animation's commit, it
  // induces the beat first; the display phase still waits for it and mounts.
  _eventBeat->activityDidChange(_eventBeat.get(), RunLoopObserver::Activity::BeforeWaiting);
  [self.flusherLayer display];
  XCTAssertEqual(*_beatCount, 1);
  XCTAssertEqual(*mountCount, 1);
}

- (void)testDiscreteEventFallsBackWhenTheJavaScriptThreadIsBusy
{
  auto mountCount = std::make_shared<int>(0);
  _eventBeat = [self makeDiscreteEventBeatWithTimeoutMs:5 mountCount:mountCount];

  // Keep the JavaScript thread busy (as a long task, or a synchronous call to
  // the main thread, would) until the display phase has given up.
  dispatch_semaphore_t release = dispatch_semaphore_create(0);
  _runtimeScheduler->scheduleWork(
      [release](facebook::jsi::Runtime &) { dispatch_semaphore_wait(release, DISPATCH_TIME_FOREVER); });

  _eventBeat->requestForDiscreteEvent(42);
  CFTimeInterval start = CACurrentMediaTime();
  [self.flusherLayer display];
  CFTimeInterval waited = CACurrentMediaTime() - start;

  XCTAssertEqual(*mountCount, 0, @"nothing is mounted early after a timeout");
  XCTAssertLessThan(waited, 0.5, @"the wait is bounded by the timeout");

  dispatch_semaphore_signal(release);
  // The beat still runs on the JavaScript thread; its transactions take the
  // asynchronous main queue path.
  NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:2];
  while (*_beatCount == 0 && [deadline timeIntervalSinceNow] > 0) {
    [NSThread sleepForTimeInterval:0.001];
  }
  XCTAssertEqual(*_beatCount, 1);
}

- (void)testDiscreteEventWithoutAPendingMountPerformerKeepsTheObserverTiming
{
  ReactNativeFeatureFlags::dangerouslyReset();
  ReactNativeFeatureFlags::override(std::make_unique<SameFrameMountFeatureFlags>(1000));
  // `setUp` built the beat without a pending mount performer.
  _eventBeat->requestForDiscreteEvent(42);
  XCTAssertEqual(_hostLayer.sublayers.count, 0u);
}

- (void)testDiscreteEventWithoutATagDoesNotAttachAFlusher
{
  auto mountCount = std::make_shared<int>(0);
  _eventBeat = [self makeDiscreteEventBeatWithTimeoutMs:1000 mountCount:mountCount];
  _eventBeat->requestForDiscreteEvent(kNoTag);
  XCTAssertEqual(_hostLayer.sublayers.count, 0u);
}

- (void)testZeroTimeoutDisablesTheWait
{
  auto mountCount = std::make_shared<int>(0);
  _eventBeat = [self makeDiscreteEventBeatWithTimeoutMs:0 mountCount:mountCount];

  _eventBeat->requestForDiscreteEvent(42);
  [self.flusherLayer display];
  XCTAssertEqual(*mountCount, 0, @"no wait, no early mount");
  [self waitForBeatCount:1];
}

- (void)testNoWaitAfterASynchronousInduceInTheSameDisplay
{
  auto mountCount = std::make_shared<int>(0);
  _eventBeat = [self makeDiscreteEventBeatWithTimeoutMs:1000 mountCount:mountCount];

  _eventBeat->requestForDiscreteEvent(42);
  _eventBeat->requestSynchronous(42);
  [self.flusherLayer display];
  // The synchronous induce ran the beat (and would have mounted) on this
  // thread; the discrete wait and the pending-mount pass are skipped.
  XCTAssertEqual(*_beatCount, 1);
  XCTAssertEqual(*mountCount, 0);
}

- (void)testDiscreteEventIsNotHonouredByADisplayTwoTurnsLater
{
  auto mountCount = std::make_shared<int>(0);
  _eventBeat = [self makeDiscreteEventBeatWithTimeoutMs:1000 mountCount:mountCount];

  _eventBeat->requestForDiscreteEvent(42);
  CALayer *flusher = self.flusherLayer;
  // The flusher's display did not run in the request's turn or the next one.
  _eventBeat->activityDidChange(_eventBeat.get(), RunLoopObserver::Activity::BeforeWaiting);
  _eventBeat->activityDidChange(_eventBeat.get(), RunLoopObserver::Activity::BeforeWaiting);
  [flusher display];
  XCTAssertEqual(*mountCount, 0, @"a stale discrete request must not make an unrelated display wait");
}

- (void)testConsecutiveTimeoutsBackOff
{
  auto mountCount = std::make_shared<int>(0);
  _eventBeat = [self makeDiscreteEventBeatWithTimeoutMs:8 mountCount:mountCount];

  dispatch_semaphore_t release = dispatch_semaphore_create(0);
  _runtimeScheduler->scheduleWork(
      [release](facebook::jsi::Runtime &) { dispatch_semaphore_wait(release, DISPATCH_TIME_FOREVER); });

  for (int i = 0; i < 3; i++) {
    _eventBeat->requestForDiscreteEvent(42);
    [self.flusherLayer display];
    _eventBeat->activityDidChange(_eventBeat.get(), RunLoopObserver::Activity::BeforeWaiting);
  }
  _eventBeat->requestForDiscreteEvent(42);
  CFTimeInterval start = CACurrentMediaTime();
  [self.flusherLayer display];
  // A wait would take the full timeout (8 ms) with the JavaScript thread blocked.
  XCTAssertLessThan(CACurrentMediaTime() - start, 0.006, @"after three timeouts in a row the wait is skipped");
  XCTAssertEqual(*mountCount, 0);
  dispatch_semaphore_signal(release);
}

- (void)waitForBeatCount:(int)count
{
  NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:2];
  while (*_beatCount < count && [deadline timeIntervalSinceNow] > 0) {
    [NSThread sleepForTimeInterval:0.001];
  }
  XCTAssertEqual(*_beatCount, count);
}

@end
