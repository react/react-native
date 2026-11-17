/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // DisplayMetrics.scaledDensity

package com.facebook.react.views.text

import android.util.DisplayMetrics
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import java.nio.ByteBuffer
import java.nio.ByteOrder
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Runs [TextAttributePropsCache] on MapBuffers serialized in the layout the C++ writer uses. */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class TextAttributePropsCacheMapBufferTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.setScreenDisplayMetrics(
        DisplayMetrics().apply {
          density = 2f
          scaledDensity = 2f
          widthPixels = 1080
          heightPixels = 1920
        }
    )
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `getMapBufferBytes returns exactly the nested map`() {
    val attributes = attributesMap(color = 0x112233, fontSize = 14.0)
    val fragment = readable(fragmentMap(attributes))

    assertThat(fragment.getMapBufferBytes(KEY_ATTRIBUTES)).isEqualTo(attributes)
    // Reading the bytes leaves the buffer usable for the other values.
    assertThat(fragment.getInt(KEY_OTHER)).isEqualTo(7)
    assertThat(fragment.getMapBuffer(KEY_ATTRIBUTES).getDouble(TextAttributeProps.TA_KEY_FONT_SIZE))
        .isEqualTo(14.0)
  }

  @Test
  fun `cached attributes match a fresh parse and are reused`() {
    val cache = TextAttributePropsCache()
    val first = readable(fragmentMap(attributesMap(color = 0x112233, fontSize = 14.0)))
    val second = readable(fragmentMap(attributesMap(color = 0x112233, fontSize = 14.0)))

    val cached = cache.get(first, KEY_ATTRIBUTES)
    val fresh = TextAttributeProps.fromMapBuffer(first.getMapBuffer(KEY_ATTRIBUTES))

    assertThat(cached.color).isEqualTo(fresh.color)
    assertThat(cached.fontSize).isEqualTo(fresh.fontSize)
    assertThat(cache.get(second, KEY_ATTRIBUTES)).isSameAs(cached)
  }

  @Test
  fun `different attributes are not reused`() {
    val cache = TextAttributePropsCache()
    val small = cache.get(readable(fragmentMap(attributesMap(0x112233, 14.0))), KEY_ATTRIBUTES)
    val large = cache.get(readable(fragmentMap(attributesMap(0x112233, 20.0))), KEY_ATTRIBUTES)

    assertThat(large).isNotSameAs(small)
    assertThat(large.fontSize).isGreaterThan(small.fontSize)
  }

  private fun attributesMap(color: Int, fontSize: Double): ByteArray =
      serialize(
          listOf(
              Bucket(TextAttributeProps.TA_KEY_FOREGROUND_COLOR, MapBuffer.DataType.INT) {
                it.putInt(color).putInt(0)
              },
              Bucket(TextAttributeProps.TA_KEY_FONT_SIZE, MapBuffer.DataType.DOUBLE) {
                it.putDouble(fontSize)
              },
          ),
          dynamicData = ByteArray(0),
      )

  private fun fragmentMap(attributes: ByteArray): ByteArray =
      serialize(
          listOf(
              Bucket(KEY_OTHER, MapBuffer.DataType.INT) { it.putInt(7).putInt(0) },
              Bucket(KEY_ATTRIBUTES, MapBuffer.DataType.MAP) {
                it.putInt(0).putInt(attributes.size)
              },
          ),
          dynamicData = attributes,
      )

  private class Bucket(val key: Int, val type: MapBuffer.DataType, val value: (ByteBuffer) -> Unit)

  // Header (uint16 count), then 12 byte buckets sorted by key (uint16 key, uint16 type, 8 byte
  // value), then the dynamic data that MAP values point into.
  private fun serialize(buckets: List<Bucket>, dynamicData: ByteArray): ByteArray {
    val buffer =
        ByteBuffer.allocate(2 + 12 * buckets.size + dynamicData.size).order(ByteOrder.LITTLE_ENDIAN)
    buffer.putShort(buckets.size.toShort())
    for (bucket in buckets.sortedBy { it.key }) {
      buffer.putShort(bucket.key.toShort())
      buffer.putShort(bucket.type.ordinal.toShort())
      bucket.value(buffer)
    }
    buffer.put(dynamicData)
    return buffer.array()
  }

  private fun readable(bytes: ByteArray): ReadableMapBuffer {
    // ReadableMapBuffer is only created from native code, so build one around the bytes directly.
    val constructor =
        ReadableMapBuffer::class
            .java
            .getDeclaredConstructor(ByteBuffer::class.java, Int::class.java)
    constructor.isAccessible = true
    return constructor.newInstance(ByteBuffer.wrap(bytes), 0)
  }

  private companion object {
    const val KEY_OTHER = 0
    const val KEY_ATTRIBUTES = 1
  }
}
