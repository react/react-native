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
import org.assertj.core.api.Assertions.assertThatThrownBy
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
    ]
)
class CollectionFactoryTest {
  @Test
  fun `writableMapOf creates empty map`() {
    val map = writableMapOf()
    assertThat(map.toHashMap()).isEmpty()
  }

  @Test
  fun `writableArrayOf creates empty array`() {
    val array = writableArrayOf()
    assertThat(array.toArrayList()).isEmpty()
  }

  @Test
  fun `writableMapOf creates map with primitive values`() {
    val map = writableMapOf(
      "stringKey" to "stringValue",
      "intKey" to 42,
      "boolKey" to true,
      "doubleKey" to 3.14
    )

    assertThat(map.toHashMap())
      .hasSize(4)
      .containsEntry("stringKey", "stringValue")
      .containsEntry("intKey", 42.0)
      .containsEntry("boolKey", true)
      .containsEntry("doubleKey", 3.14)
  }

  @Test
  fun `writableArrayOf creates array with mixed types`() {
    val array = writableArrayOf("one", 2, true, 4.0)

    assertThat(array.toArrayList()).hasSize(4).containsExactly("one", 2.0, true, 4.0)
  }

  @Test
  fun `writableMapOf handles null values correctly`() {
    val map = writableMapOf("nullKey" to null)
    assertThat(map.toHashMap()).containsEntry("nullKey", null)
  }

  @Test
  fun `writableArrayOf handles null elements correctly`() {
    val array = writableArrayOf("first", null, "third")
    assertThat(array.toArrayList()).hasSize(3).containsExactly("first", null, "third")
  }

  @Test
  fun `writableMapOf converts Long and Float to Double`() {
    val map = writableMapOf("longKey" to 123L, "floatKey" to 4.5f)

    assertThat(map.toHashMap()).containsEntry("longKey", 123.0).containsEntry("floatKey", 4.5)
  }

  @Test
  fun `writableArrayOf converts Long and Float to Double`() {
    val array = writableArrayOf(123L, 4.5f)

    assertThat(array.toArrayList()).containsExactly(123.0, 4.5)
  }

  @Test
  fun `writableMapOf supports nested maps`() {
    val map = writableMapOf("nested" to writableMapOf("inner" to "value"))

    val nested = map.getMap("nested")
    checkNotNull(nested)
    assertThat(nested.toHashMap()).containsEntry("inner", "value")
  }

  @Test
  fun `writableMapOf supports nested arrays`() {
    val map = writableMapOf("items" to writableArrayOf(1, 2, 3))

    val items = map.getArray("items")
    checkNotNull(items)
    assertThat(items.toArrayList()).containsExactly(1.0, 2.0, 3.0)
  }

  @Test
  fun `writableArrayOf supports nested maps`() {
    val array = writableArrayOf(writableMapOf("key" to "value"))

    val nested = array.getMap(0)
    checkNotNull(nested)
    assertThat(nested.toHashMap()).containsEntry("key", "value")
  }

  @Test
  fun `writableArrayOf supports nested arrays`() {
    val array = writableArrayOf(writableArrayOf(1, 2))

    val nested = array.getArray(0)
    assertThat(nested?.toArrayList()).containsExactly(1.0, 2.0)
  }

  @Test
  fun `readableMapOf returns ReadableMap with correct content`() {
    val map: ReadableMap = readableMapOf("key" to "value", "count" to 42)

    assertThat(map.getString("key")).isEqualTo("value")
    assertThat(map.getInt("count")).isEqualTo(42)
  }

  @Test
  fun `readableArrayOf returns ReadableArray with correct content`() {
    val array: ReadableArray = readableArrayOf(1, 2, 3)

    assertThat(array.toArrayList()).containsExactly(1.0, 2.0, 3.0)
  }

  @Test
  fun `writableMapOf throws on unsupported type`() {
    assertThatThrownBy { writableMapOf("date" to java.util.Date()) }
      .isInstanceOf(IllegalArgumentException::class.java)
      .hasMessageContaining("Unsupported value type")
      .hasMessageContaining("date")
  }

  @Test
  fun `writableArrayOf throws on unsupported type`() {
    assertThatThrownBy { writableArrayOf(java.util.Date()) }
      .isInstanceOf(IllegalArgumentException::class.java)
      .hasMessageContaining("Unsupported element type")
  }
}
