/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.clipboard

import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ClipboardModuleTest {
  private lateinit var clipboardModule: ClipboardModule
  private lateinit var clipboardManager: ClipboardManager

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    clipboardModule = ClipboardModule(createTestReactApplicationContext())
    clipboardManager =
        RuntimeEnvironment.getApplication().getSystemService(Context.CLIPBOARD_SERVICE)
            as ClipboardManager
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Suppress("DEPRECATION")
  @Test
  fun testSetString() {
    clipboardModule.setString(TEST_CONTENT)
    assertThat(clipboardManager.text == TEST_CONTENT).isTrue()
    clipboardModule.setString(null)
    assertThat(clipboardManager.hasText()).isFalse()
    clipboardModule.setString("")
    assertThat(clipboardManager.hasText()).isFalse()
    clipboardModule.setString(" ")
    assertThat(clipboardManager.hasText()).isTrue()
  }

  companion object {
    private const val TEST_CONTENT = "test"
  }
}
