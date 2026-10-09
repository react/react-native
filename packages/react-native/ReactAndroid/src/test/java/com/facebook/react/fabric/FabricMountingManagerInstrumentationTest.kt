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
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsCxxInterop
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.events.BatchEventDispatchedListener
import com.facebook.react.views.view.ReactViewManager
import com.facebook.soloader.SoLoader
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
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
    ReactNativeFeatureFlagsCxxInterop.dangerouslyReset()
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

  @Test
  fun writableNativeMap_mutationAfterImportingValues_preservesCachedPointers() {
    val map = WritableNativeMap()
    map.putDouble("opacity", 1.0)

    assertThat(map.hasKey("opacity")).isTrue()
    assertThat(map.getType("opacity")).isEqualTo(ReadableType.Number)

    map.putDouble("opacity", 0.3)
    repeat(64) { map.putInt("newKey$it", it) }

    val entry = map.entryIterator.next()
    assertThat(entry.key).isEqualTo("opacity")
    assertThat(entry.value).isEqualTo(0.3)
  }

  /**
   * Simulates the scenario fixed by D98729251 via IntBufferBatchMountItem:
   * 1. Preallocate a view (simulates the C++ preallocation drain calling Java preallocateView)
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

  private fun createFabricUIManager(): FabricUIManager {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val reactAppContext = mock(ReactApplicationContext::class.java)
    `when`(reactAppContext.applicationContext).thenReturn(context)
    `when`(reactAppContext.exceptionHandler).thenReturn(JSExceptionHandler {})
    val viewManagerRegistry = ViewManagerRegistry(listOf<ViewManager<*, *>>(ReactViewManager()))
    return FabricUIManager(reactAppContext, viewManagerRegistry, BatchEventDispatchedListener {})
  }

  private fun createTestHelper(): FabricMountingManagerTestHelper =
      FabricMountingManagerTestHelper.create(createFabricUIManager())

  /** Enables the pull model in the C++ feature flags that the helper's native code reads. */
  private fun enablePullModel() {
    ReactNativeFeatureFlagsCxxInterop.dangerouslyForceOverride(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableMountingCoordinatorPullModelAndroid(): Boolean = true
        }
    )
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
   * Exercises the real C++ preallocation queue — verifies the tag is added to
   * allocatedViewRegistry_.
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

  /**
   * Runs a batch through the real C++ encoder, the JNI call and the Kotlin decoder, and checks the
   * props that reach the mounted views. The C++ and Kotlin command tables must stay in sync.
   */
  @Test
  fun native_synchronouslyUpdateAnimatedProps_appliesEncodedBatchToViews() {
    val fabricUIManager = createFabricUIManager()
    val helper = FabricMountingManagerTestHelper.create(fabricUIManager)
    val uiMountingManager =
        FabricUIManager::class
            .java
            .getDeclaredField("mMountingManager")
            .apply { isAccessible = true }
            .get(fabricUIManager) as MountingManager
    uiMountingManager.startSurface(surfaceId, themedReactContext, ReactRootView(themedReactContext))
    for ((index, tag) in intArrayOf(42, 43, 44).withIndex()) {
      createAndInsertMountItem(tag, surfaceId, index).execute(uiMountingManager)
    }

    val opacity = WritableNativeMap().apply { putDouble("opacity", 0.25) }
    val transform =
        WritableNativeMap().apply {
          putArray(
              "transform",
              WritableNativeArray().apply {
                pushMap(WritableNativeMap().apply { putDouble("translateX", 10.0) })
                pushMap(WritableNativeMap().apply { putString("rotate", "90deg") })
                pushMap(WritableNativeMap().apply { putDouble("scale", 2.0) })
              },
          )
        }
    val rawFallback =
        WritableNativeMap().apply {
          putDouble("opacity", 0.5)
          putString("testID", "animated-view")
        }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      helper.synchronouslyUpdateAnimatedProps(
          intArrayOf(42, 43, 44),
          arrayOf(opacity, transform, rawFallback),
      )
    }

    val smm = uiMountingManager.getSurfaceManagerEnforced(surfaceId, "test")
    assertThat(smm.getView(42).alpha).isEqualTo(0.25f)
    val transformed = smm.getView(43)
    assertThat(transformed.translationX).isCloseTo(PixelUtil.toPixelFromDIP(10.0), within(0.01f))
    assertThat(transformed.rotation).isCloseTo(90f, within(0.01f))
    assertThat(transformed.scaleX).isCloseTo(2f, within(0.001f))
    assertThat(transformed.scaleY).isCloseTo(2f, within(0.001f))
    val fallbackView = smm.getView(44)
    assertThat(fallbackView.alpha).isEqualTo(0.5f)
    assertThat(fallbackView.tag).isEqualTo("animated-view")
  }

  /**
   * In the pull model, a view whose family is destroyed before the queue drains must not be
   * preallocated: no family callback is left to destroy it.
   */
  @Test
  fun native_drainPreallocationQueue_pullModel_skipsViewWhoseFamilyWasDestroyed() {
    enablePullModel()
    val helper = createTestHelper()
    helper.startSurface(surfaceId)
    helper.queuePreallocation(surfaceId, 42)
    helper.dropFamily(42)

    helper.drainPreallocationQueue()

    assertThat(helper.isTagAllocated(surfaceId, 42)).isFalse()
  }

  /** Without the pull model, a committed family does not destroy its view. */
  @Test
  fun native_destroyCommittedView_keepsPreallocatedView() {
    val helper = createTestHelper()
    helper.startSurface(surfaceId)
    helper.preallocateView(surfaceId, 42)

    helper.destroyCommittedView(surfaceId, 42)

    assertThat(helper.isTagAllocated(surfaceId, 42)).isTrue()
  }

  /**
   * A pull can skip the commits that created and deleted the view of a committed family. Its
   * preallocated view is destroyed with the family.
   */
  @Test
  fun native_destroyCommittedView_pullModel_destroysPreallocatedView() {
    enablePullModel()
    val helper = createTestHelper()
    helper.startSurface(surfaceId)
    helper.preallocateView(surfaceId, 42)

    helper.destroyCommittedView(surfaceId, 42)

    assertThat(helper.isTagAllocated(surfaceId, 42)).isFalse()
  }

  /**
   * In the pull model, a family can be destroyed before the pending Delete of its mounted view
   * executes. A view that a mount created stays registered until that Delete.
   */
  @Test
  fun native_destroyCommittedView_pullModel_keepsViewCreatedByMount() {
    enablePullModel()
    val helper = createTestHelper()
    helper.startSurface(surfaceId)
    helper.preallocateView(surfaceId, 42)
    helper.mountCreate(surfaceId, 42)

    helper.destroyCommittedView(surfaceId, 42)

    assertThat(helper.isTagAllocated(surfaceId, 42)).isTrue()
  }
}
