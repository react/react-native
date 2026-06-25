/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <chrono>
#include <memory>
#include <semaphore>
#include <thread>
#include <variant>

#include "StubClock.h"
#include "StubErrorUtils.h"
#include "StubQueue.h"

namespace facebook::react {

using namespace std::chrono_literals;

class RuntimeSchedulerTestFeatureFlags
    : public ReactNativeFeatureFlagsDefaults {
 public:
  explicit RuntimeSchedulerTestFeatureFlags(
      bool enableEventLoop,
      bool enableRuntimeSchedulerQueueClearingOnError = false)
      : enableEventLoop_(enableEventLoop),
        enableRuntimeSchedulerQueueClearingOnError_(
            enableRuntimeSchedulerQueueClearingOnError) {}

  bool enableBridgelessArchitecture() override {
    return enableEventLoop_;
  }

  bool enableRuntimeSchedulerQueueClearingOnError() override {
    return enableRuntimeSchedulerQueueClearingOnError_;
  }

 private:
  bool enableEventLoop_;
  bool enableRuntimeSchedulerQueueClearingOnError_;
};

class RuntimeSchedulerTest : public testing::TestWithParam<bool> {
 protected:
  void SetUp() override {
    hostFunctionCallCount_ = 0;

    setUpFeatureFlags();

    // Configuration that enables microtasks
    ::hermes::vm::RuntimeConfig::Builder runtimeConfigBuilder =
        ::hermes::vm::RuntimeConfig::Builder().withMicrotaskQueue(GetParam());

    runtime_ =
        facebook::hermes::makeHermesRuntime(runtimeConfigBuilder.build());
    stubErrorUtils_ = StubErrorUtils::createAndInstallIfNeeded(*runtime_);
    stubQueue_ = std::make_unique<StubQueue>();

    RuntimeExecutor runtimeExecutor =
        [this](
            std::function<void(facebook::jsi::Runtime & runtime)>&& callback) {
          stubQueue_->runOnQueue([this, callback = std::move(callback)]() {
            callback(*runtime_);
          });
        };

    stubClock_ = std::make_unique<StubClock>(StubClock());

    auto stubNow = [this]() -> HighResTimeStamp {
      return stubClock_->getNow();
    };

    performanceEntryReporter_ = std::make_unique<PerformanceEntryReporter>();

    runtimeScheduler_ =
        std::make_unique<RuntimeScheduler>(runtimeExecutor, stubNow);

    runtimeScheduler_->setPerformanceEntryReporter(
        performanceEntryReporter_.get());
  }

  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  void setUpFeatureFlags(
      bool enableRuntimeSchedulerQueueClearingOnError = false) {
    ReactNativeFeatureFlags::dangerouslyReset();
    ReactNativeFeatureFlags::override(
        std::make_unique<RuntimeSchedulerTestFeatureFlags>(
            GetParam(), enableRuntimeSchedulerQueueClearingOnError));
  }

  jsi::Function createHostFunctionFromLambda(
      std::function<jsi::Value(bool)> callback) {
    return jsi::Function::createFromHostFunction(
        *runtime_,
        jsi::PropNameID::forUtf8(*runtime_, ""),
        3,
        [this, callback = std::move(callback)](
            jsi::Runtime& /*unused*/,
            const jsi::Value& /*unused*/,
            const jsi::Value* arguments,
            size_t /*unused*/) -> jsi::Value {
          ++hostFunctionCallCount_;
          auto didUserCallbackTimeout = arguments[0].getBool();
          return callback(didUserCallbackTimeout);
        });
  }

