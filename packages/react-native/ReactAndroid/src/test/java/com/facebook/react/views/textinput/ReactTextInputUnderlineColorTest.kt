/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.DisplayMetrics
import androidx.core.content.res.ResourcesCompat.ID_NULL
import androidx.core.graphics.createBitmap
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.style.BoxShadow
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Tests that `underlineColorAndroid` tints only the underline, not the other background layers. */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class], sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ReactTextInputUnderlineColorTest {

  private lateinit var manager: ReactTextInputManager
  private lateinit var view: ReactEditText
  private lateinit var underline: GradientDrawable

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 1f })
    val themedContext =
        ThemedReactContext(
            createTestReactApplicationContext(),
            RuntimeEnvironment.getApplication(),
            null,
            ID_NULL,
        )
    manager = ReactTextInputManager()
    view = manager.createViewInstance(themedContext)
    underline = GradientDrawable()
    view.background = underline
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun underlineColorSetAfterBoxShadowKeepsTheShadow() {
    setBoxShadow()
    manager.setUnderlineColor(view, Color.TRANSPARENT)

    assertThat(underline.colorFilter)
        .isEqualTo(PorterDuffColorFilter(Color.TRANSPARENT, PorterDuff.Mode.SRC_IN))
    assertThat(drawBackground().getPixel(15, 50)).isEqualTo(Color.BLACK)
  }

  @Test
  fun underlineColorSetBeforeBoxShadowStaysOnTheUnderline() {
    manager.setUnderlineColor(view, Color.RED)
    setBoxShadow()
    assertThat(underline.colorFilter)
        .isEqualTo(PorterDuffColorFilter(Color.RED, PorterDuff.Mode.SRC_IN))

    manager.setUnderlineColor(view, null)

    assertThat(underline.colorFilter).isNull()
    assertThat(drawBackground().getPixel(15, 50)).isEqualTo(Color.BLACK)
  }

  /** Gives the view a black 10px shadow on every side, without blur. */
  private fun setBoxShadow() {
    BackgroundStyleApplicator.setBoxShadow(
        view,
        listOf(BoxShadow(offsetX = 0f, offsetY = 0f, color = Color.BLACK, spreadDistance = 10f)),
    )
  }

  /** Draws the background into a 100px square, inset by 20px so the 10px shadow spread fits. */
  private fun drawBackground(): Bitmap {
    val bitmap = createBitmap(100, 100, Bitmap.Config.ARGB_8888)
    val background = checkNotNull(view.background)
    background.setBounds(20, 20, 80, 80)
    background.draw(Canvas(bitmap))
    return bitmap
  }
}
