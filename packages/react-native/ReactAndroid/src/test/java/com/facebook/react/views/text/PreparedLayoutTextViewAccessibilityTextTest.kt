/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.text.Layout
import android.text.SpannableString
import android.text.TextPaint
import android.text.TextUtils
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Regression test for prepared text layout exposing truncated text to accessibility / the view
 * hierarchy.
 *
 * When a prepared [Layout] is ellipsized, `layout.text` is an Android `Ellipsizer` whose
 * `toString()` is only the on-screen (truncated) string. [PreparedLayoutTextView.getText] — read by
 * the accessibility node and by black-box E2E view-hierarchy tooling — must instead return the full
 * logical text, matching a non-prepared `TextView` whose `getText()` returns the full source.
 */
@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
@SuppressLint("NewApi")
class PreparedLayoutTextViewAccessibilityTextTest {

  private val fullText =
      listOf(
              "This is an order created from the data builder",
              "second line of the description",
              "third line of the description",
          )
          .joinToString("\n")

  @Test
  @Config(sdk = [34])
  fun `getText returns the full logical text when the prepared layout is ellipsized`() {
    val layout = createEllipsizedLayout()

    // Guard: the scenario is genuinely ellipsized, so layout.text is the truncated on-screen text.
    assertThat(layout.getEllipsisCount(layout.lineCount - 1)).isGreaterThan(0)
    assertThat(layout.text.toString()).contains("…")
    assertThat(layout.text.toString()).isNotEqualTo(fullText)

    val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())
    view.preparedLayout =
        PreparedLayout(
            layout,
            /* maximumNumberOfLines = */ 1,
            /* verticalOffset = */ 0f,
            /* reactTags = */ IntArray(0),
            /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
            /* justificationMode = */ 0,
            baseTextAttributes = TextAttributeProps.fromMapBuffer(WritableMapBuffer()),
            /* sourceText = */ fullText,
        )

    assertThat(view.text?.toString()).isEqualTo(fullText)
    assertThat(view.text?.toString()).doesNotContain("…")
  }

  private fun createEllipsizedLayout(): Layout =
      TextLayoutManager.createLayout(
          SpannableString(fullText),
          /* boring = */ null,
          /* width = */ 200f,
          YogaMeasureMode.EXACTLY,
          /* includeFontPadding = */ false,
          /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
          /* hyphenationFrequency = */ Layout.HYPHENATION_FREQUENCY_NONE,
          Layout.Alignment.ALIGN_NORMAL,
          /* justificationMode = */ 0,
          /* ellipsizeMode = */ TextUtils.TruncateAt.END,
          /* maxNumberOfLines = */ 1,
          TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 26f },
      )
}
