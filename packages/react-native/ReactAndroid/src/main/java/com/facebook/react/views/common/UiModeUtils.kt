/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.common

import android.app.Activity
import android.content.Context
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatDelegate

/** Utility object providing static methods for working with UI mode properties from Context. */
internal object UiModeUtils {

  /**
   * Determines whether the current UI mode is dark mode
   *
   * @param context The context to check the UI mode from
   * @return true if the current UI mode is dark mode, false otherwise
   */
  @JvmStatic
  fun isDarkMode(context: Context): Boolean =
      context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK ==
          Configuration.UI_MODE_NIGHT_YES

  /**
   * Like [isDarkMode], but a context that is not an activity also uses the app's night mode.
   * `AppCompatDelegate.setDefaultNightMode()` does not change the app context's `uiMode`, and the
   * activity is not always available yet.
   */
  @JvmStatic
  fun isAppDarkMode(context: Context): Boolean =
      if (context is Activity) {
        isDarkMode(context)
      } else {
        when (AppCompatDelegate.getDefaultNightMode()) {
          AppCompatDelegate.MODE_NIGHT_YES -> true
          AppCompatDelegate.MODE_NIGHT_NO -> false
          else -> isDarkMode(context)
        }
      }
}
