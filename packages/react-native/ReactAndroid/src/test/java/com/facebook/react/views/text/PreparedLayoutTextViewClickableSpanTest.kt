/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.graphics.text.LineBreakConfig
import android.os.SystemClock
import android.text.Layout
import android.text.Spannable
import android.text.SpannableString
import android.text.TextPaint
import android.text.style.ClickableSpan
import android.view.MotionEvent
import android.view.View
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Tapping a [ClickableSpan] in a [PreparedLayoutTextView] clicks it, for the current text only. */
@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
@SuppressLint("NewApi")
@Config(sdk = [34])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class PreparedLayoutTextViewClickableSpanTest {

  private val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())

  @Test
  fun `tapping a clickable span clicks it`() {
    val span = CountingClickableSpan()
    view.preparedLayout = preparedLayout(textWith(span))

    assertThat(tap()).isTrue()
    assertThat(span.clicks).isEqualTo(1)
  }

  @Test
  fun `tapping text without clickable spans does not click`() {
    val span = CountingClickableSpan()
    view.preparedLayout = preparedLayout(textWith(span))
    tap()

    view.preparedLayout = preparedLayout(SpannableString(TEXT))

    assertThat(tap()).isFalse()
    assertThat(span.clicks).isEqualTo(1)
  }

  @Test
  fun `tapping a clickable span in new text clicks it`() {
    view.preparedLayout = preparedLayout(SpannableString(TEXT))
    tap()

    val span = CountingClickableSpan()
    view.preparedLayout = preparedLayout(textWith(span))

    assertThat(tap()).isTrue()
    assertThat(span.clicks).isEqualTo(1)
  }

  /** Sends a down and an up at the start of the text; returns whether the up was handled. */
  private fun tap(): Boolean {
    val time = SystemClock.uptimeMillis()
    val down = MotionEvent.obtain(time, time, MotionEvent.ACTION_DOWN, 5f, 5f, 0)
    val up = MotionEvent.obtain(time, time, MotionEvent.ACTION_UP, 5f, 5f, 0)
    view.onTouchEvent(down)
    val handled = view.onTouchEvent(up)
    down.recycle()
    up.recycle()
    return handled
  }

  private fun textWith(span: ClickableSpan): SpannableString =
      SpannableString(TEXT).apply {
        setSpan(span, 0, TEXT.length, Spannable.SPAN_INCLUSIVE_INCLUSIVE)
      }

  private fun preparedLayout(text: SpannableString): PreparedLayout =
      PreparedLayout(
          TextLayoutManager.createLayout(
              text,
              /* boring = */ null,
              /* width = */ 400f,
              YogaMeasureMode.EXACTLY,
              /* includeFontPadding = */ false,
              /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
              /* hyphenationFrequency = */ Layout.HYPHENATION_FREQUENCY_NONE,
              /* lineBreakStyle = */ LineBreakConfig.LINE_BREAK_STYLE_NONE,
              /* lineBreakWordStyle = */ LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
              Layout.Alignment.ALIGN_NORMAL,
              /* justificationMode = */ 0,
              /* ellipsizeMode = */ null,
              /* maxNumberOfLines = */ 0,
              TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 26f },
          ),
          /* maximumNumberOfLines = */ 0,
          /* verticalOffset = */ 0f,
          /* reactTags = */ IntArray(0),
          /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
          /* justificationMode = */ 0,
          baseTextAttributes = TextAttributeProps.fromMapBuffer(WritableMapBuffer()),
          /* sourceText = */ text,
      )

  private class CountingClickableSpan : ClickableSpan() {
    var clicks = 0

    override fun onClick(widget: View) {
      clicks++
    }
  }

  private companion object {
    const val TEXT = "Tap this text"
  }
}
