/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.os.Bundle
import android.os.Parcelable
import com.facebook.proguard.annotations.DoNotStrip
import java.util.AbstractList
import kotlin.math.round

@DoNotStrip
public object Arguments {
  @Suppress("UNCHECKED_CAST")
  private fun makeNativeObject(value: Any?): Any? =
      when {
        value == null -> null
        value is Float || value is Long || value is Byte || value is Short ->
            (value as Number).toDouble()
        value.javaClass.isArray -> makeNativeArray<Any>(value)
        value is List<*> -> makeNativeArray(value)
        value is Map<*, *> -> makeNativeMap(value as Map<String, Any?>)
        value is Bundle -> makeNativeMap(value)
        value is JavaOnlyMap -> makeNativeMap(value.toHashMap())
        value is JavaOnlyArray -> makeNativeArray(value.toArrayList())
        else -> value // Boolean, Integer, Double, String, WritableNativeArray, WritableNativeMap
      }

  /**
   * This method converts a List into a NativeArray. The data types supported are boolean, int,
   * float, double, and String. List, Map, and Bundle objects, as well as arrays, containing values
   * of the above types and/or null, or any recursive arrangement of these, are also supported. The
   * best way to think of this is a way to generate a Java representation of a json list, from Java
   * types which have a natural representation in json.
   */
  @JvmStatic
  public fun makeNativeArray(objects: List<*>?): WritableNativeArray {
    val nativeArray = WritableNativeArray()
    if (objects == null) {
      return nativeArray
    }
    for (elem in objects) {
      when (val value = makeNativeObject(elem)) {
        null -> nativeArray.pushNull()
        is Boolean -> nativeArray.pushBoolean(value)
        is Int -> nativeArray.pushInt(value)
        is Double -> nativeArray.pushDouble(value)
        is String -> nativeArray.pushString(value)
        is WritableNativeArray -> nativeArray.pushArray(value)
        is WritableNativeMap -> nativeArray.pushMap(value)
        else -> throw IllegalArgumentException("Could not convert ${value.javaClass}")
      }
    }
    return nativeArray
  }

  /**
   * This overload is like the above, but uses reflection to operate on any primitive or object
   * type.
   */
  @JvmStatic
  public fun <T> makeNativeArray(objects: Any?): WritableNativeArray {
    if (objects == null) {
      return WritableNativeArray()
    }
    // No explicit check for objects's type here.  If it's not an array, the
    // Array methods will throw IllegalArgumentException.
    return makeNativeArray(
        object : AbstractList<Any?>() {
          override val size: Int
            get() = java.lang.reflect.Array.getLength(objects)

          override fun get(index: Int): Any? = java.lang.reflect.Array.get(objects, index)
        }
    )
  }

  private fun addEntry(nativeMap: WritableNativeMap, key: String, value: Any?) {
    when (val nativeObjectValue = makeNativeObject(value)) {
      null -> nativeMap.putNull(key)
      is Boolean -> nativeMap.putBoolean(key, nativeObjectValue)
      is Int -> nativeMap.putInt(key, nativeObjectValue)
      is Number -> nativeMap.putDouble(key, nativeObjectValue.toDouble())
      is String -> nativeMap.putString(key, nativeObjectValue)
      is WritableNativeArray -> nativeMap.putArray(key, nativeObjectValue)
      is WritableNativeMap -> nativeMap.putMap(key, nativeObjectValue)
      else -> throw IllegalArgumentException("Could not convert ${nativeObjectValue.javaClass}")
    }
  }

  /**
   * This method converts a Map into a NativeMap. Value types are supported as with makeNativeArray.
   * The best way to think of this is a way to generate a Java representation of a json object, from
   * Java types which have a natural representation in json.
   */
  @DoNotStrip
  @JvmStatic
  public fun makeNativeMap(objects: Map<String, Any?>?): WritableNativeMap {
    val nativeMap = WritableNativeMap()
    if (objects == null) {
      return nativeMap
    }
    for ((key, value) in objects) {
      addEntry(nativeMap, key, value)
    }
    return nativeMap
  }

  /** Like the above, but takes a Bundle instead of a Map. */
  @DoNotStrip
  @JvmStatic
  @Suppress("DEPRECATION")
  public fun makeNativeMap(bundle: Bundle?): WritableNativeMap {
    val nativeMap = WritableNativeMap()
    if (bundle == null) {
      return nativeMap
    }
    for (key in bundle.keySet()) {
      addEntry(nativeMap, key, bundle[key])
    }
    return nativeMap
  }

