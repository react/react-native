/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <ReactCommon/SchedulerPriority.h>
#include <react/runtime/BufferedRuntimeExecutor.h>

#include <functional>
#include <vector>

namespace facebook::react {

namespace {

/**
 * Records what the executor was handed, without a runtime: these tests are
 * about what is dispatched, in what order and at what priority, not about
 * running it.
 */
struct RecordingExecutor {
  std::vector<SchedulerPriority> priorities;

  BufferedRuntimeExecutor::Executor executor() {
    return [this](
               SchedulerPriority priority,
               std::function<void(jsi::Runtime&)>&& /*callback*/) {
      priorities.push_back(priority);
    };
  }
};

void noopWork(jsi::Runtime& /* unused */) {}

} // namespace

TEST(BufferedRuntimeExecutorTest, BuffersUntilFlushed) {
  RecordingExecutor recorder;
  auto bufferedExecutor =
      std::make_shared<BufferedRuntimeExecutor>(recorder.executor());

  bufferedExecutor->execute(noopWork);
  bufferedExecutor->execute(SchedulerPriority::LowPriority, noopWork);

  EXPECT_TRUE(recorder.priorities.empty());

  bufferedExecutor->flush();

  EXPECT_EQ(recorder.priorities.size(), 2u);
}

TEST(BufferedRuntimeExecutorTest, PreservesSubmissionOrderAcrossBothOverloads) {
  RecordingExecutor recorder;
  auto bufferedExecutor =
      std::make_shared<BufferedRuntimeExecutor>(recorder.executor());

  // The point of the shared buffer: work submitted with and without a priority
  // is one ordered stream, so a caller that issues a module call and then a
  // CallInvoker task gets them in that order.
  bufferedExecutor->execute(noopWork);
  bufferedExecutor->execute(SchedulerPriority::LowPriority, noopWork);
  bufferedExecutor->execute(noopWork);

  bufferedExecutor->flush();

  // The unprioritised overload reports as Immediate, which is what the modern
  // scheduler's `scheduleWork` gave it before this class carried priorities.
  ASSERT_EQ(recorder.priorities.size(), 3u);
  EXPECT_EQ(recorder.priorities[0], SchedulerPriority::ImmediatePriority);
  EXPECT_EQ(recorder.priorities[1], SchedulerPriority::LowPriority);
  EXPECT_EQ(recorder.priorities[2], SchedulerPriority::ImmediatePriority);
}

TEST(BufferedRuntimeExecutorTest, CarriesPriorityThroughTheBuffer) {
  RecordingExecutor recorder;
  auto bufferedExecutor =
      std::make_shared<BufferedRuntimeExecutor>(recorder.executor());

  bufferedExecutor->execute(SchedulerPriority::LowPriority, noopWork);
  bufferedExecutor->execute(SchedulerPriority::ImmediatePriority, noopWork);
  bufferedExecutor->flush();

  ASSERT_EQ(recorder.priorities.size(), 2u);
  EXPECT_EQ(recorder.priorities[0], SchedulerPriority::LowPriority);
  EXPECT_EQ(recorder.priorities[1], SchedulerPriority::ImmediatePriority);
}

TEST(BufferedRuntimeExecutorTest, PassesThroughOnceFlushed) {
  RecordingExecutor recorder;
  BufferedRuntimeExecutor bufferedExecutor(recorder.executor());
  bufferedExecutor.flush();

  bufferedExecutor.execute(noopWork);
  bufferedExecutor.execute(SchedulerPriority::IdlePriority, noopWork);

  ASSERT_EQ(recorder.priorities.size(), 2u);
  EXPECT_EQ(recorder.priorities[0], SchedulerPriority::ImmediatePriority);
  EXPECT_EQ(recorder.priorities[1], SchedulerPriority::IdlePriority);
}

} // namespace facebook::react
