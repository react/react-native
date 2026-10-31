/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.modules.accessibilityinfo

import android.app.UiModeManager
import android.content.Context
import android.content.ContextWrapper
import android.os.Build
import android.os.Looper
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import java.util.concurrent.Executor
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

@RunWith(RobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
@Config(sdk = [34], shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class AccessibilityInfoModuleTest {

  private lateinit var uiModeManager: UiModeManager
  private lateinit var reactContext: BridgeReactContext
  private lateinit var module: AccessibilityInfoModule

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      uiModeManager = mock()
      whenever(uiModeManager.contrast).thenReturn(0f)
    }
    startModule()
  }

  @Test
  fun aContrastChangeSendsContrastLevelDidChangeOnce() {
    resume()
    val listener = registeredListener()

    listener.onContrastChanged(0.5f)
    listener.onContrastChanged(0.5f)

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 0.5)
    assertThat(currentContrastLevel()).isEqualTo(0.5)
  }

  @Test
  fun theListenersValueIsUsedRatherThanReadingAgain() {
    resume()

    // The manager still reports 0, so only the value passed to the listener can produce 0.5.
    registeredListener().onContrastChanged(0.5f)

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 0.5)
    assertThat(currentContrastLevel()).isEqualTo(0.5)
  }

  @Test
  fun aNegativeContrastIsSent() {
    resume()

    registeredListener().onContrastChanged(-1f)

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, -1.0)
  }

  @Test
  fun theStartingValueIsClamped() {
    whenever(uiModeManager.contrast).thenReturn(2f)
    startModule()

    assertThat(currentContrastLevel()).isEqualTo(1.0)
  }

  @Test
  fun theValueReadOnResumeIsClamped() {
    resume()
    pause()

    whenever(uiModeManager.contrast).thenReturn(3f)
    resume()

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 1.0)
  }

  @Test
  fun theListenersValueIsClamped() {
    resume()

    registeredListener().onContrastChanged(-5f)

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, -1.0)
    assertThat(currentContrastLevel()).isEqualTo(-1.0)
  }

  @Test
  fun twoValuesThatClampToTheSameLevelSendOneEvent() {
    resume()
    val listener = registeredListener()

    listener.onContrastChanged(2f)
    listener.onContrastChanged(3f)

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 1.0)
  }

  @Test
  fun notANumberBeforeAnyChangeKeepsTheStandardContrast() {
    resume()
    val listener = registeredListener()

    listener.onContrastChanged(Float.NaN)
    listener.onContrastChanged(Float.NaN)
    pause()
    whenever(uiModeManager.contrast).thenReturn(Float.NaN)
    resume()

    assertNoContrastEvent()
    assertThat(currentContrastLevel()).isEqualTo(0.0)
  }

  @Test
  fun notANumberFromTheListenerKeepsTheLastLevel() {
    resume()
    val listener = registeredListener()

    listener.onContrastChanged(0.5f)
    listener.onContrastChanged(Float.NaN)

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 0.5)
    verify(reactContext, never()).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 0.0)
    assertThat(currentContrastLevel()).isEqualTo(0.5)
  }

  @Test
  fun notANumberOnResumeKeepsTheLastLevel() {
    resume()
    registeredListener().onContrastChanged(0.5f)
    pause()

    whenever(uiModeManager.contrast).thenReturn(Float.NaN)
    resume()

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 0.5)
    verify(reactContext, never()).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 0.0)
    assertThat(currentContrastLevel()).isEqualTo(0.5)
  }

  @Test
  fun notANumberAtTheStartIsTheStandardContrast() {
    whenever(uiModeManager.contrast).thenReturn(Float.NaN)
    startModule()

    assertThat(currentContrastLevel()).isEqualTo(0.0)
  }

  @Test
  fun resumingTwiceRegistersOneListener() {
    resume()
    resume()

    verify(uiModeManager, times(1)).addContrastChangeListener(any(), any())
  }

  @Test
  fun pausingRemovesTheListener() {
    resume()
    val listener = registeredListener()

    pause()

    verify(uiModeManager).removeContrastChangeListener(listener)
  }

  @Test
  fun invalidatingOnTheUiThreadRemovesTheListenerAtOnce() {
    resume()
    val listener = registeredListener()

    module.invalidate()

    verify(uiModeManager).removeContrastChangeListener(listener)
  }

  @Test
  fun invalidatingOnABackgroundThreadRemovesTheListenerOnTheUiThread() {
    resume()
    val listener = registeredListener()
    val unregisterThreads = mutableListOf<Thread>()
    doAnswer { unregisterThreads.add(Thread.currentThread()) }
        .whenever(uiModeManager)
        .removeContrastChangeListener(any())

    val background = Thread { module.invalidate() }
    background.start()
    background.join()

    verify(uiModeManager, never()).removeContrastChangeListener(any())

    shadowOf(Looper.getMainLooper()).idle()

    verify(uiModeManager, times(1)).removeContrastChangeListener(listener)
    assertThat(unregisterThreads).containsExactly(Looper.getMainLooper().thread)
  }

  @Test
  fun aContrastChangeQueuedBeforeInvalidateSendsNothing() {
    resume()
    val executor = argumentCaptor<Executor>()
    val listener = argumentCaptor<UiModeManager.ContrastChangeListener>()
    verify(uiModeManager).addContrastChangeListener(executor.capture(), listener.capture())

    // Android delivers the change through the executor, so it waits in the main looper's queue.
    executor.firstValue.execute { listener.firstValue.onContrastChanged(0.5f) }
    module.invalidate()
    shadowOf(Looper.getMainLooper()).idle()

    assertNoContrastEvent()
  }

  @Test
  fun aResumeQueuedBeforeInvalidateDoesNotRegister() {
    // A listener added while the host is resumed gets its onHostResume posted to the UI queue.
    startModule(hostResumed = true)

    module.invalidate()
    shadowOf(Looper.getMainLooper()).idle()

    verify(uiModeManager, never()).addContrastChangeListener(any(), any())
  }

  @Test
  fun resumingAfterInvalidateDoesNotRegister() {
    module.invalidate()

    module.onHostResume()

    verify(uiModeManager, never()).addContrastChangeListener(any(), any())
  }

  @Test
  fun aChangeWhilePausedIsSentOnResume() {
    resume()
    pause()

    whenever(uiModeManager.contrast).thenReturn(1f)
    resume()

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 1.0)
  }

  @Test
  fun withoutAUiModeManagerTheContrastLevelStaysZero() {
    startModule(UiModeContext(RuntimeEnvironment.getApplication(), null))

    resume()
    pause()
    module.invalidate()
    shadowOf(Looper.getMainLooper()).idle()

    assertThat(currentContrastLevel()).isEqualTo(0.0)
    assertNoContrastEvent()
  }

  @Test
  @Config(sdk = [33])
  fun theContrastLevelIsAlwaysZeroBeforeAndroid14() {
    resume()
    pause()
    module.invalidate()

    assertThat(currentContrastLevel()).isEqualTo(0.0)
    assertNoContrastEvent()
  }

  /** Builds a module on [context] and adds it as a lifecycle listener, as the host would. */
  private fun startModule(context: Context = defaultContext(), hostResumed: Boolean = false) {
    reactContext = spy(BridgeReactContext(context))
    reactContext.initializeWithInstance(ReactTestHelper.createMockCatalystInstance())
    if (hostResumed) {
      reactContext.onHostResume(null)
    }
    module = AccessibilityInfoModule(reactContext)
    module.initialize()
  }

  private fun defaultContext(): Context {
    val application = RuntimeEnvironment.getApplication()
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      UiModeContext(application, uiModeManager)
    } else {
      // Mockito can't mock the API 34 UiModeManager on older versions, so use Robolectric's.
      application
    }
  }

  private fun resume() {
    reactContext.onHostResume(null)
  }

  private fun pause() {
    reactContext.onHostPause()
  }

  private fun registeredListener(): UiModeManager.ContrastChangeListener {
    val captor = argumentCaptor<UiModeManager.ContrastChangeListener>()
    verify(uiModeManager).addContrastChangeListener(any(), captor.capture())
    return captor.firstValue
  }

  private fun currentContrastLevel(): Double {
    var result: Double? = null
    module.getContrastLevel(Callback { args -> result = args[0] as Double })
    return checkNotNull(result)
  }

  private fun assertNoContrastEvent() {
    verify(reactContext, never())
        .emitDeviceEvent(
            ArgumentMatchers.eq(CONTRAST_LEVEL_EVENT),
            ArgumentMatchers.any(),
        )
  }

  /** Serves a mock [UiModeManager], or none, since Robolectric doesn't call contrast listeners. */
  private class UiModeContext(base: Context, private val uiModeManager: UiModeManager?) :
      ContextWrapper(base) {
    override fun getApplicationContext(): Context = this

    override fun getSystemService(name: String): Any? =
        if (name == Context.UI_MODE_SERVICE) uiModeManager else super.getSystemService(name)
  }

  private companion object {
    const val CONTRAST_LEVEL_EVENT = "contrastLevelDidChange"
  }
}
