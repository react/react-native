/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // PreferenceManager should be migrated to androidx

package com.facebook.react.packagerconnection

import android.content.Context
import android.content.SharedPreferences
import android.preference.PreferenceManager
import com.facebook.common.logging.FLog
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers

public open class PackagerConnectionSettings(private val appContext: Context) {
  private val preferences: SharedPreferences =
      PreferenceManager.getDefaultSharedPreferences(appContext)
  public val packageName: String = appContext.packageName

  init {
    _cachedOrOverrideHost = null
  }

  public open var debugServerHost: String
    get() {
      // Check cached host first. If empty try to detect emulator type and use default
      // hostname for those
      _cachedOrOverrideHost?.let {
        return it
      }

      val hostFromSettings = preferences.getString(PREFS_DEBUG_SERVER_HOST_KEY, null)
      if (!hostFromSettings.isNullOrEmpty()) {
        return hostFromSettings
      }

      val host = AndroidInfoHelpers.getServerHost(appContext)
      if (host == AndroidInfoHelpers.DEVICE_LOCALHOST) {
        FLog.w(
            TAG,
            "You seem to be running on device. Run '${AndroidInfoHelpers.getAdbReverseTcpCommand(appContext)}' to forward the debug server's port to the device.",
        )
      }

      _cachedOrOverrideHost = host
      return host
    }
    set(host) {
      if (host.isEmpty()) {
        preferences.edit().remove(PREFS_DEBUG_SERVER_HOST_KEY).apply()
        _cachedOrOverrideHost = null
      } else {
        preferences.edit().putString(PREFS_DEBUG_SERVER_HOST_KEY, host).apply()
        _cachedOrOverrideHost = host
      }
    }

  public open fun resetDebugServerHost() {
    preferences.edit().remove(PREFS_DEBUG_SERVER_HOST_KEY).apply()
    _cachedOrOverrideHost = null
  }

  public fun setPackagerOptionsUpdater(queryMapper: (Map<String, String>) -> Map<String, String>) {
    _packagerOptionsUpdater = queryMapper
  }

  public fun updatePackagerOptions(options: Map<String, String>): Map<String, String> =
      _packagerOptionsUpdater(options)

  public fun setAdditionalOptionForPackager(key: String, value: String) {
    _additionalOptionsForPackager[key] = value
  }

  public val additionalOptionsForPackager: Map<String, String>
    get() = _additionalOptionsForPackager

  private companion object {
    private val TAG = PackagerConnectionSettings::class.java.simpleName
    private const val PREFS_DEBUG_SERVER_HOST_KEY = "debug_http_host"

    // The state for this class needs to be retained in the companion object.
    // That's necessary in the case when there are multiple instances of PackagerConnectionSettings
    private var _cachedOrOverrideHost: String? = null
    private val _additionalOptionsForPackager: MutableMap<String, String> = mutableMapOf()
    private var _packagerOptionsUpdater: (Map<String, String>) -> Map<String, String> = { it }
  }
}
