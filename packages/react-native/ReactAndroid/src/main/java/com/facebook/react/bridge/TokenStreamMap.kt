/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * Owns a version-one binary token stream document and its shared string table. Container and string
 * offsets are indexed before any maps are exposed, so reading one map never advances another map's
 * decoder. The constructor copies the input; [fromOwnedBytes] accepts ownership without copying.
 *
 * This reader supports ordinary values, not the embedded-document tag. A mounting batch should
 * encode its props as objects in one document, sharing the string table across those objects.
 * Malformed documents throw [IllegalArgumentException] during construction.
 */
@UnstableReactNativeAPI
public class TokenStreamContext private constructor(bytes: ByteArray, copy: Boolean) {
  /** Copies the document so later changes to the caller's buffer cannot affect retained maps. */
  public constructor(bytes: ByteArray) : this(bytes, true)

  private val bytes = if (copy) bytes.copyOf() else bytes
  private val containers = HashMap<Int, Container>()
  private val stringIds = HashMap<Int, Int>()
  private val strings = ArrayList<StringSlice>()
  private val numbers = HashMap<Int, Double>()

  init {
    require(
        this.bytes.size >= 4 &&
            this.bytes[0] == 0x42.toByte() &&
            this.bytes[1] == 0x54.toByte() &&
            this.bytes[2] == 0x53.toByte() &&
            this.bytes[3] == 1.toByte(),
    ) {
      "Not a BTS v1 document"
    }
    indexDocument()
  }

  /** Returns an object at a previously indexed token offset, or the root object by default. */
  public fun getMap(offset: Int = 4): TokenStreamMap {
    require(containerAt(offset).tag == START_OBJECT) { "No object at offset $offset" }
    return TokenStreamMap(this, offset)
  }

  /** Returns an array at a previously indexed token offset, or the root array by default. */
  public fun getArray(offset: Int = 4): ReadableArray {
    require(containerAt(offset).tag == START_ARRAY) { "No array at offset $offset" }
    return TokenStreamArray(this, containerAt(offset).values)
  }

  internal inner class Container(val tag: Int, val names: IntArray, val values: IntArray) {
    val fields: Map<String, Int> by lazy {
      LinkedHashMap<String, Int>().apply {
        for (i in names.indices) put(stringAt(names[i]), this@Container.values[i])
      }
    }
  }

  private class StringSlice(val offset: Int, val length: Int) {
    @Volatile var decoded: String? = null
  }

  private class Frame(val offset: Int, val tag: Int) {
    val names = ArrayList<Int>()
    val values = ArrayList<Int>()
    var name = -1
  }

  internal fun containerAt(offset: Int): Container =
      containers[offset] ?: throw IllegalArgumentException("No container at offset $offset")

  internal fun stringAt(id: Int): String {
    val slice = strings[id]
    slice.decoded?.let {
      return it
    }
    return synchronized(slice) {
      slice.decoded
          ?: String(bytes, slice.offset, slice.length, Charsets.UTF_8).also { slice.decoded = it }
    }
  }

  internal fun typeAt(offset: Int): ReadableType =
      when (bytes[offset].toInt()) {
        START_OBJECT -> ReadableType.Map
        START_ARRAY -> ReadableType.Array
        NULL -> ReadableType.Null
        FALSE,
        TRUE -> ReadableType.Boolean
        INTEGER,
        NUMBER -> ReadableType.Number
        STRING,
        STRING_REF -> ReadableType.String
        else -> error("Not a value at offset $offset")
      }

  internal fun booleanAt(offset: Int): Boolean {
    requireType(offset, ReadableType.Boolean)
    return bytes[offset].toInt() == TRUE
  }

  internal fun doubleAt(offset: Int): Double {
    requireType(offset, ReadableType.Number)
    return if (bytes[offset].toInt() == INTEGER) Cursor(offset + 1).integer().toDouble()
    else checkNotNull(numbers[offset])
  }

