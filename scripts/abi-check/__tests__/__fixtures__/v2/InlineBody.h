/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

class InlineBody {
 public:
  int next() const {
    int step = 2;
    return value_ + step;
  }

 private:
  int value_;
};

} // namespace facebook::react
