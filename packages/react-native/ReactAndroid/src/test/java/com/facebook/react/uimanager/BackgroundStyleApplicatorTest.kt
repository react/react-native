/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.util.DisplayMetrics
import android.view.View
import com.facebook.react.uimanager.drawable.CompositeBackgroundDrawable
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for [BackgroundStyleApplicator]. */
@RunWith(RobolectricTestRunner::class)
class BackgroundStyleApplicatorTest {

  private lateinit var view: View

  @Before
  fun setUp() {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 2f })
    view = View(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun getOutlineWidthReturnsWidthNotOffset() {
    BackgroundStyleApplicator.setOutlineWidth(view, 3f)
    BackgroundStyleApplicator.setOutlineOffset(view, 8f)

    assertThat(BackgroundStyleApplicator.getOutlineWidth(view)).isEqualTo(6f)
    assertThat(BackgroundStyleApplicator.getOutlineOffset(view)).isEqualTo(16f)
  }

  @Test
  fun setBackgroundColorSetsTheViewBackgroundOnce() {
    val countingView = BackgroundCountingView()
    val original = ColorDrawable(Color.GREEN)
    countingView.background = original
    countingView.backgroundSets = 0

    BackgroundStyleApplicator.setBackgroundColor(countingView, Color.RED)

    assertThat(countingView.backgroundSets).isEqualTo(1)
    val composite = countingView.background as CompositeBackgroundDrawable
    assertThat(composite.originalBackground).isSameAs(original)
    assertThat(composite.background?.backgroundColor).isEqualTo(Color.RED)
    assertThat(BackgroundStyleApplicator.getBackgroundColor(countingView)).isEqualTo(Color.RED)
  }

  private class BackgroundCountingView : View(RuntimeEnvironment.getApplication()) {
    var backgroundSets = 0

    @Deprecated("Deprecated in Java")
    override fun setBackgroundDrawable(background: Drawable?) {
      backgroundSets++
      @Suppress("DEPRECATION") super.setBackgroundDrawable(background)
    }
  }
}
