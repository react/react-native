/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.Looper
import android.text.SpannableString
import android.util.DisplayMetrics
import android.view.FocusFinder
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityNodeInfo
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

abstract class TextKeyboardFocusTest<T : View> {

  protected lateinit var context: Context
  private lateinit var manager: ViewManager<T, *>
  private val activityControllers = mutableListOf<ActivityController<Activity>>()

  protected abstract fun createManager(): ViewManager<T, *>

  protected abstract fun createTextView(context: Context): T

  protected abstract fun recycle(text: T)

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    val activityController = Robolectric.buildActivity(Activity::class.java).setup()
    activityControllers.add(activityController)
    context = activityController.get()
    manager = createManager()
  }

  @After
  fun tearDown() {
    activityControllers.forEach { it.pause().stop().destroy() }
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `focusable false - Tab and the arrow keys pass over an accessible text`() {
    val leading = control(top = 0)
    val excluded = excludedText(top = 10)
    val trailing = control(top = 20)
    val root = attach(leading, excluded, trailing)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(trailing)
    assertThat(nextFocus(root, trailing, View.FOCUS_BACKWARD)).isSameAs(leading)
    assertThat(nextFocus(root, leading, View.FOCUS_DOWN)).isSameAs(trailing)
    assertThat(nextFocus(root, trailing, View.FOCUS_UP)).isSameAs(leading)
  }

  @Test
  fun `focusable false - a next focus id naming an excluded text passes over it`() {
    val leading = control(top = 0)
    val excluded = excludedText(top = 10)
    val trailing = control(top = 20)
    excluded.id = View.generateViewId()
    leading.nextFocusForwardId = excluded.id
    val root = attach(leading, excluded, trailing)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(trailing)
  }

  @Test
  fun `focusable false - an editor's next action toward an excluded text moves focus on`() {
    val excluded = excludedText(top = 10)
    val trailing = control(top = 20)
    excluded.id = View.generateViewId()
    val editor =
        EditText(context).apply {
          layout(0, 0, 100, 10)
          imeOptions = EditorInfo.IME_ACTION_NEXT
          nextFocusForwardId = excluded.id
        }
    attach(editor, excluded, trailing)
    editor.requestFocus()

    editor.onEditorAction(EditorInfo.IME_ACTION_NEXT)

    assertThat(trailing.isFocused).isTrue()
  }

  @Test
  fun `focusable false - cluster navigation passes over an excluded text`() {
    val excluded = excludedText(top = 0)
    val trailing = control(top = 10)
    val root = attach(excluded, trailing)

    ViewGroup::class.java.getMethod("restoreFocusNotInCluster").invoke(root)

    assertThat(excluded.isFocused).isFalse()
    assertThat(trailing.isFocused).isTrue()
  }

  @Test
  fun `focusable false - default focus passes over an excluded text`() {
    val excluded = excludedText(top = 0)
    val trailing = control(top = 10)
    val root = attach(excluded, trailing)

    assertThat(root.requestFocus(View.FOCUS_DOWN)).isTrue()

    assertThat(excluded.isFocused).isFalse()
    assertThat(trailing.isFocused).isTrue()
  }

  @Test
  fun `focusable false - offers accessibility services no focus action`() {
    val excluded = excludedText(top = 0)
    attach(excluded)

    val actions = excluded.createAccessibilityNodeInfo().actionList

    assertThat(actions).doesNotContain(AccessibilityNodeInfo.AccessibilityAction.ACTION_FOCUS)
    assertThat(excluded.performAccessibilityAction(AccessibilityNodeInfo.ACTION_FOCUS, null))
        .isFalse()
    assertThat(excluded.isFocused).isFalse()
  }

  @Test
  fun `focusable false - an accessible text stays one screen reader element`() {
    val excluded = excludedText(top = 0)
    val root = attach(excluded)

    assertThat(excluded.createAccessibilityNodeInfo().isScreenReaderFocusable).isTrue()
    assertThat(excluded.isImportantForAccessibility).isTrue()
    assertThat(accessibilityChildren(root)).containsExactly(excluded)
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.O_MR1])
  fun `focusable false - below API 28 an accessible text reports itself screen reader focusable`() {
    val excluded = excludedText(top = 0)
    val root = attach(excluded)

    val node = AccessibilityNodeInfoCompat.wrap(excluded.createAccessibilityNodeInfo())

    assertThat(node.isScreenReaderFocusable).isTrue()
    assertThat(excluded.isImportantForAccessibility).isTrue()
    assertThat(excluded.isFocusable).isFalse()
    assertThat(accessibilityChildren(root)).containsExactly(excluded)
  }

  @Test
  fun `focusable unset - keyboard focus follows accessible`() {
    val leading = control(top = 0)
    val text = text(top = 10, ACCESSIBLE to true)
    val trailing = control(top = 20)
    val root = attach(leading, text, trailing)
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(text)

    update(text, ACCESSIBLE to false)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(trailing)
  }

  @Test
  fun `focusable true - returns an excluded text to keyboard navigation`() {
    val leading = control(top = 0)
    val excluded = excludedText(top = 10)
    val root = attach(leading, excluded)
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isNull()

    update(excluded, FOCUSABLE to true)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(excluded)
  }

  @Test
  fun `focusable removed - returns an excluded text to the keyboard focus accessible gives it`() {
    val leading = control(top = 0)
    val excluded = excludedText(top = 10)
    val root = attach(leading, excluded)
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isNull()

    update(excluded, FOCUSABLE to null)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(excluded)
  }

  @Test
  fun `focusable turning false keeps focus on a focused text until focus moves on`() {
    val text = text(top = 0, ACCESSIBLE to true)
    val trailing = control(top = 10)
    val root = attach(text, trailing)
    assertThat(text.requestFocus()).isTrue()

    update(text, FOCUSABLE to false)

    assertThat(text.isFocused).isTrue()
    trailing.requestFocus()
    assertThat(nextFocus(root, trailing, View.FOCUS_BACKWARD)).isNull()
    assertThat(text.requestFocus()).isFalse()
  }

  @Test
  fun `the focus state is the same whichever prop applies first`() {
    for ((accessible, focusable) in listOf(true to false, false to true)) {
      val accessibleFirst = text(top = 0, ACCESSIBLE to accessible)
      update(accessibleFirst, FOCUSABLE to focusable)
      val focusableFirst = text(top = 10, FOCUSABLE to focusable)
      update(focusableFirst, ACCESSIBLE to accessible)
      attach(accessibleFirst, focusableFirst)

      assertThat(focusableFirst.isFocusable)
          .describedAs("accessible $accessible, focusable $focusable")
          .isEqualTo(focusable)
      assertThat(focusState(focusableFirst)).isEqualTo(focusState(accessibleFirst))
    }
  }

  @Test
  fun `recycling returns a text to the focus state a new text has`() {
    val fresh = text(top = 0)
    val excluded = excludedText(top = 10, ViewProps.SCREEN_READER_FOCUSABLE to true)
    attach(fresh, excluded)
    assertThat(excluded.isFocusable).isFalse()
    (excluded.parent as ViewGroup).removeView(excluded)

    recycle(excluded)
    update(excluded, ACCESSIBLE to true)
    update(fresh, ACCESSIBLE to true)

    assertThat(excluded.isFocusable).isTrue()
    assertThat(focusState(excluded)).isEqualTo(focusState(fresh))
  }

  protected fun excludedText(top: Int, vararg props: Pair<String, Any?>): T =
      text(top, ACCESSIBLE to true, FOCUSABLE to false, *props)

  protected fun text(top: Int, vararg props: Pair<String, Any?>): T =
      createTextView(context).apply {
        layout(0, top, 100, top + 10)
        update(this, *props)
      }

  protected fun update(text: T, vararg props: Pair<String, Any?>) {
    manager.updateProperties(
        text,
        ReactStylesDiffMap(JavaOnlyMap.of(*props.flatMap { it.toList() }.toTypedArray())),
    )
  }

  protected fun control(top: Int): View =
      View(context).apply {
        isFocusable = true
        layout(0, top, 100, top + 10)
      }

  protected fun attach(vararg views: View): ReactViewGroup {
    val root = ReactViewGroup(context)
    views.forEach(root::addView)
    val activityController = Robolectric.buildActivity(Activity::class.java).setup()
    activityControllers.add(activityController)
    activityController.get().setContentView(root)
    shadowOf(Looper.getMainLooper()).idle()
    return root
  }

  protected fun nextFocus(root: ViewGroup, focused: View, direction: Int): View? =
      FocusFinder.getInstance().findNextFocus(root, focused, direction)

  private fun accessibilityChildren(view: ViewGroup): List<View> {
    val children = ArrayList<View>()
    view.addChildrenForAccessibility(children)
    return children
  }

  private fun focusState(view: View): FocusState {
    val node = AccessibilityNodeInfoCompat.wrap(view.createAccessibilityNodeInfo())
    return FocusState(
        focusable = view.isFocusable,
        screenReaderFocusable = node.isScreenReaderFocusable,
        importantForAccessibility = view.importantForAccessibility,
    )
  }

  protected companion object {
    const val ACCESSIBLE = "accessible"
    const val FOCUSABLE = "focusable"
  }

  private data class FocusState(
      val focusable: Boolean,
      val screenReaderFocusable: Boolean,
      val importantForAccessibility: Int,
  )
}

