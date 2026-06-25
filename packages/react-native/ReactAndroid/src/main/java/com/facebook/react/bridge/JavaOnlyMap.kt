/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import java.util.HashMap
import kotlin.collections.Iterator
import kotlin.collections.Map

/**
 * Java [HashMap] backed implementation of [ReadableMap] and [WritableMap] Instances of this class
 * SHOULD NOT be used for communication between java and JS, use instances of [WritableNativeMap]
 * created via [Arguments#createMap] or just [ReadableMap] interface if you want your "native"
 * module method to take a map from JS as an argument.
 *
 * Main purpose for this class is to be used in java-only unit tests, but could also be used outside
 * of tests in the code that operates only in java and needs to communicate with RN modules via
 * their JS-exposed API.
 */
public class JavaOnlyMap() : ReadableMap, WritableMap {
  public companion object {
    @JvmStatic public fun of(vararg keysAndValues: Any?): JavaOnlyMap = JavaOnlyMap(*keysAndValues)

    @JvmStatic public fun from(map: Map<String, Any?>): JavaOnlyMap = JavaOnlyMap(map)

    @JvmStatic
    public fun deepClone(map: ReadableMap?): JavaOnlyMap {
      val res = JavaOnlyMap()
      if (map == null) {
        return res
      }
      val iter = map.keySetIterator()
      while (iter.hasNextKey()) {
        val propKey = iter.nextKey()
        val type = map.getType(propKey)
        when (type) {
          ReadableType.Null -> res.putNull(propKey)
          ReadableType.Boolean -> res.putBoolean(propKey, map.getBoolean(propKey))
          ReadableType.Number -> res.putDouble(propKey, map.getDouble(propKey))
          ReadableType.String -> res.putString(propKey, map.getString(propKey))
          ReadableType.Map -> res.putMap(propKey, deepClone(map.getMap(propKey)))
          ReadableType.Array ->
              res.putArray(propKey, JavaOnlyArray.deepClone(map.getArray(propKey)))
        }
      }
      return res
    }
  }

  private val backingMap: MutableMap<String, Any?> = HashMap()

  /** @param keysAndValues keys and values, interleaved */
  private constructor(vararg keysAndValues: Any?) : this() {
    require(keysAndValues.size % 2 == 0) { "You must provide the same number of keys and values" }
    for (i in keysAndValues.indices step 2) {
      var value = keysAndValues[i + 1]
      if (value is Number) {
        // all values from JS are doubles, so emulate that here for tests.
        value = value.toDouble()
      }
      backingMap[keysAndValues[i] as String] = value
    }
  }

  override fun hasKey(name: String): Boolean = backingMap.containsKey(name)

  override fun isNull(name: String): Boolean = backingMap[name] == null

  override fun getBoolean(name: String): Boolean = backingMap[name] as Boolean

  override fun getDouble(name: String): Double = (backingMap[name] as Number).toDouble()

  override fun getInt(name: String): Int = (backingMap[name] as Number).toInt()

  override fun getLong(name: String): Long = (backingMap[name] as Number).toLong()

  override fun getString(name: String): String? = backingMap[name] as String?

  override fun getMap(name: String): ReadableMap? = backingMap[name] as ReadableMap?

  override fun getArray(name: String): ReadableArray? = backingMap[name] as ReadableArray?

  override fun getDynamic(name: String): Dynamic = DynamicFromMap.create(this, name)

  override fun getType(name: String): ReadableType {
    val value = backingMap[name]
    return when {
      value == null -> ReadableType.Null
      value is Number -> ReadableType.Number
      value is String -> ReadableType.String
      value is Boolean -> ReadableType.Boolean
      value is ReadableMap -> ReadableType.Map
      value is ReadableArray -> ReadableType.Array
      value is Dynamic -> value.type
      else -> {
        throw IllegalArgumentException(
            "Invalid value $value for key $name contained in JavaOnlyMap"
        )
      }
    }
  }

  override val entryIterator: Iterator<Map.Entry<String, Any?>>
    get() = backingMap.entries.iterator()

  override fun keySetIterator(): ReadableMapKeySetIterator {
    return object : ReadableMapKeySetIterator {
      private val iterator = backingMap.entries.iterator()

      override fun hasNextKey(): Boolean = iterator.hasNext()

      override fun nextKey(): String = iterator.next().key
    }
  }

  override fun putBoolean(key: String, value: Boolean) {
    backingMap[key] = value
  }

  override fun putDouble(key: String, value: Double) {
    backingMap[key] = value
  }

  override fun putInt(key: String, value: Int) {
    backingMap[key] = value.toDouble()
  }

  override fun putLong(key: String, value: Long) {
    backingMap[key] = value.toDouble()
  }

  override fun putString(key: String, value: String?) {
    backingMap[key] = value
  }

  override fun putNull(key: String) {
    backingMap[key] = null
  }

  override fun putMap(key: String, value: ReadableMap?) {
    backingMap[key] = value
  }

  override fun merge(source: ReadableMap) {
    backingMap.putAll((source as JavaOnlyMap).backingMap)
  }

  override fun copy(): WritableMap {
    val target = JavaOnlyMap()
    target.merge(this)
    return target
  }

  override fun putArray(key: String, value: ReadableArray?) {
    backingMap[key] = value
  }

  public fun remove(key: String) {
    backingMap.remove(key)
  }

  override fun toHashMap(): HashMap<String, Any?> = HashMap<String, Any?>(backingMap)

  override fun toString(): String = backingMap.toString()

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }
    if (other !is JavaOnlyMap) {
      return false
    }
    val thisBackingMap = backingMap
    val otherBackingMap = other.backingMap
    return thisBackingMap == otherBackingMap
  }

  override fun hashCode(): Int = backingMap.hashCode()
}
