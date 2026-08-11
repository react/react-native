/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "StackTrace.h"

#include <folly/dynamic.h>
#include <jsi/jsi.h>

#include <cassert>
#include <functional>
#include <memory>
#include <string>

namespace facebook::react::jsinspector_modern {

class ConsoleTaskOrchestrator;
class RuntimeTargetDelegate;

class ConsoleTaskId {
 public:
  ConsoleTaskId() = default;
  ~ConsoleTaskId() = default;

  ConsoleTaskId(const ConsoleTaskId&) = default;
  ConsoleTaskId& operator=(const ConsoleTaskId&) = default;

  ConsoleTaskId(ConsoleTaskId&&) = default;
  ConsoleTaskId& operator=(ConsoleTaskId&&) = default;

  bool operator==(const ConsoleTaskId&) const = default;
  inline operator bool() const {
    return (bool)id_;
  }

  explicit inline operator void*() const {
    return id_;
  }

 private:
  explicit inline ConsoleTaskId(void* id) : id_(id) {
    assert(id_ != nullptr);
  }

  void* id_{nullptr};

  friend class ConsoleTaskContext;
};

class ConsoleTaskContext
    : public std::enable_shared_from_this<ConsoleTaskContext> {
 public:
  ConsoleTaskContext(
      jsi::Runtime& runtime,
      RuntimeTargetDelegate& runtimeTargetDelegate,
      std::string name);
  ~ConsoleTaskContext();

  // Can't be moved or copied: the address of `ConsoleTaskContext` is used to
  // identify this task and all corresponding invocations.
  ConsoleTaskContext(const ConsoleTaskContext&) = delete;
  ConsoleTaskContext& operator=(const ConsoleTaskContext&) = delete;

  ConsoleTaskContext(ConsoleTaskContext&&) = delete;
  ConsoleTaskContext& operator=(ConsoleTaskContext&&) = delete;

  /**
   * Unique identifier that is calculated based on the address of
   * ConsoleTaskContext.
   */
  ConsoleTaskId id() const;

  /**
   * Returns the serialized stack trace that was captured during the allocation
   * of ConsoleTaskContext.
   */
  std::optional<folly::dynamic> getSerializedStackTrace() const;

  void schedule();

 private:
  RuntimeTargetDelegate& runtimeTargetDelegate_;
  std::string name_;
  ConsoleTaskOrchestrator& orchestrator_;
  std::unique_ptr<StackTrace> stackTrace_;
};

} // namespace facebook::react::jsinspector_modern

namespace std {
template <>
struct hash<facebook::react::jsinspector_modern::ConsoleTaskId> {
  size_t operator()(
      const facebook::react::jsinspector_modern::ConsoleTaskId& id) const {
    return std::hash<void*>{}(static_cast<void*>(id));
  }
};
} // namespace std
