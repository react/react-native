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
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import androidx.core.graphics.createBitmap
import androidx.core.graphics.get
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactTextViewTest {

  @Test
  fun drawsGlyphInkOutsideLineHeightWhenOverflowIsVisible() {
    val bitmap = drawReactTextViewWithOverflow(null)

    assertThat(hasVisiblePixelBelowViewBounds(bitmap)).isTrue()
  }

  @Test
  fun bottomGravityDoesNotShiftLayoutUpWhenTextIsTallerThanView() {
    val lineHeight = 48
    val viewHeight = 24
    val bitmap = drawReactTextViewWithOverflow(null, lineHeight, viewHeight, Gravity.BOTTOM)

    assertThat(firstVisiblePixelY(bitmap)).isGreaterThanOrEqualTo(lineHeight)
  }

  @Test
  fun adjustsFontSizeToFitRecalculatesWhenContainerHeightShrinks() {
    val width = 200
    val tallHeight = 200
    val shortHeight = 20
    val largeFontSize = 40

    val text = SpannableString("Hello")
    text.setSpan(
        ReactAbsoluteSizeSpan(largeFontSize),
        0,
        text.length,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )

    val view = TestReactTextView(RuntimeEnvironment.getApplication())
    view.layoutParams =
        ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        )
    view.setTextColor(Color.BLACK)
    view.setMinimumFontSize(4f)
    view.setNumberOfLines(0)
    view.setAdjustFontSizeToFit(true)
    view.setSpanned(text)
    view.text = text

    layoutAndDraw(view, width, tallHeight)
    val fontSizeWhenTall = largestAbsoluteSizeSpan(text)

    // Shrinking the container must retrigger the font recalculation, otherwise the
    // stale large font is drawn into the smaller container and gets clipped.
    layoutAndDraw(view, width, shortHeight)
    val fontSizeWhenShort = largestAbsoluteSizeSpan(text)

    assertThat(fontSizeWhenShort).isLessThan(fontSizeWhenTall)
  }

  private fun layoutAndDraw(view: TestReactTextView, width: Int, height: Int) {
    view.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY),
    )
    view.layout(0, 0, width, height)
    view.drawTextForTest(Canvas(createBitmap(width, height)))
  }

  private fun largestAbsoluteSizeSpan(text: Spanned): Int =
      text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java).maxOfOrNull { it.size } ?: 0

  private fun drawReactTextViewWithOverflow(overflow: String?): Bitmap {
    return drawReactTextViewWithOverflow(overflow, lineHeight = 24, viewHeight = 24, gravity = null)
  }

  private fun drawReactTextViewWithOverflow(
      overflow: String?,
      lineHeight: Int,
      viewHeight: Int,
      gravity: Int?,
  ): Bitmap {
    val width = 200
    val bitmapHeight = 80
    val text = SpannableString("x")
    text.setSpan(
        OverflowingInkSpan(lineHeight),
        0,
        text.length,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )

    val view = TestReactTextView(RuntimeEnvironment.getApplication())
    view.setTextColor(Color.BLACK)
    view.setTextSize(TypedValue.COMPLEX_UNIT_PX, 24f)
    view.includeFontPadding = true
    view.setSpanned(text)
    view.text = text
    view.setOverflow(overflow)
    if (gravity != null) {
      view.setGravityVertical(gravity)
    }
    view.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(viewHeight, View.MeasureSpec.EXACTLY),
    )
    view.layout(0, 0, width, viewHeight)

    return createBitmap(width, bitmapHeight).also {
      view.drawTextForTest(Canvas(it))
    }
  }

  private fun hasVisiblePixelBelowViewBounds(bitmap: Bitmap): Boolean {
    for (y in 24 until bitmap.height) {
      for (x in 0 until bitmap.width) {
        if (Color.alpha(bitmap[x, y]) != 0) {
          return true
        }
      }
    }

    return false
  }

  private fun firstVisiblePixelY(bitmap: Bitmap): Int {
    for (y in 0 until bitmap.height) {
      for (x in 0 until bitmap.width) {
        if (Color.alpha(bitmap[x, y]) != 0) {
          return y
        }
      }
    }

    return bitmap.height
  }

  private class TestReactTextView(context: Context) : ReactTextView(context) {
    fun drawTextForTest(canvas: Canvas) {
      super.draw(canvas)
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
