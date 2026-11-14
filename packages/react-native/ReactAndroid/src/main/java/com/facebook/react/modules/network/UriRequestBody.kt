/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okio versions

package com.facebook.react.modules.network

import java.io.IOException
import java.io.InputStream
import okhttp3.MediaType
import okhttp3.RequestBody
import okio.BufferedSink
import okio.Okio

/**
 * A [RequestBody] that calls [openStream] for each [writeTo], so OkHttp can send the body again
 * when it retries a request, e.g. after a pooled connection turns out to have been closed by the
 * server.
 *
 * @param contentLength the length in bytes, or -1 if unknown
 * @param openStream returns a stream positioned at the start of the content
 */
internal class UriRequestBody(
    private val mediaType: MediaType?,
    private val contentLength: Long,
    private val openStream: () -> InputStream,
) : RequestBody() {

  override fun contentType(): MediaType? = mediaType

  override fun contentLength(): Long = contentLength

  @Throws(IOException::class)
  override fun writeTo(sink: BufferedSink) {
    val inputStream =
        try {
          openStream()
        } catch (e: Exception) {
          // Opening a content:// stream can throw e.g. SecurityException. OkHttp reports other
          // exceptions to onFailure too, but then rethrows them on its dispatcher thread, which
          // crashes the app
          throw e as? IOException ?: IOException("Could not open request body", e)
        }
    Okio.source(inputStream).use { source -> sink.writeAll(source) }
  }
}
