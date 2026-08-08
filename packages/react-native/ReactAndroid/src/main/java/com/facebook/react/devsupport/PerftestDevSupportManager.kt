/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.modules.debug.interfaces.DeveloperSettings

/**
 * Interface for accessing and interacting with development features related to performance testing.
 * Communication is enabled via the Inspector, but everything else is disabled.
 */
internal class PerftestDevSupportManager(
    applicationContext: Context,
) : ReleaseDevSupportManager() {

  override val devSettings: DeveloperSettings =
      DevInternalSettings(
          applicationContext,
          object : DevInternalSettings.Listener {
            override fun onInternalSettingsChanged() = Unit
          },
      )

  private val devServerHelper: DevServerHelper =
      DevServerHelper(devSettings, applicationContext, devSettings.packagerConnectionSettings)

  override fun startInspector() {
    devServerHelper.openInspectorConnection()
  }

  override fun stopInspector() {
    devServerHelper.closeInspectorConnection()
  }
}
