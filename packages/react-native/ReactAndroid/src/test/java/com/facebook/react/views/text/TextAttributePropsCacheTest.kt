/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // DisplayMetrics.scaledDensity, to simulate a system font scale

package com.facebook.react.views.text

import android.util.DisplayMetrics
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TextAttributePropsCacheTest {

  private var parses = 0

  @Before
  fun setUp() {
    setMetrics(density = 2f, scaledDensity = 2f)
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `identical serialized attributes are parsed once`() {
    val cache = TextAttributePropsCache()

    val first = cache.getOrParse(byteArrayOf(1, 2, 3), ::parse)
    val second = cache.getOrParse(byteArrayOf(1, 2, 3), ::parse)

    assertThat(second).isSameAs(first)
    assertThat(parses).isEqualTo(1)
  }

  @Test
  fun `different serialized attributes are parsed separately`() {
    val cache = TextAttributePropsCache()

    val first = cache.getOrParse(byteArrayOf(1, 2, 3), ::parse)
    val second = cache.getOrParse(byteArrayOf(1, 2, 4), ::parse)

    assertThat(second).isNotSameAs(first)
    assertThat(parses).isEqualTo(2)
  }

  @Test
  fun `the least recently used attributes are evicted`() {
    val cache = TextAttributePropsCache(maxSize = 2)

    cache.getOrParse(byteArrayOf(1), ::parse)
    cache.getOrParse(byteArrayOf(2), ::parse)
    cache.getOrParse(byteArrayOf(1), ::parse) // 1 is now the most recently used
    cache.getOrParse(byteArrayOf(3), ::parse) // evicts 2
    assertThat(parses).isEqualTo(3)

    cache.getOrParse(byteArrayOf(1), ::parse)
    assertThat(parses).isEqualTo(3)
    cache.getOrParse(byteArrayOf(2), ::parse)
    assertThat(parses).isEqualTo(4)
  }

  @Test
  fun `a font scale change drops the parsed attributes`() {
    val cache = TextAttributePropsCache()
    val before = cache.getOrParse(byteArrayOf(1, 2, 3), ::parse)

    setMetrics(density = 2f, scaledDensity = 3f)
    val after = cache.getOrParse(byteArrayOf(1, 2, 3), ::parse)

    assertThat(after).isNotSameAs(before)
    assertThat(parses).isEqualTo(2)
    assertThat(after.fontSize).isGreaterThan(before.fontSize)
  }

  @Test
  fun `a density change drops the parsed attributes`() {
    val cache = TextAttributePropsCache()
    val before = cache.getOrParse(byteArrayOf(1, 2, 3), ::parse)

    setMetrics(density = 3f, scaledDensity = 3f)
    val after = cache.getOrParse(byteArrayOf(1, 2, 3), ::parse)

    assertThat(after).isNotSameAs(before)
    assertThat(parses).isEqualTo(2)
  }

  private fun parse(): TextAttributeProps {
    parses++
    return TextAttributeProps.fromReadableMap(ReactStylesDiffMap(JavaOnlyMap.of("fontSize", 14.0)))
  }

  private fun setMetrics(density: Float, scaledDensity: Float) {
    DisplayMetricsHolder.setScreenDisplayMetrics(
        DisplayMetrics().apply {
          this.density = density
          this.scaledDensity = scaledDensity
          widthPixels = 1080
          heightPixels = 1920
        }
    )
  }
}
