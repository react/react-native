/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <stack>

#include "ConsoleTaskContext.h"

namespace facebook::react::jsinspector_modern {

class ConsoleTaskOrchestrator {
 public:
  static ConsoleTaskOrchestrator& getInstance();

  ~ConsoleTaskOrchestrator() = default;

  ConsoleTaskOrchestrator(const ConsoleTaskOrchestrator&) = delete;
  ConsoleTaskOrchestrator& operator=(const ConsoleTaskOrchestrator&) = delete;

  ConsoleTaskOrchestrator(ConsoleTaskOrchestrator&&) = delete;
  ConsoleTaskOrchestrator& operator=(ConsoleTaskOrchestrator&&) = delete;

  void scheduleTask(
      ConsoleTaskId taskId,
      std::weak_ptr<ConsoleTaskContext> taskContext);
  void cancelTask(ConsoleTaskId taskId);

  void startTask(ConsoleTaskId taskId);
  void finishTask(ConsoleTaskId taskId);
  std::shared_ptr<ConsoleTaskContext> top() const;

 private:
  ConsoleTaskOrchestrator() = default;

  std::stack<ConsoleTaskId> stack_;
  std::unordered_map<ConsoleTaskId, std::weak_ptr<ConsoleTaskContext>> tasks_;
  /**
   * Protects the stack_ and tasks_ members.
   */
  mutable std::mutex mutex_;
};

} // namespace facebook::react::jsinspector_modern
