/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip

/**
 * Implementation of a write-only array stored in native memory. Use [Arguments#createArray()] if
 * you need to stub out creating this class in a test.
 */
@DoNotStrip
public class WritableNativeArray : ReadableNativeArray(), WritableArray {

  init {
    initHybrid()
  }

  external override fun pushNull()

  external override fun pushBoolean(value: Boolean)

  external override fun pushDouble(value: Double)

  external override fun pushInt(value: Int)

  external override fun pushLong(value: Long)

  external override fun pushString(value: String?)

  // Note: this consumes the map so do not reuse it.
  override fun pushArray(array: ReadableArray?) {
    check(array == null || array is ReadableNativeArray) { "Illegal type provided" }
    pushNativeArray(array)
  }

  // Note: this consumes the map so do not reuse it.
  override fun pushMap(map: ReadableMap?) {
    check(map == null || map is ReadableNativeMap) { "Illegal type provided" }
    pushNativeMap(map)
  }

  private external fun initHybrid()

  private external fun pushNativeArray(array: ReadableNativeArray?)

  private external fun pushNativeMap(map: ReadableNativeMap?)
}
