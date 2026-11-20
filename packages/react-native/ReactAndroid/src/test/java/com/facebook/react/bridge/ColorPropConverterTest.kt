/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.Context
import android.graphics.Color
import android.view.ContextThemeWrapper
import com.facebook.testutils.shadows.ShadowRawColorParser
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/** Tests for [ColorPropConverter] */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowRawColorParser::class])
class ColorPropConverterTest {

  private lateinit var context: Context

  @Before
  fun setUp() {
    context =
        ContextThemeWrapper(
            RuntimeEnvironment.getApplication(),
            androidx.appcompat.R.style.Theme_AppCompat,
        )
  }

  @Test
  fun themeAttributeResolvesColor() {
    val result = ColorPropConverter.resolveResourcePath(context, "?android:attr/colorAccent")

    assertThat(result).isEqualTo(themeColor(android.R.attr.colorAccent))
  }

  @Test
  fun themeAttributeResolvesColorStateListToDefaultColor() {
    val result = ColorPropConverter.resolveResourcePath(context, "?attr/textColorPrimary")

    assertThat(result).isEqualTo(themeColor(android.R.attr.textColorPrimary))
  }

  @Test
  fun unresolvedPathUsesFallback() {
    val result = ColorPropConverter.getColor(platformColor("@color/missing", "#ff0000"), context)

    assertThat(result).isEqualTo(Color.RED)
  }

  @Test
  fun unresolvedPathUsesFallbackOverDefault() {
    val result = ColorPropConverter.getColor(platformColor("@color/missing", "#ff0000"), context, 0)

    assertThat(result).isEqualTo(Color.RED)
  }

  @Test
  fun unresolvedPathUsesTransparentFallback() {
    val result = ColorPropConverter.getColor(platformColor("?attr/missing", "transparent"), context)

    assertThat(result).isEqualTo(Color.TRANSPARENT)
  }

  @Test
  fun resolvedPathIgnoresFallback() {
    val result =
        ColorPropConverter.getColor(platformColor("?android:attr/colorAccent", "#ff0000"), context)

    assertThat(result).isEqualTo(themeColor(android.R.attr.colorAccent))
  }

  @Test
  fun unresolvedPathWithoutFallbackIsTransparent() {
    val result = ColorPropConverter.getColor(platformColor("@color/missing"), context)

    assertThat(result).isEqualTo(Color.TRANSPARENT)
  }

  @Test
  fun unresolvedPathWithInvalidFallbackIsTransparent() {
    val result =
        ColorPropConverter.getColor(platformColor("@color/missing", "not-a-color"), context)

    assertThat(result).isEqualTo(Color.TRANSPARENT)
  }

  private fun platformColor(path: String, fallback: String? = null): ReadableMap {
    val map = JavaOnlyMap.of("resource_paths", JavaOnlyArray.of(path))
    if (fallback != null) {
      map.putString("fallback", fallback)
    }
    return map
  }

  private fun themeColor(attr: Int): Int {
    val typedArray = context.obtainStyledAttributes(intArrayOf(attr))
    val color = typedArray.getColor(0, 0)
    typedArray.recycle()
    return color
  }
}
