/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Conflicting okhttp versions
@file:Suppress("DEPRECATION_ERROR")

package com.facebook.react.modules.network

import okhttp3.MediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okio.Buffer
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class ProgressRequestBodyTest {

  @Test
  fun testBulkWritesDoNotDoubleCountProgress() {
    val content = ByteArray(8 * 1024) { it.toByte() }
    val progressUpdates = mutableListOf<ProgressUpdate>()
    val requestBody =
        ProgressRequestBody(
            content.toRequestBody(checkNotNull(MediaType.parse("application/octet-stream"))),
            ProgressListener { bytesWritten, contentLength, done ->
              progressUpdates.add(ProgressUpdate(bytesWritten, contentLength, done))
            },
        )
    val output = Buffer()

    requestBody.writeTo(output)

    assertThat(output.readByteArray()).isEqualTo(content)
    assertThat(progressUpdates).isNotEmpty()
    assertThat(progressUpdates.maxOf { it.bytesWritten }).isEqualTo(content.size.toLong())
    assertThat(progressUpdates.last())
        .isEqualTo(ProgressUpdate(content.size.toLong(), content.size.toLong(), true))
  }

  private data class ProgressUpdate(
      val bytesWritten: Long,
      val contentLength: Long,
      val done: Boolean,
  )
}
