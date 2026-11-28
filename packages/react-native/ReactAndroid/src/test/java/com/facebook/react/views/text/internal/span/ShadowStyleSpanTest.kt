/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Color
import android.text.TextPaint
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ShadowStyleSpanTest {

  @Test
  fun zeroRadiusWithOffsetKeepsShadowLayer() {
    val paint = TextPaint()

    ShadowStyleSpan(4f, 4f, 0f, Color.RED).updateDrawState(paint)

    assertThat(paint.shadowLayerRadius).isGreaterThan(0f)
    assertThat(paint.shadowLayerDx).isEqualTo(4f)
    assertThat(paint.shadowLayerDy).isEqualTo(4f)
    assertThat(paint.shadowLayerColor).isEqualTo(Color.RED)
  }

  @Test
  fun positiveRadiusIsPassedThrough() {
    val paint = TextPaint()

    ShadowStyleSpan(0f, 0f, 24f, Color.RED).updateDrawState(paint)

    assertThat(paint.shadowLayerRadius).isEqualTo(24f)
  }
}
