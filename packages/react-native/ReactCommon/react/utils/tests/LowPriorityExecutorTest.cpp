/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>

#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <react/utils/LowPriorityExecutor.h>

#include <chrono>
#include <future>
#include <mutex>
#include <thread>
#include <vector>

namespace facebook::react {

using namespace std::chrono_literals;

TEST(LowPriorityExecutorTest, testExecuteRunsPostedWork) {
  std::promise<int> result;

  LowPriorityExecutor::execute([&result] { result.set_value(3 * 7); });

  auto resultFuture = result.get_future();
  ASSERT_EQ(resultFuture.wait_for(5s), std::future_status::ready);
  EXPECT_EQ(resultFuture.get(), 21);
}

#ifdef __ANDROID__

TEST(LowPriorityExecutorTest, testExecuteRunsPostedWorkOnExecutorThread) {
  auto callerThreadId = std::this_thread::get_id();
  std::promise<std::thread::id> executorThreadId;

  LowPriorityExecutor::execute([&executorThreadId] {
    executorThreadId.set_value(std::this_thread::get_id());
  });

  auto executorThreadIdFuture = executorThreadId.get_future();
  ASSERT_EQ(executorThreadIdFuture.wait_for(5s), std::future_status::ready);
  EXPECT_NE(executorThreadIdFuture.get(), callerThreadId);
}

TEST(LowPriorityExecutorTest, testExecuteRunsQueuedWorkInPostOrder) {
  constexpr int kTaskCount = 5;
  std::promise<std::vector<int>> observedOrder;
  std::mutex orderMutex;
  std::vector<int> order;

  for (int i = 0; i < kTaskCount; ++i) {
    LowPriorityExecutor::execute([&, i] {
      std::vector<int> currentOrder;
      {
        std::lock_guard<std::mutex> lock(orderMutex);
        order.push_back(i);
        if (i == kTaskCount - 1) {
          currentOrder = order;
        }
      }

      if (!currentOrder.empty()) {
        observedOrder.set_value(std::move(currentOrder));
      }
    });
  }

  auto observedOrderFuture = observedOrder.get_future();
  ASSERT_EQ(observedOrderFuture.wait_for(5s), std::future_status::ready);
  EXPECT_THAT(observedOrderFuture.get(), ::testing::ElementsAre(0, 1, 2, 3, 4));
}

#endif

} // namespace facebook::react