  uint hostFunctionCallCount_{};

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<StubClock> stubClock_;
  std::unique_ptr<StubQueue> stubQueue_;
  std::unique_ptr<RuntimeScheduler> runtimeScheduler_;
  std::shared_ptr<StubErrorUtils> stubErrorUtils_;
  std::unique_ptr<PerformanceEntryReporter> performanceEntryReporter_{};
};

TEST_P(RuntimeSchedulerTest, now) {
  HighResTimeStamp start = HighResTimeStamp::now();
  HighResTimeStamp millisecondElapsed =
      start + HighResDuration::fromChrono(1ms);

  stubClock_->setTimePoint(millisecondElapsed);
  EXPECT_EQ(runtimeScheduler_->now() - start, HighResDuration::fromChrono(1ms));

  stubClock_->advanceTimeBy(HighResDuration::fromChrono(10ms));
  EXPECT_EQ(
      runtimeScheduler_->now() - start, HighResDuration::fromChrono(11ms));

  stubClock_->advanceTimeBy(HighResDuration::fromChrono(6s));
  EXPECT_EQ(
      runtimeScheduler_->now() - start, HighResDuration::fromChrono(6011ms));
}

TEST_P(RuntimeSchedulerTest, getShouldYield) {
  // Always returns false for now.
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
}

TEST_P(RuntimeSchedulerTest, scheduleSingleTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        EXPECT_FALSE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(
    RuntimeSchedulerTest,
    scheduleSingleTaskWithMicrotasksAndBatchedRenderingUpdate) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  uint nextOperationPosition = 1;

  uint taskPosition = 0;
  uint microtaskPosition = 0;
  uint updateRenderingPosition = 0;

  auto callback = createHostFunctionFromLambda([&](bool /* unused */) {
    taskPosition = nextOperationPosition;
    nextOperationPosition++;

    runtimeScheduler_->scheduleRenderingUpdate(0, [&]() {
      updateRenderingPosition = nextOperationPosition;
      nextOperationPosition++;
    });

    auto microtaskCallback = jsi::Function::createFromHostFunction(
        *runtime_,
        jsi::PropNameID::forUtf8(*runtime_, ""),
        3,
        [&](jsi::Runtime& /*unused*/,
            const jsi::Value& /*unused*/,
            const jsi::Value* /*arguments*/,
            size_t /*unused*/) -> jsi::Value {
          microtaskPosition = nextOperationPosition;
          nextOperationPosition++;
          return jsi::Value::undefined();
        });

    runtime_->queueMicrotask(microtaskCallback);

    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  EXPECT_EQ(taskPosition, 0);
  EXPECT_EQ(microtaskPosition, 0);
  EXPECT_EQ(updateRenderingPosition, 0);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_EQ(taskPosition, 1);
  EXPECT_EQ(microtaskPosition, 2);
  EXPECT_EQ(updateRenderingPosition, 3);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, scheduleImmediatePriorityTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        EXPECT_TRUE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, taskExpiration) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        EXPECT_TRUE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  // Task with normal priority has 5s timeout.
  stubClock_->advanceTimeBy(HighResDuration::fromChrono(6s));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, scheduleTwoTasksWithSamePriority) {
  uint firstTaskCallOrder = 0;
  auto callbackOne = createHostFunctionFromLambda(
      [this, &firstTaskCallOrder](bool /*unused*/) {
        firstTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callbackOne));

  uint secondTaskCallOrder = 0;
  auto callbackTwo = createHostFunctionFromLambda(
      [this, &secondTaskCallOrder](bool /*unused*/) {
        secondTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callbackTwo));

  EXPECT_EQ(firstTaskCallOrder, 0);
  EXPECT_EQ(secondTaskCallOrder, 0);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_EQ(firstTaskCallOrder, 1);
  EXPECT_EQ(secondTaskCallOrder, 2);
  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(hostFunctionCallCount_, 2);
}

TEST_P(RuntimeSchedulerTest, scheduleTwoTasksWithDifferentPriorities) {
  uint lowPriorityTaskCallOrder = 0;
  auto callbackOne = createHostFunctionFromLambda(
      [this, &lowPriorityTaskCallOrder](bool /*unused*/) {
        lowPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::LowPriority, std::move(callbackOne));

  uint userBlockingPriorityTaskCallOrder = 0;
  auto callbackTwo = createHostFunctionFromLambda(
      [this, &userBlockingPriorityTaskCallOrder](bool /*unused*/) {
        userBlockingPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::UserBlockingPriority, std::move(callbackTwo));

  EXPECT_EQ(lowPriorityTaskCallOrder, 0);
  EXPECT_EQ(userBlockingPriorityTaskCallOrder, 0);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_EQ(lowPriorityTaskCallOrder, 2);
  EXPECT_EQ(userBlockingPriorityTaskCallOrder, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(hostFunctionCallCount_, 2);
}

TEST_P(RuntimeSchedulerTest, scheduleTwoTasksWithAllPriorities) {
  uint idlePriorityTaskCallOrder = 0;
  auto idlePriTask = createHostFunctionFromLambda(
      [this, &idlePriorityTaskCallOrder](bool /*unused*/) {
        idlePriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  uint lowPriorityTaskCallOrder = 0;
  auto lowPriTask = createHostFunctionFromLambda(
      [this, &lowPriorityTaskCallOrder](bool /*unused*/) {
        lowPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  uint normalPriorityTaskCallOrder = 0;
  auto normalPriTask = createHostFunctionFromLambda(
      [this, &normalPriorityTaskCallOrder](bool /*unused*/) {
        normalPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  uint userBlockingPriorityTaskCallOrder = 0;
  auto userBlockingPriTask = createHostFunctionFromLambda(
      [this, &userBlockingPriorityTaskCallOrder](bool /*unused*/) {
        userBlockingPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  uint immediatePriorityTaskCallOrder = 0;
  auto immediatePriTask = createHostFunctionFromLambda(
      [this, &immediatePriorityTaskCallOrder](bool /*unused*/) {
        immediatePriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::IdlePriority, std::move(idlePriTask));
  runtimeScheduler_->scheduleTask(
      SchedulerPriority::LowPriority, std::move(lowPriTask));
  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(normalPriTask));
  runtimeScheduler_->scheduleTask(
      SchedulerPriority::UserBlockingPriority, std::move(userBlockingPriTask));
  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(immediatePriTask));

  EXPECT_EQ(idlePriorityTaskCallOrder, 0);
  EXPECT_EQ(lowPriorityTaskCallOrder, 0);
  EXPECT_EQ(normalPriorityTaskCallOrder, 0);
  EXPECT_EQ(userBlockingPriorityTaskCallOrder, 0);
  EXPECT_EQ(immediatePriorityTaskCallOrder, 0);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_EQ(idlePriorityTaskCallOrder, 5);
  EXPECT_EQ(lowPriorityTaskCallOrder, 4);
  EXPECT_EQ(normalPriorityTaskCallOrder, 3);
  EXPECT_EQ(userBlockingPriorityTaskCallOrder, 2);
  EXPECT_EQ(immediatePriorityTaskCallOrder, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(hostFunctionCallCount_, 5);
}

TEST_P(RuntimeSchedulerTest, cancelTask) {
  bool didRunTask = false;
  auto callback = createHostFunctionFromLambda([&didRunTask](bool /*unused*/) {
    didRunTask = true;
    return jsi::Value::undefined();
  });

  auto task = runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  runtimeScheduler_->cancelTask(*task);

  stubQueue_->tick();

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, continuationTask) {
  bool didRunTask = false;
  bool didContinuationTask = false;

  auto callback = createHostFunctionFromLambda([&](bool /*unused*/) {
    didRunTask = true;
    return jsi::Function::createFromHostFunction(
        *runtime_,
        jsi::PropNameID::forUtf8(*runtime_, ""),
        1,
        [&](jsi::Runtime& /*runtime*/,
            const jsi::Value& /*unused*/,
            const jsi::Value* /*arguments*/,
            size_t /*unused*/) noexcept -> jsi::Value {
          didContinuationTask = true;
          return jsi::Value::undefined();
        });
  });

  auto task = runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunTask);
  EXPECT_TRUE(didContinuationTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, getCurrentPriorityLevel) {
  auto callback =
      createHostFunctionFromLambda([this](bool /*didUserCallbackTimeout*/) {
        EXPECT_EQ(
            runtimeScheduler_->getCurrentPriorityLevel(),
            SchedulerPriority::ImmediatePriority);
        return jsi::Value::undefined();
      });

  EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  stubQueue_->tick();

  EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);

  callback =
      createHostFunctionFromLambda([this](bool /*didUserCallbackTimeout*/) {
        EXPECT_EQ(
            runtimeScheduler_->getCurrentPriorityLevel(),
            SchedulerPriority::IdlePriority);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::IdlePriority, std::move(callback));

  stubQueue_->tick();

  EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);
}

TEST_P(RuntimeSchedulerTest, scheduleWorkWithYielding) {
  bool wasCalled = false;
  runtimeScheduler_->scheduleWork(
      [&](const jsi::Runtime& /*unused*/) { wasCalled = true; });

  EXPECT_FALSE(wasCalled);

  EXPECT_TRUE(runtimeScheduler_->getShouldYield());

  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(wasCalled);
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, normalTaskYieldsToPlatformEvent) {
  // Only for legacy runtime scheduler
  if (GetParam()) {
    return;
  }

  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool /*unused*/) {
    didRunJavaScriptTask = true;
    EXPECT_TRUE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](const jsi::Runtime& /*unused*/) {
    didRunPlatformWork = true;
    EXPECT_FALSE(didRunJavaScriptTask);
    EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  });

  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 2);

  stubQueue_->flush();

  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, expiredTaskDoesntYieldToPlatformEvent) {
  // Only for legacy runtime scheduler
  if (GetParam()) {
    return;
  }

  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool /*unused*/) {
    didRunJavaScriptTask = true;
    EXPECT_FALSE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](const jsi::Runtime& /*unused*/) {
    didRunPlatformWork = true;
    EXPECT_TRUE(didRunJavaScriptTask);
  });

  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 2);

  stubClock_->advanceTimeBy(HighResDuration::fromChrono(6s));

  stubQueue_->flush();

  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, immediateTaskDoesntYieldToPlatformEvent) {
  // Only for legacy runtime scheduler
  if (GetParam()) {
    return;
  }

  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool /*unused*/) {
    didRunJavaScriptTask = true;
    EXPECT_FALSE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](const jsi::Runtime& /*unused*/) {
    didRunPlatformWork = true;
    EXPECT_TRUE(didRunJavaScriptTask);
  });

  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 2);

  stubQueue_->flush();

  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, scheduleTaskWithYielding) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  bool wasCalled = false;
  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority,
      [&](const jsi::Runtime& /*unused*/) { wasCalled = true; });

  EXPECT_FALSE(wasCalled);

  EXPECT_TRUE(runtimeScheduler_->getShouldYield());

  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(wasCalled);
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, normalTaskYieldsToSynchronousAccess) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  uint syncTaskExecutionCount = 0;
  uint normalTaskExecutionCount = 0;

