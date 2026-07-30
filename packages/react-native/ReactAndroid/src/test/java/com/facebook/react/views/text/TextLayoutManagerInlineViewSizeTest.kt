/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import android.util.DisplayMetrics
import com.facebook.react.uimanager.DisplayMetricsHolder
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TextLayoutManagerInlineViewSizeTest {

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `inline view attachment width does not shrink with small font scale`() {
    DisplayMetricsHolder.setScreenDisplayMetrics(
        DisplayMetrics().apply {
          density = 1f
          scaledDensity = 0.85f
        }
    )

    assertThat(invokeInlineViewSizeToPixels(155.0)).isEqualTo(155)
  }

  @Test
  fun `inline view attachment width is rounded up to the pixel grid`() {
    DisplayMetricsHolder.setScreenDisplayMetrics(
        DisplayMetrics().apply {
          density = 1f
          scaledDensity = 1f
        }
    )

    assertThat(invokeInlineViewSizeToPixels(132.1)).isEqualTo(133)
  }

  private fun invokeInlineViewSizeToPixels(size: Double): Int {
    val method =
        TextLayoutManager::class
            .java
            .getDeclaredMethod("inlineViewSizeToPixels", java.lang.Double.TYPE)
            .apply { isAccessible = true }

    return method.invoke(TextLayoutManager, size) as Int
  }
}
