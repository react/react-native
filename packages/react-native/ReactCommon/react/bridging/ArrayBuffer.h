/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <span>
#include <string>

#include <react/bridging/Base.h>

namespace facebook::react {

namespace detail {

/**
 * An owning implementation of jsi::MutableBuffer backed by a std::vector.
 * Use this when the source of the bytes cannot be guaranteed to outlive the
 * buffer (for example, returning data to JS from an asynchronous native call,
 * or copying a JS ArrayBuffer argument before storing it).
 */
class OwnedBytesBuffer final : public jsi::MutableBuffer {
 public:
  explicit OwnedBytesBuffer(std::vector<uint8_t> bytes) noexcept : bytes_(std::move(bytes)) {}

  size_t size() const override
  {
    return bytes_.size();
  }

  uint8_t *data() override
  {
    return bytes_.data();
  }

 private:
  std::vector<uint8_t> bytes_;
};

} // namespace detail

template <>
struct Bridging<jsi::ArrayBuffer> {
  static jsi::ArrayBuffer fromJs(jsi::Runtime &rt, const jsi::Object &obj)
  {
    if (!obj.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Expected ArrayBuffer");
    }
    return obj.getArrayBuffer(rt);
  }

  static jsi::Value toJs(jsi::Runtime &rt, jsi::ArrayBuffer buf)
  {
    return {rt, buf};
  }
};

/* AsyncArrayBuffer holds ArrayBuffer bytes for use off the JS thread. Move-only.
 *
 * Always backed by a shared_ptr<jsi::MutableBuffer>: either one borrowed from
 * a native-backed jsi::ArrayBuffer or an internal adapter wrapping owned
 * bytes. May outlive the TurboModule call and be transferred across threads;
 * concurrent reads and writes to the buffer contents (the bytes returned by
 * data()) must be synchronized externally.
 */
class AsyncArrayBuffer {
 public:
  AsyncArrayBuffer(const AsyncArrayBuffer &) = delete;
  AsyncArrayBuffer &operator=(const AsyncArrayBuffer &) = delete;
  AsyncArrayBuffer(AsyncArrayBuffer &&) noexcept = default;
  AsyncArrayBuffer &operator=(AsyncArrayBuffer &&) noexcept = default;
  ~AsyncArrayBuffer() = default;

  // Zero-copy if the input has a native MutableBuffer; copies otherwise.
  static AsyncArrayBuffer acquire(jsi::Runtime &rt, const jsi::ArrayBuffer &buffer)
  {
    throwIfDetached(rt, buffer, "AsyncArrayBuffer::acquire");
    if (auto mutableBuf = buffer.tryGetMutableBuffer(rt)) {
      return AsyncArrayBuffer{std::move(mutableBuf)};
    }
    return copyBytes(rt, buffer);
  }

  // Zero-copy. Throws if the input has no native MutableBuffer.
  static AsyncArrayBuffer borrow(jsi::Runtime &rt, const jsi::ArrayBuffer &buffer)
  {
    throwIfDetached(rt, buffer, "AsyncArrayBuffer::borrow");
    auto mutableBuf = buffer.tryGetMutableBuffer(rt);
    if (!mutableBuf) {
      throw jsi::JSError(
          rt,
          "AsyncArrayBuffer::borrow: ArrayBuffer has no native MutableBuffer. "
          "Use AsyncArrayBuffer::acquire(rt, buffer) when the buffer origin is unknown.");
    }
    return AsyncArrayBuffer{std::move(mutableBuf)};
  }

  // Always copies.
  static AsyncArrayBuffer copy(jsi::Runtime &rt, const jsi::ArrayBuffer &buffer)
  {
    throwIfDetached(rt, buffer, "AsyncArrayBuffer::copy");
    return copyBytes(rt, buffer);
  }

  // Wraps an existing MutableBuffer. Safe to call from any thread.
  static AsyncArrayBuffer wrap(std::shared_ptr<jsi::MutableBuffer> buffer) noexcept
  {
    return AsyncArrayBuffer{std::move(buffer)};
  }

  // Takes ownership of a byte vector. Safe to call from any thread.
  static AsyncArrayBuffer wrap(std::vector<uint8_t> bytes)
  {
    return AsyncArrayBuffer{std::make_shared<detail::OwnedBytesBuffer>(std::move(bytes))};
  }

  uint8_t *data() noexcept
  {
    return buffer_->data();
  }

  const uint8_t *data() const noexcept
  {
    return buffer_->data();
  }

  size_t size() const noexcept
  {
    return buffer_->size();
  }

  // Returns the underlying MutableBuffer. Used by
  // Bridging<AsyncArrayBuffer>::toJs to hand the buffer back to JS without a
  // copy. Always non-null.
  std::shared_ptr<jsi::MutableBuffer> getMutableBuffer() const noexcept
  {
    return buffer_;
  }

 private:
  explicit AsyncArrayBuffer(std::shared_ptr<jsi::MutableBuffer> buffer) noexcept : buffer_{std::move(buffer)} {}

  static AsyncArrayBuffer copyBytes(jsi::Runtime &rt, const jsi::ArrayBuffer &buffer)
  {
    auto bytes = std::span(buffer.data(rt), buffer.size(rt));
    return wrap(std::vector<uint8_t>(bytes.begin(), bytes.end()));
  }

  // Best-effort detached check. jsi::ArrayBuffer::detached relies on the JS-level
  // `detached` property, which some runtimes (e.g. Hermes) don't implement and
  // signal by throwing. In that case we silently skip the check rather than
  // surfacing a confusing error from an unrelated method.
  static void throwIfDetached(jsi::Runtime &rt, const jsi::ArrayBuffer &buffer, const char *callerName)
  {
    bool detached = false;
    try {
      detached = buffer.detached(rt);
    } catch (const jsi::JSINativeException &) {
      return;
    }
    if (detached) {
      throw jsi::JSError(rt, std::string(callerName) + ": ArrayBuffer is detached");
    }
  }

  std::shared_ptr<jsi::MutableBuffer> buffer_;
};

template <>
struct Bridging<AsyncArrayBuffer> {
  static jsi::Value toJs(jsi::Runtime &rt, AsyncArrayBuffer buffer)
  {
    return {rt, rt.createArrayBuffer(buffer.getMutableBuffer())};
  }
};

} // namespace facebook::react
