/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T207169925: Migrate CatalystInstance to Reacthost and remove the Suppress("DEPRECATION")
// annotation
@file:Suppress("DEPRECATION")

package com.facebook.react.bridge

import android.app.Application
import com.facebook.react.bridge.queue.MessageQueueThreadSpec
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.bridge.queue.ReactQueueConfigurationImpl
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.BridgelessReactContext
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.internal.bolts.Task
import com.facebook.react.uimanager.UIManagerModule
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.whenever
import org.robolectric.RuntimeEnvironment

/** Utility for creating pre-configured instances of core react components for tests. */
object ReactTestHelper {
  /**
   * @return a ReactApplicationContext that has a CatalystInstance mock returned by
   *   [createMockCatalystInstance]
   */
  @JvmStatic
  fun createCatalystContextForTest(): ReactApplicationContext =
      BridgeReactContext(RuntimeEnvironment.getApplication()).apply {
        initializeWithInstance(createMockCatalystInstance())
      }

  /** @return a CatalystInstance mock that has a default working ReactQueueConfiguration. */
  @JvmStatic
  fun createMockCatalystInstance(): CatalystInstance {
    val spec: ReactQueueConfigurationSpec =
        ReactQueueConfigurationSpec.builder()
            .setJSQueueThreadSpec(MessageQueueThreadSpec.mainThreadSpec())
            .setNativeModulesQueueThreadSpec(MessageQueueThreadSpec.mainThreadSpec())
            .build()
    val reactQueueConfiguration: ReactQueueConfiguration =
        ReactQueueConfigurationImpl.create(spec) { e -> throw RuntimeException(e) }
    val reactInstance: CatalystInstance = mock<CatalystInstance>()
    whenever(reactInstance.reactQueueConfiguration).thenReturn(reactQueueConfiguration)
    whenever(reactInstance.getNativeModule(UIManagerModule::class.java))
        .thenReturn(mock<UIManagerModule>())
    whenever(reactInstance.isDestroyed).thenReturn(false)
    return reactInstance
  }

  @OptIn(UnstableReactNativeAPI::class)
  fun createTestReactApplicationContext(application: Application): ReactApplicationContext {
    val reactHost = spy(
        ReactHostImpl(
            RuntimeEnvironment.getApplication(),
            mock(),
            mock(),
            Task.Companion.IMMEDIATE_EXECUTOR,
            Task.Companion.IMMEDIATE_EXECUTOR,
            false /* allowPackagerServerAccess */,
            false /* useDevSupport */,
        )
    )
    return BridgelessReactContext(application, reactHost)
  }
}