  internal fun longAt(offset: Int): Long {
    requireType(offset, ReadableType.Number)
    return if (bytes[offset].toInt() == INTEGER) Cursor(offset + 1).integer()
    else doubleAt(offset).toLong()
  }

  internal fun nullableStringAt(offset: Int): String? {
    if (typeAt(offset) == ReadableType.Null) return null
    requireType(offset, ReadableType.String)
    return stringAt(checkNotNull(stringIds[offset]))
  }

  internal fun nullableMapAt(offset: Int): ReadableMap? {
    if (typeAt(offset) == ReadableType.Null) return null
    requireType(offset, ReadableType.Map)
    return getMap(offset)
  }

  internal fun nullableArrayAt(offset: Int): ReadableArray? {
    if (typeAt(offset) == ReadableType.Null) return null
    requireType(offset, ReadableType.Array)
    return getArray(offset)
  }

  internal fun valueAt(offset: Int): Any? =
      when (typeAt(offset)) {
        ReadableType.Null -> null
        ReadableType.Boolean -> booleanAt(offset)
        ReadableType.Number -> doubleAt(offset)
        ReadableType.String -> nullableStringAt(offset)
        ReadableType.Map -> nullableMapAt(offset)
        ReadableType.Array -> nullableArrayAt(offset)
      }

  private class MaterializationFrame(
      val container: Container,
      val map: HashMap<String, Any?>?,
      val array: ArrayList<Any?>?,
  ) {
    var index = 0
  }

  private fun materializationFrame(offset: Int): MaterializationFrame {
    val container = containerAt(offset)
    return if (container.tag == START_OBJECT) {
      MaterializationFrame(container, HashMap(), null)
    } else {
      MaterializationFrame(container, null, ArrayList(container.values.size))
    }
  }

  internal fun materializedValueAt(offset: Int): Any? {
    if (typeAt(offset) != ReadableType.Map && typeAt(offset) != ReadableType.Array) {
      return valueAt(offset)
    }
    val root = materializationFrame(offset)
    val stack = ArrayDeque<MaterializationFrame>()
    stack.addLast(root)
    while (stack.isNotEmpty()) {
      val frame = stack.last()
      if (frame.index == frame.container.values.size) {
        stack.removeLast()
        continue
      }
      val index = frame.index++
      val childOffset = frame.container.values[index]
      val type = typeAt(childOffset)
      val child =
          if (type == ReadableType.Map || type == ReadableType.Array) {
            materializationFrame(childOffset)
          } else {
            null
          }
      val value = if (child != null) child.map ?: child.array else valueAt(childOffset)
      if (frame.map != null) {
        frame.map[stringAt(frame.container.names[index])] = value
      } else {
        checkNotNull(frame.array).add(value)
      }
      if (child != null) stack.addLast(child)
    }
    return root.map ?: root.array
  }

  private fun requireType(offset: Int, expected: ReadableType) {
    val actual = typeAt(offset)
    if (actual != expected) {
      throw UnexpectedNativeTypeException("Expected $expected, got $actual")
    }
  }

  private inner class Cursor(var position: Int) {
    fun byte(): Int {
      require(position < bytes.size) { "Truncated BTS document" }
      return bytes[position++].toInt() and 0xff
    }

    fun varint(): Long {
      var value = 0L
      for (shift in 0..63 step 7) {
        val byte = byte()
        require(shift != 63 || byte <= 1) { "Overflowing BTS varint" }
        value = value or ((byte and 0x7f).toLong() shl shift)
        if (byte and 0x80 == 0) return value
      }
      throw IllegalArgumentException("Malformed BTS varint")
    }

    fun integer(): Long {
      val zigzag = varint()
      return (zigzag ushr 1) xor -(zigzag and 1)
    }

    fun length(): Int {
      val length = varint()
      require(length >= 0 && length <= bytes.size - position) { "Invalid BTS string length" }
      return length.toInt()
    }

    fun stringId(tag: Int): Int {
      if (tag == STRING_REF || tag == NAME_REF) {
        val id = varint()
        require(id >= 0 && id < strings.size) { "Invalid BTS string reference" }
        return id.toInt()
      }
      val length = length()
      validateUtf8(position, length)
      strings.add(StringSlice(position, length))
      position += length
      return strings.lastIndex
    }
  }