  std::binary_semaphore signalTaskToSync{0};

  // No tasks scheduled, not yielding necessary.
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());

  std::thread t1([this, &signalTaskToSync, &syncTaskExecutionCount]() {
    // Wait for the normal task to start executing
    signalTaskToSync.acquire();

    runtimeScheduler_->executeNowOnTheSameThread(
        [&syncTaskExecutionCount](jsi::Runtime& /*runtime*/) {
          syncTaskExecutionCount++;
        });
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority,
      [this, &normalTaskExecutionCount, &signalTaskToSync](
          jsi::Runtime& /*unused*/) {
        // Notify the "main" thread that it should request sync access.
        signalTaskToSync.release();

        // Wait for the sync access to request yielding
        while (!runtimeScheduler_->getShouldYield()) {
          // This is just to avoid the loop to take significant CPU while
          // waiting for the yield request.
          std::chrono::duration<int, std::milli> timespan(10);
          std::this_thread::sleep_for(timespan);
        }

        normalTaskExecutionCount++;
      });

  EXPECT_EQ(normalTaskExecutionCount, 0);
  EXPECT_EQ(syncTaskExecutionCount, 0);
  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  // Only the normal task has been scheduled at this point.
  EXPECT_EQ(stubQueue_->size(), 1);

  // This will start executing the normal task, which will unblock the thread
  // that will request sync access
  stubQueue_->tick();

  // The normal task yielded to the synchronous access, which is now waiting
  // to execute
  EXPECT_EQ(normalTaskExecutionCount, 1);
  EXPECT_EQ(syncTaskExecutionCount, 0);
  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 1);

  // Execute the synchronous access and wait for completion
  stubQueue_->tick();
  t1.join();

  EXPECT_EQ(syncTaskExecutionCount, 1);
  EXPECT_EQ(normalTaskExecutionCount, 1); // It hasn't executed again
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, normalTaskYieldsToSynchronousAccessAndResumes) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  uint syncTaskExecutionCount = 0;
  uint normalTaskExecutionCount = 0;

  std::binary_semaphore signalTaskToSync{0};

  // Scheduling normal priority task.
  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority,
      [&normalTaskExecutionCount](jsi::Runtime& /*unused*/) {
        normalTaskExecutionCount++;
      });

  // Only the normal task has been scheduled at this point.
  EXPECT_EQ(stubQueue_->size(), 1);

  // Scheduling sync task.
  std::thread t1([this, &syncTaskExecutionCount, &signalTaskToSync]() {
    signalTaskToSync.release();
    runtimeScheduler_->executeNowOnTheSameThread(
        [&syncTaskExecutionCount](jsi::Runtime& /*runtime*/) {
          syncTaskExecutionCount++;
        });
  });

  signalTaskToSync.acquire();

  // Wait until both tasks (the work item and synchronous access request)
  // are queued before proceeding with test assertions. Without this wait,
  // the test would be flaky in a multithreaded environment.
  stubQueue_->waitForTasks(2);

  // Normal priority task immediately yield in favour of the sync task.
  stubQueue_->tick();

  EXPECT_EQ(stubQueue_->size(), 1);
  EXPECT_EQ(normalTaskExecutionCount, 0);
  EXPECT_EQ(syncTaskExecutionCount, 0);

  // Execute sync task.
  stubQueue_->tick();
  t1.join();

  // After executing sync task, event loop resumes normal operation and normal
  // priority task is scheduled.
  EXPECT_EQ(stubQueue_->size(), 1);
  EXPECT_EQ(syncTaskExecutionCount, 1);
  EXPECT_EQ(normalTaskExecutionCount, 0);

  // Execute follow up normal priority task.
  stubQueue_->tick();

  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(syncTaskExecutionCount, 1);
  EXPECT_EQ(normalTaskExecutionCount, 1);
}

