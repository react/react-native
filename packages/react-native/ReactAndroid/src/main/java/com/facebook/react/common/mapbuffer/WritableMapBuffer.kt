/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.mapbuffer

import android.util.SparseArray
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.StableReactNativeAPI
import com.facebook.react.common.mapbuffer.MapBuffer.Companion.KEY_RANGE
import com.facebook.react.common.mapbuffer.MapBuffer.DataType
import javax.annotation.concurrent.NotThreadSafe

/**
 * Implementation of writeable Java-only MapBuffer, which can be used to send information through
 * JNI.
 *
 * See [MapBuffer] for more details
 */
@StableReactNativeAPI
@NotThreadSafe
@DoNotStrip
internal class WritableMapBuffer : MapBuffer {
  private val values: SparseArray<Any> = SparseArray<Any>()

  /*
   * Write methods
   */

  /**
   * Adds a boolean value for given key to the MapBuffer.
   *
   * @param key entry key
   * @param value entry value
   * @throws IllegalArgumentException if key is out of [UShort] range
   */
  fun put(key: Int, value: Boolean): WritableMapBuffer = putInternal(key, value)

  /**
   * Adds an int value for given key to the MapBuffer.
   *
   * @param key entry key
   * @param value entry value
   * @throws IllegalArgumentException if key is out of [UShort] range
   */
  fun put(key: Int, value: Int): WritableMapBuffer = putInternal(key, value)

  /**
   * Adds a long value for given key to the MapBuffer.
   *
   * @param key entry key
   * @param value entry value
   * @throws IllegalArgumentException if key is out of [UShort] range
   */
  fun put(key: Int, value: Long): WritableMapBuffer = putInternal(key, value)

  /**
   * Adds a double value for given key to the MapBuffer.
   *
   * @param key entry key
   * @param value entry value
   * @throws IllegalArgumentException if key is out of [UShort] range
   */
  fun put(key: Int, value: Double): WritableMapBuffer = putInternal(key, value)

  /**
   * Adds a string value for given key to the MapBuffer.
   *
   * @param key entry key
   * @param value entry value
   * @throws IllegalArgumentException if key is out of [UShort] range
   */
  fun put(key: Int, value: String): WritableMapBuffer = putInternal(key, value)

  /**
   * Adds a [MapBuffer] value for given key to the current MapBuffer.
   *
   * @param key entry key
   * @param value entry value
   * @throws IllegalArgumentException if key is out of [UShort] range
   */
  fun put(key: Int, value: MapBuffer): WritableMapBuffer = putInternal(key, value)

  /**
   * Adds an [IntArray] value for given key to the current MapBuffer.
   *
   * @param key entry key
   * @param value entry value
   * @throws IllegalArgumentException if key is out of [UShort] range
   */
  fun put(key: Int, value: IntArray): WritableMapBuffer = putInternal(key, value)

  /**
   * Adds a [DoubleArray] value for given key to the current MapBuffer.
   *
   * @param key entry key
   * @param value entry value
   * @throws IllegalArgumentException if key is out of [UShort] range
   */
  fun put(key: Int, value: DoubleArray): WritableMapBuffer = putInternal(key, value)

  private fun putInternal(key: Int, value: Any): WritableMapBuffer {
    require(key in KEY_RANGE) {
      "Only integers in [${UShort.MIN_VALUE};${UShort.MAX_VALUE}] range are allowed for keys."
    }

    values.put(key, value)
    return this
  }

  /*
   * Read methods
   */

  override val count: Int
    get() = values.size()

  override fun contains(key: Int): Boolean = values.get(key) != null

  override fun getKeyOffset(key: Int): Int = values.indexOfKey(key)

  override fun entryAt(offset: Int): MapBuffer.Entry = MapBufferEntry(offset)

  override fun getType(key: Int): DataType {
    val value = values.get(key)
    require(value != null) { "Key not found: $key" }
    return value.dataType(key)
  }

  override fun getBoolean(key: Int): Boolean = verifyValue(key, values.get(key))

  override fun getInt(key: Int): Int = verifyValue(key, values.get(key))

  override fun getLong(key: Int): Long = verifyValue(key, values.get(key))

  override fun getDouble(key: Int): Double = verifyValue(key, values.get(key))

  override fun getString(key: Int): String = verifyValue(key, values.get(key))

  override fun getMapBuffer(key: Int): MapBuffer = verifyValue(key, values.get(key))

  override fun getMapBufferList(key: Int): List<MapBuffer> = verifyValue(key, values.get(key))

  override fun getIntBuffer(key: Int): IntArray = verifyValue(key, values.get(key))

  override fun getDoubleBuffer(key: Int): DoubleArray = verifyValue(key, values.get(key))

  /** Generalizes verification of the value types based on the requested type. */
  private inline fun <reified T> verifyValue(key: Int, value: Any?): T {
    require(value != null) { "Key not found: $key" }
    check(value is T) {
      "Expected ${T::class.java} for key: $key, found ${value.javaClass} instead."
    }
    return value
  }

  private fun Any.dataType(key: Int): DataType {
    return when (val value = this) {
      is Boolean -> DataType.BOOL
      is Int -> DataType.INT
      is Long -> DataType.LONG
      is Double -> DataType.DOUBLE
      is String -> DataType.STRING
      is MapBuffer -> DataType.MAP
      is IntArray -> DataType.INT_BUFFER
      is DoubleArray -> DataType.DOUBLE_BUFFER
      else -> throw IllegalStateException("Key $key has value of unknown type: ${value.javaClass}")
    }
  }

  override fun iterator(): Iterator<MapBuffer.Entry> =
      object : Iterator<MapBuffer.Entry> {
        var count = 0

        override fun hasNext(): Boolean = count < values.size()

        override fun next(): MapBuffer.Entry = MapBufferEntry(count++)
      }

  private inner class MapBufferEntry(private val index: Int) : MapBuffer.Entry {
    override val key: Int = values.keyAt(index)
    override val type: DataType = values.valueAt(index).dataType(key)
    override val booleanValue: Boolean
      get() = verifyValue(key, values.valueAt(index))

    override val intValue: Int
      get() = verifyValue(key, values.valueAt(index))

    override val longValue: Long
      get() = verifyValue(key, values.valueAt(index))

    override val doubleValue: Double
      get() = verifyValue(key, values.valueAt(index))

    override val stringValue: String
      get() = verifyValue(key, values.valueAt(index))

    override val mapBufferValue: MapBuffer
      get() = verifyValue(key, values.valueAt(index))

    override val intBufferValue: IntArray
      get() = verifyValue(key, values.valueAt(index))

    override val doubleBufferValue: DoubleArray
      get() = verifyValue(key, values.valueAt(index))
  }

  /*
   * JNI hooks
   */

  @DoNotStrip
  @Suppress("UNUSED")
  /** JNI hook for MapBuffer to retrieve sorted keys from this class. */
  private fun getKeys(): IntArray = IntArray(values.size()) { values.keyAt(it) }

  @DoNotStrip
  @Suppress("UNUSED")
  /** JNI hook for MapBuffer to retrieve sorted values from this class. */
  private fun getValues(): Array<Any> = Array(values.size()) { values.valueAt(it) }
}