  private fun indexDocument() {
    val cursor = Cursor(4)
    val stack = ArrayDeque<Frame>()
    var hasRoot = false

    fun recordValue(offset: Int) {
      val parent = stack.lastOrNull()
      if (parent == null) {
        require(!hasRoot) { "Multiple BTS root values" }
        hasRoot = true
      } else {
        if (parent.tag == START_OBJECT) {
          require(parent.name != -1) { "BTS object value has no name" }
          parent.names.add(parent.name)
          parent.name = -1
        }
        parent.values.add(offset)
      }
    }

    while (cursor.position < bytes.size) {
      val offset = cursor.position
      when (val tag = cursor.byte()) {
        START_OBJECT,
        START_ARRAY -> {
          recordValue(offset)
          stack.addLast(Frame(offset, tag))
        }
        END_OBJECT,
        END_ARRAY -> {
          val frame = stack.removeLastOrNull()
          require(frame != null && frame.tag == tag - 1 && frame.name == -1) {
            "Unbalanced BTS container"
          }
          containers[frame.offset] =
              Container(frame.tag, frame.names.toIntArray(), frame.values.toIntArray())
        }
        NAME,
        NAME_REF -> {
          val frame = stack.lastOrNull()
          require(frame != null && frame.tag == START_OBJECT && frame.name == -1) {
            "Unexpected BTS property name"
          }
          frame.name = cursor.stringId(tag)
        }
        STRING,
        STRING_REF -> {
          recordValue(offset)
          stringIds[offset] = cursor.stringId(tag)
        }
        INTEGER -> {
          recordValue(offset)
          cursor.varint()
        }
        NUMBER -> {
          recordValue(offset)
          val length = cursor.length()
          val text = String(bytes, cursor.position, length, Charsets.US_ASCII)
          numbers[offset] =
              text.toDoubleOrNull()
                  ?: throw IllegalArgumentException("Invalid number in token stream")
          cursor.position += length
        }
        NULL,
        FALSE,
        TRUE -> recordValue(offset)
        else -> throw IllegalArgumentException("Unsupported BTS tag $tag")
      }
    }
    require(hasRoot && stack.isEmpty()) { "Incomplete BTS document" }
  }

  private fun validateUtf8(offset: Int, length: Int) {
    var position = offset
    val end = offset + length
    while (position < end) {
      val lead = bytes[position++].toInt() and 0xff
      if (lead < 0x80) continue
      val continuationCount =
          when (lead) {
            in 0xc2..0xdf -> 1
            in 0xe0..0xef -> 2
            in 0xf0..0xf4 -> 3
            else -> throw IllegalArgumentException("Invalid BTS UTF-8")
          }
      require(continuationCount <= end - position) { "Truncated BTS UTF-8" }
      val second = bytes[position].toInt() and 0xff
      require(
          when (lead) {
            0xe0 -> second in 0xa0..0xbf
            0xed -> second in 0x80..0x9f
            0xf0 -> second in 0x90..0xbf
            0xf4 -> second in 0x80..0x8f
            else -> second in 0x80..0xbf
          },
      ) {
        "Invalid BTS UTF-8"
      }
      repeat(continuationCount) {
        require(bytes[position++].toInt() and 0xc0 == 0x80) { "Invalid BTS UTF-8" }
      }
    }
  }

