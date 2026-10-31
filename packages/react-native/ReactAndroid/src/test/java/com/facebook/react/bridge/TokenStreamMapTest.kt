/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import java.io.ByteArrayOutputStream
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Test

@OptIn(UnstableReactNativeAPI::class)
class TokenStreamMapTest {
  private class Writer {
    private val out = ByteArrayOutputStream().apply { write(byteArrayOf(0x42, 0x54, 0x53, 1)) }
    private val strings = HashMap<String, Int>()

    fun tag(tag: Int) = apply { out.write(tag) }

    fun position(): Int = out.size()

    fun bytes(): ByteArray = out.toByteArray()

    fun varint(value: Long) = apply {
      var remaining = value
      while (remaining ushr 7 != 0L) {
        out.write(((remaining and 0x7f) or 0x80).toInt())
        remaining = remaining ushr 7
      }
      out.write(remaining.toInt())
    }

    private fun intern(tag: Int, value: String) = apply {
      val id = strings[value]
      if (id != null) {
        tag(tag + 1).varint(id.toLong())
      } else {
        strings[value] = strings.size
        val bytes = value.toByteArray(Charsets.UTF_8)
        tag(tag).varint(bytes.size.toLong())
        out.write(bytes)
      }
    }

    fun name(name: String) = intern(12, name)

    fun string(value: String) = intern(10, value)

    fun integer(value: Long) = tag(8).varint((value shl 1) xor (value shr 63))

    fun number(text: String) = apply {
      val bytes = text.toByteArray(Charsets.US_ASCII)
      tag(9).varint(bytes.size.toLong())
      out.write(bytes)
    }
  }

  @Test
  fun mapsReadInReverseOrderShareStrings() {
    val writer = Writer().tag(3)
    val firstOffset = writer.position()
    writer.tag(1).name("title").string("shared").name("n").integer(1).tag(2)
    val secondOffset = writer.position()
    writer.tag(1).name("title").string("shared").name("n").integer(2).tag(2).tag(4)
    val context = TokenStreamContext(writer.bytes())
    val second = context.getMap(secondOffset)
    val first = context.getMap(firstOffset)

    assertThat(second.getString("title")).isEqualTo("shared")
    assertThat(second.getInt("n")).isEqualTo(2)
    assertThat(first.getInt("n")).isEqualTo(1)
    assertThat(first.getString("title")).isSameAs(second.getString("title"))
    assertThat(context.getArray().getMap(1)?.getString("title")).isSameAs(first.getString("title"))
    assertThat(first.getString("title")).isSameAs(first.getString("title"))
  }

  @Test
  fun referencesInsideSkippedMapsAndArraysAreIndexed() {
    val writer =
        Writer()
            .tag(3)
            .tag(1)
            .name("nested")
            .tag(3)
            .tag(1)
            .name("shared")
            .string("value")
            .tag(2)
            .tag(4)
            .tag(2)
    val laterOffset = writer.position()
    writer.tag(1).name("shared").string("value").tag(2).tag(4)
    val context = TokenStreamContext(writer.bytes())
    val later = context.getMap(laterOffset)

    assertThat(later.getString("shared")).isEqualTo("value")
    val earlier = checkNotNull(context.getArray().getMap(0))
    val nested = checkNotNull(earlier.getArray("nested")?.getMap(0))
    assertThat(nested.getString("shared")).isSameAs(later.getString("shared"))
  }

  @Test
  fun namesAndValuesShareOneStringTable() {
    val writer = Writer().tag(1).name("same").string("same").tag(2)
    val map = TokenStreamContext(writer.bytes()).getMap()
    val key = map.keySetIterator().nextKey()

    assertThat(map.getString("same")).isSameAs(key)
  }

  @Test
  fun iteratorsAndNestedReadsHaveIndependentState() {
    val writer =
        Writer()
            .tag(1)
            .name("a")
            .tag(1)
            .name("x")
            .integer(3)
            .tag(2)
            .name("b")
            .tag(3)
            .integer(4)
            .integer(5)
            .tag(4)
            .tag(2)
    val map = TokenStreamContext(writer.bytes()).getMap()
    val first = map.keySetIterator()
    val second = map.keySetIterator()

    assertThat(first.nextKey()).isEqualTo("a")
    assertThat(map.getArray("b")?.getInt(1)).isEqualTo(5)
    assertThat(map.getMap("a")?.getInt("x")).isEqualTo(3)
    assertThat(second.nextKey()).isEqualTo("a")
    assertThat(first.nextKey()).isEqualTo("b")
    assertThat(second.nextKey()).isEqualTo("b")
    assertThat(first.hasNextKey()).isFalse()
    assertThat(map.entryIterator.asSequence().map { it.key }.toList()).containsExactly("a", "b")
  }

