/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.app.Activity
import android.content.Context
import android.view.FocusFinder
import android.view.View
import android.view.ViewGroup
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

abstract class TextKeyboardFocusTest<T : View> {

  protected lateinit var context: Context
  private lateinit var manager: ViewManager<T, *>

  protected abstract fun createManager(): ViewManager<T, *>

  protected abstract fun createTextView(context: Context): T

  protected abstract fun recycle(text: T)

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = Robolectric.buildActivity(Activity::class.java).create().get()
    manager = createManager()
  }

  @Test
  fun `focusable false - keeps an accessible text out of keyboard focus search`() {
    val root = ReactViewGroup(context)
    val leading = focusableView(top = 0)
    val text = accessibleText(top = 10, "focusable", false)
    val trailing = focusableView(top = 20)
    root.addView(leading)
    root.addView(text)
    root.addView(trailing)

    assertThat(collectKeyboardFocusables(root)).containsExactly(leading, trailing)
    // Accessibility services still treat the text as one focusable element.
    assertThat(text.isFocusable).isTrue()
  }

  @Test
  fun `focusable false - default focus passes over an excluded text`() {
    val root = ReactViewGroup(context)
    val text = accessibleText(top = 0, "focusable", false)
    val trailing = focusableView(top = 10)
    root.addView(text)
    root.addView(trailing)

    assertThat(root.requestFocus(View.FOCUS_DOWN)).isTrue()

    assertThat(text.isFocused).isFalse()
    assertThat(trailing.isFocused).isTrue()
  }

  @Test
  fun `focusable false - keyboard focus moves on from an excluded text that holds focus`() {
    val root = ReactViewGroup(context)
    val leading = focusableView(top = 0)
    val text = accessibleText(top = 10)
    val trailing = focusableView(top = 20)
    root.addView(leading)
    root.addView(text)
    root.addView(trailing)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
    assertThat(text.requestFocus()).isTrue()

    applyProps(text, "focusable", false)

    assertThat(FocusFinder.getInstance().findNextFocus(root, text, View.FOCUS_FORWARD))
        .isSameAs(trailing)
    assertThat(FocusFinder.getInstance().findNextFocus(root, text, View.FOCUS_BACKWARD))
        .isSameAs(leading)
  }

  @Test
  fun `focusable true - returns a text to keyboard focus search`() {
    val root = ReactViewGroup(context)
    val text = accessibleText(top = 0, "focusable", false)
    root.addView(text)
    assertThat(collectKeyboardFocusables(root)).isEmpty()

    applyProps(text, "focusable", true)

    assertThat(collectKeyboardFocusables(root)).containsExactly(text)
  }

  @Test
  fun `focusable removed - returns a text to keyboard focus search`() {
    val root = ReactViewGroup(context)
    val text = accessibleText(top = 0, "focusable", false)
    root.addView(text)
    assertThat(collectKeyboardFocusables(root)).isEmpty()

    applyProps(text, "focusable", null)

    assertThat(collectKeyboardFocusables(root)).containsExactly(text)
  }

  @Test
  fun `focusable false - recycling a text returns it to keyboard focus search`() {
    val root = ReactViewGroup(context)
    val text = accessibleText(top = 0, "focusable", false)
    root.addView(text)
    assertThat(collectKeyboardFocusables(root)).isEmpty()
    root.removeView(text)

    recycle(text)
    applyProps(text, "accessible", true)
    root.addView(text)

    assertThat(collectKeyboardFocusables(root)).containsExactly(text)
  }

  protected fun accessibleText(top: Int, vararg props: Any?): T =
      createTextView(context).apply {
        layout(0, top, 100, top + 10)
        applyProps(this, "accessible", true, *props)
      }

  protected fun applyProps(text: T, vararg keysAndValues: Any?) {
    manager.updateProperties(text, ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues)))
  }

  protected fun focusableView(top: Int): View =
      View(context).apply {
        isFocusable = true
        layout(0, top, 100, top + 10)
      }

  protected fun collectKeyboardFocusables(root: ViewGroup): List<View> {
    val focusables = ArrayList<View>()
    root.addFocusables(focusables, View.FOCUS_FORWARD, View.FOCUSABLES_ALL)
    return focusables
  }
}

@RunWith(RobolectricTestRunner::class)
class ReactTextViewKeyboardFocusTest : TextKeyboardFocusTest<ReactTextView>() {

  override fun createManager(): ViewManager<ReactTextView, *> = ReactTextViewManager()

  override fun createTextView(context: Context): ReactTextView = ReactTextView(context)

  override fun recycle(text: ReactTextView) {
    text.recycleView()
  }

  @After
  fun tearDown() {
    InstrumentationRegistry.getInstrumentation().setInTouchMode(false)
  }

  @Test
  fun `focusable false - a touch still focuses an excluded selectable text`() {
    InstrumentationRegistry.getInstrumentation().setInTouchMode(true)
    val root = ReactViewGroup(context)
    val text = accessibleText(top = 0, "focusable", false, "selectable", true)
    root.addView(text)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
    assertThat(text.isInTouchMode).isTrue()

    assertThat(text.requestFocus()).isTrue()
  }
}

@RunWith(RobolectricTestRunner::class)
internal class PreparedLayoutTextViewKeyboardFocusTest :
    TextKeyboardFocusTest<PreparedLayoutTextView>() {

  override fun createManager(): ViewManager<PreparedLayoutTextView, *> =
      PreparedLayoutTextViewManager()

  override fun createTextView(context: Context): PreparedLayoutTextView =
      PreparedLayoutTextView(context)

  override fun recycle(text: PreparedLayoutTextView) {
    text.recycleView()
  }

  @Test
  fun `focusable false - keeps the inline views of an excluded text in keyboard focus search`() {
    val root = ReactViewGroup(context)
    val text = accessibleText(top = 0, "focusable", false)
    val inlineView = focusableView(top = 0)
    text.addView(inlineView)
    root.addView(text)

    assertThat(collectKeyboardFocusables(root)).containsExactly(inlineView)
  }
}
