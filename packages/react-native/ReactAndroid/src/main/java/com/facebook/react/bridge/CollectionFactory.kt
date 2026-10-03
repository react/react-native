/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * Creates a [WritableMap] with the given key-value pairs.
 *
 * Example:
 * ```
 * val map = writableMapOf(
 *     "name" to "Alice",
 *     "age" to 30,
 *     "active" to true
 * )
 * ```
 *
 * Supported value types: null, Boolean, Int, Long, Float, Double, String, ReadableMap,
 * ReadableArray, WritableMap, WritableArray.
 *
 * @throws IllegalArgumentException if a value is of unsupported type
 */
public fun writableMapOf(vararg pairs: Pair<String, Any?>): WritableMap {
  val map = Arguments.createMap()
  for ((key, value) in pairs) {
    putValue(map, key, value)
  }
  return map
}

private fun putValue(map: WritableMap, key: String, value: Any?) {
  when (value) {
    null -> map.putNull(key)
    is Boolean -> map.putBoolean(key, value)
    is Int -> map.putInt(key, value)
    is Long -> map.putDouble(key, value.toDouble())
    is Float -> map.putDouble(key, value.toDouble())
    is Double -> map.putDouble(key, value)
    is String -> map.putString(key, value)
    is ReadableMap -> map.putMap(key, value)
    is ReadableArray -> map.putArray(key, value)
    else -> {
      throw IllegalArgumentException(
        "Unsupported value type: ${value.javaClass.name} for key '$key'"
      )
    }
  }
}

/**
 * Creates a [WritableArray] with the given elements.
 *
 * Example:
 * ```
 * val array = writableArrayOf("apple", "banana", "cherry")
 * val mixed = writableArrayOf(1, "two", true, 4.0)
 * ```
 *
 * Supported element types: null, Boolean, Int, Long, Float, Double, String, ReadableMap,
 * ReadableArray, WritableMap, WritableArray.
 *
 * @throws IllegalArgumentException if an element is of unsupported type
 */
public fun writableArrayOf(vararg elements: Any?): WritableArray {
  val array = Arguments.createArray()
  for (element in elements) {
    pushValue(array, element)
  }
  return array
}

private fun pushValue(array: WritableArray, value: Any?) {
  when (value) {
    null -> array.pushNull()
    is Boolean -> array.pushBoolean(value)
    is Int -> array.pushInt(value)
    is Long -> array.pushDouble(value.toDouble())
    is Float -> array.pushDouble(value.toDouble())
    is Double -> array.pushDouble(value)
    is String -> array.pushString(value)
    is ReadableMap -> array.pushMap(value)
    is ReadableArray -> array.pushArray(value)
    else -> {
      throw IllegalArgumentException("Unsupported element type: ${value.javaClass.name}")
    }
  }
}

/**
 * Creates a [ReadableMap] with the given key-value pairs. Returns an immutable view - mutations are
 * not possible through the returned interface.
 *
 * Example:
 * ```
 * val map = readableMapOf("key" to "value", "count" to 42)
 * ```
 */
public fun readableMapOf(vararg pairs: Pair<String, Any?>): ReadableMap = writableMapOf(*pairs)

/**
 * Creates a [ReadableArray] with the given elements. Returns an immutable view - mutations are not
 * possible through the returned interface.
 *
 * Example:
 * ```
 * val array = readableArrayOf(1, 2, 3)
 * ```
 */
public fun readableArrayOf(vararg elements: Any?): ReadableArray = writableArrayOf(*elements)
