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
import com.facebook.react.module.annotations.ReactModule
import java.util.Locale

/** [com.facebook.react.bridge.NativeModule] that allows JS to set allowRTL and get isRTL status. */
@ReactModule(name = NativeI18nManagerSpec.NAME)
internal class I18nManagerModule(context: ReactApplicationContext?) :
    NativeI18nManagerSpec(context) {
  override fun getTypedExportedConstants(): Map<String, Any> {
    val context = reactApplicationContext
    val locale =
        ConfigurationCompat.getLocales(context.resources.configuration)[0] ?: Locale.getDefault()

    return mapOf(
        "isRTL" to I18nUtil.instance.isRTL(context),
        "doLeftAndRightSwapInRTL" to I18nUtil.instance.doLeftAndRightSwapInRTL(context),
        "localeIdentifier" to locale.toString(),
    )
  }

  override fun allowRTL(value: Boolean) {
    I18nUtil.instance.allowRTL(reactApplicationContext, value)
  }

  override fun forceRTL(value: Boolean) {
    I18nUtil.instance.forceRTL(reactApplicationContext, value)
  }

  override fun swapLeftAndRightInRTL(value: Boolean) {
    I18nUtil.instance.swapLeftAndRightInRTL(reactApplicationContext, value)
  }

  companion object {
    const val NAME: String = NativeI18nManagerSpec.NAME
  }
}
