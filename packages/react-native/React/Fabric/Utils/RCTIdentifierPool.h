/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <bitset>

namespace facebook::react {

template <size_t size>
class RCTIdentifierPool {
 public:
  void enqueue(int index) {
    usage[index] = false;
  }

  int dequeue() {
    while (true) {
      if (!usage[lastIndex]) {
        usage[lastIndex] = true;
        return lastIndex;
      }
      lastIndex = (lastIndex + 1) % size;
    }
  }

  void reset() {
    for (int i = 0; i < size; i++) {
      usage[i] = false;
    }
  }

 private:
  std::bitset<size> usage;
  int lastIndex;
};

} // namespace facebook::react