  @Test
  fun retainedMapOwnsItsBytes() {
    val writer = Writer().tag(3).tag(1).name("value").string("retained").tag(2).tag(4)
    val bytes = writer.bytes()
    val map = checkNotNull(TokenStreamContext(bytes).getArray().getMap(0))
    bytes.fill(0)

    assertThat(map.getString("value")).isEqualTo("retained")
    assertThat(map.toHashMap()).containsEntry("value", "retained")
  }

  @Test
  fun ownedBufferAvoidsCopyingWhileDefaultConstructorStillCopies() {
    val writer = Writer().tag(1).name("value")
    val valueOffset = writer.position() + 2
    writer.string("retained").tag(2)
    val bytes = writer.bytes()
    val owned = TokenStreamContext.fromOwnedBytes(bytes).getMap()
    val copied = TokenStreamContext(bytes).getMap()

    // Mutating transferred input is a copy-detection probe, not a permitted caller operation.
    bytes[valueOffset] = 'c'.code.toByte()
    assertThat(owned.getString("value")).isEqualTo("cetained")
    assertThat(copied.getString("value")).isEqualTo("retained")
  }

  @Test
  fun reopenedMapsReuseTheSharedFieldIndex() {
    val writer = Writer().tag(1).name("value").integer(42).tag(2)
    val context = TokenStreamContext(writer.bytes())
    val first = context.getMap()
    assertThat(first.getInt("value")).isEqualTo(42)
    val fields = context.containerAt(4).fields
    val second = context.getMap()
    assertThat(second.getInt("value")).isEqualTo(42)
    assertThat(context.containerAt(4).fields).isSameAs(fields)
  }

  @Test
  fun integerConversionMatchesExistingReadableMaps() {
    val values =
        listOf(
            Long.MIN_VALUE,
            Int.MIN_VALUE.toLong() - 1,
            Int.MIN_VALUE.toLong(),
            -1L,
            0L,
            1L,
            Int.MAX_VALUE.toLong(),
            Int.MAX_VALUE.toLong() + 1,
            9007199254740993L,
            Long.MAX_VALUE,
        )
    val writer = Writer().tag(1)
    values.forEachIndexed { index, value -> writer.name(index.toString()).integer(value) }
    writer.name("array").tag(3)
    values.forEach { writer.integer(it) }
    writer.tag(4).tag(2)
    val map = TokenStreamContext(writer.bytes()).getMap()
    val array = checkNotNull(map.getArray("array"))
    values.forEachIndexed { index, value ->
      val expected = JavaOnlyMap.of("value", value).getInt("value")
      assertThat(map.getInt(index.toString())).isEqualTo(expected)
      assertThat(array.getInt(index)).isEqualTo(expected)
      assertThat(map.getLong(index.toString())).isEqualTo(value)
    }
  }

  @Test
  fun materializedCollectionsDoNotAliasEachOtherOrTheContext() {
    val writer =
        Writer()
            .tag(1)
            .name("nested")
            .tag(1)
            .name("n")
            .integer(7)
            .tag(2)
            .name("array")
            .tag(3)
            .integer(9)
            .tag(4)
            .tag(2)
    val map = TokenStreamContext(writer.bytes()).getMap()
    val first = map.toHashMap()
    val second = map.toHashMap()
    assertThat(first).isNotSameAs(second)
    assertThat(first["nested"]).isNotSameAs(second["nested"])
    assertThat(first["array"]).isNotSameAs(second["array"])
    first.clear()
    val array = checkNotNull(map.getArray("array"))
    val materialized = array.toArrayList()
    materialized.clear()
    assertThat(second).isEqualTo(mapOf("nested" to mapOf("n" to 7.0), "array" to listOf(9.0)))
    assertThat(map.getMap("nested")?.getInt("n")).isEqualTo(7)
    assertThat(array.getInt(0)).isEqualTo(9)
  }

  @Test
  fun preservesNullMissingAndTypeErrors() {
    val writer = Writer().tag(1).name("reset").tag(5).name("text").string("value").tag(2)
    val map = TokenStreamContext(writer.bytes()).getMap()

    assertThat(map.hasKey("reset")).isTrue()
    assertThat(map.isNull("reset")).isTrue()
    assertThat(map.getType("reset")).isEqualTo(ReadableType.Null)
    assertThat(map.getString("reset")).isNull()
    assertThat(map.getMap("reset")).isNull()
    assertThat(map.getArray("reset")).isNull()
    assertThat(map.hasKey("missing")).isFalse()
    assertThatThrownBy { map.isNull("missing") }.isInstanceOf(NoSuchKeyException::class.java)
    assertThatThrownBy { map.getString("missing") }.isInstanceOf(NoSuchKeyException::class.java)
    assertThatThrownBy { map.getDouble("text") }
        .isInstanceOf(UnexpectedNativeTypeException::class.java)
    assertThatThrownBy { map.getBoolean("reset") }
        .isInstanceOf(UnexpectedNativeTypeException::class.java)
  }

