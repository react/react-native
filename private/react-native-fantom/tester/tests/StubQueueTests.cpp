/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/fantom/StubQueue.h>
#include <atomic>
#include <chrono>
#include <future>
#include <stdexcept>
#include <thread>
#include <vector>

namespace facebook::react {

TEST(StubQueueTest, FlushPreservesOrderAndAllowsReentrantEnqueue) {
  StubQueue queue;
  std::vector<int> callbacks;
  queue.runOnQueue([&] {
    callbacks.push_back(1);
    queue.runOnQueue([&] { callbacks.push_back(3); });
    queue.flush();
  });
  queue.runOnQueue([&] { callbacks.push_back(2); });

  queue.flush();

  EXPECT_EQ(callbacks, (std::vector<int>{1, 2, 3}));
  EXPECT_FALSE(queue.hasPendingCallbacks());
}

TEST(StubQueueTest, FlushDoesNotCopySmallNoexceptCallable) {
  struct State {
    int copies{0};
    int calls{0};
  };
  struct Callback {
    explicit Callback(std::shared_ptr<State> state) : state(std::move(state)) {}
    Callback(const Callback& other) noexcept : state(other.state) {
      ++state->copies;
    }
    Callback& operator=(const Callback&) = default;
    void operator()() const {
      ++state->calls;
    }
    std::shared_ptr<State> state;
  };
  StubQueue queue;
  auto state = std::make_shared<State>();
  queue.runOnQueue(Callback(state));
  state->copies = 0;

  queue.flush();

  EXPECT_EQ(state->calls, 1);
  EXPECT_EQ(state->copies, 0);
}

TEST(StubQueueTest, CallableTransfersAllowReentrantCopyAndDestruction) {
  std::promise<int> result;
  auto completed = result.get_future();
  std::thread worker([result = std::move(result)]() mutable {
    StubQueue queue;
    struct State {
      StubQueue* queue{nullptr};
      bool armed{false};
      int calls{0};
    };
    struct Callback {
      explicit Callback(std::shared_ptr<State> state)
          : state(std::move(state)) {}
      Callback(const Callback& other) noexcept : state(other.state) {
        probe();
      }
      Callback(Callback&&) noexcept = default;
      Callback& operator=(const Callback&) = default;
      Callback& operator=(Callback&&) noexcept = delete;
      ~Callback() {
        probe();
      }
      void probe() const noexcept {
        if (state && state->armed) {
          (void)state->queue->hasPendingCallbacks();
        }
      }
      void operator()() const {
        ++state->calls;
      }
      std::shared_ptr<State> state;
    };
    auto state = std::make_shared<State>();
    state->queue = &queue;
    std::function<void()> callback = Callback(state);
    state->armed = true;
    queue.runOnQueue(std::move(callback));
    callback = nullptr;
    queue.flush();
    result.set_value(state->calls);
  });
  auto status = completed.wait_for(std::chrono::seconds(5));
  if (status == std::future_status::ready) {
    worker.join();
  } else {
    // NOLINTNEXTLINE(facebook-hte-BadCall-detach): failure-only private state.
    worker.detach();
  }
  ASSERT_EQ(status, std::future_status::ready);
  EXPECT_EQ(completed.get(), 1);
}

TEST(StubQueueTest, FlushSkipsEmptyCallbacks) {
  StubQueue queue;
  int calls = 0;
  queue.runOnQueue({});
  queue.runOnQueue([&] { ++calls; });

  queue.flush();

  EXPECT_EQ(calls, 1);
  EXPECT_FALSE(queue.hasPendingCallbacks());
}

TEST(StubQueueTest, ConcurrentProducersExecuteExactlyOnceInProducerOrder) {
  StubQueue queue;
  constexpr int producerCount = 8;
  constexpr int callbacksPerProducer = 10000;
  const auto consumer = std::this_thread::get_id();
  std::promise<void> start;
  auto started = start.get_future().share();
  std::atomic<int> completedProducers{0};
  int executed = 0;
  std::vector<int> callbacks(producerCount, 0);
  std::vector<std::thread> producers;
  producers.reserve(producerCount);
  for (int producer = 0; producer < producerCount; ++producer) {
    producers.emplace_back([&, producer] {
      started.wait();
      for (int index = 0; index < callbacksPerProducer; ++index) {
        queue.runOnQueue([&, producer, index] {
          EXPECT_EQ(std::this_thread::get_id(), consumer);
          EXPECT_EQ(callbacks[producer], index);
          ++callbacks[producer];
          ++executed;
        });
      }
      ++completedProducers;
    });
  }

  start.set_value();
  while (completedProducers.load() != producerCount) {
    queue.flush();
    std::this_thread::yield();
  }
  for (auto& producer : producers) {
    producer.join();
  }
  queue.flush();

  EXPECT_EQ(executed, producerCount * callbacksPerProducer);
  EXPECT_EQ(callbacks, std::vector<int>(producerCount, callbacksPerProducer));
  EXPECT_FALSE(queue.hasPendingCallbacks());
}

TEST(StubQueueTest, SynchronousWorkRunsAfterPendingCallbacks) {
  StubQueue queue;
  std::vector<int> callbacks;
  queue.runOnQueue([&] { callbacks.push_back(1); });

  queue.runOnQueueSync([&] { callbacks.push_back(2); });

  EXPECT_EQ(callbacks, (std::vector<int>{1, 2}));
}

TEST(StubQueueTest, ThrowingCallbackLeavesLaterWorkDrainable) {
  StubQueue queue;
  std::vector<int> callbacks;
  queue.runOnQueue([&] {
    callbacks.push_back(1);
    throw std::runtime_error("queued failure");
  });
  queue.runOnQueue([&] { callbacks.push_back(2); });

  EXPECT_THROW(queue.flush(), std::runtime_error);
  EXPECT_TRUE(queue.hasPendingCallbacks());
  queue.flush();

  EXPECT_EQ(callbacks, (std::vector<int>{1, 2}));
  EXPECT_FALSE(queue.hasPendingCallbacks());
}

} // namespace facebook::react
