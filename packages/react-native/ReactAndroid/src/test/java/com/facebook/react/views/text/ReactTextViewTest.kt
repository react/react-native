/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.text.SpannableString
import android.text.Spanned
import android.text.style.ReplacementSpan
import android.util.TypedValue
import android.view.View
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RuntimeEnvironment
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactTextViewTest {

  @Test
  fun drawsGlyphInkOutsideLineHeightWhenOverflowIsVisible() {
    val bitmap = drawReactTextViewWithOverflow(null)

    assertThat(hasVisiblePixelBelowViewBounds(bitmap)).isTrue()
  }

  private fun drawReactTextViewWithOverflow(overflow: String?): Bitmap {
    val lineHeight = 24
    val width = 200
    val bitmapHeight = 64
    val text = SpannableString("x")
    text.setSpan(
        OverflowingInkSpan(lineHeight), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

    val view = TestReactTextView(RuntimeEnvironment.getApplication())
    view.setTextColor(Color.BLACK)
    view.setTextSize(TypedValue.COMPLEX_UNIT_PX, 24f)
    view.includeFontPadding = true
    view.setSpanned(text)
    view.text = text
    view.setOverflow(overflow)
    view.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(lineHeight, View.MeasureSpec.EXACTLY),
    )
    view.layout(0, 0, width, lineHeight)

    return Bitmap.createBitmap(width, bitmapHeight, Bitmap.Config.ARGB_8888).also {
      view.drawTextForTest(Canvas(it))
    }
  }

  private fun hasVisiblePixelBelowViewBounds(bitmap: Bitmap): Boolean {
    for (y in 24 until bitmap.height) {
      for (x in 0 until bitmap.width) {
        if (Color.alpha(bitmap.getPixel(x, y)) != 0) {
          return true
        }
      }
    }

    return false
  }

  private class TestReactTextView(context: Context) : ReactTextView(context) {
    fun drawTextForTest(canvas: Canvas) {
      super.onDraw(canvas)
    }
  }

  private class OverflowingInkSpan(private val lineHeight: Int) : ReplacementSpan() {
    override fun getSize(
        paint: Paint,
        text: CharSequence,
        start: Int,
        end: Int,
        fm: Paint.FontMetricsInt?,
    ): Int {
      fm?.ascent = -lineHeight
      fm?.descent = 0
      fm?.top = -lineHeight
      fm?.bottom = 0
      return lineHeight
    }

    override fun draw(
        canvas: Canvas,
        text: CharSequence,
        start: Int,
        end: Int,
        x: Float,
        top: Int,
        y: Int,
        bottom: Int,
        paint: Paint,
    ) {
      canvas.drawRect(
          x,
          y + (lineHeight / 4f),
          x + lineHeight,
          y + (lineHeight / 2f),
          paint,
      )
    }
  }
}
