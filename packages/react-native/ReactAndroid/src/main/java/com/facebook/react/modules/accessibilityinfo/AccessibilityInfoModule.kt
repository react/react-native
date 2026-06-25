/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.accessibilityinfo

import android.content.ContentResolver
import android.content.Context
import android.database.ContentObserver
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityManager
import com.facebook.fbreact.specs.NativeAccessibilityInfoSpec
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

/**
 * Module that monitors and provides information about the state of Touch Exploration service on the
 * device. For API >= 19.
 */
@ReactModule(name = NativeAccessibilityInfoSpec.NAME)
internal class AccessibilityInfoModule(context: ReactApplicationContext) :
    NativeAccessibilityInfoSpec(context), LifecycleEventListener {
  private inner class ReactTouchExplorationStateChangeListener :
      AccessibilityManager.TouchExplorationStateChangeListener {
    override fun onTouchExplorationStateChanged(enabled: Boolean) {
      updateAndSendTouchExplorationChangeEvent(enabled)
    }
  }

  // Android can listen for accessibility service enable with `accessibilityStateChange`, but
  // `accessibilityState` conflicts with React Native props and confuses developers. Therefore, the
  // name `accessibilityServiceChange` is used here instead.
  private inner class ReactAccessibilityServiceChangeListener :
      AccessibilityManager.AccessibilityStateChangeListener {
    override fun onAccessibilityStateChanged(enabled: Boolean) {
      updateAndSendAccessibilityServiceChangeEvent(enabled)
    }
  }

  // Listener that is notified when the global TRANSITION_ANIMATION_SCALE.
  private val animationScaleObserver: ContentObserver =
      object : ContentObserver(UiThreadUtil.getUiThreadHandler()) {
        override fun onChange(selfChange: Boolean) {
          this.onChange(selfChange, null)
        }

        override fun onChange(selfChange: Boolean, uri: Uri?) {
          if (reactApplicationContext.hasActiveReactInstance()) {
            updateAndSendReduceMotionChangeEvent()
          }
        }
      }
  // Listener that is notified when the ACCESSIBILITY_HIGH_TEXT_CONTRAST_ENABLED changes.
  private val highTextContrastObserver: ContentObserver =
      object : ContentObserver(UiThreadUtil.getUiThreadHandler()) {
        override fun onChange(selfChange: Boolean) {
          this.onChange(selfChange, null)
        }

        override fun onChange(selfChange: Boolean, uri: Uri?) {
          if (reactApplicationContext.hasActiveReactInstance()) {
            updateAndSendHighTextContrastChangeEvent()
          }
        }
      }
  private val accessibilityManager: AccessibilityManager?
  private val touchExplorationStateChangeListener: ReactTouchExplorationStateChangeListener =
      ReactTouchExplorationStateChangeListener()
  private val accessibilityServiceChangeListener: ReactAccessibilityServiceChangeListener =
      ReactAccessibilityServiceChangeListener()
  private val contentResolver: ContentResolver
  private var reduceMotionEnabled = false
  private var highTextContrastEnabled = false
  private var touchExplorationEnabled = false
  private var accessibilityServiceEnabled = false
  private var recommendedTimeout = 0
  private var invertColorsEnabled = false
  private var grayscaleModeEnabled = false

  init {
    val appContext = context.applicationContext
    accessibilityManager =
        appContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager?
    contentResolver = reactApplicationContext.contentResolver
    touchExplorationEnabled = accessibilityManager?.isTouchExplorationEnabled ?: false
    accessibilityServiceEnabled = accessibilityManager?.isEnabled ?: false
    reduceMotionEnabled = isReduceMotionEnabledValue
    highTextContrastEnabled = isHighTextContrastEnabledValue
    grayscaleModeEnabled = isGrayscaleEnabledValue
  }

  private val isReduceMotionEnabledValue: Boolean
    get() {
      // Disabling animations in developer settings will set the animation scale to "0.0"
      // but setting "reduce motion" / "disable animations" will set the animation scale to "0".
      val rawValue =
          Settings.Global.getString(contentResolver, Settings.Global.TRANSITION_ANIMATION_SCALE)

      if (rawValue == null) {
        return false
      }

      try {
        // In some locales, the decimal separator is a comma instead of a dot,
        // but "toFloat" would crash failing to conver these.
        val parsedValue = rawValue.replace(',', '.').toFloat()
        return parsedValue == 0f
      } catch (e: NumberFormatException) {
        // If the value is not a valid number, we assume reduced motion is not enabled
        return false
      }
    }

  private val isInvertColorsEnabledValue: Boolean
    get() =
        try {
          Settings.Secure.getInt(
              contentResolver,
              Settings.Secure.ACCESSIBILITY_DISPLAY_INVERSION_ENABLED,
          ) == 1
        } catch (e: Settings.SettingNotFoundException) {
          false
        }

  private val isGrayscaleEnabledValue: Boolean
    get() {
      try {
        val colorCorrectionSettingKey = "accessibility_display_daltonizer_enabled"
        val colorModeSettingKey = "accessibility_display_daltonizer"
        // for grayscale mode to be detected, the color correction accessibility setting should be
        // on and the color correction mode should be set to grayscale (0)
        return Settings.Secure.getInt(contentResolver, colorCorrectionSettingKey) == 1 &&
            Settings.Secure.getInt(contentResolver, colorModeSettingKey) == 0
      } catch (e: Settings.SettingNotFoundException) {
        return false
      }
    }

  private val isHighTextContrastEnabledValue: Boolean
    get() {
      return Settings.Secure.getInt(
          contentResolver,
          ACCESSIBILITY_HIGH_TEXT_CONTRAST_ENABLED_CONSTANT,
          0,
      ) != 0
    }

  override fun isReduceMotionEnabled(successCallback: Callback) {
    successCallback.invoke(reduceMotionEnabled)
  }

  override fun isInvertColorsEnabled(successCallback: Callback) {
    successCallback.invoke(invertColorsEnabled)
  }

  override fun isGrayscaleEnabled(successCallback: Callback) {
    successCallback.invoke(grayscaleModeEnabled)
  }

  override fun isHighTextContrastEnabled(successCallback: Callback) {
    successCallback.invoke(highTextContrastEnabled)
  }

  override fun isTouchExplorationEnabled(successCallback: Callback) {
    successCallback.invoke(touchExplorationEnabled)
  }

  override fun isAccessibilityServiceEnabled(successCallback: Callback) {
    successCallback.invoke(accessibilityServiceEnabled)
  }

  private fun updateAndSendReduceMotionChangeEvent() {
    val isReduceMotionEnabled = isReduceMotionEnabledValue
    if (reduceMotionEnabled != isReduceMotionEnabled) {
      reduceMotionEnabled = isReduceMotionEnabled
      getReactApplicationContextIfActiveOrWarn()
          ?.emitDeviceEvent(REDUCE_MOTION_EVENT_NAME, reduceMotionEnabled)
    }
  }

  private fun updateAndSendInvertColorsChangeEvent() {
    val isInvertColorsEnabled = isInvertColorsEnabledValue
    if (invertColorsEnabled != isInvertColorsEnabled) {
      invertColorsEnabled = isInvertColorsEnabled
      getReactApplicationContextIfActiveOrWarn()
          ?.emitDeviceEvent(INVERT_COLOR_EVENT_NAME, invertColorsEnabled)
    }
  }

  private fun updateAndSendHighTextContrastChangeEvent() {
    val isHighTextContrastEnabled = isHighTextContrastEnabledValue
    if (highTextContrastEnabled != isHighTextContrastEnabled) {
      highTextContrastEnabled = isHighTextContrastEnabled
      getReactApplicationContextIfActiveOrWarn()
          ?.emitDeviceEvent(
              HIGH_TEXT_CONTRAST_EVENT_NAME,
              highTextContrastEnabled,
          )
    }
  }

  private fun updateAndSendTouchExplorationChangeEvent(enabled: Boolean) {
    if (touchExplorationEnabled != enabled) {
      touchExplorationEnabled = enabled
      getReactApplicationContextIfActiveOrWarn()
          ?.emitDeviceEvent(TOUCH_EXPLORATION_EVENT_NAME, touchExplorationEnabled)
    }
  }

  private fun updateAndSendAccessibilityServiceChangeEvent(enabled: Boolean) {
    if (accessibilityServiceEnabled != enabled) {
      accessibilityServiceEnabled = enabled
      getReactApplicationContextIfActiveOrWarn()
          ?.emitDeviceEvent(ACCESSIBILITY_SERVICE_EVENT_NAME, accessibilityServiceEnabled)
    }
  }

  private fun updateAndSendGrayscaleModeChangeEvent() {
    val isGrayscaleModeEnabled = isGrayscaleEnabledValue
    if (grayscaleModeEnabled != isGrayscaleModeEnabled) {
      grayscaleModeEnabled = isGrayscaleModeEnabled
      getReactApplicationContextIfActiveOrWarn()
          ?.emitDeviceEvent(GRAYSCALE_MODE_EVENT_NAME, grayscaleModeEnabled)
    }
  }

  override fun onHostResume() {
    accessibilityManager?.addTouchExplorationStateChangeListener(
        touchExplorationStateChangeListener
    )
    accessibilityManager?.addAccessibilityStateChangeListener(accessibilityServiceChangeListener)
    val transitionUri = Settings.Global.getUriFor(Settings.Global.TRANSITION_ANIMATION_SCALE)
    contentResolver.registerContentObserver(transitionUri, false, animationScaleObserver)
    val highTextContrastUri =
        Settings.Secure.getUriFor(ACCESSIBILITY_HIGH_TEXT_CONTRAST_ENABLED_CONSTANT)
    contentResolver.registerContentObserver(highTextContrastUri, false, highTextContrastObserver)
    updateAndSendTouchExplorationChangeEvent(
        accessibilityManager?.isTouchExplorationEnabled == true
    )
    updateAndSendAccessibilityServiceChangeEvent(accessibilityManager?.isEnabled == true)
    updateAndSendReduceMotionChangeEvent()
    updateAndSendHighTextContrastChangeEvent()
    updateAndSendInvertColorsChangeEvent()
    updateAndSendGrayscaleModeChangeEvent()
  }

  override fun onHostPause() {
    accessibilityManager?.removeTouchExplorationStateChangeListener(
        touchExplorationStateChangeListener
    )
    accessibilityManager?.removeAccessibilityStateChangeListener(accessibilityServiceChangeListener)
    contentResolver.unregisterContentObserver(animationScaleObserver)
    contentResolver.unregisterContentObserver(highTextContrastObserver)
  }

  override fun initialize() {
    reactApplicationContext.addLifecycleEventListener(this)
    updateAndSendTouchExplorationChangeEvent(
        accessibilityManager?.isTouchExplorationEnabled == true
    )
    updateAndSendAccessibilityServiceChangeEvent(accessibilityManager?.isEnabled == true)
    updateAndSendReduceMotionChangeEvent()
    updateAndSendHighTextContrastChangeEvent()
  }

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  override fun onHostDestroy(): Unit = Unit

  override fun announceForAccessibility(message: String?) {
    if (accessibilityManager == null || !accessibilityManager.isEnabled) {
      return
    }
    @Suppress("DEPRECATION")
    val event = AccessibilityEvent.obtain(AccessibilityEvent.TYPE_ANNOUNCEMENT)
    event.text.add(message)
    event.className = AccessibilityInfoModule::class.java.name
    event.packageName = reactApplicationContext.packageName
    accessibilityManager.sendAccessibilityEvent(event)
  }

  override fun setAccessibilityFocus(reactTag: Double) {
    // iOS only
  }

  override fun getRecommendedTimeoutMillis(originalTimeout: Double, successCallback: Callback) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      successCallback.invoke(originalTimeout.toInt())
      return
    }
    recommendedTimeout =
        accessibilityManager?.getRecommendedTimeoutMillis(
            originalTimeout.toInt(),
            AccessibilityManager.FLAG_CONTENT_CONTROLS,
        ) ?: 0
    successCallback.invoke(recommendedTimeout)
  }

  companion object {
    const val NAME: String = NativeAccessibilityInfoSpec.NAME
    private const val REDUCE_MOTION_EVENT_NAME = "reduceMotionDidChange"
    private const val HIGH_TEXT_CONTRAST_EVENT_NAME = "highTextContrastDidChange"
    private const val TOUCH_EXPLORATION_EVENT_NAME = "touchExplorationDidChange"
    private const val ACCESSIBILITY_SERVICE_EVENT_NAME = "accessibilityServiceDidChange"
    private const val ACCESSIBILITY_HIGH_TEXT_CONTRAST_ENABLED_CONSTANT =
        "high_text_contrast_enabled" // constant is marked with @hide
    private const val INVERT_COLOR_EVENT_NAME = "invertColorDidChange"
    private const val GRAYSCALE_MODE_EVENT_NAME = "grayscaleModeDidChange"
  }
}
