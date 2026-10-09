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
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Tests for [SurfaceMountingManager] view lifecycle around preallocateView, deleteView, and
 * createView.
 *
 * The key scenario is the interaction between view preallocation and destroyUnmountedShadowNode
 * (D98729251): when a preallocated view is destroyed (e.g. from a superseded concurrent render),
 * and then a new Create mount item is emitted for the same tag, the view must be recreated.
 *
 * NOTE: These tests verify Java-side behavior only. The C++ fix in FabricMountingManager (erasing
 * from allocatedViewRegistry_ in destroyUnmountedShadowNode) ensures the Create mount item is
 * emitted in the first place. That behavior requires native code and is not testable via
 * Robolectric.
 *
 * See T223288217.
 */
@RunWith(RobolectricTestRunner::class)
class SurfaceMountingManagerTest {
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
            ViewManagerRegistry(listOf<ViewManager<*, *>>(ReactViewManager())),
            MountItemExecutor {},
        )
  }

  private fun startSurface(): SurfaceMountingManager {
    val rootView = ReactRootView(themedReactContext)
    mountingManager.startSurface(surfaceId, themedReactContext, rootView)
    return mountingManager.getSurfaceManagerEnforced(surfaceId, "test")
  }

  @Test
  fun preallocateView_createsView() {
    val smm = startSurface()
    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    assertThat(smm.getViewExists(42)).isTrue()
  }

  @Test
  fun deleteView_removesPreallocatedView() {
    val smm = startSurface()
    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    smm.deleteView(42)
    assertThat(smm.getViewExists(42)).isFalse()
  }

  /**
   * Verifies the Java side of the scenario fixed by D98729251:
   * 1. preallocateView creates the view
   * 2. deleteView removes it (simulating destroyUnmountedShadowNode)
   * 3. createView recreates it (the C++ fix ensures this Create is actually emitted)
   * 4. addViewAt succeeds with the recreated view
   */
  @Test
  fun createView_succeedsAfterPreallocateAndDelete() {
    val smm = startSurface()

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    assertThat(smm.getViewExists(42)).isTrue()

    smm.deleteView(42)
    assertThat(smm.getViewExists(42)).isFalse()

    smm.createView("RCTView", 42, JavaOnlyMap.of(), null, null, true)
    assertThat(smm.getViewExists(42)).isTrue()

    smm.addViewAt(surfaceId, 42, 0)
    assertThat(smm.getView(42)).isNotNull()
  }

  /** createView is a no-op when the view already exists from preallocate (normal case). */
  @Test
  fun createView_isIdempotentWhenPreallocated() {
    val smm = startSurface()

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    val viewBefore = smm.getView(42)

    smm.createView("RCTView", 42, JavaOnlyMap.of(), null, null, true)
    assertThat(smm.getView(42)).isSameAs(viewBefore)
  }

  /** Calling deleteView twice should not crash — second call logs a soft exception. */
  @Test
  fun deleteView_isIdempotent() {
    val smm = startSurface()
    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    smm.deleteView(42)
    smm.deleteView(42)
    assertThat(smm.getViewExists(42)).isFalse()
  }

  /** createView works for a tag that was never preallocated (normal non-preallocated path). */
  @Test
  fun createView_afterDeleteWithoutPreallocate() {
    val smm = startSurface()

    smm.createView("RCTView", 42, JavaOnlyMap.of(), null, null, true)
    assertThat(smm.getViewExists(42)).isTrue()

    smm.deleteView(42)
    assertThat(smm.getViewExists(42)).isFalse()

    smm.createView("RCTView", 42, JavaOnlyMap.of(), null, null, true)
    assertThat(smm.getViewExists(42)).isTrue()
  }

  /**
   * Validates the fix works with multiple concurrent tag recycling — the real-world scenario with
   * concurrent renders where several preallocated views are destroyed.
   */
  @Test
  fun preallocateAndDeleteMultipleTags_thenRecreate() {
    val smm = startSurface()

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    smm.preallocateView("RCTView", 43, JavaOnlyMap.of(), null, true)
    smm.preallocateView("RCTView", 44, JavaOnlyMap.of(), null, true)

    smm.deleteView(42)
    smm.deleteView(43)
    smm.deleteView(44)

    for (tag in intArrayOf(42, 43, 44)) {
      assertThat(smm.getViewExists(tag)).isFalse()
      smm.createView("RCTView", tag, JavaOnlyMap.of(), null, null, true)
      assertThat(smm.getViewExists(tag)).isTrue()
      smm.addViewAt(surfaceId, tag, 0)
      assertThat(smm.getView(tag)).isNotNull()
    }
  }

  /** Calling preallocateView twice with the same tag is a no-op (same view returned). */
  @Test
  fun preallocateView_isIdempotent() {
    val smm = startSurface()

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    val viewBefore = smm.getView(42)

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    assertThat(smm.getView(42)).isSameAs(viewBefore)
  }

  /** preallocateView recreates a view after it was preallocated and then deleted. */
  @Test
  fun deleteView_thenPreallocateView_recreatesView() {
    val smm = startSurface()

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    assertThat(smm.getViewExists(42)).isTrue()

    smm.deleteView(42)
    assertThat(smm.getViewExists(42)).isFalse()

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    assertThat(smm.getViewExists(42)).isTrue()
  }

  /**
   * Verifies that addViewAt gracefully handles an index that exceeds the parent's child count by
   * clamping to the end rather than crashing with IndexOutOfBoundsException.
   *
   * This reproduces the crash from T275193220 where a stale mount instruction specified index=7 but
   * the parent only had 6 children due to a timing race.
   */
  @Test
  fun addViewAt_clampsIndexWhenExceedingChildCount() {
    val smm = startSurface()

    // Create a parent view (tag 10) and add it to the root
    smm.createView("RCTView", 10, JavaOnlyMap.of(), null, null, true)
    smm.addViewAt(surfaceId, 10, 0)

    // Create child views
    smm.createView("RCTView", 20, JavaOnlyMap.of(), null, null, true)
    smm.createView("RCTView", 21, JavaOnlyMap.of(), null, null, true)
    smm.createView("RCTView", 22, JavaOnlyMap.of(), null, null, true)

    // Add two children to parent (indices 0, 1) — parent now has childCount = 2
    smm.addViewAt(10, 20, 0)
    smm.addViewAt(10, 21, 1)

    // Attempt to add a view at index 7 when parent only has 2 children.
    // Before the fix this would throw IllegalStateException wrapping IndexOutOfBoundsException.
    // After the fix it should clamp to childCount (2) and succeed.
    smm.addViewAt(10, 22, 7)

    // Verify the view was successfully added (clamped to end)
    assertThat(smm.getView(22)).isNotNull()
    assertThat(smm.getView(22)!!.parent).isNotNull()
  }
}
