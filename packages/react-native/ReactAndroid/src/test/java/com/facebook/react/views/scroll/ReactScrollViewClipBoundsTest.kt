/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.graphics.Rect
import android.os.Build
import android.util.DisplayMetrics
import android.view.View
import android.view.ViewGroup
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Verifies that scroll views report their padding box from [View.getClipBounds]. */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
@RequiresApi(Build.VERSION_CODES.M)
class ReactScrollViewClipBoundsTest {

  private lateinit var context: ThemedReactContext
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val reactContext = createTestReactApplicationContext()
    context = ThemedReactContext(reactContext, reactContext, null, -1)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 1f })
    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<EventDispatcher?> { UIManagerHelper.getEventDispatcher(any()) }
        .thenReturn(mock())
  }

  @After
  fun tearDown() {
    uiManagerHelperMock.close()
    ReactNativeFeatureFlags.dangerouslyReset()
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  private fun enableClipBoundsSync(enabled: Boolean) {
    ReactNativeFeatureFlags.dangerouslyReset()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun syncAndroidClipBoundsWithOverflow(): Boolean = enabled
        },
    )
  }

  private fun scrollViews(): List<Pair<ViewGroup, (String?) -> Unit>> {
    val vertical = ReactScrollView(context)
    val horizontal = ReactHorizontalScrollView(context)
    val nested = ReactNestedScrollView(context)
    return listOf(
        vertical to vertical::setOverflow,
        horizontal to horizontal::setOverflow,
        nested to nested::setOverflow,
    )
  }

  private fun layoutScrolled(view: ViewGroup) {
    val content = View(context)
    view.addView(content)
    content.layout(0, 0, 1000, 1000)
    view.layout(0, 0, 100, 50)
    view.scrollTo(30, 40)
  }

  @Test
  fun returnsUnscrolledPaddingBoxWhenOverflowHidden() {
    enableClipBoundsSync(true)
    scrollViews().forEach { (view, setOverflow) ->
      setOverflow("hidden")
      layoutScrolled(view)
      assertThat(view.scrollX + view.scrollY).isGreaterThan(0)

      assertThat(view.clipBounds).isEqualTo(Rect(0, 0, 100, 50))
      val outRect = Rect()
      assertThat(view.getClipBounds(outRect)).isTrue()
      assertThat(outRect).isEqualTo(Rect(0, 0, 100, 50))
    }
  }

  @Test
  fun excludesBordersFromPaddingBox() {
    enableClipBoundsSync(true)
    scrollViews().forEach { (view, setOverflow) ->
      setOverflow("scroll")
      BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.ALL, 5f)
      layoutScrolled(view)

      assertThat(view.clipBounds).isEqualTo(Rect(5, 5, 95, 45))
    }
  }

  @Test
  fun fallsBackToSuperWhenOverflowVisible() {
    enableClipBoundsSync(true)
    scrollViews().forEach { (view, setOverflow) ->
      setOverflow("visible")
      layoutScrolled(view)

      assertThat(view.clipBounds).isNull()
      assertThat(view.getClipBounds(Rect())).isFalse()
    }
  }

  @Test
  fun fallsBackToSuperWhenFlagDisabled() {
    enableClipBoundsSync(false)
    scrollViews().forEach { (view, setOverflow) ->
      setOverflow("hidden")
      layoutScrolled(view)

      assertThat(view.clipBounds).isNull()
      assertThat(view.getClipBounds(Rect())).isFalse()
    }
  }
}
