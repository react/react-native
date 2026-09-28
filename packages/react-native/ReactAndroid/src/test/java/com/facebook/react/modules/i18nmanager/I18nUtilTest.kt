/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.i18nmanager

import android.content.Context
import android.content.pm.ApplicationInfo
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
internal class I18nUtilTest {
  private lateinit var context: Context

  @Before
  fun setUp() {
    context = RuntimeEnvironment.getApplication()
    context.applicationInfo.flags =
        context.applicationInfo.flags or ApplicationInfo.FLAG_SUPPORTS_RTL
    I18nUtil.instance.allowRTL(context, true)
    I18nUtil.instance.forceRTL(context, false)
  }

  @Test
  @Config(sdk = [23], qualifiers = "ar")
  fun isRTL_onApi23_usesPreferredLocale() {
    assertThat(I18nUtil.instance.isRTL(context)).isTrue()
  }
}
