/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.app.Activity
import android.content.Context
import android.os.Looper
import android.util.DisplayMetrics
import android.view.inputmethod.InputMethodManager
import android.widget.FrameLayout
import androidx.core.content.res.ResourcesCompat.ID_NULL
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
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowInputMethodManager
import org.robolectric.shadows.ShadowInstrumentation

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactEditTextSoftKeyboardTest {

  private lateinit var activityController: ActivityController<Activity>
  private lateinit var view: ReactEditText
  private lateinit var inputMethodManager: ShadowInputMethodManager

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
  }

  @Test
  fun testFocusFromJSShowsKeyboardWhenWindowHasFocus() {
    showWindow(inTouchMode = true)
    activityController.windowFocusChanged(true)

    view.requestFocusFromJS()

    assertThat(view.isFocused).isTrue
    assertThat(inputMethodManager.isSoftInputVisible).isTrue
  }

  @Test
  fun testFocusFromJSShowsKeyboardOnceWindowGainsFocus() {
    showWindow(inTouchMode = true)
    activityController.windowFocusChanged(false)

    view.requestFocusFromJS()

    assertThat(view.isFocused).isTrue
    assertThat(inputMethodManager.isSoftInputVisible).isFalse

    activityController.windowFocusChanged(true)
    shadowOf(Looper.getMainLooper()).idle()

    assertThat(inputMethodManager.isSoftInputVisible).isTrue
  }

  @Test
  fun testFocusFromJSOutsideTouchModeShowsNoKeyboardOnceWindowGainsFocus() {
    showWindow(inTouchMode = false)
    activityController.windowFocusChanged(false)
    view.requestFocusFromJS()

    activityController.windowFocusChanged(true)
    shadowOf(Looper.getMainLooper()).idle()

    assertThat(view.isFocused).isTrue
    assertThat(inputMethodManager.isSoftInputVisible).isFalse
  }

  // Robolectric gives a window its touch mode when the window is added.
  private fun showWindow(inTouchMode: Boolean) {
    ShadowInstrumentation.getInstrumentation().setInTouchMode(inTouchMode)
    activityController = Robolectric.buildActivity(Activity::class.java).setup()
    val activity = activityController.get()
    view =
        ReactTextInputManager()
            .createViewInstance(
                ThemedReactContext(createTestReactApplicationContext(), activity, null, ID_NULL)
            )
    // A view without a size cannot take focus once laid out.
    activity.setContentView(FrameLayout(activity).apply { addView(view, 200, 100) })
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(view.isInTouchMode).isEqualTo(inTouchMode)
    inputMethodManager =
        shadowOf(activity.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager)
  }
}
