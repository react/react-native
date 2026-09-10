/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import java.lang.management.ManagementFactory
import okio.Buffer
import okio.BufferedSource
import okio.ByteString

// Compiled with the actual adapter and the explicitly selected, renamed Git baseline.
private fun read(native: Boolean, source: BufferedSource, capture: Boolean): Any {
  var bytes = 0L
  var calls = 0
  var result: ByteString? = null
  fun complete(body: BufferedSource, last: Boolean) {
    check(last)
    calls++
    if (capture) {
      result = body.readByteString()
    } else {
      val scratch = Buffer()
      while (body.read(scratch, 8192) != -1L) {
        bytes += scratch.size()
        scratch.clear()
      }
    }
  }
  val success =
      if (native) {
        MultipartStreamReaderBaseline(source, "sample")
            .readAllParts(
                object : MultipartStreamReaderBaseline.ChunkListener {
                  override fun onChunkComplete(
                      headers: Map<String, String>,
                      body: BufferedSource,
                      isLastChunk: Boolean,
                  ) = complete(body, isLastChunk)

                  override fun onChunkProgress(
                      headers: Map<String, String>,
                      loaded: Long,
                      total: Long,
                  ) = Unit
                }
            )
      } else {
        MultipartStreamReader(source, "sample")
            .readAllParts(
                object : MultipartStreamReader.ChunkListener {
                  override fun onChunkComplete(
                      headers: Map<String, String>,
                      body: BufferedSource,
                      isLastChunk: Boolean,
                  ) = complete(body, isLastChunk)

                  override fun onChunkProgress(
                      headers: Map<String, String>,
                      loaded: Long,
                      total: Long,
                  ) = Unit
                }
            )
      }
  check(success && calls == 1)
  return result ?: bytes
}

fun main() {
  val bean = ManagementFactory.getThreadMXBean() as com.sun.management.ThreadMXBean
  check(bean.isThreadAllocatedMemorySupported)
  bean.isThreadAllocatedMemoryEnabled = true
  val thread = Thread.currentThread().id
  for (megabytes in listOf(2, 20)) {
    val size = megabytes * 1024 * 1024
    val body = ByteArray(size) { (it % 251).toByte() }
    val response =
        Buffer()
            .apply {
              writeUtf8("preamble\r\n--sample\r\nContent-Length: $size\r\n\r\n")
              write(body)
              writeUtf8("\r\n--sample--\r\nepilogue")
            }
            .readByteArray()
    val nativeBody = read(true, Buffer().write(response), true)
    val sharedBody = read(false, Buffer().write(response), true)
    check(nativeBody == sharedBody && sharedBody == ByteString.of(*body))

    fun measure(native: Boolean): Pair<Double, Long> {
      val source = Buffer().write(response)
      val allocated = bean.getThreadAllocatedBytes(thread)
      val start = System.nanoTime()
      val result = read(native, source, false)
      val elapsed = (System.nanoTime() - start) / 1_000_000.0
      val bytes = bean.getThreadAllocatedBytes(thread) - allocated
      check(result == size.toLong())
      return elapsed to bytes
    }
    repeat(30) {
      measure(true)
      measure(false)
    }
    val native = mutableListOf<Pair<Double, Long>>()
    val shared = mutableListOf<Pair<Double, Long>>()
    repeat(41) { i ->
      if (i % 2 == 0) {
        native += measure(true)
        shared += measure(false)
      } else {
        shared += measure(false)
        native += measure(true)
      }
    }
    val baselineMs = native.map { it.first }.sorted()[20]
    val sharedMs = shared.map { it.first }.sorted()[20]
    println(
        """{"bytes":$size,"iterations":41,"nativeMedianMs":$baselineMs,"kmpMedianMs":$sharedMs,"ratio":${sharedMs / baselineMs},"nativeMedianAllocatedBytes":${native.map { it.second }.sorted()[20]},"kmpMedianAllocatedBytes":${shared.map { it.second }.sorted()[20]},"nativeSamplesMs":${native.map { it.first }},"kmpSamplesMs":${shared.map { it.first }}}"""
    )
  }
}