  public companion object {
    /**
     * Takes ownership of a document without copying its bytes. The caller must not modify the
     * buffer after this call. Maps and arrays keep the buffer alive through their shared context.
     */
    @JvmStatic
    public fun fromOwnedBytes(bytes: ByteArray): TokenStreamContext =
        TokenStreamContext(bytes, false)

    private const val START_OBJECT = 1
    private const val END_OBJECT = 2
    private const val START_ARRAY = 3
    private const val END_ARRAY = 4
    private const val NULL = 5
    private const val FALSE = 6
    private const val TRUE = 7
    private const val INTEGER = 8
    private const val NUMBER = 9
    private const val STRING = 10
    private const val STRING_REF = 11
    private const val NAME = 12
    private const val NAME_REF = 13
  }
}

/**
 * A read-only object view into a [TokenStreamContext]. Maps share decoded strings but not read
 * cursors or iteration state. Missing keys throw [NoSuchKeyException]; explicit nulls remain
 * distinguishable from absent keys. Native-map-only operations such as [WritableNativeMap.merge]
 * require materializing this map into a compatible native map first.
 */
@UnstableReactNativeAPI
public class TokenStreamMap
internal constructor(
    private val context: TokenStreamContext,
    offset: Int,
) : ReadableMap {
  private val container = context.containerAt(offset)
  private val fields: Map<String, Int>
    get() = container.fields

  private fun offset(name: String): Int = fields[name] ?: throw NoSuchKeyException(name)

  override fun hasKey(name: String): Boolean = fields.containsKey(name)

  override fun isNull(name: String): Boolean = getType(name) == ReadableType.Null

  override fun getType(name: String): ReadableType = context.typeAt(offset(name))

  override fun getBoolean(name: String): Boolean = context.booleanAt(offset(name))

  override fun getDouble(name: String): Double = context.doubleAt(offset(name))

  override fun getInt(name: String): Int = getDouble(name).toInt()

  override fun getLong(name: String): Long = context.longAt(offset(name))

  override fun getString(name: String): String? = context.nullableStringAt(offset(name))

  override fun getMap(name: String): ReadableMap? = context.nullableMapAt(offset(name))

  override fun getArray(name: String): ReadableArray? = context.nullableArrayAt(offset(name))

  override fun getDynamic(name: String): Dynamic = DynamicFromMap.create(this, name)

  override fun keySetIterator(): ReadableMapKeySetIterator {
    val iterator = fields.keys.iterator()
    return object : ReadableMapKeySetIterator {
      override fun hasNextKey(): Boolean = iterator.hasNext()

      override fun nextKey(): String = iterator.next()
    }
  }

  override val entryIterator: Iterator<Map.Entry<String, Any?>>
    get() =
        fields.entries
            .asSequence()
            .map { java.util.AbstractMap.SimpleImmutableEntry(it.key, context.valueAt(it.value)) }
            .iterator()

  override fun toHashMap(): HashMap<String, Any?> =
      HashMap<String, Any?>().apply {
        for ((name, offset) in fields) put(name, context.materializedValueAt(offset))
      }
}

@OptIn(UnstableReactNativeAPI::class)
private class TokenStreamArray(
    private val context: TokenStreamContext,
    private val offsets: IntArray,
) : ReadableArray {
  override fun size(): Int = offsets.size

  override fun isNull(index: Int): Boolean = getType(index) == ReadableType.Null

  override fun getType(index: Int): ReadableType = context.typeAt(offsets[index])

  override fun getBoolean(index: Int): Boolean = context.booleanAt(offsets[index])

  override fun getDouble(index: Int): Double = context.doubleAt(offsets[index])

  override fun getInt(index: Int): Int = getDouble(index).toInt()

  override fun getLong(index: Int): Long = context.longAt(offsets[index])

  override fun getString(index: Int): String? = context.nullableStringAt(offsets[index])

  override fun getMap(index: Int): ReadableMap? = context.nullableMapAt(offsets[index])

  override fun getArray(index: Int): ReadableArray? = context.nullableArrayAt(offsets[index])

  override fun getDynamic(index: Int): Dynamic = DynamicFromArray.create(this, index)

  override fun toArrayList(): ArrayList<Any?> =
      ArrayList<Any?>(offsets.size).apply {
        for (offset in offsets) add(context.materializedValueAt(offset))
      }
}
