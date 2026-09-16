/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.systeminfo

import android.annotation.SuppressLint
import android.app.UiModeManager
import android.content.Context.UI_MODE_SERVICE
import android.content.res.Configuration
import android.os.Build
import android.provider.Settings.Secure
import com.facebook.fbreact.specs.NativePlatformConstantsAndroidSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.module.annotations.ReactModule

/** Module that exposes Android Constants to JS. */
@ReactModule(name = NativePlatformConstantsAndroidSpec.NAME)
@SuppressLint("HardwareIds")
@Suppress("DEPRECATION")
public class AndroidInfoModule(reactContext: ReactApplicationContext) :
    NativePlatformConstantsAndroidSpec(reactContext) {

  /**
   * See:
   * https://developer.android.com/reference/android/app/UiModeManager.html#getCurrentModeType()
   */
  private fun uiMode(): String {
    val uiModeManager = reactApplicationContext.getSystemService(UI_MODE_SERVICE) as UiModeManager
    return when (uiModeManager.currentModeType) {
      Configuration.UI_MODE_TYPE_TELEVISION -> "tv"
      Configuration.UI_MODE_TYPE_CAR -> "car"
      Configuration.UI_MODE_TYPE_DESK -> "desk"
      Configuration.UI_MODE_TYPE_WATCH -> "watch"
      Configuration.UI_MODE_TYPE_VR_HEADSET -> "vrheadset"
      Configuration.UI_MODE_TYPE_NORMAL -> "normal"
      else -> "unknown"
    }
  }

  override fun getTypedExportedConstants(): Map<String, Any> {
    val constants = mutableMapOf<String, Any>()
    constants["Version"] = Build.VERSION.SDK_INT
    constants["Release"] = Build.VERSION.RELEASE
    constants["Serial"] = Build.SERIAL
    constants["Fingerprint"] = Build.FINGERPRINT
    constants["Model"] = Build.MODEL
    constants["Manufacturer"] = Build.MANUFACTURER
    constants["Brand"] = Build.BRAND
    if (ReactBuildConfig.DEBUG) {
      constants["ServerHost"] =
          AndroidInfoHelpers.getServerHost(reactApplicationContext.applicationContext)
    }
    constants["isTesting"] = "true" == System.getProperty(IS_TESTING)
    val isDisableAnimations = System.getProperty(IS_DISABLE_ANIMATIONS)
    if (isDisableAnimations != null) {
      constants["isDisableAnimations"] = "true" == isDisableAnimations
    }
    constants["reactNativeVersion"] = ReactNativeVersion.VERSION
    constants["uiMode"] = uiMode()
    return constants
  }

  override fun getAndroidID(): String {
    return Secure.getString(reactApplicationContext.contentResolver, Secure.ANDROID_ID)
  }

  override fun invalidate() {}

  public companion object {
    public const val NAME: String = NativePlatformConstantsAndroidSpec.NAME
    private const val IS_TESTING = "IS_TESTING"
    private const val IS_DISABLE_ANIMATIONS = "IS_DISABLE_ANIMATIONS"
  }
}
