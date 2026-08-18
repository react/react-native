/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.react.uimanager.PixelUtil
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class TextLayoutManagerInlineViewSizeTest {

  // The size arrives from the shadow node in dp, so the system font scale must not apply to it.
  @Test
  fun `inline view attachment size does not shrink with small font scale`() {
    val metrics = PixelUtil.displayMetricsFor(density = 1f, fontScale = 0.85f)

    assertThat(TextLayoutManager.inlineViewSizeToPixels(155.0, metrics)).isEqualTo(155)
  }

  // A fractional pixel size would leave the inline view a hair short of its box.
  @Test
  fun `inline view attachment size is rounded up to the pixel grid`() {
    val metrics = PixelUtil.displayMetricsFor(density = 1f, fontScale = 1f)

    assertThat(TextLayoutManager.inlineViewSizeToPixels(132.1, metrics)).isEqualTo(133)
  }
}
