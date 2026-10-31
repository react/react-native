/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.annotation.SuppressLint
import android.util.DisplayMetrics
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Verifies when a ScrollView sends its scroll offset to the Fabric state. */
@SuppressLint("DeprecatedClass", "DeprecatedMethod")
@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowNativeLoader::class,
            ShadowSoLoader::class,
            ShadowNativeMap::class,
            ShadowReadableNativeMap::class,
            ShadowWritableNativeMap::class,
        ],
)
class ReactScrollViewHelperStateTest {

  private lateinit var view: ReactScrollView

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context: ReactApplicationContext = createTestReactApplicationContext()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 1f })
    view =
        ReactScrollViewManager().createViewInstance(ThemedReactContext(context, context, null, -1))
  }

  @After
  fun teardown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  private fun stateWrapperWithOffset(x: Double, y: Double): StateWrapper {
    val stateData =
        mock<ReadableNativeMap> {
          on { getDouble("contentOffsetLeft") } doReturn x
          on { getDouble("contentOffsetTop") } doReturn y
        }
    return mock { on { this.stateData } doReturn stateData }
  }

  @Test
  fun testFirstUpdateMatchingTheStateIsNotSent() {
    val stateWrapper = stateWrapperWithOffset(0.0, 0.0)
    view.stateWrapper = stateWrapper

    ReactScrollViewHelper.updateFabricScrollState(view, 0, 0)

    verify(stateWrapper, never()).updateState(any())
  }

  @Test
  fun testFirstUpdateDifferingFromTheStateIsSent() {
    val stateWrapper = stateWrapperWithOffset(0.0, 500.0)
    view.stateWrapper = stateWrapper

    ReactScrollViewHelper.updateFabricScrollState(view, 0, 0)

    verify(stateWrapper, times(1)).updateState(any())
  }

  @Test
  fun testFirstUpdateIsSentWithoutStateData() {
    val stateWrapper = mock<StateWrapper> { on { stateData } doReturn null }
    view.stateWrapper = stateWrapper

    ReactScrollViewHelper.updateFabricScrollState(view, 0, 0)

    verify(stateWrapper, times(1)).updateState(any())
  }

  @Test
  fun testLaterUpdatesAreSentOncePerOffset() {
    val stateWrapper = stateWrapperWithOffset(0.0, 0.0)
    view.stateWrapper = stateWrapper

    ReactScrollViewHelper.updateFabricScrollState(view, 0, 0)
    ReactScrollViewHelper.updateFabricScrollState(view, 0, 100)
    ReactScrollViewHelper.updateFabricScrollState(view, 0, 100)

    verify(stateWrapper, times(1)).updateState(any())
    verify(stateWrapper, times(1)).stateData
  }
}
