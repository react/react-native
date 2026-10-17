/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The deprecated APIs exercised here remain public and required by this Robolectric setup.
@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.app.Activity
import android.util.DisplayMetrics
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.drawer.ReactDrawerLayout
import com.facebook.react.views.drawer.ReactDrawerLayoutManager
import com.facebook.react.views.scroll.ReactHorizontalScrollView
import com.facebook.react.views.scroll.ReactHorizontalScrollViewManager
import com.facebook.react.views.scroll.ReactNestedScrollView
import com.facebook.react.views.scroll.ReactNestedScrollViewManager
import com.facebook.react.views.scroll.ReactScrollView
import com.facebook.react.views.scroll.ReactScrollViewManager
import com.facebook.react.views.swiperefresh.ReactSwipeRefreshLayout
import com.facebook.react.views.swiperefresh.SwipeRefreshLayoutManager
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Every container React Native renders holds the content it hides out of keyboard navigation. */
@RunWith(RobolectricTestRunner::class)
class HiddenSubtreeKeyboardFocusTest {

  private lateinit var themedContext: ThemedReactContext

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    context.initializeWithInstance(createMockCatalystInstance())
    themedContext = ThemedReactContext(context, context, null, -1)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `hidden content leaves keyboard focus search`() {
    for (container in CONTAINERS) {
      val scene = buildScene(container)

      container.applyImportance(scene.container, "no-hide-descendants")

      assertThat(collectFocusables(scene.root))
          .describedAs(container.name)
          .containsExactly(scene.shown)
    }
  }

  @Test
  fun `hidden content returns to keyboard focus search once shown again`() {
    for (container in CONTAINERS) {
      val scene = buildScene(container)
      container.applyImportance(scene.container, "no-hide-descendants")

      container.applyImportance(scene.container, null)

      assertThat(collectFocusables(scene.root))
          .describedAs(container.name)
          .containsExactly(scene.hidden, scene.shown)
    }
  }

  @Test
  fun `hidden content takes no default focus`() {
    for (container in CONTAINERS) {
      val scene = buildScene(container)
      attachToWindow(scene.root)
      container.applyImportance(scene.container, "no-hide-descendants")

      scene.root.requestFocus(View.FOCUS_DOWN)

      assertThat(scene.hidden.isFocused).describedAs(container.name).isFalse()
    }
  }

  @Test
  fun `keyboard focus on hidden content moves off as the container hides it`() {
    for (container in CONTAINERS) {
      val scene = buildScene(container)
      attachToWindow(scene.root)
      assertThat(scene.hidden.requestFocus()).describedAs(container.name).isTrue()

      container.applyImportance(scene.container, "no-hide-descendants")

      assertThat(scene.hidden.isFocused).describedAs(container.name).isFalse()
    }
  }

  private fun buildScene(container: Container): Scene {
    val root = ReactViewGroup(themedContext)
    val hiding = container.create(themedContext)
    val content = ReactViewGroup(themedContext).apply { layout(0, 0, 100, 10) }
    val hidden = focusableView(top = 0)
    val shown = focusableView(top = 20)
    content.addView(hidden)
    hiding.addView(content)
    hiding.layout(0, 0, 100, 10)
    root.addView(hiding)
    root.addView(shown)
    return Scene(root, hiding, hidden, shown)
  }

  private fun focusableView(top: Int): View =
      View(themedContext).apply {
        isFocusable = true
        layout(0, top, 100, top + 10)
      }

  private fun collectFocusables(root: ViewGroup): List<View> {
    val focusables = ArrayList<View>()
    root.addFocusables(focusables, View.FOCUS_FORWARD, View.FOCUSABLES_ALL)
    return focusables.filter { it !is ViewGroup }
  }

  private fun attachToWindow(root: View) {
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
  }

  private class Scene(
      val root: ReactViewGroup,
      val container: ViewGroup,
      val hidden: View,
      val shown: View,
  )

  private class Container(
      val name: String,
      val create: (ThemedReactContext) -> ViewGroup,
      val applyImportance: (ViewGroup, String?) -> Unit,
  )

  private companion object {
    val CONTAINERS: List<Container> =
        listOf(
            Container("vertical scroll view", ::ReactScrollView) { view, mode ->
              ReactScrollViewManager().setImportantForAccessibility(view as ReactScrollView, mode)
            },
            Container("horizontal scroll view", ::ReactHorizontalScrollView) { view, mode ->
              ReactHorizontalScrollViewManager()
                  .setImportantForAccessibility(view as ReactHorizontalScrollView, mode)
            },
            Container("nested scroll view", ::ReactNestedScrollView) { view, mode ->
              ReactNestedScrollViewManager()
                  .setImportantForAccessibility(view as ReactNestedScrollView, mode)
            },
            Container("drawer layout", ::ReactDrawerLayout) { view, mode ->
              ReactDrawerLayoutManager()
                  .setImportantForAccessibility(view as ReactDrawerLayout, mode)
            },
            Container("swipe refresh layout", ::ReactSwipeRefreshLayout) { view, mode ->
              SwipeRefreshLayoutManager()
                  .setImportantForAccessibility(view as ReactSwipeRefreshLayout, mode)
            },
        )
  }
}
