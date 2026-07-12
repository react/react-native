/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Paint
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class CustomLineHeightSpanTest {

  @Test
  fun tightLineHeightDoesNotClipFirstOrLastLineFontBounds() {
    val span = CustomLineHeightSpan(16f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -18
          ascent = -14
          descent = 6
          bottom = 8
        }

    span.chooseHeight("gjpqy", 0, 5, 0, 0, fm)

    assertThat(fm.ascent).isEqualTo(-12)
    assertThat(fm.descent).isEqualTo(4)
    assertThat(fm.top).isEqualTo(-12)
    assertThat(fm.bottom).isEqualTo(4)
  }

  @Test
  fun looseLineHeightStillExpandsFirstAndLastLineBounds() {
    val span = CustomLineHeightSpan(24f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -18
          ascent = -14
          descent = 6
          bottom = 8
        }

    span.chooseHeight("gjpqy", 0, 5, 0, 0, fm)

    assertThat(fm.ascent).isEqualTo(-16)
    assertThat(fm.descent).isEqualTo(8)
    assertThat(fm.top).isEqualTo(-16)
    assertThat(fm.bottom).isEqualTo(8)
  }

  @Test
  fun tightLineHeightDoesNotExpandStaticLayoutHeightWithFontPadding() {
    val layout = buildStaticLayout("gjpqy\ngjpqy\ngjpqy", lineHeight = 24)

    assertThat(layout.lineCount).isEqualTo(3)
    assertThat(layout.height).isEqualTo(72)
  }

  @Test
  fun tightLineHeightDoesNotExpandSingleLineStaticLayoutHeightWithFontPadding() {
    val layout = buildStaticLayout("gjpqy", lineHeight = 24)

    assertThat(layout.lineCount).isEqualTo(1)
    assertThat(layout.height).isEqualTo(24)
  }

  private fun buildStaticLayout(text: String, lineHeight: Int): StaticLayout {
    val spannable = SpannableString(text)
    spannable.setSpan(
        CustomLineHeightSpan(lineHeight.toFloat()),
        0,
        text.length,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )

    return StaticLayout.Builder.obtain(
            spannable,
            0,
            spannable.length,
            TextPaint().apply { textSize = 24f },
            400,
        )
        .setAlignment(Layout.Alignment.ALIGN_NORMAL)
        .setIncludePad(true)
        .setLineSpacing(0f, 1f)
        .build()
  }
}
