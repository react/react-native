/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>

class MockClock {
 public:
  using time_point = std::chrono::
      time_point<std::chrono::steady_clock, std::chrono::nanoseconds>;

  static time_point now() noexcept {
    return time_;
  }

  template <typename TDuration>
  static void advance_by(const TDuration duration) {
    time_ += duration;
  }

 private:
  static time_point time_;
};
