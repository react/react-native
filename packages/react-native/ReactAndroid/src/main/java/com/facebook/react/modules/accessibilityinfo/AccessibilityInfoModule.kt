/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.accessibilityinfo

import android.app.UiModeManager
import android.content.ContentResolver
import android.content.Context
import android.database.ContentObserver
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityManager
import androidx.annotation.RequiresApi
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeAccessibilityInfoSpec
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Executor
import java.util.concurrent.atomic.AtomicBoolean

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
  // Notified when the contrast level changes. Only created on Android 14 (API 34) or later, when
  // there is a UiModeManager, so that older versions never load ContrastChangeListener.
  private val contrastListener: ContrastListenerApi34?
  private val accessibilityManager: AccessibilityManager?
  private val touchExplorationStateChangeListener: ReactTouchExplorationStateChangeListener =
      ReactTouchExplorationStateChangeListener()
  private val accessibilityServiceChangeListener: ReactAccessibilityServiceChangeListener =
      ReactAccessibilityServiceChangeListener()
  private val contentResolver: ContentResolver
  private var reduceMotionEnabled = false
  private var highTextContrastEnabled = false
  // Written on the main thread and read on the native modules thread.
  @Volatile private var contrastLevel = 0f
  private val warnedAboutNaNContrast = AtomicBoolean(false)
  private val warnedAboutOutOfRangeContrast = AtomicBoolean(false)
  // Set by invalidate(), so that a resume or a contrast change already queued on the main thread
  // can't register listeners or send events after teardown.
  @Volatile private var invalidated = false
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
    val uiModeManager = appContext.getSystemService(Context.UI_MODE_SERVICE) as UiModeManager?
    contrastListener =
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE && uiModeManager != null
        ) {
          ContrastListenerApi34(uiModeManager) { rawLevel ->
            if (!invalidated && reactApplicationContext.hasActiveReactInstance()) {
              normalizedContrastLevel(rawLevel)?.let { updateAndSendContrastLevelChangeEvent(it) }
            }
          }
        } else {
          null
        }
    touchExplorationEnabled = accessibilityManager?.isTouchExplorationEnabled ?: false
    accessibilityServiceEnabled = accessibilityManager?.isEnabled ?: false
    reduceMotionEnabled = isReduceMotionEnabledValue
    highTextContrastEnabled = isHighTextContrastEnabledValue
    // There is no earlier value to keep, so NaN at the start is the standard contrast.
    contrastLevel = contrastLevelValue ?: 0f
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

  /** The current contrast level, clamped to the range -1 to 1, or null if Android reports NaN. */
  private val contrastLevelValue: Float?
    get() {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        return 0f
      }
      val listener = contrastListener ?: return 0f
      return normalizedContrastLevel(listener.currentLevel())
    }

  /**
   * Clamps [rawLevel] to the range -1 to 1, or returns null for NaN so the caller can ignore it.
   */
  private fun normalizedContrastLevel(rawLevel: Float): Float? {
    if (rawLevel.isNaN()) {
      if (!warnedAboutNaNContrast.getAndSet(true)) {
        FLog.w(
            ReactConstants.TAG,
            "AccessibilityInfoModule: UiModeManager reported a contrast level that is not a number, ignoring it",
        )
      }
      return null
    }
    val level = rawLevel.coerceIn(-1f, 1f)
    if (level != rawLevel && !warnedAboutOutOfRangeContrast.getAndSet(true)) {
      FLog.w(
          ReactConstants.TAG,
          "AccessibilityInfoModule: UiModeManager reported the contrast level $rawLevel, using $level instead",
      )
    }
    return level
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

  override fun getContrastLevel(successCallback: Callback) {
    successCallback.invoke(contrastLevel.toDouble())
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

  /** [level] must already be normalized. */
  private fun updateAndSendContrastLevelChangeEvent(level: Float) {
    if (contrastLevel != level) {
      contrastLevel = level
      getReactApplicationContextIfActiveOrWarn()
          ?.emitDeviceEvent(CONTRAST_LEVEL_EVENT_NAME, level.toDouble())
    }
  }

  private fun registerContrastChangeListener() {
    if (invalidated || Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return
    }
    contrastListener?.register(reactApplicationContext.mainExecutor)
  }

  private fun unregisterContrastChangeListener() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return
    }
    contrastListener?.unregister()
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
    if (invalidated) {
      return
    }
    accessibilityManager?.addTouchExplorationStateChangeListener(
        touchExplorationStateChangeListener,
    )
    accessibilityManager?.addAccessibilityStateChangeListener(accessibilityServiceChangeListener)
    val transitionUri = Settings.Global.getUriFor(Settings.Global.TRANSITION_ANIMATION_SCALE)
    contentResolver.registerContentObserver(transitionUri, false, animationScaleObserver)
    val highTextContrastUri =
        Settings.Secure.getUriFor(ACCESSIBILITY_HIGH_TEXT_CONTRAST_ENABLED_CONSTANT)
    contentResolver.registerContentObserver(highTextContrastUri, false, highTextContrastObserver)
    // The contrast listener is removed while paused, and registering doesn't report the current
    // value, so the level is read again below.
    registerContrastChangeListener()
    updateAndSendTouchExplorationChangeEvent(
        accessibilityManager?.isTouchExplorationEnabled == true,
    )
    updateAndSendAccessibilityServiceChangeEvent(accessibilityManager?.isEnabled == true)
    updateAndSendReduceMotionChangeEvent()
    updateAndSendHighTextContrastChangeEvent()
    // A NaN keeps the last level, so nothing is sent.
    contrastLevelValue?.let { updateAndSendContrastLevelChangeEvent(it) }
    updateAndSendInvertColorsChangeEvent()
    updateAndSendGrayscaleModeChangeEvent()
  }

  override fun onHostPause() {
    accessibilityManager?.removeTouchExplorationStateChangeListener(
        touchExplorationStateChangeListener,
    )
    accessibilityManager?.removeAccessibilityStateChangeListener(accessibilityServiceChangeListener)
    contentResolver.unregisterContentObserver(animationScaleObserver)
    contentResolver.unregisterContentObserver(highTextContrastObserver)
    unregisterContrastChangeListener()
  }

  override fun initialize() {
    reactApplicationContext.addLifecycleEventListener(this)
    updateAndSendTouchExplorationChangeEvent(
        accessibilityManager?.isTouchExplorationEnabled == true,
    )
    updateAndSendAccessibilityServiceChangeEvent(accessibilityManager?.isEnabled == true)
    updateAndSendReduceMotionChangeEvent()
    updateAndSendHighTextContrastChangeEvent()
  }

  override fun invalidate() {
    // Removing the lifecycle listener first drops an onHostResume that ReactContext has queued.
    reactApplicationContext.removeLifecycleEventListener(this)
    invalidated = true
    // The contrast listener is added and removed on the UI thread, but invalidate() can run on
    // another thread. There is nothing to remove before Android 14 or without a UiModeManager.
    if (contrastListener != null) {
      if (UiThreadUtil.isOnUiThread()) {
        unregisterContrastChangeListener()
      } else if (!UiThreadUtil.runOnUiThread { unregisterContrastChangeListener() }) {
        FLog.w(
            ReactConstants.TAG,
            "AccessibilityInfoModule: Couldn't post the removal of the contrast listener, so it may leak",
        )
      }
    }
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

  /**
   * Owns the API 34 contrast listener, so that the module never refers to
   * [UiModeManager.ContrastChangeListener] directly. Each module has its own instance. [register]
   * and [unregister] must be called on the UI thread.
   */
  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  private class ContrastListenerApi34(
      private val manager: UiModeManager,
      onChange: (Float) -> Unit,
  ) {
    private val listener = UiModeManager.ContrastChangeListener { level -> onChange(level) }
    private var registered = false

    fun register(executor: Executor) {
      if (!registered) {
        manager.addContrastChangeListener(executor, listener)
        registered = true
      }
    }

    fun unregister() {
      if (registered) {
        manager.removeContrastChangeListener(listener)
        registered = false
      }
    }

    fun currentLevel(): Float = manager.contrast
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
    private const val CONTRAST_LEVEL_EVENT_NAME = "contrastLevelDidChange"
  }
}
