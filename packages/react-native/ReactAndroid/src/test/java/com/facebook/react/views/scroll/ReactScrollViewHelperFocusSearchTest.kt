/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The deprecated APIs exercised here remain public and required by this Robolectric setup.
@file:Suppress("DEPRECATION")

package com.facebook.react.views.scroll

import android.util.DisplayMetrics
import android.view.View
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.bridge.UIManager
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * The shadow-tree search a scroll view falls back to, when the next focus lies outside it, passes
 * over a candidate the view tree keeps out of keyboard navigation.
 */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class ReactScrollViewHelperFocusSearchTest {

  private lateinit var themedContext: ThemedReactContext
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>
  private val fabricUIManager: FabricUIManager = mock()

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    context.initializeWithInstance(createMockCatalystInstance())
    themedContext = ThemedReactContext(context, context, null, -1)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<UIManager?> {
          UIManagerHelper.getUIManager(any<ReactContext>(), eq(UIManagerType.FABRIC))
        }
        .thenReturn(fabricUIManager)
  }

  @After
  fun tearDown() {
    uiManagerHelperMock.close()
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `passes over a candidate that focusable false keeps out of keyboard navigation`() {
    val scene = buildScene()
    ReactViewManager().setFocusable(scene.candidate, false)
    offerInOrder(scene, scene.first, scene.candidate, scene.last)

    assertThat(findNextFocusableView(scene)).isSameAs(scene.last)
  }

  @Test
  fun `finds nothing when no later candidate takes keyboard focus`() {
    val scene = buildScene()
    ReactViewManager().setFocusable(scene.candidate, false)
    offerInOrder(scene, scene.first, scene.candidate)

    assertThat(findNextFocusableView(scene)).isNull()
  }

  @Test
  fun `ends when the candidates lead back to where the search started`() {
    val scene = buildScene()
    ReactViewManager().setFocusable(scene.candidate, false)
    offerInOrder(scene, scene.first, scene.candidate, scene.first)

    assertThat(findNextFocusableView(scene)).isNull()
  }

  @Test
  fun `takes a candidate whose descendant takes keyboard focus`() {
    val scene = buildScene()
    ReactViewManager().setFocusable(scene.candidate, false)
    scene.candidate.addView(focusableView(id = 4))
    offerInOrder(scene, scene.first, scene.candidate, scene.last)

    assertThat(findNextFocusableView(scene)).isSameAs(scene.candidate)
  }

  @Test
  fun `takes a candidate that takes keyboard focus itself`() {
    val scene = buildScene()
    offerInOrder(scene, scene.first, scene.candidate, scene.last)

    assertThat(findNextFocusableView(scene)).isSameAs(scene.candidate)
  }

  private fun buildScene(): Scene {
    val scrollView = ReactScrollView(themedContext).apply { id = 20 }
    val content = ReactViewGroup(themedContext).apply { id = 10 }
    val first = focusableView(id = 1)
    val candidate =
        ReactViewGroup(themedContext).apply {
          id = 2
          ReactViewManager().setAccessible(this, true)
        }
    val last = focusableView(id = 3)
    content.addView(first)
    content.addView(candidate)
    content.addView(last)
    scrollView.addView(content)
    whenever(fabricUIManager.getRelativeAncestorList(eq(content.id), any()))
        .thenReturn(intArrayOf(content.id))
    return Scene(scrollView, first, candidate, last)
  }

  private fun focusableView(id: Int): View =
      View(themedContext).apply {
        this.id = id
        isFocusable = true
      }

  private fun offerInOrder(scene: Scene, vararg order: View) {
    order.toList().zipWithNext().forEach { (source, next) ->
      whenever(
              fabricUIManager.findNextFocusableElement(
                  eq(scene.scrollView.id),
                  eq(source.id),
                  eq(View.FOCUS_FORWARD),
              )
          )
          .thenReturn(next.id)
    }
  }

  private fun findNextFocusableView(scene: Scene): View? =
      ReactScrollViewHelper.findNextFocusableView(scene.scrollView, scene.first, View.FOCUS_FORWARD)

  private class Scene(
      val scrollView: ReactScrollView,
      val first: View,
      val candidate: ReactViewGroup,
      val last: View,
  )
}
