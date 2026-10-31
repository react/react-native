/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.Color
import android.graphics.LinearGradient as AndroidLinearGradient
import android.util.DisplayMetrics
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import org.assertj.core.api.Assertions.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for [BackgroundImageLayer] */
@RunWith(RobolectricTestRunner::class)
class BackgroundImageLayerTest {
  private lateinit var context: Context

  @Before
  fun setUp() {
    val metrics = DisplayMetrics()
    metrics.density = 1f
    DisplayMetricsHolder.setScreenDisplayMetrics(metrics)
    context = RuntimeEnvironment.getApplication()
  }

  @Test
  fun testParsesURL() {
    val layer =
        BackgroundImageLayer.parse(
            JavaOnlyMap.of("type", "url", "uri", "https://example.com/a.png"),
            context,
        )

    assertThat(layer).isNotNull
    assertThat(layer?.uri).isEqualTo("https://example.com/a.png")
    assertThat(layer?.intrinsicWidth).isNull()
    assertThat(layer?.intrinsicHeight).isNull()
  }

  @Test
  fun testParsesURLIntrinsicSize() {
    val layer =
        BackgroundImageLayer.parse(
            JavaOnlyMap.of(
                "type",
                "url",
                "uri",
                "asset.png",
                "intrinsicWidth",
                100.0,
                "intrinsicHeight",
                50.0,
            ),
            context,
        )

    assertThat(layer).isNotNull
    assertThat(layer?.uri).isEqualTo("asset.png")
    assertThat(layer?.intrinsicWidth).isEqualTo(100f)
    assertThat(layer?.intrinsicHeight).isEqualTo(50f)
  }

  @Test
  fun testRejectsURLWithoutStringURI() {
    assertThat(BackgroundImageLayer.parse(JavaOnlyMap.of("type", "url"), context)).isNull()
    assertThat(BackgroundImageLayer.parse(JavaOnlyMap.of("type", "url", "uri", 1.0), context))
        .isNull()
  }

  @Test
  fun testParsesGradient() {
    val layer =
        BackgroundImageLayer.parse(
            JavaOnlyMap.of(
                "type",
                "linear-gradient",
                "direction",
                JavaOnlyMap.of("type", "angle", "value", 180.0),
                "colorStops",
                JavaOnlyArray.of(
                    JavaOnlyMap.of("color", Color.RED),
                    JavaOnlyMap.of("color", Color.BLUE),
                ),
            ),
            context,
        )

    assertThat(layer).isNotNull
    assertThat(layer?.uri).isNull()
    assertThat(layer?.getShader(100f, 100f)).isInstanceOf(AndroidLinearGradient::class.java)
  }

  @Test
  fun testRejectsUnknownType() {
    assertThat(BackgroundImageLayer.parse(JavaOnlyMap.of("type", "conic-gradient"), context))
        .isNull()
    assertThat(BackgroundImageLayer.parse(null, context)).isNull()
  }
}