  /** This method should be used when you need to stub out creating NativeArrays in unit tests. */
  @JvmStatic public fun createArray(): WritableArray = WritableNativeArray()

  /** This method should be used when you need to stub out creating NativeMaps in unit tests. */
  @JvmStatic public fun createMap(): WritableMap = WritableNativeMap()

  @Suppress("UNCHECKED_CAST")
  @JvmStatic
  @Deprecated(
      "Use fromJavaArgs(Array<Any?>) instead. This method is added only to retain compatibility with Java consumers."
  )
  public fun fromJavaArgs(args: Any?): WritableNativeArray = fromJavaArgs(args as Array<Any?>)

  @JvmStatic
  @Suppress("PLATFORM_CLASS_MAPPED_TO_KOTLIN")
  public fun fromJavaArgs(args: Array<Any?>): WritableNativeArray {
    val arguments = WritableNativeArray()
    for (i in args.indices) {
      val argument = args[i]
      when (val argumentClass = argument?.javaClass) {
        null -> arguments.pushNull()
        Boolean::class.java,
        java.lang.Boolean::class.java -> arguments.pushBoolean(argument as Boolean)
        Int::class.java,
        java.lang.Integer::class.java -> arguments.pushDouble((argument as Number).toDouble())
        Double::class.java,
        java.lang.Double::class.java -> arguments.pushDouble((argument as Double))
        Float::class.java -> arguments.pushDouble((argument as Float).toDouble())
        java.lang.Float::class.java -> arguments.pushDouble((argument as Float).toDouble())
        String::class.java -> arguments.pushString(argument.toString())
        WritableNativeMap::class.java -> arguments.pushMap(argument as WritableNativeMap)
        WritableNativeArray::class.java -> arguments.pushArray(argument as WritableNativeArray)
        else -> throw RuntimeException("Cannot convert argument of type $argumentClass")
      }
    }
    return arguments
  }

  /**
   * Convert an array to a [WritableArray].
   *
   * @param array the array to convert. Supported types are: `String[]`, `Bundle[]`, `int[]`,
   *   `float[]`, `double[]`, `boolean[]`.
   * @return the converted [WritableArray]
   * @throws IllegalArgumentException if the passed object is none of the above types
   */
  @JvmStatic
  @Suppress("UNCHECKED_CAST")
  public fun fromArray(array: Any): WritableArray {
    val catalystArray = createArray()
    when {
      array is Array<*> && array.isArrayOf<String>() -> {
        for (v in array as Array<String?>) {
          catalystArray.pushString(v)
        }
      }
      array is Array<*> && array.isArrayOf<Bundle>() -> {
        for (v in array as Array<Bundle>) {
          catalystArray.pushMap(fromBundle(v))
        }
      }
      array is IntArray -> {
        for (v in array) {
          catalystArray.pushInt(v)
        }
      }
      array is FloatArray -> {
        for (v in array) {
          catalystArray.pushDouble(v.toDouble())
        }
      }
      array is DoubleArray -> {
        for (v in array) {
          catalystArray.pushDouble(v)
        }
      }
      array is BooleanArray -> {
        for (v in array) {
          catalystArray.pushBoolean(v)
        }
      }
      array is Array<*> && array.isArrayOf<Parcelable>() -> {
        for (v in array as Array<Parcelable>) {
          if (v is Bundle) {
            catalystArray.pushMap(fromBundle(v))
          } else {
            throw IllegalArgumentException("Unexpected array member type ${v.javaClass}")
          }
        }
      }
      else -> throw IllegalArgumentException("Unknown array type ${array.javaClass}")
    }
    return catalystArray
  }

