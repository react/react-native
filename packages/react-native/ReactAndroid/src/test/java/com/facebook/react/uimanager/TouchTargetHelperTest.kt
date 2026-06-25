/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/**
 * Regression tests for facebook/react-native#50797: a view with a non-invertible transform (e.g.
 * `scaleX: 0` or `scaleY: 0`) must not receive touches, and must not silently reuse the cached
 * inverse matrix of a previously-processed view.
 */
@RunWith(RobolectricTestRunner::class)
class TouchTargetHelperTest {

  private lateinit var context: Context
  private lateinit var root: ViewGroup

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = RuntimeEnvironment.getApplication()
    root = FrameLayout(context)
    root.id = ROOT_TAG
    root.measure(500, 500)
    root.layout(0, 0, 500, 500)
  }

  @Test
  fun normalChild_receivesTouchInsideItsBounds() {
    val child = ReactViewGroup(context)
    child.id = CHILD_TAG
    root.addView(child)
    child.layout(0, 0, 200, 200)

    val tag = TouchTargetHelper.findTargetTagForTouch(100f, 100f, root)

    assertThat(tag).isEqualTo(CHILD_TAG)
  }

  @Test
  fun zeroScaleY_childDoesNotReceiveTouch() {
    val child = ReactViewGroup(context)
    child.id = CHILD_TAG
    root.addView(child)
    child.layout(0, 0, 200, 200)
    child.scaleY = 0f

    val tag = TouchTargetHelper.findTargetTagForTouch(100f, 100f, root)

    // Touch falls through to the root because the child is visually degenerate.
    assertThat(tag).isEqualTo(ROOT_TAG)
  }

  @Test
  fun zeroScaleX_childDoesNotReceiveTouch() {
    val child = ReactViewGroup(context)
    child.id = CHILD_TAG
    root.addView(child)
    child.layout(0, 0, 200, 200)
    child.scaleX = 0f

    val tag = TouchTargetHelper.findTargetTagForTouch(100f, 100f, root)

    assertThat(tag).isEqualTo(ROOT_TAG)
  }

  @Test
  fun zeroScaleYParent_childInsideIsNotTouchable() {
    val parent = ReactViewGroup(context)
    parent.id = PARENT_TAG
    val child = ReactViewGroup(context)
    child.id = CHILD_TAG
    root.addView(parent)
    parent.addView(child)
    parent.layout(0, 0, 200, 200)
    child.layout(0, 0, 200, 200)
    parent.scaleY = 0f

    val tag = TouchTargetHelper.findTargetTagForTouch(100f, 100f, root)

    // Neither the zero-scaled parent nor its child should receive the touch.
    assertThat(tag).isEqualTo(ROOT_TAG)
  }

  @Test
  fun zeroScaleY_doesNotInheritHitRegionFromSibling() {
    // This is the exact #50797 symptom: a zero-scaled subtree "inherits" the hit region of
    // another view because `Matrix.invert` fails silently and the cached inverse from the
    // previous successful invert is reused.
    val scaledSibling = ReactViewGroup(context)
    scaledSibling.id = SIBLING_TAG
    val zeroScaled = ReactViewGroup(context)
    zeroScaled.id = CHILD_TAG
    root.addView(scaledSibling)
    root.addView(zeroScaled)
    // Sibling: a normally-hit-testable view with a non-identity (invertible) transform, so that
    // `inverseMatrix` gets populated during traversal.
    scaledSibling.layout(0, 0, 200, 200)
    scaledSibling.scaleY = 0.5f
    // Zero-scaled view is placed somewhere the touch would only land on if the sibling's
    // inverse matrix were (wrongly) applied to it.
    zeroScaled.layout(300, 300, 500, 500)
    zeroScaled.scaleY = 0f

    val tag = TouchTargetHelper.findTargetTagForTouch(100f, 100f, root)

    // Must hit the sibling (visible, scale 0.5) — never the zero-scaled view.
    assertThat(tag).isEqualTo(SIBLING_TAG)
  }

  @Test
  fun scaleTransitionedToZero_stopsReceivingTouches() {
    // Second variant of #50797: a view whose scale shrinks from 0.9 to 0 keeps responding to
    // touches over its previous hit region because the cached inverse from the 0.9 frame is
    // reused after `invert` fails.
    val child = ReactViewGroup(context)
    child.id = CHILD_TAG
    root.addView(child)
    child.layout(0, 0, 200, 200)

    // Warm the cache with an invertible transform.
    child.scaleY = 0.9f
    val warmTag = TouchTargetHelper.findTargetTagForTouch(100f, 100f, root)
    assertThat(warmTag).isEqualTo(CHILD_TAG)

    // Now collapse the view.
    child.scaleY = 0f
    val coldTag = TouchTargetHelper.findTargetTagForTouch(100f, 100f, root)

    assertThat(coldTag).isEqualTo(ROOT_TAG)
  }

  @Test
  fun zeroScaleChild_doesNotAppearInTouchPath() {
    val child = ReactViewGroup(context)
    child.id = CHILD_TAG
    root.addView(child)
    child.layout(0, 0, 200, 200)
    child.scaleY = 0f

    val eventCoords = FloatArray(2)
    val path = TouchTargetHelper.findTargetPathAndCoordinatesForTouch(100f, 100f, root, eventCoords)

    val ids: List<Int> = path.map(TouchTargetHelper.ViewTarget::getViewId)
    assertThat(ids).doesNotContain(CHILD_TAG)
  }

  private companion object {
    const val ROOT_TAG = 1
    const val PARENT_TAG = 2
    const val CHILD_TAG = 3
    const val SIBLING_TAG = 4
  }
}
