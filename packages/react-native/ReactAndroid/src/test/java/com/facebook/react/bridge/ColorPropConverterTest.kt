/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.Context
import android.view.ContextThemeWrapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for [ColorPropConverter] */
@RunWith(RobolectricTestRunner::class)
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

  private fun themeColor(attr: Int): Int {
    val typedArray = context.obtainStyledAttributes(intArrayOf(attr))
    val color = typedArray.getColor(0, 0)
    typedArray.recycle()
    return color
  }
}
