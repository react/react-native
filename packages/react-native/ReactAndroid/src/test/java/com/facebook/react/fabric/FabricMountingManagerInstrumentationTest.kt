/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.events.BatchEventDispatchedListener
import com.facebook.react.views.view.ReactViewManager
import com.facebook.soloader.SoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

/**
 * Instrumentation tests for [MountingManager] that run on a real Android device/emulator.
 *
 * These tests construct [IntBufferBatchMountItem] objects manually (the same format that C++
 * executeMount serializes mutations into) and execute them against a [MountingManager]. This
 * validates that the Java-side mount item dispatcher correctly handles the Create→Insert and
 * Preallocate→Delete→Create→Insert sequences.
 */
@RunWith(AndroidJUnit4::class)
class FabricMountingManagerInstrumentationTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var themedReactContext: ThemedReactContext
  private val surfaceId = 1

  companion object {
    @BeforeClass
    @JvmStatic
    fun setupClass() {
      SoLoader.init(InstrumentationRegistry.getInstrumentation().targetContext, false)
    }
  }

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val reactAppContext = mock(ReactApplicationContext::class.java)
    themedReactContext = ThemedReactContext(reactAppContext, context, null, surfaceId)
    mountingManager =
        MountingManager(
            ViewManagerRegistry(listOf<ViewManager<*, *>>(ReactViewManager())),
            MountItemExecutor {},
        )
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun startSurface() {
    val rootView = ReactRootView(themedReactContext)
    mountingManager.startSurface(surfaceId, themedReactContext, rootView)
  }

  private fun createAndInsertMountItem(
      reactTag: Int,
      parentTag: Int,
      index: Int,
      componentName: String = "RCTView",
  ): IntBufferBatchMountItem {
    val intBuffer =
        intArrayOf(
            IntBufferBatchMountItem.INSTRUCTION_CREATE,
            reactTag,
            1,
            IntBufferBatchMountItem.INSTRUCTION_INSERT,
            reactTag,
            parentTag,
            index,
        )
    val objBuffer = arrayOf<Any?>(componentName, JavaOnlyMap.of(), null, null)
    return IntBufferBatchMountItem(surfaceId, intBuffer, objBuffer, 1)
  }

  /** Basic test: CREATE + INSERT via IntBufferBatchMountItem produces a mounted view. */
  @Test
  fun executeMount_createAndInsert_producesView() {
    startSurface()

    val mountItem = createAndInsertMountItem(42, surfaceId, 0)
    mountItem.execute(mountingManager)

    val smm = mountingManager.getSurfaceManagerEnforced(surfaceId, "test")
    assertThat(smm.getViewExists(42)).isTrue()
    assertThat(smm.getView(42)).isNotNull()
  }

  /**
   * Simulates the scenario fixed by D98729251 via IntBufferBatchMountItem:
   * 1. Preallocate a view (simulates C++ preallocateShadowView calling Java preallocateView)
   * 2. Delete it (simulates C++ destroyUnmountedShadowNode calling Java destroyUnmountedView)
   * 3. CREATE + INSERT via batch mount item (simulates C++ executeMount after the fix erases from
   *    allocatedViewRegistry_, so CREATE is included in the batch)
   */
  @Test
  fun executeMount_createAfterPreallocateAndDelete_succeeds() {
    startSurface()
    val smm = mountingManager.getSurfaceManagerEnforced(surfaceId, "test")

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    assertThat(smm.getViewExists(42)).isTrue()

    smm.deleteView(42)
    assertThat(smm.getViewExists(42)).isFalse()

    val mountItem = createAndInsertMountItem(42, surfaceId, 0)
    mountItem.execute(mountingManager)

    assertThat(smm.getViewExists(42)).isTrue()
    assertThat(smm.getView(42)).isNotNull()
  }

  /**
   * Multiple tags go through preallocate → delete → recreate cycle. Simulates a concurrent render
   * being superseded.
   */
  @Test
  fun executeMount_multipleTagsRecycledAfterConcurrentRenderCancellation() {
    startSurface()
    val smm = mountingManager.getSurfaceManagerEnforced(surfaceId, "test")

    for (tag in intArrayOf(42, 43, 44)) {
      smm.preallocateView("RCTView", tag, JavaOnlyMap.of(), null, true)
    }

    for (tag in intArrayOf(42, 43, 44)) {
      smm.deleteView(tag)
      assertThat(smm.getViewExists(tag)).isFalse()
    }

    for ((index, tag) in intArrayOf(42, 43, 44).withIndex()) {
      val mountItem = createAndInsertMountItem(tag, surfaceId, index)
      mountItem.execute(mountingManager)
      assertThat(smm.getViewExists(tag)).isTrue()
      assertThat(smm.getView(tag)).isNotNull()
    }
  }

  /**
   * REMOVE + DELETE + CREATE + INSERT for the same tag in a single batch. Simulates full lifecycle
   * during tree reconciliation.
   */
  @Test
  fun executeMount_removeDeleteCreateInsert_sameTagInOneBatch() {
    startSurface()
    val smm = mountingManager.getSurfaceManagerEnforced(surfaceId, "test")

    val initialMount = createAndInsertMountItem(42, surfaceId, 0)
    initialMount.execute(mountingManager)
    assertThat(smm.getView(42)).isNotNull()

    val intBuffer =
        intArrayOf(
            IntBufferBatchMountItem.INSTRUCTION_REMOVE,
            42,
            surfaceId,
            0,
            IntBufferBatchMountItem.INSTRUCTION_DELETE,
            42,
            IntBufferBatchMountItem.INSTRUCTION_CREATE,
            42,
            1,
            IntBufferBatchMountItem.INSTRUCTION_INSERT,
            42,
            surfaceId,
            0,
        )
    val objBuffer = arrayOf<Any?>("RCTView", JavaOnlyMap.of(), null, null)
    val batchMount = IntBufferBatchMountItem(surfaceId, intBuffer, objBuffer, 2)
    batchMount.execute(mountingManager)

    assertThat(smm.getViewExists(42)).isTrue()
    assertThat(smm.getView(42)).isNotNull()
  }

  // ---- Native code tests via FabricMountingManagerTestHelper ----

  private fun createTestHelper(): FabricMountingManagerTestHelper {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val reactAppContext = mock(ReactApplicationContext::class.java)
    `when`(reactAppContext.applicationContext).thenReturn(context)
    `when`(reactAppContext.exceptionHandler).thenReturn(JSExceptionHandler {})
    val viewManagerRegistry = ViewManagerRegistry(listOf<ViewManager<*, *>>(ReactViewManager()))
    val fabricUIManager =
        FabricUIManager(reactAppContext, viewManagerRegistry, BatchEventDispatchedListener {})
    return FabricMountingManagerTestHelper.create(fabricUIManager)
  }

  /**
   * Exercises the real C++ FabricMountingManager::onSurfaceStart and verifies the surfaceId tag is
   * registered in allocatedViewRegistry_.
   */
  @Test
  fun native_startSurface_registersSurfaceTag() {
    val helper = createTestHelper()
    helper.startSurface(surfaceId)
    assertThat(helper.isTagAllocated(surfaceId, surfaceId)).isTrue()
  }

  /**
   * Exercises real C++ preallocateShadowView — verifies the tag is added to allocatedViewRegistry_.
   */
  @Test
  fun native_preallocateView_addsToRegistry() {
    val helper = createTestHelper()
    helper.startSurface(surfaceId)
    helper.preallocateView(surfaceId, 42)
    assertThat(helper.isTagAllocated(surfaceId, 42)).isTrue()
  }

  /**
   * Verifies that stopSurface clears the allocatedViewRegistry_ for the surface, even if views were
   * preallocated.
   */
  @Test
  fun native_stopSurface_clearsRegistry() {
    val helper = createTestHelper()
    helper.startSurface(surfaceId)
    helper.preallocateView(surfaceId, 42)
    assertThat(helper.isTagAllocated(surfaceId, 42)).isTrue()

    helper.stopSurface(surfaceId)
    assertThat(helper.isTagAllocated(surfaceId, 42)).isFalse()
  }

  @Test
  fun native_destroyUnmountedView_removesFromAllocatedRegistry() {
    val helper = createTestHelper()
    helper.startSurface(surfaceId)
    helper.preallocateView(surfaceId, 42)
    assertThat(helper.isTagAllocated(surfaceId, 42)).isTrue()
    helper.destroyUnmountedView(surfaceId, 42)
    assertThat(helper.isTagAllocated(surfaceId, 42)).isFalse()
  }
}
