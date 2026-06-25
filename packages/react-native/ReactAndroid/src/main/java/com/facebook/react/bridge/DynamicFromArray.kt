/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import androidx.core.util.Pools.SimplePool

/** Implementation of Dynamic wrapping a ReadableArray. */
internal class DynamicFromArray private constructor() : Dynamic {
  private var array: ReadableArray? = null
  private var index: Int = -1

  override fun recycle() {
    array = null
    index = -1
    pool.get()?.release(this)
  }

  override val type: ReadableType
    get() =
        array?.getType(index) ?: throw IllegalStateException("This dynamic value has been recycled")

  override val isNull: Boolean
    get() =
        array?.isNull(index) ?: throw IllegalStateException("This dynamic value has been recycled")

  override fun asArray(): ReadableArray =
      array?.getArray(index) ?: throw IllegalStateException("This dynamic value has been recycled")

  override fun asBoolean(): Boolean =
      array?.getBoolean(index)
          ?: throw IllegalStateException("This dynamic value has been recycled")

  override fun asDouble(): Double =
      array?.getDouble(index) ?: throw IllegalStateException("This dynamic value has been recycled")

  override fun asInt(): Int =
      array?.getInt(index) ?: throw IllegalStateException("This dynamic value has been recycled")

  override fun asMap(): ReadableMap =
      array?.getMap(index) ?: throw IllegalStateException("This dynamic value has been recycled")

  override fun asString(): String =
      array?.getString(index) ?: throw IllegalStateException("This dynamic value has been recycled")

  companion object {
    private val pool: ThreadLocal<SimplePool<DynamicFromArray>> =
        object : ThreadLocal<SimplePool<DynamicFromArray>>() {
          override fun initialValue(): SimplePool<DynamicFromArray> {
            return SimplePool(10)
          }
        }

    @JvmStatic
    fun create(array: ReadableArray, index: Int): DynamicFromArray {
      val dynamic = pool.get()?.acquire() ?: DynamicFromArray()
      dynamic.array = array
      dynamic.index = index
      return dynamic
    }
  }
}
