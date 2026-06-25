/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import com.facebook.react.ReactRootView
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewGroup
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

/**
 * Tests for the synchronous mount props override behavior in [SurfaceMountingManager], controlled
 * by the `overrideBySynchronousMountPropsAtMountingAndroid` feature flag (default: true).
 *
 * This fixes a race condition where Native Animated applies props (e.g. opacity, transform)
 * synchronously on native view, but a regular Fabric mount update with stale props arrives later
 * and overwrites the fresh values, causing the view to visibly jump/flicker.
 */
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
        ]
)
class SurfaceMountingManagerSynchronousMountPropsTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var themedReactContext: ThemedReactContext
  private val surfaceId = 1

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val reactContext = ReactTestHelper.createCatalystContextForTest()
    themedReactContext = ThemedReactContext(reactContext, reactContext, null, -1)
    mountingManager =
        MountingManager(
            ViewManagerRegistry(listOf<ViewManager<*, *>>(TestReactViewManager())),
            {},
        )
  }

  private fun startSurface(): SurfaceMountingManager {
    val rootView = ReactRootView(themedReactContext)
    mountingManager.startSurface(surfaceId, themedReactContext, rootView)
    return mountingManager.getSurfaceManagerEnforced(surfaceId, "test")
  }

  private fun createAndAttachView(smm: SurfaceMountingManager, tag: Int) {
    smm.preallocateView("RCTView", tag, JavaOnlyMap.of(), null, true)
    smm.addViewAt(surfaceId, tag, 0)
  }

  private class TestReactViewManager : ReactViewManager() {
    override fun setTransformProperty(
        view: ReactViewGroup,
        transforms: ReadableArray?,
        transformOrigin: ReadableArray?,
    ) {
      view.translationY = 0.0f
      if (transforms == null) {
        return
      }
      for (i in 0..<transforms.size()) {
        val transform = transforms.getMap(i) ?: continue
        if (transform.hasKey("translateY")) {
          view.translationY = transform.getDouble("translateY").toFloat()
        }
      }
    }
  }

  /** Stored synchronous opacity should override a stale Fabric mount update. */
  @Test
  fun storeSynchronousProps_overridesStaleOpacityInUpdateProps() {
    val smm = startSurface()
    val tag = 42
    createAndAttachView(smm, tag)

    // Native Animated sets opacity=0.3 synchronously
    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("opacity", 0.3))

    // Stale Fabric mount update arrives with opacity=1.0
    smm.updateProps(tag, JavaOnlyMap.of("opacity", 1.0))

    // The synchronous value (0.3) should win
    assertThat(smm.getView(tag).alpha).isEqualTo(0.3f)
  }

  /** Multiple storeSynchronousMountPropsOverride calls should merge — later values win. */
  @Test
  fun storeSynchronousProps_mergesMultipleCalls() {
    val smm = startSurface()
    val tag = 42
    createAndAttachView(smm, tag)

    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("opacity", 0.3))
    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("opacity", 0.7))

    smm.updateProps(tag, JavaOnlyMap.of("opacity", 1.0))

    assertThat(smm.getView(tag).alpha).isEqualTo(0.7f)
  }

  /**
   * Full race condition scenario: synchronous animated props survive a stale Fabric mount update.
   */
  @Test
  fun raceCondition_synchronousPropsWinOverStaleMount() {
    val smm = startSurface()
    val tag = 42
    createAndAttachView(smm, tag)

    // Native Animated applies fresh props synchronously
    val freshAnimatedProps = JavaOnlyMap.of("opacity", 0.2)
    smm.storeSynchronousMountPropsOverride(tag, freshAnimatedProps)
    smm.updatePropsSynchronously(tag, freshAnimatedProps)
    assertThat(smm.getView(tag).alpha).isEqualTo(0.2f)

    // Stale Fabric mount update arrives
    smm.updateProps(tag, JavaOnlyMap.of("opacity", 1.0))

    // Synchronous value preserved
    assertThat(smm.getView(tag).alpha).isEqualTo(0.2f)
  }

  /** A null Fabric prop update should not clear the stored synchronous opacity override. */
  @Test
  fun updateProps_withNullOpacity_keepsStoredSynchronousProp() {
    val smm = startSurface()
    val tag = 42
    createAndAttachView(smm, tag)

    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("opacity", 0.3))
    smm.updatePropsSynchronously(tag, JavaOnlyMap.of("opacity", 0.3))
    assertThat(smm.getView(tag).alpha).isEqualTo(0.3f)

    smm.updateProps(tag, JavaOnlyMap.of("opacity", null))

    assertThat(smm.getView(tag).alpha).isEqualTo(0.3f)
  }

  /** A synchronous null update should clear the stored synchronous opacity override. */
  @Test
  fun updatePropsSynchronously_withNullOpacity_removesStoredSynchronousProp() {
    val smm = startSurface()
    val tag = 42
    createAndAttachView(smm, tag)

    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("opacity", 0.3))
    smm.updatePropsSynchronously(tag, JavaOnlyMap.of("opacity", 0.3))
    assertThat(smm.getView(tag).alpha).isEqualTo(0.3f)

    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("opacity", null))
    smm.updatePropsSynchronously(tag, JavaOnlyMap.of("opacity", null))
    assertThat(smm.getView(tag).alpha).isEqualTo(1.0f)

    smm.updateProps(tag, JavaOnlyMap.of("opacity", null))

    assertThat(smm.getView(tag).alpha).isEqualTo(1.0f)
  }

  /** A null Fabric prop update should not clear the stored synchronous transform override. */
  @Test
  fun updateProps_withNullTransform_keepsStoredSynchronousProp() {
    val smm = startSurface()
    val tag = 42
    val transform = JavaOnlyArray.of(JavaOnlyMap.of("translateY", 40.0))
    createAndAttachView(smm, tag)

    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("transform", transform))
    smm.updatePropsSynchronously(tag, JavaOnlyMap.of("transform", transform))
    assertThat(smm.getView(tag).translationY).isEqualTo(40.0f)

    smm.updateProps(tag, JavaOnlyMap.of("transform", null))

    assertThat(smm.getView(tag).translationY).isEqualTo(40.0f)
  }

  /** A synchronous null update should clear the stored synchronous transform override. */
  @Test
  fun updatePropsSynchronously_withNullTransform_removesStoredSynchronousProp() {
    val smm = startSurface()
    val tag = 42
    val transform = JavaOnlyArray.of(JavaOnlyMap.of("translateY", 40.0))
    createAndAttachView(smm, tag)

    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("transform", transform))
    smm.updatePropsSynchronously(tag, JavaOnlyMap.of("transform", transform))
    assertThat(smm.getView(tag).translationY).isEqualTo(40.0f)

    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("transform", null))
    smm.updatePropsSynchronously(tag, JavaOnlyMap.of("transform", null))
    assertThat(smm.getView(tag).translationY).isEqualTo(0.0f)

    smm.updateProps(tag, JavaOnlyMap.of("transform", null))

    assertThat(smm.getView(tag).translationY).isEqualTo(0.0f)
  }

  /**
   * When a view is deleted, stored synchronous props should be cleaned up. A recreated view with
   * the same tag should not be affected by the old stored props.
   */
  @Test
  fun deleteView_cleansUpStoredSynchronousProps() {
    val smm = startSurface()
    val tag = 42
    createAndAttachView(smm, tag)

    smm.storeSynchronousMountPropsOverride(tag, JavaOnlyMap.of("opacity", 0.3))
    smm.deleteView(tag)

    // Recreate with same tag
    smm.createView("RCTView", tag, JavaOnlyMap.of(), null, null, true)
    smm.addViewAt(surfaceId, tag, 0)

    smm.updateProps(tag, JavaOnlyMap.of("opacity", 0.9))
    assertThat(smm.getView(tag).alpha).isEqualTo(0.9f)
  }

  /** Synchronous props stored for one tag should not affect a different tag. */
  @Test
  fun synchronousPropsAreIsolatedPerTag() {
    val smm = startSurface()
    createAndAttachView(smm, 42)
    createAndAttachView(smm, 43)

    smm.storeSynchronousMountPropsOverride(42, JavaOnlyMap.of("opacity", 0.3))

    smm.updateProps(42, JavaOnlyMap.of("opacity", 1.0))
    smm.updateProps(43, JavaOnlyMap.of("opacity", 1.0))

    // Tag 42: synchronous override applies (0.3)
    assertThat(smm.getView(42).alpha).isEqualTo(0.3f)
    // Tag 43: no override, incoming props apply (1.0)
    assertThat(smm.getView(43).alpha).isEqualTo(1.0f)
  }
}