  @Test
  fun readsAllScalarTypesAndNumericBoundaries() {
    val writer =
        Writer()
            .tag(1)
            .name("true")
            .tag(7)
            .name("false")
            .tag(6)
            .name("int")
            .integer(-129)
            .name("max")
            .integer(Long.MAX_VALUE)
            .name("min")
            .integer(Long.MIN_VALUE)
            .name("fraction")
            .number("1.5")
            .name("negativeZero")
            .number("-0")
            .name("nan")
            .number("NaN")
            .name("infinity")
            .number("Infinity")
            .name("text")
            .string("日本語 🦊\u0000�")
            .tag(2)
    val map = TokenStreamContext(writer.bytes()).getMap()

    assertThat(map.getBoolean("true")).isTrue()
    assertThat(map.getBoolean("false")).isFalse()
    assertThat(map.getInt("int")).isEqualTo(-129)
    assertThat(map.getLong("max")).isEqualTo(Long.MAX_VALUE)
    assertThat(map.getLong("min")).isEqualTo(Long.MIN_VALUE)
    assertThat(map.getDouble("fraction")).isEqualTo(1.5)
    assertThat(map.getInt("fraction")).isEqualTo(1)
    assertThat(map.getDouble("negativeZero").toRawBits()).isEqualTo((-0.0).toRawBits())
    assertThat(map.getDouble("nan")).isNaN()
    assertThat(map.getDouble("infinity")).isEqualTo(Double.POSITIVE_INFINITY)
    assertThat(map.getString("text")).isEqualTo("日本語 🦊\u0000�")
    assertThat(map.getDynamic("fraction").asDouble()).isEqualTo(1.5)
  }

  @Test
  fun materializesNestedMapsAndArrays() {
    val writer =
        Writer()
            .tag(1)
            .name("nested")
            .tag(1)
            .name("n")
            .integer(7)
            .tag(2)
            .name("array")
            .tag(3)
            .tag(5)
            .tag(7)
            .number("0.5")
            .string("x")
            .tag(1)
            .name("n")
            .integer(8)
            .tag(2)
            .tag(3)
            .integer(9)
            .tag(4)
            .tag(4)
            .tag(2)
    val map = TokenStreamContext(writer.bytes()).getMap()
    val array = checkNotNull(map.getArray("array"))

    assertThat(map.getType("nested")).isEqualTo(ReadableType.Map)
    assertThat(map.getType("array")).isEqualTo(ReadableType.Array)
    assertThat(array.size()).isEqualTo(6)
    assertThat(array.isNull(0)).isTrue()
    assertThat(array.getBoolean(1)).isTrue()
    assertThat(array.getDouble(2)).isEqualTo(0.5)
    assertThat(array.getString(3)).isEqualTo("x")
    assertThat(array.getMap(4)?.getInt("n")).isEqualTo(8)
    assertThat(array.getArray(5)?.getInt(0)).isEqualTo(9)
    assertThat(array.getDynamic(3).asString()).isEqualTo("x")
    assertThat(map.toHashMap())
        .isEqualTo(
            mapOf(
                "nested" to mapOf("n" to 7.0),
                "array" to listOf(null, true, 0.5, "x", mapOf("n" to 8.0), listOf(9.0)),
            ),
        )
    assertThat(array.toArrayList())
        .isEqualTo(listOf(null, true, 0.5, "x", mapOf("n" to 8.0), listOf(9.0)))
    assertThatThrownBy { array.getString(6) }.isInstanceOf(IndexOutOfBoundsException::class.java)
  }

  @Test
  fun duplicateNamesKeepTheLastValue() {
    val writer = Writer().tag(1).name("a").integer(1).name("a").integer(2).tag(2)
    val map = TokenStreamContext(writer.bytes()).getMap()

    assertThat(map.getInt("a")).isEqualTo(2)
    assertThat(map.toHashMap()).hasSize(1)
  }

  @Test
  fun concurrentReadersShareTheDecodedStringInstance() {
    val writer = Writer().tag(3)
    val offsets = ArrayList<Int>()
    repeat(32) {
      offsets.add(writer.position())
      writer.tag(1).name("value").string("shared".repeat(128)).tag(2)
    }
    writer.tag(4)
    val context = TokenStreamContext(writer.bytes())
    val results = arrayOfNulls<String>(offsets.size)
    val failures = ConcurrentLinkedQueue<Throwable>()
    val completed = CountDownLatch(offsets.size)
    offsets.reversed().forEachIndexed { index, offset ->
      Thread {
            try {
              results[index] = context.getMap(offset).getString("value")
            } catch (error: Throwable) {
              failures.add(error)
            } finally {
              completed.countDown()
            }
          }
          .apply { isDaemon = true }
          .start()
    }
    assertThat(completed.await(10, TimeUnit.SECONDS)).isTrue()
    assertThat(failures).isEmpty()
    for (value in results) assertThat(value).isSameAs(results.first())
  }

