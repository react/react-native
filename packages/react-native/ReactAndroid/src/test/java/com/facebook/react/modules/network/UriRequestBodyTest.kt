/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okio versions

package com.facebook.react.modules.network

import java.io.ByteArrayInputStream
import java.io.IOException
import java.io.InputStream
import okhttp3.MediaType
import okio.Buffer
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Test

class UriRequestBodyTest {

  @Test
  fun testWriteToOpensNewStreamEachTime() {
    val bytes = ByteArray(16 * 1024) { it.toByte() }
    val openedStreams = mutableListOf<TrackingInputStream>()
    val body =
        UriRequestBody(MEDIA_TYPE, bytes.size.toLong()) {
          TrackingInputStream(bytes).also { openedStreams.add(it) }
        }

    val first = Buffer().also { body.writeTo(it) }.readByteArray()
    val second = Buffer().also { body.writeTo(it) }.readByteArray()

    assertThat(first).isEqualTo(bytes)
    assertThat(second).isEqualTo(bytes)
    assertThat(openedStreams).hasSize(2)
    assertThat(openedStreams).allMatch { it.closed }
  }

  @Test
  fun testWriteToWrapsOtherExceptionsInIOException() {
    // e.g. a content provider revoking read permission between attempts
    val failure = SecurityException("permission revoked")
    val body = UriRequestBody(MEDIA_TYPE, -1) { throw failure }

    assertThatThrownBy { body.writeTo(Buffer()) }
        .isInstanceOf(IOException::class.java)
        .hasCause(failure)
  }

  private class TrackingInputStream(bytes: ByteArray) : InputStream() {
    private val delegate = ByteArrayInputStream(bytes)
    var closed = false

    override fun read(): Int = delegate.read()

    override fun read(b: ByteArray, off: Int, len: Int): Int = delegate.read(b, off, len)

    override fun close() {
      closed = true
    }
  }

  private companion object {
    val MEDIA_TYPE: MediaType = checkNotNull(MediaType.parse("application/octet-stream"))
  }
}
