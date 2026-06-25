/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.modules.deviceinfo

import android.app.Activity
import android.graphics.Rect
import android.util.DisplayMetrics
import android.view.View
import android.view.Window
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.window.layout.WindowMetrics
import androidx.window.layout.WindowMetricsCalculator
import androidx.window.layout.WindowMetricsCalculatorDecorator
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import junit.framework.TestCase
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowNativeMap::class,
            ShadowWritableNativeMap::class,
            ShadowReadableNativeMap::class,
        ]
)
class DeviceInfoModuleTest : TestCase() {

  private lateinit var deviceInfoModule: DeviceInfoModule
  private lateinit var fakePortraitDisplayMetrics: WritableMap
  private lateinit var fakeLandscapeDisplayMetrics: WritableMap
  private lateinit var reactContext: BridgeReactContext
  private lateinit var displayMetricsHolder: MockedStatic<DisplayMetricsHolder>

  @Before
  public override fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    fakePortraitDisplayMetrics = JavaOnlyMap()
    fakePortraitDisplayMetrics.putInt("width", 100)
    fakePortraitDisplayMetrics.putInt("height", 200)
    fakeLandscapeDisplayMetrics = JavaOnlyMap()
    fakeLandscapeDisplayMetrics.putInt("width", 200)
    fakeLandscapeDisplayMetrics.putInt("height", 100)

