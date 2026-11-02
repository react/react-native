/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements
import org.robolectric.shadow.api.Shadow

@Implements(Arguments::class)
class ShadowArguments {

  companion object {
    @JvmStatic @Implementation fun createArray(): WritableArray = JavaOnlyArray()

    @JvmStatic @Implementation fun createMap(): WritableMap = JavaOnlyMap()

    @JvmStatic
    @Implementation
    fun fromJavaArgs(args: Array<Any?>): WritableNativeArray =
        WritableNativeArray().apply {
          Shadow.extract<ShadowNativeArray>(this).backingArray = JavaOnlyArray.of(*args)
        }
  }
}
