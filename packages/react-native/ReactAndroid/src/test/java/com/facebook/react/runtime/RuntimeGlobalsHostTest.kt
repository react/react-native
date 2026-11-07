/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.RuntimeGlobalsBindingsInstallerTest.NativeDestructor
import com.facebook.react.runtime.RuntimeGlobalsBindingsInstallerTest.NativeInitializer
import com.facebook.testutils.shadows.ShadowNativeArray
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeArray
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedConstruction
import org.mockito.Mockito.mockConstruction
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@RunWith(RobolectricTestRunner::class)
@OptIn(UnstableReactNativeAPI::class, FrameworkAPI::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowNativeMap::class,
            ShadowReadableNativeMap::class,
            ShadowWritableNativeMap::class,
            ShadowNativeArray::class,
            ShadowReadableNativeArray::class,
            ShadowWritableNativeArray::class,
            NativeInitializer::class,
            NativeDestructor::class,
            RuntimeGlobalsHostTest.ComponentRegistry::class,
        ],
)
class RuntimeGlobalsHostTest {
  @Implements(DefaultComponentsRegistry::class)
  class ComponentRegistry {
    companion object {
      @JvmStatic @Implementation fun register(componentFactory: ComponentFactory) = Unit
    }
  }

  private val capturedDelegates = mutableListOf<ReactHostDelegate>()
  private lateinit var mockedHosts: MockedConstruction<ReactHostImpl>
  private lateinit var mockedFactories: MockedConstruction<ComponentFactory>

  @Before
  fun setUp() {
    DefaultReactHost.invalidate()
    NativeInitializer.receivedGlobals.clear()
    NativeInitializer.receivedBindingsInstallers.clear()
    mockedFactories = mockConstruction(ComponentFactory::class.java)
    mockedHosts =
        mockConstruction(ReactHostImpl::class.java) { _, context ->
          capturedDelegates.add(context.arguments()[1] as ReactHostDelegate)
        }
  }

  @After
  fun tearDown() {
    mockedHosts.close()
    mockedFactories.close()
    DefaultReactHost.invalidate()
  }

  @Test
  fun defaultHostPassesGlobalsAndExistingBindingsInstallerToNative() {
    val customInstaller = mock<BindingsInstaller>()

    val host =
        DefaultReactHost.getDefaultReactHost(
            context = RuntimeEnvironment.getApplication(),
            packageList = emptyList(),
            jsRuntimeFactory = mock(),
            bindingsInstaller = customInstaller,
            runtimeGlobals = mapOf("appConfig" to mapOf("environment" to "staging")),
        )

    assertThat(host).isSameAs(mockedHosts.constructed().single())
    assertThat(capturedDelegates.single().bindingsInstaller)
        .isInstanceOf(RuntimeGlobalsBindingsInstaller::class.java)
    val globals = NativeInitializer.receivedGlobals.single()
    assertThat(checkNotNull(globals.getMap("appConfig")).getString("environment"))
        .isEqualTo("staging")
    assertThat(NativeInitializer.receivedBindingsInstallers).containsExactly(customInstaller)
  }

  @Test
  fun delegateSnapshotsGlobalsDuringConstruction() {
    val config = mutableMapOf<String, Any?>("environment" to "staging")
    val globals = mutableMapOf<String, Any?>("appConfig" to config)

    val delegate =
        DefaultReactHostDelegate(
            jsMainModulePath = "index",
            jsBundleLoader = mock(),
            jsRuntimeFactory = mock(),
            turboModuleManagerDelegateBuilder = mock(),
            runtimeGlobals = globals,
        )
    config["environment"] = "production"
    globals.clear()

    assertThat(delegate.bindingsInstaller).isInstanceOf(RuntimeGlobalsBindingsInstaller::class.java)
    val received = NativeInitializer.receivedGlobals.single()
    assertThat(checkNotNull(received.getMap("appConfig")).getString("environment"))
        .isEqualTo("staging")
    assertThat(NativeInitializer.receivedBindingsInstallers).containsExactly(null)
  }

  @Test
  fun emptyGlobalsKeepTheCustomInstallerWithoutNativeInitialization() {
    val customInstaller = mock<BindingsInstaller>()

    val delegate =
        DefaultReactHostDelegate(
            jsMainModulePath = "index",
            jsBundleLoader = mock(),
            jsRuntimeFactory = mock(),
            bindingsInstaller = customInstaller,
            turboModuleManagerDelegateBuilder = mock(),
            runtimeGlobals = emptyMap(),
        )

    assertThat(delegate.bindingsInstaller).isSameAs(customInstaller)
    assertThat(NativeInitializer.receivedGlobals).isEmpty()
  }

  @Test
  fun omittedGlobalsKeepTheCustomInstallerWithoutNativeInitialization() {
    val customInstaller = mock<BindingsInstaller>()

    DefaultReactHost.getDefaultReactHost(
        context = RuntimeEnvironment.getApplication(),
        packageList = emptyList(),
        jsRuntimeFactory = mock(),
        bindingsInstaller = customInstaller,
    )

    assertThat(capturedDelegates.single().bindingsInstaller).isSameAs(customInstaller)
    assertThat(NativeInitializer.receivedGlobals).isEmpty()
  }

  @Test
  fun omittedGlobalsAndInstallerKeepNoInstaller() {
    DefaultReactHost.getDefaultReactHost(
        context = RuntimeEnvironment.getApplication(),
        packageList = emptyList(),
        jsRuntimeFactory = mock(),
    )

    assertThat(capturedDelegates.single().bindingsInstaller).isNull()
    assertThat(NativeInitializer.receivedGlobals).isEmpty()
  }
}
