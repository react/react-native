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
  dispatcher->runAsync(
      [&] { results.push_back(1); }, std::chrono::milliseconds(50));
  dispatcher->runAsync(
      [&] { results.push_back(2); }, std::chrono::milliseconds(100));
  std::this_thread::sleep_for(std::chrono::milliseconds(120));
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
} // namespace facebook::react