  @Test
  fun rejectsInvalidHeadersAndOffsets() {
    assertThatThrownBy { TokenStreamContext(byteArrayOf()) }
        .isInstanceOf(IllegalArgumentException::class.java)
    assertThatThrownBy { TokenStreamContext(byteArrayOf(0x42, 0x54, 0x53, 2, 1, 2)) }
        .isInstanceOf(IllegalArgumentException::class.java)
    val context = TokenStreamContext(Writer().tag(1).name("a").integer(1).tag(2).bytes())
    assertThatThrownBy { context.getMap(5) }.isInstanceOf(IllegalArgumentException::class.java)
    assertThatThrownBy { context.getArray() }.isInstanceOf(IllegalArgumentException::class.java)
  }

  @Test
  fun rejectsMalformedTokensAndReferences() {
    val malformed =
        listOf(
            Writer().bytes(),
            Writer().tag(1).bytes(),
            Writer().tag(2).bytes(),
            Writer().tag(1).tag(4).bytes(),
            Writer().tag(1).name("a").tag(2).bytes(),
            Writer().tag(1).integer(1).tag(2).bytes(),
            Writer().name("a").bytes(),
            Writer().tag(3).name("a").tag(4).bytes(),
            Writer().tag(1).name("a").name("b").integer(1).tag(2).bytes(),
            Writer().tag(5).tag(5).bytes(),
            Writer().tag(11).varint(0).bytes(),
            Writer().tag(10).varint(-1L).bytes(),
            Writer().tag(10).varint(100).bytes(),
            Writer().number("not a number").bytes(),
            Writer().tag(14).bytes(),
            Writer().tag(255).bytes(),
        )
    for ((index, bytes) in malformed.withIndex()) {
      assertThatThrownBy { TokenStreamContext(bytes) }
          .describedAs("case %s", index)
          .isInstanceOf(IllegalArgumentException::class.java)
    }
  }

  @Test
  fun rejectsInvalidUtf8AndOverflowingVarints() {
    val invalid =
        listOf(
            byteArrayOf(0xc0.toByte(), 0x80.toByte()),
            byteArrayOf(0xed.toByte(), 0xa0.toByte(), 0x80.toByte()),
            byteArrayOf(0xf4.toByte(), 0x90.toByte(), 0x80.toByte(), 0x80.toByte()),
            byteArrayOf(0xe2.toByte(), 0x82.toByte()),
            byteArrayOf(0xe2.toByte(), 0x28, 0xa1.toByte()),
        )
    for (bytes in invalid) {
      val prefix = Writer().tag(10).varint(bytes.size.toLong()).bytes()
      assertThatThrownBy { TokenStreamContext(prefix + bytes) }
          .isInstanceOf(IllegalArgumentException::class.java)
    }
    val overflow = Writer().tag(8).bytes() + ByteArray(9) { 0x80.toByte() } + byteArrayOf(2)
    assertThatThrownBy { TokenStreamContext(overflow) }
        .isInstanceOf(IllegalArgumentException::class.java)
  }

  @Test
  fun indexesDeepDocumentsWithoutRecursiveParsing() {
    val writer = Writer()
    repeat(2048) { writer.tag(3) }
    writer.tag(1).name("value").integer(42).tag(2)
    repeat(2048) { writer.tag(4) }
    val context = TokenStreamContext(writer.bytes())
    var array = context.getArray()
    repeat(2047) { array = checkNotNull(array.getArray(0)) }

    assertThat(array.getMap(0)?.getInt("value")).isEqualTo(42)
    var materialized: Any? = context.getArray().toArrayList()
    repeat(2048) { materialized = (checkNotNull(materialized) as List<*>)[0] }
    assertThat(materialized).isEqualTo(mapOf("value" to 42.0))
  }

  @Test
  fun materializesDeepMapsAndArraysWithoutRecursiveCalls() {
    val writer = Writer()
    repeat(2048) { index -> if (index % 2 == 0) writer.tag(1).name("child") else writer.tag(3) }
    writer.tag(1).name("value").integer(42).tag(2)
    for (index in 2047 downTo 0) writer.tag(if (index % 2 == 0) 2 else 4)
    val context = TokenStreamContext(writer.bytes())
    var materialized: Any? = context.getMap().toHashMap()
    repeat(2048) { index ->
      materialized =
          if (index % 2 == 0) (checkNotNull(materialized) as Map<*, *>)["child"]
          else (checkNotNull(materialized) as List<*>)[0]
    }

    assertThat(materialized).isEqualTo(mapOf("value" to 42.0))
  }
}
