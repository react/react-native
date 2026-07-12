/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.annotation.SuppressLint
import com.facebook.infer.annotation.Assertions
import com.facebook.proguard.annotations.DoNotStripAny

/**
 * Implementation of a read-only map in native memory. This will generally be constructed and filled
 * in native code so you shouldn't construct one yourself.
 */
@DoNotStripAny
public open class ReadableNativeMap protected constructor() : NativeMap(), ReadableMap {
  private var keysStorage: Array<String>? = null
  private val keys: Array<String>
    get() {
      var keys = keysStorage
      if (keys != null) {
        return keys
      }

      synchronized(this) {
        // Check again with the lock held to prevent duplicate construction
        keys = keysStorage
        if (keys == null) {
          keys = importKeys()
          keysStorage = keys
          jniPassCounter++
        }
        return keys
      }
    }

  private var localMapStorage: Map<String, Any?>? = null
  private val localMap: Map<String, Any?>
    get() {
      var localMap = localMapStorage
      if (localMap != null) {
        return localMap
      }

      synchronized(this) {
        // Check again with the lock held to prevent duplicate construction
        localMap = localMapStorage
        if (localMap == null) {
          val keys = keys
          val length = keys.size
          localMap = HashMap<String, Any?>()
          val values = importValues()
          for (i in 0 until length) {
            localMap[keys[i]] = values[i]
          }
          localMapStorage = localMap
          jniPassCounter++
        }
        return localMap
      }
    }

  private var localTypeMapStorage: Map<String, ReadableType>? = null
  private val localTypeMap: Map<String, ReadableType>
    get() {
      var localTypeMap = localTypeMapStorage
      if (localTypeMap != null) {
        return localTypeMap
      }

      synchronized(this) {
        // Check again with the lock held to prevent duplicate construction
        localTypeMap = localTypeMapStorage
        if (localTypeMap == null) {
          val keys = keys
          localTypeMap = HashMap<String, ReadableType>()
          val types = importTypes()
          for (i in 0 until keys.size) {
            localTypeMap[keys[i]] = types[i] as ReadableType
          }
          localTypeMapStorage = localTypeMap
          jniPassCounter++
        }
        return localTypeMap
      }
    }

  private external fun importKeys(): Array<String>

  private external fun importValues(): Array<Any>

  private external fun importTypes(): Array<Any>

  override fun hasKey(name: String): Boolean = localMap.containsKey(name)

  override fun isNull(name: String): Boolean {
    if (localMap.containsKey(name)) {
      return localMap[name] == null
    }
    throw NoSuchKeyException(name)
  }

  @SuppressLint("ReflectionMethodUse")
  private inline fun <reified T> checkInstance(name: String, instance: Any?, type: Class<T>): T =
      instance as? T
          ?: throw UnexpectedNativeTypeException(
              "Value for $name cannot be cast from ${instance?.javaClass?.simpleName ?: "NULL"} to ${type.simpleName}"
          )

  private fun getValue(name: String): Any {
    if (hasKey(name)) {
      return Assertions.assertNotNull(localMap[name])
    }
    throw NoSuchKeyException(name)
  }

  private inline fun <reified T> getValue(name: String, type: Class<T>): T =
      checkInstance(name, getValue(name), type)

  private fun getNullableValue(name: String): Any? = localMap[name]

  private inline fun <reified T> getNullableValue(name: String, type: Class<T>): T? {
    val res = getNullableValue(name)
    return if (res == null) {
      null
    } else {
      checkInstance(name, res, type)
    }
  }

  override fun getBoolean(name: String): Boolean = getValue(name, Boolean::class.java)

  override fun getDouble(name: String): Double = getValue(name, Double::class.java)

  // All numbers coming out of native are doubles, so cast here then truncate
  override fun getInt(name: String): Int = getValue(name, Double::class.java).toInt()

  override fun getLong(name: String): Long = getValue(name, Long::class.java)

  override fun getString(name: String): String? = getNullableValue(name, String::class.java)

  override fun getArray(name: String): ReadableArray? =
      getNullableValue(name, ReadableArray::class.java)

  override fun getMap(name: String): ReadableNativeMap? =
      getNullableValue(name, ReadableNativeMap::class.java)

  override fun getType(name: String): ReadableType =
      localTypeMap[name] ?: throw NoSuchKeyException(name)

  override fun getDynamic(name: String): Dynamic = DynamicFromMap.create(this, name)

  override val entryIterator: Iterator<Map.Entry<String, Any>>
    get() {
      val iteratorKeys = keys
      val iteratorValues = importValues()
      jniPassCounter++
      return object : Iterator<Map.Entry<String, Any>> {
        var currentIndex = 0

        override fun hasNext(): Boolean {
          return currentIndex < iteratorKeys.size
        }

        override fun next(): Map.Entry<String, Any> {
          val index = currentIndex++
          return object : Map.Entry<String, Any> {
            override val key: String
              get() = iteratorKeys[index]

            override val value: Any
              get() = iteratorValues[index]
          }
        }
      }
    }

  override fun keySetIterator(): ReadableMapKeySetIterator {
    val iteratorKeys = keys
    return object : ReadableMapKeySetIterator {
      var currentIndex = 0

      override fun hasNextKey(): Boolean = currentIndex < iteratorKeys.size

      override fun nextKey(): String = iteratorKeys[currentIndex++]
    }
  }

  override fun hashCode(): Int = localMap.hashCode()

  override fun equals(other: Any?): Boolean =
      if (other !is ReadableNativeMap) {
        false
      } else localMap == other.localMap

  override fun toHashMap(): HashMap<String, Any?> {
    // we can almost just return getLocalMap(), but we need to convert nested arrays and maps to the
    // correct types first
    val hashMap = HashMap(localMap)
    val iterator: Iterator<*> = hashMap.keys.iterator()
    while (iterator.hasNext()) {
      val key = iterator.next() as String
      when (getType(key)) {
        ReadableType.Null,
        ReadableType.Boolean,
        ReadableType.Number,
        ReadableType.String -> {}
        ReadableType.Map -> hashMap[key] = Assertions.assertNotNull(getMap(key)).toHashMap()
        ReadableType.Array -> hashMap[key] = Assertions.assertNotNull(getArray(key)).toArrayList()
      }
    }
    return hashMap
  }

  internal companion object {
    @get:JvmStatic
    @get:JvmName("getJNIPassCounter")
    var jniPassCounter: Int = 0
      private set
  }
}
