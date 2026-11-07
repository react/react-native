/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.app.Activity
import android.content.Context
import android.graphics.BlendMode
import android.graphics.Canvas
import android.graphics.Paint
import android.view.FocusFinder
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.R
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.HasElevatedDescendantCache
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

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
  fun `mix blend mode - drawing a child reads no sibling's blend mode`() {
    fun blendModeReadsPerChild(childCount: Int): Int {
      val rvg = ReactViewGroup(context)
      val children = List(childCount) { BlendModeReadCountingView(context) }
      children.forEach { rvg.addView(it) }
      rvg.layout(0, 0, 100, 100)
      rvg.draw(Canvas())
      return children.maxOf { it.blendModeReads }
    }

    assertThat(blendModeReadsPerChild(20)).isEqualTo(blendModeReadsPerChild(2))
  }

  @Test
  fun `mix blend mode - a child with a blend mode draws into a layer with that blend mode`() {
    val rvg = ReactViewGroup(context)
    rvg.addView(View(context))
    rvg.addView(View(context).apply { setTag(R.id.mix_blend_mode, BlendMode.MULTIPLY) })
    rvg.addView(View(context))
    rvg.layout(0, 0, 100, 100)
    val canvas = LayerRecordingCanvas()
    rvg.draw(canvas)
    assertThat(canvas.layerBlendModes).containsExactly(null, BlendMode.MULTIPLY)
  }

  @Test
  fun `auto offscreen compositing - true when flag on, alpha lt 1, and elevated descendant`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - true even at alpha 1 so the layer is ready for a later alpha change`() {
    // Returning true at full opacity is what bakes the offscreen decision into the RenderNode, so a
    // later alpha change -- including a native-driver opacity animation -- composites uniformly. No
    // layer is actually allocated until alpha < 1, so this costs nothing while opaque.
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 1f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - false when there is no elevated descendant`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    mount(rvg, View(context))
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - false when flag is off`() {
    overrideAutoOffscreenFlag(false)
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - detects a nested elevated descendant`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    inner.addView(elevatedChild())
    mount(rvg, inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - detects an elevated view inside a non-ReactViewGroup container`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val container = FrameLayout(context)
    container.addView(elevatedChild())
    mount(rvg, container)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidation bubbles through a non-ReactViewGroup ancestor`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val container = FrameLayout(context)
    val inner = ReactViewGroup(context)
    rvg.addView(container)
    container.addView(inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
    // An elevated view mounted deep under a non-RVG container must still invalidate the RVG
    // ancestor.
    inner.addView(elevatedChild())
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - reflects an elevated child added after a prior query`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
    mount(rvg, elevatedChild())
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - false once the elevated descendant is removed`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val child = elevatedChild()
    mount(rvg, child)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
    unmount(rvg, child)
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `needsOffscreenAlphaCompositing forces overlapping rendering regardless of flag`() {
    val rvg = ReactViewGroup(context)
    rvg.setNeedsOffscreenAlphaCompositing(true)
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - recycling a child invalidates the parent`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    inner.addView(elevatedChild())
    mount(rvg, inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
    inner.recycleView()
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - counts an elevated descendant that is currently clipped out`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    // Elevated child positioned far below the viewport, so it is clipped out (detached, only in
    // allChildren). The logical scan must still count it.
    val elevated =
        View(context).apply {
          elevation = 10f
          left = 0
          right = 100
          top = 1000
          bottom = 1010
        }
    rvg.addViewWithSubviewClippingEnabled(elevated, 0)
    rvg.updateClippingRect()
    HasElevatedDescendantCache.invalidateAncestors(rvg)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidateAncestors refreshes an outer ReactViewGroup across a nested one`() {
    overrideAutoOffscreenFlag(true)
    val outer = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    mount(outer, inner)
    assertThat(outer.hasOverlappingRendering()).isFalse()

    // Add deep, then invalidate starting from the inner node: the walk must reach and refresh
    // outer.
    inner.addView(elevatedChild())
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(outer.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidateElevatedDescendantCache reports whether it changed state`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    rvg.addView(elevatedChild())
    // Prime the cache.
    assertThat(rvg.hasOverlappingRendering()).isTrue()

    // First invalidation clears a valid cache; the second finds it already stale.
    assertThat(rvg.invalidateElevatedDescendantCache()).isTrue()
    assertThat(rvg.invalidateElevatedDescendantCache()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - invalidateAncestors short-circuits at an already-stale node`() {
    overrideAutoOffscreenFlag(true)
    val outer = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    mount(outer, elevatedChild()) // direct elevated child, scanned first
    mount(outer, inner) // nested ReactViewGroup, scanned second

    // Querying outer returns true from its own elevated child and short-circuits before descending
    // inner, so inner's cache is left stale.
    assertThat(outer.hasOverlappingRendering()).isTrue()

    // Invalidating from inner finds inner already stale and stops there; outer's still-correct
    // cached result must be unaffected.
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(outer.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `focusable false - keeps an accessible view out of keyboard focus search`() {
    val root = ReactViewGroup(context)
    val leading = focusableView(top = 0)
    val excluded = accessibleView(top = 10, focusable = false)
    val trailing = focusableView(top = 20)
    root.addView(leading)
    root.addView(excluded)
    root.addView(trailing)

    assertThat(collectKeyboardFocusables(root)).containsExactly(leading, trailing)
    // Accessibility services still treat the view as one focusable element.
    assertThat(excluded.isFocusable).isTrue()
  }

  @Test
  fun `focusable false - keeps the descendants of an excluded view in keyboard focus search`() {
    val root = ReactViewGroup(context)
    val excluded = accessibleView(top = 0, focusable = false)
    val descendant = focusableView(top = 0)
    excluded.addView(descendant)
    root.addView(excluded)

    assertThat(collectKeyboardFocusables(root)).containsExactly(descendant)
  }

  @Test
  fun `focusable false - default focus passes over an excluded view`() {
    val root = ReactViewGroup(context)
    val excluded = accessibleView(top = 0, focusable = false)
    val trailing = focusableView(top = 10)
    root.addView(excluded)
    root.addView(trailing)

    assertThat(root.requestFocus(View.FOCUS_DOWN)).isTrue()

    assertThat(excluded.isFocused).isFalse()
    assertThat(trailing.isFocused).isTrue()
  }

  @Test
  fun `focusable false - focus requested from JS still reaches an excluded view`() {
    val root = ReactViewGroup(context)
    val excluded = accessibleView(top = 0, focusable = false)
    root.addView(excluded)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)

    excluded.requestFocusFromJS()

    assertThat(excluded.isFocused).isTrue()
  }

  @Test
  fun `focusable false - keyboard focus moves on from an excluded view that holds focus`() {
    val root = ReactViewGroup(context)
    val leading = focusableView(top = 0)
    val excluded = accessibleView(top = 10, focusable = false)
    val trailing = focusableView(top = 20)
    root.addView(leading)
    root.addView(excluded)
    root.addView(trailing)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
    excluded.requestFocusFromJS()

    assertThat(FocusFinder.getInstance().findNextFocus(root, excluded, View.FOCUS_FORWARD))
        .isSameAs(trailing)
    assertThat(FocusFinder.getInstance().findNextFocus(root, excluded, View.FOCUS_BACKWARD))
        .isSameAs(leading)
  }

  @Test
  fun `focusable true - returns a view to keyboard focus search`() {
    val root = ReactViewGroup(context)
    val view = accessibleView(top = 0, focusable = false)
    root.addView(view)

    ReactViewManager().setFocusable(view, true)

    assertThat(collectKeyboardFocusables(root)).containsExactly(view)
  }

  @Test
  fun `focusable false - recycling a view returns it to keyboard focus search`() {
    val root = ReactViewGroup(context)
    val view = accessibleView(top = 0, focusable = false)

    view.recycleView()
    root.addView(view)

    assertThat(collectKeyboardFocusables(root)).containsExactly(view)
  }

  private fun focusableView(top: Int): View =
      View(context).apply {
        isFocusable = true
        layout(0, top, 100, top + 10)
      }

  private fun accessibleView(top: Int, focusable: Boolean): ReactViewGroup =
      ReactViewGroup(context).apply {
        layout(0, top, 100, top + 10)
        val manager = ReactViewManager()
        manager.setAccessible(this, true)
        manager.setFocusable(this, focusable)
      }

  private fun collectKeyboardFocusables(root: ViewGroup): List<View> {
    val focusables = ArrayList<View>()
    root.addFocusables(focusables, View.FOCUS_FORWARD, View.FOCUSABLES_ALL)
    return focusables
  }

  // Mirrors the ViewManager mount/unmount hooks: attach/detach the child, then refresh the cache.
  private fun mount(parent: ReactViewGroup, child: View) {
    parent.addView(child)
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }

  private fun unmount(parent: ReactViewGroup, child: View) {
    parent.removeView(child)
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }

  private fun overrideAutoOffscreenFlag(enabled: Boolean) {
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableAndroidAutoOffscreenCompositingForElevation(): Boolean = enabled
        },
    )
  }

  private fun elevatedChild(): View = View(context).apply { elevation = 10f }
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

private class BlendModeReadCountingView(context: Context) : View(context) {
  var blendModeReads = 0

  override fun getTag(key: Int): Any? {
    if (key == R.id.mix_blend_mode) {
      blendModeReads++
    }
    return super.getTag(key)
  }
}

private class LayerRecordingCanvas : Canvas() {
  val layerBlendModes = mutableListOf<BlendMode?>()

  override fun saveLayer(left: Float, top: Float, right: Float, bottom: Float, paint: Paint?): Int {
    layerBlendModes.add(paint?.blendMode)
    return super.saveLayer(left, top, right, bottom, paint)
  }
}
