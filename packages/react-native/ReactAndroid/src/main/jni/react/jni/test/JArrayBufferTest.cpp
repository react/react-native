/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/jni/JArrayBuffer.h>
#include <react/jni/JByteBufferMutableBuffer.h>

#include <gtest/gtest.h>

#include <cstdint>
#include <cstring>
#include <memory>
#include <vector>

namespace facebook::react {

namespace {

class TestBuffer final : public jsi::MutableBuffer {
 public:
  explicit TestBuffer(std::vector<uint8_t> bytes) noexcept
      : bytes_(std::move(bytes)) {}

  size_t size() const override {
    return bytes_.size();
  }

  uint8_t* data() override {
    return bytes_.data();
  }

 private:
  std::vector<uint8_t> bytes_;
};

} // namespace

/*
 * The static factories and toJSBuffer all need a live JavaVM, so the coverage
 * available host-side is the ownership state machine itself: which buffers
 * invalidate() may revoke, and whether mutableBuffer() reports a revoked borrow
 * instead of handing out a dangling pointer. The JNI section at the bottom of
 * this file covers the direct-ByteBuffer adapter on device.
 */

TEST(JArrayBufferTest, owningBufferExposesItsBytes) {
  auto buffer = std::make_shared<TestBuffer>(std::vector<uint8_t>{1, 2, 3});
  JArrayBuffer arrayBuffer{buffer, true};

  EXPECT_TRUE(arrayBuffer.isOwningBytes());
  EXPECT_EQ(arrayBuffer.mutableBuffer(), buffer);
}

TEST(JArrayBufferTest, borrowedBufferExposesItsBytesBeforeInvalidation) {
  auto buffer = std::make_shared<TestBuffer>(std::vector<uint8_t>{1, 2, 3});
  JArrayBuffer arrayBuffer{buffer, false};

  EXPECT_FALSE(arrayBuffer.isOwningBytes());
  EXPECT_EQ(arrayBuffer.mutableBuffer(), buffer);
}

/*
 * Bug this catches: without the revocation, a module that stored a non-owning
 * ArrayBuffer keeps a direct ByteBuffer over JS-heap bytes that the call frame
 * no longer keeps alive, and every later read silently returns whatever now
 * occupies that memory.
 */
TEST(JArrayBufferTest, invalidateRevokesABorrow) {
  auto buffer = std::make_shared<TestBuffer>(std::vector<uint8_t>{1, 2, 3});
  JArrayBuffer arrayBuffer{buffer, false};

  arrayBuffer.invalidate();

  EXPECT_THROW(arrayBuffer.mutableBuffer(), std::runtime_error);
}

TEST(JArrayBufferTest, invalidateLeavesAnOwningBufferUsable) {
  auto buffer = std::make_shared<TestBuffer>(std::vector<uint8_t>{1, 2, 3});
  JArrayBuffer arrayBuffer{buffer, true};

  arrayBuffer.invalidate();

  EXPECT_EQ(arrayBuffer.mutableBuffer(), buffer);
}

TEST(JArrayBufferTest, invalidateIsIdempotent) {
  auto buffer = std::make_shared<TestBuffer>(std::vector<uint8_t>{1, 2, 3});
  JArrayBuffer arrayBuffer{buffer, false};

  arrayBuffer.invalidate();
  arrayBuffer.invalidate();

  EXPECT_THROW(arrayBuffer.mutableBuffer(), std::runtime_error);
}

// Revoking a borrow must drop the last reference this object holds, so an
// aliasing adapter (and the JNI global ref inside it) is torn down with the
// call frame rather than at the whim of the Java GC.
TEST(JArrayBufferTest, invalidateReleasesTheBorrowedBuffer) {
  auto buffer = std::make_shared<TestBuffer>(std::vector<uint8_t>{1, 2, 3});
  std::weak_ptr<jsi::MutableBuffer> weakBuffer = buffer;
  JArrayBuffer arrayBuffer{std::move(buffer), false};

  arrayBuffer.invalidate();

  EXPECT_TRUE(weakBuffer.expired());
}

#ifdef __ANDROID__

/*
 * JByteBufferMutableBuffer is the adapter every ArrayBuffer is built on, and it
 * is pure JNI: size() and data() read a direct java.nio.ByteBuffer. That needs
 * a live JavaVM, so it is only reachable in the on-device variant of this
 * target.
 *
 * The Kotlin peer itself is not testable here — this APK carries no RN Java
 * classes — so ArrayBuffer.kt stays covered by the Robolectric test.
 */

TEST(JByteBufferMutableBufferTest, exposesTheAddressAndSizeOfADirectBuffer) {
  auto byteBuffer = jni::JByteBuffer::allocateDirect(4);
  auto* bytes = byteBuffer->getDirectBytes();
  const uint8_t expected[] = {1, 2, 3, 4};
  std::memcpy(bytes, expected, sizeof(expected));

  JByteBufferMutableBuffer buffer{byteBuffer};

  EXPECT_EQ(buffer.size(), sizeof(expected));
  EXPECT_EQ(buffer.data(), bytes);
  EXPECT_EQ(std::memcmp(buffer.data(), expected, sizeof(expected)), 0);
}

TEST(JByteBufferMutableBufferTest, aliasesWrappedBytesWithoutCopying) {
  uint8_t bytes[] = {1, 2, 3, 4};
  auto byteBuffer = jni::JByteBuffer::wrapBytes(bytes, sizeof(bytes));

  JByteBufferMutableBuffer buffer{byteBuffer};

  EXPECT_EQ(buffer.data(), bytes);
  EXPECT_EQ(buffer.size(), sizeof(bytes));
}

/*
 * Bug this catches: GetDirectBufferAddress reports null for a zero-capacity
 * direct buffer, and getDirectBytes turns that into a JNI exception. Without
 * the short-circuit in data(), a zero-length ArrayBuffer — which JS can hand a
 * TurboModule at any time — throws out of a path that has no business failing.
 */
TEST(JByteBufferMutableBufferTest, reportsNoDataForAnEmptyBuffer) {
  auto byteBuffer = jni::JByteBuffer::allocateDirect(0);

  JByteBufferMutableBuffer buffer{byteBuffer};

  EXPECT_EQ(buffer.size(), 0u);
  EXPECT_EQ(buffer.data(), nullptr);
}

#endif // __ANDROID__

} // namespace facebook::react
