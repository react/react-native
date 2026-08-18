/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import com.facebook.react.MemoryPressureRouter
import com.facebook.react.bridge.UIManager
import com.facebook.react.common.LifecycleState
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlagsDefaults
import com.facebook.react.runtime.internal.bolts.Task
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedConstruction
import org.mockito.Mockito.mockConstruction
import org.mockito.kotlin.any
import org.mockito.kotlin.doNothing
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

/** Tests [ReactHostImpl] */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
@OptIn(UnstableReactNativeAPI::class, FrameworkAPI::class)
class ReactHostTest {
  private lateinit var reactHostDelegate: ReactHostDelegate
  private lateinit var reactHost: ReactHostImpl
  private lateinit var activityController: ActivityController<Activity>

  private lateinit var mockedReactInstanceCtor: MockedConstruction<ReactInstance>
  private lateinit var mockedBridgelessReactContextCtor: MockedConstruction<BridgelessReactContext>
  private lateinit var mockedMemoryPressureRouterCtor: MockedConstruction<MemoryPressureRouter>

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(ReactNativeNewArchitectureFeatureFlagsDefaults())

    activityController = Robolectric.buildActivity(Activity::class.java).create().start().resume()

    mockedReactInstanceCtor = mockConstruction(ReactInstance::class.java)
    mockedBridgelessReactContextCtor = mockConstruction(BridgelessReactContext::class.java)
    mockedMemoryPressureRouterCtor = mockConstruction(MemoryPressureRouter::class.java)

    reactHostDelegate = mock()
    whenever(reactHostDelegate.jsBundleLoader).thenReturn(mock())

    reactHost =
        spy(
            ReactHostImpl(
                activityController.get().application,
                reactHostDelegate,
                mock(),
                Task.IMMEDIATE_EXECUTOR,
                Task.IMMEDIATE_EXECUTOR,
                false /* allowPackagerServerAccess */,
                false /* useDevSupport */,
            ),
        )
    doReturn(null).whenever(reactHost).getOrCreateReactHostInspectorTarget()
    doNothing().whenever(reactHost).unregisterInstanceFromInspector(any())
  }

  @After
  fun tearDown() {
    mockedReactInstanceCtor.close()
    mockedBridgelessReactContextCtor.close()
    mockedMemoryPressureRouterCtor.close()
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun getEventDispatcher_returnsBlackHoleEventDispatcher() {
    val eventDispatcher = reactHost.eventDispatcher
    assertThat(eventDispatcher).isInstanceOf(BlackHoleEventDispatcher::class.java)
  }

  @Test
  fun getUIManager_returnsNullIfNoInstance() {
    val uiManager: UIManager? = reactHost.uiManager
    assertThat(uiManager).isNull()
  }

  @Test
  fun testGetDevSupportManager_withRelease() {
    // BridgelessDevSupportManager is created only for debug
    // we check if it was instantiated or if ReleaseDevSupportManager was created (for release).
    assertThat(reactHost.devSupportManager).isInstanceOf(ReleaseDevSupportManager::class.java)
  }

  @Test
  fun testGetDevSupportManager_withDebug() {
    reactHost =
        ReactHostImpl(
            activityController.get().application,
            reactHostDelegate,
            mock(),
            Task.IMMEDIATE_EXECUTOR,
            Task.IMMEDIATE_EXECUTOR,
            false /* allowPackagerServerAccess */,
            true, /* useDevSupport */
        )
    assertThat(reactHost.devSupportManager).isNotInstanceOf(ReleaseDevSupportManager::class.java)
  }

  @Test
  fun testStart() {
    assertThat(reactHost.isInstanceInitialized).isFalse()
    reactHost.start()
    assertThat(reactHost.isInstanceInitialized).isTrue()
    assertThat(reactHost.currentReactContext).isNotNull()

    val memoryPressureRouter = mockedMemoryPressureRouterCtor.constructed().first()
    verify(memoryPressureRouter).addMemoryPressureListener(any())
  }

  @Test
  fun testDestroy() {
    reactHost.start()
    reactHost.destroy("Destroying from testing infra", null)
    assertThat(reactHost.isInstanceInitialized).isFalse()
    assertThat(reactHost.currentReactContext).isNull()
  }

  @Test
  fun testReload() {
    reactHost.start()
    val oldReactContext = reactHost.currentReactContext
    reactHost.reload("Reload from testing infra")
    assertThat(mockedBridgelessReactContextCtor.constructed().count()).isEqualTo(2)
    assertThat(mockedBridgelessReactContextCtor.constructed().first()).isEqualTo(oldReactContext)
    val newReactContext = mockedBridgelessReactContextCtor.constructed().last()
    assertThat(reactHost.isInstanceInitialized).isTrue()
    assertThat(reactHost.currentReactContext).isNotNull()
    assertThat(reactHost.currentReactContext).isEqualTo(newReactContext)
    assertThat(reactHost.currentReactContext).isNotEqualTo(oldReactContext)
  }

  @Test
  fun testLifecycleStateChanges() {
    reactHost.start()
    assertThat(reactHost.lifecycleState).isEqualTo(LifecycleState.BEFORE_CREATE)
    reactHost.onHostResume(activityController.get())
    assertThat(reactHost.lifecycleState).isEqualTo(LifecycleState.RESUMED)
    reactHost.onHostPause(activityController.get())
    assertThat(reactHost.lifecycleState).isEqualTo(LifecycleState.BEFORE_RESUME)
    reactHost.onHostDestroy(activityController.get())
    assertThat(reactHost.lifecycleState).isEqualTo(LifecycleState.BEFORE_CREATE)
  }
}
