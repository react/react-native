/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.app.Activity
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.graphics.drawable.InsetDrawable
import android.graphics.drawable.NinePatchDrawable
import android.graphics.drawable.StateListDrawable
import android.os.Build
import android.os.Looper
import android.util.DisplayMetrics
import android.util.StateSet
import android.view.ContextThemeWrapper
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import androidx.annotation.RequiresApi
import androidx.core.graphics.drawable.toDrawable
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
@RequiresApi(Build.VERSION_CODES.N)
class ReactEditTextOutlineTest {

  private lateinit var view: ReactEditText

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = createTestReactApplicationContext()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    view =
        ReactTextInputManager().createViewInstance(ThemedReactContext(context, context, null, -1))
    view.layout(0, 0, WIDTH, HEIGHT)
  }

  @Test
  fun themeBackground_isInsetSelectorOfNinePatches() {
    val background = themeTextFieldBackground()

    assertThat(background).isInstanceOf(InsetDrawable::class.java)
    val selector = (background as InsetDrawable).drawable
    assertThat(selector).isInstanceOf(StateListDrawable::class.java)
    assertThat(selector?.current).isInstanceOf(NinePatchDrawable::class.java)
  }

  @Test
  fun themeBackgroundWithoutPadding_usesViewBounds() {
    view.background = themeTextFieldBackground()
    view.setPadding(0, 0, 0, 0)

    assertThat(outlineBounds()).isEqualTo(Rect(0, 0, WIDTH, HEIGHT))
  }

  @Test
  fun themeBackgroundWithOneSideBelowThemePadding_usesViewBounds() {
    val background = themeTextFieldBackground()
    view.background = background
    val padding = Rect().also { background.getPadding(it) }
    view.setPadding(padding.left, 0, padding.right, padding.bottom)

    assertThat(outlineBounds()).isEqualTo(Rect(0, 0, WIDTH, HEIGHT))
  }

  @Test
  fun themeBackgroundWithThemePadding_usesBackgroundOutline() {
    val background = themeTextFieldBackground()
    view.background = background
    val padding = Rect().also { background.getPadding(it) }
    view.setPadding(padding.left, padding.top, padding.right, padding.bottom)

    assertThat(outlineBounds()).isEqualTo(backgroundOutlineBounds(background))
  }

  @Test
  fun paddingChangeWhileAttached_rebuildsOutline() {
    val background = themeTextFieldBackground()
    view.background = background
    val padding = Rect().also { background.getPadding(it) }
    view.setPadding(padding.left, padding.top, padding.right, padding.bottom)
    val rebuiltOutline = Rect()
    val provider = view.outlineProvider
    view.outlineProvider =
        object : ViewOutlineProvider() {
          override fun getOutline(view: View, outline: Outline) {
            provider.getOutline(view, outline)
            outline.getRect(rebuiltOutline)
          }
        }
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    activity.setContentView(view, ViewGroup.LayoutParams(WIDTH, HEIGHT))
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(rebuiltOutline).isEqualTo(backgroundOutlineBounds(background))

    view.setPadding(0, 0, 0, 0)

    assertThat(rebuiltOutline).isEqualTo(Rect(0, 0, WIDTH, HEIGHT))
  }

  @Test
  fun customInsetBackgroundWithoutPadding_usesBackgroundOutline() {
    val selector = StateListDrawable()
    selector.addState(StateSet.WILD_CARD, Color.BLACK.toDrawable())
    val background = InsetDrawable(selector, 4, 10, 4, 7)
    background.setBounds(0, 0, WIDTH, HEIGHT)
    view.background = background
    view.setPadding(0, 0, 0, 0)

    assertThat(outlineBounds()).isEqualTo(Rect(4, 10, WIDTH - 4, HEIGHT - 7))
  }

  private fun themeTextFieldBackground(): Drawable {
    val context =
        ContextThemeWrapper(RuntimeEnvironment.getApplication(), android.R.style.Theme_Material)
    val attrs = context.obtainStyledAttributes(intArrayOf(android.R.attr.editTextBackground))
    val background = checkNotNull(attrs.getDrawable(0))
    attrs.recycle()
    background.setBounds(0, 0, WIDTH, HEIGHT)
    return background
  }

  private fun outlineBounds(): Rect {
    val outline = Outline()
    view.outlineProvider.getOutline(view, outline)
    return Rect().also { outline.getRect(it) }
  }

  private fun backgroundOutlineBounds(background: Drawable): Rect {
    val outline = Outline()
    background.getOutline(outline)
    return Rect().also { outline.getRect(it) }
  }

  private companion object {
    const val WIDTH = 200
    const val HEIGHT = 100
  }
}
