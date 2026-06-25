/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import okio.Buffer
import okio.BufferedSource
import okio.ByteString
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class MultipartStreamReaderTest {

  @Test
  fun testSimpleCase() {
    val response: ByteString =
        encodeUtf8(
            "preamble, should be ignored\r\n" +
                "--sample_boundary\r\n" +
                "Content-Type: application/json; charset=utf-8\r\n" +
                "Content-Length: 2\r\n\r\n" +
                "{}\r\n" +
                "--sample_boundary--\r\n" +
                "epilogue, should be ignored"
        )

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback: CallCountTrackingChunkCallback =
        object : CallCountTrackingChunkCallback() {
          override fun onChunkComplete(
              headers: Map<String, String>,
              body: BufferedSource,
              isLastChunk: Boolean,
          ) {
            super.onChunkComplete(headers, body, isLastChunk)

            assertThat(isLastChunk).isTrue
            assertThat(headers["Content-Type"]).isEqualTo("application/json; charset=utf-8")
            assertThat(body.readUtf8()).isEqualTo("{}")
          }
        }

    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(1)
    assertThat(success).isTrue()
  }

  @Test
  fun testMultipleParts() {
    val response: ByteString =
        encodeUtf8(
            "preamble, should be ignored\r\n" +
                "--sample_boundary\r\n" +
                "1\r\n" +
                "--sample_boundary\r\n" +
                "2\r\n" +
                "--sample_boundary\r\n" +
                "3\r\n" +
                "--sample_boundary--\r\n" +
                "epilogue, should be ignored"
        )

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback: CallCountTrackingChunkCallback =
        object : CallCountTrackingChunkCallback() {
          override fun onChunkComplete(
              headers: Map<String, String>,
              body: BufferedSource,
              isLastChunk: Boolean,
          ) {
            super.onChunkComplete(headers, body, isLastChunk)

            assertThat(isLastChunk).isEqualTo(callCount == 3)
            assertThat(body.readUtf8()).isEqualTo("$callCount")
          }
        }
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(3)
    assertThat(success).isTrue()
  }

  @Test
  fun testNoDelimiter() {
    val response: ByteString = encodeUtf8("Yolo")

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback = CallCountTrackingChunkCallback()
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(0)
    assertThat(success).isFalse()
  }

  @Test
  fun testNoCloseDelimiter() {
    val response: ByteString =
        encodeUtf8(
            "preamble, should be ignored\r\n" +
                "--sample_boundary\r\n" +
                "Content-Type: application/json; charset=utf-8\r\n" +
                "Content-Length: 2\r\n\r\n" +
                "{}\r\n" +
                "--sample_boundary\r\n" +
                "incomplete message..."
        )

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback = CallCountTrackingChunkCallback()
    val success = reader.readAllParts(callback)

    // First part was complete, then stream ended without a close delimiter.
    assertThat(callback.callCount).isEqualTo(1)
    assertThat(success).isFalse()
  }

  @Test
  fun testListenerDoesNotNeedToFullyReadBody() {
    val response: ByteString =
        encodeUtf8(
            "preamble\r\n" +
                "--sample_boundary\r\n" +
                "Content-Type: text/plain\r\n" +
                "Content-Length: 4\r\n\r\n" +
                "ABCD\r\n" +
                "--sample_boundary\r\n" +
                "Content-Type: text/plain\r\n" +
                "Content-Length: 1\r\n\r\n" +
                "Z\r\n" +
                "--sample_boundary--\r\n"
        )

    val source = Buffer().apply { write(response) }
    val reader = MultipartStreamReader(source, "sample_boundary")

    val parts = mutableListOf<String>()
    val callback =
        object : MultipartStreamReader.ChunkListener {
          override fun onChunkComplete(
              headers: Map<String, String>,
              body: BufferedSource,
              isLastChunk: Boolean,
          ) {
            if (parts.isEmpty()) {
              // Intentionally only read 1 byte from the first part.
              parts.add(body.readUtf8(1))
              return
            }
            parts.add(body.readUtf8())
          }

          override fun onChunkProgress(headers: Map<String, String>, loaded: Long, total: Long) =
              Unit
        }

    val success = reader.readAllParts(callback)

    assertThat(success).isTrue()
    assertThat(parts).containsExactly("A", "Z")
  }

  @Test
  fun testHeaderNamesAreCaseInsensitive() {
    val response: ByteString =
        encodeUtf8(
            "preamble\r\n" +
                "--sample_boundary\r\n" +
                "content-type: application/json\r\n" +
                "content-length: 2\r\n\r\n" +
                "{}\r\n" +
                "--sample_boundary--\r\n"
        )

    val source = Buffer().apply { write(response) }
    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback =
        object : CallCountTrackingChunkCallback() {
          override fun onChunkComplete(
              headers: Map<String, String>,
              body: BufferedSource,
              isLastChunk: Boolean,
          ) {
            super.onChunkComplete(headers, body, isLastChunk)

            // Lookup using canonical case should still work.
            assertThat(headers["Content-Type"]).isEqualTo("application/json")
            assertThat(headers["Content-Length"]).isEqualTo("2")
            assertThat(body.readUtf8()).isEqualTo("{}")
          }
        }

    val success = reader.readAllParts(callback)

    assertThat(success).isTrue()
    assertThat(callback.callCount).isEqualTo(1)
  }

  internal open class CallCountTrackingChunkCallback : MultipartStreamReader.ChunkListener {
    var callCount = 0
      private set

    override fun onChunkComplete(
        headers: Map<String, String>,
        body: BufferedSource,
        isLastChunk: Boolean,
    ) {
      callCount++
    }

    override fun onChunkProgress(headers: Map<String, String>, loaded: Long, total: Long) = Unit
  }

  private fun encodeUtf8(input: String): ByteString =
      ByteString.of(*input.toByteArray(Charsets.UTF_8))
}
