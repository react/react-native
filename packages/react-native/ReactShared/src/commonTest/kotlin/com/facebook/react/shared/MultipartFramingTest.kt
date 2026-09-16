/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shared

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class MultipartFramingTest {
  @Test
  fun framingIsIndependentOfReadBoundariesAndBufferRetention() {
    val input =
        "preamble\r\n--sample\r\nA: b\r\n\r\none\r\n--sample\r\ntwo\r\n--sample--\r\nepilogue"
    for (readSize in 1..input.length) {
      for (discard in listOf(false, true)) {
        assertEquals(
            listOf("A: b\r\n\r\none", "two") to true,
            parse(input, "sample", readSize, discard),
            "readSize=$readSize discard=$discard",
        )
      }
    }
  }

  @Test
  fun missingDelimiterDoesNotComplete() {
    assertEquals(emptyList<String>() to false, parse("no delimiter", "sample", 1, true))
  }

  @Test
  fun missingClosingDelimiterDoesNotComplete() {
    assertEquals(emptyList<String>() to false, parse("\r\n--sample\r\nbody", "sample", 1, false))
  }

  @Test
  fun incompleteFinalPartKeepsPreviouslyCompletedParts() {
    val input = "\r\n--s\r\nfirst\r\n--s\r\nincomplete"
    assertEquals(listOf("first") to false, parse(input, "s", 2, true))
  }

  @Test
  fun closingDelimiterWithoutPartsOnlyDiscardsPreamble() {
    assertEquals(emptyList<String>() to true, parse("preamble\r\n--s--\r\n", "s", 1, false))
  }

  @Test
  fun nearMatchesRemainInTheBody() {
    val body = "binary\u0000\r\n--samplX\r\n\r\n--sample-\r\n"
    val input = "\r\n--sample\r\n$body\r\n--sample--\r\n"
    for (readSize in 1..input.length) {
      assertEquals(listOf(body) to true, parse(input, "sample", readSize, true))
    }
  }

  @Test
  fun overlapStartsAtThePartUntilMoreBytesArrive() {
    val framing = MultipartFraming(7, 9)
    assertEquals(0L, framing.searchStart(0))
    val preamble = framing.nextChunk(7, 0, 0, -1)!!
    assertFalse(preamble.isPart)
    assertEquals(7L, framing.partStart(0))
    assertEquals(7L, framing.searchStart(0))
    assertNull(framing.nextChunk(30, 0, -1, -1))
    assertEquals(21L, framing.searchStart(0))
  }

  @Test
  fun offsetsRemainExactBeyondIntRange() {
    val framing = MultipartFraming(7, 9)
    val offset = Int.MAX_VALUE.toLong() + 100
    framing.nextChunk(offset + 7, 0, offset, -1)
    assertEquals(7L, framing.partStart(offset))
    assertNull(framing.nextChunk(30, offset, -1, -1))
    assertEquals(21L, framing.searchStart(offset))
    val part = framing.nextChunk(40, offset, -1, 31)!!
    assertEquals(7L, part.start)
    assertEquals(31L, part.end)
    assertTrue(part.isPart)
    assertTrue(part.isLast)
  }

  @Test
  fun normalDelimiterRetainsExistingSearchPrecedence() {
    val framing = MultipartFraming(7, 9)
    assertFalse(framing.nextChunk(40, 0, 20, 5)!!.isLast)
  }

  @Test
  fun headersRetainNativeWhitespaceCaseAndDuplicatePolicies() {
    val headers =
        MultipartHeaders.parse(
            " Content-Type : text/plain:extra \r\ninvalid\r\nx:1\r\nX:2\r\n:empty\r\n"
        )
    assertEquals(listOf(" Content-Type ", "x", "X", ""), headers.map { it.name })
    assertEquals(listOf(" text/plain:extra ", "1", "2", "empty"), headers.map { it.value })
    assertTrue(MultipartHeaders.parse("").isEmpty())
  }

  private fun parse(
      input: String,
      boundary: String,
      readSize: Int,
      discard: Boolean,
  ): Pair<List<String>, Boolean> {
    val delimiter = "\r\n--$boundary\r\n"
    val closeDelimiter = "\r\n--$boundary--\r\n"
    val framing = MultipartFraming(delimiter.length, closeDelimiter.length)
    var buffer = ""
    var offset = 0L
    var read = 0
    val parts = mutableListOf<String>()
    while (true) {
      val start = framing.searchStart(offset).toInt()
      val normal = buffer.indexOf(delimiter, start)
      val close = if (normal < 0) buffer.indexOf(closeDelimiter, start) else -1
      val chunk = framing.nextChunk(buffer.length.toLong(), offset, normal.toLong(), close.toLong())
      if (chunk == null) {
        if (read == input.length) return parts to false
        val end = minOf(input.length, read + readSize)
        buffer += input.substring(read, end)
        read = end
      } else {
        if (chunk.isPart) parts += buffer.substring(chunk.start.toInt(), chunk.end.toInt())
        if (chunk.isLast) return parts to true
        if (discard) {
          buffer = buffer.substring(chunk.end.toInt())
          offset += chunk.end
        }
      }
    }
  }
}
