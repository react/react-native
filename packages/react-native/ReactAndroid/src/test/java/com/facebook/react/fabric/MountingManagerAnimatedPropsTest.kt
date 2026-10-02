/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import com.facebook.react.ReactRootView
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeArray
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowNativeMap::class,
            ShadowWritableNativeMap::class,
            ShadowReadableNativeMap::class,
            ShadowWritableNativeArray::class,
            ShadowReadableNativeArray::class,
        ],
)
class MountingManagerAnimatedPropsTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var themedReactContext: ThemedReactContext
  private val surfaceId = 1

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val reactContext = ReactTestHelper.createCatalystContextForTest()
    themedReactContext = ThemedReactContext(reactContext, reactContext, null, -1)
    mountingManager =
        MountingManager(ViewManagerRegistry(listOf<ViewManager<*, *>>(ReactViewManager())), {})
  }

  private fun startSurfaceWithView(tag: Int): SurfaceMountingManager {
    mountingManager.startSurface(surfaceId, themedReactContext, ReactRootView(themedReactContext))
    val smm = mountingManager.getSurfaceManagerEnforced(surfaceId, "test")
    smm.preallocateView("RCTView", tag, JavaOnlyMap.of(), null, true)
    smm.addViewAt(surfaceId, tag, 0)
    return smm
  }

  @Test
  fun appliesPropsToExistingView() {
    val smm = startSurfaceWithView(42)

    val applied =
        mountingManager.updateAnimatedPropsSynchronously(42, JavaOnlyMap.of("opacity", 0.3))

    assertThat(applied).isTrue()
    assertThat(smm.getView(42).alpha).isEqualTo(0.3f)
  }

  @Test
  fun reportsUnknownTag() {
    startSurfaceWithView(42)

    assertThat(mountingManager.updateAnimatedPropsSynchronously(7, JavaOnlyMap.of("opacity", 0.3)))
        .isFalse()
  }

  @Test
  fun storedValueOverridesStaleMountUpdate() {
    val smm = startSurfaceWithView(42)
    mountingManager.updateAnimatedPropsSynchronously(42, JavaOnlyMap.of("opacity", 0.3))

    smm.updateProps(42, JavaOnlyMap.of("opacity", 1.0))

    assertThat(smm.getView(42).alpha).isEqualTo(0.3f)
  }
}
