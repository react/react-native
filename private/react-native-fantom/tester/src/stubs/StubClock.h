/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>

namespace facebook::react {

class StubClock {
 public:
  static std::chrono::steady_clock::time_point now() {
    return timePoint_;
  }

  static void advanceTimeBy(std::chrono::steady_clock::duration duration) {
    timePoint_ += duration;
  }

 private:
  static std::chrono::steady_clock::time_point timePoint_;
};

std::chrono::steady_clock::time_point facebook::react::StubClock::timePoint_ =
    std::chrono::steady_clock::now();

} // namespace facebook::react
