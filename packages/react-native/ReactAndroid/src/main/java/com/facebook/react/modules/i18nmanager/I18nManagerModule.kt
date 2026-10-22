/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.i18nmanager

import androidx.core.os.ConfigurationCompat
import com.facebook.fbreact.specs.NativeI18nManagerSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.runtime.BridgelessReactContext
import java.util.Locale

/** [com.facebook.react.bridge.NativeModule] that allows JS to set forceRTL and get isRTL status. */
@ReactModule(name = NativeI18nManagerSpec.NAME)
internal class I18nManagerModule(context: ReactApplicationContext?) :
    NativeI18nManagerSpec(context) {
  override fun getTypedExportedConstants(): Map<String, Any> {
    val context = reactApplicationContext
    val locale =
        ConfigurationCompat.getLocales(context.resources.configuration)[0] ?: Locale.getDefault()

    return mapOf(
        "isRTL" to I18nUtil.instance.isRTL(context),
        "localeIdentifier" to locale.toLanguageTag(),
    )
  }

  override fun forceRTL(value: Boolean): Boolean {
    val wasRTL = I18nUtil.instance.isRTL(reactApplicationContext)
    I18nUtil.instance.forceRTL(value)
    val isRTL = I18nUtil.instance.isRTL(reactApplicationContext)

    if (isRTL != wasRTL) {
      // Returns before the relayout, so JS reads the new value before any layout event
      UiThreadUtil.runOnUiThread {
        (reactApplicationContext as? BridgelessReactContext)
            ?.updateLayoutDirectionOfAttachedSurfaces()
      }
    }

    return isRTL
  }

  companion object {
    const val NAME: String = NativeI18nManagerSpec.NAME
  }
}
