/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/bridging/ArrayBuffer.h>

#include <atomic>
#include <span>
#include <string>

namespace facebook::react::detail {

void throwIfDetached(
    jsi::Runtime& rt,
    const jsi::ArrayBuffer& buffer,
    const char* callerName) {
  // Latched the first time a runtime rejects the check, so the property get and
  // the thrown-and-caught exception are paid once rather than per conversion.
  // Process-wide because every runtime in a process shares one engine build.
  static std::atomic<bool> unsupported{false};
  if (unsupported.load(std::memory_order_relaxed)) {
    return;
  }

  bool detached = false;
  try {
    detached = buffer.detached(rt);
  } catch (const jsi::JSINativeException&) {
    unsupported.store(true, std::memory_order_relaxed);
    return;
  }
  if (detached) {
    throw jsi::JSError(
        rt, std::string(callerName) + ": ArrayBuffer is detached");
  }
}

std::shared_ptr<jsi::MutableBuffer> copyToOwnedBuffer(
    const uint8_t* bytes,
    size_t size) {
  if (size == 0) {
    return std::make_shared<OwnedBytesBuffer>(std::vector<uint8_t>{});
  }
  auto span = std::span<const uint8_t>(bytes, size);
  return std::make_shared<OwnedBytesBuffer>(
      std::vector<uint8_t>(span.begin(), span.end()));
}

} // namespace facebook::react::detail
