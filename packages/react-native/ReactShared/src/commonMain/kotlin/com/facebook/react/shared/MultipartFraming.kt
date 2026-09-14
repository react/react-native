/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shared

/** A completed region in the caller's current buffer. The first region is the preamble. */
public class MultipartChunk(
    public val start: Long,
    public val end: Long,
    public val isPart: Boolean,
    public val isLast: Boolean,
)

/**
 * Incremental multipart framing, independent of stream and buffer ownership.
 *
 * The caller searches its native buffer for delimiters starting at [searchStart], then passes their
 * indices to [nextChunk]. After a chunk, it may discard bytes before the delimiter and advance
 * bufferOffset by the same amount. Offsets let both sliding and retained buffers use the same state
 * machine without copying body bytes into Kotlin.
 */
public class MultipartFraming(
    private val delimiterLength: Int,
    private val closeDelimiterLength: Int,
) {
  private var chunkStart: Long = 0
  private var bytesSeen: Long = 0
  private var hasBoundary: Boolean = false

  /** Retain enough overlap to find a delimiter split between two reads. */
  public fun searchStart(bufferOffset: Long): Long =
      maxOf(bytesSeen - closeDelimiterLength, chunkStart) - bufferOffset

  /** Start of the current part in the caller's buffer, including its headers. */
  public fun partStart(bufferOffset: Long): Long = chunkStart - bufferOffset

  /**
   * Returns a completed region, or null when another read is needed. A negative index means that
   * delimiter was not found. Normal delimiters take precedence, matching both adapters.
   */
  public fun nextChunk(
      bufferLength: Long,
      bufferOffset: Long,
      delimiterIndex: Long,
      closeDelimiterIndex: Long,
  ): MultipartChunk? {
    val isClosing = delimiterIndex < 0
    val end = if (isClosing) closeDelimiterIndex else delimiterIndex
    if (end < 0) {
      bytesSeen = bufferOffset + bufferLength
      return null
    }

    val chunk = MultipartChunk(chunkStart - bufferOffset, end, hasBoundary, isClosing)
    if (!isClosing) {
      hasBoundary = true
      chunkStart = bufferOffset + end + delimiterLength
      bytesSeen = chunkStart
    }
    return chunk
  }
}

/** An untrimmed header. Native adapters retain their whitespace and map-key policies. */
public class MultipartHeader(public val name: String, public val value: String)

public object MultipartHeaders {
  /** Split CRLF-delimited headers at the first colon, ignoring lines without a separator. */
  public fun parse(text: String): List<MultipartHeader> =
      text.split("\r\n").mapNotNull { line ->
        val separator = line.indexOf(':')
        if (separator < 0) null
        else MultipartHeader(line.substring(0, separator), line.substring(separator + 1))
      }
}
