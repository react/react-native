/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <queue>
#include <utility>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <ReactCommon/RuntimeExecutor.h>
#include <hermes/hermes.h>
#include <jserrorhandler/JsErrorHandler.h>
#include <jsi/jsi.h>
#include <react/runtime/ReactInstance.h>

namespace facebook::react {

namespace {

class MockTimerRegistry : public PlatformTimerRegistry {
 public:
  MOCK_METHOD(void, createTimer, (uint32_t, double), (override));
  MOCK_METHOD(void, createRecurringTimer, (uint32_t, double), (override));
  MOCK_METHOD(void, deleteTimer, (uint32_t), (override));
};

class MockMessageQueueThread : public MessageQueueThread {
 public:
  void runOnQueue(std::function<void()>&& func) override {
    callbackQueue_.push(std::move(func));
  }

  void runOnQueueSync(std::function<void()>&& /*unused*/) override {}
  void quitSynchronous() override {}

  void tick() {
    while (!callbackQueue_.empty()) {
      auto callback = std::move(callbackQueue_.front());
      callbackQueue_.pop();
      callback();
    }
  }

  size_t size() const {
    return callbackQueue_.size();
  }

 private:
  std::queue<std::function<void()>> callbackQueue_;
};

} // namespace

class RuntimeExecutorShutdownTest : public ::testing::Test {
 protected:
  void SetUp() override {
    auto runtime =
        std::make_unique<JSIRuntimeHolder>(hermes::makeHermesRuntime());
    messageQueueThread_ = std::make_shared<MockMessageQueueThread>();
    auto mockRegistry = std::make_unique<MockTimerRegistry>();
    auto timerManager = std::make_shared<TimerManager>(std::move(mockRegistry));
    auto onJsError =
        [](jsi::Runtime& /*runtime*/,
           const JsErrorHandler::ProcessedError& /*error*/) noexcept {};

    instance_ = std::make_unique<ReactInstance>(
        std::move(runtime),
        messageQueueThread_,
        timerManager,
        std::move(onJsError));
  }

  std::shared_ptr<MockMessageQueueThread> messageQueueThread_;
  std::unique_ptr<ReactInstance> instance_;
};

// Calling a held RuntimeExecutor after ReactInstance has been destroyed
// must silently drop the callback. Use a shared_ptr captured into the
// callback to also prove the callback itself is destroyed (not retained
// somewhere indefinitely).
TEST_F(
    RuntimeExecutorShutdownTest,
    heldExecutorCallAfterShutdownDropsCallback) {
  RuntimeExecutor executor = instance_->getBufferedRuntimeExecutor();

  instance_.reset();

  auto tracker = std::make_shared<int>(0);
  std::weak_ptr<int> weakTracker = tracker;
  executor([tracker = std::move(tracker)](jsi::Runtime& /*runtime*/) {
    FAIL() << "Callback should never run after shutdown";
  });

  EXPECT_EQ(messageQueueThread_->size(), 0u);
  EXPECT_TRUE(weakTracker.expired())
      << "Rejected callback (and its captures) should be destroyed";
  messageQueueThread_->tick();
}

// Repeated post-shutdown invocations must remain memory-safe. This guards
// against future refactors that swap the weak_ptr capture for a raw pointer
// or shared_ptr.
TEST_F(RuntimeExecutorShutdownTest, heldExecutorCallAfterShutdownDoesNotCrash) {
  RuntimeExecutor executor = instance_->getBufferedRuntimeExecutor();

  instance_.reset();

  for (int i = 0; i < 100; ++i) {
    executor([](jsi::Runtime& /*runtime*/) {
      FAIL() << "Callback should never run after shutdown";
    });
  }
  messageQueueThread_->tick();
}

// Work scheduled through the buffered executor sits in the internal buffer
// until flush() (which only happens via loadScript). If the ReactInstance
// is destroyed before flush, the buffered work must be dropped — never
// surfaced on the JS queue and never retained past instance destruction.
// A shared_ptr captured into the callback, watched via weak_ptr from
// outside, proves the buffered queue actually releases its contents.
TEST_F(
    RuntimeExecutorShutdownTest,
    pendingCallbackShutdownBeforeTickDropsCallback) {
  RuntimeExecutor executor = instance_->getBufferedRuntimeExecutor();

  auto tracker = std::make_shared<int>(0);
  std::weak_ptr<int> weakTracker = tracker;
  executor([tracker = std::move(tracker)](jsi::Runtime& /*runtime*/) {
    FAIL() << "Buffered callback should never run after shutdown";
  });

  EXPECT_EQ(messageQueueThread_->size(), 0u);
  EXPECT_FALSE(weakTracker.expired())
      << "Callback should still be alive in BufferedRuntimeExecutor's queue";

  instance_.reset();

  EXPECT_TRUE(weakTracker.expired())
      << "Buffered callback should be destroyed when ReactInstance is";
  messageQueueThread_->tick();
}

} // namespace facebook::react
