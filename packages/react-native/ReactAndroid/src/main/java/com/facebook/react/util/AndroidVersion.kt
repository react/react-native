/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.util

import android.content.Context
import android.os.Build

/** Helper class for checking Android version-related information. */
internal object AndroidVersion {

  /**
   * This is the version code for Android 17 (SDK Level 37). Internally at Meta this code is
   * compiled against SDK 36, so we need to retain this constant instead of using
   * [Build.VERSION_CODES.CINNAMON_BUN] directly.
   */
  internal const val VERSION_CODE_CINNAMON_BUN: Int = 37

  /**
   * This method is used to check if the current device is running Android 16 (SDK Level 36) or
   * higher and the app is targeting Android 16 (SDK Level 36) or higher.
   */
  @JvmStatic
  fun isAtLeastTargetSdk36(context: Context): Boolean =
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.BAKLAVA &&
          context.applicationInfo.targetSdkVersion >= Build.VERSION_CODES.BAKLAVA
}
