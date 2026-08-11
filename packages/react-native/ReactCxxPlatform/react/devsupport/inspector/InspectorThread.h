/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/threading/TaskDispatchThread.h>
#include <chrono>

namespace facebook::react {

class InspectorThread {
 public:
  InspectorThread() noexcept = default;
  virtual ~InspectorThread() = default;
  InspectorThread(const InspectorThread& other) = delete;
  InspectorThread& operator=(InspectorThread& other) = delete;
  InspectorThread(InspectorThread&& other) = delete;
  InspectorThread& operator=(InspectorThread&& other) = delete;

  virtual void invokeElsePost(
      TaskDispatchThread::TaskFn&& callback,
      std::chrono::milliseconds delayMs = std::chrono::milliseconds(0)) = 0;
};

} // namespace facebook::react
