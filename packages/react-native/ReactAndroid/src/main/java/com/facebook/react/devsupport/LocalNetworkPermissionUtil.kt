/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.util.AndroidVersion

/**
 * Debug-only helper to request the runtime `ACCESS_LOCAL_NETWORK` permission needed to reach Metro
 * on Android 17 (SDK 37) devices, which gate local-network addresses (the emulator's `10.0.2.2`
 * alias, a device's Wi-Fi/LAN IP). Requested only in debuggable builds, and always (like iOS),
 * since the dev-server host can change at runtime (e.g. switching from `adb reverse` to a LAN IP).
 */
internal object LocalNetworkPermissionUtil {
  private const val PERMISSION = "android.permission.ACCESS_LOCAL_NETWORK"
  private const val PERMISSION_REQUEST_CODE = 1

  /**
   * Invokes [onResolved] once it is safe to connect to Metro: immediately when no permission is
   * needed, or after the user answers the `ACCESS_LOCAL_NETWORK` prompt otherwise.
   */
  @JvmStatic
  fun requestLocalNetworkAccessIfNeeded(activity: Activity, onResolved: Runnable) {
    if (activity is PermissionAwareActivity && needsLocalNetworkPrompt(activity)) {
      activity.requestPermissions(arrayOf(PERMISSION), PERMISSION_REQUEST_CODE) { _, _, _ ->
        onResolved.run()
        true
      }
    } else {
      onResolved.run()
    }
  }

  /** Whether the `ACCESS_LOCAL_NETWORK` prompt must be shown before reaching the dev server. */
  private fun needsLocalNetworkPrompt(activity: Activity): Boolean {
    if (!ReactBuildConfig.DEBUG) return false // dev-server only; never prompt in release builds
    if (Build.VERSION.SDK_INT < AndroidVersion.VERSION_CODE_CINNAMON_BUN) return false
    return activity.checkSelfPermission(PERMISSION) != PackageManager.PERMISSION_GRANTED
  }
}
