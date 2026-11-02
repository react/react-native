/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import android.app.Activity
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.spy
import org.mockito.kotlin.verify
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class IntBufferBatchMountItemTest {
  private val surfaceId = 1
  private lateinit var mountingManager: MountingManager
  private lateinit var surface: SurfaceMountingManager
  private lateinit var root: FrameLayout
  private lateinit var viewManager: RecordingViewManager

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableDeferredViewCleanupAndroid() = true
        }
    )
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    root = FrameLayout(activity)
    activity.setContentView(root)
    val reactContext = ReactTestHelper.createTestReactApplicationContext(activity.application)
    val context = ThemedReactContext(reactContext, activity, null, surfaceId)
    viewManager = RecordingViewManager()
    mountingManager =
        MountingManager(ViewManagerRegistry(listOf(viewManager)), MountItemExecutor {})
    surface = mountingManager.startSurface(surfaceId, context, root)
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun mount(tag: Int, parentTag: Int, index: Int): View {
    surface.preallocateView("RCTView", tag, JavaOnlyMap.of(), null, true)
    surface.addViewAt(parentTag, tag, index)
    return surface.getView(tag)
  }

  private fun execute(vararg instructions: Int) {
    IntBufferBatchMountItem(surfaceId, instructions, emptyArray(), 0).execute(mountingManager)
  }

  @Test
  fun customManager_preservesIndividualRemovalsAndDropOrder() {
    val panel = mount(2, surfaceId, 0)
    val row = mount(4, 2, 0)
    val child = mount(6, 4, 0)
    assertThat(child.isAttachedToWindow).isTrue()

    execute(
        REMOVE_MULTIPLE,
        3,
        6,
        4,
        0,
        4,
        2,
        0,
        2,
        surfaceId,
        0,
        DELETE_MULTIPLE,
        3,
        6,
        4,
        2,
    )

    assertThat(viewManager.attachedParentsAtRemoval).containsExactly(true, true)
    assertThat(root.childCount).isZero()
    assertThat(listOf(panel, row, child).map { it.parent }).containsOnlyNulls()
    assertThat(viewManager.droppedTags).containsExactly(6, 4, 2)
    for (tag in intArrayOf(2, 4, 6)) {
      assertThat(surface.getViewExists(tag)).isFalse()
    }
  }

  @Test
  fun unmountSiblings_preservesRemovalIndicesAndSurvivingChildren() {
    val survivor = mount(2, surfaceId, 0)
    mount(4, surfaceId, 1)
    mount(6, 4, 0)
    mount(8, surfaceId, 2)
    mount(10, 8, 0)

    execute(
        REMOVE_MULTIPLE,
        4,
        6,
        4,
        0,
        10,
        8,
        0,
        8,
        surfaceId,
        2,
        4,
        surfaceId,
        1,
        DELETE_MULTIPLE,
        4,
        6,
        4,
        10,
        8,
    )

    assertThat(root.childCount).isEqualTo(1)
    assertThat(root.getChildAt(0)).isSameAs(survivor)
    assertThat(viewManager.attachedParentsAtRemoval).containsExactly(true, true)
    assertThat(viewManager.droppedTags).containsExactly(6, 4, 10, 8)
  }

  @Test
  fun removeAndReinsertSubtree_keepsViewsAlive() {
    val destination = mount(2, surfaceId, 0)
    val panel = mount(4, surfaceId, 1)
    val child = mount(6, 4, 0)

    execute(
        REMOVE_MULTIPLE,
        2,
        6,
        4,
        0,
        4,
        surfaceId,
        1,
        INSERT,
        4,
        2,
        0,
        INSERT,
        6,
        4,
        0,
    )

    assertThat(panel.parent).isSameAs(destination)
    assertThat(child.parent).isSameAs(panel)
    assertThat(child.isAttachedToWindow).isTrue()
    assertThat(viewManager.droppedTags).isEmpty()
  }

  @Test
  fun deleteAndRecreateTag_destroysOldEmitterInSameBatch() {
    val oldPanel = mount(2, surfaceId, 0)
    val oldChild = mount(4, 2, 0)
    val emitter: EventEmitterWrapper = mock()
    surface.updateEventEmitter(4, emitter)

    IntBufferBatchMountItem(
            surfaceId,
            intArrayOf(
                REMOVE_MULTIPLE,
                2,
                4,
                2,
                0,
                2,
                surfaceId,
                0,
                DELETE_MULTIPLE,
                2,
                4,
                2,
                CREATE,
                2,
                1,
                INSERT,
                2,
                surfaceId,
                0,
            ),
            arrayOf("RCTView", JavaOnlyMap.of(), null, null),
            0,
        )
        .execute(mountingManager)

    verify(emitter).destroy()
    assertThat(viewManager.droppedTags).containsExactly(4, 2)
    assertThat(surface.getView(2)).isNotSameAs(oldPanel)
    assertThat(surface.getView(2).parent).isSameAs(root)
    assertThat(oldChild.parent).isNull()
    assertThat(surface.getViewExists(4)).isFalse()
  }

  @Test
  fun activeTouch_delaysDeletionUntilTouchEnds() {
    mount(2, surfaceId, 0)
    val child = mount(4, 2, 0)
    surface.markActiveTouchForTag(4)

    execute(
        REMOVE_MULTIPLE,
        2,
        4,
        2,
        0,
        2,
        surfaceId,
        0,
        DELETE_MULTIPLE,
        2,
        4,
        2,
    )

    assertThat(child.parent).isNull()
    assertThat(surface.getViewExists(4)).isTrue()
    assertThat(viewManager.droppedTags).containsExactly(2)
    surface.sweepActiveTouchForTag(4)
    assertThat(surface.getViewExists(4)).isFalse()
    assertThat(viewManager.droppedTags).containsExactly(2, 4)
  }

  @Test
  fun clippedSubtree_removesLogicalChildrenAndDropsEachViewOnce() {
    val panel = mount(2, surfaceId, 0) as ReactViewGroup
    mount(4, 2, 0)
    mount(6, 2, 1)
    panel.removeClippedSubviews = true

    execute(
        REMOVE_MULTIPLE,
        3,
        6,
        2,
        1,
        4,
        2,
        0,
        2,
        surfaceId,
        0,
        DELETE_MULTIPLE,
        3,
        6,
        4,
        2,
    )

    assertThat(panel.allChildrenCount).isZero()
    assertThat(root.childCount).isZero()
    assertThat(viewManager.droppedTags).containsExactly(6, 4, 2)
  }

  @Test
  fun separateRemovalGroups_doNotMoveRemovalsAcrossOtherInstructions() {
    val panel = mount(2, surfaceId, 0)
    val child = mount(4, 2, 0)

    execute(
        REMOVE,
        4,
        2,
        0,
        INSERT,
        4,
        2,
        0,
        REMOVE_MULTIPLE,
        2,
        4,
        2,
        0,
        2,
        surfaceId,
        0,
    )

    assertThat(viewManager.attachedParentsAtRemoval).containsExactly(true, true)
    assertThat(panel.parent).isNull()
    assertThat(child.parent).isNull()
  }

  @Test
  fun disableMountItemReordering_preservesOriginalRemovalOrder() {
    ReactNativeFeatureFlags.dangerouslyReset()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun disableMountItemReorderingAndroid() = true

          override fun enableDeferredViewCleanupAndroid() = true
        }
    )
    mount(2, surfaceId, 0)
    mount(4, 2, 0)
    mount(6, 4, 0)

    execute(
        REMOVE_MULTIPLE,
        3,
        6,
        4,
        0,
        4,
        2,
        0,
        2,
        surfaceId,
        0,
    )

    assertThat(viewManager.attachedParentsAtRemoval).containsExactly(true, true)
    assertThat(root.childCount).isZero()
  }

  private class RecordingViewManager : ReactViewManager() {
    val attachedParentsAtRemoval = mutableListOf<Boolean>()
    val droppedTags = mutableListOf<Int>()

    override fun removeViewAt(parent: ReactViewGroup, index: Int) {
      attachedParentsAtRemoval.add(parent.isAttachedToWindow)
      super.removeViewAt(parent, index)
    }

    override fun onDropViewInstance(view: ReactViewGroup) {
      droppedTags.add(view.id)
      super.onDropViewInstance(view)
    }
  }

  companion object {
    private const val REMOVE_MULTIPLE = IntBufferBatchMountItem.INSTRUCTION_REMOVE or 1
    private const val DELETE_MULTIPLE = IntBufferBatchMountItem.INSTRUCTION_DELETE or 1
    private const val INSERT = IntBufferBatchMountItem.INSTRUCTION_INSERT
    private const val REMOVE = IntBufferBatchMountItem.INSTRUCTION_REMOVE
    private const val CREATE = IntBufferBatchMountItem.INSTRUCTION_CREATE
  }
}
