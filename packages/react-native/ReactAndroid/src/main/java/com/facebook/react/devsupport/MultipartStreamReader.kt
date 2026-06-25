/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okio versions

package com.facebook.react.devsupport

import java.io.IOException
import java.util.TreeMap
import kotlin.math.max
import okio.Buffer
import okio.BufferedSource
import okio.ByteString
import okio.Okio
import okio.Source
import okio.Timeout

/** Utility class to parse the body of a response of type multipart/mixed. */
internal class MultipartStreamReader(
    private val source: BufferedSource,
    private val boundary: String,
) {
  private var lastProgressEvent: Long = 0

  interface ChunkListener {
    /** Invoked when a chunk of a multipart response is fully downloaded. */
    @Throws(IOException::class)
    fun onChunkComplete(headers: Map<String, String>, body: BufferedSource, isLastChunk: Boolean)

    /** Invoked as bytes of the current chunk are read. */
    @Throws(IOException::class)
    fun onChunkProgress(headers: Map<String, String>, loaded: Long, total: Long)
  }

  /**
   * Reads all parts of the multipart response and execute the listener for each chunk received.
   *
   * @param listener Listener invoked when chunks are received.
   * @return If the read was successful
   */
  @Throws(IOException::class)
  fun readAllParts(listener: ChunkListener): Boolean {
    val delimiter: ByteString = ByteString.encodeUtf8("$CRLF--$boundary$CRLF")
    val closeDelimiter: ByteString = ByteString.encodeUtf8("$CRLF--$boundary--$CRLF")
    val headersDelimiter: ByteString = ByteString.encodeUtf8(CRLF + CRLF)

    // Buffer size for reading from network. Increased from 4KB to 16KB for better I/O
    // throughput and fewer syscalls. For a 2MB bundle: ~128 reads instead of ~512.
    // Memory impact is negligible (12KB increase) while I/O overhead is significantly reduced.
    val bufferLen = 16 * 1024
    var chunkStart: Long = 0
    var bytesSeen: Long = 0
    val content = Buffer()

    var currentHeaders: Map<String, String>? = null
    var currentBodyStartIndexInContent: Long = -1

    while (true) {
      var isCloseDelimiter = false

      // Search only a subset of chunk that we haven't seen before + few bytes
      // to allow for the edge case when the delimiter is cut by read call.
      val searchStart =
          max((bytesSeen - closeDelimiter.size()).toDouble(), chunkStart.toDouble()).toLong()

      var indexOfDelimiter = content.indexOf(delimiter, searchStart)
      if (indexOfDelimiter == -1L) {
        isCloseDelimiter = true
        indexOfDelimiter = content.indexOf(closeDelimiter, searchStart)
      }

      if (indexOfDelimiter == -1L) {
        bytesSeen = content.size()

        if (currentHeaders == null) {
          val indexOfHeadersDelimiter = content.indexOf(headersDelimiter, searchStart)
          if (indexOfHeadersDelimiter >= 0) {
            val headers = Buffer()
            content.copyTo(headers, searchStart, indexOfHeadersDelimiter - searchStart)
            currentHeaders = parseHeaders(headers)
            currentBodyStartIndexInContent =
                indexOfHeadersDelimiter + headersDelimiter.size().toLong()
          }
        } else {
          val loaded = max(0L, content.size() - currentBodyStartIndexInContent)
          emitProgress(currentHeaders, loaded, false, listener)
        }

        val bytesRead = source.read(content, bufferLen.toLong())
        if (bytesRead <= 0) {
          return false
        }
        continue
      }

      val chunkEnd = indexOfDelimiter
      val length = chunkEnd - chunkStart

      // Ignore preamble
      if (chunkStart > 0) {
        if (currentHeaders != null && currentBodyStartIndexInContent >= 0) {
          val loadedFinal = max(0L, chunkEnd - currentBodyStartIndexInContent)
          emitProgress(currentHeaders, loadedFinal, true, listener)
        }
        content.skip(chunkStart)
        emitChunk(content, length, isCloseDelimiter, listener)

        currentHeaders = null
        currentBodyStartIndexInContent = -1
      } else {
        content.skip(chunkEnd)
      }
      if (isCloseDelimiter) {
        return true
      }

      chunkStart = delimiter.size().toLong()
      bytesSeen = chunkStart
    }
  }

  private fun parseHeaders(data: Buffer): Map<String, String> {
    // Header names are case-insensitive
    val headers: MutableMap<String, String> = TreeMap(String.CASE_INSENSITIVE_ORDER)
    val text = data.readUtf8()
    val lines = text.split(CRLF.toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
    for (line in lines) {
      val indexOfSeparator = line.indexOf(":")
      if (indexOfSeparator == -1) {
        continue
      }
      val key = line.substring(0, indexOfSeparator).trim { it <= ' ' }
      val value = line.substring(indexOfSeparator + 1).trim { it <= ' ' }
      headers[key] = value
    }
    return headers
  }

  /**
   * Emits a chunk to the listener. The `body` passed to the listener is bounded to the chunk body
   * bytes, so the listener cannot accidentally read into the next boundary.
   *
   * Also drains any unread body bytes after the callback to keep parsing in sync.
   */
  @Throws(IOException::class)
  private fun emitChunk(
      content: Buffer,
      chunkLength: Long,
      done: Boolean,
      listener: ChunkListener,
  ) {
    val marker: ByteString = ByteString.encodeUtf8(CRLF + CRLF)
    val indexOfMarker = content.indexOf(marker, 0)

    if (indexOfMarker == -1L || indexOfMarker >= chunkLength) {
      // No headers marker found inside the chunk. Treat the entire chunk as body.
      val bodyLength = chunkLength
      val body = Okio.buffer(FixedLengthSource(content, bodyLength))
      try {
        listener.onChunkComplete(emptyMap(), body, done)
      } finally {
        drainFully(body)
      }
      return
    }

    // Headers exist.
    val headersBuf = Buffer()
    content.read(headersBuf, indexOfMarker)
    content.skip(marker.size().toLong())
    val headers = parseHeaders(headersBuf)

    val maxBodyLength = chunkLength - indexOfMarker - marker.size().toLong()
    val body = Okio.buffer(FixedLengthSource(content, maxBodyLength))
    try {
      listener.onChunkComplete(headers, body, done)
    } finally {
      drainFully(body)
    }
  }

  private fun drainFully(body: BufferedSource) {
    // Drain remaining bytes from this part body (if listener didn't).
    // Use small reusable buffer to avoid unbounded memory.
    val tmp = Buffer()
    try {
      while (true) {
        val r = body.read(tmp, 8 * 1024L)
        if (r == -1L) break
        tmp.clear()
      }
    } catch (_: IOException) {
      // Best-effort drain; parsing will likely fail upstream anyway.
    }
  }

  private class FixedLengthSource(
      private val upstream: Buffer,
      private var remaining: Long,
  ) : Source {
    override fun read(sink: Buffer, byteCount: Long): Long {
      if (byteCount == 0L) return 0L
      if (remaining == 0L) return -1L
      val toRead = minOf(byteCount, remaining)
      val read = upstream.read(sink, toRead)
      if (read == -1L) return -1L
      remaining -= read
      return read
    }

    override fun timeout(): Timeout = Timeout.NONE

    override fun close() = Unit
  }

  @Throws(IOException::class)
  private fun emitProgress(
      headers: Map<String, String>?,
      contentLength: Long,
      isFinal: Boolean,
      listener: ChunkListener?,
  ) {
    if (listener == null || headers == null) {
      return
    }
    val currentTime = System.currentTimeMillis()
    if (currentTime - lastProgressEvent > 16 || isFinal) {
      lastProgressEvent = currentTime
      val headersContentLength = headers.getOrDefault("Content-Length", "0").toLong()
      listener.onChunkProgress(headers, contentLength, headersContentLength)
    }
  }

  companion object {
    // Standard line separator for HTTP.
    private const val CRLF = "\r\n"
  }
}
