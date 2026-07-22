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
import androidx.core.text.TextUtilsCompat
import java.util.Locale

public class I18nUtil private constructor() {
  /**
   * Check if the device is currently running on an RTL locale. This only happens when the app:
   * * is forcing RTL layout, regardless of the active language (for development purpose)
   * * allows RTL layout when using RTL locale
   */
  public fun isRTL(context: Context): Boolean {
    if (!applicationHasRtlSupport(context)) {
      return false
    }
    if (isRTLForced(context)) {
      return true
    }
    if (isRTLAllowed(context) && isApplicationPreferredLanguageRTL(context)) {
      return true
    }
    return false
  }

  /**
   * Android relies on the presence of `android:supportsRtl="true"` being set in order to resolve
   * RTL as a layout direction for native Android views. RTL in React Native relies on this being
   * set.
   */
  private fun applicationHasRtlSupport(context: Context): Boolean {
    return (context.applicationInfo.flags and ApplicationInfo.FLAG_SUPPORTS_RTL) != 0
  }

  /**
   * Should be used very early during app start up Before the bridge is initialized
   *
   * @return whether the app allows RTL layout, default is true
   */
  private fun isRTLAllowed(context: Context): Boolean =
      isPrefSet(context, KEY_FOR_PREFS_ALLOWRTL, true)

  public fun allowRTL(context: Context, allowRTL: Boolean) {
    setPref(context, KEY_FOR_PREFS_ALLOWRTL, allowRTL)
  }

  public fun doLeftAndRightSwapInRTL(context: Context): Boolean =
      isPrefSet(context, KEY_FOR_PERFS_MAKE_RTL_FLIP_LEFT_AND_RIGHT_STYLES, true)

  public fun swapLeftAndRightInRTL(context: Context, flip: Boolean) {
    setPref(context, KEY_FOR_PERFS_MAKE_RTL_FLIP_LEFT_AND_RIGHT_STYLES, flip)
  }

  /** Could be used to test RTL layout with English Used for development and testing purpose */
  private fun isRTLForced(context: Context): Boolean =
      isPrefSet(context, KEY_FOR_PREFS_FORCERTL, false) ||
          System.getProperty("FORCE_RTL_FOR_TESTING", "false").equals("true", ignoreCase = true)

  public fun forceRTL(context: Context, forceRTL: Boolean) {
    setPref(context, KEY_FOR_PREFS_FORCERTL, forceRTL)
  }

  private fun isApplicationPreferredLanguageRTL(context: Context): Boolean {
    // Check if the current device language is RTL
    val directionality = TextUtilsCompat.getLayoutDirectionFromLocale(context.resources.configuration.locales[0])
    return directionality == View.LAYOUT_DIRECTION_RTL
  }

  private fun isPrefSet(context: Context, key: String, defaultValue: Boolean): Boolean =
      context
          .getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
          .getBoolean(key, defaultValue)

  private fun setPref(context: Context, key: String, value: Boolean) {
    val editor = context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE).edit()
    editor.putBoolean(key, value)
    editor.apply()
  }

  public companion object {
    public val instance: I18nUtil = I18nUtil()
      @JvmStatic get() = field

    private const val SHARED_PREFS_NAME = "com.facebook.react.modules.i18nmanager.I18nUtil"
    private const val KEY_FOR_PREFS_ALLOWRTL = "RCTI18nUtil_allowRTL"
    private const val KEY_FOR_PREFS_FORCERTL = "RCTI18nUtil_forceRTL"
    private const val KEY_FOR_PERFS_MAKE_RTL_FLIP_LEFT_AND_RIGHT_STYLES =
        "RCTI18nUtil_makeRTLFlipLeftAndRightStyles"

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
        "DEPRECATED\$getInstance"
    ) // We intentionally don't want to expose this accessor to Java.
    public fun getInstance(): I18nUtil = instance
  }
}
