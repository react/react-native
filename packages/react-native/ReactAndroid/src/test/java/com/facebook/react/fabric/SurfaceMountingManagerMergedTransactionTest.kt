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
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem.Companion.INSTRUCTION_CREATE
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem.Companion.INSTRUCTION_DELETE
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem.Companion.INSTRUCTION_INSERT
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem.Companion.INSTRUCTION_REMOVE
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Replays both native encoder orders against real Java mounting classes. The C++ order-selection
 * regression is in MountItemReorderingTest; these tests do not execute the C++ encoder through JNI.
 */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class SurfaceMountingManagerMergedTransactionTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var surface: SurfaceMountingManager
  private lateinit var viewManager: ReactViewManager
  private val softExceptions = mutableListOf<Throwable>()
  private val listener =
      ReactSoftExceptionLogger.ReactSoftExceptionListener { _, cause -> softExceptions.add(cause) }

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    viewManager = ReactViewManager()
    val context = ReactTestHelper.createTestReactApplicationContext()
    val themedContext = ThemedReactContext(context, context, null, SURFACE)
    mountingManager =
        MountingManager(
            ViewManagerRegistry(listOf<ViewManager<*, *>>(viewManager)),
            MountItemExecutor {},
        )
    mountingManager.startSurface(SURFACE, themedContext, ReactRootView(themedContext))
    surface = mountingManager.getSurfaceManagerEnforced(SURFACE, "test")
    ReactSoftExceptionLogger.addListener(listener)
    execute(
        intArrayOf(
            INSTRUCTION_CREATE,
            SOURCE_PARENT,
            1,
            INSTRUCTION_INSERT,
            SOURCE_PARENT,
            SURFACE,
            0,
            INSTRUCTION_CREATE,
            DESTINATION_PARENT,
            1,
            INSTRUCTION_INSERT,
            DESTINATION_PARENT,
            SURFACE,
            1,
            INSTRUCTION_CREATE,
            RECREATED_CHILD,
            1,
            INSTRUCTION_INSERT,
            RECREATED_CHILD,
            SOURCE_PARENT,
            0,
        ),
        createCount = 3,
    )
  }

  @After
  fun tearDown() {
    ReactSoftExceptionLogger.removeListener(listener)
    mountingManager.stopSurface(SURFACE)
  }

  @Test
  fun trailingDeleteMakesTheNextSiblingInsertOutOfBounds() {
    assertTrailingDeleteFails(removeClippedSubviews = false)
  }

  @Test
  fun trailingDeleteMakesTheNextClippedSiblingInsertOutOfBounds() {
    assertTrailingDeleteFails(removeClippedSubviews = true)
  }

  @Test
  fun mutationOrderPreservesTheReparentedChildAndNextSibling() {
    assertMutationOrderSucceeds(removeClippedSubviews = false)
  }

  @Test
  fun mutationOrderPreservesTheReparentedChildAndNextClippedSibling() {
    assertMutationOrderSucceeds(removeClippedSubviews = true)
  }

  private fun assertTrailingDeleteFails(removeClippedSubviews: Boolean) {
    destination().removeClippedSubviews = removeClippedSubviews
    assertThat(destination().removeClippedSubviews).isEqualTo(removeClippedSubviews)
    recreateChild(keepMutationOrder = false)
    assertThat(surface.getViewExists(RECREATED_CHILD)).isFalse()
    assertThat(viewManager.getChildCount(surface.getView(SOURCE_PARENT) as ReactViewGroup))
        .isEqualTo(1)

    val failure = assertThrows(IllegalStateException::class.java) { reparentAndInsertSibling() }

    assertThat(failure)
        .hasMessageContaining("view [$NEXT_SIBLING] into parent [$DESTINATION_PARENT] at index 1")
    assertThat(failure.cause).isInstanceOf(IndexOutOfBoundsException::class.java)
    assertThat(viewManager.getChildCount(destination())).isZero()
    assertThat(softExceptions.map { it.message })
        .contains("Unable to find viewState for tag: [$RECREATED_CHILD] for addViewAt")
  }

  private fun assertMutationOrderSucceeds(removeClippedSubviews: Boolean) {
    destination().removeClippedSubviews = removeClippedSubviews
    assertThat(destination().removeClippedSubviews).isEqualTo(removeClippedSubviews)
    recreateChild(keepMutationOrder = true)
    assertThat(surface.getViewExists(RECREATED_CHILD)).isTrue()

    reparentAndInsertSibling()

    assertThat(viewManager.getChildCount(surface.getView(SOURCE_PARENT) as ReactViewGroup)).isZero()
    assertThat(viewManager.getChildCount(destination())).isEqualTo(2)
    assertThat(viewManager.getChildAt(destination(), 0)).isSameAs(surface.getView(RECREATED_CHILD))
    assertThat(viewManager.getChildAt(destination(), 1)).isSameAs(surface.getView(NEXT_SIBLING))
    assertThat(softExceptions).isEmpty()
  }

  private fun recreateChild(keepMutationOrder: Boolean) {
    val remove = intArrayOf(INSTRUCTION_REMOVE, RECREATED_CHILD, SOURCE_PARENT, 0)
    val delete = intArrayOf(INSTRUCTION_DELETE, RECREATED_CHILD)
    val createAndInsert =
        intArrayOf(
            INSTRUCTION_CREATE,
            RECREATED_CHILD,
            1,
            INSTRUCTION_INSERT,
            RECREATED_CHILD,
            SOURCE_PARENT,
            0,
        )
    execute(
        if (keepMutationOrder) remove + delete + createAndInsert
        else remove + createAndInsert + delete,
        createCount = 1,
    )
  }

  private fun reparentAndInsertSibling() {
    execute(
        intArrayOf(
            INSTRUCTION_REMOVE,
            RECREATED_CHILD,
            SOURCE_PARENT,
            0,
            INSTRUCTION_INSERT,
            RECREATED_CHILD,
            DESTINATION_PARENT,
            0,
            INSTRUCTION_CREATE,
            NEXT_SIBLING,
            1,
            INSTRUCTION_INSERT,
            NEXT_SIBLING,
            DESTINATION_PARENT,
            1,
        ),
        createCount = 1,
    )
  }

  private fun destination(): ReactViewGroup = surface.getView(DESTINATION_PARENT) as ReactViewGroup

  private fun execute(instructions: IntArray, createCount: Int) {
    val objects = mutableListOf<Any?>()
    repeat(createCount) {
      objects.add("RCTView")
      objects.add(JavaOnlyMap.of())
      objects.add(null)
      objects.add(null)
    }
    IntBufferBatchMountItem(SURFACE, instructions, objects.toTypedArray(), 0)
        .execute(mountingManager)
  }

  private companion object {
    const val SURFACE = 1
    const val SOURCE_PARENT = 10
    const val RECREATED_CHILD = 480
    const val DESTINATION_PARENT = 482
    const val NEXT_SIBLING = 1712
  }
}
