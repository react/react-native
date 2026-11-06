/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.NativeArray
import org.robolectric.annotation.Implements
import org.robolectric.shadow.api.Shadow

// Mockito can't mock native methods, so shadow the entire class instead
@Implements(NativeArray::class)
open class ShadowNativeArray {
  var backingArray: JavaOnlyArray = JavaOnlyArray()

  companion object {
    fun getContents(array: NativeArray): List<Any?> =
        Shadow.extract<ShadowNativeArray>(array).backingArray.toArrayList()
  }
}
