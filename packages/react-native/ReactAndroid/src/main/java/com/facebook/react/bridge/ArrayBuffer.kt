/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip
import java.nio.ByteBuffer

/**
 * A fixed-length byte buffer for TurboModule `ArrayBuffer` arguments and return values.
 *
 * Returning an owning [ArrayBuffer] to JS produces a *new* JS `ArrayBuffer` object over the same
 * bytes, so a module that mutates an argument in place and returns it gives JS a different object
 * that aliases the memory it passed in. Returning a non-owning [ArrayBuffer] gives JS a copy.
 *
 * @property isOwningBytes:
 * - `true` — safe to retain and return to JS. Synchronize externally if JS may touch the same
 *   memory concurrently.
 * - `false` — the bytes are borrowed from a JS `ArrayBuffer` and are only valid until the method
 *   that received this [ArrayBuffer] returns. After that, [bytes] and [size] throw. Copy with
 *   [arrayBufferWithCopiedBytes] to keep them.
 */
@DoNotStrip
public class ArrayBuffer : HybridClassBase {

  private val buffer: ByteBuffer

  /** Whether this buffer owns its bytes. See the class documentation. */
  public val isOwningBytes: Boolean

  @DoNotStrip
  private constructor(buffer: ByteBuffer, isOwningBytes: Boolean) : super() {
    this.buffer = buffer
    this.isOwningBytes = isOwningBytes
  }

  /** @param size number of zero-filled bytes to allocate */
  public constructor(size: Int) : this(allocateDirect(size), true) {
    initHybrid(buffer, isOwningBytes)
  }

  /**
   * The bytes as a direct [ByteBuffer]. The buffer is shared, not a copy: its position and limit
   * belong to the caller, so duplicate it rather than relying on where a previous reader left it.
   *
   * Reading this property is the only access path that is checked against revocation, and the
   * returned [ByteBuffer] is not. Its address cannot be cleared once handed out, so a [ByteBuffer]
   * kept past the method that received a non-owning [ArrayBuffer] reads freed or relocated memory
   * with no exception to warn you. Do not store it, and do not let it outlive the [ArrayBuffer] it
   * came from: retain the [ArrayBuffer] and read [bytes] again, or copy the bytes with
   * [arrayBufferWithCopiedBytes].
   *
   * @throws IllegalStateException if the bytes were borrowed and the method that received this
   *   [ArrayBuffer] has already returned. See [isOwningBytes].
   */
  public val bytes: ByteBuffer
    get() {
      checkBytesValid()
      return buffer
    }

  /**
   * The capacity of the buffer in bytes, independent of the position and limit of [bytes].
   *
   * @throws IllegalStateException if the bytes were borrowed and the method that received this
   *   [ArrayBuffer] has already returned. See [isOwningBytes].
   */
  public val size: Int
    get() {
      checkBytesValid()
      return buffer.capacity()
    }

  private fun checkBytesValid() {
    check(isBytesValid()) {
      "ArrayBuffer: the bytes of a non-owning ArrayBuffer were accessed after the method " +
          "that received it returned. Copy them with " +
          "ArrayBuffer.arrayBufferWithCopiedBytes() to use them later."
    }
  }

  private external fun initHybrid(buffer: ByteBuffer, isOwningBytes: Boolean)

  private external fun isBytesValid(): Boolean

  public companion object {
    init {
      ReactNativeJniCommonSoLoader.staticInit()
    }

    /** @param size number of zero-filled bytes to allocate. Same as `ArrayBuffer(size)`. */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithLength(size: Int): ArrayBuffer = ArrayBuffer(size)

    /** @param bytes copied into a new owning buffer */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithCopiedBytes(bytes: ByteArray): ArrayBuffer {
      val buffer = ArrayBuffer(bytes.size)
      if (bytes.isNotEmpty()) {
        buffer.bytes.put(bytes)
        buffer.bytes.rewind()
      }
      return buffer
    }

    /**
     * @param source the bytes between its position and limit are copied into a new owning buffer.
     *   Pass a buffer positioned at 0 with the limit at its capacity to copy all of it. The
     *   position and limit of `source` are left unchanged.
     */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithCopiedBytes(source: ByteBuffer): ArrayBuffer {
      val length = source.remaining()
      val buffer = ArrayBuffer(length)
      if (length > 0) {
        buffer.bytes.put(source.duplicate())
        buffer.bytes.rewind()
      }
      return buffer
    }

    /**
     * @param source all [size] bytes are copied into a new owning buffer, regardless of the
     *   position and limit of its [bytes]. Use to keep bytes from a non-owning argument after the
     *   call returns.
     */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithCopiedBytes(source: ArrayBuffer): ArrayBuffer {
      val length = source.size
      val buffer = ArrayBuffer(length)
      if (length > 0) {
        val src = source.bytes.duplicate()
        src.position(0)
        src.limit(length)
        buffer.bytes.put(src)
        buffer.bytes.rewind()
      }
      return buffer
    }

    /**
     * Aliases an existing direct [ByteBuffer] without copying. The resulting [ArrayBuffer] reports
     * [isOwningBytes] as `true`, so it may be retained and returned to JS — but it does not own the
     * memory: the caller must keep `buffer` and whatever backs it valid for as long as the
     * [ArrayBuffer], and any JS `ArrayBuffer` derived from it, is reachable.
     *
     * @param buffer direct [ByteBuffer] to alias without copying
     */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithOwnedBytes(buffer: ByteBuffer): ArrayBuffer {
      require(buffer.isDirect) { "arrayBufferWithOwnedBytes requires a direct ByteBuffer" }
      return ArrayBuffer(buffer, true).apply { initHybrid(buffer, isOwningBytes) }
    }

    private fun allocateDirect(size: Int): ByteBuffer {
      require(size >= 0) { "ArrayBuffer size must not be negative, got $size" }
      return ByteBuffer.allocateDirect(size)
    }
  }
}