@RunWith(RobolectricTestRunner::class)
@Config(
    sdk =
        [
            Build.VERSION_CODES.TIRAMISU,
            Build.VERSION_CODES.UPSIDE_DOWN_CAKE,
            Build.VERSION_CODES.VANILLA_ICE_CREAM,
        ],
)
class ReactTextViewKeyboardFocusTest : TextKeyboardFocusTest<ReactTextView>() {

  override fun createManager(): ViewManager<ReactTextView, *> = ReactTextViewManager()

  override fun createTextView(context: Context): ReactTextView = ReactTextView(context)

  override fun recycle(text: ReactTextView) {
    text.recycleView()
  }

  @Test
  fun `focusable false - a selectable text stays focusable, as selecting text needs focus`() {
    val leading = control(top = 0)
    val text = excludedText(top = 10, SELECTABLE to true)
    val root = attach(leading, text)

    assertThat(text.isFocusable).isTrue()
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(text)
  }

  @Test
  fun `focusable false - a text that stops being selectable leaves keyboard navigation`() {
    val leading = control(top = 0)
    val text = excludedText(top = 10, SELECTABLE to true)
    val root = attach(leading, text)

    update(text, SELECTABLE to false)

    assertThat(text.isFocusable).isFalse()
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isNull()
  }

