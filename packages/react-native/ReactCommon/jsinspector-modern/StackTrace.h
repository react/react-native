/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * An opaque representation of a stack trace.
 */
class StackTrace {
 public:
  /**
   * Constructs an empty stack trace.
   */
  static inline std::unique_ptr<StackTrace> empty() {
    return std::make_unique<StackTrace>();
  }

  /**
   * Constructs an empty stack trace.
   */
  StackTrace() = default;

  StackTrace(const StackTrace&) = delete;
  StackTrace& operator=(const StackTrace&) = delete;
  StackTrace(StackTrace&&) = delete;
  StackTrace& operator=(StackTrace&&) = delete;

  virtual ~StackTrace() = default;
};

} // namespace facebook::react::jsinspector_modern
