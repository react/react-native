/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.textinput

import android.graphics.Canvas
import android.text.Layout
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.util.DisplayMetrics
import android.view.View
import android.view.ViewGroup
import androidx.core.content.res.ResourcesCompat.ID_NULL
import androidx.core.graphics.createBitmap
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.text.internal.span.CanvasEffectSpan
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactEditTextTest {

  private lateinit var view: ReactEditText

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    context.initializeWithInstance(createMockCatalystInstance())
    val themedContext = ThemedReactContext(context, context.baseContext, null, ID_NULL)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    view = ReactTextInputManager().createViewInstance(themedContext)
  }

  @Test
  fun drawsCanvasEffectSpansAfterPlaceholderChangeThatKeepsTheFrame() {
    val width = 200
    val height = 40
    val text = SpannableStringBuilder("Underlined")
    val span = RecordingCanvasEffectSpan()
    text.setSpan(span, 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

    view.layoutParams =
        ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        )
    view.setText(text)
    view.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY),
    )
    view.layout(0, 0, width, height)
    view.draw(Canvas(createBitmap(width, height)))
    span.reset()

    // Changing the placeholder drops TextView's layout, but Fabric does not measure the view again
    // because its frame did not change.
    view.setPlaceholder("Placeholder")
    view.draw(Canvas(createBitmap(width, height)))

    assertThat(span.preDrawCount).isEqualTo(1)
    assertThat(span.drawCount).isEqualTo(1)
  }

  private class RecordingCanvasEffectSpan : CanvasEffectSpan() {
    var preDrawCount = 0
    var drawCount = 0

    fun reset() {
      preDrawCount = 0
      drawCount = 0
    }

    override fun onPreDraw(start: Int, end: Int, canvas: Canvas, layout: Layout) {
      preDrawCount++
    }

    override fun onDraw(start: Int, end: Int, canvas: Canvas, layout: Layout) {
      drawCount++
    }
  }
}
