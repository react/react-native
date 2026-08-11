/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <utility>

namespace facebook::react {

template <typename Lambda>
class OnScopeExit {
 public:
  explicit OnScopeExit(const Lambda&& lambda) noexcept
      : lambda_(std::move(lambda)) {}

  // Non-movable
  OnScopeExit(const OnScopeExit&) = delete;
  OnScopeExit(OnScopeExit&&) = delete;

  // Non-copyable
  OnScopeExit& operator=(const OnScopeExit&) = delete;
  OnScopeExit& operator=(OnScopeExit&&) = delete;

  ~OnScopeExit() noexcept {
    lambda_();
  }

 private:
  Lambda lambda_;
};

} // namespace facebook::react
