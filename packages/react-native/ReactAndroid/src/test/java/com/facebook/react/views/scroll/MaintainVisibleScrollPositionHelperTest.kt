/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")

package com.facebook.react.views.scroll

import android.app.Activity
import android.content.Context
import android.view.View
import android.view.View.MeasureSpec
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherProvider
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
class MaintainVisibleScrollPositionHelperTest {
  private lateinit var activity: Activity
  private val uiManager: UIManager = mock()

  private lateinit var scrollView: ReactScrollView
  private lateinit var content: ReactViewGroup
  private lateinit var header: View
  private lateinit var anchor: View
  private lateinit var footer: View

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    // ReactScrollView dispatches scroll events through its ReactContext.
    val reactContext =
        TestReactContext(activity, uiManager).apply {
          initializeWithInstance(ReactTestHelper.createMockCatalystInstance())
        }

    scrollView = ReactScrollView(reactContext)
    content = ReactViewGroup(activity)
    header = View(activity)
    anchor = View(activity)
    footer = View(activity)
    content.addView(header)
    content.addView(anchor)
    content.addView(footer)
    scrollView.addView(content)
    activity.setContentView(scrollView)

    scrollView.measure(exactly(VIEWPORT), exactly(VIEWPORT))
    scrollView.layout(0, 0, VIEWPORT, VIEWPORT)
  }

  @Test
  fun shrinkingContentAboveAnchorKeepsAnchorInPlace() {
    layoutRows(headerHeight = 700, footerHeight = 200)
    scrollView.scrollTo(0, 750)
    val helper = createHelper()

    helper.willMountItems(uiManager)
    // Laying out the smaller content clamps scrollY in ReactScrollView.onLayoutChange.
    layoutRows(headerHeight = 100, footerHeight = 100)
    helper.didMountItems(uiManager)

    assertThat(scrollView.scrollY).isEqualTo(150)
  }

  @Test
  fun shrinkingContentBelowAnchorStaysWithinScrollRange() {
    layoutRows(headerHeight = 700, footerHeight = 200)
    scrollView.scrollTo(0, 750)
    val helper = createHelper()

    helper.willMountItems(uiManager)
    layoutRows(headerHeight = 700, footerHeight = 0)
    helper.didMountItems(uiManager)

    assertThat(scrollView.scrollY).isEqualTo(700)
  }

  @Test
  fun scrollToTopDispatchedWithShrinkIsNotOverwritten() {
    layoutRows(headerHeight = 700, footerHeight = 200)
    scrollView.scrollTo(0, 750)
    val helper = createHelper()

    helper.willMountItems(uiManager)
    // Fabric runs queued view commands after willMountItems and before layout mount items.
    scrollView.scrollTo(0, 0)
    layoutRows(headerHeight = 100, footerHeight = 100)
    helper.didMountItems(uiManager)

    assertThat(scrollView.scrollY).isEqualTo(0)
  }

  @Test
  fun growingContentAboveAnchorKeepsAnchorInPlace() {
    layoutRows(headerHeight = 700, footerHeight = 200)
    scrollView.scrollTo(0, 750)
    val helper = createHelper()

    helper.willMountItems(uiManager)
    layoutRows(headerHeight = 900, footerHeight = 200)
    helper.didMountItems(uiManager)

    assertThat(scrollView.scrollY).isEqualTo(950)
  }

  /** Enables MVCP on the scroll view and returns the helper it registered with the UIManager. */
  private fun createHelper(): MaintainVisibleScrollPositionHelper<*> {
    scrollView.setMaintainVisibleContentPosition(
        MaintainVisibleScrollPositionHelper.Config(0, null),
    )
    val listener = argumentCaptor<UIManagerListener>()
    verify(uiManager).addUIManagerEventListener(listener.capture())
    return listener.firstValue as MaintainVisibleScrollPositionHelper<*>
  }

  /** Lays out header, a 100px anchor and footer, as the Fabric updateLayout mount items would. */
  private fun layoutRows(headerHeight: Int, footerHeight: Int) {
    val anchorTop = headerHeight
    val footerTop = anchorTop + ROW_HEIGHT
    val contentHeight = footerTop + footerHeight
    header.layout(0, 0, VIEWPORT, headerHeight)
    anchor.layout(0, anchorTop, VIEWPORT, footerTop)
    footer.layout(0, footerTop, VIEWPORT, contentHeight)
    content.measure(exactly(VIEWPORT), exactly(contentHeight))
    content.layout(0, 0, VIEWPORT, contentHeight)
  }

  private fun exactly(size: Int) = MeasureSpec.makeMeasureSpec(size, MeasureSpec.EXACTLY)

  private class TestReactContext(base: Context, private val uiManager: UIManager) :
      BridgeReactContext(base), EventDispatcherProvider {
    override fun getEventDispatcher(): EventDispatcher = BlackHoleEventDispatcher

    override fun hasActiveReactInstance(): Boolean = true

    override fun getFabricUIManager(): UIManager = uiManager
  }

  private companion object {
    const val VIEWPORT = 100
    const val ROW_HEIGHT = 100
  }
}
