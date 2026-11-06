/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.graphics.Rect
import android.os.SystemClock
import android.util.DisplayMetrics
import android.view.KeyEvent
import android.view.View
import android.widget.FrameLayout
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactEditTextKeyEventTest {

  private lateinit var manager: ReactTextInputManager
  private lateinit var view: ReactEditText

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = createTestReactApplicationContext()
    val themedContext = ThemedReactContext(context, context.baseContext, null, ID_NULL)
    manager = ReactTextInputManager()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    view = manager.createViewInstance(themedContext)

    val unfocusableView =
        object : View(themedContext) {
          override fun requestFocus(direction: Int, previouslyFocusedRect: Rect?): Boolean = false
        }
    val parent =
        object : FrameLayout(themedContext) {
          override fun focusSearch(focused: View?, direction: Int): View = unfocusableView
        }
    parent.addView(view)
  }

  @Test
  fun testSingleLineNumpadEnterKeyUpIsConsumed() {
    manager.updateProperties(view, ReactStylesDiffMap(JavaOnlyMap.of("multiline", false)))

    assertThat(view.onKeyUp(KeyEvent.KEYCODE_NUMPAD_ENTER, keyUp(KeyEvent.KEYCODE_NUMPAD_ENTER)))
        .isTrue
  }

  @Test
  fun testMultilineEditorActionEnterKeyUpIsConsumed() {
    manager.updateProperties(view, ReactStylesDiffMap(JavaOnlyMap.of("multiline", true)))

    for (keyCode in listOf(KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER)) {
      assertThat(view.onKeyUp(keyCode, keyUp(keyCode, KeyEvent.FLAG_EDITOR_ACTION))).isTrue
    }
  }

  @Test
  fun testMultilineEmailEnterKeyUpIsConsumed() {
    manager.updateProperties(
        view,
        ReactStylesDiffMap(JavaOnlyMap.of("multiline", true, "keyboardType", "email-address")),
    )

    for (keyCode in listOf(KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER)) {
      assertThat(view.onKeyUp(keyCode, keyUp(keyCode))).isTrue
    }
  }

  private fun keyUp(keyCode: Int, flags: Int = 0): KeyEvent {
    val now = SystemClock.uptimeMillis()
    return KeyEvent(now, now, KeyEvent.ACTION_UP, keyCode, 0, 0, 0, 0, flags)
  }
}
