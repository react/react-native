/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Suppressing as we want to test specifically with RCTEventEmitter here
@file:Suppress("DEPRECATION")

package com.facebook.react.bridge.interop

import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.events.RCTEventEmitter
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(UnstableReactNativeAPI::class)
class InteropModuleRegistryTest {

  private lateinit var underTest: InteropModuleRegistry

  private interface FakeJavaScriptModule : JavaScriptModule

  @Suppress("DEPRECATION")
  private class FakeRCTEventEmitter : RCTEventEmitter {
    @Deprecated("Use [RCTModernEventEmitter.receiveEvent] instead")
    override fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?) = Unit
  }

  @Before
  fun setup() {
    underTest = InteropModuleRegistry()
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun getInteropModule_withRegisteredClassAndInvalidFlags_returnsNull() {
    overrideFeatureFlags(false)
    underTest.registerInteropModule(RCTEventEmitter::class.java, FakeRCTEventEmitter())

    val interopModule = underTest.getInteropModule(RCTEventEmitter::class.java)

    assertThat(interopModule).isNull()
  }

  @Test
  fun getInteropModule_withRegisteredClassAndValidFlags_returnsInteropModule() {
    overrideFeatureFlags(true)
    underTest.registerInteropModule(RCTEventEmitter::class.java, FakeRCTEventEmitter())

    val interopModule = underTest.getInteropModule(RCTEventEmitter::class.java)

    assertThat(interopModule).isInstanceOf(FakeRCTEventEmitter::class.java)
  }

  @Test
  fun getInteropModule_withUnregisteredClass_returnsNull() {
    overrideFeatureFlags(true)
    val missingModule = underTest.getInteropModule(FakeJavaScriptModule::class.java)

    assertThat(missingModule).isNull()
  }

  private fun overrideFeatureFlags(useFabricInterop: Boolean) {
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun useFabricInterop(): Boolean = useFabricInterop
        }
    )
  }
}
