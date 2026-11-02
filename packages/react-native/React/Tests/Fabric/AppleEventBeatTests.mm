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

@end
