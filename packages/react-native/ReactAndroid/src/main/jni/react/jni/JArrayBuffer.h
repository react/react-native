/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace facebook::react {

// JNI side of com.facebook.react.bridge.ArrayBuffer.
//
// When owningBytes_ is true, the module may retain the buffer and return it to
// JS without copying. When false, the bytes were borrowed from a JS-heap
// ArrayBuffer for a synchronous call only.
class JArrayBuffer : public jni::HybridClass<JArrayBuffer> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ArrayBuffer;";

  static void registerNatives();

  // JS ArrayBuffer with a native MutableBuffer (tryGetMutableBuffer). Retain
  // the owner so the bytes stay valid after the call.
  static jni::local_ref<javaobject> createOwning(std::shared_ptr<jsi::MutableBuffer> buffer);

  // JS-heap bytes passed to a synchronous call. Zero-copy for the call only;
  // do not retain the result.
  static jni::local_ref<javaobject> createUnowned(void *bytes, size_t size);

  // Copy JS-heap bytes into a new owned buffer. Used for async/promise calls
  // and anywhere the module needs its own copy of the data.
  static jni::local_ref<javaobject> createOwned(const void *bytes, size_t size);

  // Convert a module return value for rt.createArrayBuffer. Owning buffers pass
  // through; borrowed ones are copied because createArrayBuffer needs its own
  // backing store. Raises a jsi::JSError if the buffer has no native peer or
  // its borrow has been revoked.
  static std::shared_ptr<jsi::MutableBuffer> toJSBuffer(jsi::Runtime &runtime, jni::alias_ref<javaobject> arrayBuffer);

  // Revokes access to borrowed bytes. Called when the call frame that lent the
  // bytes unwinds, so a module that retained a non-owning ArrayBuffer gets an
  // exception instead of reading memory the JS heap has moved or freed. Owning
  // buffers are unaffected.
  void invalidate() noexcept;

  // The bytes this buffer was created over. Throws if a borrow has since been
  // revoked by invalidate().
  const std::shared_ptr<jsi::MutableBuffer> &mutableBuffer() const;

  // Whether the bytes are still reachable, i.e. this is an owning buffer or a
  // borrow that invalidate() has not revoked.
  bool hasBytes() const noexcept
  {
    return buffer_ != nullptr;
  }

  bool isOwningBytes() const noexcept
  {
    return owningBytes_;
  }

  JArrayBuffer(std::shared_ptr<jsi::MutableBuffer> buffer, bool owningBytes) noexcept
      : buffer_(std::move(buffer)), owningBytes_(owningBytes)
  {
  }

 private:
  friend HybridBase;

  static void
  initHybrid(jni::alias_ref<jhybridobject> jobj, jni::alias_ref<jni::JByteBuffer> buffer, jboolean owningBytes);

  jboolean isBytesValid();

  static jni::local_ref<javaobject>
  create(jni::local_ref<jni::JByteBuffer> byteBuffer, std::shared_ptr<jsi::MutableBuffer> buffer, bool owningBytes);

  std::shared_ptr<jsi::MutableBuffer> buffer_;
  bool owningBytes_;
};

} // namespace facebook::react
