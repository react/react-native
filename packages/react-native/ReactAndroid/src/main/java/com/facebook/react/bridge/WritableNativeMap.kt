/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.infer.annotation.Assertions
import com.facebook.proguard.annotations.DoNotStrip

/**
 * Implementation of a write-only map stored in native memory. Use [Arguments.createMap] if you need
 * to stub out creating this class in a test. TODO(5815532): Check if consumed on read
 */
@DoNotStrip
public class WritableNativeMap @DoNotStrip private constructor(initializeNative: Boolean) :
    ReadableNativeMap(), WritableMap {
  /** Creates an empty writable map backed by native memory. */
  public constructor() : this(true)

  init {
    if (initializeNative) {
      initHybrid()
    }
  }

  external override fun putBoolean(key: String, value: Boolean)

  external override fun putDouble(key: String, value: Double)

  external override fun putInt(key: String, value: Int)

  external override fun putLong(key: String, value: Long)

  external override fun putNull(key: String)

  external override fun putString(key: String, value: String?)

  override fun putMap(key: String, value: ReadableMap?) {
    Assertions.assertCondition(value == null || value is ReadableNativeMap, "Illegal type provided")
    putNativeMap(key, value as ReadableNativeMap?)
  }

  // Note: this consumes the map so do not reuse it.
  override fun putArray(key: String, value: ReadableArray?) {
    Assertions.assertCondition(
        value == null || value is ReadableNativeArray,
        "Illegal type provided",
    )
    putNativeArray(key, value as ReadableNativeArray?)
  }

  // Note: this **DOES NOT** consume the source map
  override fun merge(source: ReadableMap) {
    Assertions.assertCondition(source is ReadableNativeMap, "Illegal type provided")
    mergeNativeMap(source as ReadableNativeMap)
  }

  override fun copy(): WritableMap {
    val target = WritableNativeMap()
    target.merge(this)
    return target
  }

  private external fun putNativeMap(key: String, value: ReadableNativeMap?)

  private external fun putNativeArray(key: String, value: ReadableNativeArray?)

  private external fun mergeNativeMap(source: ReadableNativeMap)

  private external fun initHybrid()
}
