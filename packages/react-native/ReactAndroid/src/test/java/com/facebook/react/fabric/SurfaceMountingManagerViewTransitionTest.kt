/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import android.app.Activity
import android.view.View
import android.view.ViewGroup
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
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Tests for [SurfaceMountingManager.addViewAt] with views that a parent still holds with
 * [ViewGroup.startViewTransition] after their removal.
 */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class SurfaceMountingManagerViewTransitionTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var themedReactContext: ThemedReactContext
  private val surfaceId = 1

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val reactContext = ReactTestHelper.createTestReactApplicationContext()
    themedReactContext = ThemedReactContext(reactContext, reactContext, null, -1)
    mountingManager =
        MountingManager(
            ViewManagerRegistry(listOf<ViewManager<*, *>>(ReactViewManager())),
            MountItemExecutor {},
        )
  }

  @Test
  fun addViewAt_movesHeldChildAndAllowsItsFinalRemoval() {
    val smm = startSurface()
    smm.createViews(SCREEN, CARRIER)
    smm.addViewAt(surfaceId, SCREEN, 0)
    smm.addViewAt(SCREEN, CARRIER, 0)
    val screen = smm.viewGroup(SCREEN)
    val carrier = smm.getView(CARRIER)

    screen.startViewTransition(carrier)
    smm.removeViewAt(CARRIER, SCREEN, 0)
    assertThat(carrier.parent).isSameAs(screen)

    smm.addViewAt(surfaceId, CARRIER, 1)
    assertThat(carrier.parent).isSameAs(smm.viewGroup(surfaceId))

    smm.removeViewAt(CARRIER, surfaceId, 1)
    assertThat(carrier.parent).isNull()
    assertThat(smm.viewGroup(surfaceId).indexOfChild(carrier)).isEqualTo(-1)
  }

  @Test
  fun addViewAt_movesNestedHeldChildrenAndAllowsTheirFinalRemoval() {
    val smm = startSurface()
    smm.createViews(SCREEN, CONTENT, CARRIER, INNER_CARRIER)
    smm.addViewAt(surfaceId, SCREEN, 0)
    smm.addViewAt(SCREEN, CONTENT, 0)
    smm.addViewAt(CONTENT, CARRIER, 0)
    smm.addViewAt(CARRIER, INNER_CARRIER, 0)
    val root = smm.viewGroup(surfaceId)
    val carrier = smm.getView(CARRIER)
    val innerCarrier = smm.getView(INNER_CARRIER)

    repeat(2) {
      smm.viewGroup(SCREEN).startViewTransition(smm.getView(CONTENT))
      smm.viewGroup(CONTENT).startViewTransition(carrier)
      smm.viewGroup(CARRIER).startViewTransition(innerCarrier)
    }
    smm.removeViewAt(INNER_CARRIER, CARRIER, 0)
    smm.removeViewAt(CARRIER, CONTENT, 0)
    assertThat(carrier.parent).isSameAs(smm.viewGroup(CONTENT))
    assertThat(innerCarrier.parent).isSameAs(carrier)

    smm.addViewAt(surfaceId, CARRIER, 1)
    smm.addViewAt(surfaceId, INNER_CARRIER, 2)
    assertThat(carrier.parent).isSameAs(root)
    assertThat(innerCarrier.parent).isSameAs(root)

    smm.removeViewAt(INNER_CARRIER, surfaceId, 2)
    smm.removeViewAt(CARRIER, surfaceId, 1)
    assertThat(innerCarrier.parent).isNull()
    assertThat(carrier.parent).isNull()
    assertThat(root.childCount).isEqualTo(1)
  }

  @Test
  fun addViewAt_movesHeldChildOfRootAttachedToWindow() {
    val smm = startSurface()
    attachToWindow(smm.getView(surfaceId))
    smm.createViews(SCREEN, CARRIER)
    smm.addViewAt(surfaceId, SCREEN, 0)
    smm.addViewAt(SCREEN, CARRIER, 0)
    val carrier = smm.getView(CARRIER)

    smm.viewGroup(SCREEN).startViewTransition(carrier)
    smm.removeViewAt(CARRIER, SCREEN, 0)
    assertThat(carrier.isAttachedToWindow).isTrue()

    smm.addViewAt(surfaceId, CARRIER, 1)
    assertThat(carrier.parent).isSameAs(smm.viewGroup(surfaceId))
    assertThat(carrier.isAttachedToWindow).isTrue()

    smm.removeViewAt(CARRIER, surfaceId, 1)
    assertThat(carrier.parent).isNull()
    assertThat(carrier.isAttachedToWindow).isFalse()
  }

  @Test
  fun addViewAt_reinsertsHeldChildIntoItsOldParent() {
    val smm = startSurface()
    smm.createViews(SCREEN, CONTENT, CARRIER)
    smm.addViewAt(surfaceId, SCREEN, 0)
    smm.addViewAt(SCREEN, CONTENT, 0)
    smm.addViewAt(SCREEN, CARRIER, 1)
    val screen = smm.viewGroup(SCREEN)
    val carrier = smm.getView(CARRIER)

    screen.startViewTransition(carrier)
    smm.removeViewAt(CARRIER, SCREEN, 1)
    smm.addViewAt(SCREEN, CARRIER, 0)
    assertThat(screen.indexOfChild(carrier)).isEqualTo(0)

    smm.removeViewAt(CARRIER, SCREEN, 0)
    assertThat(carrier.parent).isNull()
  }

  @Test
  fun addViewAt_keepsHoldOfRemovedChildThatIsNotReinserted() {
    val smm = startSurface()
    smm.createViews(SCREEN, CONTENT, NEXT_SCREEN)
    smm.addViewAt(surfaceId, SCREEN, 0)
    smm.addViewAt(SCREEN, CONTENT, 0)
    val screen = smm.viewGroup(SCREEN)
    val content = smm.getView(CONTENT)

    screen.startViewTransition(content)
    smm.removeViewAt(CONTENT, SCREEN, 0)
    smm.addViewAt(surfaceId, NEXT_SCREEN, 1)

    assertThat(content.parent).isSameAs(screen)
    assertThat(screen.indexOfChild(content)).isEqualTo(-1)
  }

  @Test
  fun addViewAt_movesChildThatIsNotHeld() {
    val smm = startSurface()
    smm.createViews(SCREEN, NEXT_SCREEN, CARRIER)
    smm.addViewAt(surfaceId, SCREEN, 0)
    smm.addViewAt(surfaceId, NEXT_SCREEN, 1)
    smm.addViewAt(SCREEN, CARRIER, 0)
    val carrier = smm.getView(CARRIER)

    smm.removeViewAt(CARRIER, SCREEN, 0)
    smm.addViewAt(NEXT_SCREEN, CARRIER, 0)
    assertThat(carrier.parent).isSameAs(smm.viewGroup(NEXT_SCREEN))

    smm.removeViewAt(CARRIER, NEXT_SCREEN, 0)
    assertThat(carrier.parent).isNull()
  }

  @Test
  fun addViewAt_keepsRecoveryForChildThatAnotherParentStillLists() {
    val smm = startSurface()
    smm.createViews(SCREEN, NEXT_SCREEN, CARRIER)
    smm.addViewAt(surfaceId, SCREEN, 0)
    smm.addViewAt(surfaceId, NEXT_SCREEN, 1)
    smm.addViewAt(SCREEN, CARRIER, 0)
    val nextScreen = smm.viewGroup(NEXT_SCREEN)
    val carrier = smm.getView(CARRIER)

    smm.addViewAt(NEXT_SCREEN, CARRIER, 0)
    assertThat(carrier.parent).isSameAs(nextScreen)
    assertThat(smm.viewGroup(SCREEN).indexOfChild(carrier)).isEqualTo(-1)

    smm.removeViewAt(CARRIER, NEXT_SCREEN, 0)
    assertThat(carrier.parent).isSameAs(nextScreen)
  }

  private fun startSurface(): SurfaceMountingManager {
    val rootView = ReactRootView(themedReactContext)
    mountingManager.startSurface(surfaceId, themedReactContext, rootView)
    return mountingManager.getSurfaceManagerEnforced(surfaceId, "test")
  }

  private fun attachToWindow(view: View) {
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(view)
  }

  private fun SurfaceMountingManager.createViews(vararg tags: Int) {
    for (tag in tags) {
      createView("RCTView", tag, JavaOnlyMap.of(), null, null, true)
    }
  }

  private fun SurfaceMountingManager.viewGroup(tag: Int): ViewGroup = getView(tag) as ViewGroup

  private companion object {
    const val SCREEN = 10
    const val CONTENT = 11
    const val CARRIER = 12
    const val INNER_CARRIER = 13
    const val NEXT_SCREEN = 14
  }
}
