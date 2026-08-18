/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // Suppressing as we want to test getFabricUIManager here

package com.facebook.react.runtime

import android.app.Activity
import android.content.Context
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowNativeArray
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Tests [BridgelessReactContext] */
@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowArguments::class,
            ShadowWritableNativeArray::class,
        ],
)
@OptIn(FrameworkAPI::class)
class BridgelessReactContextTest {
  private lateinit var context: Context
  private lateinit var reactHost: ReactHostImpl
  private lateinit var bridgelessReactContext: BridgelessReactContext

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = Robolectric.buildActivity(Activity::class.java).create().get()
    reactHost = mock()
    bridgelessReactContext = BridgelessReactContext(context, reactHost)
  }

  @Test
  fun getNativeModuleTest() {
    val uiManagerModuleMock: UIManagerModule = mock()
    whenever(reactHost.getNativeModule(any<Class<UIManagerModule>>())).doReturn(uiManagerModuleMock)
    val uiManagerModule = bridgelessReactContext.getNativeModule(UIManagerModule::class.java)
    assertThat(uiManagerModule).isEqualTo(uiManagerModuleMock)
  }

  @Test
  fun getFabricUIManagerTest() {
    val fabricUiManager = mock<FabricUIManager>()
    whenever(reactHost.uiManager).doReturn(fabricUiManager)
    assertThat(bridgelessReactContext.getFabricUIManager()).isEqualTo(fabricUiManager)
  }

  @Suppress("DEPRECATION")
  @Test
  fun getCatalystInstanceTest() {
    assertThat(bridgelessReactContext.getCatalystInstance())
        .isInstanceOf(BridgelessCatalystInstance::class.java)
  }

  @Test
  fun testEmitDeviceEvent() {
    bridgelessReactContext.emitDeviceEvent("onNetworkResponseReceived", mapOf("foo" to "bar"))

    val argsCapture = argumentCaptor<WritableNativeArray>()
    verify(reactHost, times(1))
        .callFunctionOnModule(eq("RCTDeviceEventEmitter"), eq("emit"), argsCapture.capture())

    val argsList = ShadowNativeArray.getContents(argsCapture.firstValue)
    assertThat(argsList[0]).isEqualTo("onNetworkResponseReceived")
    @Suppress("UNCHECKED_CAST") assertThat((argsList[1] as Map<Any, Any>)["foo"]).isEqualTo("bar")
  }
}
