/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.text.BoringLayout
import android.text.Layout
import android.text.SpannableString
import android.text.TextPaint
import android.text.TextUtils
import com.facebook.yoga.YogaMeasureMode
import kotlin.math.ceil
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Regression test for the "Keep watching" 1px text-wrap bug.
 *
 * Scenario: A dialog renders a primary button label inside an absolutely-positioned
 * focused/unfocused overlay (left:0/right:0). Yoga hands the inner Text a fractional EXACTLY width
 * (e.g. 258.5px on a 517px parent). Pre-fix, TextLayoutManager.createLayout floored the EXACTLY
 * width to 258 while the text the layout actually renders needed 259px, leaving the layout 1px
 * narrower than its own content — on a real device that forces the text to wrap to a second line
 * (taller label height). The user-visible symptom is "Keep watching" rendering on two lines instead
 * of one inside the dialog.
 *
 * Direct assertion: the layout.width returned by createLayout (the horizontal box StaticLayout was
 * told it has) must be >= layout.getLineWidth(0) (the horizontal advance of the rendered line).
 * When that invariant is violated, the rendered text doesn't fit in the layout's allocated space
 * and the next layout pass wraps it. Robolectric stubs real font metrics (1px/char), but the
 * relationship between allocated width and rendered line width is faithful enough to expose the
 * floor/ceil bug.
 */
@RunWith(RobolectricTestRunner::class)
class TextLayoutManagerAbsoluteLayoutWithFractionalPixelTest {

  @Test
  fun `EXACTLY mode with fractional width allocates a layout wide enough to fit its own text`() {
    val text = SpannableString("Keep watching")
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 16f }

    val desiredWidth = Layout.getDesiredWidth(text, paint)
    val ceilDesired = ceil(desiredWidth).toInt()

    // Construct the exact repro: a fractional EXACTLY width whose ceil equals
    // ceil(desiredWidth) but whose floor is one pixel short. Yoga has reserved the full
    // fractional width upstream, so flooring shaves 1px and triggers the wrap bug.
    val fractionalWidth = ceilDesired - 0.5f

    val layout = invokeCreateLayout(text, fractionalWidth, paint)
    val renderedLineWidth = layout.getLineWidth(0)

    assertThat(layout.width.toFloat())
        .withFailMessage(
            "Layout's allocated width (%d) is smaller than the rendered text it contains " +
                "(line 0 width=%.2f) for '%s' at EXACTLY width=%.2f " +
                "(layoutClass=%s, desiredWidth=%.2f, ceilDesired=%d). " +
                "On a real Android device this 1px shortfall forces the label to wrap to a " +
                "second line, doubling its height — the visible \"Keep watching\" bug in a " +
                "dialog. Root cause: TextLayoutManager.createLayout used floor(width) for " +
                "EXACTLY mode, producing a layout narrower than its own text.",
            layout.width,
            renderedLineWidth,
            text.toString(),
            fractionalWidth,
            layout::class.java.simpleName,
            desiredWidth,
            ceilDesired,
        )
        .isGreaterThanOrEqualTo(renderedLineWidth)
  }

  /**
   * Invokes the private TextLayoutManager.createLayout via reflection. We can't call it directly
   * because it's `private` (friend_paths only opens up `internal`). Default values mirror what
   * measureText() passes in the production path for a plain single-paragraph label.
   *
   * BREAK_STRATEGY_HIGH_QUALITY and HYPHENATION_FREQUENCY_NONE are API 23+ constants. The test runs
   * only on Robolectric (JVM), never on a device, so the inlined integer values are safe.
   */
  @SuppressLint("InlinedApi")
  private fun invokeCreateLayout(
      text: SpannableString,
      width: Float,
      paint: TextPaint,
  ): Layout {
    val boring: BoringLayout.Metrics? = BoringLayout.isBoring(text, paint)
    val method =
        TextLayoutManager::class
            .java
            .getDeclaredMethod(
                "createLayout",
                android.text.Spannable::class.java,
                BoringLayout.Metrics::class.java,
                java.lang.Float.TYPE,
                YogaMeasureMode::class.java,
                java.lang.Boolean.TYPE,
                java.lang.Integer.TYPE,
                java.lang.Integer.TYPE,
                Layout.Alignment::class.java,
                java.lang.Integer.TYPE,
                TextUtils.TruncateAt::class.java,
                java.lang.Integer.TYPE,
                TextPaint::class.java,
            )
            .apply { isAccessible = true }

    return method.invoke(
        TextLayoutManager,
        text,
        boring,
        width,
        YogaMeasureMode.EXACTLY,
        /* includeFontPadding = */ false,
        /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
        /* hyphenationFrequency = */ Layout.HYPHENATION_FREQUENCY_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        /* justificationMode = */ 0,
        /* ellipsizeMode = */ null,
        /* maxNumberOfLines = */ 2,
        paint,
    ) as Layout
  }
}
