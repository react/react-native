/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.util.DisplayMetrics
import android.view.View
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for [BackgroundStyleApplicator] outline getters. */
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
}
