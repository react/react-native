/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The deprecated APIs exercised here remain public and required by this Robolectric setup.
@file:Suppress("DEPRECATION")

package com.facebook.react.views.scroll

import android.view.View
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.soloader.SoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verifies the shadow-tree focus search on a scroll view whose content view is gone. */
@RunWith(RobolectricTestRunner::class)
class ReactScrollViewHelperFocusSearchTest {

  private lateinit var themedContext: ThemedReactContext
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    SoLoader.setInTestMode()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    context.initializeWithInstance(createMockCatalystInstance())
    themedContext = ThemedReactContext(context, context, null, -1)

    val fabricUIManager: FabricUIManager = mock()
    whenever(fabricUIManager.findNextFocusableElement(any(), any(), any())).thenReturn(NEXT_TAG)

    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<EventDispatcher?> { UIManagerHelper.getEventDispatcher(anyOrNull()) }
        .thenReturn(mock())
    uiManagerHelperMock
        .`when`<FabricUIManager?> { UIManagerHelper.getUIManager(any(), eq(UIManagerType.FABRIC)) }
        .thenReturn(fabricUIManager)
  }

  @After
  fun teardown() {
    uiManagerHelperMock.close()
  }

  @Test
  fun testScrollViewWithoutContentViewHasNoNextFocusableView() {
    val scrollView = ReactScrollView(themedContext)
    val focused = View(themedContext)

    assertThat(ReactScrollViewHelper.findNextFocusableView(scrollView, focused, View.FOCUS_DOWN))
        .isNull()
  }

  @Test
  fun testHorizontalScrollViewWithoutContentViewHasNoNextFocusableView() {
    val scrollView = ReactHorizontalScrollView(themedContext)
    val focused = View(themedContext)

    assertThat(ReactScrollViewHelper.findNextFocusableView(scrollView, focused, View.FOCUS_RIGHT))
        .isNull()
  }

  private companion object {
    const val NEXT_TAG = 42
  }
}
