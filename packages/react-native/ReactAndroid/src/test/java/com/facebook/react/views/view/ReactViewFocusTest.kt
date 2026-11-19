/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.app.Activity
import android.os.Build
import android.os.Looper
import android.util.DisplayMetrics
import android.view.FocusFinder
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.TextView
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactClippingViewGroupHelper
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewProps
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    sdk =
        [
            Build.VERSION_CODES.TIRAMISU,
            Build.VERSION_CODES.UPSIDE_DOWN_CAKE,
            Build.VERSION_CODES.VANILLA_ICE_CREAM,
        ],
)
class ReactViewFocusTest {

  private lateinit var themedReactContext: ThemedReactContext
  private lateinit var viewManager: ReactViewManager
  private val activityControllers = mutableListOf<ActivityController<Activity>>()
  private var nextTag = 1

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableAccessibilityOrder(): Boolean = true

          override fun enableImperativeFocus(): Boolean = true

          override fun enableViewRecycling(): Boolean = true
        },
    )
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    themedReactContext =
        ThemedReactContext(
            mock<ReactApplicationContext>(),
            RuntimeEnvironment.getApplication(),
            null,
            -1,
        )
    viewManager = ReactViewManager()
  }

  @After
  fun tearDown() {
    activityControllers.forEach { it.pause().stop().destroy() }
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun `focusable false - Tab and the arrow keys pass over an accessible view`() {
    val leading = control(top = 0)
    val excluded = excludedView(top = 10)
    val trailing = control(top = 20)
    val root = attach(leading, excluded, trailing)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(trailing)
    assertThat(nextFocus(root, trailing, View.FOCUS_BACKWARD)).isSameAs(leading)
    assertThat(nextFocus(root, leading, View.FOCUS_DOWN)).isSameAs(trailing)
    assertThat(nextFocus(root, trailing, View.FOCUS_UP)).isSameAs(leading)
  }

  @Test
  fun `focusable false - a next focus id naming an excluded view passes over it`() {
    val leading = control(top = 0)
    val excluded = excludedView(top = 10)
    val trailing = control(top = 20)
    leading.nextFocusForwardId = excluded.id
    val root = attach(leading, excluded, trailing)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(trailing)
  }

  @Test
  fun `focusable false - an editor's next action toward an excluded view moves focus on`() {
    val excluded = excludedView(top = 10)
    val trailing = control(top = 20)
    val editor =
        EditText(themedReactContext).apply {
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
  fun `focusable false - cluster navigation passes over an excluded view`() {
    val excluded = excludedView(top = 0)
    val trailing = control(top = 10)
    val root = attach(excluded, trailing)

    ViewGroup::class.java.getMethod("restoreFocusNotInCluster").invoke(root)

    assertThat(excluded.isFocused).isFalse()
    assertThat(trailing.isFocused).isTrue()
  }

  @Test
  fun `focusable false - default focus passes over an excluded view`() {
    val excluded = excludedView(top = 0)
    val trailing = control(top = 10)
    val root = attach(excluded, trailing)

    assertThat(root.requestFocus(View.FOCUS_DOWN)).isTrue()

    assertThat(excluded.isFocused).isFalse()
    assertThat(trailing.isFocused).isTrue()
  }

  @Test
  fun `focusable false - the descendants of an excluded view stay keyboard stops`() {
    val leading = control(top = 0)
    val excluded = excludedView(top = 10)
    val descendant = control(top = 0)
    excluded.addView(descendant)
    val root = attach(leading, excluded)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(descendant)
  }

  @Test
  fun `focusable false - offers accessibility services no focus action`() {
    val excluded = excludedView(top = 0)
    attach(excluded)

    val actions = excluded.createAccessibilityNodeInfo().actionList

    assertThat(actions).doesNotContain(AccessibilityNodeInfo.AccessibilityAction.ACTION_FOCUS)
    assertThat(excluded.performAccessibilityAction(AccessibilityNodeInfo.ACTION_FOCUS, null))
        .isFalse()
    assertThat(excluded.isFocused).isFalse()
  }

  @Test
  fun `focusable false - takes a view that is not accessible out of keyboard navigation`() {
    val leading = control(top = 0)
    val view = reactView(FOCUSABLE to true, top = 10)
    val trailing = control(top = 20)
    val root = attach(leading, view, trailing)
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(view)

    update(view, FOCUSABLE to false)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(trailing)
    assertThat(view.requestFocus()).isFalse()
  }

  @Test
  fun `focusable unset - keyboard focus follows accessible`() {
    val leading = control(top = 0)
    val view = reactView(ACCESSIBLE to true, top = 10)
    val trailing = control(top = 20)
    val root = attach(leading, view, trailing)
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(view)

    update(view, ACCESSIBLE to false)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(trailing)
  }

  @Test
  fun `focusable removed - returns an excluded view to the keyboard focus accessible gives it`() {
    val leading = control(top = 0)
    val excluded = excludedView(top = 10)
    val root = attach(leading, excluded)
    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isNull()

    update(excluded, FOCUSABLE to null)

    assertThat(nextFocus(root, leading, View.FOCUS_FORWARD)).isSameAs(excluded)
  }

  @Test
  fun `ref focus - focuses an excluded accessible view`() {
    val excluded = excludedView(top = 0)
    attach(excluded)

    focusFromJS(excluded)

    assertThat(excluded.isFocused).isTrue()
  }

  @Test
  fun `ref focus - focuses a focusable false view that is not accessible`() {
    val view = reactView(FOCUSABLE to false, top = 0)
    attach(view)

    focusFromJS(view)

    assertThat(view.isFocused).isTrue()
  }

  @Test
  fun `ref focus - an excluded view leaves keyboard navigation once focus moves on`() {
    val leading = control(top = 0)
    val excluded = excludedView(top = 10)
    val trailing = control(top = 20)
    val root = attach(leading, excluded, trailing)
    focusFromJS(excluded)
    assertThat(nextFocus(root, excluded, View.FOCUS_FORWARD)).isSameAs(trailing)
    assertThat(nextFocus(root, excluded, View.FOCUS_BACKWARD)).isSameAs(leading)

    trailing.requestFocus()

    assertThat(nextFocus(root, trailing, View.FOCUS_BACKWARD)).isSameAs(leading)
    assertThat(excluded.requestFocus()).isFalse()
  }

  @Test
  fun `ref focus - a failed request leaves an excluded view out of keyboard navigation`() {
    val excluded = excludedView(top = 0).apply { visibility = View.GONE }
    attach(excluded)

    focusFromJS(excluded)
    excluded.visibility = View.VISIBLE

    assertThat(excluded.isFocused).isFalse()
    assertThat(excluded.requestFocus()).isFalse()
  }

  @Test
  fun `ref focus - a view with neither prop hands focus to its first focusable descendant`() {
    val view = reactView(top = 0)
    val descendant = control(top = 0)
    view.addView(descendant)
    attach(view)

    focusFromJS(view)

    assertThat(view.isFocused).isFalse()
    assertThat(descendant.isFocused).isTrue()
  }

  @Test
  fun `focusable turning false keeps focus on a focused view until focus moves on`() {
    val view = reactView(FOCUSABLE to true, top = 0)
    val trailing = control(top = 10)
    val root = attach(view, trailing)
    view.requestFocus()

    update(view, FOCUSABLE to false)

    assertThat(view.isFocused).isTrue()
    trailing.requestFocus()
    assertThat(nextFocus(root, trailing, View.FOCUS_BACKWARD)).isNull()
    assertThat(view.requestFocus()).isFalse()
  }

  @Test
  fun `focusable false - an accessible view stays one screen reader element`() {
    val excluded = excludedView(top = 0)
    val title = text("Title")
    excluded.addView(title)
    val root = attach(excluded)

    assertThat(excluded.createAccessibilityNodeInfo().isScreenReaderFocusable).isTrue()
    assertThat(excluded.isImportantForAccessibility).isTrue()
    assertThat(accessibilityChildren(root)).containsExactly(excluded)
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.O_MR1])
  fun `focusable false - below API 28 an accessible view reports itself screen reader focusable`() {
    val excluded = excludedView(top = 0)
    excluded.addView(text("Title"))
    val root = attach(excluded)

    val node = AccessibilityNodeInfoCompat.wrap(excluded.createAccessibilityNodeInfo())

    assertThat(node.isScreenReaderFocusable).isTrue()
    assertThat(excluded.isImportantForAccessibility).isTrue()
    assertThat(excluded.isFocusable).isFalse()
    assertThat(accessibilityChildren(root)).containsExactly(excluded)
  }

  @Test
  fun `focusable unset - an accessible view keeps the accessibility state it has on main`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    attach(view)

    assertThat(view.isFocusable).isTrue()
    assertThat(view.createAccessibilityNodeInfo().isScreenReaderFocusable).isFalse()
    assertThat(view.importantForAccessibility).isEqualTo(View.IMPORTANT_FOR_ACCESSIBILITY_AUTO)
    assertThat(view.isImportantForAccessibility).isTrue()
  }

  @Test
  fun `screenReaderFocusable - puts a view in the accessibility tree as one element`() {
    val view = reactView(ViewProps.SCREEN_READER_FOCUSABLE to true, top = 0)
    view.addView(text("Title"))
    val root = attach(view)

    assertThat(view.isFocusable).isFalse()
    assertThat(view.createAccessibilityNodeInfo().isScreenReaderFocusable).isTrue()
    assertThat(accessibilityChildren(root)).containsExactly(view)
  }

  @Test
  fun `importantForAccessibility no - keeps an excluded view out of the accessibility tree`() {
    val excluded =
        reactView(
            ACCESSIBLE to true,
            FOCUSABLE to false,
            ViewProps.IMPORTANT_FOR_ACCESSIBILITY to "no",
            top = 0,
        )
    attach(excluded)

    assertThat(excluded.isImportantForAccessibility).isFalse()
  }

  @Test
  fun `importantForAccessibility auto - leaves an excluded view in the accessibility tree as one element`() {
    val excluded = excludedView(top = 0)
    excluded.addView(text("Title"))
    val root = attach(excluded)

    update(excluded, ViewProps.IMPORTANT_FOR_ACCESSIBILITY to "auto")

    assertThat(excluded.isImportantForAccessibility).isTrue()
    assertThat(accessibilityChildren(root)).containsExactly(excluded)
  }

  @Test
  fun `importantForAccessibility outside its values - keeps the importance the other props give`() {
    val view = reactView(ViewProps.SCREEN_READER_FOCUSABLE to true, top = 0)
    attach(view)

    update(view, ViewProps.IMPORTANT_FOR_ACCESSIBILITY to "sometimes")
    update(view, ViewProps.SCREEN_READER_FOCUSABLE to false)

    assertThat(view.importantForAccessibility).isEqualTo(View.IMPORTANT_FOR_ACCESSIBILITY_AUTO)
  }

  @Test
  fun `a label keeps a view that is not accessible in the accessibility tree`() {
    val view = reactView(ACCESSIBLE to false, ViewProps.ACCESSIBILITY_LABEL to "Profile", top = 0)
    val excluded = reactView(FOCUSABLE to false, ViewProps.ACCESSIBILITY_LABEL to "Close", top = 10)
    attach(view, excluded)

    assertThat(view.isImportantForAccessibility).isTrue()
    assertThat(excluded.isImportantForAccessibility).isTrue()
  }

  @Test
  fun `accessibilityOrder - takes an excluded accessible view as one element`() {
    val excluded = excludedView(top = 0, ViewProps.NATIVE_ID to "excluded")
    excluded.addView(text("Title"))
    val container =
        reactView(ViewProps.ACCESSIBILITY_ORDER to JavaOnlyArray.of("excluded"), top = 0)
    container.addView(excluded)
    attach(container)

    assertThat(accessibilityChildren(container)).containsExactly(excluded)
  }

  @Test
  fun `accessibilityOrder - a container that reads its subtree keeps an excluded descendant from being read on its own`() {
    val excluded = excludedView(top = 0)
    excluded.addView(text("Delete"))
    val reader = readerUnderAccessibilityOrder(excluded)

    walkAccessibilityOrder(reader)

    val node = excluded.createAccessibilityNodeInfo()
    assertThat(node.isFocusable).isFalse()
    assertThat(node.isScreenReaderFocusable).isFalse()
  }

  @Test
  fun `accessibilityOrder - a view focused from JS leaves keyboard navigation once the order lets it go`() {
    val excluded = excludedView(top = 0)
    val reader = readerUnderAccessibilityOrder(excluded)
    focusFromJS(excluded)
    assertThat(excluded.isFocused).isTrue()
    walkAccessibilityOrder(reader)

    update(reader.parent as ReactViewGroup, ViewProps.ACCESSIBILITY_ORDER to null)

    assertThat(focusState(excluded)).isEqualTo(focusStateOfANewExcludedView())
  }

  @Test
  fun `accessibilityOrder - focus props applied while the order holds a view's focus take effect once it lets go`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    val reader = readerUnderAccessibilityOrder(view)
    walkAccessibilityOrder(reader)

    update(view, FOCUSABLE to false)

    assertThat(focusState(view).focusable).isFalse()
    assertThat(focusState(view).screenReaderFocusable).isFalse()
    update(reader.parent as ReactViewGroup, ViewProps.ACCESSIBILITY_ORDER to null)
    assertThat(focusState(view)).isEqualTo(focusStateOfANewExcludedView())
  }

  @Test
  fun `accessibilityOrder - takes the focus state a view has each time it holds the view's focus`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    val reader = readerUnderAccessibilityOrder(view)
    val container = reader.parent as ReactViewGroup
    walkAccessibilityOrder(reader)
    update(container, ViewProps.ACCESSIBILITY_ORDER to null)
    update(view, FOCUSABLE to false)
    update(container, ViewProps.ACCESSIBILITY_ORDER to JavaOnlyArray.of("reader"))
    walkAccessibilityOrder(reader)

    update(container, ViewProps.ACCESSIBILITY_ORDER to null)

    assertThat(focusState(view)).isEqualTo(focusStateOfANewExcludedView())
  }

  @Test
  fun `accessibilityOrder - walking it again gives back the focus a view had before the first walk`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    val reader = readerUnderAccessibilityOrder(view)
    walkAccessibilityOrder(reader)
    walkAccessibilityOrder(reader)

    update(reader.parent as ReactViewGroup, ViewProps.ACCESSIBILITY_ORDER to null)

    assertThat(focusState(view)).isEqualTo(focusStateOfANewView(ACCESSIBLE to true))
  }

  @Test
  fun `accessibilityOrder - lets go only of the views it still holds`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    val firstReader = readerUnderAccessibilityOrder(view)
    walkAccessibilityOrder(firstReader)
    firstReader.removeView(view)
    val secondReader = readerUnderAccessibilityOrder(view)
    walkAccessibilityOrder(secondReader)

    update(firstReader.parent as ReactViewGroup, ViewProps.ACCESSIBILITY_ORDER to null)

    assertThat(focusState(view).focusable).isFalse()
    update(secondReader.parent as ReactViewGroup, ViewProps.ACCESSIBILITY_ORDER to null)
    assertThat(focusState(view)).isEqualTo(focusStateOfANewView(ACCESSIBLE to true))
  }

  @Test
  fun `accessibilityOrder - gives back the focus it holds when its view is dropped`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    val reader = readerUnderAccessibilityOrder(view)
    walkAccessibilityOrder(reader)

    viewManager.onDropViewInstance(reader.parent as ReactViewGroup)

    assertThat(focusState(view)).isEqualTo(focusStateOfANewView(ACCESSIBLE to true))
    update(view, ACCESSIBLE to false)
    assertThat(focusState(view)).isEqualTo(focusStateOfANewView(ACCESSIBLE to false))
  }

  @Test
  fun `accessibilityOrder - holds no focus once its view is dropped without being recycled`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    val reader = readerUnderAccessibilityOrder(view)
    val container = reader.parent as ReactViewGroup
    walkAccessibilityOrder(reader)

    container.removeView(reader)
    object : ReactViewManager() {}.onDropViewInstance(container)
    attach(reader)
    accessibilityChildren(reader)

    assertThat(focusState(view)).isEqualTo(focusStateOfANewView(ACCESSIBLE to true))
  }

  @Test
  fun `accessibilityOrder - gives back the focus it holds on a view clipped out of the hierarchy`() {
    val view = reactView(ACCESSIBLE to true, top = 100)
    val reader = readerUnderAccessibilityOrder(clippingParentOf(view))
    walkAccessibilityOrder(reader)
    clipOut(view)

    update(reader.parent as ReactViewGroup, ViewProps.ACCESSIBILITY_ORDER to null)

    assertThat(focusState(view)).isEqualTo(focusStateOfANewView(ACCESSIBLE to true))
  }

  @Test
  fun `accessibilityOrder - gives back the focus it holds on a clipped view once accessibility services turn off`() {
    val view = reactView(ACCESSIBLE to true, top = 100)
    val reader = readerUnderAccessibilityOrder(clippingParentOf(view))
    walkAccessibilityOrder(reader)
    clipOut(view)

    shadowOf(themedReactContext.getSystemService(AccessibilityManager::class.java))
        .setEnabled(false)

    assertThat(focusState(view)).isEqualTo(focusStateOfANewView(ACCESSIBLE to true))
  }

  @Test
  fun `accessibilityOrder - keeps its holds only while it holds a view's focus`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    val reader = readerUnderAccessibilityOrder(view)
    val container = reader.parent as ReactViewGroup
    assertThat(container.accessibilityOrderHolds).isNull()

    walkAccessibilityOrder(reader)
    assertThat(container.accessibilityOrderHolds).isNotNull()

    update(container, ViewProps.ACCESSIBILITY_ORDER to null)
    assertThat(container.accessibilityOrderHolds).isNull()
  }

  @Test
  fun `accessibilityOrder - a view moved out of its subtree no longer follows it`() {
    val view = reactView(ACCESSIBLE to true, top = 0)
    val reader = readerUnderAccessibilityOrder(view)
    val container = reader.parent as ReactViewGroup
    accessibilityChildren(container)
    container.removeView(reader)
    attach(reader)

    accessibilityChildren(reader)

    assertThat(focusState(view)).isEqualTo(focusStateOfANewView(ACCESSIBLE to true))
  }

  @Test
  fun `a ReactViewGroup another manager drives keeps its own focusability once focus moves on`() {
    val view =
        ReactViewGroup(themedReactContext).apply {
          isFocusable = true
          layout(0, 0, 100, 10)
        }
    val trailing = control(top = 10)
    attach(view, trailing)
    view.requestFocus()

    trailing.requestFocus()

    assertThat(view.isFocusable).isTrue()
    assertThat(view.requestFocus()).isTrue()
  }

  @Test
  fun `the focus state is the same whichever prop applies first`() {
    for ((accessible, focusable) in listOf(true to false, false to true)) {
      val accessibleFirst = reactView(ACCESSIBLE to accessible, top = 0)
      update(accessibleFirst, FOCUSABLE to focusable)
      val focusableFirst = reactView(FOCUSABLE to focusable, top = 10)
      update(focusableFirst, ACCESSIBLE to accessible)
      attach(accessibleFirst, focusableFirst)

      assertThat(focusableFirst.isFocusable)
          .describedAs("accessible $accessible, focusable $focusable")
          .isEqualTo(focusable)
      assertThat(focusState(focusableFirst)).isEqualTo(focusState(accessibleFirst))
    }
  }

  @Test
  fun `applying the same props again changes nothing`() {
    val leading = control(top = 0)
    val excluded = excludedView(top = 10)
    attach(leading, excluded)
    val before = focusState(excluded)

    update(excluded, ACCESSIBLE to true, FOCUSABLE to false)

    assertThat(focusState(excluded)).isEqualTo(before)
    assertThat(excluded.isFocused).isFalse()
  }

  @Test
  fun `recycling returns a view to the focus state a new view has`() {
    val fresh = reactView(top = 0)
    val excluded = excludedView(top = 10, ViewProps.SCREEN_READER_FOCUSABLE to true)
    attach(fresh, excluded)
    focusFromJS(excluded)

    viewManager.onDropViewInstance(excluded)
    val recycled = reactView(top = 0)

    assertThat(recycled).isSameAs(excluded)
    assertThat(recycled.isFocused).isFalse()
    assertThat(focusState(recycled)).isEqualTo(focusState(fresh))
    update(recycled, ACCESSIBLE to false)
    update(fresh, ACCESSIBLE to false)
    assertThat(focusState(recycled)).isEqualTo(focusState(fresh))
  }

  @Test
  fun `views without focus props share one default focus props, also once recycled`() {
    val fresh = reactView(top = 0)
    val excluded = excludedView(top = 10)

    viewManager.onDropViewInstance(excluded)
    val recycled = reactView(top = 0)

    assertThat(recycled).isSameAs(excluded)
    assertThat(recycled.focusProps).isSameAs(fresh.focusProps)
  }

  private fun reactView(vararg props: Pair<String, Any?>, top: Int): ReactViewGroup =
      viewManager
          .createView(
              nextTag++,
              themedReactContext,
              diffMap(*props),
              null,
              JSResponderHandler(),
          )
          .apply { layout(0, top, 100, top + 10) }

  private fun excludedView(top: Int, vararg props: Pair<String, Any?>): ReactViewGroup =
      reactView(ACCESSIBLE to true, FOCUSABLE to false, *props, top = top)

  private fun update(view: ReactViewGroup, vararg props: Pair<String, Any?>) {
    viewManager.updateProperties(view, diffMap(*props))
  }

  private fun focusFromJS(view: ReactViewGroup) {
    viewManager.receiveCommand(view, "focus", JavaOnlyArray())
  }

  private fun diffMap(vararg props: Pair<String, Any?>): ReactStylesDiffMap =
      ReactStylesDiffMap(JavaOnlyMap.of(*props.flatMap { it.toList() }.toTypedArray()))

  private fun control(top: Int): View =
      View(themedReactContext).apply {
        isFocusable = true
        layout(0, top, 100, top + 10)
      }

  private fun text(content: String): TextView =
      TextView(themedReactContext).apply {
        text = content
        layout(0, 0, 100, 10)
      }

  private fun attach(vararg views: View): ReactViewGroup {
    val root = ReactViewGroup(themedReactContext)
    views.forEach(root::addView)
    val activityController = Robolectric.buildActivity(Activity::class.java).setup()
    activityControllers.add(activityController)
    activityController.get().setContentView(root)
    shadowOf(Looper.getMainLooper()).idle()
    return root
  }

  private fun focusStateOfANewExcludedView(): FocusState =
      focusStateOfANewView(ACCESSIBLE to true, FOCUSABLE to false)

  private fun focusStateOfANewView(vararg props: Pair<String, Any?>): FocusState {
    val view = reactView(*props, top = 10)
    attach(view)
    return focusState(view)
  }

  private fun clippingParentOf(view: View): ReactViewGroup =
      reactView(top = 0).apply { addView(view) }

  private fun clipOut(view: View) {
    update(
        view.parent as ReactViewGroup,
        ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS to true,
    )
    assertThat(view.parent).isNull()
  }

  private fun readerUnderAccessibilityOrder(vararg views: View): ReactViewGroup {
    val reader = reactView(ACCESSIBLE to true, ViewProps.NATIVE_ID to "reader", top = 0)
    views.forEach(reader::addView)
    val container = reactView(ViewProps.ACCESSIBILITY_ORDER to JavaOnlyArray.of("reader"), top = 0)
    container.addView(reader)
    attach(container)
    return reader
  }

  private fun walkAccessibilityOrder(reader: ReactViewGroup) {
    accessibilityChildren(reader.parent as ReactViewGroup)
    accessibilityChildren(reader)
  }

  private fun nextFocus(root: ViewGroup, focused: View, direction: Int): View? =
      FocusFinder.getInstance().findNextFocus(root, focused, direction)

  private fun accessibilityChildren(view: ViewGroup): List<View> {
    val children = ArrayList<View>()
    view.addChildrenForAccessibility(children)
    return children
  }

  private fun focusState(view: ReactViewGroup): FocusState {
    val node = AccessibilityNodeInfoCompat.wrap(view.createAccessibilityNodeInfo())
    return FocusState(
        focusable = view.isFocusable,
        screenReaderFocusable = node.isScreenReaderFocusable,
        importantForAccessibility = view.importantForAccessibility,
        clickable = view.isClickable,
    )
  }

  private companion object {
    const val ACCESSIBLE = "accessible"
    const val FOCUSABLE = "focusable"
  }

  private data class FocusState(
      val focusable: Boolean,
      val screenReaderFocusable: Boolean,
      val importantForAccessibility: Int,
      val clickable: Boolean,
  )
}
