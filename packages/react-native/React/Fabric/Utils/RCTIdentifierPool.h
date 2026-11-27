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
  void enqueue(int index)
  {
    usage[index] = false;
  }

  int dequeue()
  {
    for (size_t attempt = 0; attempt < size; attempt++) {
      if (!usage[lastIndex]) {
        usage[lastIndex] = true;
        return lastIndex;
      }
      lastIndex = (lastIndex + 1) % size;
    }

    // Every identifier is taken, which only happens when identifiers were leaked.
    // Reclaim them all instead of scanning forever: a reused identifier is a
    // transient glitch, while an endless loop here hangs the main thread.
    usage.reset();
    usage[lastIndex] = true;
    return lastIndex;
  }

  void reset()
  {
    for (int i = 0; i < size; i++) {
      usage[i] = false;
    }
  }

 private:
  std::bitset<size> usage;
  int lastIndex{0};
};

} // namespace facebook::react