    displayMetricsHolder = mockStatic(DisplayMetricsHolder::class.java)
    reactContext = spy(BridgeReactContext(RuntimeEnvironment.getApplication()))
    val catalystInstanceMock = ReactTestHelper.createMockCatalystInstance()
    reactContext.initializeWithInstance(catalystInstanceMock)
    deviceInfoModule = spy(DeviceInfoModule(reactContext))
  }

  @After
  fun teardown() {
    displayMetricsHolder.close()
    isEdgeToEdgeFeatureFlagOn = false
  }

  @Test
  fun test_itDoesNotEmitAnEvent_whenDisplayMetricsNotChanged() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.typedExportedConstants
    deviceInfoModule.emitUpdateDimensionsEvent()
    verify(reactContext, times(0))
        ?.emitDeviceEvent(ArgumentMatchers.anyString(), ArgumentMatchers.any())
  }

  @Test
  fun test_itEmitsOneEvent_whenDisplayMetricsChangedOnce() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.typedExportedConstants
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    verifyUpdateDimensionsEventsEmitted(reactContext, fakeLandscapeDisplayMetrics)
  }

  @Test
  fun test_itEmitsJustOneEvent_whenUpdateRequestedMultipleTimes() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.typedExportedConstants
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    deviceInfoModule.emitUpdateDimensionsEvent()
    verifyUpdateDimensionsEventsEmitted(reactContext, fakeLandscapeDisplayMetrics)
  }

  @Test
  fun test_itEmitsMultipleEvents_whenDisplayMetricsChangedBetweenUpdates() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.typedExportedConstants
    deviceInfoModule.emitUpdateDimensionsEvent()
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    verifyUpdateDimensionsEventsEmitted(
        reactContext,
        fakeLandscapeDisplayMetrics,
        fakePortraitDisplayMetrics,
        fakeLandscapeDisplayMetrics,
    )
  }

  @Test
  fun getDisplayMetricsWritableMap_returnsCorrectMap() {
    displayMetricsHolder
        .`when`<DisplayMetrics> { DisplayMetricsHolder.getScreenDisplayMetrics() }
        .thenAnswer { reactContext.resources.displayMetrics }

    // Use the official initialization method to ensure both metrics are set
    val map: WritableMap = deviceInfoModule.getDisplayMetricsWritableMap()
    assertThat(map.hasKey("windowPhysicalPixels")).isTrue()
    assertThat(map.hasKey("screenPhysicalPixels")).isTrue()
    val windowMap = map.getMap("windowPhysicalPixels")
    val screenMap = map.getMap("screenPhysicalPixels")
    checkNotNull(windowMap)
    checkNotNull(screenMap)
    assertThat(windowMap.hasKey("width")).isTrue()
    assertThat(windowMap.hasKey("height")).isTrue()
    assertThat(windowMap.hasKey("scale")).isTrue()
    assertThat(windowMap.hasKey("fontScale")).isTrue()
    assertThat(windowMap.hasKey("densityDpi")).isTrue()
  }

  @Test
  fun getWindowDisplayMetrics_usesBoundsWhenEdgeToEdgeOn() {
    isEdgeToEdgeFeatureFlagOn = true

    val activity = mock<Activity>()
    doReturn(activity).whenever(reactContext).currentActivity

    val bounds = Rect(0, 0, 1080, 2400)
    val calculator = mockCalculator(activity, bounds)

    withWindowMetricsCalculator(calculator) {
      val metrics = deviceInfoModule.getWindowDisplayMetrics()
      assertThat(metrics.widthPixels).isEqualTo(bounds.width())
      assertThat(metrics.heightPixels).isEqualTo(bounds.height())
    }
  }

  @Test
  fun getWindowDisplayMetrics_subtractsSystemBarsWhenEdgeToEdgeOff() {
    isEdgeToEdgeFeatureFlagOn = false

    val window = mock<Window>()
    val decorView = mock<View>()
    whenever(window.decorView).thenReturn(decorView)
    val activity = mock<Activity>()
    whenever(activity.window).thenReturn(window)
    doReturn(activity).whenever(reactContext).currentActivity

    val bounds = Rect(0, 0, 1080, 2400)
    val calculator = mockCalculator(activity, bounds)
    val rootInsets = mockRootInsets(Insets.of(20, 80, 30, 100))

    withWindowMetricsCalculator(calculator) {
      mockStatic(ViewCompat::class.java).use { viewCompatStatic ->
        viewCompatStatic
            .`when`<WindowInsetsCompat?> { ViewCompat.getRootWindowInsets(decorView) }
            .thenReturn(rootInsets)

        val metrics = deviceInfoModule.getWindowDisplayMetrics()
        assertThat(metrics.widthPixels).isEqualTo(bounds.width() - (20 + 30))
        assertThat(metrics.heightPixels).isEqualTo(bounds.height() - (80 + 100))
      }
    }
  }

  private fun givenDisplayMetricsHolderContains(fakeDisplayMetrics: WritableMap?) {
    doReturn(fakeDisplayMetrics).whenever(deviceInfoModule).getDisplayMetricsWritableMap()
  }

  private fun mockCalculator(activity: Activity, bounds: Rect): WindowMetricsCalculator {
    val windowMetrics = mock<WindowMetrics>()
    whenever(windowMetrics.bounds).thenReturn(bounds)
    val calculator = mock<WindowMetricsCalculator>()
    whenever(calculator.computeCurrentWindowMetrics(activity)).thenReturn(windowMetrics)
    return calculator
  }

  private fun mockRootInsets(insets: Insets): WindowInsetsCompat {
    val rootInsets = mock<WindowInsetsCompat>()
    val type = WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
    whenever(rootInsets.getInsets(type)).thenReturn(insets)
    return rootInsets
  }

  @Suppress("RestrictedApi")
  private fun withWindowMetricsCalculator(
      target: WindowMetricsCalculator,
      block: () -> Unit,
  ) {
    WindowMetricsCalculator.overrideDecorator(
        object : WindowMetricsCalculatorDecorator {
          override fun decorate(calculator: WindowMetricsCalculator): WindowMetricsCalculator =
              target
        }
    )
    try {
      block()
    } finally {
      WindowMetricsCalculator.reset()
    }
  }

  companion object {
    private fun verifyUpdateDimensionsEventsEmitted(
        context: ReactContext?,
        vararg expectedEvents: WritableMap,
    ) {
      val expectedEventList = listOf(*expectedEvents)
      val captor = ArgumentCaptor.forClass(WritableMap::class.java)
      verify(context, times(expectedEventList.size))
          ?.emitDeviceEvent(ArgumentMatchers.eq("didUpdateDimensions"), captor.capture())
      val actualEvents = captor.allValues
      assertThat(actualEvents).isEqualTo(expectedEventList)
    }
  }
}
