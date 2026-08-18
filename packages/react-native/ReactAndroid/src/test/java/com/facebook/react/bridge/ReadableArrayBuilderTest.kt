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
class ReadableArrayBuilderTest {

  @Test
  fun `buildReadableArray creates array entries correctly`() {
    val array: ReadableArray = buildReadableArray {
      add("one")
      add(2.0)
      add(true)
      addNull()
      addMap { put("nestedKey", "nestedValue") }
    }

    assertThat(array.toArrayList()).hasSize(5).contains("one", 2.0, true, null)

    val nestedMap = array.getMap(4)
    checkNotNull(nestedMap)
    assertThat(nestedMap.toHashMap()).containsEntry("nestedKey", "nestedValue")
  }

  @Test
  fun `buildReadableArray supports nested arrays`() {
    val array: ReadableArray = buildReadableArray {
      addArray {
        add(1)
        add(2)
      }
    }

    val nestedArray = array.getArray(0)
    assertThat(nestedArray?.toArrayList()).isNotNull.containsExactly(1.0, 2.0)
  }
}
