/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace facebook::react::jsinspector_modern {

class ConsoleTaskContext;
class RuntimeTargetDelegate;
class ConsoleTaskOrchestrator;

class ConsoleTask {
 public:
  /**
   * \param runtimeTargetDelegate The delegate to the corresponding runtime.
   * \param taskContext The context that tracks the task.
   */
  explicit ConsoleTask(std::shared_ptr<ConsoleTaskContext> taskContext);
  ~ConsoleTask();

  ConsoleTask(const ConsoleTask&) = default;
  ConsoleTask& operator=(const ConsoleTask&) = delete;

  ConsoleTask(ConsoleTask&&) = default;
  ConsoleTask& operator=(ConsoleTask&&) = delete;

 private:
  std::shared_ptr<ConsoleTaskContext> taskContext_;
  ConsoleTaskOrchestrator& orchestrator_;
};

} // namespace facebook::react::jsinspector_modern
