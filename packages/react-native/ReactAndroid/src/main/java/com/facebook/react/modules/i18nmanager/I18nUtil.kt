/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.i18nmanager

import android.content.Context
import android.content.pm.ApplicationInfo
import android.view.View
import androidx.core.os.ConfigurationCompat
import androidx.core.text.TextUtilsCompat
import java.util.Locale

public class I18nUtil private constructor() {
  @Volatile private var rtlForced: Boolean = false

  /**
   * Check if the device is currently running on an RTL locale. This only happens when the app
   * supports RTL, and:
   * * is forcing RTL layout, regardless of the active language (for development purpose)
   * * or is running on an RTL locale
   */
  public fun isRTL(context: Context): Boolean =
      applicationHasRtlSupport(context) && (isRTLForced() || isDevicePreferredLanguageRTL(context))

  /**
   * Android relies on the presence of `android:supportsRtl="true"` being set in order to resolve
   * RTL as a layout direction for native Android views. RTL in React Native relies on this being
   * set.
   */
  private fun applicationHasRtlSupport(context: Context): Boolean {
    return (context.applicationInfo.flags and ApplicationInfo.FLAG_SUPPORTS_RTL) != 0
  }

  /** Could be used to test RTL layout with English Used for development and testing purpose */
  private fun isRTLForced(): Boolean =
      rtlForced ||
          System.getProperty("FORCE_RTL_FOR_TESTING", "false").equals("true", ignoreCase = true)

  public fun forceRTL(forceRTL: Boolean) {
    rtlForced = forceRTL
  }

  // Check if the current device language is RTL
  private fun isDevicePreferredLanguageRTL(context: Context): Boolean {
    val locale =
        ConfigurationCompat.getLocales(context.resources.configuration)[0] ?: Locale.getDefault()
    val directionality = TextUtilsCompat.getLayoutDirectionFromLocale(locale)
    return directionality == View.LAYOUT_DIRECTION_RTL
  }

  public companion object {
    public val instance: I18nUtil = I18nUtil()
      @JvmStatic get() = field

    /**
     * We're just re-adding this to reduce a breaking change for libraries in React Native 0.75.
     *
     * @deprecated Use instance instead
     */
    @Deprecated(
        "Use .instance instead, this API is only for backward compat",
        ReplaceWith("instance"),
    )
    @JvmName(
        "DEPRECATED\$getInstance",
    ) // We intentionally don't want to expose this accessor to Java.
    public fun getInstance(): I18nUtil = instance
  }
}
