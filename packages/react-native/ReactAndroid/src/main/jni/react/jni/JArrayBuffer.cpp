/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JArrayBuffer.h"

#include <cstring>
#include <span>
#include <stdexcept>
#include <utility>
#include <vector>

#include <react/bridging/ArrayBuffer.h>

#include "JByteBufferMutableBuffer.h"

namespace facebook::react {

namespace {

const char* const kRevokedBorrowMessage =
    "com.facebook.react.bridge.ArrayBuffer: the bytes of a non-owning ArrayBuffer "
    "were accessed after the method that received it returned. Copy them with "
    "ArrayBuffer.arrayBufferWithCopiedBytes() to use them later.";

} // namespace

void JArrayBuffer::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JArrayBuffer::initHybrid),
      makeNativeMethod("isBytesValid", JArrayBuffer::isBytesValid),
  });
}

void JArrayBuffer::initHybrid(
    jni::alias_ref<jhybridobject> jobj,
    jni::alias_ref<jni::JByteBuffer> buffer,
    jboolean owningBytes) {
  setCxxInstance(
      jobj,
      std::make_shared<JByteBufferMutableBuffer>(buffer),
      owningBytes != JNI_FALSE);
}

jboolean JArrayBuffer::isBytesValid() {
  return hasBytes() ? JNI_TRUE : JNI_FALSE;
}

void JArrayBuffer::invalidate() noexcept {
  if (!owningBytes_) {
    buffer_.reset();
  }
}

const std::shared_ptr<jsi::MutableBuffer>& JArrayBuffer::mutableBuffer() const {
  if (!hasBytes()) {
    throw std::runtime_error(kRevokedBorrowMessage);
  }
  return buffer_;
}

jni::local_ref<JArrayBuffer::javaobject> JArrayBuffer::create(
    jni::local_ref<jni::JByteBuffer> byteBuffer,
    std::shared_ptr<jsi::MutableBuffer> buffer,
    bool owningBytes) {
  auto cxxPart = std::make_unique<JArrayBuffer>(std::move(buffer), owningBytes);
  auto javaPart = newObjectJavaArgs(byteBuffer, owningBytes);
  setNativePointer(javaPart, std::move(cxxPart));
  return javaPart;
}

jni::local_ref<JArrayBuffer::javaobject> JArrayBuffer::createOwning(
    std::shared_ptr<jsi::MutableBuffer> buffer) {
  auto byteBuffer = jni::JByteBuffer::wrapBytes(buffer->data(), buffer->size());
  return create(std::move(byteBuffer), std::move(buffer), true);
}

jni::local_ref<JArrayBuffer::javaobject> JArrayBuffer::createUnowned(
    void* bytes,
    size_t size) {
  auto byteBuffer =
      jni::JByteBuffer::wrapBytes(static_cast<uint8_t*>(bytes), size);
  auto buffer = std::make_shared<JByteBufferMutableBuffer>(byteBuffer);
  return create(std::move(byteBuffer), std::move(buffer), false);
}

jni::local_ref<JArrayBuffer::javaobject> JArrayBuffer::createOwned(
    const void* bytes,
    size_t size) {
  auto byteBuffer = jni::JByteBuffer::allocateDirect(static_cast<jint>(size));
  if (size > 0 && bytes != nullptr) {
    // @lint-ignore CLANGSECURITY facebook-security-vulnerable-memcpy
    std::memcpy(byteBuffer->getDirectBytes(), bytes, size);
  }

  auto buffer = std::make_shared<JByteBufferMutableBuffer>(byteBuffer);
  return create(std::move(byteBuffer), std::move(buffer), true);
}

std::shared_ptr<jsi::MutableBuffer> JArrayBuffer::toJSBuffer(
    jsi::Runtime& runtime,
    jni::alias_ref<javaobject> arrayBuffer) {
  auto* self = arrayBuffer->cthis();
  // create() runs the Kotlin constructor before setNativePointer, so a Java
  // ArrayBuffer without a C++ peer is reachable if either step throws.
  if (self == nullptr) {
    throw jsi::JSError(
        runtime, "com.facebook.react.bridge.ArrayBuffer has no native peer.");
  }
  if (!self->hasBytes()) {
    throw jsi::JSError(runtime, kRevokedBorrowMessage);
  }

  const auto& buffer = self->mutableBuffer();
  if (self->owningBytes_) {
    return buffer;
  }

  // Borrowed bytes still belong to the inbound JS ArrayBuffer; copy them before
  // handing a new buffer back to JS.
  auto bytes = std::span<uint8_t>(buffer->data(), buffer->size());
  return std::make_shared<detail::OwnedBytesBuffer>(
      std::vector<uint8_t>(bytes.begin(), bytes.end()));
}

} // namespace facebook::react
