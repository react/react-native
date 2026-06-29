/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.app.Activity
import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
class ReactViewGroupTest {

  private lateinit var context: Context

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = Robolectric.buildActivity(Activity::class.java).create().get()
  }

  @Test
  fun `View clipping - ensure allChildren properly resizes when adding views in sequence`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    for (i in 0..20) {
      rvg.addViewWithSubviewClippingEnabled(TestView(context, i * 10), i)
    }
    rvg.updateClippingRect()
    assertThat(rvg.childCount).isEqualTo(10)
  }

  @Test
  fun `View clipping - ensure allChildren properly resizes when adding views out of sequence`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    for (i in 0..10) {
      rvg.addViewWithSubviewClippingEnabled(TestView(context, i * 10), i)
    }
    repeat(10) { rvg.addViewWithSubviewClippingEnabled(TestView(context, 90), 10) }
    rvg.updateClippingRect()
    assertThat(rvg.childCount).isEqualTo(20)
  }

  @Test
  fun `ClippingAwareViewRemover - removes a tracked child from a clipping parent without leaving a stale entry`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    val child = TestView(context, 0)
    rvg.addViewWithSubviewClippingEnabled(child, 0)
    rvg.updateClippingRect()
    assertThat(rvg.allChildrenCount).isEqualTo(1)
    assertThat(child.parent).isSameAs(rvg)

    ClippingAwareViewRemover.removeFromParent(child)

    // The clipping bookkeeping stays in sync (no stale allChildren entry) ...
    assertThat(rvg.allChildrenCount).isEqualTo(0)
    assertThat(child.parent).isNull()
    // ... so a subsequent clipping pass does not trip the invalid-clipping-state invariant.
    rvg.updateClippingRect()
  }

  @Test
  fun `ClippingAwareViewRemover - falls back to a plain removeView for a non-clipping parent`() {
    val parent = ReactViewGroup(context)
    val child = TestView(context, 0)
    parent.addView(child)
    assertThat(child.parent).isSameAs(parent)

    ClippingAwareViewRemover.removeFromParent(child)

    assertThat(child.parent).isNull()
    assertThat(parent.childCount).isEqualTo(0)
  }

  @Test
  fun `removeViewWithSubviewClippingEnabled - is a no-op for a view not tracked in allChildren`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true

    // A view that was never added through the clipping-aware path is not in allChildren; removing
    // it must not index allChildren[-1] / throw (it logs a soft exception and returns instead).
    rvg.removeViewWithSubviewClippingEnabled(TestView(context, 0))

    assertThat(rvg.allChildrenCount).isEqualTo(0)
  }

  @Test
  fun `ClippingAwareViewRemover - detaches an attached child that is not tracked in allChildren`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    // Add through the raw ViewGroup API so the child is a real child but is NOT tracked in
    // allChildren (the clipping-aware removal can't find it).
    val child = TestView(context, 0)
    rvg.addView(child)
    assertThat(child.parent).isSameAs(rvg)
    assertThat(rvg.allChildrenCount).isEqualTo(0)

    ClippingAwareViewRemover.removeFromParent(child)

    // The clipping-aware removal returns early (untracked); the helper's removeView fallback still
    // detaches the child.
    assertThat(child.parent).isNull()
  }
}

class TestView(context: Context, yPos: Int) : View(context) {
  init {
    left = 0
    right = 100
    top = yPos
    bottom = top + 10
  }
}

class TestParent(context: Context) : ViewGroup(context) {
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit
}
