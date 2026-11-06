/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.WritableNativeMap
import org.robolectric.annotation.Implements
import org.robolectric.shadow.api.Shadow

// Mockito can't mock native methods, so shadow the entire class instead
@Implements(NativeMap::class)
open class ShadowNativeMap {
  var backingMap: JavaOnlyMap = JavaOnlyMap()

  @Deprecated(
      "Use ShadowReadableNativeMap",
      ReplaceWith(
          "ShadowReadableNativeMap",
          "com.facebook.testutils.shadows.ShadowReadableNativeMap",
      ),
  )
  @Implements(ReadableNativeMap::class)
  class Readable : ShadowNativeMap()

  @Deprecated(
      "Use ShadowWritableNativeMap",
      ReplaceWith(
          "ShadowWritableNativeMap",
          "com.facebook.testutils.shadows.ShadowWritableNativeMap",
      ),
  )
  @Implements(WritableNativeMap::class)
  class Writable : ShadowNativeMap()

  companion object {
    fun getContents(map: NativeMap): Map<String, Any?> =
        Shadow.extract<ShadowNativeMap>(map).backingMap.toHashMap()
  }
}