TEST_P(RuntimeSchedulerTest, immediateTaskYieldsToSynchronousAccess) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  uint syncTaskExecutionCount = 0;
  uint normalTaskExecutionCount = 0;

  std::binary_semaphore signalTaskToSync{0};

  // No tasks scheduled, not yielding necessary.
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());

  std::thread t1([this, &signalTaskToSync, &syncTaskExecutionCount]() {
    // Wait for the normal task to start executing
    signalTaskToSync.acquire();

    runtimeScheduler_->executeNowOnTheSameThread(
        [&syncTaskExecutionCount](jsi::Runtime& /*runtime*/) {
          syncTaskExecutionCount++;
        });
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority,
      [this, &normalTaskExecutionCount, &signalTaskToSync](
          jsi::Runtime& /*unused*/) {
        // Notify the "main" thread that it should request sync access.
        signalTaskToSync.release();

        // Wait for the sync access to request yielding
        while (!runtimeScheduler_->getShouldYield()) {
          // This is just to avoid the loop to take significant CPU while
          // waiting for the yield request.
          std::chrono::duration<int, std::milli> timespan(10);
          std::this_thread::sleep_for(timespan);
        }

        normalTaskExecutionCount++;
      });

  EXPECT_EQ(normalTaskExecutionCount, 0);
  EXPECT_EQ(syncTaskExecutionCount, 0);
  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  // Only the normal task has been scheduled at this point.
  EXPECT_EQ(stubQueue_->size(), 1);

  // This will start executing the normal task, which will unblock the thread
  // that will request sync access
  stubQueue_->tick();

  // The normal task yielded to the synchronous access, which is now waiting
  // to execute
  EXPECT_EQ(normalTaskExecutionCount, 1);
  EXPECT_EQ(syncTaskExecutionCount, 0);
  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 1);

  // Execute the synchronous access and wait for completion
  stubQueue_->tick();
  t1.join();

  EXPECT_EQ(syncTaskExecutionCount, 1);
  EXPECT_EQ(normalTaskExecutionCount, 1); // It hasn't executed again
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, scheduleTaskFromTask) {
  bool didRunFirstTask = false;
  bool didRunSecondTask = false;
  auto firstCallback = createHostFunctionFromLambda(
      [this, &didRunFirstTask, &didRunSecondTask](bool didUserCallbackTimeout) {
        didRunFirstTask = true;
        EXPECT_FALSE(didUserCallbackTimeout);

        auto secondCallback = createHostFunctionFromLambda(
            [&didRunSecondTask](bool didUserCallbackTimeout) {
              didRunSecondTask = true;
              EXPECT_TRUE(didUserCallbackTimeout);
              return jsi::Value::undefined();
            });

        runtimeScheduler_->scheduleTask(
            SchedulerPriority::ImmediatePriority, std::move(secondCallback));
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(firstCallback));

  EXPECT_FALSE(didRunFirstTask);
  EXPECT_FALSE(didRunSecondTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunFirstTask);
  EXPECT_TRUE(didRunSecondTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, handlingError) {
  bool didRunTask = false;
  auto firstCallback = createHostFunctionFromLambda(
      [this, &didRunTask](bool /*unused*/) -> jsi::Value {
        didRunTask = true;
        throw jsi::JSError(*runtime_, "Test error");
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(firstCallback));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(stubErrorUtils_->getReportFatalCallCount(), 1);
}

TEST_P(RuntimeSchedulerTest, clearsQueuesOnError) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  setUpFeatureFlags(/*enableRuntimeSchedulerQueueClearingOnError=*/true);

  bool didRunThrowingTask = false;
  bool didRunQueuedTask = false;
  bool didRunRenderingUpdate = false;

  auto throwingCallback =
      createHostFunctionFromLambda([&](bool /*unused*/) -> jsi::Value {
        didRunThrowingTask = true;
        runtimeScheduler_->scheduleRenderingUpdate(
            0, [&]() { didRunRenderingUpdate = true; });
        throw jsi::JSError(*runtime_, "Test error");
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(throwingCallback));
  runtimeScheduler_->scheduleTask(
      SchedulerPriority::LowPriority,
      [&](jsi::Runtime& /*runtime*/) { didRunQueuedTask = true; });

  EXPECT_FALSE(didRunThrowingTask);
  EXPECT_FALSE(didRunQueuedTask);
  EXPECT_FALSE(didRunRenderingUpdate);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunThrowingTask);
  EXPECT_FALSE(didRunQueuedTask);
  EXPECT_FALSE(didRunRenderingUpdate);
  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(stubErrorUtils_->getReportFatalCallCount(), 1);
}

TEST_P(RuntimeSchedulerTest, basicSameThreadExecution) {
  bool didRunSynchronousTask = false;
  std::thread t1([this, &didRunSynchronousTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [&didRunSynchronousTask](jsi::Runtime& /*rt*/) {
          didRunSynchronousTask = true;
        });
  });

  auto hasTask = stubQueue_->waitForTask();

  EXPECT_TRUE(hasTask);
  EXPECT_FALSE(didRunSynchronousTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  EXPECT_TRUE(didRunSynchronousTask);
}

// Mirror of `basicSameThreadExecution` for the production call pattern: the
// caller is the UI thread (XCTest test methods run on the main NSThread on
// Apple), so `executeNowOnTheSameThread` routes through the coordinator path
// in `executeSynchronouslyOnSameThread_CAN_DEADLOCK`. The off-main `driver`
// thread drives the stub queue ("JS thread") so the main thread can wake up.
TEST_P(RuntimeSchedulerTest, basicUIThreadExecution) {
  bool didRunSynchronousTask = false;

  std::thread driver([this]() {
    stubQueue_->waitForTask();
    stubQueue_->tick();
  });

  runtimeScheduler_->executeNowOnTheSameThread(
      [&didRunSynchronousTask](jsi::Runtime& /*rt*/) {
        didRunSynchronousTask = true;
      });

  driver.join();

  EXPECT_TRUE(didRunSynchronousTask);
}

TEST_P(RuntimeSchedulerTest, sameThreadTaskCreatesImmediatePriorityTask) {
  bool didRunSynchronousTask = false;
  bool didRunSubsequentTask = false;
  std::thread t1([this, &didRunSynchronousTask, &didRunSubsequentTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunSynchronousTask, &didRunSubsequentTask](
            jsi::Runtime& /*runtime*/) {
          didRunSynchronousTask = true;

          auto callback = createHostFunctionFromLambda(
              [&didRunSubsequentTask](bool didUserCallbackTimeout) {
                didRunSubsequentTask = true;
                EXPECT_TRUE(didUserCallbackTimeout);
                return jsi::Value::undefined();
              });

          runtimeScheduler_->scheduleTask(
              SchedulerPriority::ImmediatePriority, std::move(callback));

          EXPECT_FALSE(didRunSubsequentTask);
        });
  });

  auto hasTask = stubQueue_->waitForTask();

  EXPECT_TRUE(hasTask);
  EXPECT_FALSE(didRunSynchronousTask);
  EXPECT_FALSE(didRunSubsequentTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  EXPECT_TRUE(didRunSynchronousTask);
  EXPECT_FALSE(didRunSubsequentTask);

  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunSubsequentTask);

  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, syncAccessReentryProtection) {
  bool didRunFirstSyncTask = false;
  bool didRunSecondSyncTask = false;
  std::thread t1([this, &didRunFirstSyncTask, &didRunSecondSyncTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunFirstSyncTask, &didRunSecondSyncTask](
            jsi::Runtime& /*runtime*/) {
          didRunFirstSyncTask = true;
          runtimeScheduler_->executeNowOnTheSameThread(
              [&didRunSecondSyncTask](jsi::Runtime& /*runtime*/) {
                EXPECT_FALSE(didRunSecondSyncTask);
                didRunSecondSyncTask = true;
              });

          EXPECT_TRUE(didRunSecondSyncTask);
        });
  });

  auto hasTask = stubQueue_->waitForTask();

  EXPECT_TRUE(hasTask);
  EXPECT_FALSE(didRunFirstSyncTask);
  EXPECT_FALSE(didRunSecondSyncTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();
  t1.join();

  if (GetParam()) {
    EXPECT_EQ(stubQueue_->size(), 0);
  } else {
    // The legacy RuntimeScheduler always schedules a task and within the task
    // it checks if the task queue is empty. Unlike the modern RuntimeScheduler,
    // which bails out before scheduling a task.
    EXPECT_EQ(stubQueue_->size(), 1);
  }

  EXPECT_TRUE(didRunFirstSyncTask);
  EXPECT_TRUE(didRunSecondSyncTask);
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
}

