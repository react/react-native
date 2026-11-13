/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.scroll

import android.annotation.SuppressLint
import android.util.DisplayMetrics
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.testutils.shadows.ShadowSoLoader
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Verifies that dropped ScrollViews stop their maintainVisibleContentPosition helper. */
@SuppressLint("DeprecatedClass", "DeprecatedMethod")
@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactScrollViewMaintainVisibleContentPositionTest {

  private lateinit var themedContext: ThemedReactContext
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>
  private val uiManager: UIManager = mock()

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = createTestReactApplicationContext()
    themedContext = ThemedReactContext(context, context, null, -1)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<UIManager?> { UIManagerHelper.getUIManager(any(), eq(UIManagerType.FABRIC)) }
        .thenReturn(uiManager)
  }

  @After
  fun teardown() {
    uiManagerHelperMock.close()
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun testVerticalDropStopsListening() {
    val manager = ReactScrollViewManager()
    val view = manager.createViewInstance(themedContext)

    manager.setMaintainVisibleContentPosition(view, buildConfig())

    assertListenerRemovedOnDrop { manager.onDropViewInstance(view) }
  }

  @Test
  fun testHorizontalDropStopsListening() {
    val manager = ReactHorizontalScrollViewManager()
    val view = manager.createViewInstance(themedContext)

    manager.setMaintainVisibleContentPosition(view, buildConfig())

    assertListenerRemovedOnDrop { manager.onDropViewInstance(view) }
  }

  @Test
  fun testNestedDropStopsListening() {
    val manager = ReactNestedScrollViewManager()
    val view = ReactNestedScrollView(themedContext)

    manager.setMaintainVisibleContentPosition(view, buildConfig())

    assertListenerRemovedOnDrop { manager.onDropViewInstance(view) }
  }

  private fun assertListenerRemovedOnDrop(drop: () -> Unit) {
    val listener = argumentCaptor<UIManagerListener>()
    verify(uiManager).addUIManagerEventListener(listener.capture())

    drop()

    verify(uiManager).removeUIManagerEventListener(listener.firstValue)
  }

  private fun buildConfig(): JavaOnlyMap = JavaOnlyMap.of("minIndexForVisible", 0)
}
