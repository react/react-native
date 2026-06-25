/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // Suppressing as we want to test RCTEventEmitter here

package com.facebook.react

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Insets
import android.graphics.Rect
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class RootViewTest {

  private lateinit var reactContext: BridgeReactContext
  private lateinit var catalystInstanceMock: CatalystInstance

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()

    catalystInstanceMock = ReactTestHelper.createMockCatalystInstance()
    reactContext = spy(BridgeReactContext(RuntimeEnvironment.getApplication()))
    reactContext.initializeWithInstance(catalystInstanceMock)

    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext)
    val uiManagerModuleMock: UIManagerModule = mock()
    whenever(catalystInstanceMock.getNativeModule(UIManagerModule::class.java))
        .thenReturn(uiManagerModuleMock)
  }

  @Test
  fun testRemountApplication() {
    val instanceManager: ReactInstanceManager = mock()
    val rootView = ReactRootView(reactContext)
    rootView.startReactApplication(instanceManager, "")
    rootView.unmountReactApplication()
    rootView.startReactApplication(instanceManager, "")
  }

  @Test
  fun testCheckForKeyboardEvents() {
    val instanceManager: ReactInstanceManager = mock()
    val activity = Robolectric.buildActivity(Activity::class.java).create().get()
    whenever(instanceManager.currentReactContext).thenReturn(reactContext)
    val rootView: ReactRootView =
        object : ReactRootView(activity) {
          override fun getWindowVisibleDisplayFrame(outRect: Rect) {
            if (outRect.bottom == 0) {
              outRect.bottom += 100
              outRect.right += 370
            } else {
              outRect.bottom += 370
            }
          }

          override fun getRootWindowInsets() =
              WindowInsets.Builder()
                  .setInsets(WindowInsets.Type.ime(), Insets.of(0, 0, 0, 370))
                  .setVisible(WindowInsets.Type.ime(), true)
                  .build()
        }
    val rootViewSpy = spy(rootView)
    whenever(rootViewSpy.layoutParams).thenReturn(WindowManager.LayoutParams())

    rootViewSpy.startReactApplication(instanceManager, "")
    rootViewSpy.simulateCheckForKeyboardForTesting()

    val params = Arguments.createMap()
    val endCoordinates = Arguments.createMap()
    val screenHeight = 470.0
    val keyboardHeight = 100.0
    params.putDouble("duration", 0.0)
    endCoordinates.putDouble("width", screenHeight - keyboardHeight)
    endCoordinates.putDouble("screenX", 0.0)
    endCoordinates.putDouble("height", screenHeight - keyboardHeight)
    endCoordinates.putDouble("screenY", keyboardHeight)
    params.putMap("endCoordinates", endCoordinates)
    params.putString("easing", "keyboard")
    verify(reactContext, times(1)).emitDeviceEvent("keyboardDidShow", params)
  }

  // Regression test for the keyboard re-emit behavior. Without the
  // height-change re-emit in `checkForKeyboardEvents`, JS consumers that
  // cache `endCoordinates` (KeyboardAvoidingView, ScrollView, Keyboard.metrics)
  // observe stale geometry when the IME height changes (e.g., emoji panel
  // toggle) without a visibility transition.
  @SuppressLint("NewApi", "DeprecatedClass")
  @Test
  fun testCheckForKeyboardEventsReEmitsOnHeightChange() {
    val instanceManager: ReactInstanceManager = mock()
    val activity = Robolectric.buildActivity(Activity::class.java).create().get()
    whenever(instanceManager.currentReactContext).thenReturn(reactContext)

    val imeBottom = intArrayOf(370)
    val imeVisible = booleanArrayOf(true)

    val rootView: ReactRootView =
        object : ReactRootView(activity) {
          override fun getWindowVisibleDisplayFrame(outRect: Rect) {
            outRect.set(0, 0, 370, 100)
          }

          override fun getRootWindowInsets(): WindowInsets =
              WindowInsets.Builder()
                  .setInsets(WindowInsets.Type.ime(), Insets.of(0, 0, 0, imeBottom[0]))
                  .setVisible(WindowInsets.Type.ime(), imeVisible[0])
                  .build()

          override fun getLayoutParams(): ViewGroup.LayoutParams = WindowManager.LayoutParams()
        }

    rootView.startReactApplication(instanceManager, "")

    // 1) Initial show — keyboardDidShow fires once with height=370.
    rootView.simulateCheckForKeyboardForTesting()
    verify(reactContext, times(1)).emitDeviceEvent("keyboardDidShow", showParams(370.0))

    // 2) Idempotent layout pass with same height — must NOT re-emit.
    rootView.simulateCheckForKeyboardForTesting()
    verify(reactContext, times(1)).emitDeviceEvent("keyboardDidShow", showParams(370.0))

    // 3) IME height grows (e.g., emoji panel) — must re-emit with new height.
    //    This is the case the regression silently dropped.
    imeBottom[0] = 420
    rootView.simulateCheckForKeyboardForTesting()
    verify(reactContext, times(1)).emitDeviceEvent("keyboardDidShow", showParams(420.0))

    // 4) Hide — keyboardDidHide fires once.
    imeVisible[0] = false
    rootView.simulateCheckForKeyboardForTesting()
    verify(reactContext, times(1)).emitDeviceEvent("keyboardDidHide", hideParams())

    // 5) Idempotent layout pass with keyboard still hidden — must NOT re-emit.
    rootView.simulateCheckForKeyboardForTesting()
    verify(reactContext, times(1)).emitDeviceEvent("keyboardDidHide", hideParams())
  }

  private fun showParams(keyboardHeight: Double): com.facebook.react.bridge.WritableMap {
    val params = Arguments.createMap()
    val endCoordinates = Arguments.createMap()
    params.putDouble("duration", 0.0)
    endCoordinates.putDouble("width", 370.0)
    endCoordinates.putDouble("screenX", 0.0)
    endCoordinates.putDouble("height", keyboardHeight)
    endCoordinates.putDouble("screenY", 100.0)
    params.putMap("endCoordinates", endCoordinates)
    params.putString("easing", "keyboard")
    return params
  }

  private fun hideParams(): com.facebook.react.bridge.WritableMap {
    val params = Arguments.createMap()
    val endCoordinates = Arguments.createMap()
    params.putDouble("duration", 0.0)
    endCoordinates.putDouble("width", 370.0)
    endCoordinates.putDouble("screenX", 0.0)
    endCoordinates.putDouble("height", 0.0)
    endCoordinates.putDouble("screenY", 100.0)
    params.putMap("endCoordinates", endCoordinates)
    params.putString("easing", "keyboard")
    return params
  }
}
