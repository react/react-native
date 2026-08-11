/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cxxreact/MessageQueueThread.h>
#include <react/threading/TaskDispatchThread.h>
#include <memory>

namespace facebook::react {

using MessageQueueThreadFactory =
    std::function<std::shared_ptr<MessageQueueThread>()>;

constexpr char MessageQueueThreadFactoryKey[] = "MessageQueueThreadFactoryKey";

/**
 * MessageQueueThread implementation that uses a TaskDispatchThread for
 * queueing and threading logic
 */
class MessageQueueThreadImpl : public MessageQueueThread {
 public:
  MessageQueueThreadImpl() noexcept = default;
  explicit MessageQueueThreadImpl(int priorityOffset) noexcept
      : taskDispatchThread_("MessageQueue", priorityOffset) {}

  ~MessageQueueThreadImpl() noexcept override = default;

  /** Add a job to the queue asynchronously */
  void runOnQueue(std::function<void()>&& runnable) override;

  /**
   * Add a job to the queue synchronously - call won't return until runnable
   * has completed.  Will run immediately if called from the looper thread.
   * Should only be used for initialization.
   */
  void runOnQueueSync(std::function<void()>&& runnable) override;

  /**
   * Stop the message queue thread. Should only be used for cleanup - once it
   * returns, no further work should run on the queue.
   */
  void quitSynchronous() override;

 private:
  TaskDispatchThread taskDispatchThread_{"MessageQueue"};
};

} // namespace facebook::react