  /**
   * Convert a [List] to a [WritableArray].
   *
   * @param list the list to convert. Supported value types are: `null`, `String`, `Bundle`, `List`,
   *   `Number`, `Boolean`, and all array types supported in [.fromArray].
   * @return the converted [WritableArray]
   * @throws IllegalArgumentException if one of the values from the passed list is none of the above
   *   types
   */
  @JvmStatic
  public fun fromList(list: List<*>): WritableArray {
    val catalystArray = createArray()
    for (obj in list) {
      when {
        obj == null -> catalystArray.pushNull()
        obj.javaClass.isArray -> catalystArray.pushArray(fromArray(obj))
        obj is Bundle -> catalystArray.pushMap(fromBundle(obj))
        obj is List<*> -> catalystArray.pushArray(fromList(obj))
        obj is String -> catalystArray.pushString(obj)
        obj is Int -> catalystArray.pushInt(obj)
        obj is Number -> catalystArray.pushDouble(obj.toDouble())
        obj is Boolean -> catalystArray.pushBoolean(obj)
        else -> throw IllegalArgumentException("Unknown value type ${obj.javaClass}")
      }
    }
    return catalystArray
  }

  /**
   * Convert a [Bundle] to a [WritableMap]. Supported key types in the bundle are:
   * * primitive types: int, float, double, boolean
   * * arrays supported by [.fromArray]
   * * lists supported by [.fromList]
   * * [Bundle] objects that are recursively converted to maps
   *
   * @param bundle the [Bundle] to convert
   * @return the converted [WritableMap]
   * @throws IllegalArgumentException if there are keys of unsupported types
   */
  @JvmStatic
  @Suppress("DEPRECATION")
  public fun fromBundle(bundle: Bundle): WritableMap {
    val map = createMap()
    for (key in bundle.keySet()) {
      val value = bundle[key]
      when {
        value == null -> map.putNull(key)
        value.javaClass.isArray -> map.putArray(key, fromArray(value))
        value is String -> map.putString(key, value)
        value is Number -> {
          if (value is Int) {
            map.putInt(key, value)
          } else {
            map.putDouble(key, value.toDouble())
          }
        }
        value is Boolean -> map.putBoolean(key, value)
        value is Bundle -> map.putMap(key, fromBundle(value))
        value is List<*> -> map.putArray(key, fromList(value))
        else -> throw IllegalArgumentException("Could not convert ${value.javaClass}")
      }
    }
    return map
  }

  /**
   * Convert a [WritableArray] to a [ArrayList].
   *
   * @param readableArray the [WritableArray] to convert.
   * @return the converted [ArrayList].
   */
  @JvmStatic
  @Suppress("REDUNDANT_ELSE_IN_WHEN")
  public fun toList(readableArray: ReadableArray?): ArrayList<Any?>? {
    if (readableArray == null) {
      return null
    }

    val list: ArrayList<Any?> = ArrayList()

    for (i in 0..<readableArray.size()) {
      when (readableArray.getType(i)) {
        ReadableType.Null -> list.add(null)
        ReadableType.Boolean -> list.add(readableArray.getBoolean(i))
        ReadableType.Number -> {
          val number = readableArray.getDouble(i)
          if (number == round(number)) {
            // Add as an integer
            list.add(number.toInt())
          } else {
            // Add as a double
            list.add(number)
          }
        }
        ReadableType.String -> list.add(readableArray.getString(i))
        ReadableType.Map -> list.add(toBundle(readableArray.getMap(i)))
        ReadableType.Array -> list.add(toList(readableArray.getArray(i)))
        else -> throw IllegalArgumentException("Could not convert object in array.")
      }
    }

    return list
  }

  /**
   * Convert a [WritableMap] to a [Bundle]. Note: Each array is converted to an [ArrayList].
   *
   * @param readableMap the [WritableMap] to convert.
   * @return the converted [Bundle].
   */
  @JvmStatic
  @Suppress("REDUNDANT_ELSE_IN_WHEN")
  public fun toBundle(readableMap: ReadableMap?): Bundle? {
    if (readableMap == null) {
      return null
    }

    val iterator = readableMap.keySetIterator()
    val bundle = Bundle()

    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      when (readableMap.getType(key)) {
        ReadableType.Null -> bundle.putString(key, null)
        ReadableType.Boolean -> bundle.putBoolean(key, readableMap.getBoolean(key))
        ReadableType.Number ->
            bundle.putDouble(key, readableMap.getDouble(key)) // Can be int or double.
        ReadableType.String -> bundle.putString(key, readableMap.getString(key))
        ReadableType.Map -> bundle.putBundle(key, toBundle(readableMap.getMap(key)))
        ReadableType.Array -> bundle.putSerializable(key, toList(readableMap.getArray(key)))
        else -> throw IllegalArgumentException("Could not convert object with key: $key.")
      }
    }

    return bundle
  }
}
