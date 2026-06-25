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
   * This is the version code for Android 15 (SDK Level 35). Internally at Meta this code is also
   * compiled against SDK 34, so we need to retain this constant instead of using
   * [Build.VERSION_CODES.VANILLA_ICE_CREAM] directly.
   */
  internal const val VERSION_CODE_VANILLA_ICE_CREAM: Int = 35

  /**
   * This is the version code for Android 16 (SDK Level 36). Internally at Meta this code is also
   * compiled against SDK 34, so we need to retain this constant instead of using
   * [Build.VERSION_CODES.BAKLAVA] directly.
   */
  internal const val VERSION_CODE_BAKLAVA: Int = 36

  /**
   * This is the version code for Android 17 (SDK Level 37). Internally at Meta this code is also
   * compiled against SDK 34, so we need to retain this constant instead of using
   * [Build.VERSION_CODES.CINNAMON_BUN] directly.
   */
  internal const val VERSION_CODE_CINNAMON_BUN: Int = 37

  /**
   * android.R.attr.windowOptOutEdgeToEdgeEnforcement added in API 35. Internally at Meta this code
   * is compiled against an SDK that may not have this attribute defined.
   * https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/core/res/res/values/public-final.xml;l=3848
   */
  internal const val ATTR_WINDOW_OPT_OUT_EDGE_TO_EDGE_ENFORCEMENT: Int = 0x0101069a

  /**
   * This method is used to check if the current device is running Android 15 (SDK Level 35) or
   * higher and the app is targeting Android 15 (SDK Level 35) or higher.
   */
  @JvmStatic
  internal fun isAtLeastTargetSdk35(context: Context): Boolean =
      Build.VERSION.SDK_INT >= VERSION_CODE_VANILLA_ICE_CREAM &&
          context.applicationInfo.targetSdkVersion >= VERSION_CODE_VANILLA_ICE_CREAM

  /**
   * This method is used to check if the current device is running Android 16 (SDK Level 36) or
   * higher and the app is targeting Android 16 (SDK Level 36) or higher.
   */
  @JvmStatic
  fun isAtLeastTargetSdk36(context: Context): Boolean =
      Build.VERSION.SDK_INT >= VERSION_CODE_BAKLAVA &&
          context.applicationInfo.targetSdkVersion >= VERSION_CODE_BAKLAVA
}
