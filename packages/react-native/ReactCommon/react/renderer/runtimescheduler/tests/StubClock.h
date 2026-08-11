/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/timing/primitives.h>

namespace facebook::react {

class StubClock {
 public:
  HighResTimeStamp getNow() const {
    return timePoint_;
  }

  void setTimePoint(HighResTimeStamp timePoint) {
    timePoint_ = timePoint;
  }

  HighResTimeStamp getTimePoint() {
    return timePoint_;
  }

  void advanceTimeBy(HighResDuration duration) {
    timePoint_ += duration;
  }

 private:
  HighResTimeStamp timePoint_ = HighResTimeStamp::now();
};

} // namespace facebook::react
