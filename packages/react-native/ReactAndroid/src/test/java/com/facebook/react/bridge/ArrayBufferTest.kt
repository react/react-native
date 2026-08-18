/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.testutils.shadows.ShadowArrayBuffer
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import java.nio.ByteBuffer
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows = [ShadowSoLoader::class, ShadowNativeLoader::class, ShadowArrayBuffer::class],
)
class ArrayBufferTest {

  @Test
  fun constructorAllocatesZeroFilledBytes() {
    val buffer = ArrayBuffer(4)

    assertThat(buffer.size).isEqualTo(4)
    assertThat(buffer.bytes.isDirect).isTrue()
    assertThat(bytesOf(buffer)).containsExactly(0, 0, 0, 0)
    assertThat(buffer.isOwningBytes).isTrue()
  }

  @Test
  fun constructorAcceptsZeroLength() {
    val buffer = ArrayBuffer(0)

    assertThat(buffer.size).isEqualTo(0)
    assertThat(buffer.bytes.capacity()).isEqualTo(0)
  }

  @Test
  fun constructorRejectsNegativeSize() {
    assertThatThrownBy { ArrayBuffer(-1) }
        .isInstanceOf(IllegalArgumentException::class.java)
        .hasMessageContaining("must not be negative")
  }

  @Test
  fun arrayBufferWithLengthMatchesConstructor() {
    val buffer = ArrayBuffer.arrayBufferWithLength(3)

    assertThat(buffer.size).isEqualTo(3)
    assertThat(buffer.isOwningBytes).isTrue()
  }

  @Test
  fun sizeIsCapacityAndIgnoresPositionAndLimit() {
    val buffer = ArrayBuffer(4)
    buffer.bytes.position(1)
    buffer.bytes.limit(2)

    assertThat(buffer.size).isEqualTo(4)
  }

  @Test
  fun bytesReturnsTheSameSharedBuffer() {
    val buffer = ArrayBuffer(2)

    assertThat(buffer.bytes).isSameAs(buffer.bytes)
  }

  @Test
  fun copiesByteArray() {
    val buffer = ArrayBuffer.arrayBufferWithCopiedBytes(byteArrayOf(1, 2, 3))

    assertThat(buffer.size).isEqualTo(3)
    assertThat(bytesOf(buffer)).containsExactly(1, 2, 3)
    assertThat(buffer.isOwningBytes).isTrue()
  }

  @Test
  fun copiesEmptyByteArray() {
    val buffer = ArrayBuffer.arrayBufferWithCopiedBytes(ByteArray(0))

    assertThat(buffer.size).isEqualTo(0)
  }

  @Test
  fun copiesRemainingBytesOfByteBuffer() {
    val source = ByteBuffer.allocateDirect(5)
    source.put(byteArrayOf(1, 2, 3, 4, 5))
    source.position(1)
    source.limit(4)

    val buffer = ArrayBuffer.arrayBufferWithCopiedBytes(source)

    assertThat(buffer.size).isEqualTo(3)
    assertThat(bytesOf(buffer)).containsExactly(2, 3, 4)
    // The source position and limit are left untouched.
    assertThat(source.position()).isEqualTo(1)
    assertThat(source.limit()).isEqualTo(4)
  }

  @Test
  fun copiesFromNonDirectByteBuffer() {
    val source = ByteBuffer.wrap(byteArrayOf(7, 8))

    val buffer = ArrayBuffer.arrayBufferWithCopiedBytes(source)

    assertThat(bytesOf(buffer)).containsExactly(7, 8)
    assertThat(buffer.bytes.isDirect).isTrue()
  }

  @Test
  fun copiesAllBytesOfArrayBufferRegardlessOfPositionAndLimit() {
    val source = ArrayBuffer.arrayBufferWithCopiedBytes(byteArrayOf(1, 2, 3, 4))
    source.bytes.position(2)
    source.bytes.limit(3)

    val buffer = ArrayBuffer.arrayBufferWithCopiedBytes(source)

    assertThat(buffer.size).isEqualTo(4)
    assertThat(bytesOf(buffer)).containsExactly(1, 2, 3, 4)
  }

  @Test
  fun copyOfArrayBufferDoesNotAliasTheSource() {
    val source = ArrayBuffer.arrayBufferWithCopiedBytes(byteArrayOf(1, 2))

    val buffer = ArrayBuffer.arrayBufferWithCopiedBytes(source)
    source.bytes.put(0, 9)

    assertThat(bytesOf(buffer)).containsExactly(1, 2)
  }

  @Test
  fun copiesZeroLengthArrayBuffer() {
    val buffer = ArrayBuffer.arrayBufferWithCopiedBytes(ArrayBuffer(0))

    assertThat(buffer.size).isEqualTo(0)
  }

  @Test
  fun aliasesOwnedDirectByteBuffer() {
    val source = ByteBuffer.allocateDirect(2)
    source.put(byteArrayOf(1, 2))

    val buffer = ArrayBuffer.arrayBufferWithOwnedBytes(source)
    source.put(0, 9)

    assertThat(buffer.bytes).isSameAs(source)
    assertThat(buffer.bytes.get(0)).isEqualTo(9.toByte())
    assertThat(buffer.isOwningBytes).isTrue()
  }

  @Test
  fun arrayBufferWithOwnedBytesRejectsNonDirectByteBuffer() {
    assertThatThrownBy {
          ArrayBuffer.arrayBufferWithOwnedBytes(ByteBuffer.wrap(byteArrayOf(1, 2)))
        }
        .isInstanceOf(IllegalArgumentException::class.java)
        .hasMessageContaining("requires a direct ByteBuffer")
  }

  /**
   * Once the native peer revokes a borrow — which it does when the method that received a
   * non-owning [ArrayBuffer] returns — reading the bytes must fail loudly instead of touching freed
   * memory.
   */
  @Test
  fun accessingBytesAfterTheBorrowIsRevokedThrows() {
    val buffer = ArrayBuffer(4)
    ShadowArrayBuffer.invalidate(buffer)

    assertThatThrownBy { buffer.bytes }
        .isInstanceOf(IllegalStateException::class.java)
        .hasMessageContaining("non-owning ArrayBuffer")
    assertThatThrownBy { buffer.size }
        .isInstanceOf(IllegalStateException::class.java)
        .hasMessageContaining("non-owning ArrayBuffer")
  }

  private fun bytesOf(buffer: ArrayBuffer): ByteArray {
    val view = buffer.bytes.duplicate()
    view.position(0)
    view.limit(buffer.size)
    val bytes = ByteArray(view.remaining())
    view.get(bytes)
    return bytes
  }
}
