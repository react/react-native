/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okio versions

package com.facebook.react.modules.network

import java.io.FilterOutputStream
import java.io.IOException
import okhttp3.MediaType
import okhttp3.RequestBody
import okio.BufferedSink
import okio.Okio
import okio.Sink

internal class ProgressRequestBody(
    private val requestBody: RequestBody,
    private val progressListener: ProgressListener,
) : RequestBody() {
  private var contentLength = 0L

  override fun contentType(): MediaType? {
    return requestBody.contentType()
  }

  @Throws(IOException::class)
  override fun contentLength(): Long {
    if (contentLength == 0L) {
      contentLength = requestBody.contentLength()
    }
    return contentLength
  }

  @Throws(IOException::class)
  override fun writeTo(sink: BufferedSink) {
    // In 99% of cases, this method is called strictly once.
    // The only case when it is called more than once is internal okhttp upload re-try.
    // We need to re-create CountingOutputStream in this case as progress should be re-evaluated.
    val sinkWrapper = Okio.buffer(outputStreamSink(sink))

    // contentLength changes for input streams, since we're using inputStream.available(),
    // so get the length before writing to the sink
    contentLength()

    requestBody.writeTo(sinkWrapper)
    sinkWrapper.flush()
  }

  fun innerBody(): RequestBody = requestBody

  private fun outputStreamSink(sink: BufferedSink): Sink {
    return Okio.sink(
        object : FilterOutputStream(sink.outputStream()) {
          private var count: Long = 0

          @Throws(IOException::class)
          override fun write(data: ByteArray, offset: Int, byteCount: Int) {
            super.write(data, offset, byteCount)
            count += byteCount.toLong()
            sendProgressUpdate()
          }

          @Throws(IOException::class)
          override fun write(data: Int) {
            super.write(data)
            count++
            sendProgressUpdate()
          }

          @Throws(IOException::class)
          fun sendProgressUpdate() {
            val bytesWritten = count
            val contentLength = contentLength()
            progressListener.onProgress(bytesWritten, contentLength, bytesWritten == contentLength)
          }
        }
    )
  }
}
