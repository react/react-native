/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.runtime.hermes.HermesInstance
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@OptIn(UnstableReactNativeAPI::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactHostDelegateTest {

  /**
   * Mock test for {@link DefaultReactHostDelegate}, used to setup the process to create a stable
   * API
   */
  @Test
  fun testDefaultReactHostDelegateCreation() {
    val jsBundleLoader: JSBundleLoader = Mockito.mock(JSBundleLoader::class.java)
    val turboModuleManagerDelegateBuilderMock: ReactPackageTurboModuleManagerDelegate.Builder =
        Mockito.mock(ReactPackageTurboModuleManagerDelegate.Builder::class.java)
    val hermesInstance: JSRuntimeFactory = Mockito.mock(HermesInstance::class.java)
    val jsMainModulePathMocked = "mockedJSMainModulePath"
    val delegate =
        DefaultReactHostDelegate(
            jsMainModulePath = jsMainModulePathMocked,
            jsBundleLoader = jsBundleLoader,
            jsRuntimeFactory = hermesInstance,
            turboModuleManagerDelegateBuilder = turboModuleManagerDelegateBuilderMock,
        )

    assertThat(delegate.jsMainModulePath).isEqualTo(jsMainModulePathMocked)
  }
}
