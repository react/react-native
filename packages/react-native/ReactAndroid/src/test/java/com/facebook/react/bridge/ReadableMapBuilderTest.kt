/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowNativeArray
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeArray
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowArguments::class,
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowNativeArray::class,
            ShadowNativeMap::class,
            ShadowWritableNativeMap::class,
            ShadowWritableNativeArray::class,
            ShadowReadableNativeMap::class,
            ShadowReadableNativeArray::class,
        ],
)
class ReadableMapBuilderTest {

  @Test
  fun `buildReadableMap creates simple entries correctly`() {
    val map: ReadableMap = buildReadableMap {
      put("stringKey", "stringValue")
      put("intKey", 42)
      put("boolKey", false)
      putNull("nullKey")
    }

    assertThat(map.toHashMap())
        .hasSize(4)
        .containsEntry("stringKey", "stringValue")
        .containsEntry("intKey", 42.0)
        .containsEntry("boolKey", false)
        .containsEntry("nullKey", null)
  }

  @Test
  fun `buildReadableMap supports nested maps and arrays`() {
    val map: ReadableMap = buildReadableMap {
      putMap("nestedMap") {
        put("innerString", "innerValue")
        put("innerNumber", 123L)
      }
      putArray("nestedArray") {
        add(10)
        add(20)
        add(30)
      }
    }

    // Nested Map
    val nestedMap = map.getMap("nestedMap")
    checkNotNull(nestedMap)
    assertThat(nestedMap.toHashMap())
        .isNotNull
        .hasSize(2)
        .containsEntry("innerString", "innerValue")
        .containsEntry("innerNumber", 123.0)

    // Nested Array inside Map
    val nestedArray = map.getArray("nestedArray")
    checkNotNull(nestedArray)
    assertThat(nestedArray.toArrayList()).isNotNull.hasSize(3).containsExactly(10.0, 20.0, 30.0)
  }
}