TEST_P(RuntimeSchedulerTest, sameThreadTaskCreatesLowPriorityTask) {
  bool didRunSynchronousTask = false;
  bool didRunSubsequentTask = false;
  std::thread t1([this, &didRunSynchronousTask, &didRunSubsequentTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunSynchronousTask, &didRunSubsequentTask](
            jsi::Runtime& /*runtime*/) {
          didRunSynchronousTask = true;

          auto callback = createHostFunctionFromLambda(
              [&didRunSubsequentTask](bool didUserCallbackTimeout) {
                didRunSubsequentTask = true;
                EXPECT_FALSE(didUserCallbackTimeout);
                return jsi::Value::undefined();
              });

          runtimeScheduler_->scheduleTask(
              SchedulerPriority::LowPriority, std::move(callback));

          EXPECT_FALSE(didRunSubsequentTask);
        });
  });

  auto hasTask = stubQueue_->waitForTask();

  EXPECT_TRUE(hasTask);
  EXPECT_FALSE(didRunSynchronousTask);
  EXPECT_FALSE(didRunSubsequentTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  EXPECT_TRUE(didRunSynchronousTask);
  EXPECT_FALSE(didRunSubsequentTask);

  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunSubsequentTask);

  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, legacyTwoThreadsRequestAccessToTheRuntime) {
  // Only for legacy runtime scheduler
  if (GetParam()) {
    return;
  }

  bool didRunSynchronousTask = false;
  bool didRunWork = false;

  runtimeScheduler_->scheduleWork(
      [&didRunWork](jsi::Runtime& /*unused*/) { didRunWork = true; });

  std::thread t1([this, &didRunSynchronousTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [&didRunSynchronousTask](jsi::Runtime& /*runtime*/) {
          didRunSynchronousTask = true;
        });
  });

  auto hasTask = stubQueue_->waitForTasks(2);

  EXPECT_TRUE(hasTask);
  EXPECT_FALSE(didRunWork);
  EXPECT_FALSE(didRunSynchronousTask);
  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 2);

  stubQueue_->tick();

  EXPECT_TRUE(didRunWork);
  EXPECT_FALSE(didRunSynchronousTask);
  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  EXPECT_TRUE(didRunWork);
  EXPECT_TRUE(didRunSynchronousTask);
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
}