  @Test
  fun `focusable unset - an accessible text that stops being selectable stays a keyboard stop`() {
    val leading = control(top = 0)
    val text = text(top = 10, ACCESSIBLE to true, SELECTABLE to true)
    val root = attach(leading, text)

    update(text, SELECTABLE to false)

    assertThat(text.isFocusable).isTrue()
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(text)
  }

  @Test
  fun `a text with detected links stays a keyboard stop once attached, as moving through links needs focus`() {
    val leading = control(top = 0)
    val linked = text(top = 10, DATA_DETECTOR_TYPE to "link")
    linked.setText(textUpdate("Visit https://reactnative.dev"))
    val root = attach(leading, linked)

    assertThat(linked.isFocusable).isTrue()
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(linked)
  }

  @Test
  fun `focusable false - a text that detects links after it attaches stays out of keyboard navigation`() {
    val leading = control(top = 0)
    val text = excludedText(top = 10)
    val root = attach(leading, text)

    update(text, DATA_DETECTOR_TYPE to "link")
    text.setText(textUpdate("Visit https://reactnative.dev"))

    assertThat(text.isFocusable).isFalse()
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isNull()
  }

  @Test
  fun `a text that stops detecting links leaves keyboard navigation`() {
    val leading = control(top = 0)
    val text = text(top = 10, DATA_DETECTOR_TYPE to "link")
    text.setText(textUpdate("Visit https://reactnative.dev"))
    val root = attach(leading, text)

    update(text, DATA_DETECTOR_TYPE to "none")
    text.setText(textUpdate("Visit the site"))

    assertThat(text.isFocusable).isFalse()
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isNull()
  }

  private fun textUpdate(text: String): ReactTextUpdate =
      ReactTextUpdate(SpannableString(text), -1, Gravity.START, 0, 0)

  private companion object {
    const val DATA_DETECTOR_TYPE = "dataDetectorType"
    const val SELECTABLE = "selectable"
  }
}

@RunWith(RobolectricTestRunner::class)
@Config(
    sdk =
        [
            Build.VERSION_CODES.TIRAMISU,
            Build.VERSION_CODES.UPSIDE_DOWN_CAKE,
            Build.VERSION_CODES.VANILLA_ICE_CREAM,
        ],
)
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
  fun `focusable false - the inline views of an excluded text stay keyboard stops`() {
    val leading = control(top = 0)
    val excluded = excludedText(top = 10)
    val inlineView = control(top = 0)
    excluded.addView(inlineView)
    val root = attach(leading, excluded)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(inlineView)
  }
}
