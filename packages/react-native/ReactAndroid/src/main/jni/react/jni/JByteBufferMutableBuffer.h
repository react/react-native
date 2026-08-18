/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace facebook::react {

// Wraps a direct Java ByteBuffer as a jsi::MutableBuffer for zero-copy JS
// ArrayBuffer access. The global ref keeps the Java object alive for as long as
// the JS ArrayBuffer is reachable.
//
// IMPORTANT: jsi::MutableBuffer finalizers run on the Hermes GC background
// thread, which is not attached to JNI. Destroying a jni::global_ref on an
// unattached thread calls abort(). jni::ThreadScope in the destructor attaches
// the GC thread temporarily, making the global_ref teardown safe.
class JByteBufferMutableBuffer final : public jsi::MutableBuffer {
 public:
  explicit JByteBufferMutableBuffer(jni::alias_ref<jni::JByteBuffer> byteBuffer)
      : byteBuffer_(jni::make_global(byteBuffer))
  {
  }

  ~JByteBufferMutableBuffer() override
  {
    jni::ThreadScope threadScope;
    byteBuffer_.reset();
  }

  JByteBufferMutableBuffer(const JByteBufferMutableBuffer &) = delete;
  JByteBufferMutableBuffer &operator=(const JByteBufferMutableBuffer &) = delete;
  JByteBufferMutableBuffer(JByteBufferMutableBuffer &&) = delete;
  JByteBufferMutableBuffer &operator=(JByteBufferMutableBuffer &&) = delete;

  size_t size() const override
  {
    return byteBuffer_->getDirectSize();
  }
  uint8_t *data() override
  {
    // GetDirectBufferAddress may report null for a zero-capacity direct buffer,
    // which getDirectBytes turns into an exception. An empty buffer has no bytes
    // to address, so report that directly instead.
    if (byteBuffer_->getDirectSize() == 0) {
      return nullptr;
    }
    return byteBuffer_->getDirectBytes();
  }

 private:
  jni::global_ref<jni::JByteBuffer> byteBuffer_;
};

} // namespace facebook::react
