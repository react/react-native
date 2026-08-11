/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <chrono>
#include <iostream>
#include <memory>

namespace facebook::react {

struct HeapInfo {
  int64_t allocatedBytes{0};
  int64_t heapSize{0};
  int64_t numCollections{0};
};

inline std::ostream& operator<<(std::ostream& os, HeapInfo& heapInfo) {
  os << "[heapInfo: allocatedBytes: " << heapInfo.allocatedBytes
     << ", heapSize: " << heapInfo.heapSize
     << ", numCollections: " << heapInfo.numCollections << "]";
  return os;
}

class RuntimeHeapInfoCollector {
 public:
  RuntimeHeapInfoCollector(std::chrono::milliseconds intervalMs);

  static std::unique_ptr<RuntimeHeapInfoCollector> create(
      std::chrono::milliseconds intervalMs);

  void collectHeapInfo(jsi::Runtime& runtime);

  HeapInfo getHeapInfo() {
    return heapInfo_;
  }

 private:
  HeapInfo heapInfo_{};
  std::chrono::milliseconds intervalMs_;
  std::chrono::steady_clock::time_point lastCollectionTime_;
};
} // namespace facebook::react
