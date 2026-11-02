/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/threading/TaskDispatchThread.h>
#include <atomic>
#include <chrono>
#include <future>
#include <memory>
#include <thread>

namespace facebook::react {

class TaskDispatchThreadTest : public ::testing::Test {
 protected:
  std::unique_ptr<TaskDispatchThread> dispatcher{
      std::make_unique<TaskDispatchThread>()};
};

// Test: isOnThread returns true inside the looper thread
TEST_F(TaskDispatchThreadTest, IsOnThreadReturnsTrueInLooper) {
  bool result = false;
  dispatcher->runSync([&] { result = dispatcher->isOnThread(); });
  EXPECT_TRUE(result);
}

// Test: isRunning returns true before quit, false after
TEST_F(TaskDispatchThreadTest, IsRunningFlag) {
  EXPECT_TRUE(dispatcher->isRunning());
  dispatcher->quit();
  EXPECT_FALSE(dispatcher->isRunning());
}

// Test: runAsync executes the task
TEST_F(TaskDispatchThreadTest, RunAsyncExecutesTask) {
  std::atomic<int> counter{0};
  dispatcher->runAsync([&] { counter++; });
  // Wait for task to complete
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  EXPECT_EQ(counter.load(), 1);
}

// Test: runSync executes the task and blocks until done
TEST_F(TaskDispatchThreadTest, RunSyncExecutesTask) {
  std::atomic<int> counter{0};
  dispatcher->runSync([&] { counter++; });
  EXPECT_EQ(counter.load(), 1);
}

// Test: runAsync with delay
TEST_F(TaskDispatchThreadTest, RunAsyncWithDelay) {
  std::atomic<int> counter{0};
  std::promise<void> taskDone;
  auto future = taskDone.get_future();
  dispatcher->runAsync(
      [&] {
        counter++;
        taskDone.set_value();
      },
      std::chrono::milliseconds(200));
  std::this_thread::sleep_for(std::chrono::milliseconds(20));
  EXPECT_EQ(counter.load(), 0); // 20ms << 200ms, not yet executed
  ASSERT_EQ(
      future.wait_for(std::chrono::seconds(5)), std::future_status::ready);
  EXPECT_EQ(counter.load(), 1); // Task completed
}

// Test: Multiple delayed tasks execute in order
TEST_F(TaskDispatchThreadTest, MultipleDelayedTasksOrder) {
  std::vector<int> results;
  std::promise<void> secondTaskDone;
  auto future = secondTaskDone.get_future();
  dispatcher->runAsync(
      [&] { results.push_back(1); }, std::chrono::milliseconds(50));
  dispatcher->runAsync(
      [&] {
        results.push_back(2);
        secondTaskDone.set_value();
      },
      std::chrono::milliseconds(100));
  // Block until the later task has actually run rather than racing a fixed
  // sleep against the 100ms deadline. Both tasks run serially on the single
  // dispatch thread in deadline order, so once the 100ms task completes the
  // 50ms task is guaranteed to have already run; waiting on the future also
  // establishes the happens-before needed to read `results` safely.
  ASSERT_EQ(
      future.wait_for(std::chrono::seconds(5)), std::future_status::ready);
  ASSERT_EQ(results.size(), 2);
  EXPECT_EQ(results[0], 1);
  EXPECT_EQ(results[1], 2);
}

// Test: runSync blocks until task is done
TEST_F(TaskDispatchThreadTest, RunSyncBlocksUntilDone) {
  std::atomic<bool> started{false};
  std::atomic<bool> finished{false};
  dispatcher->runAsync([&] {
    started = true;
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    finished = true;
  });
  dispatcher->runSync([&] {
    EXPECT_TRUE(started);
    EXPECT_TRUE(finished);
  });
}

// Test: quit prevents further tasks from running
TEST_F(TaskDispatchThreadTest, QuitPreventsFurtherTasks) {
  dispatcher->quit();
  std::atomic<int> counter{0};
  dispatcher->runAsync([&] { counter++; });
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  EXPECT_EQ(counter.load(), 0);
}

// Test: Multiple runSync tasks execute serially
TEST_F(TaskDispatchThreadTest, MultipleRunSyncSerialExecution) {
  std::vector<int> results;
  dispatcher->runSync([&] { results.push_back(1); });
  dispatcher->runSync([&] { results.push_back(2); });
  EXPECT_EQ(results.size(), 2);
  EXPECT_EQ(results[0], 1);
  EXPECT_EQ(results[1], 2);
}

// Test: Edge case - runSync after quit should not execute
TEST_F(TaskDispatchThreadTest, RunSyncAfterQuitDoesNotExecute) {
  dispatcher->quit();
  std::atomic<int> counter{0};
  dispatcher->runSync([&] { counter++; });
  EXPECT_EQ(counter.load(), 0);
}

// Test: Thread safety - runAsync from multiple threads
TEST_F(TaskDispatchThreadTest, RunAsyncFromMultipleThreads) {
  std::atomic<int> counter{0};
  auto task = [&] { dispatcher->runAsync([&] { counter++; }); };
  std::thread t1(task);
  std::thread t2(task);
  std::thread t3(task);
  t1.join();
  t2.join();
  t3.join();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  EXPECT_EQ(counter.load(), 3);
}

// Test: quit() shouldn't block if it is called inside loop thread
TEST_F(TaskDispatchThreadTest, QuitInTaskShouldntBeBlockedForever) {
  dispatcher->runSync([&] { dispatcher->quit(); });
}

// Test: quit() should wait for already running task in the thread
TEST_F(TaskDispatchThreadTest, QuitShouldWaitAlreadyRunningTask) {
  {
    std::unique_ptr<int> counter = std::make_unique<int>(0);
    dispatcher->runAsync([&] {
      std::this_thread::sleep_for(std::chrono::milliseconds(300));
      *counter = 1;
    });
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    // if quit doesn't wait for running task, then *counter will access already
    // deleted object
    dispatcher->quit();
  }
  // forcing dispatcher to join thread
  dispatcher.reset();
}

// Test: sync tasks shouldn't be blocked for forever due to delayed task
TEST_F(TaskDispatchThreadTest, SyncTaskShouldntBeBlockedDueToDelayedTask) {
  std::atomic<int> counter = 0;
  constexpr int kHugeDelay = 100000;
  dispatcher->runAsync([&] {}, std::chrono::seconds(kHugeDelay));
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  dispatcher->runSync([&] { counter++; });
  EXPECT_EQ(counter.load(), 1);
}

// Test: runSync should not block forever when quit() is called concurrently
// This tests the fix where the RAII guard ensures the promise is fulfilled
// even if the task is destroyed without executing during shutdown.
TEST_F(TaskDispatchThreadTest, RunSyncDoesNotBlockWhenQuitCalledConcurrently) {
  for (int i = 0; i < 100; ++i) {
    auto localDispatcher = std::make_unique<TaskDispatchThread>();

    std::atomic<bool> runSyncCompleted{false};

    // Block the dispatcher thread with a slow task
    localDispatcher->runAsync(
        [&] { std::this_thread::sleep_for(std::chrono::milliseconds(10)); });

    // Start runSync from another thread - it will queue a task and wait
    std::thread syncThread([&] {
      localDispatcher->runSync([&] {});
      runSyncCompleted = true;
    });

    // Concurrently call quit() - this should cause the queued task to be
    // destroyed without executing, but runSync should still return (not block
    // forever) because the RAII guard fulfills the promise on destruction.
    std::this_thread::sleep_for(std::chrono::milliseconds(5));
    localDispatcher->quit();

    // If the fix works, syncThread should complete. If not, this would hang.
    syncThread.join();

    // runSync should have completed (either task ran or was skipped due to
    // shutdown)
    EXPECT_TRUE(runSyncCompleted.load());

    localDispatcher.reset();
  }
}

TEST_F(TaskDispatchThreadTest, ExternalQuitJoinsEvenAfterWorkerRequestedQuit) {
  std::promise<void> entered;
  std::promise<void> release;
  auto released = release.get_future();
  dispatcher->runAsync([&]() {
    dispatcher->quit();
    entered.set_value();
    released.wait();
  });
  auto ready = entered.get_future().wait_for(std::chrono::seconds(5));
  if (ready != std::future_status::ready) {
    release.set_value();
    FAIL() << "Worker did not reach the shutdown barrier";
  }

  std::promise<void> joined;
  auto joinedFuture = joined.get_future();
  std::thread owner([&]() {
    dispatcher->quit();
    joined.set_value();
  });
  EXPECT_EQ(
      joinedFuture.wait_for(std::chrono::seconds(1)),
      std::future_status::timeout);
  release.set_value();
  owner.join();
  EXPECT_EQ(
      joinedFuture.wait_for(std::chrono::seconds(0)),
      std::future_status::ready);
  EXPECT_FALSE(dispatcher->isRunning());
}

TEST_F(TaskDispatchThreadTest, ConcurrentExternalQuitWaitsForInFlightCallback) {
  std::promise<void> entered;
  std::promise<void> release;
  auto released = release.get_future();
  std::atomic<bool> finished{false};
  dispatcher->runAsync([&]() {
    entered.set_value();
    released.wait();
    finished = true;
  });
  auto ready = entered.get_future().wait_for(std::chrono::seconds(5));
  if (ready != std::future_status::ready) {
    release.set_value();
    FAIL() << "Worker did not reach the callback barrier";
  }
  std::promise<void> firstJoined;
  std::promise<void> secondJoined;
  auto firstFuture = firstJoined.get_future();
  auto secondFuture = secondJoined.get_future();
  std::thread first([&]() {
    dispatcher->quit();
    EXPECT_TRUE(finished);
    firstJoined.set_value();
  });
  std::thread second([&]() {
    dispatcher->quit();
    EXPECT_TRUE(finished);
    secondJoined.set_value();
  });
  EXPECT_EQ(
      firstFuture.wait_for(std::chrono::seconds(1)),
      std::future_status::timeout);
  EXPECT_EQ(
      secondFuture.wait_for(std::chrono::seconds(1)),
      std::future_status::timeout);
  release.set_value();
  first.join();
  second.join();
  EXPECT_TRUE(finished);
}

TEST(
    TaskDispatchThreadShutdownTest,
    DiscardedCapturesAreReleasedAfterJoinWithoutQueueLock) {
  class Dispatcher final : public TaskDispatchThread {
   public:
    bool queueMutexAvailable() {
      std::unique_lock<std::mutex> lock(mutex_, std::try_to_lock);
      return lock.owns_lock();
    }
  } dispatcher;
  bool released = false;
  auto ownerThread = std::this_thread::get_id();
  auto token = std::shared_ptr<void>(nullptr, [&](void*) {
    EXPECT_TRUE(dispatcher.queueMutexAvailable());
    EXPECT_EQ(std::this_thread::get_id(), ownerThread);
    released = true;
  });
  dispatcher.runAsync([token]() {}, std::chrono::hours(1));
  token.reset();

  dispatcher.quit();

  EXPECT_TRUE(released);
}

TEST_F(TaskDispatchThreadTest, DispatchDoesNotCopyCallbackOnWorker) {
  struct State {
    TaskDispatchThread* dispatcher{nullptr};
    std::atomic<int> copiesOnWorker{0};
    std::promise<void> ran;
  };
  struct CopyCountingTask {
    std::shared_ptr<State> state;

    explicit CopyCountingTask(std::shared_ptr<State> state)
        : state(std::move(state)) {}

    CopyCountingTask(const CopyCountingTask& other) noexcept
        : state(other.state) {
      if (state->dispatcher->isOnThread()) {
        ++state->copiesOnWorker;
      }
    }

    CopyCountingTask& operator=(const CopyCountingTask&) = default;

    void operator()() {
      state->ran.set_value();
    }
  };
  auto state = std::make_shared<State>();
  state->dispatcher = dispatcher.get();
  auto ran = state->ran.get_future();
  dispatcher->runAsync(CopyCountingTask(state));
  ASSERT_EQ(ran.wait_for(std::chrono::seconds(5)), std::future_status::ready);
  dispatcher->quit();
  EXPECT_EQ(state->copiesOnWorker.load(), 0);
}

} // namespace facebook::react
