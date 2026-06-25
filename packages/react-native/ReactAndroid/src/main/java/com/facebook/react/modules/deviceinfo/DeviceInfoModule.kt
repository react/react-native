/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.deviceinfo

import android.util.DisplayMetrics
import androidx.annotation.VisibleForTesting
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.window.layout.WindowMetricsCalculator
import com.facebook.fbreact.specs.NativeDeviceInfoSpec
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.DisplayMetricsHolder.getScreenDisplayMetrics
import com.facebook.react.uimanager.DisplayMetricsHolder.initDisplayMetricsIfNotInitialized
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn

/** Module that exposes Android Constants to JS. */
@ReactModule(name = NativeDeviceInfoSpec.NAME)
internal class DeviceInfoModule(reactContext: ReactApplicationContext) :
    NativeDeviceInfoSpec(reactContext), LifecycleEventListener {
  private var fontScale: Float = reactContext.resources.configuration.fontScale
  private var previousDisplayMetrics: ReadableMap? = null

  init {
    initDisplayMetricsIfNotInitialized(reactContext)
    reactContext.addLifecycleEventListener(this)
  }

  @VisibleForTesting
  internal fun getWindowDisplayMetrics(): DisplayMetrics {
    val windowDisplayMetrics = DisplayMetrics()
    windowDisplayMetrics.setTo(reactApplicationContext.resources.displayMetrics)

    val activity = reactApplicationContext.currentActivity ?: return windowDisplayMetrics
    val bounds = WindowMetricsCalculator.getOrCreate().computeCurrentWindowMetrics(activity).bounds

    if (isEdgeToEdgeFeatureFlagOn) {
      windowDisplayMetrics.widthPixels = bounds.width()
      windowDisplayMetrics.heightPixels = bounds.height()
    } else {
      // WindowMetrics bounds include system bars. When edge-to-edge is not enabled, we subtract
      // them so that window dimensions reflect the usable content area. If insets aren't yet
      // available (e.g. before the first layout pass), fall back to resources.displayMetrics,
      // which already excludes system bars in non-edge-to-edge mode.
      ViewCompat.getRootWindowInsets(activity.window.decorView)?.let {
        val insets =
            it.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
        windowDisplayMetrics.widthPixels = bounds.width() - (insets.left + insets.right)
        windowDisplayMetrics.heightPixels = bounds.height() - (insets.top + insets.bottom)
      }
    }

    return windowDisplayMetrics
  }

  @VisibleForTesting
  internal fun getDisplayMetricsWritableMap(): WritableMap =
      WritableNativeMap().apply {
        putMap(
            "windowPhysicalPixels",
            getPhysicalPixelsWritableMap(getWindowDisplayMetrics()),
        )
        putMap(
            "screenPhysicalPixels",
            getPhysicalPixelsWritableMap(getScreenDisplayMetrics()),
        )
      }

  private fun getPhysicalPixelsWritableMap(
      displayMetrics: DisplayMetrics,
  ): WritableMap =
      WritableNativeMap().apply {
        putInt("width", displayMetrics.widthPixels)
        putInt("height", displayMetrics.heightPixels)
        putDouble("scale", displayMetrics.density.toDouble())
        putDouble("fontScale", fontScale.toDouble())
        putDouble("densityDpi", displayMetrics.densityDpi.toDouble())
      }

  public override fun getTypedExportedConstants(): Map<String, Any> {
    val displayMetrics = getDisplayMetricsWritableMap()

    // Cache the initial dimensions for later comparison in emitUpdateDimensionsEvent
    previousDisplayMetrics = displayMetrics.copy()

    return mapOf(
        "Dimensions" to displayMetrics.toHashMap(),
        "isEdgeToEdge" to isEdgeToEdgeFeatureFlagOn,
    )
  }

  override fun onHostResume() {
    val newFontScale = reactApplicationContext.resources?.configuration?.fontScale
    if (newFontScale != null && newFontScale != fontScale) {
      fontScale = newFontScale
      emitUpdateDimensionsEvent()
    }
  }

  override fun onHostPause(): Unit = Unit

  override fun onHostDestroy(): Unit = Unit

  fun emitUpdateDimensionsEvent() {
    reactApplicationContext.let { context ->
      if (context.hasActiveReactInstance()) {
        // Don't emit an event to JS if the dimensions haven't changed
        val displayMetrics = getDisplayMetricsWritableMap()
        if (previousDisplayMetrics == null) {
          previousDisplayMetrics = displayMetrics.copy()
        } else if (displayMetrics != previousDisplayMetrics) {
          previousDisplayMetrics = displayMetrics.copy()
          context.emitDeviceEvent("didUpdateDimensions", displayMetrics)
        }
      } else {
        ReactSoftExceptionLogger.logSoftException(
            NativeDeviceInfoSpec.NAME,
            ReactNoCrashSoftException(
                "No active CatalystInstance, cannot emitUpdateDimensionsEvent"
            ),
        )
      }
    }
  }

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext.removeLifecycleEventListener(this)
  }

  companion object {
    const val NAME: String = NativeDeviceInfoSpec.NAME
  }
}
