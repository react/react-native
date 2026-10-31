/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.modules.accessibilityinfo

import android.app.Application
import android.content.ComponentCallbacks
import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.kotlin.never
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class AccessibilityInfoModuleTest {

  private lateinit var recordingContext: RecordingContext
  private lateinit var reactContext: BridgeReactContext
  private lateinit var module: AccessibilityInfoModule

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    recordingContext = RecordingContext(RuntimeEnvironment.getApplication())
    reactContext = spy(BridgeReactContext(recordingContext))
    reactContext.initializeWithInstance(ReactTestHelper.createMockCatalystInstance())
    module = AccessibilityInfoModule(reactContext)
  }

  @Test
  fun aPositiveFontWeightAdjustmentIsBold() {
    assertThat(AccessibilityInfoModule.isBoldFontWeightAdjustment(300)).isTrue()
  }

  @Test
  fun noFontWeightAdjustmentIsNotBold() {
    assertThat(AccessibilityInfoModule.isBoldFontWeightAdjustment(0)).isFalse()
  }

  @Test
  fun aNegativeFontWeightAdjustmentIsNotBold() {
    assertThat(AccessibilityInfoModule.isBoldFontWeightAdjustment(-100)).isFalse()
  }

  @Test
  fun anUndefinedFontWeightAdjustmentIsNotBold() {
    assertThat(
            AccessibilityInfoModule.isBoldFontWeightAdjustment(
                Configuration.FONT_WEIGHT_ADJUSTMENT_UNDEFINED
            )
        )
        .isFalse()
  }

  @Test
  fun aConfigurationChangeSendsBoldTextDidChangeOnce() {
    module.onHostResume()

    dispatchConfigurationChange(setFontWeightAdjustment(300))
    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verify(reactContext, times(1)).emitDeviceEvent(BOLD_TEXT_EVENT, true)
    assertThat(currentBoldText()).isTrue()
  }

  @Test
  fun turningBoldTextOffSendsFalse() {
    setFontWeightAdjustment(300)
    module = AccessibilityInfoModule(reactContext)
    module.onHostResume()

    dispatchConfigurationChange(setFontWeightAdjustment(0))

    verify(reactContext, times(1)).emitDeviceEvent(BOLD_TEXT_EVENT, false)
    assertThat(currentBoldText()).isFalse()
  }

  @Test
  fun noEventIsSentWhilePaused() {
    module.onHostResume()
    module.onHostPause()

    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verifyNoBoldTextEvent()
  }

  @Test
  fun resumingTwiceAndPausingOnceStopsTheEvents() {
    module.onHostResume()
    module.onHostResume()
    module.onHostPause()

    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verifyNoBoldTextEvent()
  }

  @Test
  fun noEventIsSentAfterInvalidate() {
    module.onHostResume()
    module.invalidate()

    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verifyNoBoldTextEvent()
  }

  @Test
  fun aChangeWhilePausedIsSentOnResume() {
    module.onHostResume()
    module.onHostPause()

    setFontWeightAdjustment(300)
    module.onHostResume()

    verify(reactContext, times(1)).emitDeviceEvent(BOLD_TEXT_EVENT, true)
  }

  @Test
  fun theConfigurationAndroidPassesInIsUsed() {
    module.onHostResume()

    // The Application's resources are not updated, so only `newConfig` says bold text is on.
    val config =
        Configuration(RuntimeEnvironment.getApplication().resources.configuration).apply {
          fontWeightAdjustment = 300
        }
    dispatchConfigurationChange(config)

    verify(reactContext, times(1)).emitDeviceEvent(BOLD_TEXT_EVENT, true)
    assertThat(currentBoldText()).isTrue()
  }

  @Test
  fun resumingThroughTheReactContextRegistersOnce() {
    module.initialize()
    reactContext.onHostResume(null)
    reactContext.onHostResume(null)

    assertThat(recordingContext.registrations).hasSize(1)

    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verify(reactContext, times(1)).emitDeviceEvent(BOLD_TEXT_EVENT, true)
  }

  @Test
  fun invalidateOnTheMainThreadUnregistersInline() {
    module.initialize()
    reactContext.onHostResume(null)

    module.invalidate()

    assertThat(recordingContext.unregistrations).containsExactly(Looper.getMainLooper().thread)
  }

  @Test
  fun invalidateOnABackgroundThreadUnregistersOnTheMainThread() {
    module.initialize()
    reactContext.onHostResume(null)

    val background = Thread { module.invalidate() }
    background.start()
    background.join()

    assertThat(recordingContext.unregistrations).isEmpty()

    shadowOf(Looper.getMainLooper()).idle()

    assertThat(recordingContext.unregistrations).containsExactly(Looper.getMainLooper().thread)
  }

  @Test
  @LooperMode(LooperMode.Mode.PAUSED)
  fun aConfigurationChangeQueuedBeforeInvalidateSendsNothing() {
    module.initialize()
    reactContext.onHostResume(null)
    val config = setFontWeightAdjustment(300)
    Handler(Looper.getMainLooper()).post { dispatchConfigurationChange(config) }

    val background = Thread { module.invalidate() }
    background.start()
    background.join()
    shadowOf(Looper.getMainLooper()).idle()

    verifyNoBoldTextEvent()
    assertThat(recordingContext.unregistrations).containsExactly(Looper.getMainLooper().thread)
  }

  @Test
  fun resumingAfterInvalidateDoesNotRegister() {
    module.initialize()
    module.invalidate()

    reactContext.onHostResume(null)
    // A resume that reaches the module directly, such as one queued before `invalidate()`.
    module.onHostResume()

    assertThat(recordingContext.registrations).isEmpty()
    dispatchConfigurationChange(setFontWeightAdjustment(300))
    verifyNoBoldTextEvent()
  }

  @Test
  @Config(sdk = [30])
  fun nothingIsRegisteredBeforeAndroid12() {
    module = AccessibilityInfoModule(reactContext)
    module.initialize()
    reactContext.onHostResume(null)

    assertThat(recordingContext.registrations).isEmpty()

    val config =
        Configuration(RuntimeEnvironment.getApplication().resources.configuration).apply {
          orientation = Configuration.ORIENTATION_LANDSCAPE
        }
    dispatchConfigurationChange(config)

    verifyNoBoldTextEvent()
  }

  @Test
  @Config(sdk = [30])
  fun boldTextIsAlwaysFalseBeforeAndroid12() {
    module = AccessibilityInfoModule(reactContext)
    module.onHostResume()
    module.onHostPause()
    module.invalidate()

    assertThat(currentBoldText()).isFalse()
    verifyNoBoldTextEvent()
  }

  private fun currentBoldText(): Boolean {
    var result: Boolean? = null
    module.isBoldTextEnabled(Callback { args -> result = args[0] as Boolean })
    return checkNotNull(result)
  }

  private fun verifyNoBoldTextEvent() {
    verify(reactContext, never())
        .emitDeviceEvent(
            ArgumentMatchers.eq(BOLD_TEXT_EVENT),
            ArgumentMatchers.any(),
        )
  }

  private fun setFontWeightAdjustment(adjustment: Int): Configuration {
    val resources = RuntimeEnvironment.getApplication().resources
    val config = Configuration(resources.configuration).apply { fontWeightAdjustment = adjustment }
    resources.updateConfiguration(config, resources.displayMetrics)
    return config
  }

  private fun dispatchConfigurationChange(config: Configuration) {
    RuntimeEnvironment.getApplication().onConfigurationChanged(config)
  }

  /**
   * The module registers its callbacks on the application context. Returning itself from
   * [getApplicationContext] makes this wrapper that context, so it can record each call and the
   * thread it ran on before passing it to the real [Application]. It calls [getBaseContext] rather
   * than `super`: before Android 12, [ContextWrapper] doesn't override these methods, and
   * [Context]'s versions forward to [getApplicationContext], which is this wrapper.
   */
  private class RecordingContext(base: Application) : ContextWrapper(base) {
    val registrations = mutableListOf<Thread>()
    val unregistrations = mutableListOf<Thread>()

    override fun getApplicationContext(): Context = this

    override fun registerComponentCallbacks(callback: ComponentCallbacks) {
      registrations.add(Thread.currentThread())
      baseContext.registerComponentCallbacks(callback)
    }

    override fun unregisterComponentCallbacks(callback: ComponentCallbacks) {
      unregistrations.add(Thread.currentThread())
      baseContext.unregisterComponentCallbacks(callback)
    }
  }

  private companion object {
    const val BOLD_TEXT_EVENT = "boldTextDidChange"
  }
}