TEST_P(RuntimeSchedulerTest, modernTwoThreadsRequestAccessToTheRuntime) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  std::binary_semaphore signalTask1ToScheduleTask2{0};
  std::binary_semaphore signalTask2ToResumeTask1{0};

  bool didRunSynchronousTask1 = false;
  bool didRunSynchronousTask2 = false;

  std::thread t1([this,
                  &didRunSynchronousTask1,
                  &signalTask1ToScheduleTask2,
                  &signalTask2ToResumeTask1]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [&didRunSynchronousTask1,
         &signalTask1ToScheduleTask2,
         &signalTask2ToResumeTask1](jsi::Runtime& /*runtime*/) {
          // Notify that the second task can be scheduled.
          signalTask1ToScheduleTask2.release();

          // Wait for the second task to be scheduled before finishing this
          // task
          signalTask2ToResumeTask1.acquire();

          didRunSynchronousTask1 = true;
        });
  });

  std::thread t2([this,
                  &didRunSynchronousTask2,
                  &signalTask1ToScheduleTask2,
                  &signalTask2ToResumeTask1]() {
    // Wait for the first task to start executing before scheduling this one.
    signalTask1ToScheduleTask2.acquire();

    // Notify the first task that it can resume execution.
    // As we can't do this after the task this from thread has been scheduled
    // (because it's synchronous), we can just do a short wait instead in a
    // new thread.
    std::thread t3([&signalTask2ToResumeTask1]() {
      std::chrono::duration<int, std::milli> timespan(50);
      std::this_thread::sleep_for(timespan);
      signalTask2ToResumeTask1.release();
    });

    runtimeScheduler_->executeNowOnTheSameThread(
        [&didRunSynchronousTask2](jsi::Runtime& /*runtime*/) {
          didRunSynchronousTask2 = true;
        });

    t3.join();
  });

  auto hasTask = stubQueue_->waitForTasks(1);

  EXPECT_TRUE(hasTask);
  EXPECT_FALSE(didRunSynchronousTask1);
  EXPECT_FALSE(didRunSynchronousTask2);
  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  // Only the first task would have been scheduled at this point.
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();
  t1.join();

  EXPECT_TRUE(didRunSynchronousTask1);
  EXPECT_FALSE(didRunSynchronousTask2);
  EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  // Now we've scheduled the second task.
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();
  t2.join();

  EXPECT_TRUE(didRunSynchronousTask1);
  EXPECT_TRUE(didRunSynchronousTask2);
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_P(RuntimeSchedulerTest, errorInTaskShouldNotStopMicrotasks) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  auto microtaskRan = false;
  auto taskRan = false;

  auto callback =
      createHostFunctionFromLambda([&](bool /* unused */) -> jsi::Value {
        taskRan = true;

        auto microtaskCallback = jsi::Function::createFromHostFunction(
            *runtime_,
            jsi::PropNameID::forUtf8(*runtime_, "microtask1"),
            3,
            [&](jsi::Runtime& /*unused*/,
                const jsi::Value& /*unused*/,
                const jsi::Value* /*arguments*/,
                size_t /*unused*/) -> jsi::Value {
              microtaskRan = true;
              return jsi::Value::undefined();
            });

        runtime_->queueMicrotask(microtaskCallback);

        throw jsi::JSError(*runtime_, "Test error");
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  EXPECT_EQ(taskRan, false);
  EXPECT_EQ(microtaskRan, false);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_EQ(taskRan, 1);
  EXPECT_EQ(microtaskRan, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(stubErrorUtils_->getReportFatalCallCount(), 1);
}

TEST_P(RuntimeSchedulerTest, reportsLongTasks) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  HighResTimeStamp startTime = HighResTimeStamp::now();
  bool didRunTask1 = false;
  stubClock_->setTimePoint(startTime + HighResDuration::fromChrono(10ms));

  auto callback1 = createHostFunctionFromLambda([&](bool /* unused */) {
    didRunTask1 = true;

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(10ms));

    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback1));

  stubQueue_->tick();

  EXPECT_EQ(didRunTask1, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
  auto pendingEntries = performanceEntryReporter_->getEntries();
  EXPECT_EQ(pendingEntries.size(), 0);

  bool didRunTask2 = false;
  stubClock_->setTimePoint(startTime + HighResDuration::fromChrono(100ms));

  auto callback2 = createHostFunctionFromLambda([&](bool /* unused */) {
    didRunTask2 = true;

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(50ms));

    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback2));

  stubQueue_->tick();

  EXPECT_EQ(didRunTask2, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
  pendingEntries = performanceEntryReporter_->getEntries();
  EXPECT_EQ(pendingEntries.size(), 1);
  auto entry = pendingEntries[0];
  std::visit(
      [startTime](const auto& entryDetails) {
        EXPECT_EQ(entryDetails.entryType, PerformanceEntryType::LONGTASK);
        EXPECT_EQ(
            entryDetails.startTime.toDOMHighResTimeStamp(),
            startTime.toDOMHighResTimeStamp() + 100);
        EXPECT_EQ(entryDetails.duration, HighResDuration::fromMilliseconds(50));
      },
      entry);
}

TEST_P(RuntimeSchedulerTest, reportsLongTasksWithYielding) {
  // Only for event loop
  if (!GetParam()) {
    return;
  }

  HighResTimeStamp startTime = HighResTimeStamp::now();
  bool didRunTask1 = false;
  stubClock_->setTimePoint(startTime + HighResDuration::fromChrono(10ms));

  auto callback1 = createHostFunctionFromLambda([&](bool /* unused */) {
    // The task executes for 80ms, but all the interval between getShouldYield
    // are shorter than 50ms
    didRunTask1 = true;

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(20ms));

    runtimeScheduler_->getShouldYield();

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(20ms));

    runtimeScheduler_->getShouldYield();

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(20ms));

    runtimeScheduler_->getShouldYield();

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(20ms));

    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback1));

  stubQueue_->tick();

  EXPECT_EQ(didRunTask1, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
  auto pendingEntries = performanceEntryReporter_->getEntries();
  EXPECT_EQ(pendingEntries.size(), 0);

  bool didRunTask2 = false;
  stubClock_->setTimePoint(startTime + HighResDuration::fromChrono(100ms));

  auto callback2 = createHostFunctionFromLambda([&](bool /* unused */) {
    // The task executes for 100ms, and one of the intervals is longer than 50.
    didRunTask2 = true;

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(20ms));

    runtimeScheduler_->getShouldYield();

    // Long period!
    stubClock_->advanceTimeBy(HighResDuration::fromChrono(60ms));

    runtimeScheduler_->getShouldYield();

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(20ms));

    runtimeScheduler_->getShouldYield();

    stubClock_->advanceTimeBy(HighResDuration::fromChrono(20ms));

    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback2));

  stubQueue_->tick();

  EXPECT_EQ(didRunTask2, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
  pendingEntries = performanceEntryReporter_->getEntries();
  EXPECT_EQ(pendingEntries.size(), 1);
  auto entry = pendingEntries[0];
  std::visit(
      [startTime](const auto& entryDetails) {
        EXPECT_EQ(entryDetails.entryType, PerformanceEntryType::LONGTASK);
        EXPECT_EQ(
            entryDetails.startTime.toDOMHighResTimeStamp(),
            startTime.toDOMHighResTimeStamp() + 100);
        EXPECT_EQ(
            entryDetails.duration, HighResDuration::fromMilliseconds(120));
      },
      entry);
}

INSTANTIATE_TEST_SUITE_P(
    UseModernRuntimeScheduler,
    RuntimeSchedulerTest,
#ifdef RCT_REMOVE_LEGACY_ARCH
    testing::Values(true));
#else
    testing::Values(false, true));
#endif

} // namespace facebook::react
