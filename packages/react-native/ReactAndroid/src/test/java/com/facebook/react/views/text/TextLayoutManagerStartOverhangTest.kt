/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.os.Build
import android.text.BoringLayout
import android.text.Layout
import android.text.SpannableString
import android.text.TextPaint
import android.text.TextUtils
import android.widget.TextView
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Regression coverage for Android 15+ RTL start-side glyph clipping (#58064).
 *
 * Full-width (EXACTLY) paragraphs never go through the AT_MOST visual-bounds measurement path, so
 * the drawn StaticLayout must opt into setUseBoundsForWidth +
 * setShiftDrawingOffsetForStartOverhang or leading Arabic ink is clipped at the line start.
 */
@RunWith(RobolectricTestRunner::class)
class TextLayoutManagerStartOverhangTest {

  @Test
  @Config(sdk = [33])
  fun `createLayout still builds RTL Arabic text on pre-API 35`() {
    val layout = invokeCreateLayout(SpannableString(ARABIC_WITH_ALEF_MADDA), width = 200f)

    assertThat(layout.lineCount).isGreaterThan(0)
    assertThat(layout.text.toString()).isEqualTo(ARABIC_WITH_ALEF_MADDA)
  }

  @Test
  @Config(sdk = [35])
  fun `API 35 StaticLayout Builder exposes start overhang setters`() {
    assertThat(AndroidTextStartOverhangCompat.builderStartOverhangApisAvailable()).isTrue()
  }

  @Test
  @Config(sdk = [35])
  fun `EXACTLY layout on API 35 enables bounds width and start overhang shift`() {
    val layout = invokeCreateLayout(SpannableString(ARABIC_WITH_ALEF_MADDA), width = 200f)

    assertThat(booleanLayoutGetter(layout, "getUseBoundsForWidth")).isTrue()
    assertThat(booleanLayoutGetter(layout, "getShiftDrawingOffsetForStartOverhang")).isTrue()
  }

  @Test
  @Config(sdk = [35])
  fun `Paper TextView receives the same API 35 start overhang setters`() {
    val view = TextView(RuntimeEnvironment.getApplication())
    AndroidTextStartOverhangCompat.applyToTextView(view)

    assertThat(booleanGetter(view, "getUseBoundsForWidth")).isTrue()
    assertThat(booleanGetter(view, "getShiftDrawingOffsetForStartOverhang")).isTrue()
  }

  /**
   * Invokes the private TextLayoutManager.createLayout via reflection. Defaults match a plain
   * full-width Fabric paragraph (EXACTLY width, no ellipsize).
   */
  @SuppressLint("InlinedApi")
  private fun invokeCreateLayout(text: SpannableString, width: Float): Layout {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 26f }
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
        /* includeFontPadding = */ true,
        /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
        /* hyphenationFrequency = */ Layout.HYPHENATION_FREQUENCY_NONE,
        Layout.Alignment.ALIGN_OPPOSITE,
        /* justificationMode = */ 0,
        /* ellipsizeMode = */ null,
        /* maxNumberOfLines = */ -1,
        paint,
    ) as Layout
  }

  private fun booleanLayoutGetter(layout: Layout, name: String): Boolean =
      booleanGetter(layout, name)

  private fun booleanGetter(target: Any, name: String): Boolean {
    val method = target.javaClass.methods.firstOrNull { it.name == name && it.parameterCount == 0 }
    assertThat(method)
        .withFailMessage(
            "%s.%s() is missing on API %d. Robolectric must be running with an android-all jar that includes the API 35 text overhang APIs.",
            target.javaClass.simpleName,
            name,
            Build.VERSION.SDK_INT,
        )
        .isNotNull()
    return method!!.invoke(target) as Boolean
  }

  private companion object {
    // U+0622 (alef madda) is the glyph called out in #58064 as clipping at RTL line start.
    const val ARABIC_WITH_ALEF_MADDA = "آية الكرسي"
  }
}
